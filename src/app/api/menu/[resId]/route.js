import dbConnect from "@/lib/dbConnect";
import Menu from "@/model/menu";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
    try {
        await dbConnect();
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

        const platform = request.nextUrl.searchParams.get("platform") || "swiggy";
        const menuData = await Menu.findOne({ resId, platform });
        if (!menuData) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Menu not found",
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                menu: menuData?.menu,
                name: menuData?.name,
                resId: menuData?.resId,
                platform: menuData?.platform
            },
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

export async function POST(req, { params }) {
    try {
        await dbConnect()
        const { resId } = await params;
        const body = await req.json();
        const platform = req.nextUrl.searchParams.get("platform") || "swiggy";

        const { menu } = body;

        if (!resId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Restaurant ID is required",
                },
                { status: 400 }
            );
        }

        if (!menu) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Menu is required",
                },
                { status: 400 }
            );
        }

        const existingMenu = await Menu.findOne({
            resId,
            platform,
        });

        if (!existingMenu) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Menu not found",
                },
                { status: 404 }
            );
        }

        existingMenu.menu = menu;
        await existingMenu.save();
        return NextResponse.json({
            success: true,
            message: "Menu updated successfully",
            data: existingMenu.menu,
        });
    } catch (error) {
        console.error("Menu Update Error:", error);

        return NextResponse.json(
            {
                success: false,
                message:
                    error?.message || "Failed to update menu",
            },
            { status: 500 }
        );
    }
}