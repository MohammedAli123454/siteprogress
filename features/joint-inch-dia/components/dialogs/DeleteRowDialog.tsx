"use client";

import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { JointRecord } from "../../domain/types";

type DeleteRowDialogProps = {
  target: JointRecord | null;
  isDeleting: boolean;
  errorMessage?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function DeleteRowDialog({
  target,
  isDeleting,
  errorMessage,
  onOpenChange,
  onConfirm,
}: DeleteRowDialogProps) {
  return (
    <Dialog open={Boolean(target)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete pipe-size row?</DialogTitle>
          <DialogDescription>
            This removes size {target?.sizeInches || "-"} / thickness {target?.thickness || 0} from{" "}
            {target?.moc || "this MOC"}.
          </DialogDescription>
        </DialogHeader>
        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={isDeleting || !target} onClick={onConfirm}>
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
