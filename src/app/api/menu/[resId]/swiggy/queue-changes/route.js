import MenuSync from "@/model/menu-sync";
import { NextResponse } from "next/server";
import { swiggyProcessorJob } from "@/lib/bullmq/job/swiggy-processor";

export async function POST(req, { params }) {
    try {
        const { resId } = await params;
        const body = await req.json();

        const { updated_menu } = body;

        if (!updated_menu) {
            return NextResponse.json(
                {
                    success: false,
                    message: "updated_menu is required",
                },
                { status: 400 }
            );
        }

        if (!resId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "resId is required",
                },
                { status: 400 }
            );
        }

        const sync = await MenuSync.create({
            resId,
            status: "pending",
            updated_menu,
        });

        console.log(sync);

        await swiggyProcessorJob({
            type: "menu_sync",
            resId,
            syncId: sync._id.toString(),
        });

        return NextResponse.json(
            {
                success: true,
                syncId: sync._id,
                message: "Menu sync queued",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message:
                    error?.message ||
                    "Something went wrong",
            },
            { status: 500 }
        );
    }
}