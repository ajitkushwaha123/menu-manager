import Document from "@/model/document";
import Menu from "@/model/menu";
import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import { extractMenuFromImage } from "@/services/gemini/menu-extractor";

export async function POST(req) {
    try {
        await dbConnect();

        const { resId, pageNumber, pdfUrl } = await req.json();

        if (!resId || !pageNumber || !pdfUrl) {
            return NextResponse.json(
                { success: false, message: "resId, pageNumber and pdfUrl are required" },
                { status: 400 }
            );
        }

        // 1. Fetch the remote file into an ArrayBuffer
        const fileResponse = await fetch(pdfUrl);
        if (!fileResponse.ok) {
            throw new Error(`Failed to download document asset from URL: ${pdfUrl}`);
        }
        const arrayBuffer = await fileResponse.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);

        // 2. Extrapolate or pass the content type
        const contentType = fileResponse.headers.get("content-type") || "image/jpeg";

        // 3. Pass the raw buffer data down to Bedrock
        const extractedMenu = await extractMenuFromImage(imageBuffer, contentType);

        const result = await Document.updateOne(
            { resId, "pages.pageNumber": pageNumber },
            {
                $set: {
                    "pages.$.parsedData": extractedMenu,
                    "pages.$.processedAt": new Date(),
                    "pages.$.status": "completed",
                },
                $inc: { processedPages: 1 },
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, message: "Page not found in document" },
                { status: 404 }
            );
        }

        const updatedDocument = await Document.findOne({ resId });
        if (updatedDocument && updatedDocument.processedPages >= updatedDocument.totalPages) {
            const mergedCategories = [];

            updatedDocument.pages.forEach(page => {
                if (page.parsedData && Array.isArray(page.parsedData.categories)) {
                    mergedCategories.push(...page.parsedData.categories);
                }
            });

            await Menu.updateOne(
                { resId, platform: 'auto' },
                { $set: { menu: { categories: mergedCategories } } }
            );
        }

        return NextResponse.json({ success: true, pageNumber });
    } catch (error) {
        console.error("Menu parser error:", error);
        return NextResponse.json(
            { success: false, message: error?.message || "Something went wrong" },
            { status: 500 }
        );
    }
}