"use client";

import { Download, Loader2, Ruler, Table2, type LucideIcon } from "lucide-react";
import Select, { type FormatOptionLabelMeta, type SingleValue, type StylesConfig } from "react-select";

import { Button } from "@/components/ui/button";

import { formatNumber, type RecordTotals } from "../domain/calculations";
import { ALL_MOCS } from "../domain/constants";
import type { MocOption } from "../domain/types";

type MocSelectOption = {
  value: string;
  label: string;
  detail?: string;
};

type EditorToolbarProps = {
  selectedMoc: string;
  mocOptions: MocOption[];
  totals: RecordTotals;
  isExportDisabled: boolean;
  isExporting: boolean;
  onMocChange: (value: string) => void;
  onExportExcel: () => void;
};

const selectStyles: StylesConfig<MocSelectOption, false> = {
  control: (baseStyles, state) => ({
    ...baseStyles,
    minHeight: 64,
    borderColor: state.isFocused ? "#3b82f6" : "#cbd5e1",
    borderRadius: 8,
    boxShadow: state.isFocused ? "0 0 0 3px rgb(59 130 246 / 0.14)" : "none",
    cursor: "pointer",
    "&:hover": {
      borderColor: state.isFocused ? "#3b82f6" : "#94a3b8",
    },
  }),
  valueContainer: (baseStyles) => ({
    ...baseStyles,
    minHeight: 64,
    padding: "0 12px",
  }),
  input: (baseStyles) => ({
    ...baseStyles,
    margin: 0,
    padding: 0,
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  dropdownIndicator: (baseStyles, state) => ({
    ...baseStyles,
    color: state.isFocused ? "#2563eb" : "#64748b",
    paddingRight: 12,
  }),
  menu: (baseStyles) => ({
    ...baseStyles,
    borderRadius: 8,
    overflow: "hidden",
    zIndex: 50,
  }),
  option: (baseStyles, state) => ({
    ...baseStyles,
    backgroundColor: state.isSelected ? "#0f172a" : state.isFocused ? "#eff6ff" : "#ffffff",
    color: state.isSelected ? "#ffffff" : "#0f172a",
    cursor: "pointer",
  }),
};

const toolbarButtonClassName = "h-16 justify-center px-4 text-sm";

export function EditorToolbar({
  selectedMoc,
  mocOptions,
  totals,
  isExportDisabled,
  isExporting,
  onMocChange,
  onExportExcel,
}: EditorToolbarProps) {
  const mocNameOptions = [
    { value: ALL_MOCS, label: "All MOC Names", detail: "Consolidated summary" },
    ...mocOptions
      .map((item) => ({
        value: item.moc,
        label: item.mocName || item.moc,
        detail: item.moc,
      }))
      .sort((first, second) => first.label.localeCompare(second.label)),
  ];

  const selectedNameOption = findSelectedOption(mocNameOptions, selectedMoc);

  return (
    <section className="p-0">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        MOC Name
      </span>
      <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(320px,1fr)_minmax(180px,220px)_minmax(180px,220px)_max-content]">
        <ToolbarSelect
          label="MOC Name"
          options={mocNameOptions}
          value={selectedNameOption}
          placeholder="Select MOC name"
          onChange={(option) => onMocChange(option?.value ?? ALL_MOCS)}
        />

        <ToolbarKpi label="Total Joints" value={totals.totalJoints} icon={Table2} />
        <ToolbarKpi label="Total Inch Dia" value={totals.totalInchDia} icon={Ruler} />

        <div className="flex flex-wrap items-start gap-3 sm:col-span-2 xl:col-span-1 xl:flex-nowrap">
          <Button
            className={toolbarButtonClassName}
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
        </div>
      </div>
    </section>
  );
}

function ToolbarSelect({
  label,
  options,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  options: MocSelectOption[];
  value: MocSelectOption;
  placeholder: string;
  onChange: (option: SingleValue<MocSelectOption>) => void;
}) {
  return (
    <label className="min-w-0 sm:col-span-2 xl:col-span-1">
      <Select
        instanceId={`joint-inch-dia-${label.toLowerCase().replace(/\s+/g, "-")}`}
        aria-label={label}
        isSearchable
        options={options}
        value={value}
        placeholder={placeholder}
        styles={selectStyles}
        formatOptionLabel={formatOptionLabel}
        onChange={onChange}
      />
    </label>
  );
}

function ToolbarKpi({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <div className="flex h-16 min-w-0 items-center gap-3 rounded-lg border border-[#dbe4ef] bg-[#f8fafc] px-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase leading-none tracking-wide text-slate-500">
          {label}
        </div>
        <div className="mt-2 truncate text-xl font-bold leading-none text-slate-950">
          {formatNumber(value)}
        </div>
      </div>
    </div>
  );
}

function findSelectedOption(options: MocSelectOption[], selectedMoc: string) {
  return options.find((option) => option.value === selectedMoc) ?? options[0];
}

function formatOptionLabel(
  option: MocSelectOption,
  meta: FormatOptionLabelMeta<MocSelectOption>
) {
  if (meta.context === "value") {
    return <span className="truncate font-semibold text-slate-950">{option.label}</span>;
  }

  return (
    <div className="min-w-0">
      <div className="truncate font-semibold">{option.label}</div>
      {option.detail ? <div className="truncate text-xs opacity-75">{option.detail}</div> : null}
    </div>
  );
}
