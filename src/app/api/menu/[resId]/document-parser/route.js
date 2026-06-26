import path from "path";
import document from "@/model/document";
import Menu from "@/model/menu";
import dbConnect from "@/lib/dbConnect";
import { uploadToS3 } from "@/services/s3";
import { NextResponse } from "next/server";
import { menuParserJob } from "@/lib/bullmq/job/menu-parser";
import { splitPdf } from "@/lib/payload/document-parser/helper";

export async function POST(request, { params }) {
    try {
        await dbConnect();

        const { resId } = await params;
        console.log("resIdddd", resId)

        const formData = await request.formData();
        const file = formData.get("file");
        const name = formData.get("name") || "";
        console.log("file", file)
        if (!file) {
            return NextResponse.json(
                {
                    success: false,
                    message: "File is required",
                },
                { status: 400 }
            );
        }

        const extension = path
            .extname(file.name)
            .toLowerCase();

        if (extension !== ".pdf") {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Only PDF files are allowed",
                },
                { status: 400 }
            );
        }

        const pdfBuffer = Buffer.from(
            await file.arrayBuffer()
        );

        const pdfUpload = await uploadToS3({
            file: pdfBuffer,
            folder: "documents/originals",
            fileName: file.name,
        });

        console.log("pdfUpload", pdfUpload)
        const pages = await splitPdf(pdfBuffer);

        const uploadedPages = [];
        const pageDocuments = [];

        for (const page of pages) {
            const pageUpload = await uploadToS3({
                file: page.buffer,
                folder: "documents/pages",
                fileName: `page-${Date.now()}-${file.name.replace(
                    /\s+/g,
                    "-"
                )}-${page.pageNumber}.pdf`,
            });

            const pageData = {
                pageNumber: page.pageNumber,
                pdfUrl: pageUpload.url,
                key: pageUpload.key,
            };

            uploadedPages.push(pageData);

            pageDocuments.push({
                pageNumber: page.pageNumber,
                pdfUrl: pageUpload.url,
            });

            await menuParserJob({
                resId,
                pageNumber: page.pageNumber,
                pdfUrl: pageUpload.url,
                percentage: Math.round(
                    (page.pageNumber / pages.length) * 100
                ),
            });
        }

        await document.updateOne(
            {
                resId,
            },
            {
                $setOnInsert: {
                    resId,
                    originalPdf: pdfUpload.url,
                    createdAt: new Date(),
                },
                $set: {
                    totalPages: pages.length,
                },
                $push: {
                    pages: {
                        $each: pageDocuments,
                    },
                },
            },
            {
                upsert: true,
            }
        );

        await Menu.updateOne(
            { resId, platform: 'auto' },
            { 
                $setOnInsert: { 
                    resId, 
                    name, 
                    platform: 'auto' 
                } 
            },
            { upsert: true }
        );

        return NextResponse.json({
            success: true,
            originalPdf: pdfUpload.url,
            totalPages: uploadedPages.length,
            pages: uploadedPages,
        });
    } catch (error) {
        console.error(
            "Document upload error:",
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