"use client";
import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format } from "date-fns";
import { FaCalendarAlt } from "react-icons/fa";

type DatePickerFieldProps = {
  name: string;
  label?: string;
  dateFormat?: string;
  className?: string;
  inputClassName?: string;
};

export const DatePickerField = ({
  name,
  label = "Date",
  dateFormat = "yyyy-MM-dd",
  className = "flex-1",
  inputClassName = "w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-2 focus:ring-blue-500 cursor-pointer bg-gray-100 focus:bg-white transition-colors"
}: DatePickerFieldProps) => {
  const formContext = useFormContext();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  if (!formContext) {
    throw new Error(
      "DatePickerField must be used within a FormProvider component"
    );
  }

  const { control } = formContext;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className={className}>
          <div className="grid grid-cols-7 gap-4 items-center">
            <label className="col-span-2 text-lg font-medium text-gray-700">
              {label}
            </label>
            <div className="col-span-5 relative">
              <input
                readOnly
                value={field.value ? format(field.value, dateFormat) : ""}
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className={inputClassName}
                style={{ backgroundColor: '#f3f4f6' }} // Directly setting bg-gray-100
              />
              <FaCalendarAlt
                className="absolute top-3 right-3 text-gray-400 cursor-pointer hover:text-gray-500"
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              />
              {isCalendarOpen && (
                <div className="absolute z-10 mt-2 shadow-lg">
                  <Calendar
                    onChange={(date) => {
                      field.onChange(date);
                      setIsCalendarOpen(false);
                    }}
                    value={field.value || new Date()}
                    className="border border-gray-200 rounded-md bg-white"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    />
  );
};