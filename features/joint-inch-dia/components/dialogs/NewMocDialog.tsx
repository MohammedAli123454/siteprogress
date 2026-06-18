"use client";

import { useForm } from "@tanstack/react-form";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { emptyMocValues } from "../../domain/constants";
import { FieldShell } from "../form/FieldShell";

type NewMocValues = typeof emptyMocValues;

type NewMocDialogProps = {
  open: boolean;
  isSaving: boolean;
  errorMessage?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: NewMocValues) => Promise<void>;
};

export function NewMocDialog({
  open,
  isSaving,
  errorMessage,
  onOpenChange,
  onSubmit,
}: NewMocDialogProps) {
  const form = useForm({
    defaultValues: emptyMocValues,
    onSubmit: async ({ value }) => {
      await onSubmit({
        moc: value.moc.trim(),
        mocName: value.mocName.trim(),
      });
      form.reset(emptyMocValues);
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      form.reset(emptyMocValues);
    }

    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New MOC / Project</DialogTitle>
          <DialogDescription>
            Create the project header first, then add pipe-size rows against it from the grid.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.Field
            name="moc"
            validators={{
              onChange: ({ value }) => (!value.trim() ? "MOC is required." : undefined),
            }}
          >
            {(field) => (
              <FieldShell label="MOC / Project No." error={field.state.meta.errors[0]}>
                <Input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value.toUpperCase())}
                  placeholder="148-PC-22-0002"
                />
              </FieldShell>
            )}
          </form.Field>

          <form.Field
            name="mocName"
            validators={{
              onChange: ({ value }) => (!value.trim() ? "Project name is required." : undefined),
            }}
          >
            {(field) => (
              <FieldShell label="Project / MOC Name" error={field.state.meta.errors[0]}>
                <Input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Project description"
                />
              </FieldShell>
            )}
          </form.Field>

          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save MOC
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
