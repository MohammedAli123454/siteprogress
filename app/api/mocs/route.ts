import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/app/configs/db";
import { mocDetail } from "@/app/configs/schema";
import type { MocOption } from "@/lib/joint-record-types";

export const dynamic = "force-dynamic";

const mocSchema = z.object({
  moc: z.string().trim().min(1, "MOC is required."),
  mocName: z.string().trim().min(1, "Project name is required."),
});

async function upsertMoc(moc: string, mocName: string) {
  const existingMoc = await db
    .select({ moc: mocDetail.moc })
    .from(mocDetail)
    .where(eq(mocDetail.moc, moc))
    .limit(1);

  if (existingMoc[0]) {
    await db.update(mocDetail).set({ mocName }).where(eq(mocDetail.moc, moc));
    return;
  }

  await db.insert(mocDetail).values({ moc, mocName });
}

export async function GET() {
  try {
    const rows = await db
      .select({
        moc: mocDetail.moc,
        mocName: mocDetail.mocName,
      })
      .from(mocDetail)
      .orderBy(mocDetail.moc);

    return NextResponse.json({ data: rows satisfies MocOption[] });
  } catch (error) {
    console.error("Failed to load MOC list:", error);
    return NextResponse.json({ error: "Failed to load MOC list." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = mocSchema.parse(await request.json());
    await upsertMoc(payload.moc, payload.mocName);

    return NextResponse.json({ data: payload satisfies MocOption }, { status: 201 });
  } catch (error) {
    console.error("Failed to save MOC:", error);
    return NextResponse.json({ error: "Failed to save MOC." }, { status: 400 });
  }
}
