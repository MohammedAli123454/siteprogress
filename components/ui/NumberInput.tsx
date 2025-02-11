"use client";
import React from "react";
import { useFormContext, Controller } from "react-hook-form";

interface NumberInputProps {
  name: string;
  label: string;
  placeholder?: string;
  decimalScale?: number;
  className?: string;
  inputClassName?: string;
  labelCols?: number;
  inputCols?: number;
}

export const NumberInput = ({
  name,
  label,
  placeholder = "Enter amount",
  decimalScale = 2,
  className = "",
  inputClassName = "",
  labelCols = 2,
  inputCols = 5
}: NumberInputProps) => {
  const { control, formState: { errors } } = useFormContext();

  return (
    <div className={`flex-1 ${className}`}>
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
                step={10 ** -decimalScale}
                placeholder={placeholder}
                className={`w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-2 focus:ring-blue-500 bg-gray-100 focus:bg-white transition-colors ${inputClassName}`}
                value={field.value ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const numericValue = value === '' ? null : Number(value);
                  
                  // Additional validation
                  if (numericValue !== null && !isNaN(numericValue)) {
                    const roundedValue = Number(numericValue.toFixed(decimalScale));
                    field.onChange(roundedValue);
                  } else {
                    field.onChange(null);
                  }
                }}
                onKeyDown={(e) => {
                  // Prevent invalid characters
                  if (!/[0-9.,-]/.test(e.key) && 
                      e.key !== 'Backspace' && 
                      e.key !== 'Tab' &&
                      e.key !== 'ArrowLeft' &&
                      e.key !== 'ArrowRight') {
                    e.preventDefault();
                  }
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