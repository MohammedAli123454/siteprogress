"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useJointRecordCollection } from "../data/useJointRecordCollection";
import { useMocCollection } from "../data/useMocCollection";
import { createJointRecord, updateJointRecord } from "../data/client-api";
import {
  addSetValue,
  deleteSetValue,
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
import type { JointRecord, JointRecordPayload } from "../domain/types";
import { exportPipeSummaryWorkbook } from "../export/excel-export";

type PersistedTransaction = {
  isPersisted: {
    promise: Promise<unknown>;
  };
};

export function useJointInchDiaEditor() {
  const queryClient = useQueryClient();
  const nextTempId = useRef(-1);
  const saveTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const draftRowsRef = useRef<JointRecord[]>([]);
  const pendingDraftSaveIds = useRef<Set<number>>(new Set());

  const [selectedMoc, setSelectedMoc] = useState(ALL_MOCS);
  const [deleteTarget, setDeleteTarget] = useState<JointRecord | null>(null);
  const [draftRows, setDraftRows] = useState<JointRecord[]>([]);
  const [dirtyRowIds, setDirtyRowIds] = useState<Set<number>>(new Set());
  const [savingRowIds, setSavingRowIds] = useState<Set<number>>(new Set());
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

  useEffect(() => {
    draftRowsRef.current = draftRows;
  }, [draftRows]);

  useEffect(
    () => () => {
      saveTimers.current.forEach((timer) => clearTimeout(timer));
      saveTimers.current.clear();
    },
    []
  );

  const collectionRowIds = useMemo(
    () => new Set(collectionRows.map((record) => record.id)),
    [collectionRows]
  );

  const visibleRows = useMemo(
    () => [
      ...collectionRows,
      ...draftRows.filter((record) => !collectionRowIds.has(record.id)),
    ],
    [collectionRowIds, collectionRows, draftRows]
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

  const totals = useMemo(() => getRecordTotals(filteredRecords), [filteredRecords]);
  const consolidatedRows = useMemo(
    () => getConsolidatedPipeRows(filteredRecords),
    [filteredRecords]
  );

  const isAllMocsView = selectedMoc === ALL_MOCS;
  const footerLabelColSpan = 3;
  const tableSummary = useMemo(
    () => getPipeTableSummary(selectedMoc, isAllMocsView, mocNameByCode),
    [isAllMocsView, mocNameByCode, selectedMoc]
  );
  const visibleTableRowCount = isAllMocsView ? consolidatedRows.length : filteredRecords.length;

  function getMocName(moc: string) {
    return mocNameByCode.get(moc) || "";
  }

  function markDirty(id: number) {
    setDirtyRowIds((previous) => addSetValue(previous, id));
  }

  function clearAutoSave(id: number) {
    const existingTimer = saveTimers.current.get(id);

    if (existingTimer) {
      clearTimeout(existingTimer);
      saveTimers.current.delete(id);
    }
  }

  function scheduleAutoSave(id: number) {
    clearAutoSave(id);

    const timer = setTimeout(() => {
      saveTimers.current.delete(id);
      const latestRecord = draftRowsRef.current.find((record) => record.id === id);

      if (latestRecord) {
        persistDraftRow(latestRecord);
      }
    }, 800);

    saveTimers.current.set(id, timer);
  }

  function trackPersistedTransaction(
    rowId: number,
    transaction: PersistedTransaction,
    options: {
      invalidateJointRecordsOnPersist?: boolean;
      invalidateSummaryOnPersist?: boolean;
      removeDraft?: boolean;
    } = {}
  ) {
    setSavingRowIds((previous) => addSetValue(previous, rowId));
    markDirty(rowId);

    void transaction.isPersisted.promise
      .then(() => {
        if (options.removeDraft) {
          setDraftRows((currentRows) => currentRows.filter((row) => row.id !== rowId));
        }

        if (options.invalidateJointRecordsOnPersist) {
          queryClient.invalidateQueries({ queryKey: ["joint-records"] });
        }

        if (options.invalidateSummaryOnPersist) {
          queryClient.invalidateQueries({ queryKey: ["allMocsJointsData"] });
        }
      })
      .catch((saveError) => {
        console.error("Failed to persist joint record transaction:", saveError);
      })
      .finally(() => {
        setDirtyRowIds((previous) => deleteSetValue(previous, rowId));
        setSavingRowIds((previous) => deleteSetValue(previous, rowId));
      });
  }

  function updateRow(id: number, updater: (record: JointRecord) => void) {
    if (isNewRecord(id)) {
      setDraftRows((currentRows) =>
        currentRows.map((row) => {
          if (row.id !== id) return row;

          const updatedRow = { ...row };
          updater(updatedRow);
          return recalculateRecord(updatedRow);
        })
      );
      markDirty(id);
      scheduleAutoSave(id);
      return;
    }

    if (!recordsCollection.has(id)) return;

    const transaction = recordsCollection.update(id, (draft) => {
      updater(draft);
      Object.assign(draft, recalculateRecord(draft));
    });
    trackPersistedTransaction(id, transaction);
  }

  async function persistDraftRow(record: JointRecord) {
    clearAutoSave(record.id);

    if (pendingDraftSaveIds.current.has(record.id)) return;

    const payload = getJointRecordPayload(record, getMocName(record.moc));
    const rowError = validateJointRecordPayload(payload);

    if (rowError) return;

    pendingDraftSaveIds.current.add(record.id);
    setSavingRowIds((previous) => addSetValue(previous, record.id));
    markDirty(record.id);

    try {
      let persistedRecord = await createJointRecord(payload);
      let persistedPayload = payload;

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const latestRecord = draftRowsRef.current.find((row) => row.id === record.id);

        if (!latestRecord) break;

        const latestPayload = getJointRecordPayload(latestRecord, getMocName(latestRecord.moc));
        const latestRowError = validateJointRecordPayload(latestPayload);

        if (latestRowError || areJointRecordPayloadsEqual(persistedPayload, latestPayload)) {
          break;
        }

        persistedRecord = await updateJointRecord(persistedRecord.id, latestPayload);
        persistedPayload = latestPayload;
      }

      recordsCollection.utils.writeUpsert(persistedRecord);
      setDraftRows((currentRows) => currentRows.filter((row) => row.id !== record.id));
      queryClient.invalidateQueries({ queryKey: ["allMocsJointsData"] });
    } catch (saveError) {
      console.error("Failed to create joint record:", saveError);
    } finally {
      pendingDraftSaveIds.current.delete(record.id);
      setDirtyRowIds((previous) => deleteSetValue(previous, record.id));
      setSavingRowIds((previous) => deleteSetValue(previous, record.id));
    }
  }

  function handleDiscardRow(record: JointRecord) {
    clearAutoSave(record.id);

    if (isNewRecord(record.id)) {
      setDraftRows((currentRows) => currentRows.filter((row) => row.id !== record.id));
    }

    setDirtyRowIds((previous) => deleteSetValue(previous, record.id));
  }

  function handleAddRow(mocOverride?: string) {
    const targetMoc = mocOverride || (selectedMoc !== ALL_MOCS ? selectedMoc : "");

    if (!targetMoc) {
      setIsMocDialogOpen(true);
      return;
    }

    const lowestExistingId = Math.min(
      0,
      ...draftRowsRef.current.map((record) => record.id),
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
    setSelectedMoc(targetMoc);
    setDirtyRowIds((previous) => addSetValue(previous, tempId));
  }

  function handleDeleteRow(record: JointRecord) {
    clearAutoSave(record.id);

    if (isNewRecord(record.id)) {
      handleDiscardRow(record);
      return;
    }

    setDeleteTarget(record);
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;

    const rowId = deleteTarget.id;
    const transaction = recordsCollection.delete(rowId);

    setDeleteTarget(null);
    trackPersistedTransaction(rowId, transaction, { invalidateSummaryOnPersist: true });
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
      setSelectedMoc(moc.moc);
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
        filteredRecords,
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
    setSelectedMoc,
    deleteTarget,
    closeDeleteDialog: () => setDeleteTarget(null),
    dirtyRowIds,
    savingRowIds,
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
    handleExportToExcel,
  };
}

function areJointRecordPayloadsEqual(first: JointRecordPayload, second: JointRecordPayload) {
  return (
    first.moc === second.moc &&
    first.mocName === second.mocName &&
    first.sizeInches === second.sizeInches &&
    first.pipeSchedule === second.pipeSchedule &&
    first.thickness === second.thickness &&
    first.shopJoints === second.shopJoints &&
    first.fieldJoints === second.fieldJoints
  );
}
