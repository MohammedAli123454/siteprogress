"use client";
import { FaTrash, FaSpinner } from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

type DeleteConfirmationDialogProps = {
  entryId: number;
  onDelete: (id: number) => void;
  isDeleting: boolean;
};

export const DeleteConfirmationDialog = ({
  entryId,
  onDelete,
  isDeleting,
}: DeleteConfirmationDialogProps) => (
  <Dialog>
    <DialogTrigger asChild>
      <button className="text-red-600 hover:text-red-800" title="Delete">
        <FaTrash />
      </button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Confirm Deletion</DialogTitle>
      </DialogHeader>
      <div className="py-4 text-gray-600">
        Are you sure you want to delete this entry?
      </div>
      <DialogFooter>
        <DialogClose className="px-4 py-2 border rounded-md">
          Cancel
        </DialogClose>
        <button
          onClick={() => onDelete(entryId)}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300"
          disabled={isDeleting}
        >
          {isDeleting && <FaSpinner className="animate-spin mr-2" />}
          Delete
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);