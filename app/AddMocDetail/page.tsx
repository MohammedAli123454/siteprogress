"use client";

import { useForm, Controller, FormProvider, SubmitHandler } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogTrigger, DialogContent, DialogFooter, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { saveMocDetail } from "@/app/actions/saveMocDetail";
import { LoaderCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";



import { CalendarIcon } from "lucide-react"

const disciplines = ["Civil", "Scaffolding", "Piping", "Hydro test", "E&I", "Insulation", "Fire Proofing", "Structural Platform", "Pipe Rack"];
const steps = [
    { label: 'Personal Information' },
    { label: 'Address Information' },
    { label: 'Contact Information' },
    { label: 'Account Setup' },
    { label: 'Review & Save' },
];
type FormData = {
    type: string;
    mocNumber: string;
    smallDescription: string;
    mocName: string;
    awardedDate: Date;
    startDate: Date;
    mccDate: Date;
    value: number;
    scope: string[];
    pqrStatus: string;
    wqtStatus: string;
    wpsStatus: string;
};

export default function AddMocRecordForm() {
    const methods = useForm<FormData>();
    const { register, handleSubmit, control, reset, getValues } = methods;
    const [selectedScope, setSelectedScope] = useState<string[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMessage, setDialogMessage] = useState("");
    const [step, setStep] = useState(1); // Step tracker
    const [formDataForReview, setFormDataForReview] = useState<FormData | null>(null);
    const queryClient = useQueryClient();



    // Use mutation with TanStack Query
    const { mutate } = useMutation({
        mutationFn: saveMocDetail,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["mocdetail"] });
            setSelectedScope([]);
            setIsLoading(false);
            openDialog("MOC record saved successfully");
            reset();
            setStep(1);
         
        },
        onError: () => {
            setIsLoading(false);
            openDialog("MOC record could not be saved. Something went wrong!!");
        },
    });

    const openDialog = (message: string) => {
        setDialogMessage(message);
        setDialogOpen(true);
    };

    const onSubmit: SubmitHandler<FormData> = (data) => {
        setIsLoading(true);

        // Don't convert dates to ISO strings; just pass them as Date objects
        const formData = {
            ...data,
            awardedDate: data.awardedDate, // Keep as Date
            startDate: data.startDate,     // Keep as Date
            mccDate: data.mccDate,         // Keep as Date
            scope: selectedScope,          // Keep selectedScope as an array of strings
        };

        mutate(formData); // Use mutate instead of calling saveMocDetail directly
    };

    const handleFeatureChange = (feature: string) => {
        setSelectedScope((prevScope) =>
            prevScope.includes(feature)
                ? prevScope.filter((item) => item !== feature)
                : [...prevScope, feature]
        );
    };

    const handleDialogClose = () => {
        setIsDialogOpen(false);
    };

    const handleNext = () => {
        if (step === 5) {
            // Capture form values when reaching "Review & Save" step
            const values = getValues();
            setFormDataForReview(values);
        }

        if (step < 5) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };
    const formValues = formDataForReview || getValues(); // Use captured data for review
    return (
        <Card className="w-[70%] mx-auto mt-6 p-6 bg-white shadow-lg rounded-lg">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Message</DialogTitle>
                    </DialogHeader>
                    <p>{dialogMessage}</p>
                    <DialogFooter>
                        <Button onClick={() => setDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Step Indicator */}
            <div className="flex items-center gap-12 mb-6">
                {steps.map((_, index) => (
                    <div key={index} className="relative flex items-center">
                        {/* Circle */}
                        <div
                            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ease-in-out transform hover:scale-110 ${index + 1 <= step
                                ? 'bg-blue-500 border-blue-500 text-white shadow-lg'
                                : 'border-gray-300 text-gray-500 hover:border-blue-300 hover:text-blue-500'
                                }`}
                        >
                            {index + 1}
                        </div>

                        {/* Connecting line between circles */}
                        {index < steps.length - 1 && (
                            <div className="absolute top-1/2 left-full w-12">
                                <div
                                    className={`h-0.5 ${index + 1 < step ? 'bg-blue-500' : 'bg-gray-300'} rounded-full transition-all duration-300 ease-in-out`}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <CardContent>
                <FormProvider {...methods}>
                    <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
                        {step === 1 && (
                            <div className="grid grid-cols-1 space-y-8">
                                <div className="grid grid-cols-5 gap-4 items-center">
                                    <label className="col-span-1 text-md font-medium text-gray-600 mb-2">Type</label>
                                    <div className="col-span-4">
                                        <Controller
                                            name="type"
                                            control={control}
                                            render={({ field }) => (
                                                <Select onValueChange={(value) => field.onChange(value)}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select Type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="MOC">MOC</SelectItem>
                                                        <SelectItem value="Project">Project</SelectItem>
                                                        <SelectItem value="Package">Package</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-5 gap-4 items-center">
                                    <label className="col-span-1 text-md font-medium text-gray-600 mb-2">MOC Number</label>
                                    <div className="col-span-4">
                                        <Input type="text" {...register('mocNumber')} placeholder="Enter MOC Number" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-5 gap-4 items-center">
                                    <label className="col-span-1 text-md font-medium text-gray-600 mb-2">Value</label>
                                    <div className="col-span-4">
                                        <Input type="number" step="0.01" {...register('value')} placeholder="Enter MOC PO Value" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-5 gap-4 items-center">
                                    <label className="col-span-1 text-md font-medium text-gray-600 mb-2">Small Description</label>
                                    <div className="col-span-4">
                                        <Input type="text" {...register('smallDescription', { required: "Small Description is required" })} placeholder="Enter Small Description" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-5 gap-4 items-center">
                                    <label className="col-span-1 text-md font-medium text-gray-600 mb-2">Full Description</label>
                                    <div className="col-span-4">
                                        <Controller
                                            name="mocName"
                                            control={control}
                                            render={({ field }) => (
                                                <Textarea {...field} placeholder="Enter Full Description" className="w-full" required />
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="grid grid-cols-1 space-y-8">

                                {/* Awarded Date Field */}
                                <div className="grid grid-cols-5 gap-4 items-center">
                                    <label className="col-span-1 text-md font-medium text-gray-600 mb-2">Awarded Date</label>
                                    <div className="col-span-2">
                                        <Controller
                                            name="awardedDate"
                                            control={control}
                                            render={({ field }) => (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant={"outline"}
                                                            className="w-full pl-3 text-left font-normal"
                                                        >
                                                            {field.value ? new Date(field.value).toLocaleDateString() : "Pick a MOC Awarded date"}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value ? new Date(field.value) : undefined}
                                                            onSelect={(date) => field.onChange(date)}
                                                            className="rounded-md border"
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        />
                                    </div>
                                </div>
                                {/* Start Date Field */}
                                <div className="grid grid-cols-5 gap-4 items-center">
                                    <label className="col-span-1 text-md font-medium text-gray-600 mb-2">Start Date</label>
                                    <div className="col-span-2">
                                        <Controller
                                            name="startDate"
                                            control={control}
                                            render={({ field }) => (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant={"outline"}
                                                            className="w-full pl-3 text-left font-normal"
                                                        >
                                                            {field.value ? new Date(field.value).toLocaleDateString() : "Pick a MOC Start date"}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value ? new Date(field.value) : undefined}
                                                            onSelect={(date) => field.onChange(date)}
                                                            className="rounded-md border"
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        />
                                    </div>
                                </div>
                                {/* MCC Date Field */}
                                <div className="grid grid-cols-5 gap-4 items-center">
                                    <label className="col-span-1 text-md font-medium text-gray-600 mb-2">MCC Date</label>
                                    <div className="col-span-2">
                                        <Controller
                                            name="mccDate"
                                            control={control}
                                            render={({ field }) => (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant={"outline"}
                                                            className="w-full pl-3 text-left font-normal"
                                                        >
                                                            {field.value ? new Date(field.value).toLocaleDateString() : "Pick a Mechanical Completion date"}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value ? new Date(field.value) : undefined}
                                                            onSelect={(date) => field.onChange(date)}
                                                            className="rounded-md border"
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        />
                                    </div>
                                </div>

                            </div>
                        )}
                        {step === 3 && (
                            <div className="grid grid-cols-1 space-y-8">
                                <div className="grid grid-cols-5 gap-4 items-center">
                                    <label className="col-span-1 text-md font-medium text-gray-600 mb-2">Enter PQR Status</label>
                                    <div className="col-span-2">
                                        <Controller
                                            name="pqrStatus"
                                            control={control}
                                            render={({ field }) => (
                                                <Select onValueChange={(value) => field.onChange(value)}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Procedure Qualification Record Status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Not started">Not started</SelectItem>
                                                        <SelectItem value="Ongoing">Ongoing</SelectItem>
                                                        <SelectItem value="Under approval">Under approval</SelectItem>
                                                        <SelectItem value="Approved">Approved</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                </div>
                                {/* WQT Status */}
                                <div className="grid grid-cols-5 gap-4 items-center">
                                    <label className="col-span-1 text-md font-medium text-gray-600 mb-2">Enter WQT Status</label>
                                    <div className="col-span-2">
                                        <Controller
                                            name="wqtStatus"
                                            control={control}
                                            render={({ field }) => (
                                                <Select onValueChange={(value) => field.onChange(value)}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Welder Qualification Test Status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Not started">Not started</SelectItem>
                                                        <SelectItem value="Ongoing">Ongoing</SelectItem>
                                                        <SelectItem value="Under approval">Under approval</SelectItem>
                                                        <SelectItem value="Approved">Approved</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* WQS Status */}
                                <div className="grid grid-cols-5 gap-4 items-center">
                                    <label className="col-span-1 text-md font-medium text-gray-600 mb-2">Enter WPS Status</label>
                                    <div className="col-span-2">
                                        <Controller
                                            name="wpsStatus"
                                            control={control}
                                            render={({ field }) => (
                                                <Select onValueChange={(value) => field.onChange(value)}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Welding Procedure Specification Status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Not started">Not started</SelectItem>
                                                        <SelectItem value="Ongoing">Ongoing</SelectItem>
                                                        <SelectItem value="Under approval">Under approval</SelectItem>
                                                        <SelectItem value="Approved">Approved</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                </div>



                            </div>
                        )}

                        {step === 4 && (
                            <div>
                                <h3 className="text-lg font-medium mb-4">Select Scope</h3>
                                {/* Display the checkboxes directly */}
                                <div className="space-y-4 mt-6">
                                    <h3 className="text-lg font-medium">Select Scopes</h3>
                                    <div className="space-y-2 mt-4">
                                        {disciplines.map((item, index) => (
                                            <div key={index} className="flex items-center">
                                                <Checkbox
                                                    id={`discipline-${index}`}
                                                    checked={selectedScope.includes(item)}
                                                    onCheckedChange={() => handleFeatureChange(item)}
                                                />
                                                <label htmlFor={`discipline-${index}`} className="ml-2">{item}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 5 && (
                            <div>
                                <h3 className="text-lg font-medium mb-4">Review & Save</h3>

                                <div className="grid grid-cols-1 gap-4">
                                    {/* Card 1: Basic Information */}
                                    <div className="card w-full bg-white shadow-lg rounded-lg p-4">
                                        <div className="card-header text-xl font-semibold">Basic Information</div>
                                        <div className="card-body space-y-2">
                                            <p><strong>Type:</strong> {formValues.type}</p>
                                            <p><strong>MOC Number:</strong> {formValues.mocNumber}</p>
                                            <p><strong>Small Description:</strong> {formValues.smallDescription}</p>
                                            <p><strong>Full Description:</strong> {formValues.mocName}</p>
                                        </div>
                                    </div>

                                    {/* Card 2: Date Information */}
                                    <div className="card w-full bg-white shadow-lg rounded-lg p-4">
                                        <div className="card-header text-xl font-semibold">Date Information</div>
                                        <div className="card-body space-y-2">
                                            <p><strong>Awarded Date:</strong> {formValues.awardedDate ? new Date(formValues.awardedDate).toLocaleDateString() : "N/A"}</p>
                                            <p><strong>Start Date:</strong> {formValues.startDate ? new Date(formValues.startDate).toLocaleDateString() : "N/A"}</p>
                                            <p><strong>MCC Date:</strong> {formValues.mccDate ? new Date(formValues.mccDate).toLocaleDateString() : "N/A"}</p>
                                        </div>
                                    </div>

                                    {/* Card 3: Status and Scope Information */}
                                    <div className="card w-full bg-white shadow-lg rounded-lg p-4">
                                        <div className="card-header text-xl font-semibold">Status & Scope</div>
                                        <div className="card-body space-y-2">
                                            <p><strong>Value:</strong> {formValues.value}</p>
                                            <p><strong>PQR Status:</strong> {formValues.pqrStatus}</p>
                                            <p><strong>WQT Status:</strong> {formValues.wqtStatus}</p>
                                            <p><strong>WPS Status:</strong> {formValues.wpsStatus}</p>
                                            <p><strong>Scopes:</strong> {selectedScope.join(', ')}</p>

                                        </div>
                                    </div>
                                </div>
                                {/* <div className="absolute top-1/2 left-full w-12"> */}
                              
                                <div className="col-span-full mt-4 text-center">
                                    <Button type="submit" className="bg-green-500 text-white w-full rounded hover:bg-green-600">
                                        {isLoading ? <LoaderCircle className="animate-spin mr-2" /> : "Submit"}
                                    </Button>
                                </div>
                                

                            </div>
                        )}
                    </form>
                </FormProvider>
            </CardContent>
            <CardFooter className="flex justify-between">
                {/* Navigation buttons outside the form */}
                <Button variant="outline" onClick={handleBack} disabled={step === 1}>Back</Button>
                <Button variant="default" onClick={handleNext} disabled={step === 5}>
                    {step === 5 ? "Final Step" : "Next"}
                </Button>
            </CardFooter>
        </Card>
    );
}


