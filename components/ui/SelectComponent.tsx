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

  // Custom styling for react-select
  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      backgroundColor: '#f3f4f6', // bg-gray-100
      borderColor: '#d1d5db', // border-gray-300
      minHeight: '42px',
      '&:hover': {
        borderColor: '#d1d5db', // border-gray-300
      },
      '&:focus-within': {
        borderColor: '#3b82f6', // border-blue-500
        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)',
        backgroundColor: 'white', // focus:bg-white
      }
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#f3f4f6' : 'white',
      color: '#1f2937', // text-gray-700
      '&:hover': {
        backgroundColor: '#f9fafb' // bg-gray-50
      }
    }),
    menu: (provided: any) => ({
      ...provided,
      border: '1px solid #e5e7eb', // border-gray-200
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }),
    dropdownIndicator: (provided: any) => ({
      ...provided,
      color: '#9ca3af', // text-gray-400
      '&:hover': {
        color: '#6b7280' // text-gray-500
      }
    })
  };

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
                styles={customStyles}
                className="react-select-container"
                classNamePrefix="react-select"
                isSearchable={!isLoading}
                components={{
                  IndicatorSeparator: () => null
                }}
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