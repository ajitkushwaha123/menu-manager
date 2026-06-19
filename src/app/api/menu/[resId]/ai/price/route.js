import Menu from "@/model/menu";
import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";

const ROUND_TO = 1;

export async function POST(req, { params }) {
    try {
        await dbConnect();

        const { resId } = await params;
        const { value } = await req.json();

        if (!resId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "resId is required",
                },
                { status: 400 }
            );
        }

        if (
            value === undefined ||
            value === null ||
            String(value).trim() === ""
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "value is required",
                },
                { status: 400 }
            );
        }

        const menu = await Menu.findOne({ resId });

        if (!menu) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Menu not found",
                },
                { status: 404 }
            );
        }

        const adjustment = String(value).trim();

        const isPercentage =
            adjustment.endsWith("%");

        const numericValue = Number(
            adjustment.replace("%", "")
        );

        if (isNaN(numericValue)) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid value. Examples: 10%, -10%, 20, -20",
                },
                { status: 400 }
            );
        }

        let updatedCount = 0;
        menu.menu?.forEach((category) => {
            category.sub_category?.forEach(
                (subCategory) => {
                    subCategory.items?.forEach(
                        (item) => {
                            const currentPrice =
                                Number(item?.price);

                            if (
                                isNaN(currentPrice)
                            ) {
                                return;
                            }

                            let newPrice;

                            if (
                                isPercentage
                            ) {
                                newPrice =
                                    currentPrice +
                                    (currentPrice *
                                        numericValue) /
                                    100;
                            } else {
                                newPrice =
                                    currentPrice +
                                    numericValue;
                            }

                            newPrice = Math.max(
                                0,
                                newPrice
                            );

                            item.price =
                                Math.round(
                                    newPrice /
                                    ROUND_TO
                                ) * ROUND_TO;

                            updatedCount++;
                        }
                    );
                }
            );
        });

        menu.markModified("menu");
        await menu.save();

        return NextResponse.json({
            success: true,
            mode: isPercentage
                ? "percentage"
                : "absolute",
            value: adjustment,
            rounded_to: ROUND_TO,
            updated_items: updatedCount,
        });
    } catch (error) {
        console.error(
            "Bulk price update error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    error?.message ||
                    "Something went wrong",
            },
            {
                status: 500,
            }
        );
    }
}