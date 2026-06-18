import { parsePipeSize } from "@/features/joint-inch-dia/domain/pipe-size";

import type {
  MocProgressSummary,
  ProgressRegisterRow,
  ProgressScope,
  ProgressTotals,
} from "./types";

export const toNumber = (value: number | string | null | undefined) => Number(value || 0);

export function getScopeJoints(row: ProgressRegisterRow, scope: ProgressScope) {
  return scope === "SHOP" ? toNumber(row.shopJoints) : toNumber(row.fieldJoints);
}

export function getPreviousJoints(row: ProgressRegisterRow, scope: ProgressScope) {
  return scope === "SHOP" ? toNumber(row.shopProgressJoints) : toNumber(row.fieldProgressJoints);
}

export function getPipeSizeValue(row: ProgressRegisterRow) {
  return parsePipeSize(row.sizeInches);
}

export function getRemainingJoints(
  row: ProgressRegisterRow,
  scope: ProgressScope,
  draftProgress = 0
) {
  return Math.max(0, getScopeJoints(row, scope) - getPreviousJoints(row, scope) - draftProgress);
}

export function getRowPercent(doneJoints: number, scopeJoints: number) {
  if (!scopeJoints) return 0;
  return Math.min(100, Math.round((doneJoints / scopeJoints) * 100));
}

export function getProgressTotals(
  rows: ProgressRegisterRow[],
  scope: ProgressScope,
  draftProgressByRecordId: Map<number, number>
): ProgressTotals {
  return rows.reduce<ProgressTotals>(
    (totals, row) => {
      const scopeJoints = getScopeJoints(row, scope);
      const previousJoints = getPreviousJoints(row, scope);
      const newProgressJoints = toNumber(draftProgressByRecordId.get(row.jointRecordId));
      const sizeValue = getPipeSizeValue(row);
      const totalDoneJoints = previousJoints + newProgressJoints;

      totals.scopeJoints += scopeJoints;
      totals.scopeInchDia += scopeJoints * sizeValue;
      totals.previousJoints += previousJoints;
      totals.newProgressJoints += newProgressJoints;
      totals.totalDoneJoints += totalDoneJoints;
      totals.balanceJoints += Math.max(0, scopeJoints - totalDoneJoints);
      totals.newProgressInchDia += newProgressJoints * sizeValue;
      totals.totalDoneInchDia += totalDoneJoints * sizeValue;

      return totals;
    },
    {
      scopeJoints: 0,
      scopeInchDia: 0,
      previousJoints: 0,
      newProgressJoints: 0,
      totalDoneJoints: 0,
      balanceJoints: 0,
      newProgressInchDia: 0,
      totalDoneInchDia: 0,
    }
  );
}

export function getMocProgressSummaries(
  rows: ProgressRegisterRow[],
  scope: ProgressScope
): MocProgressSummary[] {
  const rowsByMoc = new Map<string, ProgressRegisterRow[]>();

  rows.forEach((row) => {
    const existingRows = rowsByMoc.get(row.moc) ?? [];
    existingRows.push(row);
    rowsByMoc.set(row.moc, existingRows);
  });

  return Array.from(rowsByMoc.entries())
    .map(([moc, mocRows]) => {
      const totals = getProgressTotals(mocRows, scope, new Map());
      return {
        ...totals,
        moc,
        mocName: mocRows[0]?.mocName || "",
      };
    })
    .sort((first, second) => first.moc.localeCompare(second.moc));
}

export function formatNumber(value: number) {
  return Math.round(toNumber(value)).toLocaleString();
}

export function getPercent(value: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((toNumber(value) / total) * 100));
}
