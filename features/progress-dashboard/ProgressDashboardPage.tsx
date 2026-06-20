"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  CircleDashed,
  Clock,
  Loader2,
  Wrench,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import Select, {
  type FormatOptionLabelMeta,
  type SingleValue,
  type StylesConfig,
} from "react-select";

import { fetchProgressRegisterRows } from "@/features/progress-register/data/client-api";
import { getPipeSizeValue, getPercent, toNumber } from "@/features/progress-register/domain/calculations";
import { ALL_MOCS } from "@/features/progress-register/domain/constants";
import type { ProgressRegisterRow } from "@/features/progress-register/domain/types";
import { cn } from "@/lib/utils";

type ScopeFilter = "ALL" | "SHOP" | "FIELD";
type MetricFilter = "JOINTS" | "INCH_DIA";

type ProgressSummary = {
  moc: string;
  mocName: string;
  rowCount: number;
  shopScopeJoints: number;
  fieldScopeJoints: number;
  shopDoneJoints: number;
  fieldDoneJoints: number;
  shopScopeInchDia: number;
  fieldScopeInchDia: number;
  shopDoneInchDia: number;
  fieldDoneInchDia: number;
};

type ScopedMetricValues = {
  scope: number;
  done: number;
  balance: number;
  percent: number;
};

const emptyRows: ProgressRegisterRow[] = [];

const metricOptions: { value: MetricFilter; label: string }[] = [
  { value: "JOINTS", label: "Joints" },
  { value: "INCH_DIA", label: "Inch Dia" },
];

const palette = {
  done: "#4f46e5",
};

type MocOption = {
  value: string;
  label: string;
  detail?: string;
};

const mocSelectStyles: StylesConfig<MocOption, false> = {
  control: (baseStyles) => ({
    ...baseStyles,
    minHeight: 40,
    width: "100%",
    minWidth: 0,
    backgroundColor: "transparent",
    border: "none",
    borderRadius: 8,
    boxShadow: "none",
    cursor: "pointer",
  }),
  container: (baseStyles) => ({
    ...baseStyles,
    flex: 1,
    minWidth: 0,
  }),
  valueContainer: (baseStyles) => ({
    ...baseStyles,
    padding: "0 4px",
  }),
  input: (baseStyles) => ({ ...baseStyles, margin: 0, padding: 0 }),
  placeholder: (baseStyles) => ({ ...baseStyles, color: "#94a3b8" }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (baseStyles) => ({
    ...baseStyles,
    color: "#94a3b8",
    padding: "0 4px",
  }),
  menu: (baseStyles) => ({
    ...baseStyles,
    borderRadius: 12,
    overflow: "hidden",
    zIndex: 50,
    minWidth: 360,
  }),
  option: (baseStyles, state) => ({
    ...baseStyles,
    backgroundColor: state.isSelected ? "#0f172a" : state.isFocused ? "#eff6ff" : "#ffffff",
    color: state.isSelected ? "#ffffff" : "#0f172a",
    cursor: "pointer",
    padding: "10px 14px",
  }),
};

function formatMocOptionLabel(option: MocOption, meta: FormatOptionLabelMeta<MocOption>) {
  if (meta.context === "value") {
    return <span className="truncate text-sm font-bold text-slate-900">{option.label}</span>;
  }

  return (
    <div className="min-w-0">
      <div className="truncate text-sm font-bold">{option.label}</div>
      {option.detail ? <div className="truncate text-xs opacity-75">{option.detail}</div> : null}
    </div>
  );
}

export default function ProgressDashboardPage() {
  const [selectedMoc, setSelectedMoc] = useState(ALL_MOCS);
  const [metricFilter, setMetricFilter] = useState<MetricFilter>("JOINTS");

  const {
    data: rows,
    isLoading,
    isError,
    error,
  } = useQuery<ProgressRegisterRow[]>({
    queryKey: ["progress-dashboard-rows"],
    queryFn: fetchProgressRegisterRows,
    retry: 1,
    staleTime: 60 * 1000,
  });

  const safeRows = rows ?? emptyRows;

  const mocSummaries = useMemo(() => buildMocSummaries(safeRows), [safeRows]);
  const selectedRows = useMemo(
    () => (selectedMoc === ALL_MOCS ? safeRows : safeRows.filter((row) => row.moc === selectedMoc)),
    [safeRows, selectedMoc]
  );
  const selectedSummary = useMemo(() => summarizeRows(selectedRows), [selectedRows]);
  const allValues = getScopedMetricValues(selectedSummary, "ALL", metricFilter);
  const shopValues = getScopedMetricValues(selectedSummary, "SHOP", metricFilter);
  const fieldValues = getScopedMetricValues(selectedSummary, "FIELD", metricFilter);
  const filteredSummaries = selectedMoc === ALL_MOCS
    ? mocSummaries
    : mocSummaries.filter((summary) => summary.moc === selectedMoc);
  const mocSelectOptions: MocOption[] = [
    { value: ALL_MOCS, label: "All MOC Names", detail: "Overall progress summary" },
    ...mocSummaries.map((summary) => ({
      value: summary.moc,
      label: summary.mocName || summary.moc,
      detail: summary.moc,
    })),
  ];
  const selectedMocOption =
    mocSelectOptions.find((option) => option.value === selectedMoc) ?? mocSelectOptions[0];
  const unitLabel = metricFilter === "JOINTS" ? "Joints" : "Inch-Dia";

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-slate-50 py-4 pl-[var(--page-left-offset,2.75rem)] pr-3">
      <div className="mx-auto max-w-none space-y-4">
        <header className="flex flex-wrap items-center gap-5 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
            <Wrench className="h-6 w-6" />
          </div>

          <div className="min-w-0 shrink-0">
            <h1 className="truncate bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-base font-extrabold tracking-tight text-transparent sm:text-lg">
              Weld Joints Progress Dashboard
            </h1>
            <p className="mt-0.5 text-sm font-semibold text-slate-500">
              Fabrication and Fields Weld Joints Tracking
            </p>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-3.5">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border-[1.5px] border-slate-200 bg-slate-50 pl-4 pr-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">MOC</span>
              <Select<MocOption, false>
                instanceId="dashboard-moc-select"
                isSearchable
                options={mocSelectOptions}
                value={selectedMocOption}
                placeholder="Select MOC name"
                styles={mocSelectStyles}
                formatOptionLabel={formatMocOptionLabel}
                onChange={(option: SingleValue<MocOption>) =>
                  setSelectedMoc(option?.value ?? ALL_MOCS)
                }
              />
            </div>

            <MetricToggle value={metricFilter} onChange={setMetricFilter} />
          </div>
        </header>

        {isLoading ? (
          <div className="flex h-[520px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error instanceof Error ? error.message : "Could not load progress dashboard."}
          </div>
        ) : (
          <>
            {/* All welds (Shop + Field combined) */}
            <ScopePanel
              keyword="Overall"
              accent="#6366f1"
              accentSoft="#f4f5fe"
              values={allValues}
              unitLabel={unitLabel}
            />

            {/* Shop only */}
            <ScopePanel
              keyword="Shop"
              accent="#0d9488"
              accentSoft="#f0faf7"
              values={shopValues}
              unitLabel={unitLabel}
            />

            {/* Field only */}
            <ScopePanel
              keyword="Field"
              accent="#9333ea"
              accentSoft="#f9f3fe"
              values={fieldValues}
              unitLabel={unitLabel}
            />

            {/* Progress details */}
            <section>
              <ProgressDetailsTable
                isAllMocsView={selectedMoc === ALL_MOCS}
                metric={metricFilter}
                scope="ALL"
                rows={selectedRows}
                summaries={filteredSummaries}
              />
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-extrabold tracking-tight text-slate-800">{children}</h2>;
}

function MetricToggle({
  value,
  onChange,
}: {
  value: MetricFilter;
  onChange: (value: MetricFilter) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Metric"
      className="relative inline-flex h-11 shrink-0 items-center rounded-xl bg-indigo-100/70 p-1"
    >
      <span
        aria-hidden
        className={cn(
          "absolute bottom-1 left-1 top-1 w-[92px] rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 shadow-sm transition-transform duration-200 ease-out",
          value === "INCH_DIA" ? "translate-x-[92px]" : "translate-x-0"
        )}
      />
      {metricOptions.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative z-10 w-[92px] rounded-lg text-sm font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400",
              selected ? "text-white" : "text-indigo-500/80 hover:text-indigo-700"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function ScopePanel({
  keyword,
  accent,
  accentSoft,
  values,
  unitLabel,
}: {
  keyword: string;
  accent: string;
  accentSoft: string;
  values: ScopedMetricValues;
  unitLabel: string;
}) {
  const remaining = Math.max(0, 100 - values.percent);

  return (
    <section className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
      {/* Segment + donut */}
      <div className="flex items-center gap-6 p-6" style={{ backgroundColor: accentSoft }}>
        <CompletionDonut
          percent={values.percent}
          done={values.done}
          balance={values.balance}
          accent={accent}
          size={104}
        />
        <div className="min-w-0">
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white"
            style={{ backgroundColor: accent }}
          >
            {keyword}
          </span>
          <div className="mt-2.5 text-lg font-extrabold tracking-tight text-slate-900">
            Weld Joints Progress
          </div>
          <div className="mt-0.5 text-sm font-semibold text-slate-400">
            Measured in {unitLabel}
          </div>
        </div>
      </div>

      <MetricCell
        iconColor="#4f46e5"
        iconBg="#eef2ff"
        label="Scope"
        value={formatNumber(values.scope)}
        caption={`Total ${unitLabel.toLowerCase()} planned`}
        icon={<Clock className="h-5 w-5" />}
      />
      <MetricCell
        iconColor="#059669"
        iconBg="#ecfdf5"
        label="Completed"
        value={formatNumber(values.done)}
        caption={`${values.percent}% of scope done`}
        icon={<CheckCircle2 className="h-5 w-5" />}
      />
      <MetricCell
        iconColor="#f59e0b"
        iconBg="#fef3e2"
        label="Balance"
        value={formatNumber(values.balance)}
        caption={`${remaining}% remaining`}
        icon={<CircleDashed className="h-5 w-5" />}
      />
    </section>
  );
}

function MetricCell({
  iconColor,
  iconBg,
  label,
  value,
  caption,
  icon,
}: {
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  caption: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 border-t border-slate-100 p-6 lg:border-l lg:border-t-0">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
          {label}
        </div>
        <div className="mt-1 text-2xl font-extrabold leading-none tracking-tight text-slate-900">
          {value}
        </div>
        <div className="mt-1.5 text-xs font-semibold text-slate-400">{caption}</div>
      </div>
    </div>
  );
}

function CompletionDonut({
  percent,
  done,
  balance,
  accent = palette.done,
  size = 180,
}: {
  percent: number;
  done: number;
  balance: number;
  accent?: string;
  size?: number;
}) {
  const hasData = done + balance > 0;
  const data = hasData
    ? [
        { name: "Completed", value: done, fill: accent },
        { name: "Balance", value: balance, fill: `${accent}33` },
      ]
    : [{ name: "No data", value: 1, fill: `${accent}1a` }];
  const isLarge = size >= 160;

  return (
    <div className="relative shrink-0" style={{ height: size, width: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={Math.round(size * 0.355)}
            outerRadius={Math.round(size * 0.478)}
            startAngle={90}
            endAngle={-270}
            paddingAngle={hasData ? 2 : 0}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          {hasData ? <Tooltip formatter={(value) => formatNumber(Number(value))} /> : null}
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "font-extrabold tracking-tight text-slate-900",
            isLarge ? "text-4xl" : "text-2xl"
          )}
        >
          {percent}%
        </span>
        {isLarge ? (
          <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Complete</span>
        ) : null}
      </div>
    </div>
  );
}

function ProgressDetailsTable({
  isAllMocsView,
  metric,
  scope,
  rows,
  summaries,
}: {
  isAllMocsView: boolean;
  metric: MetricFilter;
  scope: ScopeFilter;
  rows: ProgressRegisterRow[];
  summaries: ProgressSummary[];
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
        <PanelTitle>
          {isAllMocsView ? "MOC Progress Details" : "Pipe Size Progress Details"}
        </PanelTitle>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500">
          {(isAllMocsView ? summaries.length : rows.length).toLocaleString()} rows
        </span>
      </div>
      <div className="max-h-[440px] overflow-auto">
        <table className="w-full min-w-[720px] table-fixed border-separate border-spacing-0 text-sm">
          <colgroup>
            {isAllMocsView ? (
              <>
                <col style={{ width: "12%" }} />
                <col style={{ width: "46%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "8%" }} />
              </>
            ) : (
              <>
                <col style={{ width: "15%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "11%" }} />
              </>
            )}
          </colgroup>
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              {isAllMocsView ? (
                <>
                  <HeaderCell align="left">MOC</HeaderCell>
                  <HeaderCell align="left">Project</HeaderCell>
                </>
              ) : (
                <>
                  <HeaderCell>Size</HeaderCell>
                  <HeaderCell>Thk</HeaderCell>
                  <HeaderCell>Schedule</HeaderCell>
                </>
              )}
              <HeaderCell>Scope</HeaderCell>
              <HeaderCell>Completed</HeaderCell>
              <HeaderCell>Balance</HeaderCell>
              <HeaderCell>%</HeaderCell>
            </tr>
          </thead>
          <tbody>
            {isAllMocsView
              ? summaries.map((summary) => {
                  const values = getScopedMetricValues(summary, scope, metric);
                  return (
                    <tr key={summary.moc} className="transition hover:bg-indigo-50/40">
                      <BodyCell align="left" strong>
                        {summary.moc}
                      </BodyCell>
                      <BodyCell align="left">{summary.mocName || "-"}</BodyCell>
                      <BodyCell>{formatNumber(values.scope)}</BodyCell>
                      <BodyCell tone="done">{formatNumber(values.done)}</BodyCell>
                      <BodyCell tone="balance">{formatNumber(values.balance)}</BodyCell>
                      <PercentCell percent={values.percent} />
                    </tr>
                  );
                })
              : rows.map((row) => {
                  const summary = summarizeRows([row]);
                  const values = getScopedMetricValues(summary, scope, metric);
                  return (
                    <tr key={row.jointRecordId} className="transition hover:bg-indigo-50/40">
                      <BodyCell strong>{row.sizeInches}</BodyCell>
                      <BodyCell>{formatNumber(row.thickness)}</BodyCell>
                      <BodyCell>{row.pipeSchedule}</BodyCell>
                      <BodyCell>{formatNumber(values.scope)}</BodyCell>
                      <BodyCell tone="done">{formatNumber(values.done)}</BodyCell>
                      <BodyCell tone="balance">{formatNumber(values.balance)}</BodyCell>
                      <PercentCell percent={values.percent} />
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function HeaderCell({
  children,
  align = "center",
}: {
  children: React.ReactNode;
  align?: "left" | "center";
}) {
  return (
    <th
      className={cn(
        "border-b border-slate-200 px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-slate-500",
        align === "left" ? "text-left" : "text-center"
      )}
    >
      {children}
    </th>
  );
}

function BodyCell({
  children,
  align = "center",
  strong,
  tone,
}: {
  children: React.ReactNode;
  align?: "left" | "center";
  strong?: boolean;
  tone?: "done" | "balance";
}) {
  return (
    <td
      className={cn(
        "border-b border-slate-100 px-3 py-2.5 tabular-nums",
        align === "left" ? "text-left" : "text-center",
        strong ? "font-bold text-slate-900" : "font-semibold",
        tone === "done" && "text-indigo-600",
        tone === "balance" && "text-amber-600",
        !tone && !strong && "text-slate-700"
      )}
    >
      <span className="line-clamp-1" title={typeof children === "string" ? children : undefined}>
        {children}
      </span>
    </td>
  );
}

function PercentCell({ percent }: { percent: number }) {
  const tone =
    percent >= 100
      ? "bg-emerald-50 text-emerald-700"
      : percent >= 50
        ? "bg-indigo-50 text-indigo-700"
        : percent > 0
          ? "bg-amber-50 text-amber-700"
          : "bg-slate-100 text-slate-500";
  return (
    <td className="border-b border-slate-100 px-3 py-2.5 text-center">
      <span className={cn("inline-block min-w-[44px] rounded-full px-2 py-0.5 text-xs font-bold tabular-nums", tone)}>
        {percent}%
      </span>
    </td>
  );
}

function buildMocSummaries(rows: ProgressRegisterRow[]) {
  const summaries = new Map<string, ProgressSummary>();

  rows.forEach((row) => {
    const current = summaries.get(row.moc) ?? emptySummary(row.moc, row.mocName);
    addRowToSummary(current, row);
    summaries.set(row.moc, current);
  });

  return Array.from(summaries.values()).sort((first, second) => first.moc.localeCompare(second.moc));
}

function summarizeRows(rows: ProgressRegisterRow[]) {
  const summary = emptySummary(rows[0]?.moc ?? ALL_MOCS, rows[0]?.mocName ?? "All MOC Names");
  rows.forEach((row) => addRowToSummary(summary, row));
  return summary;
}

function emptySummary(moc: string, mocName: string): ProgressSummary {
  return {
    moc,
    mocName,
    rowCount: 0,
    shopScopeJoints: 0,
    fieldScopeJoints: 0,
    shopDoneJoints: 0,
    fieldDoneJoints: 0,
    shopScopeInchDia: 0,
    fieldScopeInchDia: 0,
    shopDoneInchDia: 0,
    fieldDoneInchDia: 0,
  };
}

function addRowToSummary(summary: ProgressSummary, row: ProgressRegisterRow) {
  const sizeValue = getPipeSizeValue(row);
  const shopScopeJoints = toNumber(row.shopJoints);
  const fieldScopeJoints = toNumber(row.fieldJoints);
  const shopDoneJoints = toNumber(row.shopProgressJoints);
  const fieldDoneJoints = toNumber(row.fieldProgressJoints);

  summary.rowCount += 1;
  summary.shopScopeJoints += shopScopeJoints;
  summary.fieldScopeJoints += fieldScopeJoints;
  summary.shopDoneJoints += shopDoneJoints;
  summary.fieldDoneJoints += fieldDoneJoints;
  summary.shopScopeInchDia += shopScopeJoints * sizeValue;
  summary.fieldScopeInchDia += fieldScopeJoints * sizeValue;
  summary.shopDoneInchDia += shopDoneJoints * sizeValue;
  summary.fieldDoneInchDia += fieldDoneJoints * sizeValue;
}

function getScopedMetricValues(summary: ProgressSummary, scope: ScopeFilter, metric: MetricFilter): ScopedMetricValues {
  const jointValues = getScopedJointValues(summary, scope);
  const inchDiaValues = getScopedInchDiaValues(summary, scope);
  const values = metric === "JOINTS" ? jointValues : inchDiaValues;
  const balance = Math.max(0, values.scope - values.done);

  return {
    scope: values.scope,
    done: values.done,
    balance,
    percent: getPercent(values.done, values.scope),
  };
}

function getScopedJointValues(summary: ProgressSummary, scope: ScopeFilter) {
  if (scope === "SHOP") {
    return { scope: summary.shopScopeJoints, done: summary.shopDoneJoints };
  }

  if (scope === "FIELD") {
    return { scope: summary.fieldScopeJoints, done: summary.fieldDoneJoints };
  }

  return {
    scope: summary.shopScopeJoints + summary.fieldScopeJoints,
    done: summary.shopDoneJoints + summary.fieldDoneJoints,
  };
}

function getScopedInchDiaValues(summary: ProgressSummary, scope: ScopeFilter) {
  if (scope === "SHOP") {
    return { scope: summary.shopScopeInchDia, done: summary.shopDoneInchDia };
  }

  if (scope === "FIELD") {
    return { scope: summary.fieldScopeInchDia, done: summary.fieldDoneInchDia };
  }

  return {
    scope: summary.shopScopeInchDia + summary.fieldScopeInchDia,
    done: summary.shopDoneInchDia + summary.fieldDoneInchDia,
  };
}

function formatNumber(value: number) {
  return Math.round(Number(value || 0)).toLocaleString();
}
