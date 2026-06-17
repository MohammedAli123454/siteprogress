import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/app/configs/db";
import { jointsDetail, mocDetail } from "@/app/configs/schema";
import type { JointRecord, JointRecordPayload } from "@/lib/joint-record-types";
import { parsePipeSize } from "@/lib/pipe-size";

export const dynamic = "force-dynamic";

const jointRecordSchema = z.object({
  moc: z.string().trim().min(1, "MOC is required."),
  mocName: z.string().trim().min(1, "Project name is required."),
  sizeInches: z.string().trim().min(1, "Pipe size is required."),
  pipeSchedule: z.string().trim().optional().default(""),
  thickness: z.coerce.number().min(0),
  shopJoints: z.coerce.number().int().min(0),
  fieldJoints: z.coerce.number().int().min(0),
});

const idSchema = z.coerce.number().int().positive();

const toNumber = (value: unknown) => Number(value || 0);

const calculateMetrics = (payload: JointRecordPayload) => {
  const sizeValue = parsePipeSize(payload.sizeInches);
  const shopJoints = toNumber(payload.shopJoints);
  const fieldJoints = toNumber(payload.fieldJoints);
  const shopInchDia = sizeValue * shopJoints;
  const fieldInchDia = sizeValue * fieldJoints;

  return {
    shopJoints,
    fieldJoints,
    totalJoints: shopJoints + fieldJoints,
    shopInchDia,
    fieldInchDia,
    totalInchDia: shopInchDia + fieldInchDia,
  };
};

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

async function deleteMocIfEmpty(moc: string) {
  const remainingRows = await db
    .select({ id: jointsDetail.id })
    .from(jointsDetail)
    .where(eq(jointsDetail.moc, moc))
    .limit(1);

  if (!remainingRows[0]) {
    await db.delete(mocDetail).where(eq(mocDetail.moc, moc));
  }
}

async function getRecordById(id: number) {
  const rows = await db
    .select({
      id: jointsDetail.id,
      moc: jointsDetail.moc,
      mocName: mocDetail.mocName,
      sizeInches: jointsDetail.sizeInches,
      pipeSchedule: jointsDetail.pipeSchedule,
      thickness: jointsDetail.thickness,
      shopJoints: jointsDetail.shopJoints,
      fieldJoints: jointsDetail.fieldJoints,
      totalJoints: jointsDetail.totalJoints,
      shopInchDia: jointsDetail.shopInchDia,
      fieldInchDia: jointsDetail.fieldInchDia,
      totalInchDia: jointsDetail.totalInchDia,
    })
    .from(jointsDetail)
    .leftJoin(mocDetail, eq(jointsDetail.moc, mocDetail.moc))
    .where(eq(jointsDetail.id, id))
    .limit(1);

  return rows[0] ? normalizeRecord(rows[0]) : null;
}

function normalizeRecord(record: {
  id: number;
  moc: string;
  mocName: string | null;
  sizeInches: string | null;
  pipeSchedule: string | null;
  thickness: number | null;
  shopJoints: number | null;
  fieldJoints: number | null;
  totalJoints: number | null;
  shopInchDia: number | null;
  fieldInchDia: number | null;
  totalInchDia: number | null;
}): JointRecord {
  return {
    id: record.id,
    moc: record.moc,
    mocName: record.mocName || "",
    sizeInches: record.sizeInches || "",
    pipeSchedule: record.pipeSchedule || "",
    thickness: record.thickness || 0,
    shopJoints: record.shopJoints || 0,
    fieldJoints: record.fieldJoints || 0,
    totalJoints: record.totalJoints || 0,
    shopInchDia: record.shopInchDia || 0,
    fieldInchDia: record.fieldInchDia || 0,
    totalInchDia: record.totalInchDia || 0,
  };
}

function getPayloadValues(payload: JointRecordPayload) {
  const metrics = calculateMetrics(payload);

  return {
    sizeInches: payload.sizeInches,
    pipeSchedule: payload.pipeSchedule,
    thickness: toNumber(payload.thickness),
    shopJoints: metrics.shopJoints,
    fieldJoints: metrics.fieldJoints,
    totalJoints: metrics.totalJoints,
    shopInchDia: metrics.shopInchDia,
    fieldInchDia: metrics.fieldInchDia,
    totalInchDia: metrics.totalInchDia,
    moc: payload.moc,
  };
}

export async function GET() {
  try {
    const rows = await db
      .select({
        id: jointsDetail.id,
        moc: jointsDetail.moc,
        mocName: mocDetail.mocName,
        sizeInches: jointsDetail.sizeInches,
        pipeSchedule: jointsDetail.pipeSchedule,
        thickness: jointsDetail.thickness,
        shopJoints: jointsDetail.shopJoints,
        fieldJoints: jointsDetail.fieldJoints,
        totalJoints: jointsDetail.totalJoints,
        shopInchDia: jointsDetail.shopInchDia,
        fieldInchDia: jointsDetail.fieldInchDia,
        totalInchDia: jointsDetail.totalInchDia,
      })
      .from(jointsDetail)
      .leftJoin(mocDetail, eq(jointsDetail.moc, mocDetail.moc))
      .orderBy(jointsDetail.moc, sql`CAST(${jointsDetail.sizeInches} AS NUMERIC) DESC`, jointsDetail.thickness);

    return NextResponse.json({ data: rows.map(normalizeRecord) });
  } catch (error) {
    console.error("Failed to load joint records:", error);
    return NextResponse.json({ error: "Failed to load joint records." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = jointRecordSchema.parse(await request.json());

    await upsertMoc(payload.moc, payload.mocName);

    const insertedRows = await db
      .insert(jointsDetail)
      .values(getPayloadValues(payload))
      .returning({ id: jointsDetail.id });
    const record = await getRecordById(insertedRows[0].id);

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    console.error("Failed to create joint record:", error);
    return NextResponse.json({ error: "Failed to create joint record." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = idSchema.parse(body.id);
    const payload = jointRecordSchema.parse(body);

    await upsertMoc(payload.moc, payload.mocName);
    await db.update(jointsDetail).set(getPayloadValues(payload)).where(eq(jointsDetail.id, id));

    const record = await getRecordById(id);
    return NextResponse.json({ data: record });
  } catch (error) {
    console.error("Failed to update joint record:", error);
    return NextResponse.json({ error: "Failed to update joint record." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = idSchema.parse(searchParams.get("id"));
    const existingRecord = await getRecordById(id);

    await db.delete(jointsDetail).where(eq(jointsDetail.id, id));
    if (existingRecord?.moc) {
      await deleteMocIfEmpty(existingRecord.moc);
    }

    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error("Failed to delete joint record:", error);
    return NextResponse.json({ error: "Failed to delete joint record." }, { status: 400 });
  }
}
