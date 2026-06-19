import Menu from "@/model/menu";
import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import { generateMenuDescriptions } from "@/services/gemini/generate-description";

const BATCH_SIZE = 20;
const CONCURRENCY = 3;

function chunk(array, size) {
    const chunks = [];

    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }

    return chunks;
}

export async function POST(req, { params }) {
    try {
        await dbConnect();
        const { resId } = await params;

        if (!resId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "resId is required",
                },
                {
                    status: 400,
                }
            );
        }

        const menu = await Menu.findOne({ resId });

        if (!menu) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Menu not found",
                },
                {
                    status: 404,
                }
            );
        }

        const itemsToProcess = [];

        menu.menu?.forEach((category) => {
            category.sub_category?.forEach((subCategory) => {
                subCategory.items?.forEach((item) => {
                    if (
                        item?.id != null &&
                        typeof item?.name === "string" &&
                        item.name.trim()
                    ) {
                        itemsToProcess.push({
                            item_id: String(item.id),
                            name: item.name.trim(),
                        });
                    }
                });
            });
        });

        if (itemsToProcess.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "No items found to process",
                },
                {
                    status: 400,
                }
            );
        }

        const batches = chunk(
            itemsToProcess,
            BATCH_SIZE
        );

        const results = [];

        for (let i = 0; i < batches.length; i += CONCURRENCY) {
            const currentBatches = batches.slice(
                i,
                i + CONCURRENCY
            );

            const responses = await Promise.all(
                currentBatches.map((batch) =>
                    generateMenuDescriptions(batch)
                )
            );

            results.push(...responses.flat());
        }

        const descriptionMap = new Map(
            results
                .filter(
                    (item) =>
                        item?.item_id &&
                        item?.description
                )
                .map((item) => [
                    String(item.item_id),
                    item.description,
                ])
        );

        let updatedCount = 0;

        menu.menu?.forEach((category) => {
            category.sub_category?.forEach((subCategory) => {
                subCategory.items?.forEach((item) => {
                    const description =
                        descriptionMap.get(
                            String(item.id)
                        );

                    if (description) {
                        item.description = description;
                        updatedCount++;
                    }
                });
            });
        });

        menu.markModified("menu");
        await menu.save();

        return NextResponse.json({
            success: true,
            total_items: itemsToProcess.length,
            total_generated: results.length,
            updated_items: updatedCount,
            total_batches: batches.length,
        });
    } catch (error) {
        console.error(
            "Description generation route error:",
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