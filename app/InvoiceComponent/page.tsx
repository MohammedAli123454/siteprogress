"use client";

import React, { useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveInvoice } from "@/app/actions/uploadFile";
import { useForm, SubmitHandler } from "react-hook-form";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ColDef, CellValueChangedEvent, ICellRendererParams } from "ag-grid-community";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";

type LineItem = {
    itemCode: string;
    description: string;
    qty: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
};

type Header = {
    invoiceNumber: string;
    date: string;
    customerName: string;
    customerAddress: string;
};

const InvoiceComponent = () => {
    const queryClient = useQueryClient();

    const { register, handleSubmit, reset, formState: { errors } } = useForm<Header>({
        defaultValues: {
            invoiceNumber: "",
            date: new Date().toISOString().split("T")[0],
            customerName: "",
            customerAddress: ""
        },
    });

    const [lineItems, setLineItems] = useState<LineItem[]>([
        { itemCode: "", description: "", qty: 0, unit: "", unitPrice: 0, totalPrice: 0 }
    ]);
    const [totalQty, setTotalQty] = useState(0);
    const [grandTotal, setGrandTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    const saveInvoiceMutation = useMutation({
        mutationFn: saveInvoice,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            reset();
            setLineItems([{ itemCode: "", description: "", qty: 0, unit: "", unitPrice: 0, totalPrice: 0 }]);
            setTotalQty(0);
            setGrandTotal(0);
            setIsLoading(false);
            setShowSuccessDialog(true);
        },
        onError: () => {
            setIsLoading(false);
        },
    });

    const calculateTotals = () => {
        const qty = lineItems.reduce((acc, item) => acc + item.qty, 0);
        const total = lineItems.reduce((acc, item) => acc + item.totalPrice, 0);
        setTotalQty(qty);
        setGrandTotal(total);
    };

    const addRow = () => {
        setLineItems(prev => [
            ...prev,
            { itemCode: "", description: "", qty: 0, unit: "", unitPrice: 0, totalPrice: 0 }
        ]);
        calculateTotals();
    };

    const deleteRow = (index: number) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
        calculateTotals();
    };

    const onCellValueChanged = (event: CellValueChangedEvent<LineItem>) => {
        if (event.rowIndex !== null && event.rowIndex !== undefined) {
            const updatedLineItems = [...lineItems];
            updatedLineItems[event.rowIndex] = {
                ...event.data,
                totalPrice: event.data.qty * event.data.unitPrice
            };
            setLineItems(updatedLineItems);
            calculateTotals();
        }
    };

    const handleSave: SubmitHandler<Header> = (data) => {
        setIsLoading(true);
        saveInvoiceMutation.mutate({
            header: { ...data, totalQty, grandTotal },
            lineItems,
        });
    };

    const columnDefs: ColDef<LineItem>[] = [
        { field: "itemCode", headerName: "Item Code", editable: true, width: 150 },
        { field: "description", headerName: "Description", editable: true, width: 550 },
        { field: "qty", headerName: "Quantity", editable: true, width: 110 },
        { field: "unit", headerName: "Unit", editable: true, width: 110 },
        { field: "unitPrice", headerName: "Unit Price", editable: true, width: 110 },
        {
            field: "totalPrice",
            headerName: "Total Price",
            valueGetter: params => params.data ? params.data.qty * params.data.unitPrice : 0,
            width: 150,
        },
        {
            headerName: "Actions",
            cellRenderer: (params: ICellRendererParams) => (
                <button
                    onClick={() => params.node.rowIndex !== null && deleteRow(params.node.rowIndex)}
                    className="text-red-600 hover:underline"
                >
                    Delete
                </button>
            ),
            width: 150,
        },
    ];

    return (
        <div>
            <Card className="w-[98%] mx-auto mb-4 shadow-lg">
                <CardContent>
                    <form onSubmit={handleSubmit(handleSave)} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
                            <input
                                type="text"
                                {...register("invoiceNumber", { required: "Invoice number is required" })}
                                className="border rounded-md p-2 w-full"
                            />
                            {errors.invoiceNumber && <p className="text-red-500 text-sm">{errors.invoiceNumber.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date</label>
                            <input
                                type="date"
                                {...register("date", { required: "Date is required" })}
                                className="border rounded-md p-2 w-full"
                            />
                            {errors.date && <p className="text-red-500 text-sm">{errors.date.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                            <input
                                type="text"
                                {...register("customerName", { required: "Customer name is required" })}
                                className="border rounded-md p-2 w-full"
                            />
                            {errors.customerName && <p className="text-red-500 text-sm">{errors.customerName.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Customer Address</label>
                            <input
                                type="text"
                                {...register("customerAddress", { required: "Customer address is required" })}
                                className="border rounded-md p-2 w-full"
                            />
                            {errors.customerAddress && <p className="text-red-500 text-sm">{errors.customerAddress.message}</p>}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="w-[98%] mx-auto mb-4 shadow-lg">
                <CardContent>
                    <div className="ag-theme-alpine mt-4" style={{ height: 300, width: "100%" }}>
                        <AgGridReact<LineItem>
                            rowData={lineItems}
                            columnDefs={columnDefs}
                            onCellValueChanged={onCellValueChanged}
                            domLayout="autoHeight"
                        />
                    </div>
                </CardContent>
            </Card>
            
            <Card className="p-4 w-[98%] mx-auto mb-4 shadow-lg">
                <CardContent>
                    {isLoading ? (
                        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
                            <LoaderCircle className="animate-spin text-blue-500" size={64} />
                        </div>
                    ) : (
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold">Total Quantity: <span className="text-lg">{totalQty}</span></p>
                                <p className="font-semibold">Grand Total: <span className="text-lg">{grandTotal}</span></p>
                            </div>
                            <div className="flex space-x-2">
                                <Button type="submit" onClick={handleSubmit(handleSave)} disabled={isLoading}>Save Invoice</Button>
                                <Button onClick={addRow} variant="secondary">Add Item</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {showSuccessDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-1/3">
                        <h2 className="text-lg font-semibold mb-4">Invoice Saved</h2>
                        <p>Your invoice has been saved successfully.</p>
                        <div className="flex justify-end mt-4">
                            <Button onClick={() => setShowSuccessDialog(false)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceComponent;
