"use client";

import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import {
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
  "border-b-2 border-b-teal-400 border-r border-r-emerald-100 px-2 py-2 text-center text-xs font-extrabold uppercase leading-tight tracking-[0.08em] text-teal-700 last:border-r-0";
const bodyCellClassName =
  "border-b border-r border-slate-200 p-0 text-center align-middle text-slate-950 last:border-r-0";
const readOnlyValueClassName =
  "flex h-9 w-full items-center justify-center truncate px-2 font-semibold tabular-nums";
const footerCellClassName =
  "border-t border-r border-slate-200 px-3 py-2 text-center align-middle font-bold text-slate-950 last:border-r-0";
const progressInputClassName =
  "h-9 w-full rounded-none border-0 bg-transparent px-2 text-center font-semibold text-slate-950 shadow-none outline-none transition placeholder:text-slate-400 focus-visible:bg-blue-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500";

type ScrollIndicatorMetrics = {
  isScrollable: boolean;
  thumbHeight: number;
  thumbTop: number;
};

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
  const tableRowCount = isAllMocsView ? mocSummaries.length : rows.length;
  const shouldUseFixedTableHeight = tableRowCount >= 8;
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [scrollIndicatorMetrics, setScrollIndicatorMetrics] =
    useState<ScrollIndicatorMetrics>({
      isScrollable: false,
      thumbHeight: 48,
      thumbTop: 0,
    });

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

  return (
    <div className="relative w-full min-w-0 max-w-full overflow-hidden rounded-md border border-slate-200">
      <div
        ref={tableScrollRef}
        data-progress-register-scroll-container
        className={
          shouldUseFixedTableHeight
            ? "joint-records-table-scroll-container h-[calc(100dvh-210px)] min-h-[500px] max-w-full"
            : "overflow-auto"
        }
      >
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
    <table className="w-full min-w-[1040px] table-fixed border-separate border-spacing-0 text-sm">
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
      <TableHeader className="sticky top-0 z-30 bg-emerald-50 shadow-sm">
        <TableRow className="hover:bg-transparent">
          <TableHead className={headerCellClassName}>Size</TableHead>
          <TableHead className={headerCellClassName}>Thk</TableHead>
          <TableHead className={headerCellClassName}>Schedule</TableHead>
          <TableHead className={headerCellClassName}>Total<br />Joints</TableHead>
          <TableHead className={headerCellClassName}>Previous<br />Completed</TableHead>
          <TableHead className={headerCellClassName}>Current<br />Progress</TableHead>
          <TableHead className={headerCellClassName}>Overall<br />Completed</TableHead>
          <TableHead className={headerCellClassName}>Balance<br />Joints</TableHead>
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
    </table>
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
    <table className="w-full min-w-[980px] table-fixed border-separate border-spacing-0 text-sm">
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
      <TableHeader className="sticky top-0 z-30 bg-emerald-50 shadow-sm">
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
    </table>
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
