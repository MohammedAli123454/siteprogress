"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

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
  Table,
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
const editableInputClassName =
  "h-10 w-full rounded-none border-0 bg-transparent px-2 text-center font-semibold text-slate-950 shadow-none outline-none transition placeholder:text-slate-400 focus-visible:ring-0";

type RecordsTableProps = {
  isAllMocsView: boolean;
  consolidatedRows: ConsolidatedPipeRow[];
  filteredRecords: JointRecord[];
  savingRowIds: Set<number>;
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
  savingRowIds,
  totals,
  footerLabelColSpan,
  onAddRow,
  onUpdateRow,
  onDeleteRow,
}: RecordsTableProps) {
  const tableShellRef = useRef<HTMLDivElement>(null);
  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null);
  const [isCalculatedCellDialogOpen, setIsCalculatedCellDialogOpen] = useState(false);
  const isEmpty = isAllMocsView
    ? consolidatedRows.length === 0
    : filteredRecords.length === 0;

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

  function selectCell(cellKey: string) {
    setSelectedCellKey(cellKey);
  }

  return (
    <>
      <div ref={tableShellRef} className="min-w-0 overflow-hidden rounded-md border border-slate-200">
        <div className="h-[calc(100vh-250px)] min-h-[540px] [&>div]:h-full [&>div]:overflow-auto">
        <Table
          className="w-full min-w-[930px] table-fixed border-separate border-spacing-0 text-sm"
          onKeyDownCapture={(event) => handleTableArrowNavigation(event, setSelectedCellKey)}
        >
          <colgroup>
            <col style={{ width: 48 }} />
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
          <TableBody className="[&_tr:hover]:bg-white">
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
                  const isSaving = savingRowIds.has(record.id);
                  const isSizeMissing = parsePipeSize(record.sizeInches) === 0;

                  return (
                    <TableRow
                      key={record.id}
                      className="bg-white"
                    >
                      {renderReadOnlyCell({
                        cellKey: `${record.id}:serialNumber`,
                        value: index + 1,
                        selectedCellKey,
                        onSelect: selectCell,
                      })}
                      <TableCell
                        data-cell-key={`${record.id}:sizeInches`}
                        tabIndex={0}
                        className={`${bodyCellClassName} ${
                          selectedCellKey === `${record.id}:sizeInches` ? selectedCellClassName : ""
                        }`}
                        onClick={() => setSelectedCellKey(`${record.id}:sizeInches`)}
                        onFocusCapture={() => setSelectedCellKey(`${record.id}:sizeInches`)}
                      >
                        {renderEditableText(record.sizeInches, isNewRow ? "" : "Pipe size", (value) =>
                          onUpdateRow(record.id, (draft) => {
                            draft.sizeInches = value;
                          })
                        )}
                      </TableCell>
                      <TableCell
                        data-cell-key={`${record.id}:thickness`}
                        tabIndex={0}
                        className={`${bodyCellClassName} ${
                          selectedCellKey === `${record.id}:thickness` ? selectedCellClassName : ""
                        }`}
                        onClick={() => setSelectedCellKey(`${record.id}:thickness`)}
                        onFocusCapture={() => setSelectedCellKey(`${record.id}:thickness`)}
                      >
                        {renderEditableNumber(
                          record.thickness,
                          (value) =>
                            onUpdateRow(record.id, (draft) => {
                              draft.thickness = value;
                            }),
                          { shouldHideZero: isNewRow, mode: "integer" }
                        )}
                      </TableCell>
                      <TableCell
                        data-cell-key={`${record.id}:pipeSchedule`}
                        tabIndex={0}
                        className={`${bodyCellClassName} ${
                          selectedCellKey === `${record.id}:pipeSchedule` ? selectedCellClassName : ""
                        }`}
                        onClick={() => setSelectedCellKey(`${record.id}:pipeSchedule`)}
                        onFocusCapture={() => setSelectedCellKey(`${record.id}:pipeSchedule`)}
                      >
                        {renderEditableText(record.pipeSchedule, "", (value) =>
                          onUpdateRow(record.id, (draft) => {
                            draft.pipeSchedule = value;
                          })
                        )}
                      </TableCell>
                      <TableCell
                        data-cell-key={`${record.id}:shopJoints`}
                        tabIndex={0}
                        className={`${bodyCellClassName} ${
                          selectedCellKey === `${record.id}:shopJoints` ? selectedCellClassName : ""
                        }`}
                        onClick={() => setSelectedCellKey(`${record.id}:shopJoints`)}
                        onFocusCapture={() => setSelectedCellKey(`${record.id}:shopJoints`)}
                      >
                        {renderEditableNumber(
                          record.shopJoints,
                          (value) =>
                            onUpdateRow(record.id, (draft) => {
                              draft.shopJoints = value;
                            }),
                          { shouldHideZero: isNewRow, mode: "integer" }
                        )}
                      </TableCell>
                      <TableCell
                        data-cell-key={`${record.id}:fieldJoints`}
                        tabIndex={0}
                        className={`${bodyCellClassName} ${
                          selectedCellKey === `${record.id}:fieldJoints` ? selectedCellClassName : ""
                        }`}
                        onClick={() => setSelectedCellKey(`${record.id}:fieldJoints`)}
                        onFocusCapture={() => setSelectedCellKey(`${record.id}:fieldJoints`)}
                      >
                        {renderEditableNumber(
                          record.fieldJoints,
                          (value) =>
                            onUpdateRow(record.id, (draft) => {
                              draft.fieldJoints = value;
                            }),
                          { shouldHideZero: isNewRow, mode: "integer" }
                        )}
                      </TableCell>
                      {renderCalculatedCell({
                        cellKey: `${record.id}:totalJoints`,
                        value: record.totalJoints,
                        shouldHideValue: isNewRow,
                        selectedCellKey,
                        onSelect: selectCell,
                        onShowMessage: () => setIsCalculatedCellDialogOpen(true),
                      })}
                      {renderCalculatedCell({
                        cellKey: `${record.id}:shopInchDia`,
                        value: record.shopInchDia,
                        isBlocked: isSizeMissing && record.shopJoints > 0,
                        shouldHideValue: isNewRow,
                        selectedCellKey,
                        onSelect: selectCell,
                        onShowMessage: () => setIsCalculatedCellDialogOpen(true),
                      })}
                      {renderCalculatedCell({
                        cellKey: `${record.id}:fieldInchDia`,
                        value: record.fieldInchDia,
                        isBlocked: isSizeMissing && record.fieldJoints > 0,
                        shouldHideValue: isNewRow,
                        selectedCellKey,
                        onSelect: selectCell,
                        onShowMessage: () => setIsCalculatedCellDialogOpen(true),
                      })}
                      {renderCalculatedCell({
                        cellKey: `${record.id}:totalInchDia`,
                        value: record.totalInchDia,
                        isBlocked: isSizeMissing && record.totalJoints > 0,
                        shouldHideValue: isNewRow,
                        selectedCellKey,
                        onSelect: selectCell,
                        onShowMessage: () => setIsCalculatedCellDialogOpen(true),
                      })}
                      <TableCell className={bodyCellClassName}>
                        <div className="flex justify-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            disabled={isSaving}
                            onClick={(event) => {
                              event.stopPropagation();
                              onDeleteRow(record);
                            }}
                            aria-label="Delete row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
          <TableFooter className="sticky bottom-0 z-20 bg-slate-50 shadow-[0_-1px_0_0_#e2e8f0]">
            {!isAllMocsView ? (
              <TableRow className="bg-slate-50 hover:bg-blue-50">
                <TableCell colSpan={11} className="border-t border-slate-200 p-0">
                  <button
                    type="button"
                    className="flex h-11 w-full items-center justify-center gap-2 text-sm font-bold text-slate-600 transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                    onClick={onAddRow}
                  >
                    <Plus className="h-4 w-4" />
                    Add line item
                  </button>
                </TableCell>
              </TableRow>
            ) : null}
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
          </TableFooter>
        </Table>

        {isEmpty && (
          <div className="flex h-60 items-center justify-center border-t text-sm text-slate-500">
            No pipe-size records match the current filters.
          </div>
        )}
        </div>
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
  onChange: (value: string) => void
) {
  return (
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={editableInputClassName}
    />
  );
}

function renderEditableNumber(
  value: number,
  onChange: (value: number) => void,
  options: { mode?: "decimal" | "integer"; shouldHideZero?: boolean } = {}
) {
  return (
    <EditableNumberInput
      value={value}
      mode={options.mode ?? "decimal"}
      onChange={onChange}
      shouldHideZero={options.shouldHideZero}
    />
  );
}

function EditableNumberInput({
  value,
  mode,
  onChange,
  shouldHideZero = false,
}: {
  value: number;
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
