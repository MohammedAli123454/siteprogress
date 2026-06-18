import { NextResponse } from "next/server";

import {
  createProgressReport,
  listProgressRegisterRows,
  progressReportSchema,
} from "@/features/progress-register/data/server-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await listProgressRegisterRows();
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Failed to load progress register rows:", error);
    return NextResponse.json(
      { error: "Failed to load progress register rows." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = progressReportSchema.parse(await request.json());
    const report = await createProgressReport(payload);

    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save progress report.";

    console.error("Failed to save progress report:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
