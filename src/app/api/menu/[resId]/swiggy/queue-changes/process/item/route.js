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
                const errorMsg = data?.response?.data?.statusMessage || data?.response?.data?.data?.error?.rejectMessage || apiError?.message || "Item sync failed";
                console.error(`Item create failed. tempId: ${tempId}, Error: ${errorMsg}`);
                
                await MenuSync.updateOne(
                    { _id: syncId, "updated_menu.items.id": payload.id },
                    {
                        $set: {
                            "updated_menu.items.$.status": "failed",
                            "updated_menu.items.$.error": errorMsg
                        }
                    }
                );
            } else {
                await MenuSync.updateOne(
                    { _id: syncId, "updated_menu.items.id": payload.id },
                    {
                        $set: {
                            "updated_menu.items.$.id": swiggyItemId,
                            "updated_menu.items.$.status": "completed",
                            "updated_menu.items.$.error": null
                        }
                    }
                );
                console.log(`Updated item ${tempId} -> ${swiggyItemId}`);
            }
        }

        if (action === "update") {
            if (apiError || data?.response?.data?.statusCode === -1 || data?.response?.data?.statusMessage === "FAILURE") {
                const errorMsg = data?.response?.data?.statusMessage || data?.response?.data?.data?.error?.rejectMessage || apiError?.message || "Item update failed";
                await MenuSync.updateOne(
                    { _id: syncId, "updated_menu.items.id": payload.id },
                    {
                        $set: {
                            "updated_menu.items.$.status": "failed",
                            "updated_menu.items.$.error": errorMsg
                        }
                    }
                );
            } else {
                await MenuSync.updateOne(
                    { _id: syncId, "updated_menu.items.id": payload.id },
                    {
                        $set: {
                            "updated_menu.items.$.status": "completed",
                            "updated_menu.items.$.error": null
                        }
                    }
                );
            }
        }

        if (action === "delete") {
            if (apiError) {
                if (payload.item_ids) {
                    await MenuSync.updateMany(
                        { _id: syncId },
                        {
                            $set: {
                                "updated_menu.items.$[elem].status": "failed",
                                "updated_menu.items.$[elem].error": apiError.message || "Delete failed"
                            }
                        },
                        {
                            arrayFilters: [{ "elem.id": { $in: payload.item_ids } }]
                        }
                    );
                } else if (payload.id) {
                    await MenuSync.updateOne(
                        { _id: syncId, "updated_menu.items.id": payload.id },
                        {
                            $set: {
                                "updated_menu.items.$.status": "failed",
                                "updated_menu.items.$.error": apiError.message || "Delete failed"
                            }
                        }
                    );
                }
            } else {
                if (payload.item_ids) {
                    await MenuSync.updateMany(
                        { _id: syncId },
                        {
                            $set: {
                                "updated_menu.items.$[elem].status": "completed"
                            }
                        },
                        {
                            arrayFilters: [{ "elem.id": { $in: payload.item_ids } }]
                        }
                    );
                } else if (payload.id) {
                    await MenuSync.updateOne(
                        { _id: syncId, "updated_menu.items.id": payload.id },
                        {
                            $set: {
                                "updated_menu.items.$.status": "completed"
                            }
                        }
                    );
                }
            }
        }

        const freshSync = await MenuSync.findById(syncId);
        const freshItems = freshSync?.updated_menu?.items || [];
        const pendingItems = freshItems.filter((itm) => itm.status !== "completed" && itm.status !== "failed");

        if (pendingItems.length === 0) {
            console.log(`All items completed for sync ${syncId}`);

            // At this point, the entire MenuSync is actually completed!
            await MenuSync.updateOne(
                { _id: syncId },
                { $set: { status: "completed" } }
            );
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
