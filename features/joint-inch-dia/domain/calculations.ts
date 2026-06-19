import type { JointRecord, JointRecordPayload, MocOption } from "./types";
import { ALL_MOCS } from "./constants";
import { parsePipeSize } from "./pipe-size";

export type RecordTotals = {
  shopJoints: number;
  fieldJoints: number;
  totalJoints: number;
  shopInchDia: number;
  fieldInchDia: number;
  totalInchDia: number;
};

export type ConsolidatedPipeRow = RecordTotals & {
  key: string;
  sizeInches: string;
  sizeSortValue: number;
  thickness: number;
  pipeSchedule: string;
};

export type ExportCell = string | number;

export type PipeTableSummary =
  | {
      type: "all";
      moc: "All MOCs";
      title: string;
    }
  | {
      type: "moc";
      moc: string;
      title: string;
    };

export const toNumber = (value: number | string | null | undefined) => Number(value || 0);

export const isNewRecord = (id: number) => id < 0;

export const getEmptyTotals = (): RecordTotals => ({
  shopJoints: 0,
  fieldJoints: 0,
  totalJoints: 0,
  shopInchDia: 0,
  fieldInchDia: 0,
  totalInchDia: 0,
});

export const addRecordToTotals = (totals: RecordTotals, record: JointRecord): RecordTotals => ({
  shopJoints: totals.shopJoints + toNumber(record.shopJoints),
  fieldJoints: totals.fieldJoints + toNumber(record.fieldJoints),
  totalJoints: totals.totalJoints + toNumber(record.totalJoints),
  shopInchDia: totals.shopInchDia + toNumber(record.shopInchDia),
  fieldInchDia: totals.fieldInchDia + toNumber(record.fieldInchDia),
  totalInchDia: totals.totalInchDia + toNumber(record.totalInchDia),
});

export function getRecordTotals(records: JointRecord[]) {
  return records.reduce(addRecordToTotals, getEmptyTotals());
}

export function getMocOptions(fetchedMocs: MocOption[], records: JointRecord[]) {
  const options = new Map<string, MocOption>();

  fetchedMocs.forEach((moc) => {
    if (moc.moc) options.set(moc.moc, moc);
  });

  records.forEach((record) => {
    if (record.moc && !options.has(record.moc)) {
      options.set(record.moc, { moc: record.moc, mocName: record.mocName });
    }
  });

  return Array.from(options.values()).sort((a, b) => a.moc.localeCompare(b.moc));
}

export function filterJointRecords(records: JointRecord[], selectedMoc: string) {
  if (selectedMoc === ALL_MOCS) return records;

  return records.filter((record) => record.moc === selectedMoc);
}

export function getConsolidatedPipeRows(records: JointRecord[]) {
  const rowsByPipeKey = new Map<string, ConsolidatedPipeRow>();

  records.forEach((record) => {
    const sizeValue = parsePipeSize(record.sizeInches);
    const sizeLabel = record.sizeInches.trim() || "-";
    const thickness = Math.max(0, Math.trunc(toNumber(record.thickness)));
    const pipeSchedule = record.pipeSchedule.trim() || "-";
    const sizeKey = sizeValue > 0 ? String(sizeValue) : sizeLabel.toLowerCase();
    const key = `${sizeKey}|${thickness}|${pipeSchedule.toLowerCase()}`;
    const existingRow = rowsByPipeKey.get(key);

    if (existingRow) {
      existingRow.shopJoints += toNumber(record.shopJoints);
      existingRow.fieldJoints += toNumber(record.fieldJoints);
      existingRow.totalJoints += toNumber(record.totalJoints);
      existingRow.shopInchDia += toNumber(record.shopInchDia);
      existingRow.fieldInchDia += toNumber(record.fieldInchDia);
      existingRow.totalInchDia += toNumber(record.totalInchDia);
      return;
    }

    rowsByPipeKey.set(key, {
      key,
      sizeInches: sizeLabel,
      sizeSortValue: sizeValue,
      thickness,
      pipeSchedule,
      shopJoints: toNumber(record.shopJoints),
      fieldJoints: toNumber(record.fieldJoints),
      totalJoints: toNumber(record.totalJoints),
      shopInchDia: toNumber(record.shopInchDia),
      fieldInchDia: toNumber(record.fieldInchDia),
      totalInchDia: toNumber(record.totalInchDia),
    });
  });

  return Array.from(rowsByPipeKey.values()).sort((first, second) => {
    const sizeDifference = first.sizeSortValue - second.sizeSortValue;
    if (sizeDifference) return sizeDifference;

    const thicknessDifference = first.thickness - second.thickness;
    if (thicknessDifference) return thicknessDifference;

    return first.pipeSchedule.localeCompare(second.pipeSchedule);
  });
}

export function getPipeTableSummary(
  selectedMoc: string,
  isAllMocsView: boolean,
  mocNameByCode: Map<string, string>
): PipeTableSummary {
  if (!isAllMocsView) {
    return {
      type: "moc",
      moc: selectedMoc,
      title: mocNameByCode.get(selectedMoc) || "No project name",
    };
  }

  return {
    type: "all",
    moc: "All MOCs",
    title: "Consolidated pipe-size summary",
  };
}

export const getDerivedMetrics = (
  values: Pick<JointRecordPayload, "sizeInches" | "shopJoints" | "fieldJoints">
) => {
  const size = parsePipeSize(values.sizeInches);
  const shopJoints = Math.max(0, Math.trunc(toNumber(values.shopJoints)));
  const fieldJoints = Math.max(0, Math.trunc(toNumber(values.fieldJoints)));
  const shopInchDia = Math.round(size * shopJoints);
  const fieldInchDia = Math.round(size * fieldJoints);

  return {
    shopJoints,
    fieldJoints,
    totalJoints: shopJoints + fieldJoints,
    shopInchDia,
    fieldInchDia,
    totalInchDia: shopInchDia + fieldInchDia,
  };
};

export const recalculateRecord = (record: JointRecord): JointRecord => ({
  ...record,
  thickness: Math.max(0, Math.trunc(toNumber(record.thickness))),
  ...getDerivedMetrics(record),
});

export const makeLocalRecord = (id: number, payload: JointRecordPayload): JointRecord =>
  recalculateRecord({
    id,
    moc: payload.moc,
    mocName: payload.mocName,
    sizeInches: payload.sizeInches,
    pipeSchedule: payload.pipeSchedule,
    thickness: payload.thickness,
    shopJoints: payload.shopJoints,
    fieldJoints: payload.fieldJoints,
    totalJoints: 0,
    shopInchDia: 0,
    fieldInchDia: 0,
    totalInchDia: 0,
  });

export const normalizeRecord = (record: JointRecord): JointRecord => recalculateRecord(record);

export function getJointRecordPayload(record: JointRecord, fallbackMocName = ""): JointRecordPayload {
  return {
    moc: record.moc.trim(),
    mocName: (record.mocName || fallbackMocName).trim(),
    sizeInches: record.sizeInches.trim(),
    pipeSchedule: record.pipeSchedule.trim(),
    thickness: Math.max(0, Math.trunc(toNumber(record.thickness))),
    shopJoints: Math.max(0, Math.trunc(toNumber(record.shopJoints))),
    fieldJoints: Math.max(0, Math.trunc(toNumber(record.fieldJoints))),
  };
}

export function validateJointRecordPayload(payload: JointRecordPayload) {
  if (!payload.moc) return "Choose a MOC before saving this row.";
  if (!payload.mocName) return "The selected MOC needs a project name.";
  if (!payload.sizeInches) return "Pipe size is required.";
  if (toNumber(payload.shopJoints) <= 0 && toNumber(payload.fieldJoints) <= 0) {
    return "Enter shop joints or field joints before saving this row.";
  }

  return null;
}

export function addSetValue<T>(set: Set<T>, value: T) {
  const nextSet = new Set(set);
  nextSet.add(value);
  return nextSet;
}

export function deleteSetValue<T>(set: Set<T>, value: T) {
  const nextSet = new Set(set);
  nextSet.delete(value);
  return nextSet;
}

export function formatNumber(value: number) {
  return Math.round(toNumber(value)).toLocaleString();
}

export function getPercent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((toNumber(value) / total) * 100);
}
