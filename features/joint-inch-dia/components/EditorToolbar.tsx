"use client";

import {
  Download,
  Loader2,
  RotateCcw,
  Save,
} from "lucide-react";
import Select, { type FormatOptionLabelMeta, type SingleValue, type StylesConfig } from "react-select";

import { Button } from "@/components/ui/button";

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
  isExportDisabled: boolean;
  isExporting: boolean;
  hasUnsavedChanges: boolean;
  isSavingChanges: boolean;
  unsavedChangeCount: number;
  onMocChange: (value: string) => void;
  onSaveChanges: () => void;
  onDiscardChanges: () => void;
  onExportExcel: () => void;
};

const selectStyles: StylesConfig<MocSelectOption, false> = {
  control: (baseStyles, state) => ({
    ...baseStyles,
    minHeight: 44,
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
    minHeight: 44,
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

const toolbarButtonClassName = "justify-center text-sm";

export function EditorToolbar({
  selectedMoc,
  mocOptions,
  isExportDisabled,
  isExporting,
  hasUnsavedChanges,
  isSavingChanges,
  unsavedChangeCount,
  onMocChange,
  onSaveChanges,
  onDiscardChanges,
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
      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(360px,1fr)_minmax(420px,max-content)]">
        <ToolbarSelect
          label="MOC Name"
          options={mocNameOptions}
          value={selectedNameOption}
          placeholder="Select MOC name"
          onChange={(option) => onMocChange(option?.value ?? ALL_MOCS)}
        />

        <div className="flex min-w-0 flex-wrap justify-start gap-2 lg:h-11 lg:justify-end">
          {(hasUnsavedChanges || isSavingChanges) && (
            <>
              <Button
                className="h-11 min-w-[150px] justify-center px-3 text-sm"
                disabled={isSavingChanges}
                onClick={onSaveChanges}
              >
                {isSavingChanges ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {hasUnsavedChanges ? `Save (${unsavedChangeCount})` : "Save Changes"}
              </Button>
              <Button
                className="h-11 min-w-[112px] justify-center px-3 text-sm"
                variant="outline"
                disabled={isSavingChanges}
                onClick={onDiscardChanges}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Discard
              </Button>
            </>
          )}
          <Button
            className={`${toolbarButtonClassName} h-11 min-w-[160px] px-3`}
            variant="outline"
            disabled={isExportDisabled || isExporting || isSavingChanges}
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
    <label className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
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
