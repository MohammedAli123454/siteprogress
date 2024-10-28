"use client";

import React, { useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveInvoice } from "@/app/actions/uploadFile"; 
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ColDef, CellValueChangedEvent,ICellRendererParams } from "ag-grid-community"; // Import necessary types


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

    const queryClient = useQueryClient();

    const saveInvoiceMutation = useMutation({
        mutationFn: saveInvoice,
        onSuccess: () => {
            // Invalidate queries with a query key
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
        },
    });
    

    const calculateTotals = () => {
        const qty = lineItems.reduce((acc, item) => acc + item.qty, 0);
        const total = lineItems.reduce((acc, item) => acc + item.totalPrice, 0);
        setTotalQty(qty);
        setGrandTotal(total);
    };

    const addRow = () => {
        setLineItems([
            ...lineItems,
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
            updatedLineItems[event.rowIndex] = event.data; // Safely access the index
            updatedLineItems[event.rowIndex].totalPrice = event.data.qty * event.data.unitPrice; // Calculate total price
            setLineItems(updatedLineItems);
            calculateTotals();
        }
    };
    

    const handleSave = () => {
        saveInvoiceMutation.mutate({
            header: { ...header, totalQty, grandTotal },
            lineItems,
        });
    };

    const columnDefs: ColDef<LineItem>[] = [
        { field: "itemCode", headerName: "Item Code", editable: true },
        { field: "description", headerName: "Description", editable: true },
        { field: "qty", headerName: "Quantity", editable: true },
        { field: "unit", headerName: "Unit", editable: true },
        { field: "unitPrice", headerName: "Unit Price", editable: true },
        {
            field: "totalPrice",
            headerName: "Total Price",
            valueGetter: (params) => {
                if (params.data) {
                    return params.data.qty * params.data.unitPrice;
                }
                return 0; // Or handle this case as needed
            },
        },
        {
            headerName: "Actions",
            cellRenderer: (params: ICellRendererParams) => {
                const rowIndex = params.node.rowIndex; // Get rowIndex
                return (
                    <button
                        onClick={() => {
                            if (rowIndex !== null) {
                                deleteRow(rowIndex); // Call deleteRow only if rowIndex is not null
                            }
                        }}
                    >
                        Delete
                    </button>
                );
            },
        },
    ];
    return (
        <div>
            <h2>Create Invoice</h2>
            <form>
                <label>Invoice Number</label>
                <input type="text" value={header.invoiceNumber} onChange={(e) => setHeader({ ...header, invoiceNumber: e.target.value })} />

                <label>Date</label>
                <input type="date" value={header.date} onChange={(e) => setHeader({ ...header, date: e.target.value })} />

                <label>Customer Name</label>
                <input type="text" value={header.customerName} onChange={(e) => setHeader({ ...header, customerName: e.target.value })} />

                <label>Customer Address</label>
                <input type="text" value={header.customerAddress} onChange={(e) => setHeader({ ...header, customerAddress: e.target.value })} />
            </form>

            <button onClick={addRow}>Add Item</button>
            <div className="ag-theme-alpine" style={{ height: 400, width: "100%" }}>
                <AgGridReact<LineItem>
                    rowData={lineItems}
                    columnDefs={columnDefs}
                    onCellValueChanged={onCellValueChanged}
                    domLayout="autoHeight"
                />
            </div>
            
            <div>
                <p>Total Quantity: {totalQty}</p>
                <p>Grand Total: {grandTotal}</p>
            </div>
            
            <button onClick={handleSave}>Save Invoice</button>
        </div>
    );
};

export default InvoiceComponent;
