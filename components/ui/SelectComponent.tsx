"use client";
import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import Select from "react-select";

interface SelectComponentProps<T = string> {
  name: string;
  label: string;
  options: Array<{ label: string; value: T }>;
  isLoading?: boolean;
  isPredefined?: boolean;
}

export const SelectComponent = <T extends string>({
  name,
  label,
  options,
  isLoading,
}: SelectComponentProps<T>) => {
  const { control, formState: { errors } } = useFormContext();

  return (
    <div className="flex-1">
      <div className="grid grid-cols-7 gap-4 items-center">
        <label htmlFor={name} className="col-span-2 text-lg font-medium text-gray-700">
          {label}
        </label>
        <div className="col-span-5">
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <Select
                options={options}
                onChange={(option) => field.onChange(option?.value)}
                value={options.find((c) => c.value === field.value)}
                placeholder={`Select ${label}`}
                isLoading={isLoading}
                loadingMessage={() => `Loading ${label.toLowerCase()}s...`}
                className="react-select-container"
                classNamePrefix="react-select"
                isSearchable={!isLoading}
              />
            )}
          />
        </div>
      </div>
      {errors[name] && (
        <p className="text-red-500 text-sm mt-1">{errors[name]?.message as string}</p>
      )}
    </div>
  );
};