import type { ProgressTotals } from "../domain/types";
import { formatNumber, getPercent } from "../domain/calculations";

export function ProgressSummaryCard({ totals }: { totals: ProgressTotals }) {
  const progressPercent = getPercent(totals.totalDoneJoints, totals.scopeJoints);

  return (
    <aside className="h-fit rounded-md border border-slate-200 bg-white p-4 shadow-sm xl:sticky xl:top-4">
      <div className="border-b border-slate-200 pb-3">
        <h3 className="text-base font-bold text-slate-950">Progress Summary</h3>
      </div>
      <div className="mt-4 space-y-5">
        <ProgressMetric
          label="Scope Joints"
          value={totals.scopeJoints}
          percent={100}
          tone="slate"
        />
        <ProgressMetric
          label="Previous Done"
          value={totals.previousJoints}
          percent={getPercent(totals.previousJoints, totals.scopeJoints)}
          tone="blue"
        />
        <ProgressMetric
          label="New Progress"
          value={totals.newProgressJoints}
          percent={getPercent(totals.newProgressJoints, totals.scopeJoints)}
          tone="emerald"
        />
        <ProgressMetric
          label="Balance"
          value={totals.balanceJoints}
          percent={getPercent(totals.balanceJoints, totals.scopeJoints)}
          tone="amber"
        />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4">
        <TotalTile label="Total Done" value={totals.totalDoneJoints} />
        <TotalTile label="Progress %" value={`${progressPercent}%`} />
        <TotalTile label="New Inch Dia" value={totals.newProgressInchDia} />
        <TotalTile label="Done Inch Dia" value={totals.totalDoneInchDia} />
      </div>
    </aside>
  );
}

function TotalTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold leading-none text-slate-950">
        {typeof value === "number" ? formatNumber(value) : value}
      </div>
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
  tone: "blue" | "emerald" | "amber" | "slate";
}) {
  const barClassByTone = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    slate: "bg-slate-500",
  };

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
        <div
          className={`h-full rounded-full ${barClassByTone[tone]}`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  );
}
