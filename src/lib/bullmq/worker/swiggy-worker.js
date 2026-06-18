import axios from "axios";
import dotenv from "dotenv";
import Redis from "ioredis";
import { Worker } from "bullmq";

dotenv.config();

if (!process.env.REDIS_URL) {
    throw new Error("Missing REDIS_URL");
}

if (!process.env.NEXT_PUBLIC_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_BASE_URL");
}

const connection = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
});

const worker = new Worker(
    "swiggyProcessorQueue",
    async (job) => {
        const {
            resId,
            syncId,
            type,
            action,
            payload
        } = job.data;


        if (!resId) {
            throw new Error("Missing resId");
        }

        if (!syncId) {
            throw new Error("Missing syncId");
        }

        console.log(
            `[${job.id}] Starting menu sync`,
            {
                syncId,
                resId,
            }
        );

        if (type === "category") {
            await axios.post(
                `${process.env.NEXT_PUBLIC_BASE_URL}/api/menu/${resId}/swiggy/queue-changes/process/category`,
                {
                    syncId,
                    action,
                    payload,
                }
            );
            return;
        }

        if (type === "sub_category") {
            await axios.post(
                `${process.env.NEXT_PUBLIC_BASE_URL}/api/menu/${resId}/swiggy/queue-changes/process/sub-category`,
                {
                    syncId,
                    action,
                    payload,
                }
            );
            return;
        }


        if (type === "menu_sync") {
            const { data } = await axios.post(
                `${process.env.NEXT_PUBLIC_BASE_URL}/api/menu/${resId}/swiggy/queue-changes/category`,
                {
                    syncId,
                    type
                },
                {
                    timeout: 30000,
                }
            );

            return data;
        }

        if (type === "sub_category_sync") {
            const { data } = await axios.post(
                `${process.env.NEXT_PUBLIC_BASE_URL}/api/menu/${resId}/swiggy/queue-changes/sub-category`,
                {
                    syncId,
                    type
                },
                {
                    timeout: 30000,
                }
            );

            return data;
        }
        if (type === "item_sync") {
            const { data } = await axios.post(
                `${process.env.NEXT_PUBLIC_BASE_URL}/api/menu/${resId}/swiggy/queue-changes/item`,
                {
                    syncId,
                    type
                },
                {
                    timeout: 30000,
                }
            );

            return data;
        }

        if (type === "item") {
            await axios.post(
                `${process.env.NEXT_PUBLIC_BASE_URL}/api/menu/${resId}/swiggy/queue-changes/process/item`,
                {
                    syncId,
                    action,
                    payload,
                }
            );
            return;
        }
    },
    {
        connection,
        concurrency: 1,
    }
);

worker.on("completed", (job) => {
    console.log(
        `[${job.id}] Completed`
    );
});

worker.on("failed", (job, err) => {
    console.error(
        `[${job?.id}] Failed`,
        err.message
    );
});

console.log(
    "🚀 Swiggy Menu Sync Worker Started"
);