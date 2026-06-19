import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import MenuSync from "@/model/menu-sync";
import { NextResponse } from "next/server";

export async function POST(req, { params }) {
    try {
        await dbConnect();
        const { resId } = await params;
        const body = await req.json();

        const { syncId, action, payload } = body;

        const sync = await MenuSync.findById(syncId);

        if (!sync) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Sync not found",
                },
                { status: 404 }
            );
        }

        let method = "post";
        let api = `${process.env.NEXT_PUBLIC_BASE_URL}/api/menu/${resId}/swiggy/items`;

        switch (action) {
            case "create":
                api = `${process.env.NEXT_PUBLIC_BASE_URL}/api/menu/${resId}/swiggy/items/add`;
                method = "post";
                break;

            case "update":
                api = `${process.env.NEXT_PUBLIC_BASE_URL}/api/menu/${resId}/swiggy/items/update`;
                method = "post";
                break;

            case "delete":
                api = `${process.env.NEXT_PUBLIC_BASE_URL}/api/menu/${resId}/swiggy/items/delete`;
                method = "post";
                break;

            default:
                return NextResponse.json(
                    {
                        success: false,
                        message: `Invalid action '${action}'`,
                    },
                    { status: 400 }
                );
        }

        let requestPayload = { ...payload };

        if (action === "create" || action === "update") {
            if (requestPayload.image_url && requestPayload.image_url.startsWith("http")) {
                console.log(`[${syncId}] 🖼️ Processing image for item ${requestPayload.id}`);
                const formData = new FormData();
                formData.append("imageUrl", requestPayload.image_url);
                formData.append("itemName", requestPayload.name || "Menu Item");

                try {
                    const uploadRes = await fetch(
                        `${process.env.NEXT_PUBLIC_BASE_URL}/api/menu/${resId}/swiggy/items/image`,
                        {
                            method: "POST",
                            body: formData,
                        }
                    );

                    const uploadData = await uploadRes.json();

                    if (uploadData.success && uploadData.stableDiffusion?.data?.image_id) {
                        requestPayload.image_url = uploadData.file_url;
                        requestPayload.image_id = uploadData.stableDiffusion.data.image_id;
                        console.log(`[${syncId}] ✅ Image uploaded successfully`);
                    } else {
                        requestPayload.image_url = "";
                        requestPayload.image_id = "";
                        console.warn(`[${syncId}] ⚠️ Failed to upload image:`, uploadData);
                    }
                } catch (err) {
                    requestPayload.image_url = "";
                    requestPayload.image_id = "";
                    console.error(`[${syncId}] ❌ Image upload error:`, err.message);
                }
            }
        }

        let data = null;
        let apiError = null;

        try {
            const response = await axios({
                method,
                url: api,
                data: requestPayload,
                timeout: 30000,
            });
            data = response.data;
        } catch (err) {
            apiError = err;
            data = err.response?.data || null;
            console.error(`Swiggy API Error in item sync for action ${action}:`, err.message);
        }

        console.log("data", data)
        console.log("data item", data?.updatePayload?.item_vo?.item);
        console.log("data variants", data?.updatePayload?.item_vo?.variant_groups_vo);
        console.log("data variants var", data?.updatePayload?.item_vo?.variant_groups_vo[0]?.variants_vo);


        const items = sync.updated_menu?.items || [];

        const itemEntry = items.find((itm) => itm.id === payload.id);

        if (!itemEntry) {
            console.warn("Item not found in sync for payload", payload);
        }

        if (action === "create") {
            let swiggyItemId = data?.data?.id || data?.response?.data?.data?.id || data?.response?.data?.id;
            if (!swiggyItemId && typeof data?.response?.data === 'string') swiggyItemId = data.response.data;
            if (!swiggyItemId && typeof data?.data === 'string') swiggyItemId = data.data;
            if (!swiggyItemId && data?.response?.id) swiggyItemId = data.response.id;

            const tempId = payload?.id;

            console.log(swiggyItemId, tempId);

            if (!swiggyItemId || !tempId || apiError) {
                console.error(`Item create failed. tempId: ${tempId}, Error: ${apiError?.message || 'Missing ID'}`);
                if (itemEntry) {
                    itemEntry.status = "failed";
                    itemEntry.error = data?.response?.data?.statusMessage || data?.response?.data?.data?.error?.rejectMessage || apiError?.message || "Item sync failed";
                }
            } else if (itemEntry) {
                itemEntry.id = swiggyItemId;
                itemEntry.status = "completed";
                itemEntry.error = null;
                console.log(`Updated item ${tempId} -> ${swiggyItemId}`);
            }
        }

        if (action === "update") {
            if (itemEntry) {
                if (apiError || data?.response?.data?.statusCode === -1 || data?.response?.data?.statusMessage === "FAILURE") {
                    itemEntry.status = "failed";
                    itemEntry.error = data?.response?.data?.statusMessage || data?.response?.data?.data?.error?.rejectMessage || apiError?.message || "Item update failed";
                } else {
                    itemEntry.status = "completed";
                    itemEntry.error = null;
                }
            }
        }

        if (action === "delete") {
            if (apiError) {
                if (payload.item_ids) {
                    payload.item_ids.forEach(id => {
                        const itm = items.find(i => i.id === id);
                        if (itm) {
                            itm.status = "failed";
                            itm.error = apiError.message || "Delete failed";
                        }
                    });
                } else if (itemEntry) {
                    itemEntry.status = "failed";
                    itemEntry.error = apiError.message || "Delete failed";
                }
            } else {
                if (payload.item_ids) {
                    payload.item_ids.forEach(id => {
                        const itm = items.find(i => i.id === id);
                        if (itm) itm.status = "completed";
                    });
                } else if (itemEntry) {
                    itemEntry.status = "completed";
                }
            }
        }

        sync.markModified("updated_menu");
        await sync.save();

        const pendingItems = items.filter((itm) => itm.status !== "completed" && itm.status !== "failed");

        if (pendingItems.length === 0) {
            console.log(`All items completed for sync ${syncId}`);

            // At this point, the entire MenuSync is actually completed!
            sync.status = "completed";
            await sync.save();
        }

        return NextResponse.json(
            {
                success: true,
                syncId,
                action,
                pendingItems: pendingItems.length,
                data,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: error?.response?.data?.message || error?.message || "Something went wrong",
            },
            { status: 500 }
        );
    }
}
