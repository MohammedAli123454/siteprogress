import { Controller, useFormContext } from "react-hook-form";
import Select from "react-select";

interface FormFieldProps {
  name: string; // Name for React Hook Form
  label: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  labelColSpan: number;
  selectColSpan: number;
  isDisabled?: boolean;
}

export function FormField({
  name,
  label,
  options,
  placeholder = "Select an option",
  labelColSpan,
  selectColSpan,
  isDisabled = false,
}: FormFieldProps) {
  const { control } = useFormContext();

  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      {/* Label */}
      <label className={`col-span-${labelColSpan} text-lg font-medium text-gray-600`}>
        {label}
      </label>

      {/* Select */}
      <div className={`col-span-${selectColSpan}`}>
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              options={options}
              placeholder={placeholder}
              isDisabled={isDisabled}
              value={options.find((option) => option.value === field.value)} // Match the selected value
              onChange={(selectedOption) => field.onChange(selectedOption)} // Pass the full option object
              getOptionLabel={(option) => option.label} // Ensure correct rendering of options
              getOptionValue={(option) => option.value} // Ensure correct value matching
            />
          )}
        />
      </div>
    </div>
  );
}
