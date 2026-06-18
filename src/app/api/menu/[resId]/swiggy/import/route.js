import Menu from "@/model/menu";
import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import { SwiggyClient } from "@/lib/api/swiggy-client";

export async function GET(req, { params }) {
    try {
        await dbConnect()
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

        const response = await SwiggyClient({
            endpoint: `/api/cms/menu-revision/v1/restaurant-menu-wrapper/${resId}`,
            method: "GET",
            params: {
                disabled: true,
                item_slots: true,
                tickets: true,
            },
        });

        const menu = response?.data?.data?.menu;
        const items = menu?.items_vo || [];

        if (!menu) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Menu not found",
                },
                { status: 404 }
            );
        }

        const categoriesOrder = menu?.categories_order || [];
        const itemsMap = Object.fromEntries(
            items.map((itemData) => [
                itemData.item.id,
                {
                    id: itemData.item.id,
                    temp_id: "",
                    name: itemData.item.name,
                    description: itemData.item.description,
                    price: itemData.item.price,
                    is_veg: itemData.item.is_veg,
                    packing_charges: itemData.item.packing_charges,
                    image_url: itemData.item.image_url || "",
                    image_id: itemData.item.image_id || "",

                    variants: (itemData.variant_groups_vo || []).map((group) => ({
                        property_name: group.variant_group?.name || "",
                        property_id: group.variant_group?.id || "",

                        options: (group.variants_vo || []).map((variantVo) => ({
                            option_name: variantVo.variant?.name || "",
                            option_id: variantVo.variant?.id || "",
                            price: variantVo.variant?.price || 0,
                            is_veg: variantVo.variant?.is_veg || "",
                        })),
                    })),
                },
            ])
        );

        const formattedCategories = categoriesOrder.map((category) => ({
            id: category?.id,
            name: category?.name,
            temp_id: category?.temp_id,
            sub_category: (category?.sub_categories_order || []).map(
                (subCategory) => ({
                    id: subCategory?.id,
                    temp_id: subCategory?.temp_id,
                    name: subCategory?.name,
                    items: (subCategory?.items_order || []).map(
                        (itemRef) => itemsMap[itemRef?.id] || null
                    ).filter(Boolean),
                })
            ),
        }));

        const savedMenu = await Menu.findOneAndUpdate(
            { resId },
            { menu: formattedCategories, platform: "swiggy" },
            { upsert: true, new: true }
        );

        return NextResponse.json({
            success: true,
            data: savedMenu?.menu,
        });
    } catch (error) {
        console.error("Menu Fetch Error:", error);

        return NextResponse.json(
            {
                success: false,
                message:
                    error?.message || "Failed to fetch menu",
            },
            { status: 500 }
        );
    }
}