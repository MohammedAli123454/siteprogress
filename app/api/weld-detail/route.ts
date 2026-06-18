import { NextResponse } from "next/server";

import {
  getMocWiseWeldDetail,
  getPipeSizeWeldDetail,
  normalizeWeldType,
} from "@/features/weld-summary/data";

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
  const moc = searchParams.get("moc") || "*";
  const type = normalizeWeldType(searchParams.get("type"));
  const scope = searchParams.get("scope") === "pipe-size" ? "pipe-size" : "summary";

  try {
    const data =
      scope === "pipe-size"
        ? await withTimeout(
            getPipeSizeWeldDetail(moc, type),
            "Timed out while loading weld detail."
          )
        : await withTimeout(
            getMocWiseWeldDetail(moc, type),
            "Timed out while loading weld detail."
          );

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Failed to load weld detail:", error);
    return NextResponse.json(
      { error: "Failed to load weld detail." },
      { status: 500 }
    );
  }
}
