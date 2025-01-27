"use client";
import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { db } from "../configs/db";
import { accountReceivable, customer } from "../configs/schema";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { format } from "date-fns";

const entrySchema = z.object({
  date: z.date({ required_error: "Date is required" }),
  customerId: z.string().nonempty("Customer is required"),
  documentno: z.string().nonempty("Document No is required"),
  documenttype: z.enum(["Invoice", "Receipt"], { required_error: "Document Type is invalid" }),
  description: z.string().nonempty("Description is required"),
  amount: z
    .number()
    .nonnegative("Amount must be a positive number")
    .gt(0, "Amount must be greater than 0"),
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
      documentno: "",
      documenttype: "Invoice",
      description: "",
      amount: 0,
    },
  });

  const [customersList, setCustomersList] = useState<CustomerOption[]>([]);

  const fetchCustomers = async () => {
    const data = await db
      .select({ label: customer.name, value: customer.id })
      .from(customer);

    setCustomersList(
      data.map((customer) => ({
        label: customer.label,
        value: Number(customer.value),
      }))
    );
  };

  const addEntry = async (entry: Entry) => {
    const validatedEntry = entrySchema.safeParse(entry);
    if (!validatedEntry.success) {
      console.error(validatedEntry.error);
      return;
    }

    await db.insert(accountReceivable).values({
      date: entry.date.toISOString(),
      documentNo: entry.documentno,
      documentType: entry.documenttype,
      description: entry.description,
      amount: entry.amount,
      debit: entry.documenttype === "Invoice" ? entry.amount : 0,
      credit: entry.documenttype === "Receipt" ? entry.amount : 0,
    });
  };

  const onSubmit = (data: Entry) => {
    addEntry(data);
    reset();
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div className="container mx-auto p-4 flex justify-center items-center min-h-screen">
      <div className="w-full max-w-3xl">
        <h1 className="text-2xl font-bold mb-4 text-center">Account Receivable</h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-6 border p-6 rounded shadow-md space-y-6"
        >
          {/* Date Field */}
          <div className="flex items-center space-x-4 mb-4">
            <label htmlFor="date" className="text-lg">Date</label>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="w-full">
                      <Button
                        variant="outline"
                        className={`w-full text-left ${!field.value ? "text-muted-foreground" : ""}`}
                      >
                        {field.value ? format(new Date(field.value), "yyyy-MM-dd") : "Pick a date"}
                      </Button>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date()}
                      className="rounded-md"
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.date && <p className="text-red-500 text-sm">{errors.date.message}</p>}
          </div>

          {/* Customer Field */}
          <div className="flex items-center space-x-4 mb-4">
            <label htmlFor="customerId" className="text-lg">Customer</label>
            <Controller
              name="customerId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange}>
                  <SelectTrigger>
                    <span className="text-muted-foreground">
                      {field.value
                        ? customersList.find((customer) => customer.value.toString() === field.value)?.label || "Select Customer"
                        : "Select Customer"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {customersList.map((customer) => (
                      <SelectItem key={customer.value} value={customer.value.toString()}>
                        {customer.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.customerId && <p className="text-red-500 text-sm">{errors.customerId.message}</p>}
          </div>

          {/* Document No */}
          <div className="flex items-center space-x-4 mb-4">
            <label htmlFor="documentno" className="text-lg">Document No</label>
            <Controller
              name="documentno"
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
            {errors.documentno && <p className="text-red-500 text-sm">{errors.documentno.message}</p>}
          </div>

          {/* Document Type */}
          <div className="flex items-center space-x-4 mb-4">
            <label htmlFor="documenttype" className="text-lg">Document Type</label>
            <Controller
              name="documenttype"
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
          <div className="flex items-center space-x-4 mb-4">
            <label htmlFor="description" className="text-lg">Description</label>
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
          <div className="flex items-center space-x-4 mb-4">
            <label htmlFor="amount" className="text-lg">Amount</label>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  step="0.01"
                  className="border p-2 w-full"
                  placeholder="Amount"
                  value={field.value || ''} // Ensure value is either a number or empty string
                  onChange={(e) => {
                    field.onChange(parseFloat(e.target.value) || 0); // default to 0 if NaN
                  }}
                />
              )}
            />
            {errors.amount && <p className="text-red-500 text-sm">{errors.amount.message}</p>}
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountReceivable;
