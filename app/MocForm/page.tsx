"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import DatePicker from "react-datepicker";
import Select from "react-select";
import { 
  addMOC, 
  updateMOC, 
  deleteMOC, 
  getMOCs, 
  type MOC, 
  type MOCFormValues 
} from "@/app/actions/mocActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import "react-datepicker/dist/react-datepicker.css";

interface MOCFormProps {
  onMOCUpdated?: () => void;
}

const categoryOptions = [
  { value: "MOC", label: "MOC" },
  { value: "Project", label: "Project" },
  { value: "Change Order", label: "Change Order" },
];

export default function MOCForm({ onMOCUpdated = () => {} }: MOCFormProps) {
  const [isPending, startTransition] = useTransition();
  interface ClientMOC extends Omit<MOC, 'contractValue' | 'issuedDate' | 'signedDate'> {
    contractValue: string;
    issuedDate: string;
    signedDate: string;
  }
  const [mocs, setMocs] = useState<ClientMOC[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { register, handleSubmit, reset, setValue, control } = useForm<MOCFormValues>({
    defaultValues: {
      mocNo: "",
      cwo: "",
      po: "",
      proposal: "",
      contractValue: "",
      description: "",
      shortDescription: "",
      type: "",
      category: "",
      issuedDate: "",
      signedDate: "",
    }
  });

  useEffect(() => {
    const loadMOCs = async () => {
      try {
        const data = await getMOCs();
        setMocs(data);
      } catch (error) {
        showDialog("Error", "Failed to load MOCs");
      } finally {
        setIsLoading(false);
      }
    };
    loadMOCs();
  }, []);

  const onSubmit = async (data: MOCFormValues) => {
    startTransition(async () => {
      try {
        if (editId) {
          await updateMOC(editId, data);
          showDialog("Success", "MOC updated successfully!");
        } else {
          await addMOC(data);
          showDialog("Success", "MOC created successfully!");
        }
        refreshMOCs();
        resetForm();
        onMOCUpdated();
      } catch (error) {
        showDialog("Error", "An error occurred. Please try again.");
      }
    });
  };

  const handleEdit = (moc: ClientMOC) => {
    setEditId(moc.id);
    Object.entries(moc).forEach(([key, value]) => {
      if (key === "issuedDate" || key === "signedDate") {
        setValue(key, value ? new Date(value).toISOString() : "");
      } else if (key !== "id") {
        setValue(key as keyof MOCFormValues, value?.toString() || "");
      }
    });
  };

  const handleDelete = async (id: number) => {
    startTransition(async () => {
      try {
        await deleteMOC(id);
        refreshMOCs();
        showDialog("Success", "MOC deleted successfully!");
      } catch (error) {
        showDialog("Error", "Failed to delete MOC");
      } finally {
        setDeleteId(null);
      }
    });
  };

  const refreshMOCs = async () => {
    const data = await getMOCs();
    setMocs(data);
  };

  const resetForm = () => {
    reset();
    setEditId(null);
  };

  const showDialog = (title: string, message: string) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogOpen(true);
  };

  const filteredMOCs = mocs.filter(moc =>
    moc.mocNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    moc.cwo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="flex-grow max-w-7xl mx-auto w-full px-4 py-4">
        <div className="bg-white rounded-lg shadow-lg p-2 h-full flex flex-col">
        {/* <h3 className="text-1xl font-bold text-gray-800 mb-4">
            {editId ? "Edit MOC" : "Create New MOC"}
          </h3> */}
  
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-[150px,1fr] items-center gap-4">
                  <Label>MOC Number</Label>
                  <Input {...register("mocNo")} required />
                </div>
                <div className="grid grid-cols-[150px,1fr] items-center gap-4">
                  <Label>Type</Label>
                  <select
                    {...register("type", { required: true })}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Type</option>
                    <option value="Turnaround">Turnaround</option>
                    <option value="Non-Turnaround">Non-Turnaround</option>
                  </select>
                </div>
              </div>
  
              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid grid-cols-[150px,1fr] items-center gap-4">
                  <Label>PO Number</Label>
                  <Input {...register("po")} required />
                </div>
                <div className="grid grid-cols-[150px,1fr] items-center gap-4">
                  <Label>CWO Number</Label>
                  <Input {...register("cwo")} required />
                </div>
              </div>
  
              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid grid-cols-[150px,1fr] items-center gap-4">
                  <Label>Category</Label>
                  <Controller
                    name="category"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={categoryOptions}
                        onChange={(selected) => field.onChange(selected?.value)}
                        value={categoryOptions.find(opt => opt.value === field.value)}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        placeholder="Select Category"
                      />
                    )}
                  />
                </div>
                <div className="grid grid-cols-[150px,1fr] items-center gap-4">
                  <Label>Short Description</Label>
                  <Input {...register("shortDescription")} maxLength={255} />
                </div>
              </div>
  
              {/* Row 4 - Full Description */}
              <div className="grid grid-cols-[150px,1fr] items-center gap-4">
                <Label>Full Description</Label>
                <Input {...register("description")} className="w-full" />
              </div>
  
              {/* Row 5 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid grid-cols-[150px,1fr] items-center gap-4">
                  <Label>Contract Value (SAR)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register("contractValue")}
                    required
                  />
                </div>
                <div className="grid grid-cols-[150px,1fr] items-center gap-4">
                  <Label>Proposal</Label>
                  <Input {...register("proposal")} required />
                </div>
              </div>
  
              {/* Row 6 - Issued Date, Signed Date & Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div className="grid grid-cols-[150px,1fr] items-center gap-4">
                  <Label>Issued Date</Label>
                  <Controller
                    name="issuedDate"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <DatePicker
                        selected={field.value ? new Date(field.value) : null}
                        onChange={(date) => field.onChange(date?.toISOString())}
                        dateFormat="yyyy-MM-dd"
                        placeholderText="Select date"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  />
                </div>
                <div className="grid grid-cols-[150px,1fr] items-center gap-4">
                  <Label>Signed Date</Label>
                  <Controller
                    name="signedDate"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <DatePicker
                        selected={field.value ? new Date(field.value) : null}
                        onChange={(date) => field.onChange(date?.toISOString())}
                        dateFormat="yyyy-MM-dd"
                        placeholderText="Select date"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  />
                </div>
                <div className="flex flex-col gap-4">
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
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Processing..." : editId ? "Update Selected MOC" : "Create New MOC"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
  
          <div className="mt-4 flex-1">
          <div className="relative h-full"> 
          <div className="absolute inset-0 overflow-auto">
            <Table className="border-collapse">
              <TableHeader className="sticky top-0 bg-gray-50 shadow-sm z-10">
                <TableRow className="h-8">
                  <TableHead>MOC Number</TableHead>
                  <TableHead>CWO</TableHead>
                  <TableHead>PO</TableHead>
                  <TableHead>Contract Value</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <TableRow key={i} className="h-8">
                        <TableCell className="py-1">
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell >
                        <TableCell className="py-1">
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                        <TableCell className="py-1">
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                        <TableCell className="py-1">
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                        <TableCell className="py-1">
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  filteredMOCs.map((moc) => (
                    <TableRow key={moc.id} className="h-8">
                      <TableCell className="py-1">{moc.mocNo}</TableCell>
                      <TableCell className="py-1">{moc.cwo}</TableCell>
                      <TableCell className="py-1">{moc.po}</TableCell>
                      <TableCell className="py-1">
                        {parseFloat(moc.contractValue).toFixed(2)} SAR
                      </TableCell>
                      <TableCell className="py-1">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(moc)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => setDeleteId(moc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
            </div>
          </div>
  
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{dialogTitle}</DialogTitle>
                <DialogDescription>{dialogMessage}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setDialogOpen(false)}>OK</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
  
          <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this MOC?
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
                  disabled={isPending}
                >
                  {isPending ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
  
  
}