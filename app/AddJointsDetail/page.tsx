"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Worksheet } from "exceljs";
import { createCollection, localOnlyCollectionOptions } from "@tanstack/db";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  FilePlus2,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  JointRecord,
  JointRecordPayload,
  MocOption,
  MocPayload,
} from "@/lib/joint-record-types";
import { parsePipeSize } from "@/lib/pipe-size";

const ALL_MOCS = "__all_mocs__";
const toNumber = (value: number | string | null | undefined) => Number(value || 0);
const isNewRecord = (id: number) => id < 0;

type RecordTotals = {
  shopJoints: number;
  fieldJoints: number;
  totalJoints: number;
  shopInchDia: number;
  fieldInchDia: number;
  totalInchDia: number;
};

type ConsolidatedPipeRow = RecordTotals & {
  key: string;
  sizeInches: string;
  sizeSortValue: number;
  thickness: number;
  pipeSchedule: string;
};

type ExportCell = string | number;

type PipeLookupTarget = {
  sizeInches: string;
  pipeSchedule: string;
};

type PipeScheduleLookupRow = {
  id: number;
  standardCode: string;
  standardName: string;
  materialGroup: string;
  unit: string;
  nps: string;
  npsDecimal: number;
  outsideDiameterIn: number;
  schedule: string;
  wallThicknessIn: number;
  insideDiameterIn: number;
  sourceSheet: string;
  sourceRowNumber: number | null;
};

type PipeScheduleLookupResponse = {
  data: PipeScheduleLookupRow[];
  availableSchedules: string[];
  lookup: {
    size: string;
    sizeDecimal: number;
    schedule: string;
    scheduleCandidates: string[];
  };
};

const emptyMocValues: MocPayload = {
  moc: "",
  mocName: "",
};

const pipeExportColumns = [
  "Size",
  "Thk",
  "Schedule",
  "Shop Joints",
  "Field Joints",
  "Total Joints",
  "Shop Inch Dia",
  "Field Inch Dia",
  "Total Inch Dia",
];

const getEmptyTotals = (): RecordTotals => ({
  shopJoints: 0,
  fieldJoints: 0,
  totalJoints: 0,
  shopInchDia: 0,
  fieldInchDia: 0,
  totalInchDia: 0,
});

const addRecordToTotals = (totals: RecordTotals, record: JointRecord): RecordTotals => ({
  shopJoints: totals.shopJoints + toNumber(record.shopJoints),
  fieldJoints: totals.fieldJoints + toNumber(record.fieldJoints),
  totalJoints: totals.totalJoints + toNumber(record.totalJoints),
  shopInchDia: totals.shopInchDia + toNumber(record.shopInchDia),
  fieldInchDia: totals.fieldInchDia + toNumber(record.fieldInchDia),
  totalInchDia: totals.totalInchDia + toNumber(record.totalInchDia),
});

const getDerivedMetrics = (values: Pick<JointRecordPayload, "sizeInches" | "shopJoints" | "fieldJoints">) => {
  const size = parsePipeSize(values.sizeInches);
  const shopJoints = Math.max(0, Math.trunc(toNumber(values.shopJoints)));
  const fieldJoints = Math.max(0, Math.trunc(toNumber(values.fieldJoints)));
  const shopInchDia = size * shopJoints;
  const fieldInchDia = size * fieldJoints;

  return {
    shopJoints,
    fieldJoints,
    totalJoints: shopJoints + fieldJoints,
    shopInchDia,
    fieldInchDia,
    totalInchDia: shopInchDia + fieldInchDia,
  };
};

const recalculateRecord = (record: JointRecord): JointRecord => ({
  ...record,
  thickness: Math.max(0, Math.trunc(toNumber(record.thickness))),
  ...getDerivedMetrics(record),
});

const makeLocalRecord = (id: number, payload: JointRecordPayload): JointRecord =>
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

const normalizeRecord = (record: JointRecord): JointRecord => recalculateRecord(record);

async function fetchJointRecords() {
  const response = await fetch("/api/joint-records", { cache: "no-store" });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || "Failed to load joint records.");
  }

  return (payload.data ?? []) as JointRecord[];
}

async function fetchMocs() {
  const response = await fetch("/api/mocs", { cache: "no-store" });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || "Failed to load MOC list.");
  }

  return (payload.data ?? []) as MocOption[];
}

async function fetchPipeScheduleLookup(target: PipeLookupTarget) {
  const searchParams = new URLSearchParams({
    size: target.sizeInches,
    schedule: target.pipeSchedule,
  });
  const response = await fetch(`/api/pipe-schedule-lookup?${searchParams.toString()}`, {
    cache: "no-store",
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || "Failed to load pipe schedule details.");
  }

  return payload as PipeScheduleLookupResponse;
}

async function saveMoc(payload: MocPayload) {
  const response = await fetch("/api/mocs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Failed to save MOC.");
  }

  return data.data as MocOption;
}

async function createJointRecord(payload: JointRecordPayload) {
  const response = await fetch("/api/joint-records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Failed to create joint record.");
  }

  return data.data as JointRecord;
}

async function updateJointRecord(id: number, payload: JointRecordPayload) {
  const response = await fetch("/api/joint-records", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...payload }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Failed to update joint record.");
  }

  return data.data as JointRecord;
}

async function deleteJointRecord(id: number) {
  const response = await fetch(`/api/joint-records?id=${id}`, {
    method: "DELETE",
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Failed to delete joint record.");
  }

  return id;
}

export default function AddJointsDetail() {
  const queryClient = useQueryClient();
  const nextTempId = useRef(-1);
  const saveTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMoc, setSelectedMoc] = useState(ALL_MOCS);
  const [deleteTarget, setDeleteTarget] = useState<JointRecord | null>(null);
  const [collectionRows, setCollectionRows] = useState<JointRecord[]>([]);
  const [dirtyRowIds, setDirtyRowIds] = useState<Set<number>>(new Set());
  const [savingRowIds, setSavingRowIds] = useState<Set<number>>(new Set());
  const [isMocDialogOpen, setIsMocDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedPipeLookup, setSelectedPipeLookup] = useState<PipeLookupTarget | null>(null);

  const {
    data: fetchedRecords = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["joint-records"],
    queryFn: fetchJointRecords,
    staleTime: 60 * 1000,
  });

  const { data: fetchedMocs = [], refetch: refetchMocs } = useQuery({
    queryKey: ["mocs"],
    queryFn: fetchMocs,
    staleTime: 60 * 1000,
  });

  const {
    data: pipeScheduleLookup,
    isLoading: isPipeScheduleLookupLoading,
    isError: isPipeScheduleLookupError,
    error: pipeScheduleLookupError,
  } = useQuery({
    queryKey: [
      "pipe-schedule-lookup",
      selectedPipeLookup?.sizeInches,
      selectedPipeLookup?.pipeSchedule,
    ],
    queryFn: () => fetchPipeScheduleLookup(selectedPipeLookup as PipeLookupTarget),
    enabled: Boolean(selectedPipeLookup?.sizeInches && selectedPipeLookup?.pipeSchedule),
    staleTime: 5 * 60 * 1000,
  });

  const recordsCollection = useMemo(
    () =>
      createCollection(
        localOnlyCollectionOptions<JointRecord, number>({
          id: `joint-records-${fetchedRecords.length}-${fetchedRecords.map((record) => record.id).join("-")}`,
          getKey: (record) => record.id,
          initialData: fetchedRecords.map(normalizeRecord),
        })
      ),
    [fetchedRecords]
  );

  useEffect(() => {
    let isMounted = true;

    const readCollection = () => {
      if (!isMounted) return;
      setCollectionRows(recordsCollection.toArray.map(normalizeRecord));
    };

    recordsCollection.preload().then(readCollection);
    const subscription = recordsCollection.subscribeChanges(readCollection);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [recordsCollection]);

  useEffect(
    () => () => {
      saveTimers.current.forEach((timer) => clearTimeout(timer));
      saveTimers.current.clear();
    },
    []
  );

  const mocOptions = useMemo(() => {
    const options = new Map<string, MocOption>();

    fetchedMocs.forEach((moc) => {
      if (moc.moc) options.set(moc.moc, moc);
    });

    collectionRows.forEach((record) => {
      if (record.moc && !options.has(record.moc)) {
        options.set(record.moc, { moc: record.moc, mocName: record.mocName });
      }
    });

    return Array.from(options.values()).sort((a, b) => a.moc.localeCompare(b.moc));
  }, [collectionRows, fetchedMocs]);

  const mocNameByCode = useMemo(
    () => new Map(mocOptions.map((moc) => [moc.moc, moc.mocName])),
    [mocOptions]
  );

  const createMutation = useMutation({
    mutationFn: createJointRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["joint-records"] });
      queryClient.invalidateQueries({ queryKey: ["allMocsJointsData"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: JointRecordPayload }) =>
      updateJointRecord(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["joint-records"] });
      queryClient.invalidateQueries({ queryKey: ["allMocsJointsData"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJointRecord,
    onSuccess: (id) => {
      if (recordsCollection.has(id)) {
        recordsCollection.delete(id);
      }
      setDeleteTarget(null);
      setDirtyRowIds((previous) => deleteSetValue(previous, id));
      queryClient.invalidateQueries({ queryKey: ["joint-records"] });
      queryClient.invalidateQueries({ queryKey: ["allMocsJointsData"] });
    },
  });

  const createMocMutation = useMutation({
    mutationFn: saveMoc,
    onSuccess: (moc) => {
      setSelectedMoc(moc.moc);
      queryClient.invalidateQueries({ queryKey: ["mocs"] });
      queryClient.invalidateQueries({ queryKey: ["joint-records"] });
    },
  });

  const mocForm = useForm({
    defaultValues: emptyMocValues,
    onSubmit: async ({ value }) => {
      const savedMoc = await createMocMutation.mutateAsync({
        moc: value.moc.trim(),
        mocName: value.mocName.trim(),
      });

      await refetchMocs();
      setSelectedMoc(savedMoc.moc);
      setIsMocDialogOpen(false);
      mocForm.reset(emptyMocValues);
    },
  });

  const filteredRecords = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return collectionRows.filter((record) => {
      const matchesMoc = selectedMoc === ALL_MOCS || record.moc === selectedMoc;
      const searchableText = `${record.moc} ${record.mocName} ${record.sizeInches} ${record.pipeSchedule} ${record.thickness}`.toLowerCase();
      return matchesMoc && (!normalizedSearch || searchableText.includes(normalizedSearch));
    });
  }, [collectionRows, searchQuery, selectedMoc]);

  const totals = useMemo(
    () => filteredRecords.reduce(addRecordToTotals, getEmptyTotals()),
    [filteredRecords]
  );
  const isAllMocsView = selectedMoc === ALL_MOCS;
  const footerLabelColSpan = 3;

  const consolidatedRows = useMemo(() => {
    const rowsByPipeKey = new Map<string, ConsolidatedPipeRow>();

    filteredRecords.forEach((record) => {
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
  }, [filteredRecords]);

  const tableSummary = useMemo(() => {
    if (!isAllMocsView) {
      return {
        type: "moc" as const,
        moc: selectedMoc,
        title: mocNameByCode.get(selectedMoc) || "No project name",
      };
    }

    return {
      type: "all" as const,
      moc: "All MOCs",
      title: "Consolidated pipe-size summary",
    };
  }, [isAllMocsView, mocNameByCode, selectedMoc]);

  const visibleTableRowCount = isAllMocsView ? consolidatedRows.length : filteredRecords.length;

  function getMocName(moc: string) {
    return mocNameByCode.get(moc) || "";
  }

  function markDirty(id: number) {
    setDirtyRowIds((previous) => addSetValue(previous, id));
  }

  function scheduleAutoSave(id: number) {
    const existingTimer = saveTimers.current.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      saveTimers.current.delete(id);
      const latestRecord = recordsCollection.toArray.find((record) => record.id === id);
      if (latestRecord) {
        void handleSaveRow(latestRecord);
      }
    }, 800);

    saveTimers.current.set(id, timer);
  }

  function clearAutoSave(id: number) {
    const existingTimer = saveTimers.current.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      saveTimers.current.delete(id);
    }
  }

  function updateRow(id: number, updater: (record: JointRecord) => void) {
    if (!recordsCollection.has(id)) return;

    recordsCollection.update(id, (draft) => {
      updater(draft);
      Object.assign(draft, recalculateRecord(draft));
    });
    markDirty(id);
    scheduleAutoSave(id);
  }

  function handleAddRow(mocOverride?: string) {
    const targetMoc = mocOverride || (selectedMoc !== ALL_MOCS ? selectedMoc : "");

    if (!targetMoc) {
      setIsMocDialogOpen(true);
      return;
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

    recordsCollection.insert(record);
    setSelectedMoc(targetMoc);
    setDirtyRowIds((previous) => addSetValue(previous, tempId));
  }

  function getPayload(record: JointRecord): JointRecordPayload {
    return {
      moc: record.moc.trim(),
      mocName: (record.mocName || getMocName(record.moc)).trim(),
      sizeInches: record.sizeInches.trim(),
      pipeSchedule: record.pipeSchedule.trim(),
      thickness: Math.max(0, Math.trunc(toNumber(record.thickness))),
      shopJoints: Math.max(0, Math.trunc(toNumber(record.shopJoints))),
      fieldJoints: Math.max(0, Math.trunc(toNumber(record.fieldJoints))),
    };
  }

  function validateRow(record: JointRecord) {
    const payload = getPayload(record);

    if (!payload.moc) return "Choose a MOC before saving this row.";
    if (!payload.mocName) return "The selected MOC needs a project name.";
    if (!payload.sizeInches) return "Pipe size is required.";
    return null;
  }

  async function handleSaveRow(record: JointRecord) {
    clearAutoSave(record.id);

    const rowError = validateRow(record);

    if (rowError) {
      return;
    }

    setSavingRowIds((previous) => addSetValue(previous, record.id));

    try {
      const payload = getPayload(record);
      const savedRecord = isNewRecord(record.id)
        ? await createMutation.mutateAsync(payload)
        : await updateMutation.mutateAsync({ id: record.id, payload });

      if (recordsCollection.has(record.id)) {
        recordsCollection.delete(record.id);
      }
      recordsCollection.insert(savedRecord);
      setDirtyRowIds((previous) => deleteSetValue(previous, record.id));
      setDirtyRowIds((previous) => deleteSetValue(previous, savedRecord.id));
      setSavingRowIds((previous) => deleteSetValue(previous, record.id));
    } catch (saveError) {
      console.error("Failed to save joint record:", saveError);
    } finally {
      setSavingRowIds((previous) => deleteSetValue(previous, record.id));
    }
  }

  function handleDiscardRow(record: JointRecord) {
    clearAutoSave(record.id);

    if (isNewRecord(record.id)) {
      if (recordsCollection.has(record.id)) {
        recordsCollection.delete(record.id);
      }
      setDirtyRowIds((previous) => deleteSetValue(previous, record.id));
      return;
    }

    const originalRecord = fetchedRecords.find((item) => item.id === record.id);
    if (originalRecord && recordsCollection.has(record.id)) {
      recordsCollection.update(record.id, (draft) => {
        Object.assign(draft, normalizeRecord(originalRecord));
      });
    }

    setDirtyRowIds((previous) => deleteSetValue(previous, record.id));
  }

  function handleDeleteRow(record: JointRecord) {
    clearAutoSave(record.id);

    if (isNewRecord(record.id)) {
      handleDiscardRow(record);
      return;
    }

    setDeleteTarget(record);
  }

  function handleSelectPipeLookup(sizeInches: string, pipeSchedule: string) {
    setSelectedPipeLookup({
      sizeInches: sizeInches.trim(),
      pipeSchedule: getLookupScheduleValue(pipeSchedule),
    });
  }

  function isSelectedPipeLookup(sizeInches: string, pipeSchedule: string) {
    return (
      selectedPipeLookup?.sizeInches === sizeInches.trim() &&
      selectedPipeLookup?.pipeSchedule === getLookupScheduleValue(pipeSchedule)
    );
  }

  async function handleExportToExcel() {
    const rows: ExportCell[][] = isAllMocsView
      ? consolidatedRows.map((record) => [
          record.sizeInches,
          record.thickness,
          record.pipeSchedule,
          record.shopJoints,
          record.fieldJoints,
          record.totalJoints,
          record.shopInchDia,
          record.fieldInchDia,
          record.totalInchDia,
        ])
      : filteredRecords.map((record) => [
          record.sizeInches,
          record.thickness,
          record.pipeSchedule || "-",
          record.shopJoints,
          record.fieldJoints,
          record.totalJoints,
          record.shopInchDia,
          record.fieldInchDia,
          record.totalInchDia,
        ]);

    if (!rows.length) return;

    const footerRow: ExportCell[] = [
      "Visible Total",
      "",
      "",
      totals.shopJoints,
      totals.fieldJoints,
      totals.totalJoints,
      totals.shopInchDia,
      totals.fieldInchDia,
      totals.totalInchDia,
    ];

    setIsExporting(true);

    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Pipe Size Summary");
      const title = `${tableSummary.moc} - ${tableSummary.title}`;

      workbook.creator = "Site Progress";
      workbook.created = new Date();
      workbook.modified = new Date();
      workbook.subject = "Pipe size joints and inch-dia export";
      workbook.title = title;

      formatPipeSummaryWorksheet(worksheet, title, pipeExportColumns, rows, footerRow);

      const buffer = await workbook.xlsx.writeBuffer();
      downloadWorkbookFile(buffer, `${sanitizeFileName(title)}.xlsx`);
    } catch (exportError) {
      console.error("Failed to export Excel workbook:", exportError);
      window.alert("Excel export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-4">
      <div className="mx-auto max-w-none space-y-4">
        <section className="flex flex-wrap items-center justify-end gap-2 border-b border-slate-200 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-[260px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search MOC, project, size..."
                className="h-10 pl-9"
              />
            </div>

            <Select value={selectedMoc} onValueChange={setSelectedMoc}>
              <SelectTrigger className="h-10 w-full sm:w-[230px]">
                <SelectValue placeholder="MOC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_MOCS}>All MOCs</SelectItem>
                {mocOptions.map((item) => (
                  <SelectItem key={item.moc} value={item.moc}>
                    {item.moc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => setIsMocDialogOpen(true)}>
              <FilePlus2 className="mr-2 h-4 w-4" />
              New MOC
            </Button>
          </div>
        </section>

        <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <MocSummaryHeader
            summary={tableSummary}
            isExportDisabled={visibleTableRowCount === 0}
            isExporting={isExporting}
            onAddRow={() => handleAddRow()}
            onExportExcel={handleExportToExcel}
          />

          {isLoading ? (
            <div className="flex h-[520px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : isError ? (
            <div className="m-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error instanceof Error ? error.message : "Could not load records."}
            </div>
          ) : (
            <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-w-0 overflow-hidden rounded-md border border-slate-200">
                <div className="h-[calc(100vh-250px)] min-h-[540px] overflow-auto">
                  <table className="w-full min-w-[880px] table-fixed border-separate border-spacing-0 text-sm">
                    <colgroup>
                      <col style={{ width: 58 }} />
                      <col style={{ width: 58 }} />
                      <col style={{ width: 100 }} />
                      <col style={{ width: 86 }} />
                      <col style={{ width: 86 }} />
                      <col style={{ width: 88 }} />
                      <col style={{ width: 118 }} />
                      <col style={{ width: 118 }} />
                      <col style={{ width: 122 }} />
                      {!isAllMocsView ? <col style={{ width: 58 }} /> : null}
                    </colgroup>
                    <thead className="sticky top-0 z-30 bg-slate-100 shadow-sm">
                      <tr>
                        <HeaderCell>Size</HeaderCell>
                        <HeaderCell>Thk</HeaderCell>
                        <HeaderCell>Schedule</HeaderCell>
                        <HeaderCell>Shop<br />Joints</HeaderCell>
                        <HeaderCell>Field<br />Joints</HeaderCell>
                        <HeaderCell>Total<br />Joints</HeaderCell>
                        <HeaderCell>Shop Inch Dia</HeaderCell>
                        <HeaderCell>Field Inch Dia</HeaderCell>
                        <HeaderCell>Total Inch Dia</HeaderCell>
                        {!isAllMocsView ? <HeaderCell>Delete</HeaderCell> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {isAllMocsView
                        ? consolidatedRows.map((record) => {
                            const isSelected = isSelectedPipeLookup(record.sizeInches, record.pipeSchedule);

                            return (
                              <tr
                                key={record.key}
                                className={`cursor-pointer transition hover:bg-blue-50/70 ${isSelected ? "bg-blue-50" : "bg-white"}`}
                                onClick={() => handleSelectPipeLookup(record.sizeInches, record.pipeSchedule)}
                              >
                                <ReadOnlyCell>{record.sizeInches}</ReadOnlyCell>
                                <ReadOnlyCell>{formatNumber(record.thickness)}</ReadOnlyCell>
                                <ReadOnlyCell>{record.pipeSchedule}</ReadOnlyCell>
                                <ReadOnlyCell>{formatNumber(record.shopJoints)}</ReadOnlyCell>
                                <ReadOnlyCell>{formatNumber(record.fieldJoints)}</ReadOnlyCell>
                                <CalculatedCell value={record.totalJoints} />
                                <CalculatedCell value={record.shopInchDia} />
                                <CalculatedCell value={record.fieldInchDia} />
                                <CalculatedCell value={record.totalInchDia} />
                              </tr>
                            );
                          })
                        : filteredRecords.map((record) => {
                            const isDirty = dirtyRowIds.has(record.id);
                            const isSaving = savingRowIds.has(record.id);
                            const isSizeMissing = parsePipeSize(record.sizeInches) === 0;
                            const isSelected = isSelectedPipeLookup(record.sizeInches, record.pipeSchedule);

                            return (
                              <tr
                                key={record.id}
                                className={`cursor-pointer transition hover:bg-blue-50/70 ${
                                  isSelected ? "bg-blue-50" : isDirty ? "bg-amber-50/60" : "bg-white"
                                }`}
                                onClick={() => handleSelectPipeLookup(record.sizeInches, record.pipeSchedule)}
                              >
                                <BodyCell>
                                  <EditableText
                                    value={record.sizeInches}
                                    placeholder="Pipe size"
                                    onChange={(value) =>
                                      updateRow(record.id, (draft) => {
                                        draft.sizeInches = value;
                                      })
                                    }
                                  />
                                </BodyCell>
                                <BodyCell>
                                  <EditableNumber
                                    value={record.thickness}
                                    onChange={(value) =>
                                      updateRow(record.id, (draft) => {
                                        draft.thickness = value;
                                      })
                                    }
                                  />
                                </BodyCell>
                                <BodyCell>
                                  <EditableText
                                    value={record.pipeSchedule}
                                    placeholder="Optional"
                                    onChange={(value) =>
                                      updateRow(record.id, (draft) => {
                                        draft.pipeSchedule = value;
                                      })
                                    }
                                  />
                                </BodyCell>
                                <BodyCell>
                                  <EditableNumber
                                    value={record.shopJoints}
                                    onChange={(value) =>
                                      updateRow(record.id, (draft) => {
                                        draft.shopJoints = value;
                                      })
                                    }
                                  />
                                </BodyCell>
                                <BodyCell>
                                  <EditableNumber
                                    value={record.fieldJoints}
                                    onChange={(value) =>
                                      updateRow(record.id, (draft) => {
                                        draft.fieldJoints = value;
                                      })
                                    }
                                  />
                                </BodyCell>
                                <CalculatedCell value={record.totalJoints} />
                                <CalculatedCell value={record.shopInchDia} isBlocked={isSizeMissing && record.shopJoints > 0} />
                                <CalculatedCell value={record.fieldInchDia} isBlocked={isSizeMissing && record.fieldJoints > 0} />
                                <CalculatedCell value={record.totalInchDia} isBlocked={isSizeMissing && record.totalJoints > 0} />
                                <BodyCell>
                                  <div className="flex justify-center gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="text-red-600 hover:text-red-700"
                                      disabled={isSaving}
                                      onClick={() => handleDeleteRow(record)}
                                      aria-label="Delete row"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </BodyCell>
                              </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="sticky bottom-0 z-20 bg-slate-50 shadow-[0_-1px_0_0_#e2e8f0]">
                      <tr className="font-bold text-slate-950">
                        <FooterCell colSpan={footerLabelColSpan} className="text-right">
                          Visible Total
                        </FooterCell>
                        <FooterCell>{formatNumber(totals.shopJoints)}</FooterCell>
                        <FooterCell>{formatNumber(totals.fieldJoints)}</FooterCell>
                        <FooterCell>{formatNumber(totals.totalJoints)}</FooterCell>
                        <FooterCell>{formatNumber(totals.shopInchDia)}</FooterCell>
                        <FooterCell>{formatNumber(totals.fieldInchDia)}</FooterCell>
                        <FooterCell>{formatNumber(totals.totalInchDia)}</FooterCell>
                        {!isAllMocsView ? <FooterCell /> : null}
                      </tr>
                    </tfoot>
                  </table>

                  {filteredRecords.length === 0 && (
                    <div className="flex h-60 items-center justify-center border-t text-sm text-slate-500">
                      No pipe-size records match the current filters.
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <SummaryProgressCard totals={totals} />
                <PipeScheduleLookupCard
                  target={selectedPipeLookup}
                  result={pipeScheduleLookup}
                  isLoading={isPipeScheduleLookupLoading}
                  isError={isPipeScheduleLookupError}
                  error={pipeScheduleLookupError}
                />
              </div>
            </div>
          )}
        </section>
      </div>

      <Dialog open={isMocDialogOpen} onOpenChange={setIsMocDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New MOC / Project</DialogTitle>
            <DialogDescription>
              Create the project header first, then add pipe-size rows against it from the grid.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void mocForm.handleSubmit();
            }}
          >
            <mocForm.Field
              name="moc"
              validators={{
                onChange: ({ value }) => (!value.trim() ? "MOC is required." : undefined),
              }}
            >
              {(field) => (
                <FieldShell label="MOC / Project No." error={field.state.meta.errors[0]}>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value.toUpperCase())}
                    placeholder="148-PC-22-0002"
                  />
                </FieldShell>
              )}
            </mocForm.Field>

            <mocForm.Field
              name="mocName"
              validators={{
                onChange: ({ value }) => (!value.trim() ? "Project name is required." : undefined),
              }}
            >
              {(field) => (
                <FieldShell label="Project / MOC Name" error={field.state.meta.errors[0]}>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Project description"
                  />
                </FieldShell>
              )}
            </mocForm.Field>

            {createMocMutation.isError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {createMocMutation.error?.message || "MOC save failed."}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsMocDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMocMutation.isPending}>
                {createMocMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save MOC
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete pipe-size row?</DialogTitle>
            <DialogDescription>
              This removes size {deleteTarget?.sizeInches || "-"} / thickness {deleteTarget?.thickness || 0} from{" "}
              {deleteTarget?.moc || "this MOC"}.
            </DialogDescription>
          </DialogHeader>
          {deleteMutation.isError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {deleteMutation.error?.message || "Delete failed."}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending || !deleteTarget}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FieldShell({
  label,
  error,
  children,
}: {
  label: string;
  error: unknown;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      {children}
      {error ? <p className="text-xs font-medium text-red-600">{String(error)}</p> : null}
    </div>
  );
}

function MocSummaryHeader({
  summary,
  isExportDisabled,
  isExporting,
  onAddRow,
  onExportExcel,
}: {
  summary: {
    type: "moc" | "all";
    moc: string;
    title: string;
  };
  isExportDisabled: boolean;
  isExporting: boolean;
  onAddRow: () => void;
  onExportExcel: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-slate-900 text-white hover:bg-slate-900">{summary.moc}</Badge>
          <span className="truncate text-xl font-bold text-slate-950">{summary.title}</span>
        </div>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        <Button
          className="h-10 w-full shrink-0 sm:w-auto"
          variant="outline"
          disabled={isExportDisabled || isExporting}
          onClick={onExportExcel}
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isExporting ? "Exporting..." : "Export to Excel"}
        </Button>
        <Button className="h-10 w-full shrink-0 sm:w-auto" onClick={onAddRow}>
          <Plus className="mr-2 h-4 w-4" />
          Add Row
        </Button>
      </div>
    </div>
  );
}

function SummaryProgressCard({ totals }: { totals: RecordTotals }) {
  const totalJoints = totals.shopJoints + totals.fieldJoints;
  const totalInchDia = totals.shopInchDia + totals.fieldInchDia;

  return (
    <aside className="h-fit rounded-md border border-slate-200 bg-white p-4 shadow-sm xl:sticky xl:top-4">
      <div className="border-b border-slate-200 pb-3">
        <h3 className="text-base font-bold text-slate-950">Visible Summary</h3>
      </div>
      <div className="mt-4 space-y-5">
        <ProgressMetric
          label="Total Shop Joints"
          value={totals.shopJoints}
          percent={getPercent(totals.shopJoints, totalJoints)}
          tone="blue"
        />
        <ProgressMetric
          label="Total Field Joints"
          value={totals.fieldJoints}
          percent={getPercent(totals.fieldJoints, totalJoints)}
          tone="emerald"
        />
        <ProgressMetric
          label="Total Shop Inch Dia"
          value={totals.shopInchDia}
          percent={getPercent(totals.shopInchDia, totalInchDia)}
          tone="blue"
        />
        <ProgressMetric
          label="Total Field Inch Dia"
          value={totals.fieldInchDia}
          percent={getPercent(totals.fieldInchDia, totalInchDia)}
          tone="emerald"
        />
      </div>
    </aside>
  );
}

function PipeScheduleLookupCard({
  target,
  result,
  isLoading,
  isError,
  error,
}: {
  target: PipeLookupTarget | null;
  result?: PipeScheduleLookupResponse;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
}) {
  return (
    <aside className="h-fit rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="border-b border-slate-200 pb-3">
        <h3 className="text-base font-bold text-slate-950">Selected Pipe Schedule</h3>
        {target ? (
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Lookup by pipe size {target.sizeInches || "-"} and schedule {target.pipeSchedule || "not specified"}
          </p>
        ) : null}
      </div>

      {!target ? (
        <div className="mt-4 rounded-md border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Click any table row to see the ASME wall-thickness details from the pipe schedule table.
        </div>
      ) : !target.pipeSchedule ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          This row does not have a schedule value to look up.
        </div>
      ) : isLoading ? (
        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          Loading schedule detail...
        </div>
      ) : isError ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error ? error.message : "Could not load schedule detail."}
        </div>
      ) : result && result.data.length > 0 ? (
        <div className="mt-4 space-y-3">
          {result.data.map((row) => (
            <div key={row.id} className="overflow-hidden rounded-md border border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-slate-900 text-white hover:bg-slate-900">{row.standardCode}</Badge>
                  <Badge variant="secondary">{row.materialGroup}</Badge>
                </div>
                <div className="mt-3 space-y-1">
                  <h4 className="text-sm font-bold text-slate-950">{getMaterialDescription(row.materialGroup)}</h4>
                  <p className="text-xs font-semibold leading-relaxed text-slate-500">
                    {getStandardDescription(row)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 border-b border-slate-200 text-sm">
                <DetailMetric
                  label="Nominal Pipe Size (NPS)"
                  value={row.nps}
                  className="border-r border-slate-200"
                />
                <DetailMetric label="Pipe Schedule" value={row.schedule} />
                <DetailMetric
                  label="Outside Diameter (OD), in"
                  value={formatDecimal(row.outsideDiameterIn)}
                  className="border-r border-t border-slate-200"
                />
                <DetailMetric
                  label="Wall Thickness, in"
                  value={formatDecimal(row.wallThicknessIn)}
                  className="border-t border-slate-200"
                />
                <DetailMetric
                  label="Calculated Inside Diameter (ID), in"
                  value={formatDecimal(row.insideDiameterIn)}
                  className="border-r border-t border-slate-200"
                />
                <DetailMetric
                  label="Material Classification"
                  value={row.materialGroup}
                  className="border-t border-slate-200"
                />
              </div>

              <div className="space-y-2 p-3">
                <p className="text-xs font-semibold leading-relaxed text-slate-600">
                  Inside diameter is calculated as outside diameter minus two times wall thickness.
                </p>
                <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                  Source: {row.sourceSheet}
                  {row.sourceRowNumber ? `, row ${row.sourceRowNumber}` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            No exact schedule match found for this size and schedule.
          </div>
          {result?.availableSchedules.length ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Available for size {target.sizeInches}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.availableSchedules.map((schedule) => (
                  <Badge key={schedule} variant="secondary">
                    {schedule}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </aside>
  );
}

function DetailMetric({
  label,
  value,
  className = "",
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-h-[74px] p-3 ${className}`}>
      <div className="text-xs font-semibold leading-tight text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-bold leading-none text-slate-950">{value}</div>
    </div>
  );
}

function ProgressMetric({
  label,
  value,
  percent,
  tone,
}: {
  label: string;
  value: number;
  percent: number;
  tone: "blue" | "emerald";
}) {
  const barClass = tone === "blue" ? "bg-blue-500" : "bg-emerald-500";

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm font-bold text-slate-700">{label}</span>
        <span className="whitespace-nowrap text-right">
          <span className="text-lg font-bold text-slate-950">{formatNumber(value)}</span>
          <span className="ml-2 text-sm font-bold text-slate-500">{percent}%</span>
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function ReadOnlyCell({ children }: { children: ReactNode }) {
  return (
    <BodyCell className="text-slate-950">
      <span className="flex h-12 w-full items-center justify-center truncate px-2 font-semibold tabular-nums">
        {children}
      </span>
    </BodyCell>
  );
}

function EditableText({
  value,
  onChange,
  placeholder,
  align = "center",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  align?: "left" | "center";
}) {
  return (
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={`h-12 w-full rounded-none border-0 bg-transparent px-2 font-semibold text-slate-950 shadow-none outline-none transition placeholder:text-slate-400 focus-visible:ring-0 ${
        align === "left" ? "text-left" : "text-center"
      }`}
    />
  );
}

function EditableNumber({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Input
      type="text"
      inputMode="numeric"
      value={Number.isFinite(value) ? value : 0}
      onChange={(event) => onChange(toNumber(event.target.value))}
      className="h-12 w-full rounded-none border-0 bg-transparent px-2 text-center font-semibold text-slate-950 shadow-none outline-none transition focus-visible:ring-0"
    />
  );
}

function CalculatedCell({ value, isBlocked = false }: { value: number; isBlocked?: boolean }) {
  return (
    <BodyCell
      className={
        isBlocked
          ? "bg-amber-50 text-amber-700"
          : "bg-slate-100 text-slate-500"
      }
    >
      <span
        className="flex h-12 w-full items-center justify-center px-2 font-semibold tabular-nums"
        title={isBlocked ? "Enter pipe size to calculate inch-dia." : "Calculated value"}
      >
        {isBlocked ? "Set size" : formatNumber(value)}
      </span>
    </BodyCell>
  );
}

function HeaderCell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th className={`border-b border-r border-slate-200 px-2 py-3 text-center font-bold leading-tight text-slate-600 last:border-r-0 ${className}`}>
      {children}
    </th>
  );
}

function BodyCell({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <td className={`border-b border-r border-slate-200 p-0 text-center align-middle text-slate-800 transition last:border-r-0 focus-within:relative focus-within:z-10 focus-within:bg-blue-50 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 ${className}`}>
      {children}
    </td>
  );
}

function FooterCell({
  children,
  className = "",
  colSpan,
}: {
  children?: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={`border-t border-r border-slate-200 px-3 py-3 text-center align-middle last:border-r-0 ${className}`}>
      {children}
    </td>
  );
}

function addSetValue<T>(set: Set<T>, value: T) {
  const nextSet = new Set(set);
  nextSet.add(value);
  return nextSet;
}

function deleteSetValue<T>(set: Set<T>, value: T) {
  const nextSet = new Set(set);
  nextSet.delete(value);
  return nextSet;
}

function formatPipeSummaryWorksheet(
  worksheet: Worksheet,
  title: string,
  columns: string[],
  rows: ExportCell[][],
  footerRow: ExportCell[]
) {
  const lastColumn = columns.length;

  worksheet.views = [{ state: "frozen", ySplit: 3 }];
  worksheet.properties.defaultRowHeight = 22;
  worksheet.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    margins: {
      left: 0.25,
      right: 0.25,
      top: 0.5,
      bottom: 0.5,
      header: 0.2,
      footer: 0.2,
    },
  };

  worksheet.mergeCells(1, 1, 1, lastColumn);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 16, color: { argb: "FF0F172A" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };

  worksheet.mergeCells(2, 1, 2, lastColumn);
  const metaCell = worksheet.getCell(2, 1);
  metaCell.value = `Exported ${new Date().toLocaleString()} | ${rows.length} visible rows`;
  metaCell.font = { size: 10, color: { argb: "FF64748B" } };
  metaCell.alignment = { vertical: "middle", horizontal: "left" };

  const headerRow = worksheet.addRow(columns);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });

  rows.forEach((rowValues) => {
    const row = worksheet.addRow(rowValues);
    row.height = 24;
  });

  const totalRow = worksheet.addRow(footerRow);
  totalRow.height = 26;
  totalRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { bold: true, color: { argb: "FF0F172A" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
  });

  worksheet.columns = [
    { width: 12 },
    { width: 10 },
    { width: 16 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
  ];

  worksheet.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3, column: lastColumn },
  };

  for (let columnIndex = 2; columnIndex <= lastColumn; columnIndex += 1) {
    worksheet.getColumn(columnIndex).numFmt = "#,##0.##";
  }

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: rowNumber <= 3 || columnNumber <= 3 ? "center" : "right",
        wrapText: true,
      };
    });
  });
}

function downloadWorkbookFile(buffer: BlobPart, fileName: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function sanitizeFileName(value: string) {
  return (
    value
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "pipe-size-summary"
  );
}

function getLookupScheduleValue(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue === "-" ? "" : trimmedValue;
}

function getMaterialDescription(materialGroup: string) {
  switch (materialGroup.toUpperCase()) {
    case "CS-LAS":
      return "Carbon Steel / Low-Alloy Steel (CS-LAS)";
    case "SS":
      return "Stainless Steel / Duplex / Nickel-Alloy (SS)";
    default:
      return `${materialGroup} pipe material group`;
  }
}

function getStandardDescription(row: PipeScheduleLookupRow) {
  if (row.standardCode === "B36.10M") {
    return "ASME B36.10M dimensional table for carbon steel and low-alloy steel pipe.";
  }

  if (row.standardCode === "B36.19M") {
    return "ASME B36.19M dimensional table for stainless steel, duplex, and nickel-alloy pipe.";
  }

  return row.standardName;
}

function formatNumber(value: number) {
  return Math.round(toNumber(value)).toLocaleString();
}

function formatDecimal(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 4,
    minimumFractionDigits: value > 0 && value < 1 ? 3 : 0,
  }).format(toNumber(value));
}

function getPercent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((toNumber(value) / total) * 100);
}
