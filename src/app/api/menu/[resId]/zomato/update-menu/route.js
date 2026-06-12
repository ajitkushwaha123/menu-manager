import { NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";
import { buildZomatoMenuPayload } from "@/lib/payload/zomato/menu";

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

        const body = await req.json();
        const { updated_catalogue, new_catalogue, updated_category } = body
        console.log("logssssss", updated_catalogue)
        console.log("new_catalogue", new_catalogue)


        const menuInfo = await apiClient({
            endpoint: "/php/online_ordering/menu_edit",
            method: "GET",
            params: {
                action: "get_menu_info",
                service_role: "DELIVERY_TAKEAWAY",
                res_id: resId,
            },
        });

        if (!menuInfo?.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: menuInfo?.message || "Failed to fetch menu info",
                },
                { status: menuInfo?.status || 500 }
            );
        }

        const menuVersion = menuInfo?.data?.data?.menuVersion;

        if (!menuVersion) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Menu version not found",
                },
                { status: 400 }
            );
        }

        const result = await apiClient({
            endpoint: "/php/online_ordering/menu_edit",
            method: "GET",
            params: {
                action: "get_content_menu",
                res_id: resId,
                service_role: "DELIVERY_TAKEAWAY",
            },
        });

        if (!result?.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: result?.message || "Failed to fetch menu",
                },
                { status: result?.status || 500 }
            );
        }

        const menu =
            result?.data?.data?.menuResponse ??
            result?.data?.menuResponse ??
            null;

        const payload = buildZomatoMenuPayload({
            resId,
            menuVersion,
            menuEntityTaxes: menu.menuEntityTaxes || [],
            menuEntityCharges: menu.menuEntityCharges || [],
            categoryWrappers: menu.categoryWrappers || [],
            catalogueWrappers: menu.catalogueWrappers || [],
            modifierGroupWrappers: menu.modifierGroupWrappers || [],
            resDisclaimers: menu.resDisclaimers || [],
            requestedModerationData: menu.requestedModerationData || {
                variantPrices: [],
            },
            contentCombos: menu.contentCombos || [],
            disclaimers: menu.disclaimers || [],
            onHoldItems: menu.onHoldItems || {
                catalogues: {},
            },
            lastOpenedCatalogue: menu.lastOpenedCatalogue || {
                category: {},
                subCategory: {},
                catalogue: {},
            },
            requestMetadata: menu.requestMetadata || {},
            updated_catalogue,
            new_catalogue,
            updated_category
        });

        console.log("payload", payload)
        const updatedMenu = await apiClient({
            endpoint: "/php/online_ordering/menu_edit",
            method: "POST",
            params: {
                action: "update_content_menu",
                service_role: "DELIVERY_TAKEAWAY",
                resId: resId
            },
            data: {
                ...payload,
            },
        });

        if (!updatedMenu?.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: updatedMenu?.message || "Menu update failed",
                },
                { status: result?.status || 500 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Menu updated successfully",
                data: payload,
                result: result?.data
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("MENU_UPDATE_ERROR:", err);

        return NextResponse.json(
            {
                success: false,
                message:
                    err?.response?.data?.message ||
                    err?.message ||
                    "Internal Server Error",
            },
            { status: err?.response?.status || 500 }
        );
    }
}