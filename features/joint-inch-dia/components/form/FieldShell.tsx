"use client";

import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";

export function FieldShell({
  label,
  error,
  children,
}: {
  label: string;
  error: unknown;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      {children}
      {error ? <p className="text-xs font-medium text-red-600">{String(error)}</p> : null}
    </div>
  );
}
