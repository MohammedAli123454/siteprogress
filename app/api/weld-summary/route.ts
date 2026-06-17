import { NextResponse } from "next/server";

import { getAllMocsWeldSummary, normalizeWeldType } from "@/lib/weld-data";

export const dynamic = "force-dynamic";

const QUERY_TIMEOUT_MS = 15_000;

function withTimeout<T>(promise: Promise<T>, timeoutMessage: string) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), QUERY_TIMEOUT_MS);
    }),
  ]);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = normalizeWeldType(searchParams.get("type"));

  try {
    const data = await withTimeout(
      getAllMocsWeldSummary(type),
      "Timed out while loading weld summary."
    );

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Failed to load weld summary:", error);
    return NextResponse.json(
      { error: "Failed to load weld summary." },
      { status: 500 }
    );
  }
}
