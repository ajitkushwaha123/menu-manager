import { NextResponse } from "next/server";
import { SwiggyClient } from "@/lib/api/swiggy-client";
import { validateRequiredFields } from "@/lib/payload/helper";
import { buildItemPayload } from "@/lib/payload/swiggy/add-items";

const REQUIRED_FIELDS = [
    "name",
    "price",
    "mainCategoryId",
    "mainCategoryName",
    "subCategoryId",
    "subCategoryName",
    "foodType",
    "description"
];

export async function POST(request, { params }) {
    try {
        const { resId } = await params;
        const body = await request.json();

        validateRequiredFields(body, REQUIRED_FIELDS);

        const payload = buildItemPayload(body);
        const response = await SwiggyClient({
            endpoint: `/api/cms/menu-revision/v1/item/${resId}`,
            method: "POST",
            data: payload,
        });

        return NextResponse.json({
            response,
            payload
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message: error.message,
            },
            {
                status: 400,
            }
        );
    }
}