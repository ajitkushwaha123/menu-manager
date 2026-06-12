// app/api/swiggy/menu/[restaurantId]/route.js

import { NextResponse } from "next/server";
import { SwiggyClient } from "@/lib/api/swiggy-client";

export async function GET(request, { params }) {
    try {
        const { resId } = await params;
        console.log("resId", resId)

        const response = await SwiggyClient({
            endpoint: `/api/cms/menu-revision/v1/restaurant-menu-wrapper/${resId}`,
            method: "GET",
            params: {
                disabled: true,
                item_slots: true,
                tickets: true,
            },
        });

        return NextResponse.json(response, {
            status: response.status || 200,
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message: error.message,
            },
            {
                status: 500,
            }
        );
    }
}