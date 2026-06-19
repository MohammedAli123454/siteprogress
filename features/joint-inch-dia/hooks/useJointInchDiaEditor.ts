"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useJointRecordCollection } from "../data/useJointRecordCollection";
import { useMocCollection } from "../data/useMocCollection";
import {
  JointRecordBatchClientError,
  saveJointRecordBatch,
} from "../data/client-api";
import {
  filterJointRecords,
  getConsolidatedPipeRows,
  getJointRecordPayload,
  getMocOptions,
  getPipeTableSummary,
  getRecordTotals,
  isNewRecord,
  makeLocalRecord,
  recalculateRecord,
  validateJointRecordPayload,
} from "../domain/calculations";
import { ALL_MOCS } from "../domain/constants";
import type { JointRecord, JointRecordBatchPayload } from "../domain/types";
import { exportPipeSummaryWorkbook } from "../export/excel-export";

const editableFields = [
  "sizeInches",
  "thickness",
  "pipeSchedule",
  "shopJoints",
  "fieldJoints",
] as const;

type EditableField = (typeof editableFields)[number];

type TransactionNotice = {
  id: number;
  message: string;
  tone: "success" | "error";
};

export function useJointInchDiaEditor() {
  const queryClient = useQueryClient();
  const nextTempId = useRef(-1);

  const [selectedMoc, setSelectedMocState] = useState(ALL_MOCS);
  const [deleteTarget, setDeleteTarget] = useState<JointRecord | null>(null);
  const [draftRows, setDraftRows] = useState<JointRecord[]>([]);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<number>>(new Set());
  const [rowErrors, setRowErrors] = useState<Map<number, string>>(new Map());
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  const [transactionNotice, setTransactionNotice] = useState<TransactionNotice | null>(null);
  const [isMocDialogOpen, setIsMocDialogOpen] = useState(false);
  const [isSavingMoc, setIsSavingMoc] = useState(false);
  const [mocErrorMessage, setMocErrorMessage] = useState<string | undefined>();
  const [isExporting, setIsExporting] = useState(false);

  const {
    collectionRows,
    recordsCollection,
    isLoading,
    isError,
    error,
  } = useJointRecordCollection();

  const { mocRows, mocsCollection } = useMocCollection();

  const collectionRowsById = useMemo(
    () => new Map(collectionRows.map((record) => [record.id, record])),
    [collectionRows]
  );

  const collectionRowIds = useMemo(
    () => new Set(collectionRows.map((record) => record.id)),
    [collectionRows]
  );

  const draftRowsById = useMemo(
    () => new Map(draftRows.map((record) => [record.id, record])),
    [draftRows]
  );

  const visibleRows = useMemo(
    () => [
      ...collectionRows.map((record) => draftRowsById.get(record.id) ?? record),
      ...draftRows.filter((record) => !collectionRowIds.has(record.id)),
    ],
    [collectionRowIds, collectionRows, draftRows, draftRowsById]
  );

  const mocOptions = useMemo(
    () => getMocOptions(mocRows, visibleRows),
    [mocRows, visibleRows]
  );

  const mocNameByCode = useMemo(
    () => new Map(mocOptions.map((moc) => [moc.moc, moc.mocName])),
    [mocOptions]
  );

  const filteredRecords = useMemo(() => {
    const records = filterJointRecords(visibleRows, selectedMoc);

    return [...records].sort((first, second) => {
      return Number(isNewRecord(first.id)) - Number(isNewRecord(second.id));
    });
  }, [visibleRows, selectedMoc]);

  const activeFilteredRecords = useMemo(
    () => filteredRecords.filter((record) => !pendingDeleteIds.has(record.id)),
    [filteredRecords, pendingDeleteIds]
  );

  const totals = useMemo(() => getRecordTotals(activeFilteredRecords), [activeFilteredRecords]);
  const consolidatedRows = useMemo(
    () => getConsolidatedPipeRows(activeFilteredRecords),
    [activeFilteredRecords]
  );

  const dirtyRowIds = useMemo(
    () => new Set([...draftRows.map((record) => record.id), ...pendingDeleteIds]),
    [draftRows, pendingDeleteIds]
  );

  const changedCellKeys = useMemo(
    () => getChangedCellKeys(draftRows, collectionRowsById),
    [collectionRowsById, draftRows]
  );

  const isAllMocsView = selectedMoc === ALL_MOCS;
  const footerLabelColSpan = 3;
  const tableSummary = useMemo(
    () => getPipeTableSummary(selectedMoc, isAllMocsView, mocNameByCode),
    [isAllMocsView, mocNameByCode, selectedMoc]
  );
  const visibleTableRowCount = isAllMocsView
    ? consolidatedRows.length
    : activeFilteredRecords.length;
  const unsavedChangeCount = draftRows.length + pendingDeleteIds.size;
  const hasUnsavedChanges = unsavedChangeCount > 0;

  useEffect(() => {
    if (!transactionNotice) return;

    const timer = setTimeout(() => setTransactionNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [transactionNotice]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  function getMocName(moc: string) {
    return mocNameByCode.get(moc) || "";
  }

  function showTransactionNotice(message: string, tone: TransactionNotice["tone"]) {
    setTransactionNotice({
      id: Date.now(),
      message,
      tone,
    });
  }

  function clearDraftState() {
    setDraftRows([]);
    setPendingDeleteIds(new Set());
    setRowErrors(new Map());
  }

  function clearRowError(id: number) {
    setRowErrors((currentErrors) => {
      if (!currentErrors.has(id)) return currentErrors;

      const nextErrors = new Map(currentErrors);
      nextErrors.delete(id);
      return nextErrors;
    });
  }

  function handleMocChange(value: string) {
    if (value === selectedMoc) return;

    if (hasUnsavedChanges) {
      const shouldDiscard = window.confirm(
        "Switching MOC will discard unsaved BOQ changes. Continue?"
      );

      if (!shouldDiscard) return;
      clearDraftState();
    }

    setSelectedMocState(value);
  }

  function updateRow(id: number, updater: (record: JointRecord) => void) {
    if (pendingDeleteIds.has(id)) return;

    setDraftRows((currentRows) => {
      const currentDraft = currentRows.find((row) => row.id === id);
      const sourceRow = currentDraft ?? collectionRowsById.get(id);

      if (!sourceRow) return currentRows;

      const updatedRow = recalculateRecord(applyRowUpdate(sourceRow, updater));

      if (isNewRecord(id)) {
        return upsertDraftRow(currentRows, updatedRow);
      }

      const baseRow = collectionRowsById.get(id);

      if (!baseRow) return currentRows;

      if (areJointRecordsEqual(baseRow, updatedRow)) {
        return currentRows.filter((row) => row.id !== id);
      }

      return upsertDraftRow(currentRows, updatedRow);
    });

    clearRowError(id);
    setTransactionNotice(null);
  }

  function handleAddRow(mocOverride?: string) {
    const targetMoc = mocOverride || (selectedMoc !== ALL_MOCS ? selectedMoc : "");

    if (!targetMoc) {
      setIsMocDialogOpen(true);
      return;
    }

    const lowestExistingId = Math.min(
      0,
      ...draftRows.map((record) => record.id),
      ...collectionRows.map((record) => record.id)
    );

    if (nextTempId.current >= lowestExistingId) {
      nextTempId.current = lowestExistingId - 1;
    }

    const tempId = nextTempId.current;
    nextTempId.current -= 1;

    const record = makeLocalRecord(tempId, {
      moc: targetMoc,
      mocName: getMocName(targetMoc),
      sizeInches: "",
      pipeSchedule: "",
      thickness: 0,
      shopJoints: 0,
      fieldJoints: 0,
    });

    setDraftRows((currentRows) => [...currentRows, record]);
    setSelectedMocState(targetMoc);
    setTransactionNotice(null);
  }

  function handleDeleteRow(record: JointRecord) {
    if (pendingDeleteIds.has(record.id)) {
      setPendingDeleteIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(record.id);
        return nextIds;
      });
      clearRowError(record.id);
      setTransactionNotice(null);
      return;
    }

    if (isNewRecord(record.id)) {
      setDraftRows((currentRows) => currentRows.filter((row) => row.id !== record.id));
      clearRowError(record.id);
      return;
    }

    setDeleteTarget(record);
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;

    const rowId = deleteTarget.id;

    setDraftRows((currentRows) => currentRows.filter((row) => row.id !== rowId));
    setPendingDeleteIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(rowId);
      return nextIds;
    });
    clearRowError(rowId);
    setTransactionNotice(null);
    setDeleteTarget(null);
  }

  function handleDiscardChanges() {
    if (!hasUnsavedChanges) return;

    clearDraftState();
    showTransactionNotice("Unsaved changes discarded.", "success");
  }

  async function handleSaveChanges() {
    if (!hasUnsavedChanges || isSavingChanges) return;

    const { payload, errors } = getBatchPayload({
      draftRows,
      pendingDeleteIds,
      getMocName,
    });

    if (errors.size) {
      setRowErrors(errors);
      showTransactionNotice("Resolve highlighted row errors before saving.", "error");
      return;
    }

    setIsSavingChanges(true);
    setRowErrors(new Map());

    try {
      const savedRows = await saveJointRecordBatch(payload);

      savedRows.forEach((record) => recordsCollection.utils.writeUpsert(record));
      pendingDeleteIds.forEach((id) => recordsCollection.utils.writeDelete(id));

      clearDraftState();
      showTransactionNotice("Changes saved.", "success");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["joint-records"] }),
        queryClient.invalidateQueries({ queryKey: ["allMocsJointsData"] }),
        queryClient.invalidateQueries({ queryKey: ["progress-register-rows"] }),
      ]);
    } catch (saveError) {
      if (saveError instanceof JointRecordBatchClientError) {
        setRowErrors(getRowErrorMap(saveError.rowErrors));
        showTransactionNotice(saveError.message, "error");
      } else {
        showTransactionNotice(
          saveError instanceof Error ? saveError.message : "Failed to save BOQ changes.",
          "error"
        );
      }
    } finally {
      setIsSavingChanges(false);
    }
  }

  async function handleCreateMoc(value: { moc: string; mocName: string }) {
    const moc = {
      moc: value.moc.trim(),
      mocName: value.mocName.trim(),
    };

    setIsSavingMoc(true);
    setMocErrorMessage(undefined);

    try {
      const transaction = mocsCollection.has(moc.moc)
        ? mocsCollection.update(moc.moc, (draft) => {
            draft.mocName = moc.mocName;
          })
        : mocsCollection.insert(moc);

      await transaction.isPersisted.promise;
      setSelectedMocState(moc.moc);
      setIsMocDialogOpen(false);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "MOC save failed.";
      setMocErrorMessage(message);
      throw saveError;
    } finally {
      setIsSavingMoc(false);
    }
  }

  async function handleExportToExcel() {
    if (!visibleTableRowCount) return;

    setIsExporting(true);

    try {
      await exportPipeSummaryWorkbook({
        isAllMocsView,
        consolidatedRows,
        filteredRecords: activeFilteredRecords,
        totals,
        tableSummary,
      });
    } catch (exportError) {
      console.error("Failed to export Excel workbook:", exportError);
      window.alert("Excel export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  return {
    selectedMoc,
    setSelectedMoc: handleMocChange,
    deleteTarget,
    closeDeleteDialog: () => setDeleteTarget(null),
    dirtyRowIds,
    changedCellKeys,
    pendingDeleteIds,
    rowErrors,
    isSavingChanges,
    hasUnsavedChanges,
    unsavedChangeCount,
    transactionNotice,
    isMocDialogOpen,
    setIsMocDialogOpen,
    isSavingMoc,
    mocErrorMessage,
    isExporting,
    mocOptions,
    filteredRecords,
    consolidatedRows,
    totals,
    isAllMocsView,
    footerLabelColSpan,
    tableSummary,
    visibleTableRowCount,
    isLoading,
    isError,
    error,
    handleCreateMoc,
    handleAddRow,
    updateRow,
    handleDeleteRow,
    handleConfirmDelete,
    handleDiscardChanges,
    handleSaveChanges,
    handleExportToExcel,
  };
}

function applyRowUpdate(record: JointRecord, updater: (record: JointRecord) => void) {
  const updatedRow = { ...record };
  updater(updatedRow);
  return updatedRow;
}

function upsertDraftRow(rows: JointRecord[], record: JointRecord) {
  const existingIndex = rows.findIndex((row) => row.id === record.id);

  if (existingIndex === -1) return [...rows, record];

  return rows.map((row) => (row.id === record.id ? record : row));
}

function getBatchPayload({
  draftRows,
  pendingDeleteIds,
  getMocName,
}: {
  draftRows: JointRecord[];
  pendingDeleteIds: Set<number>;
  getMocName: (moc: string) => string;
}) {
  const errors = new Map<number, string>();
  const payload: JointRecordBatchPayload = {
    create: [],
    update: [],
    deleteIds: Array.from(pendingDeleteIds),
  };

  draftRows.forEach((record) => {
    const recordPayload = getJointRecordPayload(record, getMocName(record.moc));
    const rowError = validateJointRecordPayload(recordPayload);

    if (rowError) {
      errors.set(record.id, rowError);
      return;
    }

    if (isNewRecord(record.id)) {
      payload.create.push({ ...recordPayload, clientId: record.id });
      return;
    }

    payload.update.push({ ...recordPayload, id: record.id });
  });

  return { payload, errors };
}

function getChangedCellKeys(
  draftRows: JointRecord[],
  collectionRowsById: Map<number, JointRecord>
) {
  const keys = new Set<string>();

  draftRows.forEach((record) => {
    const baseRow = collectionRowsById.get(record.id);

    editableFields.forEach((field) => {
      if (!baseRow || !areEditableValuesEqual(field, baseRow[field], record[field])) {
        keys.add(`${record.id}:${field}`);
      }
    });
  });

  return keys;
}

function getRowErrorMap(rowErrors: Record<string, string>) {
  const errors = new Map<number, string>();

  Object.entries(rowErrors).forEach(([key, message]) => {
    const rowId = key.startsWith("new:") ? Number(key.replace("new:", "")) : Number(key);

    if (Number.isFinite(rowId)) {
      errors.set(rowId, message);
    }
  });

  return errors;
}

function areJointRecordsEqual(first: JointRecord, second: JointRecord) {
  return editableFields.every((field) => areEditableValuesEqual(field, first[field], second[field]));
}

function areEditableValuesEqual(
  field: EditableField,
  first: JointRecord[EditableField],
  second: JointRecord[EditableField]
) {
  if (field === "sizeInches" || field === "pipeSchedule") {
    return String(first || "").trim() === String(second || "").trim();
  }

  return Number(first || 0) === Number(second || 0);
}
