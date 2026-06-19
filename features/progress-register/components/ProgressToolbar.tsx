"use client";

import { useEffect, useRef, useState } from "react";
import Select, { type FormatOptionLabelMeta, type SingleValue, type StylesConfig } from "react-select";

import { Calendar } from "@/components/ui/calendar";

import { ALL_MOCS, PROGRESS_SCOPE_OPTIONS } from "../domain/constants";
import type { ProgressScope } from "../domain/types";

type SelectOption = {
  value: string;
  label: string;
  detail?: string;
};

type ProgressToolbarProps = {
  selectedMoc: string;
  mocOptions: { moc: string; mocName: string }[];
  progressScope: ProgressScope;
  reportDate: string;
  remarks: string;
  onMocChange: (value: string) => void;
  onReportDateChange: (value: string) => void;
  onScopeChange: (value: ProgressScope) => void;
  onRemarksChange: (value: string) => void;
};

const selectStyles: StylesConfig<SelectOption, false> = {
  control: (baseStyles, state) => ({
    ...baseStyles,
    minHeight: 38,
    height: 38,
    backgroundColor: "#ffffff",
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
    height: 38,
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
    paddingBottom: 7,
    paddingRight: 12,
    paddingTop: 7,
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

export function ProgressToolbar({
  selectedMoc,
  mocOptions,
  progressScope,
  reportDate,
  remarks,
  onMocChange,
  onReportDateChange,
  onScopeChange,
  onRemarksChange,
}: ProgressToolbarProps) {
  const mocSelectOptions = [
    { value: ALL_MOCS, label: "All MOC Names", detail: "Overall progress summary" },
    ...mocOptions.map((item) => ({
      value: item.moc,
      label: item.mocName || item.moc,
      detail: item.moc,
    })),
  ];
  const scopeOptions = PROGRESS_SCOPE_OPTIONS.map((option) => ({ ...option }));

  return (
    <section className="p-0">
      <div className="space-y-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(360px,560px)_minmax(720px,1fr)] lg:items-center">
          <DateToolbarLabel
            label="Progress Date"
            value={reportDate}
            onChange={onReportDateChange}
          />
          <ToolbarSelect
            label="MOC Name"
            options={mocSelectOptions}
            value={findSelectedOption(mocSelectOptions, selectedMoc)}
            placeholder="Select MOC name"
            onChange={(option) => onMocChange(option?.value ?? ALL_MOCS)}
          />
        </div>
        <div className="grid gap-3 lg:grid-cols-[minmax(360px,560px)_minmax(420px,1fr)] lg:items-center">
          <ToolbarSelect
            label="Progress Type"
            options={scopeOptions}
            value={findSelectedOption(scopeOptions, progressScope)}
            placeholder="Select progress type"
            onChange={(option) => onScopeChange((option?.value ?? "SHOP") as ProgressScope)}
          />
          <ToolbarTextInput
            label="Remarks"
            value={remarks}
            placeholder="Optional notes"
            onChange={onRemarksChange}
          />
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
  options: SelectOption[];
  value: SelectOption;
  placeholder: string;
  onChange: (option: SingleValue<SelectOption>) => void;
}) {
  return (
    <label className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
      <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <Select
        instanceId={`progress-register-${label.toLowerCase().replace(/\s+/g, "-")}`}
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

function ToolbarTextInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
      <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        className="h-[38px] min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function DateToolbarLabel({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeCalendarOnOutsideClick(event: PointerEvent) {
      const target = event.target;

      if (target instanceof Node && fieldRef.current?.contains(target)) return;
      setIsCalendarOpen(false);
    }

    document.addEventListener("pointerdown", closeCalendarOnOutsideClick);

    return () => {
      document.removeEventListener("pointerdown", closeCalendarOnOutsideClick);
    };
  }, []);

  return (
    <div
      ref={fieldRef}
      className="relative grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center"
    >
      <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <button
        type="button"
        className="flex h-[38px] w-full items-center rounded-md border border-slate-300 bg-white px-3 text-left text-sm font-semibold text-slate-950 transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        onClick={() => setIsCalendarOpen((isOpen) => !isOpen)}
      >
        <span className="truncate" title={formatDisplayDate(value)}>
          {formatDisplayDate(value)}
        </span>
      </button>

      {isCalendarOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 rounded-lg border border-slate-200 bg-white shadow-lg">
          <Calendar
            mode="single"
            selected={parseDateInputValue(value)}
            onSelect={(date) => {
              if (!date) return;
              onChange(formatDateInputValue(date));
              setIsCalendarOpen(false);
            }}
            className="rounded-lg"
            captionLayout="dropdown"
          />
        </div>
      ) : null}
    </div>
  );
}

function findSelectedOption(options: SelectOption[], value: string) {
  return options.find((option) => option.value === value) ?? options[0];
}

function formatOptionLabel(option: SelectOption, meta: FormatOptionLabelMeta<SelectOption>) {
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

function formatDisplayDate(value: string) {
  if (!value) return "";

  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function parseDateInputValue(value: string) {
  if (!value) return undefined;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;

  return new Date(year, month - 1, day);
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
