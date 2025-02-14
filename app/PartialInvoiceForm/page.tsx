"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { addPartialInvoice, updatePartialInvoice, deletePartialInvoice } from "@/app/actions/invoiceActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "../configs/db";
import { mocs, partialInvoices } from "../configs/schema";
import { eq } from "drizzle-orm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface PartialInvoiceFormProps {
  onInvoiceAdded?: () => void;
}

interface MocOption {
  id: number;
  mocNo: string;
  cwo: string;
}

interface PartialInvoiceBase {
  mocId: number;
  invoiceNo: string;
  invoiceDate: string;
  amount: number;
  vat: number;
  retention: number;
  invoiceStatus: string;
}

interface PartialInvoice extends PartialInvoiceBase {
  id: number;
  mocNo: string;
}

export default function PartialInvoiceForm({ 
  onInvoiceAdded = () => {} 
}: PartialInvoiceFormProps) {
  const [isPending, startTransition] = useTransition();
  const [mocOptions, setMocOptions] = useState<MocOption[]>([]);
  const [invoices, setInvoices] = useState<PartialInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingInvoiceNo, setIsGeneratingInvoiceNo] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    mocId: "",
    invoiceNo: "",
    invoiceDate: new Date(),
    amount: "",
    vat: "",
    retention: "",
    invoiceStatus: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mocsResult, invoicesResult] = await Promise.all([
          db.select().from(mocs),
          db.select().from(partialInvoices)
        ]);

        setMocOptions(mocsResult.map(moc => ({
          id: moc.id,
          mocNo: moc.mocNo,
          cwo: moc.cwo
        })));

        const sortedInvoices = invoicesResult.map(invoice => {
          const moc = mocsResult.find(m => m.id === invoice.mocId);
          return {
            ...invoice,
            mocId: invoice.mocId,
            invoiceDate: invoice.invoiceDate, // Keep as string
            amount: parseFloat(invoice.amount),
            vat: parseFloat(invoice.vat),
            retention: parseFloat(invoice.retention),
            mocNo: moc?.mocNo || '',
          };
        }).sort((a, b) => a.mocNo.localeCompare(b.mocNo));

        setInvoices(sortedInvoices);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const calculateValues = useCallback((amount: string) => {
    const amountValue = parseFloat(amount) || 0;
    return {
      vat: (amountValue * 0.15).toFixed(2),
      retention: (amountValue * 0.10).toFixed(2)
    };
  }, []);

  const handleAmountChange = (value: string) => {
    const calculated = calculateValues(value);
    setFormData(prev => ({
      ...prev,
      amount: value,
      vat: calculated.vat,
      retention: calculated.retention
    }));
  };

  useEffect(() => {
    const generateInvoiceNumber = async () => {
      if (!formData.mocId) return;
      
      setIsGeneratingInvoiceNo(true);
      try {
        const selectedMOC = mocOptions.find(moc => moc.id.toString() === formData.mocId);
        if (!selectedMOC) return;

        const existingInvoices = await db.select()
          .from(partialInvoices)
          .where(eq(partialInvoices.mocId, parseInt(formData.mocId)));

        const nextSequence = existingInvoices.length + 1;
        const paddedSequence = nextSequence.toString().padStart(3, '0');
        const newInvoiceNo = `${selectedMOC.cwo}-C${paddedSequence}`;

        setFormData(prev => ({
          ...prev,
          invoiceNo: newInvoiceNo
        }));
      } catch (error) {
        console.error("Error generating invoice number:", error);
      } finally {
        setIsGeneratingInvoiceNo(false);
      }
    };

    generateInvoiceNumber();
  }, [formData.mocId, mocOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const invoiceData = {
          mocId: parseInt(formData.mocId),
          invoiceNo: formData.invoiceNo,
          invoiceDate: format(formData.invoiceDate, "yyyy-MM-dd"),
          amount: parseFloat(formData.amount),
          vat: parseFloat(formData.vat),
          retention: parseFloat(formData.retention),
          invoiceStatus: formData.invoiceStatus,
        };
  
        const res = editId 
          ? await updatePartialInvoice(editId, invoiceData)
          : await addPartialInvoice(invoiceData);

        if (res.success) {
          setDialogMessage(editId ? "Invoice updated successfully!" : "Invoice created successfully!");
          setOpenDialog(true);
          resetForm();
          refreshInvoices();
          onInvoiceAdded();
        } else {
          alert("Error: " + res.message);
        }
      } catch (error) {
        console.error("Error saving invoice:", error);
        alert("An error occurred while saving the invoice");
      }
    });
  };

  const handleEdit = (invoice: PartialInvoice) => {
    setEditId(invoice.id);
    setFormData({
      mocId: invoice.mocId.toString(),
      invoiceNo: invoice.invoiceNo,
      invoiceDate: new Date(invoice.invoiceDate),
      amount: invoice.amount.toString(),
      vat: invoice.vat.toString(),
      retention: invoice.retention.toString(),
      invoiceStatus: invoice.invoiceStatus,
    });
  };

  const handleDelete = async (id: number) => {
    startTransition(async () => {
      try {
        const res = await deletePartialInvoice(id);
        if (res.success) {
          setDialogMessage("Invoice deleted successfully!");
          setOpenDialog(true);
          refreshInvoices();
        } else {
          alert("Error: " + res.message);
        }
      } catch (error) {
        console.error("Error deleting invoice:", error);
      }
    });
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    startTransition(async () => {
      try {
        const existingInvoice = invoices.find(invoice => invoice.id === id);
        if (!existingInvoice) return;

        const updateData = {
          ...existingInvoice,
          invoiceDate: format(new Date(existingInvoice.invoiceDate), "yyyy-MM-dd"),
          invoiceStatus: newStatus
        };

        const res = await updatePartialInvoice(id, updateData);
        if (res.success) {
          refreshInvoices();
        } else {
          alert("Error updating status: " + res.message);
        }
      } catch (error) {
        console.error("Error updating status:", error);
      }
    });
  };

  const refreshInvoices = async () => {
    const [mocsResult, invoicesResult] = await Promise.all([
      db.select().from(mocs),
      db.select().from(partialInvoices)
    ]);

    const sortedInvoices = invoicesResult.map(invoice => {
      const moc = mocsResult.find(m => m.id === invoice.mocId);
      return {
        ...invoice,
        mocId: invoice.mocId,
        invoiceDate: invoice.invoiceDate,
        amount: parseFloat(invoice.amount),
        vat: parseFloat(invoice.vat),
        retention: parseFloat(invoice.retention),
        mocNo: moc?.mocNo || '',
      };
    }).sort((a, b) => a.mocNo.localeCompare(b.mocNo));

    setInvoices(sortedInvoices);
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({
      mocId: "",
      invoiceNo: "",
      invoiceDate: new Date(),
      amount: "",
      vat: "",
      retention: "",
      invoiceStatus: "",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">Loading data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="w-full max-w-6xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h3 className="text-6xl font-bold text-center text-gray-800 mb-8">
          {editId ? "Edit Partial Invoice" : "Add Partial Invoice"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-sm font-medium text-gray-700">
                MOC Number *
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.mocId}
                  onValueChange={(value) => setFormData({ ...formData, mocId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select MOC" />
                  </SelectTrigger>
                  <SelectContent>
                    {mocOptions.map((moc) => (
                      <SelectItem key={moc.id} value={moc.id.toString()}>
                        {moc.mocNo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-sm font-medium text-gray-700">
                Invoice Number *
              </Label>
              <div className="col-span-3">
                <Input
                  id="invoiceNo"
                  type="text"
                  value={formData.invoiceNo}
                  readOnly
                  className="bg-gray-100"
                  placeholder={isGeneratingInvoiceNo ? "Generating..." : "Select MOC to generate"}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-sm font-medium text-gray-700">
                Invoice Date *
              </Label>
              <div className="col-span-3">
                <DatePicker
                  selected={formData.invoiceDate}
                  onChange={(date: Date | null) => date && setFormData({ ...formData, invoiceDate: date })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  dateFormat="yyyy-MM-dd"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-sm font-medium text-gray-700">
                Amount (SAR) *
              </Label>
              <div className="col-span-3">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-sm font-medium text-gray-700">
                VAT (SAR) *
              </Label>
              <div className="col-span-3">
                <Input
                  id="vat"
                  type="number"
                  step="0.01"
                  value={formData.vat}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-sm font-medium text-gray-700">
                Retention (SAR) *
              </Label>
              <div className="col-span-3">
                <Input
                  id="retention"
                  type="number"
                  step="0.01"
                  value={formData.retention}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-sm font-medium text-gray-700">
                Status *
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.invoiceStatus}
                  onValueChange={(value) => setFormData({ ...formData, invoiceStatus: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PMT">PMT</SelectItem>
                    <SelectItem value="Supply Chain">Supply Chain</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8">
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
            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={isPending}
            >
              {isPending ? "Processing..." : editId ? "Update Invoice" : "Add Invoice"}
            </Button>
          </div>
        </form>

        <div className="mt-12">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>MOC Number</TableHead>
                <TableHead>Invoice No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{invoice.mocNo}</TableCell>
                  <TableCell>{invoice.invoiceNo}</TableCell>
                  <TableCell>
                    {new Date(invoice.invoiceDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{invoice.amount.toFixed(2)} SAR</TableCell>
                  <TableCell>
                    <Select
                      value={invoice.invoiceStatus}
                      onValueChange={(value) => handleStatusChange(invoice.id, value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PMT">PMT</SelectItem>
                        <SelectItem value="Supply Chain">Supply Chain</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(invoice)}
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(invoice.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Confirm Delete</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete this invoice? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setDeleteId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => deleteId && handleDelete(deleteId)}
                            >
                              Delete
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Success</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>{dialogMessage}</p>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpenDialog(false)}>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}