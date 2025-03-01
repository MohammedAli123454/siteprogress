"use client";
import { useState, useTransition, useEffect, useCallback } from "react";
import DatePicker from "react-datepicker";
import { Calendar } from "@/components/ui/calendar"
import "react-datepicker/dist/react-datepicker.css";
import {
  addPartialInvoice,
  updatePartialInvoice,
  deletePartialInvoice
} from "@/app/actions/invoiceActions";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { db } from "../configs/db";
import { mocs, partialInvoices } from "../configs/schema";
import { eq, sql } from "drizzle-orm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";



// Interfaces
interface PartialInvoiceFormProps {
  onInvoiceAdded?: () => void;
}

interface MocOption {
  id: number;
  mocNo: string;
  cwo: string;
}

interface PartialInvoiceBase {
  mocId?: number;
  invoiceNo?: string;
  invoiceDate?: string;
  amount?: number;
  vat?: number;
  retention?: number;
  invoiceStatus?: string;
}

interface PartialInvoice extends PartialInvoiceBase {
  id: number;
  mocNo: string;
}

// Constants
const STATUS_COLORS: Record<string, string> = {
  PMD: "bg-blue-100 text-blue-800",
  PMT: "bg-yellow-100 text-yellow-800",
  FINANCE: "bg-green-100 text-green-800",
  PAID: "bg-purple-100 text-purple-800",
};

// Helper Components
const Spinner = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
);

const SkeletonRow = () => (
  <TableRow className="h-8">
    <TableCell>
      <Skeleton className="h-4 w-[100px]" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-[150px]" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-[100px]" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-[100px]" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-[180px]" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-[100px]" />
    </TableCell>
  </TableRow>
);

export default function PartialInvoiceForm({
  onInvoiceAdded = () => { }
}: PartialInvoiceFormProps) {
  // State Management
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [mocOptions, setMocOptions] = useState<MocOption[]>([]);
  const [invoices, setInvoices] = useState<PartialInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingInvoiceNo, setIsGeneratingInvoiceNo] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;


  // Form State
  const [formData, setFormData] = useState({
    mocId: "",
    invoiceNo: "",
    invoiceDate: new Date(),
    amount: "",
    vat: "",
    retention: "",
    invoiceStatus: "",
  });

  // Data Fetching
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [mocsResult, invoicesResult] = await Promise.all([
          db.select().from(mocs),
          db.select().from(partialInvoices)
        ]);

        setMocOptions(mocsResult.map(moc => ({
          id: moc.id,
          mocNo: moc.mocNo,
          cwo: moc.cwo,
        })));

        const sortedInvoices = invoicesResult.map(invoice => {
          const moc = mocsResult.find(m => m.id === invoice.mocId);
          return {
            ...invoice,
            mocId: invoice.mocId,
            invoiceDate: invoice.invoiceDate,
            amount: parseFloat(invoice.amount),
            vat: parseFloat(invoice.vat),
            retention: parseFloat(invoice.retention),
            mocNo: moc?.mocNo || "",
          };
        }).sort((a, b) => a.mocNo.localeCompare(b.mocNo));

        setInvoices(sortedInvoices);
      } catch (error) {
        console.error("Initial data fetch error:", error);
        showDialog("Error", "Failed to load initial data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Business Logic
  const calculateValues = useCallback((amount: number) => ({
    vat: amount * 0.15,
    retention: amount * 0.10,
  }), []);

  const handleAmountChange = (value: string) => {
    const amount = parseFloat(value);
    if (!isNaN(amount)) {
      const { vat, retention } = calculateValues(amount);
      setFormData((prev) => ({
        ...prev,
        amount: value,
        vat: vat.toFixed(2),
        retention: retention.toFixed(2),
      }));
    }
  };

  const generateInvoiceNumber = useCallback(
    async (mocId: string) => {
      setIsGeneratingInvoiceNo(true);
      try {
        const moc = mocOptions.find((m) => m.id.toString() === mocId);
        if (!moc) return;

        // Fetch existing invoice numbers for this MOC
        const existingInvoices = await db
          .select({ invoiceNo: partialInvoices.invoiceNo })
          .from(partialInvoices)
          .where(eq(partialInvoices.mocId, parseInt(mocId)));

        let maxNumber = 0;
        existingInvoices.forEach(({ invoiceNo }) => {
          const match = invoiceNo.match(/INV-C-(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            maxNumber = Math.max(maxNumber, num);
          }
        });

        const nextNumber = maxNumber + 1;
        const paddedNumber = nextNumber.toString().padStart(3, '0');
        const newInvoiceNo = `${moc.cwo} INV-C-${paddedNumber}`;

        setFormData((prev) => ({ ...prev, invoiceNo: newInvoiceNo }));
      } finally {
        setIsGeneratingInvoiceNo(false);
      }
    },
    [mocOptions]
  );

  // Form Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const invoiceData = {
          ...formData,
          mocId: parseInt(formData.mocId),
          amount: parseFloat(formData.amount),
          vat: parseFloat(formData.vat),
          retention: parseFloat(formData.retention),
          invoiceDate: format(formData.invoiceDate, "yyyy-MM-dd"),
        };

        if (editId) {
          await updatePartialInvoice(editId, invoiceData);
          showDialog("Success", "Invoice updated successfully!");
        } else {
          await addPartialInvoice(invoiceData);
          showDialog("Success", "Invoice added successfully!");
        }

        refreshInvoices();
        resetForm();
        onInvoiceAdded();
      } catch (error) {
        console.error("Form submission error:", error);
        showDialog("Error", "An error occurred. Please try again.");
      }
    });
  };

  const handleEdit = (invoice: PartialInvoice) => {
    setFormData({
      mocId: invoice.mocId?.toString() || "",
      invoiceNo: invoice.invoiceNo ?? "",
      invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate) : new Date(),
      amount: invoice.amount?.toString() || "",
      vat: invoice.vat?.toString() || "",
      retention: invoice.retention?.toString() || "",
      invoiceStatus: invoice.invoiceStatus ?? "",
    });
    setEditId(invoice.id);
  };

  const handleDelete = async (id: number) => {
    startTransition(async () => {
      try {
        await deletePartialInvoice(id);
        refreshInvoices();
        showDialog("Success", "Invoice deleted successfully!");
      } catch (error) {
        console.error("Delete error:", error);
        showDialog("Error", "Failed to delete invoice.");
      } finally {
        setDeleteId(null);
      }
    });
  };

  const handleStatusChange = async (id: number, status: string) => {
    startTransition(async () => {
      try {
        await updatePartialInvoice(id, { invoiceStatus: status });
        refreshInvoices();
      } catch (error) {
        console.error("Status update error:", error);
      }
    });
  };

  // Helper Functions
  const showDialog = (title: string, message: string) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogOpen(true);
  };

  const refreshInvoices = async () => {
    try {
      const result = await db
        .select({
          id: partialInvoices.id,
          mocId: partialInvoices.mocId,
          invoiceNo: partialInvoices.invoiceNo,
          invoiceDate: partialInvoices.invoiceDate,
          amount: partialInvoices.amount,
          vat: partialInvoices.vat,
          retention: partialInvoices.retention,
          invoiceStatus: partialInvoices.invoiceStatus, // Ensure this is selected
          mocNo: mocs.mocNo
        })
        .from(partialInvoices)
        .leftJoin(mocs, eq(partialInvoices.mocId, mocs.id));

      const updatedInvoices = result.map(row => ({
        ...row,
        mocNo: row.mocNo || "",
        amount: parseFloat(row.amount),
        vat: parseFloat(row.vat),
        retention: parseFloat(row.retention),
        // Ensure status is properly formatted
        invoiceStatus: row.invoiceStatus.trim().toUpperCase()
      }));

      setInvoices(updatedInvoices);
    } catch (error) {
      console.error("Refresh invoices error:", error);
    }
  };

  // Add filtered invoices
  const filteredInvoices = invoices.filter(invoice => {
    const searchLower = searchQuery.toLowerCase();
    const invoiceDate = invoice.invoiceDate ? new Date(invoice.invoiceDate) : null;

    // Date range filter
    const dateInRange = !startDate || !endDate || !invoiceDate ? true :
      invoiceDate >= startDate && invoiceDate <= endDate;

    // Existing search filter
    const matchesSearch = (
      invoice.invoiceNo?.toLowerCase().includes(searchLower) ||
      invoice.mocNo?.toLowerCase().includes(searchLower) ||
      invoice.invoiceDate?.toLowerCase().includes(searchLower)
    );

    return dateInRange && matchesSearch;
  });

  const resetForm = () => {
    setFormData({
      mocId: "",
      invoiceNo: "",
      invoiceDate: new Date(),
      amount: "",
      vat: "",
      retention: "",
      invoiceStatus: "",
    });
    setEditId(null);
  };

  // Effect Hooks
  useEffect(() => {
    if (formData.mocId) {
      generateInvoiceNumber(formData.mocId);
    }
  }, [formData.mocId, generateInvoiceNumber]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="flex-grow max-w-7xl mx-auto w-full px-4 py-4">
        <div className="bg-white rounded-lg shadow-lg p-2 h-full flex flex-col">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            {editId ? "Edit Partial Invoice" : "Add Partial Invoice"}
          </h3>

          {/* Invoice Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="MOC Number *"
                content={
                  <Select
                    value={formData.mocId}
                    onValueChange={(value) => setFormData({ ...formData, mocId: value })}
                    required
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select MOC" />
                    </SelectTrigger>
                    <SelectContent>
                      {mocOptions.map((moc) => (
                        <SelectItem key={moc.id} value={moc.id.toString()} className="text-sm">
                          {moc.mocNo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
              />

              <FormField
                label="Invoice Number *"
                content={
                  <Input
                    id="invoiceNo"
                    type="text"
                    value={formData.invoiceNo}
                    readOnly
                    className="bg-gray-100"
                    placeholder={
                      isGeneratingInvoiceNo
                        ? "Generating..."
                        : "Select MOC to generate"
                    }
                  />
                }
              />

              <FormField
                label="Invoice Date *"
                content={
                  <DatePicker
                    selected={formData.invoiceDate}
                    onChange={(date) =>
                      date && setFormData({ ...formData, invoiceDate: date })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    dateFormat="yyyy-MM-dd"
                    required
                  />
                }
              />

              <FormField
                label="Amount (SAR) *"
                content={
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    required
                  />
                }
              />

              <FormField
                label="VAT (SAR) *"
                content={
                  <Input
                    id="vat"
                    type="number"
                    step="0.01"
                    value={formData.vat}
                    disabled
                    className="bg-gray-100"
                  />
                }
              />

              <FormField
                label="Retention (SAR) *"
                content={
                  <Input
                    id="retention"
                    type="number"
                    step="0.01"
                    value={formData.retention}
                    disabled
                    className="bg-gray-100"
                  />
                }
              />
            </div>

            {/* New combined row: Partial Invoices title, Invoice Status, Action Buttons, and Search Input */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <FormField
                  label="Status *"
                  content={
                    <Select
                      value={formData.invoiceStatus}
                      onValueChange={(value) =>
                        setFormData({ ...formData, invoiceStatus: value })
                      }
                      required
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_COLORS).map(([status, color]) => (
                          <SelectItem
                            key={status}
                            value={status}
                            className={`text-sm ${color}`}
                          >
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  }
                />
              </div>
              <div className="flex items-center space-x-2 justify-end">
  {editId && (
    <Button
      type="button"
      variant="outline"
      onClick={resetForm}
      disabled={isPending}
    >
      Cancel
    </Button>
  )}
  <Button type="submit" className="w-full md:w-auto" disabled={isPending}>
    {isPending ? "Processing..." : editId ? "Update Invoice" : "Add Invoice"}
  </Button>

  <div className="flex items-center space-x-2">
    <Input
      placeholder="Search invoices..."
      value={searchQuery}
      onChange={(e) => {
        setSearchQuery(e.target.value);
        setDateRange([null, null]);
      }}
      className="w-48"
    />
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <CalendarIcon className="h-4 w-4 mr-2" />
          {startDate ? 
            (endDate ? 
              `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd')}` : 
              format(startDate, 'MMM dd')) : 
            "Select Date Range"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="range"
          selected={{ from: startDate || undefined, to: endDate || undefined }}
          onSelect={(range) => {
            setDateRange([range?.from || null, range?.to || null]);
            setSearchQuery("");
          }}
          numberOfMonths={2}
          className="rounded-md border"
        />
      </PopoverContent>
    </Popover>
  </div>
</div>
            </div>
          </form>

          {/* Invoices Table */}
          <InvoiceTable
            invoices={filteredInvoices}
            isLoading={isLoading}
            isPending={isPending}
            onEdit={handleEdit}
            onDelete={setDeleteId}
            onStatusChange={handleStatusChange}
          />

          {/* Dialogs */}
          <MessageDialog
            open={dialogOpen}
            title={dialogTitle}
            message={dialogMessage}
            onClose={() => setDialogOpen(false)}
          />

          <DeleteConfirmationDialog
            deleteId={deleteId}
            isPending={isPending}
            onCancel={() => setDeleteId(null)}
            onConfirm={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}

// Sub-components
const FormField = ({ label, content }: { label: string; content: React.ReactNode }) => (
  <div className="grid grid-cols-4 items-center gap-4">
    <Label className="text-sm font-medium text-gray-700">{label}</Label>
    <div className="col-span-3">{content}</div>
  </div>
);

const InvoiceTable = ({
  invoices,
  isLoading,
  isPending,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  invoices: PartialInvoice[];
  isLoading: boolean;
  isPending: boolean;
  onEdit: (invoice: PartialInvoice) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, value: string) => void;
}) => (
  <div className="mt-8 flex-1 flex flex-col">
    <div className="border rounded-lg overflow-hidden flex-1">
      <div className="relative h-full">
        <div className="absolute inset-0 overflow-auto">
          <Table className="border-collapse">
            {/* Updated TableHeader: sticky with light background */}
            <TableHeader className="sticky top-0 bg-gray-50 shadow-sm z-10">
              <TableRow className="h-8">
                <TableHead className="font-semibold text-gray-700 py-2">MOC Number</TableHead>
                <TableHead className="font-semibold text-gray-700 py-2">Invoice No</TableHead>
                <TableHead className="font-semibold text-gray-700 py-2">Inv. Sub. Date</TableHead>
                <TableHead className="font-semibold text-gray-700 py-2">Invoice Amount</TableHead>
                <TableHead className="font-semibold text-gray-700 py-2">Status</TableHead>
                <TableHead className="font-semibold text-gray-700 py-2">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading
                ? Array(5)
                  .fill(0)
                  .map((_, i) => <SkeletonRow key={i} />)
                : invoices.map((invoice) => (
                  <InvoiceRow
                    key={invoice.id}
                    invoice={invoice}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStatusChange={onStatusChange}
                  />
                ))}
            </TableBody>
          </Table>
        </div>
        {(isPending || isLoading) && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
            <Spinner />
          </div>
        )}
      </div>
    </div>
  </div>
);

const InvoiceRow = ({
  invoice,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  invoice: PartialInvoice;
  onEdit: (invoice: PartialInvoice) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, value: string) => void;
}) => (
  <TableRow className="h-8 hover:bg-gray-50">
    <TableCell className="py-1">{invoice.mocNo}</TableCell>
    <TableCell className="p-1">{invoice.invoiceNo}</TableCell>
    <TableCell className="p-1">
      {invoice.invoiceDate
        ? new Date(invoice.invoiceDate).toLocaleDateString()
        : "N/A"}
    </TableCell>
    <TableCell className="font-medium">
      {invoice.amount !== undefined
        ? invoice.amount.toFixed(2)
        : "0.00"}
    </TableCell>
    <TableCell className="p-1">
      <Select
        value={invoice.invoiceStatus}
        onValueChange={(value) => onStatusChange(invoice.id, value)}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Select Status" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <SelectItem key={status} value={status} className={color}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </TableCell>
    <TableCell className="p-1 space-x-2">
      <Button variant="outline" size="icon" onClick={() => onEdit(invoice)}>
        <Edit className="h-3 w-3" />
      </Button>
      <Button variant="destructive" size="icon" onClick={() => onDelete(invoice.id)}>
        <Trash2 className="h-3 w-3" />
      </Button>
    </TableCell>
  </TableRow>
);

const MessageDialog = ({
  open,
  title,
  message,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{message}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button onClick={onClose}>OK</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const DeleteConfirmationDialog = ({
  deleteId,
  isPending,
  onCancel,
  onConfirm,
}: {
  deleteId: number | null;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: (id: number) => void;
}) => {
  if (deleteId === null) return null;
  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this invoice?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => onConfirm(deleteId)} disabled={isPending}>
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
