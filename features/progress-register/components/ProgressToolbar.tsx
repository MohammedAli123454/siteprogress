"use client";

import { Save } from "lucide-react";
import Select, { type FormatOptionLabelMeta, type SingleValue, type StylesConfig } from "react-select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  reportNo: string;
  remarks: string;
  isSaveDisabled: boolean;
  isSaving: boolean;
  onMocChange: (value: string) => void;
  onScopeChange: (value: ProgressScope) => void;
  onReportDateChange: (value: string) => void;
  onReportNoChange: (value: string) => void;
  onRemarksChange: (value: string) => void;
  onSave: () => void;
};

const selectStyles: StylesConfig<SelectOption, false> = {
  control: (baseStyles, state) => ({
    ...baseStyles,
    minHeight: 42,
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

export function ProgressToolbar({
  selectedMoc,
  mocOptions,
  progressScope,
  reportDate,
  reportNo,
  remarks,
  isSaveDisabled,
  isSaving,
  onMocChange,
  onScopeChange,
  onReportDateChange,
  onReportNoChange,
  onRemarksChange,
  onSave,
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
    <section className="ml-8 rounded-md border border-slate-200 bg-white p-3 shadow-sm lg:ml-10">
      <div className="grid gap-3 xl:grid-cols-[minmax(280px,1fr)_220px_170px_170px_minmax(220px,0.7fr)_auto] xl:items-end">
        <ToolbarSelect
          label="MOC Name"
          options={mocSelectOptions}
          value={findSelectedOption(mocSelectOptions, selectedMoc)}
          placeholder="Select MOC name"
          onChange={(option) => onMocChange(option?.value ?? ALL_MOCS)}
        />
        <ToolbarSelect
          label="Progress Scope"
          options={scopeOptions}
          value={findSelectedOption(scopeOptions, progressScope)}
          placeholder="Select scope"
          onChange={(option) => onScopeChange((option?.value ?? "SHOP") as ProgressScope)}
        />
        <ToolbarInput
          label="Progress Date"
          type="date"
          value={reportDate}
          onChange={onReportDateChange}
        />
        <ToolbarInput
          label="Report No."
          value={reportNo}
          placeholder="Optional"
          onChange={onReportNoChange}
        />
        <ToolbarInput
          label="Remarks"
          value={remarks}
          placeholder="Optional notes"
          onChange={onRemarksChange}
        />
        <Button
          className="h-[42px] justify-center px-5"
          disabled={isSaveDisabled || isSaving}
          onClick={onSave}
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Progress"}
        </Button>
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
    <label className="min-w-0">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
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

function ToolbarInput({
  label,
  value,
  type = "text",
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-0">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        className="h-[42px] rounded-md border-slate-300 font-semibold"
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
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
