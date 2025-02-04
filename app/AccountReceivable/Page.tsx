"use client";
import React, { useState, useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import "react-calendar/dist/Calendar.css";
import { format } from "date-fns";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaSpinner, FaEdit } from "react-icons/fa";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { SelectComponent } from "@/components/ui/SelectComponent";
import { InputComponent } from "@/components/ui/InputComponent";
import { Entry, entrySchema, DOCUMENT_TYPES } from "@/lib/schemas";
import { getEntries, getCustomers, addEntry, updateEntry, deleteEntry } from "@/lib/actions/accountReceivable";
const DOCUMENT_TYPE_OPTIONS = DOCUMENT_TYPES.map(type => ({
  label: type,
  value: type,
}));
type CustomerOption = { label: string; value: string };
const AccountReceivable = () => {
  const queryClient = useQueryClient();
  const methods = useForm<Entry>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      date: new Date(),
      customerId: "",
      documentno: "",
      documenttype: "Invoice",
      description: "",
      amount: undefined, // Schema expects a number, but initial undefined may cause issues
    },
    mode: "onChange",
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isValid },
    watch,
  } = methods;
  const tableContainerRef = useRef<HTMLDivElement>(null);
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
    queryFn: async ({ pageParam = 0 }) => await getEntries(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => lastPage.length === 5 ? allPages.length : undefined,
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
    queryFn: async () => await getCustomers(),
  });

  // Mutations remain the same

  const addMutation = useMutation({
    mutationFn: (entry: Entry) => addEntry(entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      toast.success("Entry added successfully");
      reset();
    },
    onError: () => toast.error("Failed to add entry"),
  });

  const updateMutation = useMutation({
    mutationFn: (entry: Entry) => updateEntry(entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      toast.success("Entry updated successfully");
      reset();
    },
    onError: () => toast.error("Failed to update entry"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteEntry(id),
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

  const formMethods = useForm(); // Get form methods

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="max-w-7xl w-full mx-auto flex flex-col h-full gap-4 min-h-0 p-4">
        {/* Entry Form */}
        <div className="border p-6 rounded-lg shadow-lg bg-white">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
            Account Receivable Entry Form
          </h1>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex gap-6">

                <div className="flex-1">
                  <DatePickerField
                    name="date"
                    label="Date"
                    className="flex-1"
                    inputClassName="w-full border rounded-md p-2 shadow-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div className="flex-1">
                  <SelectComponent
                    name="customerId"
                    label="Customer"
                    options={customers || []}
                    isLoading={isCustomersLoading}
                  />
                </div>

              </div>

              {/* Document No & Document Type Row */}
              <div className="flex gap-6">
                <div className="flex-1">
                  <InputComponent
                    name="documentno"
                    label="Document No"
                    placeholder="Document No"
                    labelCols={2}
                    inputCols={5}
                  />
                </div>

                <div className="flex-1">
                  <SelectComponent
                    name="documenttype"
                    label="Document Type"
                    options={DOCUMENT_TYPE_OPTIONS}
                    isPredefined
                  />
                </div>

              </div>

              {/* Description Field */}
              <div className="w-full">
                <InputComponent
                  name="description"
                  label="Description"
                  placeholder="Description"
                  className="w-full"
                  labelCols={1}
                  inputCols={6}
                />
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
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          field.onChange(isNaN(value) ? undefined : value);
                        }}
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
                      {watch("id") ? "Update" : "Add Entry"}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </FormProvider>
        </div>

        {/* Entries Table */}
        <div className="flex-1 flex flex-col border p-6 rounded-lg shadow-lg bg-white overflow-hidden">
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
                            onDelete={deleteMutation.mutateAsync} // Pass mutateAsync here
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
