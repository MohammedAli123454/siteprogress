"use client";
import React from "react";
import { useFormContext, Controller } from "react-hook-form";

interface InputComponentProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  step?: string;
  className?: string;
  inputClassName?: string;
  labelCols?: number;
  inputCols?: number;
}

export const InputComponent = ({
  name,
  label,
  type = "text",
  placeholder,
  step,
  className = "",
  inputClassName = "",
  labelCols = 2,
  inputCols = 5
}: InputComponentProps) => {
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
                type={type}
                step={step}
                placeholder={placeholder}
                className={`w-full border rounded-md p-2 shadow-sm focus:ring-2 focus:ring-blue-500 ${inputClassName}`}
                value={field.value || ""}
                onChange={(e) => {
                  if (type === "number") {
                    field.onChange(parseFloat(e.target.value) || 0);
                  } else {
                    field.onChange(e.target.value);
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