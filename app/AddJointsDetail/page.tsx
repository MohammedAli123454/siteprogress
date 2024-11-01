"use client";

import React, { useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { saveJointsDetail } from "@/app/actions/saveJointDetail";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import {
    ColDef,
    CellValueChangedEvent,
    ICellRendererParams,
} from "ag-grid-community";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import { getUniqueMOCNumbers, getProjectsByMoc } from "@/app/actions-Database/getData";
import { Input } from "@/components/ui/input";
import { LoaderCircle } from "lucide-react"; // Import LoaderCircle

type LineItem = {
    pipeSize: number;
    thk: string;
    type: string;
    shopJoint: number;
    fieldJoint: number;
    totalJoint: number;
    shopInchDia: number;
    fieldInchDia: number;
    totalInchDia: number;
};

type Header = {
    moc: string;
    mocName: string;
    mocStartDate: string;
    MCCDate: string;
};

const fetchUniqueMOCNumbers = async () => {
    const mocs = await getUniqueMOCNumbers();
    return mocs.map(moc => moc.moc_no);
};

const AddJointsDetail = () => {
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset, control, setValue } = useForm<Header>({
        defaultValues: {
            mocStartDate: '',
            MCCDate: '',
        },
    });

    const [lineItems, setLineItems] = useState<LineItem[]>([
        { pipeSize: 0, thk: "", type: "", shopJoint: 0, fieldJoint: 0, totalJoint: 0, shopInchDia: 0, fieldInchDia: 0, totalInchDia: 0 }
    ]);

    const [totals, setTotals] = useState({
        totalShopJoints: 0,
        totalFieldJoints: 0,
        totalJoints: 0,
        totalShopInchDia: 0,
        totalFieldInchDia: 0,
        totalInchDia: 0,
    });

    const [projectName, setProjectName] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    const { data: mocNumbers, isLoading: loadingMocs } = useQuery({
        queryKey: ["uniqueMOCNumbers"],
        queryFn: fetchUniqueMOCNumbers,
        staleTime: 5 * 60 * 1000,
    });

    const handleMOCChange = async (selectedMOC: string) => {
        const project = await getProjectsByMoc(selectedMOC);
        setValue("mocName", project || "No project found");
    };

    const saveInvoiceMutation = useMutation({
        mutationFn: saveJointsDetail,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["jointdetail"] });
            reset();
            setLineItems([{ pipeSize: 0, thk: "", type: "", shopJoint: 0, fieldJoint: 0, totalJoint: 0, shopInchDia: 0, fieldInchDia: 0, totalInchDia: 0 }]);
            setIsLoading(false);
            setShowSuccessDialog(true);
            setTotals({
                totalShopJoints: 0,
                totalFieldJoints: 0,
                totalJoints: 0,
                totalShopInchDia: 0,
                totalFieldInchDia: 0,
                totalInchDia: 0,
            });
        },
        onError: () => {
            setIsLoading(false);
        },
    });

    const calculateTotals = () => {
        const newTotals = lineItems.reduce((acc, item) => {
            acc.totalShopJoints += item.shopJoint;
            acc.totalFieldJoints += item.fieldJoint;
            acc.totalJoints += item.totalJoint;
            acc.totalShopInchDia += item.shopInchDia;
            acc.totalFieldInchDia += item.fieldInchDia;
            acc.totalInchDia += item.totalInchDia;
            return acc;
        }, {
            totalShopJoints: 0,
            totalFieldJoints: 0,
            totalJoints: 0,
            totalShopInchDia: 0,
            totalFieldInchDia: 0,
            totalInchDia: 0,
        });

        setTotals(newTotals);
    };

    const addRow = () => {
        setLineItems(prev => [
            ...prev,
            { pipeSize: 0, thk: "", type: "", shopJoint: 0, fieldJoint: 0, totalJoint: 0, shopInchDia: 0, fieldInchDia: 0, totalInchDia: 0 }
        ]);
        calculateTotals();
    };

    const deleteRow = (index: number) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
        calculateTotals();
    };

    const onCellValueChanged = (event: CellValueChangedEvent<LineItem>) => {
        if (event.rowIndex !== null) {
            const updatedLineItems = [...lineItems];
            const row = event.data;
            updatedLineItems[event.rowIndex] = {
                ...row,
                totalJoint: row.shopJoint + row.fieldJoint,
                shopInchDia: row.pipeSize * row.shopJoint,
                fieldInchDia: row.pipeSize * row.fieldJoint,
                totalInchDia: (row.pipeSize * row.shopJoint) + (row.pipeSize * row.fieldJoint),
            };
            setLineItems(updatedLineItems);
            calculateTotals();
        }
    };

    const handleSave: SubmitHandler<Header> = (data) => {
        setIsLoading(true);
        saveInvoiceMutation.mutate({
            header: {
                moc: data.moc,
                mocName: data.mocName,
                mocStartDate: data.mocStartDate,
                MCCDate: data.MCCDate,
                ...totals,
            },
            lineItems,
        });
    };

    const columnDefs: ColDef<LineItem>[] = [
        { field: "pipeSize", headerName: "Pipe Size", editable: true, width: 130 },
        { field: "thk", headerName: "Thickness", editable: true, width: 130 },
        { field: "type", headerName: "Type", editable: true, width: 130 },
        { field: "shopJoint", headerName: "Shop Joints", editable: true, width: 130 },
        { field: "fieldJoint", headerName: "Field Joints", editable: true, width: 130 },
        {
            field: "totalJoint",
            headerName: "Total Joints",
            valueGetter: params => params.data ? params.data.shopJoint + params.data.fieldJoint : 0,
            width: 130,
        },
        {
            field: "shopInchDia",
            headerName: "Shop Inch Dia",
            valueGetter: params => params.data ? params.data.pipeSize * params.data.shopJoint : 0,
            width: 130,
        },
        {
            field: "fieldInchDia",
            headerName: "Field Inch Dia",
            valueGetter: params => params.data ? params.data.pipeSize * params.data.fieldJoint : 0,
            width: 130,
        },
        {
            field: "totalInchDia",
            headerName: "Total Inch Dia",
            valueGetter: params => params.data ? params.data.shopInchDia + params.data.fieldInchDia : 0,
            width: 130,
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
            <Card className="w-[98%] mx-auto mb-4 flex-1 shadow-lg">
                <CardContent>
                    <form onSubmit={handleSubmit(handleSave)} className="grid grid-cols-1 sm:grid-cols-5 justify-center text-center w-full gap-4">
                        <div>
                            <label className="block text-lg font-medium text-gray-600 mb-2">Select MOC</label>
                            <Controller
                                name="moc"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={(value) => { field.onChange(value); handleMOCChange(value); }} disabled={loadingMocs}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={loadingMocs ? "Loading..." : "Select MOC"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {mocNumbers?.map((mocNumber) => (
                                                <SelectItem key={mocNumber} value={mocNumber}>
                                                    {mocNumber}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <div>
                            <label className="block text-lg font-medium text-gray-600 mb-2">Project Name</label>
                            <Input
                                type="text"
                                {...register("mocName", { required: "Project Name is required" })}
                                placeholder="Enter Project Name"
                            />
                        </div>

                        <div>
                            <label className="block text-lg font-medium text-gray-600 mb-2">MOC Start Date</label>
                            <Controller
                                name="mocStartDate"
                                control={control}
                                render={({ field }) => {
                                    const selectedDate = field.value ? new Date(field.value) : undefined;
                                    return (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full">
                                                    {field.value ? new Date(field.value).toLocaleDateString() : "Select Date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={selectedDate}
                                                    onSelect={(date) => field.onChange(date?.toISOString())}
                                                    className="rounded-md border"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    );
                                }}
                            />
                        </div>

                        <div>
                            <label className="block text-lg font-medium text-gray-600 mb-2">MCC Date</label>
                            <Controller
                                name="MCCDate"
                                control={control}
                                render={({ field }) => {
                                    const selectedDate = field.value ? new Date(field.value) : undefined;
                                    return (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full">
                                                    {field.value ? new Date(field.value).toLocaleDateString() : "Select Date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={selectedDate}
                                                    onSelect={(date) => field.onChange(date?.toISOString())}
                                                    className="rounded-md border"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    );
                                }}
                            />
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="w-[98%] mx-auto mb-4 flex-1 shadow-lg">
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

            <Card className="w-[98%] mx-auto mb-4 flex-1 shadow-lg">
                <CardContent className="p-2">
                    <h2 className="text-lg font-semibold mb-2">Totals</h2>
                    <div className="grid grid-cols-3 mb-2">
                        <div>
                            Total Shop Joints: {totals.totalShopJoints} <br />
                            Total Field Joints: {totals.totalFieldJoints} <br />
                            Total Joints: {totals.totalJoints}
                        </div>
                        <div>
                            Total Shop Inch Dia: {totals.totalShopInchDia} <br />
                            Total Field Inch Dia: {totals.totalFieldInchDia} <br />
                            Total Inch Dia: {totals.totalInchDia}
                        </div>
                        <div className="flex justify-center items-center flex-col">
                            <div className="flex space-x-2">
                                <Button onClick={addRow}>Add Row</Button>
                                <Button onClick={handleSubmit(handleSave)}>Save</Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {isLoading && ( // Display the loader when isLoading is true
                <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
                    <LoaderCircle className="animate-spin text-blue-500" size={64} />
                </div>
            )}

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

export default AddJointsDetail;
