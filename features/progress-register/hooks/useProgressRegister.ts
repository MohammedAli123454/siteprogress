"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useMocCollection } from "@/features/joint-inch-dia/data/useMocCollection";
import type { MocOption } from "@/features/joint-inch-dia/domain/types";

import { saveProgressReport } from "../data/client-api";
import { useProgressRegisterCollection } from "../data/useProgressRegisterCollection";
import {
  getMocProgressSummaries,
  getPreviousJoints,
  getProgressTotals,
  getRemainingJoints,
  getScopeJoints,
  toNumber,
} from "../domain/calculations";
import { ALL_MOCS } from "../domain/constants";
import type { ProgressRegisterRow, ProgressScope } from "../domain/types";

type ProgressLimitWarning = {
  balanceJoints: number;
  enteredJoints: number;
};

export function useProgressRegister() {
  const queryClient = useQueryClient();
  const [selectedMoc, setSelectedMoc] = useState(ALL_MOCS);
  const [progressScope, setProgressScope] = useState<ProgressScope>("SHOP");
  const [reportDate, setReportDate] = useState(getTodayDateInputValue());
  const [remarks, setRemarks] = useState("");
  const [draftProgress, setDraftProgress] = useState<Map<number, number>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [progressLimitWarning, setProgressLimitWarning] =
    useState<ProgressLimitWarning | null>(null);

  const {
    rows,
    isLoading: isRowsLoading,
    isError: isRowsError,
    error: rowsError,
  } = useProgressRegisterCollection();
  const { mocRows, isLoading: isMocsLoading } = useMocCollection();

  useEffect(() => {
    setDraftProgress(new Map());
    setMessage(null);
    setProgressLimitWarning(null);
  }, [progressScope, selectedMoc]);

  const mocOptions = useMemo(() => getMocOptions(mocRows, rows), [mocRows, rows]);

  const mocNameByCode = useMemo(
    () => new Map(mocOptions.map((moc) => [moc.moc, moc.mocName])),
    [mocOptions]
  );

  const filteredRows = useMemo(() => {
    if (selectedMoc === ALL_MOCS) return rows;
    return rows.filter((row) => row.moc === selectedMoc);
  }, [rows, selectedMoc]);

  const visibleRows = useMemo(
    () =>
      [...filteredRows].sort((first, second) => {
        const sizeDifference = toNumber(first.sizeInches) - toNumber(second.sizeInches);
        if (sizeDifference) return sizeDifference;

        const thicknessDifference = first.thickness - second.thickness;
        if (thicknessDifference) return thicknessDifference;

        return first.pipeSchedule.localeCompare(second.pipeSchedule);
      }),
    [filteredRows]
  );

  const totals = useMemo(
    () => getProgressTotals(visibleRows, progressScope, draftProgress),
    [draftProgress, progressScope, visibleRows]
  );

  const mocSummaries = useMemo(
    () => getMocProgressSummaries(rows, progressScope),
    [progressScope, rows]
  );

  const selectedMocName = selectedMoc === ALL_MOCS
    ? "All MOC Names"
    : mocNameByCode.get(selectedMoc) || "No project name";

  const hasDraftProgress = Array.from(draftProgress.values()).some((value) => value > 0);
  const isAllMocsView = selectedMoc === ALL_MOCS;
  const isLoading = isRowsLoading || isMocsLoading;
  const isError = isRowsError;

  function handleProgressChange(row: ProgressRegisterRow, value: string) {
    const requestedValue = Math.max(0, Math.trunc(toNumber(value)));
    const remainingJoints = getRemainingJoints(row, progressScope);

    if (requestedValue > remainingJoints) {
      setProgressLimitWarning({
        balanceJoints: remainingJoints,
        enteredJoints: requestedValue,
      });
      return;
    }

    setDraftProgress((currentValues) => {
      const nextValues = new Map(currentValues);

      if (requestedValue > 0) {
        nextValues.set(row.jointRecordId, requestedValue);
      } else {
        nextValues.delete(row.jointRecordId);
      }

      return nextValues;
    });
  }

  async function handleSaveProgress() {
    if (selectedMoc === ALL_MOCS || !hasDraftProgress) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const lines = visibleRows
        .map((row) => ({
          jointRecordId: row.jointRecordId,
          progressJoints: Math.max(0, Math.trunc(toNumber(draftProgress.get(row.jointRecordId)))),
        }))
        .filter((line) => line.progressJoints > 0);

      const result = await saveProgressReport({
        moc: selectedMoc,
        progressScope,
        reportDate,
        remarks,
        lines,
      });

      setDraftProgress(new Map());
      setMessage(`Saved ${result.savedLineCount} progress row${result.savedLineCount === 1 ? "" : "s"}.`);
      await queryClient.invalidateQueries({ queryKey: ["progress-register-rows"] });
    } catch (saveError) {
      const errorMessage =
        saveError instanceof Error ? saveError.message : "Progress save failed.";
      setMessage(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }

  return {
    selectedMoc,
    setSelectedMoc,
    selectedMocName,
    progressScope,
    setProgressScope,
    reportDate,
    setReportDate,
    remarks,
    setRemarks,
    mocOptions,
    visibleRows,
    mocSummaries,
    totals,
    draftProgress,
    hasDraftProgress,
    isAllMocsView,
    isLoading,
    isError,
    error: rowsError,
    isSaving,
    message,
    progressLimitWarning,
    dismissProgressLimitWarning: () => setProgressLimitWarning(null),
    getScopeJoints: (row: ProgressRegisterRow) => getScopeJoints(row, progressScope),
    getPreviousJoints: (row: ProgressRegisterRow) => getPreviousJoints(row, progressScope),
    getRemainingJoints: (row: ProgressRegisterRow) => getRemainingJoints(row, progressScope),
    handleProgressChange,
    handleSaveProgress,
  };
}

function getMocOptions(mocs: MocOption[], rows: ProgressRegisterRow[]) {
  const options = new Map<string, MocOption>();

  mocs.forEach((moc) => {
    if (moc.moc) options.set(moc.moc, moc);
  });

  rows.forEach((row) => {
    if (row.moc && !options.has(row.moc)) {
      options.set(row.moc, { moc: row.moc, mocName: row.mocName });
    }
  });

  return Array.from(options.values()).sort((first, second) =>
    first.mocName.localeCompare(second.mocName)
  );
}

function getTodayDateInputValue() {
  const today = new Date();
  const timezoneOffsetMs = today.getTimezoneOffset() * 60 * 1000;
  return new Date(today.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
}
