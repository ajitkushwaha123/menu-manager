import Document from "@/model/document";
import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import { extractMenuFromImage } from "@/services/gemini/menu-extractor";

export async function POST(req) {
    try {
        await dbConnect();

        const {
            resId,
            pageNumber,
            pdfUrl,
        } = await req.json();

        if (
            !resId ||
            !pageNumber ||
            !pdfUrl
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "resId, pageNumber and pdfUrl are required",
                },
                {
                    status: 400,
                }
            );
        }

        const extractedMenu =
            await extractMenuFromImage(
                pdfUrl
            );

        const result =
            await Document.updateOne(
                {
                    resId,
                    "pages.pageNumber":
                        pageNumber,
                },
                {
                    $set: {
                        "pages.$.parsedData":
                            extractedMenu,
                        "pages.$.processedAt":
                            new Date(),
                        "pages.$.status":
                            "completed",
                    },
                    $inc: {
                        processedPages: 1,
                    },
                }
            );

        if (
            result.matchedCount === 0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Page not found in document",
                },
                {
                    status: 404,
                }
            );
        }

        return NextResponse.json({
            success: true,
            pageNumber,
        });
    } catch (error) {
        console.error(
            "Menu parser error:",
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