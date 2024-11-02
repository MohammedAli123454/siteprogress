"use client";

import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogTrigger, DialogContent, DialogFooter } from "@/components/ui/dialog";

import { Textarea } from "@/components/ui/textarea"

import { useState } from "react";

const disciplines = ["Civil", "Scaffolding", "Piping", "Hydro test", "E&I"];

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
    const { register, handleSubmit, control, reset } = useForm<FormData>();
    const [selectedScope, setSelectedScope] = useState<string[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const onSubmit: SubmitHandler<FormData> = (data) => {
        console.log({ ...data, scope: selectedScope });
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

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-3 gap-4 justify-center text-center">
            <div>
                <label className="block text-lg font-medium text-gray-600 mb-2">Type</label>
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

            <div>
                <label className="block text-lg font-medium text-gray-600 mb-2">MOC Number</label>
                <Input type="text" {...register('mocNumber')} placeholder="Enter MOC Number" />
            </div>

            <div>
                <label className="block text-lg font-medium text-gray-600 mb-2">Small Description</label>
                <Input type="text" {...register('smallDescription', { required: "Project Name is required" })} placeholder="Enter Project Name" />
            </div>

            <div>
    <label className="block text-lg font-medium text-gray-600 mb-2">Full Description</label>
    <Controller
        name="mocName"
        control={control}
        render={({ field }) => (
            <Textarea
                {...field}
                placeholder="Enter Small Description"
                className="w-full"
                required
            />
        )}
    />
</div>

            <div>
                <label className="block text-lg font-medium text-gray-600 mb-2">Awarded Date</label>
                <Controller
                    name="awardedDate"
                    control={control}
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full">
                                    {field.value ? new Date(field.value).toLocaleDateString() : "Select Date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0">
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

            <div>
                <label className="block text-lg font-medium text-gray-600 mb-2">Start Date</label>
                <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full">
                                    {field.value ? new Date(field.value).toLocaleDateString() : "Select Date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0">
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

            <div>
                <label className="block text-lg font-medium text-gray-600 mb-2">MCC Date</label>
                <Controller
                    name="mccDate"
                    control={control}
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full">
                                    {field.value ? new Date(field.value).toLocaleDateString() : "Select Date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0">
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

            <div>
                <label className="block text-lg font-medium text-gray-600 mb-2">Value</label>
                <Input type="number" step="0.01" {...register('value')} placeholder="Enter Value" />
            </div>
            <div>
                <label className="block text-lg font-medium text-gray-600 mb-2">PQR Status</label>
                <Controller
                    name="pqrStatus"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={(value: string) => field.onChange(value)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select PQR Status" />
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

            <div>
                <label className="block text-lg font-medium text-gray-600 mb-2">WQT Status</label>
                <Controller
                    name="wqtStatus"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={(value: string) => field.onChange(value)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select WQT Status" />
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

            <div>
                <label className="block text-lg font-medium text-gray-600 mb-2">WPS Status</label>
                <Controller
                    name="wpsStatus"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={(value: string) => field.onChange(value)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select WPS Status" />
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

            <div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="default" className="w-full bg-blue-500 text-white rounded hover:bg-blue-600">
                            Select MOC Scope
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
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
                        <DialogFooter>
                            <Button onClick={handleDialogClose} className="bg-blue-500 text-white hover:bg-blue-600">OK</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="col-span-full">
                <Button type="submit" variant="default" className="w-full bg-blue-500 text-white rounded hover:bg-blue-600">
                    Submit
                </Button>
            </div>
        </form>
    );
}



