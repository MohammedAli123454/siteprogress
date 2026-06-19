import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db, sql as neonSql } from "@/db/client";
import { jointsDetail, mocDetail } from "@/db/schema";

import { parsePipeSize } from "../domain/pipe-size";
import type {
  JointRecord,
  JointRecordBatchPayload,
  JointRecordPayload,
  MocOption,
} from "../domain/types";

const jointRecordBaseSchema = z.object({
  moc: z.string().trim().min(1, "MOC is required."),
  mocName: z.string().trim().min(1, "Project name is required."),
  sizeInches: z.string().trim().min(1, "Pipe size is required."),
  pipeSchedule: z.string().trim().optional().default(""),
  thickness: z.coerce.number().min(0),
  shopJoints: z.coerce.number().int().min(0),
  fieldJoints: z.coerce.number().int().min(0),
});

export const jointRecordSchema = jointRecordBaseSchema.refine((payload) => payload.shopJoints > 0 || payload.fieldJoints > 0, {
  message: "Enter shop joints or field joints before saving this row.",
  path: ["shopJoints"],
});

export const mocSchema = z.object({
  moc: z.string().trim().min(1, "MOC is required."),
  mocName: z.string().trim().min(1, "Project name is required."),
});

export const idSchema = z.coerce.number().int().positive();

const jointRecordBatchCreateSchema = jointRecordBaseSchema.extend({
  clientId: z.coerce.number().int(),
}).refine((payload) => payload.shopJoints > 0 || payload.fieldJoints > 0, {
  message: "Enter shop joints or field joints before saving this row.",
  path: ["shopJoints"],
});

const jointRecordBatchUpdateSchema = jointRecordBaseSchema.extend({
  id: idSchema,
}).refine((payload) => payload.shopJoints > 0 || payload.fieldJoints > 0, {
  message: "Enter shop joints or field joints before saving this row.",
  path: ["shopJoints"],
});

export const jointRecordBatchSchema = z.object({
  create: z.array(jointRecordBatchCreateSchema).default([]),
  update: z.array(jointRecordBatchUpdateSchema).default([]),
  deleteIds: z.array(idSchema).default([]),
});

export class JointRecordBatchValidationError extends Error {
  rowErrors: Record<string, string>;

  constructor(message: string, rowErrors: Record<string, string>) {
    super(message);
    this.name = "JointRecordBatchValidationError";
    this.rowErrors = rowErrors;
  }
}

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

type JointProgressUsageRow = {
  jointRecordId: number;
  shopProgressJoints: number | null;
  fieldProgressJoints: number | null;
};

type JointProgressUsage = {
  shopProgressJoints: number;
  fieldProgressJoints: number;
};

type BatchCandidateRow = JointRecord & {
  rowKey: string;
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

export async function saveJointRecordBatch(payload: JointRecordBatchPayload) {
  await validateJointRecordBatch(payload);

  const transactionResult = await neonSql.transaction((transaction) => {
    const mocPayloads = [...payload.create, ...payload.update];

    return [
      ...mocPayloads.map((record) => transaction`
        INSERT INTO "mocDetail" ("MOC", "MOC_NAME")
        VALUES (${record.moc}, ${record.mocName})
        ON CONFLICT ("MOC") DO UPDATE SET "MOC_NAME" = EXCLUDED."MOC_NAME"
      `),
      ...payload.create.map((record) => {
        const values = getPayloadValues(record);

        return transaction`
          INSERT INTO "jointsDetail" (
            "SIZE_INCHES",
            "PIPE_SCHEDULE",
            "THKNESS",
            "SHOP_JOINTS",
            "SHOP_INCH_DIA",
            "FIELD_JOINTS",
            "FIELD_INCH_DIA",
            "TOTAL_JOINTS",
            "TOTAL_INCH_DIA",
            "MOC"
          )
          VALUES (
            ${values.sizeInches},
            ${values.pipeSchedule},
            ${values.thickness},
            ${values.shopJoints},
            ${values.shopInchDia},
            ${values.fieldJoints},
            ${values.fieldInchDia},
            ${values.totalJoints},
            ${values.totalInchDia},
            ${values.moc}
          )
          RETURNING id
        `;
      }),
      ...payload.update.map((record) => {
        const values = getPayloadValues(record);

        return transaction`
          UPDATE "jointsDetail"
          SET
            "SIZE_INCHES" = ${values.sizeInches},
            "PIPE_SCHEDULE" = ${values.pipeSchedule},
            "THKNESS" = ${values.thickness},
            "SHOP_JOINTS" = ${values.shopJoints},
            "SHOP_INCH_DIA" = ${values.shopInchDia},
            "FIELD_JOINTS" = ${values.fieldJoints},
            "FIELD_INCH_DIA" = ${values.fieldInchDia},
            "TOTAL_JOINTS" = ${values.totalJoints},
            "TOTAL_INCH_DIA" = ${values.totalInchDia},
            "MOC" = ${values.moc}
          WHERE id = ${record.id}
          RETURNING id
        `;
      }),
      ...payload.deleteIds.map((id) => transaction`
        DELETE FROM "jointsDetail"
        WHERE id = ${id}
        RETURNING id
      `),
    ];
  });

  void transactionResult;
  return listJointRecords();
}

async function validateJointRecordBatch(payload: JointRecordBatchPayload) {
  const rowErrors: Record<string, string> = {};
  const updateIds = payload.update.map((record) => record.id);
  const targetIds = [...updateIds, ...payload.deleteIds];
  const touchedRowKeys = new Set<string>([
    ...payload.create.map((record) => getNewRowKey(record.clientId)),
    ...updateIds.map(String),
  ]);

  addDuplicateIdErrors(updateIds, "updated", rowErrors);
  addDuplicateIdErrors(payload.deleteIds, "deleted", rowErrors);

  const [currentRows, progressById] = await Promise.all([
    listJointRecords(),
    getProgressUsageByJointIds(targetIds),
  ]);
  const currentRowsById = new Map(currentRows.map((record) => [record.id, record]));

  payload.deleteIds.forEach((id) => {
    const rowKey = String(id);
    const existingRow = currentRowsById.get(id);

    if (!existingRow) {
      rowErrors[rowKey] = "This BOQ row no longer exists.";
      return;
    }

    const progress = progressById.get(id);

    if (progress && hasAnyProgress(progress)) {
      rowErrors[rowKey] =
        "This BOQ row already has progress history. Archive or revise it instead of deleting it.";
    }
  });

  payload.update.forEach((record) => {
    const rowKey = String(record.id);
    const existingRow = currentRowsById.get(record.id);

    if (!existingRow) {
      rowErrors[rowKey] = "This BOQ row no longer exists.";
      return;
    }

    const progress = progressById.get(record.id);

    if (!progress || !hasAnyProgress(progress)) return;

    if (hasStructuralChange(existingRow, record)) {
      rowErrors[rowKey] =
        "This BOQ row already has progress history. Create a revision row instead of changing size, thickness, schedule, or MOC.";
      return;
    }

    if (record.shopJoints < progress.shopProgressJoints) {
      rowErrors[rowKey] =
        `Shop joints cannot be below the reported progress of ${progress.shopProgressJoints}.`;
      return;
    }

    if (record.fieldJoints < progress.fieldProgressJoints) {
      rowErrors[rowKey] =
        `Field joints cannot be below the reported progress of ${progress.fieldProgressJoints}.`;
    }
  });

  addDuplicateBoqRowErrors(payload, currentRows, touchedRowKeys, rowErrors);

  if (Object.keys(rowErrors).length) {
    throw new JointRecordBatchValidationError("BOQ changes need review before saving.", rowErrors);
  }
}

function addDuplicateIdErrors(
  ids: number[],
  actionLabel: string,
  rowErrors: Record<string, string>
) {
  const seenIds = new Set<number>();

  ids.forEach((id) => {
    if (seenIds.has(id)) {
      rowErrors[String(id)] = `This row was selected more than once for ${actionLabel}.`;
      return;
    }

    seenIds.add(id);
  });
}

async function getProgressUsageByJointIds(ids: number[]) {
  const progressById = new Map<number, JointProgressUsage>();

  if (!ids.length) return progressById;

  const rows = await neonSql`
    SELECT
      pl.joint_record_id AS "jointRecordId",
      COALESCE(
        SUM(CASE WHEN pr.progress_scope = 'SHOP' THEN pl.progress_joints ELSE 0 END),
        0
      )::int AS "shopProgressJoints",
      COALESCE(
        SUM(CASE WHEN pr.progress_scope = 'FIELD' THEN pl.progress_joints ELSE 0 END),
        0
      )::int AS "fieldProgressJoints"
    FROM progress_lines pl
    INNER JOIN progress_reports pr ON pr.id = pl.report_id
    WHERE pl.joint_record_id = ANY(${ids}::int[])
    GROUP BY pl.joint_record_id
  `;

  (rows as JointProgressUsageRow[]).forEach((row) => {
    progressById.set(row.jointRecordId, {
      shopProgressJoints: Number(row.shopProgressJoints || 0),
      fieldProgressJoints: Number(row.fieldProgressJoints || 0),
    });
  });

  return progressById;
}

function hasAnyProgress(progress: JointProgressUsage) {
  return progress.shopProgressJoints > 0 || progress.fieldProgressJoints > 0;
}

function hasStructuralChange(existingRow: JointRecord, payload: JointRecordPayload) {
  return (
    existingRow.moc !== payload.moc ||
    normalizeText(existingRow.sizeInches) !== normalizeText(payload.sizeInches) ||
    normalizeText(existingRow.pipeSchedule) !== normalizeText(payload.pipeSchedule) ||
    Number(existingRow.thickness || 0) !== Number(payload.thickness || 0)
  );
}

function addDuplicateBoqRowErrors(
  payload: JointRecordBatchPayload,
  currentRows: JointRecord[],
  touchedRowKeys: Set<string>,
  rowErrors: Record<string, string>
) {
  const deleteIds = new Set(payload.deleteIds);
  const updateById = new Map(payload.update.map((record) => [record.id, record]));
  const candidates: BatchCandidateRow[] = [];

  currentRows.forEach((row) => {
    if (deleteIds.has(row.id)) return;

    const update = updateById.get(row.id);
    candidates.push(
      update
        ? { ...makeRecordFromPayload(row.id, update), rowKey: String(row.id) }
        : { ...row, rowKey: String(row.id) }
    );
  });

  payload.create.forEach((record) => {
    candidates.push({
      ...makeRecordFromPayload(record.clientId, record),
      rowKey: getNewRowKey(record.clientId),
    });
  });

  const rowByDuplicateKey = new Map<string, BatchCandidateRow>();

  candidates.forEach((row) => {
    const duplicateKey = getDuplicateBoqRowKey(row);
    const existingRow = rowByDuplicateKey.get(duplicateKey);

    if (!existingRow) {
      rowByDuplicateKey.set(duplicateKey, row);
      return;
    }

    const isCurrentRowTouched = touchedRowKeys.has(row.rowKey);
    const isExistingRowTouched = touchedRowKeys.has(existingRow.rowKey);

    if (!isCurrentRowTouched && !isExistingRowTouched) return;

    const message = "Duplicate BOQ row for the same MOC, size, thickness, and schedule.";

    if (isCurrentRowTouched) rowErrors[row.rowKey] = message;
    if (isExistingRowTouched) rowErrors[existingRow.rowKey] = message;
  });
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

function makeRecordFromPayload(id: number, payload: JointRecordPayload): JointRecord {
  const values = getPayloadValues(payload);

  return {
    id,
    moc: payload.moc,
    mocName: payload.mocName,
    sizeInches: values.sizeInches,
    pipeSchedule: values.pipeSchedule,
    thickness: values.thickness,
    shopJoints: values.shopJoints,
    fieldJoints: values.fieldJoints,
    totalJoints: values.totalJoints,
    shopInchDia: values.shopInchDia,
    fieldInchDia: values.fieldInchDia,
    totalInchDia: values.totalInchDia,
  };
}

function getDuplicateBoqRowKey(record: JointRecord) {
  const sizeValue = parsePipeSize(record.sizeInches);
  const sizeKey = sizeValue > 0 ? String(sizeValue) : normalizeText(record.sizeInches);

  return [
    normalizeText(record.moc),
    sizeKey,
    String(Number(record.thickness || 0)),
    normalizeText(record.pipeSchedule),
  ].join("|");
}

function getNewRowKey(clientId: number) {
  return `new:${clientId}`;
}

function normalizeText(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
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
