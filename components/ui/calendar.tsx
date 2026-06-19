"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type CalendarProps = {
  mode?: "single";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
  captionLayout?: "dropdown" | "label";
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function Calendar({
  selected,
  onSelect,
  className,
  captionLayout = "label",
}: CalendarProps) {
  const [displayMonth, setDisplayMonth] = React.useState(() =>
    startOfMonth(selected ?? new Date())
  );
  const selectedDateKey = selected ? getDateKey(selected) : "";
  const currentYear = new Date().getFullYear();
  const years = React.useMemo(
    () => Array.from({ length: 11 }, (_, index) => currentYear - 5 + index),
    [currentYear]
  );
  const leadingBlankDays = displayMonth.getDay();
  const daysInMonth = new Date(
    displayMonth.getFullYear(),
    displayMonth.getMonth() + 1,
    0
  ).getDate();

  React.useEffect(() => {
    if (selected) setDisplayMonth(startOfMonth(selected));
  }, [selected]);

  function setMonth(month: number) {
    setDisplayMonth(new Date(displayMonth.getFullYear(), month, 1));
  }

  function setYear(year: number) {
    setDisplayMonth(new Date(year, displayMonth.getMonth(), 1));
  }

  return (
    <div className={cn("w-fit rounded-lg bg-white p-3", className)}>
      <div className="mb-3 flex items-center gap-2">
        {captionLayout === "dropdown" ? (
          <>
            <select
              value={displayMonth.getMonth()}
              className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-900"
              onChange={(event) => setMonth(Number(event.target.value))}
            >
              {monthNames.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={displayMonth.getFullYear()}
              className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-900"
              onChange={(event) => setYear(Number(event.target.value))}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </>
        ) : (
          <div className="text-sm font-bold text-slate-950">
            {monthNames[displayMonth.getMonth()]} {displayMonth.getFullYear()}
          </div>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500">
        {weekDays.map((day) => (
          <div key={day} className="flex h-7 items-center justify-center">
            {day}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlankDays }, (_, index) => (
          <div key={`blank-${index}`} className="h-9" />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const date = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
          const isSelected = getDateKey(date) === selectedDateKey;

          return (
            <button
              key={day}
              type="button"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md text-sm font-semibold transition",
                isSelected
                  ? "bg-slate-950 text-white hover:bg-slate-950"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              )}
              onClick={() => onSelect?.(date)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
