import { NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";

export async function POST(req, { params }) {
    try {
        const { resId } = await params;

        if (!resId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Restaurant ID is required",
                },
                { status: 400 }
            );
        }

        const formData = await req.formData();
        const file = formData.get("file");

        if (!file) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Image file is required",
                },
                { status: 400 }
            );
        }

        const uploadForm = new FormData();
        uploadForm.append("res_id", resId);
        uploadForm.append("is_addon_item", "0");
        uploadForm.append("is_charge_item", "0");
        uploadForm.append("data_file", file);

        const result = await apiClient({
            endpoint: "/php/online_ordering/menu_edit",
            method: "POST",
            params: {
                action: "upload_image",
                service_role: "DELIVERY_TAKEAWAY",
                page_key: "menu",
            },
            data: uploadForm,
        });

        if (!result?.success) {
            return NextResponse.json(
                {
                    success: false,
                    upload_status: "rejected",
                    message: result?.message || "Upload failed",
                },
                { status: result?.status || 500 }
            );
        }

        const data = result?.data?.data || result?.data;
        console.log("data", data)


        const isRejected = data?.image_stock_info?.isStock === true;

        if (isRejected) {
            return NextResponse.json(
                {
                    success: false,
                    upload_status: "rejected",
                    message: "Image rejected by system, kindly reupload",
                    data,
                },
                { status: 200 }
            );
        }

        const imageUrl =
            data?.image_url ||
            data?.url ||
            null;

        return NextResponse.json(
            {
                success: true,
                upload_status: "approved",
                message: "Image uploaded successfully",
                imageUrl,
                data,
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("UPLOAD_ERROR:", err);

        return NextResponse.json(
            {
                success: false,
                upload_status: "rejected",
                message:
                    err?.response?.data?.message ||
                    err?.message ||
                    "Internal Server Error",
            },
            {
                status: err?.response?.status || 500,
            }
        );
    }
}