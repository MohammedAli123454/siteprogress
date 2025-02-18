"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
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

interface MOCFormProps {
  onMOCUpdated?: () => void;
}

export default function MOCForm({ onMOCUpdated = () => {} }: MOCFormProps) {
  const [isPending, startTransition] = useTransition();
  interface ClientMOC extends Omit<MOC, 'contractValue'> {
    contractValue: string;
  }
  const [mocs, setMocs] = useState<ClientMOC[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { register, handleSubmit, reset, setValue } = useForm<MOCFormValues>({
    defaultValues: {
      mocNo: "",
      cwo: "",
      po: "",
      proposal: "",
      contractValue: "",
      description: "",
      shortDescription: "",
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
        // No need for numericData conversion here since server handles string→numeric
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

  const handleEdit = (moc: MOC) => {
    setEditId(moc.id);
    Object.entries(moc).forEach(([key, value]) => {
      if (key !== "id") {
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
        <div className="bg-white rounded-lg shadow-lg p-6 h-full flex flex-col">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            {editId ? "Edit MOC" : "Create New MOC"}
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>MOC Number *</Label>
                <Input {...register("mocNo")} required />
              </div>

              <div className="space-y-2">
                <Label>CWO *</Label>
                <Input {...register("cwo")} required />
              </div>

              <div className="space-y-2">
                <Label>Purchase Order (PO) *</Label>
                <Input {...register("po")} required />
              </div>

              <div className="space-y-2">
                <Label>Proposal *</Label>
                <Input {...register("proposal")} required />
              </div>

              <div className="space-y-2">
                <Label>Contract Value (SAR) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("contractValue")}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Short Description</Label>
                <Input
                  {...register("shortDescription")}
                  maxLength={255}
                />
              </div>

              <div className="space-y-2 col-span-full">
                <Label>Description</Label>
                <Input {...register("description")} />
              </div>
            </div>

            <div className="flex justify-between items-center mt-8">
              <Input
                placeholder="Search MOCs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
              
              <div className="flex gap-4">
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
                  {isPending ? "Processing..." : editId ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-8 flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MOC Number</TableHead>
                  <TableHead>CWO</TableHead>
                  <TableHead>PO</TableHead>
                  <TableHead>Contract Value</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  filteredMOCs.map((moc) => (
                    <TableRow key={moc.id}>
                      <TableCell>{moc.mocNo}</TableCell>
                      <TableCell>{moc.cwo}</TableCell>
                      <TableCell>{moc.po}</TableCell>
                      <TableCell>{parseFloat(moc.contractValue).toFixed(2)} SAR</TableCell>
                      <TableCell>
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
                <Button variant="outline" onClick={() => setDeleteId(null)}>
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