"use client";

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

import {
  formatNumber,
  getPercent,
  getPipeSizeValue,
  getRowPercent,
  toNumber,
} from "../domain/calculations";
import type {
  MocProgressSummary,
  ProgressRegisterRow,
  ProgressScope,
  ProgressTotals,
} from "../domain/types";

const headerCellClassName =
  "border-b border-r border-slate-200 px-2 py-3 text-center font-bold leading-tight text-slate-600 last:border-r-0";
const bodyCellClassName =
  "border-b border-r border-slate-200 p-0 text-center align-middle text-slate-950 last:border-r-0";
const readOnlyValueClassName =
  "flex h-12 w-full items-center justify-center truncate px-2 font-semibold tabular-nums";
const footerCellClassName =
  "border-t border-r border-slate-200 px-3 py-3 text-center align-middle font-bold text-slate-950 last:border-r-0";
const progressInputClassName =
  "h-12 w-full rounded-none border-0 bg-transparent px-2 text-center font-semibold text-slate-950 shadow-none outline-none transition placeholder:text-slate-400 focus-visible:bg-blue-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500";

type ProgressRegisterTableProps = {
  isAllMocsView: boolean;
  rows: ProgressRegisterRow[];
  mocSummaries: MocProgressSummary[];
  scope: ProgressScope;
  totals: ProgressTotals;
  draftProgress: Map<number, number>;
  getScopeJoints: (row: ProgressRegisterRow) => number;
  getPreviousJoints: (row: ProgressRegisterRow) => number;
  getRemainingJoints: (row: ProgressRegisterRow) => number;
  onProgressChange: (row: ProgressRegisterRow, value: string) => void;
};

export function ProgressRegisterTable({
  isAllMocsView,
  rows,
  mocSummaries,
  scope,
  totals,
  draftProgress,
  getScopeJoints,
  getPreviousJoints,
  getRemainingJoints,
  onProgressChange,
}: ProgressRegisterTableProps) {
  const isEmpty = isAllMocsView ? mocSummaries.length === 0 : rows.length === 0;

  return (
    <div className="min-w-0 overflow-hidden rounded-md border border-slate-200">
      <div className="h-[calc(100vh-250px)] min-h-[540px] [&>div]:h-full [&>div]:overflow-auto">
        {isAllMocsView ? (
          <AllMocSummaryTable summaries={mocSummaries} scope={scope} />
        ) : (
          <SingleMocProgressTable
            rows={rows}
            totals={totals}
            draftProgress={draftProgress}
            getScopeJoints={getScopeJoints}
            getPreviousJoints={getPreviousJoints}
            getRemainingJoints={getRemainingJoints}
            onProgressChange={onProgressChange}
          />
        )}

        {isEmpty ? (
          <div className="flex h-60 items-center justify-center border-t text-sm text-slate-500">
            No progress rows match the current filters.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SingleMocProgressTable({
  rows,
  totals,
  draftProgress,
  getScopeJoints,
  getPreviousJoints,
  getRemainingJoints,
  onProgressChange,
}: {
  rows: ProgressRegisterRow[];
  totals: ProgressTotals;
  draftProgress: Map<number, number>;
  getScopeJoints: (row: ProgressRegisterRow) => number;
  getPreviousJoints: (row: ProgressRegisterRow) => number;
  getRemainingJoints: (row: ProgressRegisterRow) => number;
  onProgressChange: (row: ProgressRegisterRow, value: string) => void;
}) {
  return (
    <Table className="w-full min-w-[1040px] table-fixed border-separate border-spacing-0 text-sm">
      <colgroup>
        <col style={{ width: 58 }} />
        <col style={{ width: 58 }} />
        <col style={{ width: 112 }} />
        <col style={{ width: 92 }} />
        <col style={{ width: 92 }} />
        <col style={{ width: 108 }} />
        <col style={{ width: 92 }} />
        <col style={{ width: 90 }} />
        <col style={{ width: 112 }} />
        <col style={{ width: 112 }} />
        <col style={{ width: 70 }} />
      </colgroup>
      <TableHeader className="sticky top-0 z-30 bg-slate-100 shadow-sm">
        <TableRow className="hover:bg-transparent">
          <TableHead className={headerCellClassName}>Size</TableHead>
          <TableHead className={headerCellClassName}>Thk</TableHead>
          <TableHead className={headerCellClassName}>Schedule</TableHead>
          <TableHead className={headerCellClassName}>Scope<br />Joints</TableHead>
          <TableHead className={headerCellClassName}>Previous<br />Done</TableHead>
          <TableHead className={headerCellClassName}>New Progress</TableHead>
          <TableHead className={headerCellClassName}>Total<br />Done</TableHead>
          <TableHead className={headerCellClassName}>Balance</TableHead>
          <TableHead className={headerCellClassName}>New Inch Dia</TableHead>
          <TableHead className={headerCellClassName}>Done Inch Dia</TableHead>
          <TableHead className={headerCellClassName}>%</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="[&_tr:hover]:bg-white">
        {rows.map((row) => {
          const scopeJoints = getScopeJoints(row);
          const previousJoints = getPreviousJoints(row);
          const remainingJoints = getRemainingJoints(row);
          const newProgressJoints = toNumber(draftProgress.get(row.jointRecordId));
          const totalDoneJoints = previousJoints + newProgressJoints;
          const balanceJoints = Math.max(0, scopeJoints - totalDoneJoints);
          const sizeValue = getPipeSizeValue(row);

          return (
            <TableRow key={row.jointRecordId} className="bg-white">
              {renderReadOnlyCell(row.sizeInches)}
              {renderReadOnlyCell(formatNumber(row.thickness))}
              {renderReadOnlyCell(row.pipeSchedule)}
              {renderReadOnlyCell(formatNumber(scopeJoints))}
              {renderReadOnlyCell(formatNumber(previousJoints))}
              <TableCell className={bodyCellClassName}>
                <Input
                  type="text"
                  inputMode="numeric"
                  disabled={remainingJoints === 0}
                  value={newProgressJoints || ""}
                  placeholder={remainingJoints === 0 ? "Done" : "0"}
                  className={progressInputClassName}
                  onChange={(event) => onProgressChange(row, event.target.value)}
                />
              </TableCell>
              {renderReadOnlyCell(formatNumber(totalDoneJoints))}
              {renderReadOnlyCell(formatNumber(balanceJoints))}
              {renderReadOnlyCell(formatNumber(newProgressJoints * sizeValue))}
              {renderReadOnlyCell(formatNumber(totalDoneJoints * sizeValue))}
              {renderReadOnlyCell(`${getRowPercent(totalDoneJoints, scopeJoints)}%`)}
            </TableRow>
          );
        })}
      </TableBody>
      <TableFooter className="sticky bottom-0 z-20 bg-slate-50 shadow-[0_-1px_0_0_#e2e8f0]">
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={3} className={`${footerCellClassName} text-right`}>
            Visible Total
          </TableCell>
          <TableCell className={footerCellClassName}>{formatNumber(totals.scopeJoints)}</TableCell>
          <TableCell className={footerCellClassName}>{formatNumber(totals.previousJoints)}</TableCell>
          <TableCell className={footerCellClassName}>
            {formatNumber(totals.newProgressJoints)}
          </TableCell>
          <TableCell className={footerCellClassName}>
            {formatNumber(totals.totalDoneJoints)}
          </TableCell>
          <TableCell className={footerCellClassName}>{formatNumber(totals.balanceJoints)}</TableCell>
          <TableCell className={footerCellClassName}>
            {formatNumber(totals.newProgressInchDia)}
          </TableCell>
          <TableCell className={footerCellClassName}>
            {formatNumber(totals.totalDoneInchDia)}
          </TableCell>
          <TableCell className={footerCellClassName}>
            {getPercent(totals.totalDoneJoints, totals.scopeJoints)}%
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

function AllMocSummaryTable({
  summaries,
  scope,
}: {
  summaries: MocProgressSummary[];
  scope: ProgressScope;
}) {
  const totals = summaries.reduce<ProgressTotals>(
    (currentTotals, summary) => ({
      scopeJoints: currentTotals.scopeJoints + summary.scopeJoints,
      scopeInchDia: currentTotals.scopeInchDia + summary.scopeInchDia,
      previousJoints: currentTotals.previousJoints + summary.previousJoints,
      newProgressJoints: 0,
      totalDoneJoints: currentTotals.totalDoneJoints + summary.totalDoneJoints,
      balanceJoints: currentTotals.balanceJoints + summary.balanceJoints,
      newProgressInchDia: 0,
      totalDoneInchDia: currentTotals.totalDoneInchDia + summary.totalDoneInchDia,
    }),
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

  return (
    <Table className="w-full min-w-[980px] table-fixed border-separate border-spacing-0 text-sm">
      <colgroup>
        <col style={{ width: 150 }} />
        <col style={{ width: 300 }} />
        <col style={{ width: 110 }} />
        <col style={{ width: 110 }} />
        <col style={{ width: 110 }} />
        <col style={{ width: 110 }} />
        <col style={{ width: 120 }} />
        <col style={{ width: 80 }} />
      </colgroup>
      <TableHeader className="sticky top-0 z-30 bg-slate-100 shadow-sm">
        <TableRow className="hover:bg-transparent">
          <TableHead className={headerCellClassName}>MOC</TableHead>
          <TableHead className={headerCellClassName}>Project</TableHead>
          <TableHead className={headerCellClassName}>{scopeTitle(scope)} Scope</TableHead>
          <TableHead className={headerCellClassName}>Done</TableHead>
          <TableHead className={headerCellClassName}>Balance</TableHead>
          <TableHead className={headerCellClassName}>Scope Inch Dia</TableHead>
          <TableHead className={headerCellClassName}>Done Inch Dia</TableHead>
          <TableHead className={headerCellClassName}>%</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="[&_tr:hover]:bg-white">
        {summaries.map((summary) => {
          const donePercent = getPercent(summary.totalDoneJoints, summary.scopeJoints);

          return (
            <TableRow key={summary.moc} className="bg-white">
              {renderReadOnlyCell(summary.moc)}
              {renderReadOnlyCell(summary.mocName)}
              {renderReadOnlyCell(formatNumber(summary.scopeJoints))}
              {renderReadOnlyCell(formatNumber(summary.totalDoneJoints))}
              {renderReadOnlyCell(formatNumber(summary.balanceJoints))}
              {renderReadOnlyCell(formatNumber(summary.scopeInchDia))}
              {renderReadOnlyCell(formatNumber(summary.totalDoneInchDia))}
              {renderReadOnlyCell(`${donePercent}%`)}
            </TableRow>
          );
        })}
      </TableBody>
      <TableFooter className="sticky bottom-0 z-20 bg-slate-50 shadow-[0_-1px_0_0_#e2e8f0]">
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={2} className={`${footerCellClassName} text-right`}>
            Grand Total
          </TableCell>
          <TableCell className={footerCellClassName}>{formatNumber(totals.scopeJoints)}</TableCell>
          <TableCell className={footerCellClassName}>
            {formatNumber(totals.totalDoneJoints)}
          </TableCell>
          <TableCell className={footerCellClassName}>{formatNumber(totals.balanceJoints)}</TableCell>
          <TableCell className={footerCellClassName}>{formatNumber(totals.scopeInchDia)}</TableCell>
          <TableCell className={footerCellClassName}>
            {formatNumber(totals.totalDoneInchDia)}
          </TableCell>
          <TableCell className={footerCellClassName}>
            {getPercent(totals.totalDoneJoints, totals.scopeJoints)}%
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

function renderReadOnlyCell(value: string | number) {
  return (
    <TableCell className={bodyCellClassName}>
      <span className={readOnlyValueClassName} title={String(value)}>
        {value}
      </span>
    </TableCell>
  );
}

function scopeTitle(scope: ProgressScope) {
  return scope === "SHOP" ? "Shop" : "Field";
}
