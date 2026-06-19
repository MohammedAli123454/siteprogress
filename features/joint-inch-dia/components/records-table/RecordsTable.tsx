"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Plus,
  Trash2,
  Undo2,
} from "lucide-react";

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
import {
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { parsePipeSize } from "../../domain/pipe-size";
import type { JointRecord } from "../../domain/types";
import type { ConsolidatedPipeRow, RecordTotals } from "../../domain/calculations";
import { formatNumber, isNewRecord, toNumber } from "../../domain/calculations";

const headerCellClassName =
  "border-b border-r border-slate-200 px-2 py-2 text-center font-bold leading-tight text-slate-600 last:border-r-0";
const bodyCellClassName =
  "border-b border-r border-slate-200 p-0 text-center align-middle text-slate-800 outline-none transition last:border-r-0 focus:outline-none focus-visible:outline-none";
const readOnlyValueClassName =
  "flex h-10 w-full items-center justify-center truncate px-2 font-semibold tabular-nums";
const calculatedValueClassName =
  "flex h-10 w-full items-center justify-center px-2 font-semibold tabular-nums";
const selectedCellClassName =
  "relative z-10 bg-blue-50 ring-2 ring-inset ring-blue-500";
const footerCellClassName =
  "border-t border-r border-slate-200 px-3 py-2 text-center align-middle last:border-r-0";
const combinedFooterCellClassName =
  "border-b border-t border-r border-slate-200 px-3 py-1.5 text-center align-middle last:border-r-0";
const editableInputClassName =
  "h-10 w-full rounded-none border-0 bg-transparent px-2 text-center font-semibold text-slate-950 shadow-none outline-none transition placeholder:text-slate-400 focus-visible:ring-0";

type ScrollIndicatorMetrics = {
  isScrollable: boolean;
  thumbHeight: number;
  thumbTop: number;
};

type RecordsTableProps = {
  isAllMocsView: boolean;
  consolidatedRows: ConsolidatedPipeRow[];
  filteredRecords: JointRecord[];
  dirtyRowIds: Set<number>;
  changedCellKeys: Set<string>;
  pendingDeleteIds: Set<number>;
  rowErrors: Map<number, string>;
  isSavingChanges: boolean;
  totals: RecordTotals;
  footerLabelColSpan: number;
  onAddRow: () => void;
  onUpdateRow: (id: number, updater: (record: JointRecord) => void) => void;
  onDeleteRow: (record: JointRecord) => void;
};

export function RecordsTable({
  isAllMocsView,
  consolidatedRows,
  filteredRecords,
  dirtyRowIds,
  changedCellKeys,
  pendingDeleteIds,
  rowErrors,
  isSavingChanges,
  totals,
  footerLabelColSpan,
  onAddRow,
  onUpdateRow,
  onDeleteRow,
}: RecordsTableProps) {
  const tableShellRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null);
  const [isCalculatedCellDialogOpen, setIsCalculatedCellDialogOpen] = useState(false);
  const [scrollIndicatorMetrics, setScrollIndicatorMetrics] =
    useState<ScrollIndicatorMetrics>({
      isScrollable: false,
      thumbHeight: 48,
      thumbTop: 0,
    });
  const isEmpty = isAllMocsView
    ? consolidatedRows.length === 0
    : filteredRecords.length === 0;
  const tableRowCount = isAllMocsView ? consolidatedRows.length : filteredRecords.length;
  const shouldUseFixedTableHeight = tableRowCount >= 8;

  useEffect(() => {
    function clearSelectionIfOutsideNavigableCell(event: PointerEvent | FocusEvent) {
      const target = event.target;
      const isNavigableCellTarget =
        target instanceof HTMLElement &&
        tableShellRef.current?.contains(target) &&
        target.closest("tbody td[data-cell-key]");

      if (isNavigableCellTarget) return;

      setSelectedCellKey(null);

      const activeElement = document.activeElement;

      if (
        activeElement instanceof HTMLElement &&
        tableShellRef.current?.contains(activeElement)
      ) {
        activeElement.blur();
      }
    }

    document.addEventListener("pointerdown", clearSelectionIfOutsideNavigableCell, true);
    document.addEventListener("focusin", clearSelectionIfOutsideNavigableCell, true);

    return () => {
      document.removeEventListener("pointerdown", clearSelectionIfOutsideNavigableCell, true);
      document.removeEventListener("focusin", clearSelectionIfOutsideNavigableCell, true);
    };
  }, []);

  useEffect(() => {
    if (!shouldUseFixedTableHeight) {
      setScrollIndicatorMetrics({
        isScrollable: false,
        thumbHeight: 48,
        thumbTop: 0,
      });
      return;
    }

    const scrollElement = tableScrollRef.current;
    if (!scrollElement) return;
    const measuredScrollElement = scrollElement;

    let animationFrame = 0;

    function updateScrollIndicator() {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const { clientHeight, scrollHeight, scrollTop } = measuredScrollElement;
        const isScrollable = scrollHeight > clientHeight + 1;

        if (!isScrollable) {
          setScrollIndicatorMetrics({
            isScrollable: false,
            thumbHeight: 48,
            thumbTop: 0,
          });
          return;
        }

        const thumbHeight = Math.max(48, (clientHeight / scrollHeight) * clientHeight);
        const maxScrollTop = scrollHeight - clientHeight;
        const maxThumbTop = clientHeight - thumbHeight;
        const thumbTop = maxScrollTop > 0 ? (scrollTop / maxScrollTop) * maxThumbTop : 0;

        setScrollIndicatorMetrics({
          isScrollable: true,
          thumbHeight,
          thumbTop,
        });
      });
    }

    updateScrollIndicator();
    measuredScrollElement.addEventListener("scroll", updateScrollIndicator, { passive: true });
    window.addEventListener("resize", updateScrollIndicator);

    const resizeObserver = new ResizeObserver(updateScrollIndicator);
    resizeObserver.observe(measuredScrollElement);
    if (measuredScrollElement.firstElementChild) {
      resizeObserver.observe(measuredScrollElement.firstElementChild);
    }

    return () => {
      window.cancelAnimationFrame(animationFrame);
      measuredScrollElement.removeEventListener("scroll", updateScrollIndicator);
      window.removeEventListener("resize", updateScrollIndicator);
      resizeObserver.disconnect();
    };
  }, [shouldUseFixedTableHeight, tableRowCount]);

  function selectCell(cellKey: string) {
    setSelectedCellKey(cellKey);
  }

  return (
    <>
      <div
        ref={tableShellRef}
        className={`relative min-w-0 overflow-hidden rounded-md border border-slate-200 ${
          shouldUseFixedTableHeight ? "h-full min-h-0" : ""
        }`}
      >
        <div
          ref={tableScrollRef}
          data-records-scroll-container
          className={
            shouldUseFixedTableHeight
              ? "joint-records-table-scroll-container h-full min-h-0"
              : "overflow-auto"
          }
        >
        <table
          className="w-full min-w-[930px] table-fixed border-separate border-spacing-0 text-sm"
          onKeyDownCapture={(event) => handleTableArrowNavigation(event, setSelectedCellKey)}
        >
          <colgroup>
            <col style={{ width: 76 }} />
            <col style={{ width: 58 }} />
            <col style={{ width: 58 }} />
            <col style={{ width: 136 }} />
            <col style={{ width: 86 }} />
            <col style={{ width: 86 }} />
            <col style={{ width: 88 }} />
            <col style={{ width: 106 }} />
            <col style={{ width: 106 }} />
            <col style={{ width: 110 }} />
            {!isAllMocsView ? <col style={{ width: 58 }} /> : null}
          </colgroup>
          <TableHeader className="sticky top-0 z-30 bg-slate-100 shadow-sm">
            <TableRow className="hover:bg-transparent">
              <TableHead className={headerCellClassName}>Sr#</TableHead>
              <TableHead className={headerCellClassName}>Size</TableHead>
              <TableHead className={headerCellClassName}>Thk</TableHead>
              <TableHead className={headerCellClassName}>Schedule</TableHead>
              <TableHead className={headerCellClassName}>Shop<br />Joints</TableHead>
              <TableHead className={headerCellClassName}>Field<br />Joints</TableHead>
              <TableHead className={headerCellClassName}>Total<br />Joints</TableHead>
              <TableHead className={headerCellClassName}>Shop Inch Dia</TableHead>
              <TableHead className={headerCellClassName}>Field Inch Dia</TableHead>
              <TableHead className={headerCellClassName}>Total Inch Dia</TableHead>
              {!isAllMocsView ? <TableHead className={headerCellClassName}>Delete</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isAllMocsView
              ? consolidatedRows.map((record, index) => {
                  return (
                    <TableRow
                      key={record.key}
                      className="bg-white"
                    >
                      {renderReadOnlyCell({
                        cellKey: `${record.key}:serialNumber`,
                        value: index + 1,
                        selectedCellKey,
                        onSelect: selectCell,
                      })}
                      {renderReadOnlyCell({
                        cellKey: `${record.key}:sizeInches`,
                        value: record.sizeInches,
                        selectedCellKey,
                        onSelect: selectCell,
                      })}
                      {renderReadOnlyCell({
                        cellKey: `${record.key}:thickness`,
                        value: formatNumber(record.thickness),
                        selectedCellKey,
                        onSelect: selectCell,
                      })}
                      {renderReadOnlyCell({
                        cellKey: `${record.key}:pipeSchedule`,
                        value: record.pipeSchedule,
                        selectedCellKey,
                        onSelect: selectCell,
                      })}
                      {renderReadOnlyCell({
                        cellKey: `${record.key}:shopJoints`,
                        value: formatNumber(record.shopJoints),
                        selectedCellKey,
                        onSelect: selectCell,
                      })}
                      {renderReadOnlyCell({
                        cellKey: `${record.key}:fieldJoints`,
                        value: formatNumber(record.fieldJoints),
                        selectedCellKey,
                        onSelect: selectCell,
                      })}
                      {renderCalculatedCell({
                        cellKey: `${record.key}:totalJoints`,
                        value: record.totalJoints,
                        selectedCellKey,
                        onSelect: selectCell,
                        onShowMessage: () => setIsCalculatedCellDialogOpen(true),
                      })}
                      {renderCalculatedCell({
                        cellKey: `${record.key}:shopInchDia`,
                        value: record.shopInchDia,
                        selectedCellKey,
                        onSelect: selectCell,
                        onShowMessage: () => setIsCalculatedCellDialogOpen(true),
                      })}
                      {renderCalculatedCell({
                        cellKey: `${record.key}:fieldInchDia`,
                        value: record.fieldInchDia,
                        selectedCellKey,
                        onSelect: selectCell,
                        onShowMessage: () => setIsCalculatedCellDialogOpen(true),
                      })}
                      {renderCalculatedCell({
                        cellKey: `${record.key}:totalInchDia`,
                        value: record.totalInchDia,
                        selectedCellKey,
                        onSelect: selectCell,
                        onShowMessage: () => setIsCalculatedCellDialogOpen(true),
                      })}
                    </TableRow>
                  );
                })
              : filteredRecords.map((record, index) => {
                  const isNewRow = isNewRecord(record.id);
                  const isPendingDelete = pendingDeleteIds.has(record.id);
                  const isEditedRow = dirtyRowIds.has(record.id) && !isNewRow && !isPendingDelete;
                  const rowError = rowErrors.get(record.id);
                  const isSizeMissing = parsePipeSize(record.sizeInches) === 0;
                  const rowStatus = getRowStatus({
                    isEditedRow,
                    isNewRow,
                    isPendingDelete,
                    hasError: Boolean(rowError),
                  });

                  return (
                    <Fragment key={record.id}>
                    <TableRow className={getEditableRowClassName(isPendingDelete, Boolean(rowError))}>
                      {renderRowHeaderCell({
                        cellKey: `${record.id}:serialNumber`,
                        value: index + 1,
                        status: rowStatus,
                        selectedCellKey,
                        onSelect: selectCell,
                      })}
                      <TableCell
                        data-cell-key={`${record.id}:sizeInches`}
                        tabIndex={0}
                        className={getEditableCellClassName({
                          cellKey: `${record.id}:sizeInches`,
                          selectedCellKey,
                          changedCellKeys,
                          isPendingDelete,
                        })}
                        onClick={() => setSelectedCellKey(`${record.id}:sizeInches`)}
                        onFocusCapture={() => setSelectedCellKey(`${record.id}:sizeInches`)}
                      >
                        {renderEditableText(
                          record.sizeInches,
                          isNewRow ? "" : "Pipe size",
                          (value) =>
                            onUpdateRow(record.id, (draft) => {
                              draft.sizeInches = value;
                            }),
                          isPendingDelete || isSavingChanges
                        )}
                      </TableCell>
                      <TableCell
                        data-cell-key={`${record.id}:thickness`}
                        tabIndex={0}
                        className={getEditableCellClassName({
                          cellKey: `${record.id}:thickness`,
                          selectedCellKey,
                          changedCellKeys,
                          isPendingDelete,
                        })}
                        onClick={() => setSelectedCellKey(`${record.id}:thickness`)}
                        onFocusCapture={() => setSelectedCellKey(`${record.id}:thickness`)}
                      >
                        {renderEditableNumber(
                          record.thickness,
                          (value) =>
                            onUpdateRow(record.id, (draft) => {
                              draft.thickness = value;
                            }),
                          {
                            disabled: isPendingDelete || isSavingChanges,
                            shouldHideZero: isNewRow,
                            mode: "integer",
                          }
                        )}
                      </TableCell>
                      <TableCell
                        data-cell-key={`${record.id}:pipeSchedule`}
                        tabIndex={0}
                        className={getEditableCellClassName({
                          cellKey: `${record.id}:pipeSchedule`,
                          selectedCellKey,
                          changedCellKeys,
                          isPendingDelete,
                        })}
                        onClick={() => setSelectedCellKey(`${record.id}:pipeSchedule`)}
                        onFocusCapture={() => setSelectedCellKey(`${record.id}:pipeSchedule`)}
                      >
                        {renderEditableText(
                          record.pipeSchedule,
                          "",
                          (value) =>
                            onUpdateRow(record.id, (draft) => {
                              draft.pipeSchedule = value;
                            }),
                          isPendingDelete || isSavingChanges
                        )}
                      </TableCell>
                      <TableCell
                        data-cell-key={`${record.id}:shopJoints`}
                        tabIndex={0}
                        className={getEditableCellClassName({
                          cellKey: `${record.id}:shopJoints`,
                          selectedCellKey,
                          changedCellKeys,
                          isPendingDelete,
                        })}
                        onClick={() => setSelectedCellKey(`${record.id}:shopJoints`)}
                        onFocusCapture={() => setSelectedCellKey(`${record.id}:shopJoints`)}
                      >
                        {renderEditableNumber(
                          record.shopJoints,
                          (value) =>
                            onUpdateRow(record.id, (draft) => {
                              draft.shopJoints = value;
                            }),
                          {
                            disabled: isPendingDelete || isSavingChanges,
                            shouldHideZero: isNewRow,
                            mode: "integer",
                          }
                        )}
                      </TableCell>
                      <TableCell
                        data-cell-key={`${record.id}:fieldJoints`}
                        tabIndex={0}
                        className={getEditableCellClassName({
                          cellKey: `${record.id}:fieldJoints`,
                          selectedCellKey,
                          changedCellKeys,
                          isPendingDelete,
                        })}
                        onClick={() => setSelectedCellKey(`${record.id}:fieldJoints`)}
                        onFocusCapture={() => setSelectedCellKey(`${record.id}:fieldJoints`)}
                      >
                        {renderEditableNumber(
                          record.fieldJoints,
                          (value) =>
                            onUpdateRow(record.id, (draft) => {
                              draft.fieldJoints = value;
                            }),
                          {
                            disabled: isPendingDelete || isSavingChanges,
                            shouldHideZero: isNewRow,
                            mode: "integer",
                          }
                        )}
                      </TableCell>
                      {renderCalculatedCell({
                        cellKey: `${record.id}:totalJoints`,
                        value: record.totalJoints,
                        shouldHideValue: isNewRow && record.totalJoints === 0,
                        selectedCellKey,
                        onSelect: selectCell,
                        onShowMessage: () => setIsCalculatedCellDialogOpen(true),
                      })}
                      {renderCalculatedCell({
                        cellKey: `${record.id}:shopInchDia`,
                        value: record.shopInchDia,
                        isBlocked: isSizeMissing && record.shopJoints > 0,
                        shouldHideValue: isNewRow && record.shopJoints === 0,
                        selectedCellKey,
                        onSelect: selectCell,
                        onShowMessage: () => setIsCalculatedCellDialogOpen(true),
                      })}
                      {renderCalculatedCell({
                        cellKey: `${record.id}:fieldInchDia`,
                        value: record.fieldInchDia,
                        isBlocked: isSizeMissing && record.fieldJoints > 0,
                        shouldHideValue: isNewRow && record.fieldJoints === 0,
                        selectedCellKey,
                        onSelect: selectCell,
                        onShowMessage: () => setIsCalculatedCellDialogOpen(true),
                      })}
                      {renderCalculatedCell({
                        cellKey: `${record.id}:totalInchDia`,
                        value: record.totalInchDia,
                        isBlocked: isSizeMissing && record.totalJoints > 0,
                        shouldHideValue: isNewRow && record.totalJoints === 0,
                        selectedCellKey,
                        onSelect: selectCell,
                        onShowMessage: () => setIsCalculatedCellDialogOpen(true),
                      })}
                      <TableCell className={bodyCellClassName}>
                        <div className="flex justify-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className={isPendingDelete ? "text-slate-600 hover:text-slate-900" : "text-red-600 hover:text-red-700"}
                            disabled={isSavingChanges}
                            onClick={(event) => {
                              event.stopPropagation();
                              onDeleteRow(record);
                            }}
                            aria-label={isPendingDelete ? "Undo pending delete" : "Delete row"}
                          >
                            {isPendingDelete ? <Undo2 className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {rowError ? (
                      <TableRow className="bg-red-50 hover:bg-red-50">
                        <TableCell colSpan={11} className="border-b border-red-200 px-3 py-2 text-sm font-semibold text-red-700">
                          <span className="inline-flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            {rowError}
                          </span>
                        </TableCell>
                      </TableRow>
                    ) : null}
                    </Fragment>
                  );
                })}
          </TableBody>
          <TableFooter className="sticky bottom-0 z-20 bg-slate-50 shadow-[0_-1px_0_0_#e2e8f0]">
            {!isAllMocsView ? (
              <TableRow className="bg-slate-50 font-bold text-slate-950 hover:bg-blue-50">
                <TableCell colSpan={footerLabelColSpan + 1} className="border-b border-t border-r border-slate-200 px-3 py-1.5 text-left last:border-r-0">
                  <button
                    type="button"
                    disabled={isSavingChanges}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-bold text-indigo-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={onAddRow}
                  >
                    <Plus className="h-4 w-4" />
                    Add line item
                  </button>
                </TableCell>
                <TableCell className={combinedFooterCellClassName}>{formatNumber(totals.shopJoints)}</TableCell>
                <TableCell className={combinedFooterCellClassName}>{formatNumber(totals.fieldJoints)}</TableCell>
                <TableCell className={combinedFooterCellClassName}>{formatNumber(totals.totalJoints)}</TableCell>
                <TableCell className={combinedFooterCellClassName}>{formatNumber(totals.shopInchDia)}</TableCell>
                <TableCell className={combinedFooterCellClassName}>{formatNumber(totals.fieldInchDia)}</TableCell>
                <TableCell className={combinedFooterCellClassName}>{formatNumber(totals.totalInchDia)}</TableCell>
                <TableCell className={combinedFooterCellClassName} />
              </TableRow>
            ) : (
            <TableRow className="font-bold text-slate-950 hover:bg-transparent">
              <TableCell colSpan={footerLabelColSpan + 1} className={`${footerCellClassName} text-right`}>
                Visible Total
              </TableCell>
              <TableCell className={footerCellClassName}>{formatNumber(totals.shopJoints)}</TableCell>
              <TableCell className={footerCellClassName}>{formatNumber(totals.fieldJoints)}</TableCell>
              <TableCell className={footerCellClassName}>{formatNumber(totals.totalJoints)}</TableCell>
              <TableCell className={footerCellClassName}>{formatNumber(totals.shopInchDia)}</TableCell>
              <TableCell className={footerCellClassName}>{formatNumber(totals.fieldInchDia)}</TableCell>
              <TableCell className={footerCellClassName}>{formatNumber(totals.totalInchDia)}</TableCell>
              {!isAllMocsView ? <TableCell className={footerCellClassName} /> : null}
            </TableRow>
            )}
          </TableFooter>
        </table>

        {isEmpty && (
          <div className="flex h-60 items-center justify-center border-t text-sm text-slate-500">
            No pipe-size records match the current filters.
          </div>
        )}
        </div>
        {shouldUseFixedTableHeight ? (
          <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-50 w-3 border-l border-slate-300 bg-slate-200 shadow-inner">
            <div
              className="absolute left-1 top-0 w-1.5 rounded-full bg-slate-700 shadow-sm"
              style={{
                height: `${scrollIndicatorMetrics.isScrollable ? scrollIndicatorMetrics.thumbHeight : 80}px`,
                transform: `translateY(${scrollIndicatorMetrics.isScrollable ? scrollIndicatorMetrics.thumbTop : 0}px)`,
              }}
            />
          </div>
        ) : null}
      </div>

      <Dialog open={isCalculatedCellDialogOpen} onOpenChange={setIsCalculatedCellDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Read-only calculated value</DialogTitle>
            <DialogDescription>
              This cell cannot be edited directly. It is calculated based on the pipe size, shop
              joints, and field joints. Please update the related input fields in the same row to
              change this value.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsCalculatedCellDialogOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type SelectableReadOnlyCellOptions = {
  cellKey: string;
  value: string | number;
  selectedCellKey: string | null;
  onSelect: (cellKey: string) => void;
};

type RowStatus = {
  label: string;
  className: string;
} | null;

function getRowStatus({
  isEditedRow,
  isNewRow,
  isPendingDelete,
  hasError,
}: {
  isEditedRow: boolean;
  isNewRow: boolean;
  isPendingDelete: boolean;
  hasError: boolean;
}): RowStatus {
  if (hasError) return { label: "Error", className: "bg-red-100 text-red-700" };
  if (isPendingDelete) return { label: "Delete", className: "bg-red-100 text-red-700" };
  if (isNewRow) return { label: "New", className: "bg-blue-100 text-blue-700" };
  if (isEditedRow) return { label: "Edited", className: "bg-amber-100 text-amber-800" };
  return null;
}

function getEditableRowClassName(isPendingDelete: boolean, hasError: boolean) {
  if (hasError) return "bg-red-50 hover:bg-red-50";
  if (isPendingDelete) return "bg-red-50/70 opacity-75 hover:bg-red-50";
  return "bg-white hover:bg-white";
}

function getEditableCellClassName({
  cellKey,
  selectedCellKey,
  changedCellKeys,
  isPendingDelete,
}: {
  cellKey: string;
  selectedCellKey: string | null;
  changedCellKeys: Set<string>;
  isPendingDelete: boolean;
}) {
  const classes = [bodyCellClassName];

  if (changedCellKeys.has(cellKey)) {
    classes.push("bg-amber-50 ring-1 ring-inset ring-amber-300");
  }

  if (isPendingDelete) {
    classes.push("bg-red-50 text-red-700");
  }

  if (selectedCellKey === cellKey) {
    classes.push(selectedCellClassName);
  }

  return classes.join(" ");
}

function renderRowHeaderCell({
  cellKey,
  value,
  status,
  selectedCellKey,
  onSelect,
}: SelectableReadOnlyCellOptions & { status: RowStatus }) {
  const isSelected = selectedCellKey === cellKey;

  return (
    <TableCell
      data-cell-key={cellKey}
      tabIndex={0}
      className={`${bodyCellClassName} cursor-default text-slate-950 ${
        isSelected ? selectedCellClassName : ""
      }`}
      onClick={() => onSelect(cellKey)}
      onFocus={() => onSelect(cellKey)}
    >
      <span className="flex h-10 w-full flex-col items-center justify-center gap-0.5 px-1 font-semibold tabular-nums">
        <span>{value}</span>
        {status ? (
          <span className={`rounded px-1.5 py-0.5 text-[10px] leading-none ${status.className}`}>
            {status.label}
          </span>
        ) : null}
      </span>
    </TableCell>
  );
}

function renderReadOnlyCell({
  cellKey,
  value,
  selectedCellKey,
  onSelect,
}: SelectableReadOnlyCellOptions) {
  const isSelected = selectedCellKey === cellKey;

  return (
    <TableCell
      data-cell-key={cellKey}
      tabIndex={0}
      className={`${bodyCellClassName} cursor-default text-slate-950 ${
        isSelected ? selectedCellClassName : ""
      }`}
      onClick={() => onSelect(cellKey)}
      onFocus={() => onSelect(cellKey)}
    >
      <span className={readOnlyValueClassName} title={String(value)}>
        {value}
      </span>
    </TableCell>
  );
}

type CalculatedCellOptions = {
  cellKey: string;
  value: number;
  isBlocked?: boolean;
  shouldHideValue?: boolean;
  selectedCellKey: string | null;
  onSelect: (cellKey: string) => void;
  onShowMessage: () => void;
};

function renderCalculatedCell({
  cellKey,
  value,
  isBlocked = false,
  shouldHideValue = false,
  selectedCellKey,
  onSelect,
  onShowMessage,
}: CalculatedCellOptions) {
  const cellTitle = isBlocked
    ? "Enter pipe size to calculate inch-dia."
    : "Calculated value";
  const isSelected = selectedCellKey === cellKey;

  return (
    <TableCell
      data-cell-key={cellKey}
      tabIndex={0}
      className={`${bodyCellClassName} cursor-default text-slate-950 ${
        isSelected ? selectedCellClassName : ""
      }`}
      onClick={() => onSelect(cellKey)}
      onFocus={() => onSelect(cellKey)}
      onDoubleClick={onShowMessage}
    >
      <span
        className={calculatedValueClassName}
        title={shouldHideValue ? cellTitle : `${cellTitle}: ${formatNumber(value)}`}
      >
        {shouldHideValue ? "" : isBlocked ? "Set size" : formatNumber(value)}
      </span>
    </TableCell>
  );
}

function renderEditableText(
  value: string,
  placeholder: string,
  onChange: (value: string) => void,
  disabled = false
) {
  return (
    <Input
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={editableInputClassName}
    />
  );
}

function renderEditableNumber(
  value: number,
  onChange: (value: number) => void,
  options: { disabled?: boolean; mode?: "decimal" | "integer"; shouldHideZero?: boolean } = {}
) {
  return (
    <EditableNumberInput
      value={value}
      disabled={options.disabled}
      mode={options.mode ?? "decimal"}
      onChange={onChange}
      shouldHideZero={options.shouldHideZero}
    />
  );
}

function EditableNumberInput({
  value,
  disabled = false,
  mode,
  onChange,
  shouldHideZero = false,
}: {
  value: number;
  disabled?: boolean;
  mode: "decimal" | "integer";
  onChange: (value: number) => void;
  shouldHideZero?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(() => getNumberInputValue(value, shouldHideZero));

  useEffect(() => {
    if (!isEditing) {
      setDraftValue(getNumberInputValue(value, shouldHideZero));
    }
  }, [isEditing, shouldHideZero, value]);

  function commitValue(nextValue: string) {
    const trimmedValue = nextValue.trim();

    if (!trimmedValue || trimmedValue === ".") return;

    const parsedValue = Number(trimmedValue);

    if (Number.isFinite(parsedValue)) {
      onChange(mode === "integer" ? Math.trunc(parsedValue) : parsedValue);
    }
  }

  function handleBlur() {
    setIsEditing(false);
    commitValue(draftValue);
  }

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={draftValue}
      disabled={disabled}
      onFocus={() => setIsEditing(true)}
      onBlur={handleBlur}
      onChange={(event) => {
        const nextValue = event.target.value;

        const validPattern = mode === "integer" ? /^\d*$/ : /^\d*\.?\d*$/;

        if (!validPattern.test(nextValue)) return;

        setDraftValue(nextValue);
        commitValue(nextValue);
      }}
      className={editableInputClassName}
    />
  );
}

function getNumberInputValue(value: number, shouldHideZero: boolean) {
  if (shouldHideZero && toNumber(value) === 0) return "";
  return Number.isFinite(value) ? String(value) : "0";
}

function handleTableArrowNavigation(
  event: React.KeyboardEvent<HTMLTableElement>,
  setSelectedCellKey: (cellKey: string | null) => void
) {
  if (!isArrowNavigationKey(event.key)) return;

  const target = event.target;

  if (!(target instanceof HTMLElement)) return;

  const currentCell = target.closest("td");
  const currentRow = currentCell?.parentElement;
  const tableBody = currentRow?.parentElement;

  if (!currentCell || !currentRow || tableBody?.tagName !== "TBODY") return;

  const bodyRows = Array.from(tableBody.querySelectorAll(":scope > tr"));
  const currentRowIndex = bodyRows.indexOf(currentRow as HTMLTableRowElement);
  const currentCellIndex = currentCell.cellIndex;

  if (currentRowIndex < 0 || currentCellIndex < 0) return;

  const rowOffset = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
  const cellOffset = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
  const nextRow = bodyRows[currentRowIndex + rowOffset] as HTMLTableRowElement | undefined;
  const targetRow = nextRow ?? (currentRow as HTMLTableRowElement);
  const nextCell = getNavigableCell(targetRow, currentCellIndex + cellOffset, cellOffset);

  if (!nextCell || nextCell === currentCell) return;

  event.preventDefault();
  setSelectedCellKey(getCellKey(nextCell));
  moveFocusToTableCell(nextCell);
}

function isArrowNavigationKey(key: string) {
  return key === "ArrowLeft" || key === "ArrowRight" || key === "ArrowUp" || key === "ArrowDown";
}

function moveFocusToTableCell(cell: HTMLTableCellElement) {
  const focusTarget = cell.querySelector<HTMLElement>(
    "input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex='-1'])"
  );

  if (focusTarget) {
    focusTarget.focus();

    if (focusTarget instanceof HTMLInputElement) {
      focusTarget.select();
    }

    return;
  }

  cell.focus();
}

function getCellKey(cell: HTMLTableCellElement) {
  return cell.dataset.cellKey ?? null;
}

function getNavigableCell(row: HTMLTableRowElement, startIndex: number, direction: number) {
  const step = direction === 0 ? 1 : direction;
  let cellIndex = Math.min(Math.max(startIndex, 0), row.cells.length - 1);

  while (cellIndex >= 0 && cellIndex < row.cells.length) {
    const cell = row.cells[cellIndex];

    if (cell.dataset.cellKey) return cell;

    cellIndex += step;
  }

  return null;
}
