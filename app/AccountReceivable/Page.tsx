"use client";
import React, { useState } from "react";
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
import { FaCalendarAlt, FaSpinner, FaEdit, FaTrash } from "react-icons/fa";
import { eq } from "drizzle-orm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const entrySchema = z.object({
  id: z.number().optional(),
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


type Entry = z.infer<typeof entrySchema>
type CustomerOption = { label: string; value: string; };

const AccountReceivable = () => {
  const queryClient = useQueryClient();
  const { control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<Entry>({
    resolver: zodResolver(entrySchema),
    defaultValues: { date: new Date(), customerId: "", documentno: "", documenttype: "Invoice", description: "", amount: 0 },
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null);

  const isValidDate = (date: Date | null) => {
    return date && !isNaN(date.getTime());  // Returns true for valid Date objects
  };

  const { data: customers, isLoading: isCustomersLoading } = useQuery<CustomerOption[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const data = await db.select({ label: customer.name, value: customer.id }).from(customer);
      return data.map(c => ({ label: c.label, value: c.value.toString() }));
    },
  });

  const { data: entries, isLoading: isEntriesLoading } = useQuery<Entry[]>({
    queryKey: ['entries'],
    queryFn: async () => {
      const data = await db
        .select({
          id: accountReceivable.id,
          date: accountReceivable.date,  // Fetch as is
          customerId: accountReceivable.customerId,
          documentNo: accountReceivable.documentNo,
          documentType: accountReceivable.documentType,
          description: accountReceivable.description,
          amount: accountReceivable.amount,
          debit: accountReceivable.debit,
          credit: accountReceivable.credit,
        })
        .from(accountReceivable);
  
      return data.map(entry => ({
        id: entry.id,
        date: entry.date ? new Date(entry.date) : new Date(),  //  Ensure a Date object
        customerId: entry.customerId?.toString() || "",  //  Convert to string if needed
        documentno: entry.documentNo,  //  Ensure consistent field names
        documenttype: entry.documentType as "Invoice" | "Receipt",
        description: entry.description,
        amount: entry.amount,
        debit: entry.debit ?? 0,  //  Ensure default values if null
        credit: entry.credit ?? 0,
      }));
    },
  });
  


  const addMutation = useMutation({
    mutationFn: (entry: Entry) => db.insert(accountReceivable).values({
      date: entry.date.toLocaleDateString('en-CA'),
      documentNo: entry.documentno,
      documentType: entry.documenttype,
      description: entry.description,
      amount: entry.amount,
      debit: entry.documenttype === "Invoice" ? entry.amount : 0,
      credit: entry.documenttype === "Receipt" ? entry.amount : 0,
      customerId: Number(entry.customerId),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      toast.success("Entry added successfully");
      reset();
    },
  });
  
  

  const updateMutation = useMutation({
    mutationFn: (entry: Entry) => db.update(accountReceivable).set({
      date: entry.date.toLocaleDateString('en-CA'),
      documentNo: entry.documentno,
      documentType: entry.documenttype,
      description: entry.description,
      amount: entry.amount,
      debit: entry.documenttype === "Invoice" ? entry.amount : 0,
      credit: entry.documenttype === "Receipt" ? entry.amount : 0,
      customerId: Number(entry.customerId),
    }).where(eq(accountReceivable.id, entry.id!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      toast.success("Entry updated successfully");
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => db.delete(accountReceivable).where(eq(accountReceivable.id, id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      toast.success("Entry deleted successfully");
      setEntryToDelete(null);
    },
  });

  const onSubmit = (data: Entry) => {
    if (data.id) {
      updateMutation.mutate(data);
    } else {
      addMutation.mutate(data);
    }
  };

  const onEdit = (entry: Entry) => {
    setValue("id", entry.id);
    setValue("date", entry.date);
    setValue("customerId", entry.customerId);
    setValue("documentno", entry.documentno);
    setValue("documenttype", entry.documenttype);
    setValue("description", entry.description);
    setValue("amount", entry.amount);
  };

  return (
    <div className="container mx-auto p-4 bg-gray-50 flex justify-center">
      <ToastContainer />
      <div className="w-full max-w-6xl">
      <form onSubmit={handleSubmit(onSubmit)} className="mb-4 border p-6 rounded-lg shadow-lg bg-white space-y-4">
  <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">Account Receivable Entry Form</h1>

  {/* Form fields remain unchanged */}
  <div className="flex w-full gap-6">
    {/* Date Field */}
    <div className="flex-1">
      <div className="grid grid-cols-7 gap-4 items-center">
        <label htmlFor="date" className="col-span-2 text-lg font-medium text-gray-700">Date</label>
        <div className="col-span-5">
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={field.value && isValidDate(field.value) ? format(field.value, "yyyy-MM-dd") : ""}
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
    </div>

    {/* Customer Field */}
    <div className="flex-1">
      <div className="grid grid-cols-7 gap-4 items-center">
        <label htmlFor="customerId" className="col-span-2 text-lg font-medium text-gray-700">Customer</label>
        <div className="col-span-5">
          <Controller
            name="customerId"
            control={control}
            render={({ field }) => (
              <Select
                options={customers}
                onChange={(option) => field.onChange(option?.value)}
                value={customers?.find(c => c.value === field.value)}
                placeholder="Select Customer"
                isLoading={isCustomersLoading}
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
    </div>
  </div>

 {/* Document No and Document Type in one row */}
<div className="flex w-full gap-6">
  {/* Document No Field */}
  <div className="flex-1">
    <div className="grid grid-cols-7 gap-4 items-center">
      <label htmlFor="documentno" className="col-span-2 text-lg font-medium text-gray-700">Document No</label>
      <div className="col-span-5">
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
  </div>

  {/* Document Type Field */}
  <div className="flex-1">
    <div className="grid grid-cols-7 gap-4 items-center">
      <label htmlFor="documenttype" className="col-span-2 text-lg font-medium text-gray-700">Document Type</label>
      <div className="col-span-5">
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
  </div>
</div>


{/* Description */}
<div className="w-full">
  <div className="grid grid-cols-7 gap-4 items-center">
    <label htmlFor="description" className="col-span-1 text-lg font-medium text-gray-700">Description</label>
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



  {/* Amount */}
  <div className="grid grid-cols-7 gap-4 items-center">
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
    <div className="col-span-2">
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 flex items-center justify-center"
      >
        {isSubmitting ? (
          <FaSpinner className="animate-spin mr-2" />
        ) : null}
        {control._formValues.id ? "Update" : "Add"}
      </button>
    </div>
  </div>

</form>

        {/* Entries Table */}
        <div className="overflow-auto max-h-[500px] relative shadow-sm rounded-lg">
          <table className="min-w-full bg-white">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr>
                <th className="px-4 py-2 border-b">Date</th>
                <th className="px-4 py-2 border-b">Customer</th>
                <th className="px-4 py-2 border-b">Document No</th>
                <th className="px-4 py-2 border-b">Document Type</th>
                <th className="px-4 py-2 border-b">Description</th>
                <th className="px-4 py-2 border-b">Amount</th>
                <th className="px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isEntriesLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">
                    <FaSpinner className="animate-spin h-5 w-5 inline-block" />
                  </td>
                </tr>
              ) : entries?.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-2 border-b">{isValidDate(entry.date) ? format(entry.date, "yyyy-MM-dd") : "Invalid Date"}</td>
                  <td className="px-4 py-2 border-b">{customers?.find(c => c.value === entry.customerId)?.label}</td>
                  <td className="px-4 py-2 border-b">{entry.documentno}</td>
                  <td className="px-4 py-2 border-b">{entry.documenttype}</td>
                  <td className="px-4 py-2 border-b">{entry.description}</td>
                  <td className="px-4 py-2 border-b">{entry.amount.toFixed(2)}</td>
                  <td className="px-4 py-2 border-b">
                    <button 
                      onClick={() => onEdit(entry)} 
                      className="text-blue-500 hover:text-blue-700 mr-2"
                      disabled={isSubmitting}
                    >
                      <FaEdit />
                    </button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button 
                          onClick={() => setEntryToDelete(entry.id!)} 
                          className="text-red-500 hover:text-red-700"
                          disabled={isSubmitting}
                        >
                          <FaTrash />
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Deletion</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">Are you sure you want to delete this entry?</div>
                        <DialogFooter>
                          <DialogClose className="px-4 py-2 border rounded-lg">Cancel</DialogClose>
                          <button 
                            onClick={() => deleteMutation.mutate(entry.id!)} 
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-red-300 flex items-center justify-center"
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending && (
                              <FaSpinner className="animate-spin mr-2" />
                            )}
                            Delete
                          </button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccountReceivable;