"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Table2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { saveMoc } from "./data/client-api";
import { emptyMocValues } from "./domain/constants";
import type { MocPayload } from "./domain/types";
import { FieldShell } from "./components/form/FieldShell";

export default function AddNewProjectPage() {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [savedProject, setSavedProject] = useState<MocPayload | null>(null);

  const form = useForm({
    defaultValues: emptyMocValues,
    onSubmit: async ({ value }) => {
      const project = {
        moc: value.moc.trim(),
        mocName: value.mocName.trim(),
      };

      setIsSaving(true);
      setErrorMessage(undefined);

      try {
        await saveMoc(project);
        await queryClient.invalidateQueries({ queryKey: ["mocs"] });
        setSavedProject(project);
        form.reset(emptyMocValues);
      } catch (saveError) {
        const message = saveError instanceof Error ? saveError.message : "Project save failed.";
        setErrorMessage(message);
        throw saveError;
      } finally {
        setIsSaving(false);
      }
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 py-4 pl-[var(--page-left-offset,2.75rem)] pr-3">
      <div className="mx-auto max-w-2xl">
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h1 className="text-xl font-bold text-slate-950">Add New Project</h1>
            <p className="mt-1 text-sm text-slate-500">
              Create the project header before adding weld joint scope rows.
            </p>
          </div>

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

            {errorMessage ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {savedProject ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
                Saved project {savedProject.moc}.
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3 pt-1">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Project
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/AddJointsDetail">
                  <Table2 className="mr-2 h-4 w-4" />
                  Weld Joints Scope
                </Link>
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
