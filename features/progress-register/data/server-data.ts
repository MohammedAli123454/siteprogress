import { z } from "zod";

import { sql as neonSql } from "@/db/client";
import { parsePipeSize } from "@/features/joint-inch-dia/domain/pipe-size";

import type { ProgressRegisterRow, ProgressReportPayload, ProgressScope } from "../domain/types";

export const progressReportSchema = z.object({
  moc: z.string().trim().min(1, "MOC is required."),
  progressScope: z.enum(["SHOP", "FIELD"]),
  reportDate: z.string().trim().min(1, "Progress date is required."),
  reportNo: z.string().trim().optional().default(""),
  remarks: z.string().trim().optional().default(""),
  lines: z
    .array(
      z.object({
        jointRecordId: z.coerce.number().int().positive(),
        progressJoints: z.coerce.number().int().min(0),
      })
    )
    .min(1, "At least one progress row is required."),
});

type ProgressRegisterDatabaseRow = {
  jointRecordId: number;
  moc: string;
  mocName: string | null;
  sizeInches: string | null;
  pipeSchedule: string | null;
  thickness: number | null;
  shopJoints: number | null;
  fieldJoints: number | null;
  shopProgressJoints: number | null;
  fieldProgressJoints: number | null;
};

type SourceJointRow = {
  id: number;
  moc: string;
  sizeInches: string | null;
  pipeSchedule: string | null;
  thickness: number | null;
  shopJoints: number | null;
  fieldJoints: number | null;
};

type ExistingProgressRow = {
  jointRecordId: number;
  progressJoints: number | null;
};

export async function listProgressRegisterRows(): Promise<ProgressRegisterRow[]> {
  const rows = await neonSql`
    SELECT
      jd.id AS "jointRecordId",
      jd."MOC" AS "moc",
      md."MOC_NAME" AS "mocName",
      jd."SIZE_INCHES" AS "sizeInches",
      jd."PIPE_SCHEDULE" AS "pipeSchedule",
      jd."THKNESS" AS "thickness",
      jd."SHOP_JOINTS" AS "shopJoints",
      jd."FIELD_JOINTS" AS "fieldJoints",
      COALESCE(
        SUM(CASE WHEN pr.progress_scope = 'SHOP' THEN pl.progress_joints ELSE 0 END),
        0
      )::int AS "shopProgressJoints",
      COALESCE(
        SUM(CASE WHEN pr.progress_scope = 'FIELD' THEN pl.progress_joints ELSE 0 END),
        0
      )::int AS "fieldProgressJoints"
    FROM "jointsDetail" jd
    LEFT JOIN "mocDetail" md ON md."MOC" = jd."MOC"
    LEFT JOIN progress_lines pl ON pl.joint_record_id = jd.id
    LEFT JOIN progress_reports pr ON pr.id = pl.report_id
    GROUP BY
      jd.id,
      jd."MOC",
      md."MOC_NAME",
      jd."SIZE_INCHES",
      jd."PIPE_SCHEDULE",
      jd."THKNESS",
      jd."SHOP_JOINTS",
      jd."FIELD_JOINTS"
    ORDER BY
      jd."MOC",
      NULLIF(REGEXP_REPLACE(COALESCE(jd."SIZE_INCHES", ''), '[^0-9.]', '', 'g'), '')::numeric,
      jd."THKNESS",
      jd."PIPE_SCHEDULE"
  `;

  return (rows as ProgressRegisterDatabaseRow[]).map(normalizeProgressRow);
}

export async function createProgressReport(payload: ProgressReportPayload) {
  const lines = payload.lines
    .map((line) => ({
      jointRecordId: line.jointRecordId,
      progressJoints: Math.max(0, Math.trunc(Number(line.progressJoints || 0))),
    }))
    .filter((line) => line.progressJoints > 0);

  if (!lines.length) {
    throw new Error("Enter progress joints for at least one row before saving.");
  }

  const sourceRows = await getSourceRows(payload.moc, lines.map((line) => line.jointRecordId));
  const sourceRowsById = new Map(sourceRows.map((row) => [row.id, row]));
  const previousProgressById = await getPreviousProgressById(
    payload.progressScope,
    lines.map((line) => line.jointRecordId)
  );

  const preparedLines = lines.map((line) => {
    const sourceRow = sourceRowsById.get(line.jointRecordId);

    if (!sourceRow) {
      throw new Error("One or more progress rows do not belong to the selected MOC.");
    }

    const scopeJoints = getScopeJoints(sourceRow, payload.progressScope);
    const previousProgress = previousProgressById.get(line.jointRecordId) ?? 0;

    if (previousProgress + line.progressJoints > scopeJoints) {
      throw new Error(
        `Progress exceeds remaining joints for ${sourceRow.sizeInches || "selected pipe size"}.`
      );
    }

    return {
      jointRecordId: line.jointRecordId,
      sizeInches: sourceRow.sizeInches || "",
      sizeValue: parsePipeSize(sourceRow.sizeInches || ""),
      thickness: Number(sourceRow.thickness || 0),
      pipeSchedule: sourceRow.pipeSchedule || "",
      scopeJoints,
      progressJoints: line.progressJoints,
    };
  });

  const reportNo = payload.reportNo?.trim() || null;
  const remarks = payload.remarks?.trim() || null;

  const transactionResult = await neonSql.transaction((transaction) => [
    transaction`
      INSERT INTO progress_reports (moc, report_date, progress_scope, report_no, remarks)
      VALUES (
        ${payload.moc},
        ${payload.reportDate},
        ${payload.progressScope},
        ${reportNo},
        ${remarks}
      )
      RETURNING id
    `,
    ...preparedLines.map((line) => transaction`
      INSERT INTO progress_lines (
        report_id,
        joint_record_id,
        size_inches,
        size_value,
        thickness,
        pipe_schedule,
        scope_joints,
        progress_joints
      )
      VALUES (
        (SELECT currval(pg_get_serial_sequence('progress_reports', 'id'))),
        ${line.jointRecordId},
        ${line.sizeInches},
        ${line.sizeValue},
        ${line.thickness},
        ${line.pipeSchedule},
        ${line.scopeJoints},
        ${line.progressJoints}
      )
      RETURNING id
    `),
  ]);

  const reportRows = transactionResult[0] as { id: number }[];
  return {
    id: reportRows[0]?.id,
    savedLineCount: preparedLines.length,
  };
}

async function getSourceRows(moc: string, jointRecordIds: number[]) {
  if (!jointRecordIds.length) return [];

  const rows = await neonSql`
    SELECT
      id,
      "MOC" AS "moc",
      "SIZE_INCHES" AS "sizeInches",
      "PIPE_SCHEDULE" AS "pipeSchedule",
      "THKNESS" AS "thickness",
      "SHOP_JOINTS" AS "shopJoints",
      "FIELD_JOINTS" AS "fieldJoints"
    FROM "jointsDetail"
    WHERE "MOC" = ${moc}
      AND id = ANY(${jointRecordIds}::int[])
  `;

  return rows as SourceJointRow[];
}

async function getPreviousProgressById(scope: ProgressScope, jointRecordIds: number[]) {
  const progressById = new Map<number, number>();
  if (!jointRecordIds.length) return progressById;

  const rows = await neonSql`
    SELECT
      pl.joint_record_id AS "jointRecordId",
      COALESCE(SUM(pl.progress_joints), 0)::int AS "progressJoints"
    FROM progress_lines pl
    INNER JOIN progress_reports pr ON pr.id = pl.report_id
    WHERE pr.progress_scope = ${scope}
      AND pl.joint_record_id = ANY(${jointRecordIds}::int[])
    GROUP BY pl.joint_record_id
  `;

  (rows as ExistingProgressRow[]).forEach((row) => {
    progressById.set(row.jointRecordId, Number(row.progressJoints || 0));
  });

  return progressById;
}

function normalizeProgressRow(row: ProgressRegisterDatabaseRow): ProgressRegisterRow {
  return {
    jointRecordId: row.jointRecordId,
    moc: row.moc,
    mocName: row.mocName || "",
    sizeInches: row.sizeInches || "",
    pipeSchedule: row.pipeSchedule || "",
    thickness: Number(row.thickness || 0),
    shopJoints: Number(row.shopJoints || 0),
    fieldJoints: Number(row.fieldJoints || 0),
    shopProgressJoints: Number(row.shopProgressJoints || 0),
    fieldProgressJoints: Number(row.fieldProgressJoints || 0),
  };
}

function getScopeJoints(row: SourceJointRow, scope: ProgressScope) {
  return scope === "SHOP" ? Number(row.shopJoints || 0) : Number(row.fieldJoints || 0);
}
