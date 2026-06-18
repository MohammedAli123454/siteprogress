"use client";

import { CheckCircle2, ExternalLink, FileText, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { DeleteTarget, SanitizedDrawingFile } from "./types";
import { formatFileSize } from "./utils";

export type StatusMessageValue = {
  type: "success" | "error";
  text: string;
};

export function StatusMessage({ message }: { message: StatusMessageValue }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md border px-4 py-3 text-sm ${
        message.type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
      {message.text}
    </div>
  );
}

export function DrawingFileCard({
  file,
  onDelete,
}: {
  file: SanitizedDrawingFile;
  onDelete: (target: DeleteTarget) => void;
}) {
  const fileSize = formatFileSize(file.fileSize);

  return (
    <div className="group relative rounded-md border bg-white p-3 shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute right-2 top-2 h-8 w-8 opacity-0 transition group-hover:opacity-100"
        onClick={() => onDelete({ url: file.url, fileName: file.fileName })}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <div className="flex gap-3 pr-8">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-500">
          <FileText className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="line-clamp-2 text-sm font-semibold text-slate-800 hover:text-blue-600"
          >
            {file.fileName}
          </a>
          <div className="mt-2 flex flex-wrap gap-2">
            {file.category && (
              <div className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                {file.category}
              </div>
            )}
            {fileSize && (
              <div className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                Size: {fileSize}
              </div>
            )}
          </div>
        </div>
      </div>
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
      >
        View drawing <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex h-48 flex-col items-center justify-center rounded-md border border-dashed bg-slate-50 text-center">
      <FileText className="mb-3 h-9 w-9 text-slate-300" />
      <div className="font-semibold text-slate-700">{title}</div>
      <div className="mt-1 text-sm text-slate-500">{description}</div>
    </div>
  );
}
