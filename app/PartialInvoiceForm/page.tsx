"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { addPartialInvoice } from "@/app/actions/invoiceActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "../configs/db";
import { mocs, partialInvoices } from "../configs/schema";
import { eq } from "drizzle-orm";

interface PartialInvoiceFormProps {
    onInvoiceAdded?: () => void;
}

interface MocOption {
    id: number;
    mocNo: string;
    cwo: string;
}

export default function PartialInvoiceForm({ 
    onInvoiceAdded = () => {} 
}: PartialInvoiceFormProps) {
    const [isPending, startTransition] = useTransition();
    const [mocOptions, setMocOptions] = useState<MocOption[]>([]);
    const [isLoadingMocs, setIsLoadingMocs] = useState(true);
    const [isGeneratingInvoiceNo, setIsGeneratingInvoiceNo] = useState(false);

    const [formData, setFormData] = useState({
        mocId: "",
        invoiceNo: "",
        invoiceDate: "",
        amount: "",
        vat: "",
        retention: "",
        invoiceStatus: "",
    });

    // Calculate derived values
    const calculateValues = useCallback((amount: string) => {
        const amountValue = parseFloat(amount) || 0;
        return {
            vat: (amountValue * 0.15).toFixed(2),
            retention: (amountValue * 0.10).toFixed(2)
        };
    }, []);

    // Handle amount changes
    const handleAmountChange = (value: string) => {
        const calculated = calculateValues(value);
        setFormData(prev => ({
            ...prev,
            amount: value,
            vat: calculated.vat,
            retention: calculated.retention
        }));
    };

    // Fetch MOCs on component mount
    useEffect(() => {
        const fetchMocs = async () => {
            try {
                const result = await db.select().from(mocs);
                setMocOptions(result.map(moc => ({
                    id: moc.id,
                    mocNo: moc.mocNo,
                    cwo: moc.cwo
                })));
            } catch (error) {
                console.error("Error fetching MOCs:", error);
            } finally {
                setIsLoadingMocs(false);
            }
        };
        fetchMocs();
    }, []);

    // Generate invoice number when MOC is selected
    useEffect(() => {
        const generateInvoiceNumber = async () => {
            if (!formData.mocId) return;
            
            setIsGeneratingInvoiceNo(true);
            try {
                const selectedMOC = mocOptions.find(moc => moc.id.toString() === formData.mocId);
                if (!selectedMOC) return;

                // Get existing invoices for this MOC
                const existingInvoices = await db.select()
                    .from(partialInvoices)
                    .where(eq(partialInvoices.mocId, parseInt(formData.mocId)));

                // Generate sequence number
                const nextSequence = existingInvoices.length + 1;
                const paddedSequence = nextSequence.toString().padStart(3, '0');
                const newInvoiceNo = `${selectedMOC.cwo}-C${paddedSequence}`;

                setFormData(prev => ({
                    ...prev,
                    invoiceNo: newInvoiceNo
                }));
            } catch (error) {
                console.error("Error generating invoice number:", error);
                alert("Error generating invoice number");
            } finally {
                setIsGeneratingInvoiceNo(false);
            }
        };

        generateInvoiceNumber();
    }, [formData.mocId, mocOptions]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = await addPartialInvoice({
                mocId: parseInt(formData.mocId),
                invoiceNo: formData.invoiceNo,
                invoiceDate: formData.invoiceDate,
                amount: parseFloat(formData.amount),
                vat: parseFloat(formData.vat),
                retention: parseFloat(formData.retention),
                invoiceStatus: formData.invoiceStatus,
            });
            
            if (res.success) {
                setFormData({
                    mocId: "",
                    invoiceNo: "",
                    invoiceDate: "",
                    amount: "",
                    vat: "",
                    retention: "",
                    invoiceStatus: "",
                });
                onInvoiceAdded();
            } else {
                alert("Error adding invoice: " + res.message);
            }
        });
    };

    if (isLoadingMocs) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-pulse text-gray-500">Loading MOC data...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
                <h3 className="text-2xl font-bold text-center text-gray-800 mb-8">
                    Add Partial Invoice
                </h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* MOC Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="mocId" className="text-sm font-medium text-gray-700">
                                MOC Number *
                            </Label>
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

                        {/* Invoice Number */}
                        <div className="space-y-2">
                            <Label htmlFor="invoiceNo" className="text-sm font-medium text-gray-700">
                                Invoice Number *
                            </Label>
                            <Input
                                id="invoiceNo"
                                type="text"
                                value={formData.invoiceNo}
                                readOnly
                                className="bg-gray-100"
                                placeholder={isGeneratingInvoiceNo ? "Generating..." : "Select MOC to generate"}
                            />
                        </div>

                        {/* Invoice Date */}
                        <div className="space-y-2">
                            <Label htmlFor="invoiceDate" className="text-sm font-medium text-gray-700">
                                Invoice Date *
                            </Label>
                            <Input
                                id="invoiceDate"
                                type="date"
                                value={formData.invoiceDate}
                                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                                required
                            />
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
                                Amount (SAR) *
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => handleAmountChange(e.target.value)}
                                required
                            />
                        </div>

                        {/* VAT */}
                        <div className="space-y-2">
                            <Label htmlFor="vat" className="text-sm font-medium text-gray-700">
                                VAT (SAR) *
                            </Label>
                            <Input
                                id="vat"
                                type="number"
                                step="0.01"
                                value={formData.vat}
                                disabled
                                className="bg-gray-100"
                            />
                        </div>

                        {/* Retention */}
                        <div className="space-y-2">
                            <Label htmlFor="retention" className="text-sm font-medium text-gray-700">
                                Retention (SAR) *
                            </Label>
                            <Input
                                id="retention"
                                type="number"
                                step="0.01"
                                value={formData.retention}
                                disabled
                                className="bg-gray-100"
                            />
                        </div>

                        {/* Invoice Status */}
                        <div className="space-y-2 col-span-full">
                            <Label htmlFor="invoiceStatus" className="text-sm font-medium text-gray-700">
                                Invoice Status *
                            </Label>
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

                    <div className="flex justify-end space-x-4 mt-8">
                        <Button
                            type="submit"
                            className="w-full md:w-auto"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Adding...
                                </>
                            ) : (
                                "Add Partial Invoice"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}