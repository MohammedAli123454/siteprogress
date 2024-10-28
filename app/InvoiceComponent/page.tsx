"use client";

import React, { useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveInvoice } from "@/app/actions/uploadFile"; 
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
    const [header, setHeader] = useState<Header>({
        invoiceNumber: "",
        date: new Date().toISOString().split("T")[0],
        customerName: "",
        customerAddress: ""
    });

    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [totalQty, setTotalQty] = useState(0);
    const [grandTotal, setGrandTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const queryClient = useQueryClient();

    const saveInvoiceMutation = useMutation({
        mutationFn: saveInvoice,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            setLineItems([]);
            setTotalQty(0);
            setGrandTotal(0);
            setIsLoading(false);
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
        // Add new row at the end of the lineItems array
        setLineItems(prevLineItems => [
            ...prevLineItems,
            { itemCode: "", description: "", qty: 0, unit: "", unitPrice: 0, totalPrice: 0 }
        ]);
    };

    const deleteRow = (index: number) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
        calculateTotals();
    };

    const onCellValueChanged = (event: CellValueChangedEvent<LineItem>) => {
        if (event.rowIndex !== null && event.rowIndex !== undefined) {
            const updatedLineItems = [...lineItems];
            updatedLineItems[event.rowIndex] = event.data; 
            updatedLineItems[event.rowIndex].totalPrice = event.data.qty * event.data.unitPrice; 
            setLineItems(updatedLineItems);
            calculateTotals();
        }
    };
    
    const handleSave = () => {
        setIsLoading(true);
        saveInvoiceMutation.mutate({
            header: { ...header, totalQty, grandTotal },
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
            valueGetter: (params) => params.data ? params.data.qty * params.data.unitPrice : 0,
            width: 150,
        },
        {
            headerName: "Actions",
            cellRenderer: (params: ICellRendererParams) => {
                const rowIndex = params.node.rowIndex; 
                return (
                    <button
                        onClick={() => {
                            if (rowIndex !== null) {
                                deleteRow(rowIndex);
                            }
                        }}
                    >
                        Delete
                    </button>
                );
            },
            width: 150,
        },
    ];

    return (
        <div>
            <Card className="w-[95%] mx-auto mb-4">
                <CardContent>
                    <form className="flex flex-wrap">
                        <div className="mb-4 w-1/4 p-2">
                            <label className="block">Invoice Number</label>
                            <input
                                type="text"
                                value={header.invoiceNumber}
                                onChange={(e) => setHeader({ ...header, invoiceNumber: e.target.value })}
                                className="border p-2 w-full"
                            />
                        </div>

                        <div className="mb-4 w-1/4 p-2">
                            <label className="block">Date</label>
                            <input
                                type="date"
                                value={header.date}
                                onChange={(e) => setHeader({ ...header, date: e.target.value })}
                                className="border p-2 w-full"
                            />
                        </div>

                        <div className="mb-4 w-1/4 p-2">
                            <label className="block">Customer Name</label>
                            <input
                                type="text"
                                value={header.customerName}
                                onChange={(e) => setHeader({ ...header, customerName: e.target.value })}
                                className="border p-2 w-full"
                            />
                        </div>

                        <div className="mb-4 w-1/4 p-2">
                            <label className="block">Customer Address</label>
                            <input
                                type="text"
                                value={header.customerAddress}
                                onChange={(e) => setHeader({ ...header, customerAddress: e.target.value })}
                                className="border p-2 w-full"
                            />
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="w-[95%] mx-auto mb-4">
                <CardContent>
                    <div className="ag-theme-alpine" style={{ height: 300, width: "100%" }}>
                        <AgGridReact<LineItem>
                            rowData={lineItems} // Ensure this directly binds to the state
                            columnDefs={columnDefs}
                            onCellValueChanged={onCellValueChanged}
                            domLayout="autoHeight"
                        />
                    </div>
                </CardContent>
            </Card>
            
            <Card className="p-4 w-[95%] mx-auto mb-4">
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <LoaderCircle className="animate-spin" color="blue" size={48} />
                        </div>
                    ) : (
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-bold">Total Quantity: <span className="text-lg">{totalQty}</span></p>
                                <p className="font-bold">Grand Total: <span className="text-lg">{grandTotal}</span></p>
                            </div>
                            <div className="flex space-x-2">
                                <Button onClick={handleSave}>Save Invoice</Button>
                                <Button onClick={addRow} variant="secondary">Add Item</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default InvoiceComponent;


