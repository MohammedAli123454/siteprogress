import { NextResponse } from "next/server";

import { listMocs, mocSchema, saveMoc } from "@/features/joint-inch-dia/data/server-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const mocs = await listMocs();
    return NextResponse.json({ data: mocs });
  } catch (error) {
    console.error("Failed to load MOC list:", error);
    return NextResponse.json({ error: "Failed to load MOC list." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = mocSchema.parse(await request.json());
    const moc = await saveMoc(payload);

    return NextResponse.json({ data: moc }, { status: 201 });
  } catch (error) {
    console.error("Failed to save MOC:", error);
    return NextResponse.json({ error: "Failed to save MOC." }, { status: 400 });
  }
}
