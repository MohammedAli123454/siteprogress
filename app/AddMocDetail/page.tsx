"use client";

import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const disciplines = ["Civil", "Scaffolding", "Piping", "Hydro test", "E&I","Insulation", "Fire Proffing", "Structural Platform","Pipe Rack"];

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
    const [isLoading, setIsLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMessage, setDialogMessage] = useState("");
    const queryClient = useQueryClient();

    // Use mutation with TanStack Query
    const { mutate } = useMutation( {
        mutationFn: saveMocDetail,
        onSuccess: () => {
            setSelectedScope([]);
            setIsLoading(false);
            openDialog("MOC record saved successfully");
            reset();
 
        },
        onError: (error) => {
            setIsLoading(false);
            openDialog("MOC record could not be saved something went wrong!!");
        },
    });

   
    const openDialog = (message: string) => {
        setDialogMessage(message);
        setDialogOpen(true);
      };


    const onSubmit: SubmitHandler<FormData> = (data) => {
        setIsLoading(true);
        const formData = { 
            ...data, 
            scope: selectedScope // Use selectedScope directly
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

    return (
        <Card className="w-[90%] mx-auto mt-6 p-6 bg-white shadow-lg rounded-lg">
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
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-semibold text-gray-700">Add MOC Record</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Type Field */}
                    <div>
                        <label className="block text-md font-medium text-gray-600 mb-2">Type</label>
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

                    {/* MOC Number Field */}
                    <div>
                        <label className="block text-md font-medium text-gray-600 mb-2">MOC Number</label>
                        <Input type="text" {...register('mocNumber')} placeholder="Enter MOC Number" />
                    </div>

                    {/* Small Description Field */}
                    <div>
                        <label className="block text-md font-medium text-gray-600 mb-2">Small Description</label>
                        <Input type="text" {...register('smallDescription', { required: "Project Name is required" })} placeholder="Enter Project Name" />
                    </div>

                    {/* Full Description Field */}
                    <div className="col-span-full">
                        <label className="block text-md font-medium text-gray-600 mb-2">Full Description</label>
                        <Controller
                            name="mocName"
                            control={control}
                            render={({ field }) => (
                                <Textarea {...field} placeholder="Enter Small Description" className="w-full" required />
                            )}
                        />
                    </div>

                    {/* Awarded Date Field */}
                    <div>
                        <label className="block text-md font-medium text-gray-600 mb-2">Awarded Date</label>
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

                    {/* Start Date Field */}
                    <div>
                        <label className="block text-md font-medium text-gray-600 mb-2">Start Date</label>
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

                    {/* MCC Date Field */}
                    <div>
                        <label className="block text-md font-medium text-gray-600 mb-2">MCC Date</label>
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

                    {/* Value Field */}
                    <div>
                        <label className="block text-md font-medium text-gray-600 mb-2">Value</label>
                        <Input type="number" step="0.01" {...register('value')} placeholder="Enter Value" />
                    </div>

                    {/* PQR Status */}
                    <div>
                        <label className="block text-md font-medium text-gray-600 mb-2">PQR Status</label>
                        <Controller
                            name="pqrStatus"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={(value) => field.onChange(value)}>
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

                     {/* WQT Status */}
                     <div>
                        <label className="block text-md font-medium text-gray-600 mb-2">WQT Status</label>
                        <Controller
                            name="wqtStatus"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={(value) => field.onChange(value)}>
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

                     {/* WQS Status */}
                     <div>
                        <label className="block text-md font-medium text-gray-600 mb-2">WPS Status</label>
                        <Controller
                            name="wpsStatus"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={(value) => field.onChange(value)}>
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


                    {/* Scope Selection */}
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

                    {/* Submit Button */}
                    <div className="col-span-full mt-4 text-center">
                        <Button type="submit" className="bg-green-500 text-white w-full rounded hover:bg-green-600">
                        {isLoading ? <LoaderCircle className="animate-spin mr-2" /> : "Submit"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
