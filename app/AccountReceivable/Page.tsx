import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { db } from "../configs/db";
import { customers } from "../configs/schema";
// import DatePicker from "react-datepicker";
import { Calendar } from "@/components/ui/calendar"; // Adjust the import path based on your ShadCN setup
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { format } from 'date-fns';

const entrySchema = z.object({
  date: z.date({ required_error: "Date is required" }),
  customerId: z.string().nonempty("Customer is required"),
  documentNo: z.string().nonempty("Document No is required"),
  documentType: z.enum(["Invoice", "Receipt"], { required_error: "Document Type is invalid" }),
  description: z.string().nonempty("Description is required"),
  amount: z.number().positive("Amount must be greater than 0"),
});

type Entry = z.infer<typeof entrySchema>;

type CustomerOption = {
  label: string;
  value: number;
};

const AccountReceivable = () => {
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<Entry>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      date: new Date(),
      customerId: "",
      documentNo: "",
      documentType: "Invoice",
      description: "",
      amount: 0,
    },
  });

  const [customersList, setCustomersList] = useState<CustomerOption[]>([]);

  const fetchCustomers = async () => {
    const data = await db
      .select({ label: customers.name, value: customers.id })
      .from(customers);
  
    // Map the customer data to the expected format for react-select
    const formattedCustomers = data.map((customer) => ({
      label: customer.label,
      value: customer.value.toString(), // Convert number to string for compatibility with react-select
    }));
  
    // Convert back to number if needed
    const customersListWithNumberValue = formattedCustomers.map((customer) => ({
      label: customer.label,
      value: Number(customer.value),  // Convert value back to number
    }));
  
    setCustomersList(customersListWithNumberValue);
  };
  

  const addEntry = async (entry: z.infer<typeof entrySchema>) => {
    const validatedEntry = entrySchema.safeParse(entry);
    if (!validatedEntry.success) {
      console.error(validatedEntry.error);
      return;
    }
  
    // Map the entry to match the database schema, including converting 'date' to a string
    const newEntry = {
      date: entry.date.toISOString(), // Convert Date to ISO string
      customerId: entry.customerId,
      documentNo: entry.documentNo,
      documentType: entry.documentType,
      description: entry.description,
      debit: entry.documentType === "Invoice" ? entry.amount : 0,
      credit: entry.documentType === "Receipt" ? entry.amount : 0,
      name: "Default Name", // Replace with actual logic to populate 'name' if needed
    };
  
    // Insert the new entry into the database
    await db.insert(customers).values(newEntry);
  };
  
  

  const onSubmit = (data: Entry) => {
    addEntry(data);
    reset();
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Account Receivable</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mb-6 border p-4 rounded shadow-md"
      >
        {/* Date Picker */}
        <div className="mb-4">
      <Controller
        name="date"
        control={control}
        render={({ field }) => (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full text-left ${!field.value ? "text-muted-foreground" : ""}`}
              >
            {field.value ? format(new Date(field.value), "yyyy-MM-dd") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={(date) => field.onChange(date)} // React Hook Form integration
                disabled={(date) => date > new Date()} // Example: disable future dates
                className="rounded-md"
              />
            </PopoverContent>
          </Popover>
        )}
      />
      {errors.date && <p className="text-red-500 text-sm">{errors.date.message}</p>}
    </div>


        {/* Customer Dropdown */}
        <div className="mb-4">
    <Controller
      name="customerId"
      control={control}
      render={({ field }) => (
        <Select
          {...field}
          options={customersList}
          placeholder="Select Customer"
          onChange={(option) => field.onChange(option?.value)} // Make sure option?.value is a string
        />
      )}
    />
    {errors.customerId && <p className="text-red-500 text-sm">{errors.customerId.message}</p>}
  </div>

        {/* Document Number */}
        <div className="mb-4">
          <Controller
            name="documentNo"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                className="border p-2 w-full"
                placeholder="Document No"
              />
            )}
          />
          {errors.documentNo && <p className="text-red-500 text-sm">{errors.documentNo.message}</p>}
        </div>

        {/* Document Type */}
        <div className="mb-4">
          <Controller
            name="documentType"
            control={control}
            render={({ field }) => (
              <select {...field} className="border p-2 w-full">
                <option value="Invoice">Invoice</option>
                <option value="Receipt">Receipt</option>
              </select>
            )}
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                className="border p-2 w-full"
                placeholder="Description"
              />
            )}
          />
          {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
        </div>

        {/* Amount */}
        <div className="mb-4">
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="number"
                className="border p-2 w-full"
                placeholder="Amount"
              />
            )}
          />
          {errors.amount && <p className="text-red-500 text-sm">{errors.amount.message}</p>}
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Entry
        </button>
      </form>
    </div>
  );
};

export default AccountReceivable;