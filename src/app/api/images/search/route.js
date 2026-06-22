import { NextResponse } from "next/server";

const SEARCH_API =
    "https://foodsnap-search-engine.vercel.app/api/search";

function extractResults(payload) {
    if (!payload) return [];

    return (
        payload.data ||
        payload.results ||
        payload.images ||
        payload.items ||
        (Array.isArray(payload) ? payload : [])
    );
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);

        const query = searchParams.get("q")?.trim();

        if (!query) {
            return NextResponse.json({
                success: true,
                data: [],
                metadata: {
                    page: 1,
                    limit: 12,
                    total: 0,
                },
            });
        }

        const page = Math.max(
            1,
            parseInt(searchParams.get("page") || "1", 10)
        );

        const limit = Math.min(
            50,
            Math.max(
                1,
                parseInt(searchParams.get("limit") || "12", 10)
            )
        );

        const url = new URL(SEARCH_API);

        url.searchParams.set("q", query);
        url.searchParams.set("page", page.toString());
        url.searchParams.set("limit", limit.toString());

        const controller = new AbortController();

        const timeout = setTimeout(() => {
            controller.abort();
        }, 5000);

        const response = await fetch(url.toString(), {
            signal: controller.signal,
            cache: "no-store",
            headers: {
                Accept: "application/json",
            },
        });

        clearTimeout(timeout);

        console.log("response", response)

        if (!response.ok) {
            console.error(
                "Search API failed:",
                response.status
            );

            return NextResponse.json(
                {
                    success: false,
                    message: "Search service unavailable",
                },
                {
                    status: response.status,
                }
            );
        }

        const payload = await response.json();

        const results = extractResults(payload);

        return NextResponse.json(
            {
                success: true,
                data: results,
                page: payload.page ?? page,
                limit: payload.limit ?? limit,
                total: payload.total ?? results.length,
                hasMore: payload.hasMore ?? false,
            },
            {
                headers: {
                    "Cache-Control":
                        "public, s-maxage=60, stale-while-revalidate=300",
                },
            }
        );
    } catch (error) {
        console.error(
            "Search Route Error:",
            error
        );

        const isTimeout =
            error?.name === "AbortError";

        return NextResponse.json(
            {
                success: false,
                message: isTimeout
                    ? "Search request timed out"
                    : "Failed to search images",
            },
            {
                status: 500,
            }
        );
    }
}