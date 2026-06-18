import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import MenuSync from "@/model/menu-sync";
import { NextResponse } from "next/server";
import { swiggyProcessorJob } from "@/lib/bullmq/job/swiggy-processor";

export async function POST(req, { params }) {
    try {
        await dbConnect();
        const { resId } = await params;
        const body = await req.json();

        const {
            syncId,
            action,
            payload,
        } = body;

        const sync = await MenuSync.findById(syncId);

        console.log(syncId, action, payload)

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

        const api =
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/menu/${resId}/swiggy/sub-category`;

        switch (action) {
            case "create":
                method = "post";
                break;

            case "update":
                method = "put";
                break;

            case "delete":
                method = "delete";
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

        let data = null;
        let apiError = null;

        try {
            const response = await axios({
                method,
                url: api,
                data: payload,
                timeout: 30000,
            });
            data = response.data;
        } catch (err) {
            apiError = err;
            data = err.response?.data || null;
            console.error(`Swiggy API Error in sub-category sync for action ${action}:`, err.message);
        }

        // Re-fetch sync to avoid race conditions with concurrent worker jobs
        const freshSync = await MenuSync.findById(syncId);
        if (!freshSync) throw new Error("Sync not found during save");

        const freshSubCategories = freshSync.updated_menu?.sub_categories || [];
        const freshSubCategory = freshSubCategories.find((sub) => sub.id === payload.id);

        if (action === "create") {
            const swiggySubCategoryId = data?.data?.id || data?.response?.data?.data?.id;
            const tempId = payload?.id;

            if (!swiggySubCategoryId || !tempId || apiError) {
                if (freshSubCategory) {
                    freshSubCategory.status = "failed";
                    freshSubCategory.error = data?.response?.data?.statusMessage || data?.response?.data?.data?.error?.rejectMessage || apiError?.message || "SubCategory sync failed";
                }
            } else {
                if (freshSubCategory) {
                    freshSubCategory.id = swiggySubCategoryId;
                    freshSubCategory.status = "completed";
                    freshSubCategory.error = null;
                }

                const items = freshSync.updated_menu?.items || [];
                for (const item of items) {
                    if (item.subCategoryId === tempId) {
                        item.subCategoryId = swiggySubCategoryId;
                    }
                }
            }
        }

        if (action === "update") {
            if (freshSubCategory) {
                if (apiError || data?.response?.data?.statusCode === -1 || data?.response?.data?.statusMessage === "FAILURE") {
                    freshSubCategory.status = "failed";
                    freshSubCategory.error = data?.response?.data?.statusMessage || data?.response?.data?.data?.error?.rejectMessage || apiError?.message || "SubCategory update failed";
                } else {
                    freshSubCategory.status = "completed";
                    freshSubCategory.error = null;
                }
            }
        }

        if (action === "delete") {
            if (apiError) {
                if (payload.sub_category_ids) {
                    payload.sub_category_ids.forEach(id => {
                        const sub = freshSubCategories.find(s => s.id === id);
                        if (sub) {
                            sub.status = "failed";
                            sub.error = apiError.message || "Delete failed";
                        }
                    });
                } else if (freshSubCategory) {
                    freshSubCategory.status = "failed";
                    freshSubCategory.error = apiError.message || "Delete failed";
                }
            } else {
                if (payload.sub_category_ids) {
                    payload.sub_category_ids.forEach(id => {
                        const sub = freshSubCategories.find(s => s.id === id);
                        if (sub) sub.status = "completed";
                    });
                } else if (freshSubCategory) {
                    freshSubCategory.status = "completed";
                }
            }
        }

        freshSync.markModified("updated_menu");
        await freshSync.save();

        const pendingSubCategories = freshSubCategories.filter((sub) => sub.status !== "completed" && sub.status !== "failed");

        if (
            pendingSubCategories.length === 0
        ) {
            console.log(
                `All subcategories completed for sync ${syncId}`
            );

            await swiggyProcessorJob({
                resId,
                syncId,
                type: "item_sync",
            });
        }

        return NextResponse.json(
            {
                success: true,
                syncId,
                action,
                pendingSubCategories:
                    pendingSubCategories.length,
                data,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message:
                    error?.response?.data
                        ?.message ||
                    error?.message ||
                    "Something went wrong",
            },
            { status: 500 }
        );
    }
}