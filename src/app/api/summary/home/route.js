import { NextResponse } from "next/server";
import { buildHomeSummaryResponse, loadMockData } from "@/lib/mockSummary";
import apiClient from "@/lib/apiClient";

const API_BASE_URL = apiClient?.defaults?.baseURL ?? "";

export async function GET(request) {
  try {
    const username = request.nextUrl.searchParams.get("username") ?? undefined;
    if (API_BASE_URL) {
      try {
        const endpoint = username
          ? `/users/${encodeURIComponent(username)}/home-summary`
          : "/users/home-summary";
        const response = await apiClient.get(endpoint, {
          headers: { "Cache-Control": "no-cache" },
        });
        const summary = response.data?.data ?? response.data ?? null;
        if (summary) {
          return NextResponse.json(summary);
        }
      } catch (remoteError) {
        console.error("Remote home summary fetch failed:", remoteError);
      }
    }
    const db = await loadMockData();
    const summary = await buildHomeSummaryResponse(db, username);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Failed to load summary home data", error);
    return NextResponse.json(
      { error: "Unable to load summary data" },
      { status: 500 }
    );
  }
}
