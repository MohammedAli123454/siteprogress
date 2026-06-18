import type { RecordTotals } from "../domain/calculations";
import { formatNumber } from "../domain/calculations";

export function SummaryProgressCard({ totals }: { totals: RecordTotals }) {
  return (
    <div className="grid max-w-[660px] gap-3 sm:grid-cols-2">
      <TotalTile label="Total Joints" value={totals.totalJoints} />
      <TotalTile label="Total Inch Dia" value={totals.totalInchDia} />
    </div>
  );
}

function TotalTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold leading-none text-slate-950">
        {formatNumber(value)}
      </div>
    </div>
  );
}
