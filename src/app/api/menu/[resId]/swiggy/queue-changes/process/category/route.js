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
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/menu/${resId}/swiggy/category`;

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
            console.error(`Swiggy API Error in category sync for action ${action}:`, err.message);
        }

        const categories =
            sync.updated_menu?.categories || [];

        const category = categories.find(
            (cat) =>
                cat.id === payload.id
        );

        if (!category) {
            console.warn(
                `Category not found in sync for payload`,
                payload
            );
        }

        if (action === "create") {
            const swiggyCategoryId =
                data?.data?.id ||
                data?.response?.data?.data?.id;

            const tempId = payload?.id;
            console.log(tempId, swiggyCategoryId)

            if (!swiggyCategoryId || !tempId || apiError) {
                console.error(`Category create failed. tempId: ${tempId}, Error: ${apiError?.message || 'Missing ID'}`);
                if (category) {
                    category.status = "failed";
                    category.error = data?.response?.data?.statusMessage || data?.response?.data?.data?.error?.rejectMessage || apiError?.message || "Category sync failed";
                }
            } else {
                if (category) {
                    category.id = swiggyCategoryId;
                    category.status = "completed";
                    category.error = null;
                }

                const subCategories = sync.updated_menu?.sub_categories || [];

                for (const subCategory of subCategories) {
                    if (subCategory.categoryId === tempId) {
                        subCategory.categoryId = swiggyCategoryId;
                    }
                }

                const items = sync.updated_menu?.items || [];
                for (const item of items) {
                    if (item.categoryId === tempId) {
                        item.categoryId = swiggyCategoryId;
                    }
                }

                console.log(`Updated category ${tempId} -> ${swiggyCategoryId}`);
            }
        }

        if (action === "update") {
            if (category) {
                if (apiError || data?.response?.data?.statusCode === -1 || data?.response?.data?.statusMessage === "FAILURE") {
                    category.status = "failed";
                    category.error = data?.response?.data?.statusMessage || data?.response?.data?.data?.error?.rejectMessage || apiError?.message || "Category update failed";
                } else {
                    category.status = "completed";
                    category.error = null;
                }
            }
        }

        if (action === "delete") {
            if (apiError) {
                if (payload.category_ids) {
                    payload.category_ids.forEach(id => {
                        const cat = categories.find(c => c.id === id);
                        if (cat) {
                            cat.status = "failed";
                            cat.error = apiError.message || "Delete failed";
                        }
                    });
                } else if (category) {
                    category.status = "failed";
                    category.error = apiError.message || "Delete failed";
                }
            } else {
                if (payload.category_ids) {
                    payload.category_ids.forEach(id => {
                        const cat = categories.find(c => c.id === id);
                        if (cat) cat.status = "completed";
                    });
                } else if (category) {
                    category.status = "completed";
                }
            }
        }

        sync.markModified("updated_menu");
        await sync.save();

        const pendingCategories = categories.filter((cat) => cat.status !== "completed" && cat.status !== "failed");

        if (pendingCategories.length === 0) {
            console.log(
                `All categories completed for sync ${syncId}`
            );

            await swiggyProcessorJob({
                resId,
                syncId,
                type: "sub_category_sync",
            });
        }

        return NextResponse.json(
            {
                success: true,
                syncId,
                action,
                pendingCategories:
                    pendingCategories.length,
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
                    error?.response?.data?.message ||
                    error?.message ||
                    "Something went wrong",
            },
            { status: 500 }
        );
    }
}