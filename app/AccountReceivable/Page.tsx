"use client";
import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { db } from "../configs/db";
import { accountReceivable, customer } from "../configs/schema";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Select from "react-select";
import { format } from "date-fns";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaCalendarAlt, FaSpinner } from "react-icons/fa";

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
  value: string;
};

const AccountReceivable = () => {
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
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
  const [isLoading, setIsLoading] = useState(true);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const fetchCustomers = async () => {
    try {
      const data = await db
        .select({ label: customer.name, value: customer.id })
        .from(customer);

      setCustomersList(
        data.map((customer) => ({
          label: customer.label,
          value: customer.value.toString(),
        }))
      );
    } catch (error) {
      toast.error("Failed to fetch customers");
    } finally {
      setIsLoading(false);
    }
  };

  const addEntry = async (entry: Entry) => {
    try {
      // Remove redundant validation since react-hook-form already validated
      console.log("Submitting entry:", entry); // Log entry data
  
      await db.insert(accountReceivable).values({
        date: entry.date,
        documentNo: entry.documentno,
        documentType: entry.documenttype,
        description: entry.description,
        amount: entry.amount,
        debit: entry.documenttype === "Invoice" ? entry.amount : 0,
        credit: entry.documenttype === "Receipt" ? entry.amount : 0,
        customerId: Number(entry.customerId), // Remove if customerId is a string
      });
  
      toast.success("Entry added successfully");
      reset();
    } catch (error) {
      console.error("Database error:", error); // Log detailed error
      toast.error("Failed to add entry. Check console for details.");
    }
  };

  const onSubmit = (data: Entry) => {
    addEntry(data);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div className="container mx-auto p-4 flex justify-center items-center min-h-screen bg-gray-50">
      <ToastContainer />
      <div className="w-full max-w-4xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Account Receivable</h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-6 border p-8 rounded-lg shadow-lg bg-white space-y-6"
        >
          {/* Date Field */}
          <div className="grid grid-cols-5 gap-4 items-center">
            <label htmlFor="date" className="col-span-1 text-lg font-medium text-gray-700">Date</label>
            <div className="col-span-4">
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={format(field.value, "yyyy-MM-dd")}
                      onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                      className="w-full border rounded-lg p-2 shadow-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      placeholder="Select Date"
                    />
                    <FaCalendarAlt className="absolute top-3 right-3 text-gray-500 cursor-pointer" onClick={() => setIsCalendarOpen(!isCalendarOpen)} />
                    {isCalendarOpen && (
                      <div className="absolute z-10 mt-2">
                        <Calendar
                          onChange={(date) => {
                            field.onChange(date);
                            setIsCalendarOpen(false);
                          }}
                          value={field.value}
                          className="border rounded-lg shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                )}
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
              )}
            </div>
          </div>

          {/* Customer Field */}
          <div className="grid grid-cols-5 gap-4 items-center">
            <label htmlFor="customerId" className="col-span-1 text-lg font-medium text-gray-700">Customer</label>
            <div className="col-span-4">
              <Controller
                name="customerId"
                control={control}
                render={({ field }) => (
                  <Select
                    options={customersList}
                    onChange={(selectedOption) => field.onChange(selectedOption?.value)}
                    value={customersList.find((customer) => customer.value === field.value)}
                    placeholder="Select Customer"
                    isLoading={isLoading}
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                )}
              />
              {errors.customerId && (
                <p className="text-red-500 text-sm mt-1">{errors.customerId.message}</p>
              )}
            </div>
          </div>

          {/* Document No */}
          <div className="grid grid-cols-5 gap-4 items-center">
            <label htmlFor="documentno" className="col-span-1 text-lg font-medium text-gray-700">Document No</label>
            <div className="col-span-4">
              <Controller
                name="documentno"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className="w-full border rounded-lg p-2 shadow-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Document No"
                  />
                )}
              />
              {errors.documentno && (
                <p className="text-red-500 text-sm mt-1">{errors.documentno.message}</p>
              )}
            </div>
          </div>

          {/* Document Type */}
          <div className="grid grid-cols-5 gap-4 items-center">
            <label htmlFor="documenttype" className="col-span-1 text-lg font-medium text-gray-700">Document Type</label>
            <div className="col-span-4">
              <Controller
                name="documenttype"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full border rounded-lg p-2 shadow-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Invoice">Invoice</option>
                    <option value="Receipt">Receipt</option>
                  </select>
                )}
              />
            </div>
          </div>

          {/* Description */}
          <div className="grid grid-cols-5 gap-4 items-center">
            <label htmlFor="description" className="col-span-1 text-lg font-medium text-gray-700">Description</label>
            <div className="col-span-4">
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className="w-full border rounded-lg p-2 shadow-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Description"
                  />
                )}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="grid grid-cols-5 gap-4 items-center">
            <label htmlFor="amount" className="col-span-1 text-lg font-medium text-gray-700">Amount</label>
            <div className="col-span-4">
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    step="0.01"
                    className="w-full border rounded-lg p-2 shadow-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Amount"
                    value={field.value || ''}
                    onChange={(e) => {
                      field.onChange(parseFloat(e.target.value) || 0);
                    }}
                  />
                )}
              />
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 flex items-center"
            >
              {isSubmitting ? (
                <FaSpinner className="animate-spin mr-2" />
              ) : null}
              Add Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountReceivable;

