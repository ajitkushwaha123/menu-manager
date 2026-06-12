import { NextResponse } from "next/server";
import { SwiggyClient } from "@/lib/api/swiggy-client";
import { validateRequiredFields } from "@/lib/payload/helper";
import { buildItemUpdatePayload } from "@/lib/payload/swiggy/add-items";

const REQUIRED_FIELDS = [
    "item_id"
];

export async function POST(request, { params }) {
    try {
        const { resId } = await params;
        const body = await request.json();

        validateRequiredFields(body, REQUIRED_FIELDS);
        const menuResp = await SwiggyClient({
            endpoint: `/api/cms/menu-revision/v1/restaurant-menu-wrapper/${resId}`,
            method: "GET",
            params: {
                disabled: true,
                item_slots: true,
                tickets: true,
            },
        });

        const items = menuResp?.data?.data?.menu?.items_vo || []
        const item = items.find((item) => item?.item?.uniqueId === body.item_id)

        const updatePayload = buildItemUpdatePayload(item, body.updated_items || {});

        const updateResp = await SwiggyClient({
            endpoint: `/api/cms/menu-revision/v1/item/${resId}`,
            method: "POST",
            data: updatePayload,
        });

        return NextResponse.json({
            updatePayload,
            updateResp
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