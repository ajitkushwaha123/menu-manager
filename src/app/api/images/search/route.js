import { NextResponse } from "next/server";

const SEARCH_API = "https://manager.foodsnap.in/api/image/search";

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

    const url = new URL(SEARCH_API);
    url.search = searchParams.toString();

    const response = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Search API failed: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { success: false, message: "Search service unavailable" },
        { status: response.status }
      );
    }

    const payload = await response.json();
    const results = extractResults(payload);
    
    console.log("=== API DEBUG ===");
    console.log("Query:", searchParams.get("q"));
    console.log("Upstream payload keys:", Object.keys(payload));
    console.log("Extracted results length:", results?.length);
    console.log("Has data array?", Array.isArray(payload.data));
    console.log("Has results array?", Array.isArray(payload.results));
    console.log("=================");

    // The upstream API returns varying formats. 
    // We normalize it here so the frontend always gets exactly what it expects.
    return NextResponse.json({
      success: payload.success ?? true,
      query: payload.query ?? searchParams.get("q"),
      data: results,
      page: payload.page ?? payload.pagination?.page ?? 1,
      limit: payload.limit ?? payload.pagination?.limit ?? 12,
      total: payload.total ?? payload.pagination?.total ?? results.length,
      hasMore: payload.hasMore ?? payload.pagination?.hasNextPage ?? false,
      message: payload.message || null,
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Search Route Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to search images" },
      { status: 500 }
    );
  }
}

