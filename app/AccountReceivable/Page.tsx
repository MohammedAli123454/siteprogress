"use client";
import React, { useState, useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { db } from "../configs/db";
import { accountReceivable, customer } from "../configs/schema";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Select from "react-select";
import { format, parseISO } from "date-fns";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaCalendarAlt, FaSpinner, FaEdit, FaTrash } from "react-icons/fa";
import { eq } from "drizzle-orm";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog";

const DOCUMENT_TYPES = ["Invoice", "Receipt"] as const;

const entrySchema = z.object({
  id: z.number().optional(),
  date: z.date({ required_error: "Date is required" }),
  customerId: z.string().min(1, "Customer is required"),
  documentno: z.string().min(1, "Document No is required"),
  documenttype: z.enum(DOCUMENT_TYPES, { required_error: "Document Type is invalid" }),
  description: z.string().min(1, "Description is required"),
  amount: z.coerce
    .number()
    .positive("Amount must be greater than 0")
    .max(999999999, "Amount is too large"),
});

type Entry = z.infer<typeof entrySchema>;
type CustomerOption = { label: string; value: string };

const AccountReceivable = () => {
  const queryClient = useQueryClient();
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isValid },
    watch,
  } = useForm<Entry>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      date: new Date(),
      customerId: "",
      documentno: "",
      documenttype: "Invoice",
      description: "",
      amount: undefined,
    },
    mode: "onChange",
  });
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  // Added search term state for filtering table entries
  const [searchTerm, setSearchTerm] = useState("");
  const { ref: loadMoreRef, inView } = useInView({

    root: tableContainerRef.current,
    rootMargin: "200px",
    threshold: 0.1,
  });

  // Infinite query implementation
  const {
    data: entriesPages,
    isLoading: isEntriesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["entries"],
    queryFn: async ({ pageParam = 0 }) => {
      const limit = 5;
      const offset = pageParam * limit;
      const data = await db
        .select({
          id: accountReceivable.id,
          date: accountReceivable.date,
          customerId: accountReceivable.customerId,
          documentNo: accountReceivable.documentNo,
          documentType: accountReceivable.documentType,
          description: accountReceivable.description,
          amount: accountReceivable.amount,
        })
        .from(accountReceivable)
        .orderBy(accountReceivable.id)
        .limit(limit)
        .offset(offset);

        console.log("Fetched page data:", data); // Log fetched page data
   
      return data.map(entry => ({
        ...entry,
        date: entry.date ? parseISO(entry.date.toString()) : new Date(),
        customerId: entry.customerId?.toString() || "",
        documentno: entry.documentNo,
        documenttype: entry.documentType as typeof DOCUMENT_TYPES[number],
      }));
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
       // Correctly check if last page has 7 items
       return lastPage.length === 5 ? allPages.length : undefined;
    },
  });

  
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allEntries = entriesPages?.pages.flatMap(page => page) || [];
  
  // Customers query remains the same
  const { data: customers, isLoading: isCustomersLoading } = useQuery<CustomerOption[]>({
    queryKey: ["customers"],
    queryFn: async () => {
      const data = await db.select({ label: customer.name, value: customer.id }).from(customer);
      return data.map(c => ({ label: c.label, value: c.value.toString() }));
    },
  });

  // Mutations remain the same
  const addMutation = useMutation({
    mutationFn: (entry: Entry) =>
      db.insert(accountReceivable).values({
        date: format(entry.date, "yyyy-MM-dd"),
        documentNo: entry.documentno,
        documentType: entry.documenttype,
        description: entry.description,
        amount: entry.amount,
        debit: entry.documenttype === "Invoice" ? entry.amount : 0,
        credit: entry.documenttype === "Receipt" ? entry.amount : 0,
        customerId: Number(entry.customerId),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      toast.success("Entry added successfully");
      reset();
    },
    onError: () => toast.error("Failed to add entry"),
  });

  const updateMutation = useMutation({
    mutationFn: (entry: Entry) =>
      db
        .update(accountReceivable)
        .set({
          date: format(entry.date, "yyyy-MM-dd"),
          documentNo: entry.documentno,
          documentType: entry.documenttype,
          description: entry.description,
          amount: entry.amount,
          debit: entry.documenttype === "Invoice" ? entry.amount : 0,
          credit: entry.documenttype === "Receipt" ? entry.amount : 0,
          customerId: Number(entry.customerId),
        })
        .where(eq(accountReceivable.id, entry.id!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      toast.success("Entry updated successfully");
      reset();
    },
    onError: () => toast.error("Failed to update entry"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => db.delete(accountReceivable).where(eq(accountReceivable.id, id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      toast.success("Entry deleted successfully");
    },
    onError: () => toast.error("Failed to delete entry"),
  });

  // Filtering logic remains the same
  const filteredEntries = allEntries.filter((entry) => {
    const search = searchTerm.toLowerCase();
    const customerName =
      customers?.find((c) => c.value === entry.customerId)?.label.toLowerCase() || "";
    return (
      format(entry.date, "yyyy-MM-dd").includes(search) ||
      customerName.includes(search) ||
      entry.documentno.toLowerCase().includes(search) ||
      entry.documenttype.toLowerCase().includes(search) ||
      entry.description.toLowerCase().includes(search) ||
      entry.amount.toString().includes(search)
    );
  });

  // Form submission handlers remain the same
  const onSubmit = (data: Entry) => {
    data.id ? updateMutation.mutate(data) : addMutation.mutate(data);
  };

  const onEdit = (entry: Entry) => {
    Object.entries(entry).forEach(([key, value]) => {
      setValue(key as keyof Entry, value);
    });
  };

  const handleCancel = () => reset();



  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="max-w-7xl w-full mx-auto flex flex-col h-full gap-4 min-h-0 p-4">
        {/* Entry Form */}
        <div className="border p-6 rounded-lg shadow-lg bg-white">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
            Account Receivable Entry Form
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Date & Customer Row */}
            <div className="flex gap-6">
              {/* Date Picker */}
              <div className="flex-1">
                <div className="grid grid-cols-7 gap-4 items-center">
                  <label htmlFor="date" className="col-span-2 text-lg font-medium text-gray-700">
                    Date
                  </label>
                  <div className="col-span-5 relative">
                    <Controller
                      name="date"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <input
                            readOnly
                            value={format(field.value, "yyyy-MM-dd")}
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                            className="w-full border rounded-md p-2 shadow-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          />
                          <FaCalendarAlt
                            className="absolute top-3 right-3 text-gray-500 cursor-pointer"
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                          />
                          {isCalendarOpen && (
                            <div className="absolute z-10 mt-2 shadow-lg">
                              <Calendar
                                onChange={(date) => {
                                  field.onChange(date);
                                  setIsCalendarOpen(false);
                                }}
                                value={field.value}
                                className="border rounded-md"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    />
                  </div>
                </div>
                {errors.date && (
                  <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
                )}
              </div>

              {/* Customer Select */}
              <div className="flex-1">
                <div className="grid grid-cols-7 gap-4 items-center">
                  <label htmlFor="customer" className="col-span-2 text-lg font-medium text-gray-700">
                    Customer
                  </label>
                  <div className="col-span-5">
                    <Controller
                      name="customerId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          options={customers}
                          onChange={(option) => field.onChange(option?.value)}
                          value={customers?.find((c) => c.value === field.value)}
                          placeholder="Select Customer"
                          isLoading={isCustomersLoading}
                          loadingMessage={() => "Loading customers..."}
                          className="react-select-container"
                          classNamePrefix="react-select"
                        />
                      )}
                    />
                  </div>
                </div>
                {errors.customerId && (
                  <p className="text-red-500 text-sm mt-1">{errors.customerId.message}</p>
                )}
              </div>
            </div>

            {/* Document No & Document Type Row */}
            <div className="flex gap-6">
              {/* Document Number */}
              <div className="flex-1">
                <div className="grid grid-cols-7 gap-4 items-center">
                  <label htmlFor="documentno" className="col-span-2 text-lg font-medium text-gray-700">
                    Document No
                  </label>
                  <div className="col-span-5">
                    <Controller
                      name="documentno"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          className="w-full border rounded-md p-2 shadow-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="Document No"
                        />
                      )}
                    />
                  </div>
                </div>
                {errors.documentno && (
                  <p className="text-red-500 text-sm mt-1">{errors.documentno.message}</p>
                )}
              </div>

              {/* Document Type */}
              <div className="flex-1">
                <div className="grid grid-cols-7 gap-4 items-center">
                  <label htmlFor="documenttype" className="col-span-2 text-lg font-medium text-gray-700">
                    Document Type
                  </label>
                  <div className="col-span-5">
                    <Controller
                      name="documenttype"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full border rounded-md p-2 shadow-sm focus:ring-2 focus:ring-blue-500"
                        >
                          {DOCUMENT_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Description Field */}
            <div className="w-full">
              <div className="grid grid-cols-7 gap-4 items-center">
                <label
                  htmlFor="description"
                  className="col-span-1 text-lg font-medium text-gray-700"
                >
                  Description
                </label>
                <div className="col-span-6">
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
            </div>

            {/* Amount Field and Submit Button */}
            <div className="grid grid-cols-7 gap-4 items-center">
              <label htmlFor="amount" className="col-span-1 text-lg font-medium text-gray-700">
                Amount
              </label>
              <div className="col-span-3">
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
                      value={field.value || ""}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                )}
              </div>
              <div className="col-span-3 flex gap-2">
                {watch("id") ? (
                  <>
                    <button
                      type="submit"
                      disabled={!isValid || isSubmitting}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                    >
                      {isSubmitting ? <FaSpinner className="animate-spin mr-2" /> : null}
                      Update
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    disabled={!isValid || isSubmitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                  >
                    {isSubmitting ? <FaSpinner className="animate-spin mr-2" /> : null}
                    Add Entry
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Entries Table */}
        <div className="flex-1 flex flex-col border rounded-lg shadow-lg bg-white overflow-hidden">
          <div className="p-4">
            <input
              type="text"
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div 
    className="overflow-auto" 
    ref={tableContainerRef}
    style={{ height: "500px" }}
  >
          <table className="min-w-full relative">
          <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {["Date", "Customer", "Document No", "Type", "Description", "Amount", "Actions"].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
                      >
                        {header}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isEntriesLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      <FaSpinner className="animate-spin inline-block" />
                    </td>
                  </tr>
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-gray-500">
                      No entries found
                    </td>
                  </tr>
                ) : (
                  <>
                    {filteredEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          {format(entry.date, "yyyy-MM-dd")}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {customers?.find((c) => c.value === entry.customerId)?.label || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm">{entry.documentno}</td>
                        <td className="px-4 py-3 text-sm">{entry.documenttype}</td>
                        <td className="px-4 py-3 text-sm">{entry.description}</td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {entry.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm space-x-2">
                          <button
                            onClick={() => onEdit(entry)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <DeleteConfirmationDialog
                entryId={entry.id!}
                onDelete={deleteMutation.mutate}
                isDeleting={deleteMutation.isPending}
              />
                        </td>
                      </tr>
                    ))}
                   {/* Sentinel row for infinite scrolling */}
                   <tr ref={loadMoreRef}>
                      <td colSpan={7} className="text-center p-4">
                        {isFetchingNextPage && <FaSpinner className="animate-spin" />}
                        {!isFetchingNextPage && hasNextPage && "Scroll to load more"}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountReceivable;
