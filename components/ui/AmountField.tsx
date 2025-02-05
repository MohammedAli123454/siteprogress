"use client";
import React from "react";
import { useFormContext, Controller } from "react-hook-form";

interface AmountFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  labelCols?: number;
  inputCols?: number;
}

export const AmountField = ({
  name,
  label,
  placeholder = "Amount",
  labelCols = 1,
  inputCols = 3
}: AmountFieldProps) => {
  const { control, formState: { errors } } = useFormContext();

  return (
    <div className="flex-1">
      <div className="grid grid-cols-7 gap-4 items-center">
        <label htmlFor={name} className={`col-span-${labelCols} text-lg font-medium text-gray-700`}>
          {label}
        </label>
        <div className={`col-span-${inputCols}`}>
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="number"
                step="0.01"
                placeholder={placeholder}
                className="w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-2 focus:ring-blue-500 bg-gray-100 focus:bg-white transition-colors"
                value={field.value ?? ""}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  field.onChange(isNaN(value) ? undefined : value);
                }}
              />
            )}
          />
          {errors[name] && (
            <p className="text-red-500 text-sm mt-1">{errors[name]?.message as string}</p>
          )}
        </div>
      </div>
    </div>
  );
};