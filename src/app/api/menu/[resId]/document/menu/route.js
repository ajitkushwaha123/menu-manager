import dbConnect from "@/lib/dbConnect";
import Document from "@/model/document";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
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

        const doc = await Document.findOne({ resId });

        if (!doc) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Document not found",
                },
                { status: 404 }
            );
        }

        const pages = doc.pages || [];

        if (pages.length == 0 || !pages) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Pages not found",
                },
                { status: 404 }
            );
        }

        const menu = pages.flatMap(
            (page) => page?.parsedData?.categories || []
        );

        console.log("menu", menu)
        return NextResponse.json(
            {
                success: true,
                message: "Menu fetched successfully",
                data: menu,
            },
            { status: 200 }
        );
    } catch (err) {
        return NextResponse.json(
            {
                success: false,
                message: err?.message || "Internal Server Error",
            },
            { status: 500 }
        );
    }
}

export async function POST(req, { params }) {
    try {
        await dbConnect();

        const { resId } = await params;
        const menuPayload = await req.json();

        if (!resId) {
            return NextResponse.json(
                { success: false, message: "Restaurant ID is required" },
                { status: 400 }
            );
        }

        const doc = await Document.findOne({ resId });

        if (!doc) {
            return NextResponse.json(
                { success: false, message: "Document not found" },
                { status: 404 }
            );
        }

        const pages = doc.pages || [];

        if (pages.length === 0) {
            return NextResponse.json(
                { success: false, message: "Pages not found" },
                { status: 404 }
            );
        }

        // We consolidate the entire updated menu array into the first page's parsedData.
        // And we clear the categories array from any subsequent pages to avoid duplication.
        
        // Page 0 gets the full updated menu
        if (!doc.pages[0].parsedData) {
            doc.pages[0].parsedData = {};
        }
        doc.pages[0].parsedData.categories = menuPayload;

        // Any remaining pages have their categories cleared
        for (let i = 1; i < doc.pages.length; i++) {
            if (doc.pages[i].parsedData && doc.pages[i].parsedData.categories) {
                doc.pages[i].parsedData.categories = [];
            }
        }

        // Tell mongoose we modified a mixed/nested array
        doc.markModified("pages");
        await doc.save();

        return NextResponse.json(
            {
                success: true,
                message: "Menu saved successfully",
            },
            { status: 200 }
        );
    } catch (err) {
        return NextResponse.json(
            {
                success: false,
                message: err?.message || "Internal Server Error",
            },
            { status: 500 }
        );
    }
}