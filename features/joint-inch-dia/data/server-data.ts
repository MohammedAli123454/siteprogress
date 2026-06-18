import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import { jointsDetail, mocDetail } from "@/db/schema";

import { parsePipeSize } from "../domain/pipe-size";
import type { JointRecord, JointRecordPayload, MocOption } from "../domain/types";

export const jointRecordSchema = z.object({
  moc: z.string().trim().min(1, "MOC is required."),
  mocName: z.string().trim().min(1, "Project name is required."),
  sizeInches: z.string().trim().min(1, "Pipe size is required."),
  pipeSchedule: z.string().trim().optional().default(""),
  thickness: z.coerce.number().min(0),
  shopJoints: z.coerce.number().int().min(0),
  fieldJoints: z.coerce.number().int().min(0),
});

export const mocSchema = z.object({
  moc: z.string().trim().min(1, "MOC is required."),
  mocName: z.string().trim().min(1, "Project name is required."),
});

export const idSchema = z.coerce.number().int().positive();

type JointRecordDatabaseRow = {
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
};

const jointRecordSelection = {
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
};

export async function listJointRecords() {
  const rows = await db
    .select(jointRecordSelection)
    .from(jointsDetail)
    .leftJoin(mocDetail, eq(jointsDetail.moc, mocDetail.moc))
    .orderBy(jointsDetail.moc, sql`CAST(${jointsDetail.sizeInches} AS NUMERIC) DESC`, jointsDetail.thickness);

  return rows.map(normalizeRecord);
}

export async function createJointRecord(payload: JointRecordPayload) {
  await upsertMoc(payload.moc, payload.mocName);

  const insertedRows = await db
    .insert(jointsDetail)
    .values(getPayloadValues(payload))
    .returning({ id: jointsDetail.id });

  return getRecordById(insertedRows[0].id);
}

export async function updateJointRecord(id: number, payload: JointRecordPayload) {
  await upsertMoc(payload.moc, payload.mocName);
  await db.update(jointsDetail).set(getPayloadValues(payload)).where(eq(jointsDetail.id, id));

  return getRecordById(id);
}

export async function deleteJointRecord(id: number) {
  const existingRecord = await getRecordById(id);

  await db.delete(jointsDetail).where(eq(jointsDetail.id, id));
  if (existingRecord?.moc) {
    await deleteMocIfEmpty(existingRecord.moc);
  }

  return id;
}

export async function listMocs(): Promise<MocOption[]> {
  return db
    .select({
      moc: mocDetail.moc,
      mocName: mocDetail.mocName,
    })
    .from(mocDetail)
    .orderBy(mocDetail.moc);
}

export async function saveMoc(payload: MocOption) {
  await upsertMoc(payload.moc, payload.mocName);
  return payload;
}

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
    .select(jointRecordSelection)
    .from(jointsDetail)
    .leftJoin(mocDetail, eq(jointsDetail.moc, mocDetail.moc))
    .where(eq(jointsDetail.id, id))
    .limit(1);

  return rows[0] ? normalizeRecord(rows[0]) : null;
}

function normalizeRecord(record: JointRecordDatabaseRow): JointRecord {
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

function calculateMetrics(payload: JointRecordPayload) {
  const sizeValue = parsePipeSize(payload.sizeInches);
  const shopJoints = toNumber(payload.shopJoints);
  const fieldJoints = toNumber(payload.fieldJoints);
  const shopInchDia = Math.round(sizeValue * shopJoints);
  const fieldInchDia = Math.round(sizeValue * fieldJoints);

  return {
    shopJoints,
    fieldJoints,
    totalJoints: shopJoints + fieldJoints,
    shopInchDia,
    fieldInchDia,
    totalInchDia: shopInchDia + fieldInchDia,
  };
}

function toNumber(value: unknown) {
  return Number(value || 0);
}
