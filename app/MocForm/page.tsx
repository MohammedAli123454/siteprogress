"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import DatePicker from "react-datepicker";
import Select from "react-select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ToastContainer, toast } from "react-toastify";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  addMOC, 
  updateMOC, 
  deleteMOC, 
  getMOCs, 
  type MOC
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
import { Skeleton } from "@/components/ui/skeleton";
import "react-datepicker/dist/react-datepicker.css";
import "react-toastify/dist/ReactToastify.css";

interface ClientMOC extends Omit<MOC, 'contractValue' | 'issuedDate' | 'signedDate'> {
  contractValue: string;
  issuedDate: string;
  signedDate: string;
}

const mocSchema = z.object({
  mocNo: z.string().min(1, "MOC Number is required"),
  cwo: z.string().min(1, "CWO Number is required"),
  po: z.string().min(1, "PO Number is required"),
  proposal: z.string().min(1, "Proposal is required"),
  contractValue: z.string().min(1, "Contract Value is required"),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  type: z.string().min(1, "Type is required"),
  category: z.string().min(1, "Category is required"),
  issuedDate: z.string().min(1, "Issued Date is required"),
  signedDate: z.string().min(1, "Signed Date is required"),
});

type MocFormSchema = z.infer<typeof mocSchema>;

const categoryOptions = [
  { value: "MOC", label: "MOC" },
  { value: "Project", label: "Project" },
  { value: "Change Order", label: "Change Order" },
];

interface MocTableProps {
  data: ClientMOC[];
  isLoading: boolean;
  onEdit: (moc: ClientMOC) => void;
  onDelete: (id: number) => void;
  searchQuery: string;
}

const MocTable = ({ data, isLoading, onEdit, onDelete, searchQuery }: MocTableProps) => {
  const filteredData = data
    .filter(moc =>
      moc.mocNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      moc.cwo.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.cwo.localeCompare(b.cwo));

  return (
    <Table className="border-collapse w-full">
      <TableHeader className="sticky top-0 bg-gray-50 shadow-sm z-10">
        <TableRow className="h-8">
          <TableHead>MOC Number</TableHead>
          <TableHead>Categoty</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Short Description</TableHead>
          <TableHead>CWO</TableHead>
          <TableHead>PO</TableHead>
          <TableHead>Contract Value</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <TableRow key={i} className="h-8">
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
          filteredData.map((moc) => (
            <TableRow key={moc.id} className="h-8">
              <TableCell className="py-1">{moc.mocNo}</TableCell>
              <TableCell className="py-1">{moc.category}</TableCell>
              <TableCell className="py-1">{moc.type}</TableCell>
              <TableCell className="py-1">{moc.shortDescription}</TableCell>
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
                    onClick={() => onEdit(moc)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => onDelete(moc.id)}
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
  );
};

export default function MOCForm() {
  const queryClient = useQueryClient();
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue, 
    control,
    formState: { errors }
  } = useForm<MocFormSchema>({
    resolver: zodResolver(mocSchema),
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

  const { data: mocs = [], isLoading } = useQuery<ClientMOC[]>({
    queryKey: ['mocs'],
    queryFn: () => getMOCs(),
  });

  const addMutation = useMutation({
    mutationFn: addMOC,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mocs'] });
      toast.success("MOC created successfully");
      resetForm();
    },
    onError: () => toast.error("Failed to create MOC"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; values: Partial<MocFormSchema> }) => 
      updateMOC(data.id, data.values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mocs'] });
      toast.success("MOC updated successfully");
      resetForm();
    },
    onError: () => toast.error("Failed to update MOC"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMOC,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mocs'] });
      toast.success("MOC deleted successfully");
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete MOC"),
  });

  const handleEdit = (moc: ClientMOC) => {
    setEditId(moc.id);
    Object.entries(moc).forEach(([key, value]) => {
      if (key === "issuedDate" || key === "signedDate") {
        setValue(key as any, value ? new Date(value).toISOString() : "");
      } else {
        setValue(key as any, value);
      }
    });
  };

  const resetForm = () => {
    reset();
    setEditId(null);
  };

  const onSubmit = (data: MocFormSchema) => {
    if (editId) {
      updateMutation.mutate({ id: editId, values: data });
    } else {
      addMutation.mutate(data);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <ToastContainer position="top-center" autoClose={3000} />
      <div className="flex-grow max-w-7xl mx-auto w-full px-4 py-4">
        <div className="bg-white rounded-lg shadow-lg p-4 h-full flex flex-col">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-[150px,1fr] items-center gap-4">
                  <Label>MOC Number</Label>
                  <div>
                    <Input {...register("mocNo")} />
                    {errors.mocNo && (
                      <span className="text-red-500 text-sm">{errors.mocNo.message}</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-[150px,1fr] items-center gap-4">
                  <Label>Type</Label>
                  <div>
                    <select
                      {...register("type")}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Type</option>
                      <option value="Turnaround">Turnaround</option>
                      <option value="Non-TA">Non-TA</option>
                    </select>
                    {errors.type && (
                      <span className="text-red-500 text-sm">{errors.type.message}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid grid-cols-[150px,1fr] items-center gap-4">
                  <Label>PO Number</Label>
                  <div>
                    <Input {...register("po")} />
                    {errors.po && (
                      <span className="text-red-500 text-sm">{errors.po.message}</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-[150px,1fr] items-center gap-4">
                  <Label>CWO Number</Label>
                  <div>
                    <Input {...register("cwo")} />
                    {errors.cwo && (
                      <span className="text-red-500 text-sm">{errors.cwo.message}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid grid-cols-[150px,1fr] items-center gap-4">
                  <Label>Category</Label>
                  <div>
                    <Controller
                      name="category"
                      control={control}
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
                    {errors.category && (
                      <span className="text-red-500 text-sm">{errors.category.message}</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-[150px,1fr] items-center gap-4">
                  <Label>Short Description</Label>
                  <Input {...register("shortDescription")} maxLength={255} />
                </div>
              </div>

              <div className="grid grid-cols-[150px,1fr] items-center gap-4">
                <Label>Full Description</Label>
                <Input {...register("description")} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid grid-cols-[150px,1fr] items-center gap-4">
                  <Label>Contract Value (SAR)</Label>
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      {...register("contractValue")}
                    />
                    {errors.contractValue && (
                      <span className="text-red-500 text-sm">{errors.contractValue.message}</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-[150px,1fr] items-center gap-4">
                  <Label>Proposal</Label>
                  <div>
                    <Input {...register("proposal")} />
                    {errors.proposal && (
                      <span className="text-red-500 text-sm">{errors.proposal.message}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div className="grid grid-cols-[150px,1fr] items-center gap-4">
                  <Label>Issued Date</Label>
                  <div>
                    <Controller
                      name="issuedDate"
                      control={control}
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
                    {errors.issuedDate && (
                      <span className="text-red-500 text-sm">{errors.issuedDate.message}</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-[150px,1fr] items-center gap-4">
                  <Label>Signed Date</Label>
                  <div>
                    <Controller
                      name="signedDate"
                      control={control}
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
                    {errors.signedDate && (
                      <span className="text-red-500 text-sm">{errors.signedDate.message}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  {editId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      disabled={addMutation.isPending || updateMutation.isPending}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button 
                    type="submit" 
                    disabled={addMutation.isPending || updateMutation.isPending}
                  >
                    {addMutation.isPending || updateMutation.isPending 
                      ? "Processing..." 
                      : editId ? "Update MOC" : "Create MOC"}
                  </Button>
                </div>
              </div>
            </div>
          </form>

          <div className="mt-4">
            <Input
              placeholder="Search by MOC Number or CWO"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="mt-4 flex-1 overflow-auto" style={{ maxHeight: "400px" }}>
            <MocTable
              data={mocs}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={setDeleteId}
              searchQuery={searchQuery}
            />
          </div>

          <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this MOC?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteId(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}