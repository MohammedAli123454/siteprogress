"use client";

import type { ChangeEvent } from "react";
import { UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { ALL_CATEGORIES, ALL_MOCS, DRAWING_CATEGORIES } from "./constants";

type UploadDrawingsCardProps = {
  selectedProject: string;
  selectedCategory: string;
  selectedFiles: File[];
  projectOptions: string[];
  loadingMocs: boolean;
  isUploading: boolean;
  uploadProgress: number;
  canUpload: boolean;
  onProjectChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveSelectedFile: (file: File) => void;
  onClearSelectedFiles: () => void;
  onUpload: () => void;
};

export function UploadDrawingsCard({
  selectedProject,
  selectedCategory,
  selectedFiles,
  projectOptions,
  loadingMocs,
  isUploading,
  uploadProgress,
  canUpload,
  onProjectChange,
  onCategoryChange,
  onFileChange,
  onRemoveSelectedFile,
  onClearSelectedFiles,
  onUpload,
}: UploadDrawingsCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-white p-4">
        <CardTitle className="text-xl">Upload Drawings</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Project</label>
              <Select value={selectedProject} onValueChange={onProjectChange} disabled={loadingMocs}>
                <SelectTrigger>
                  <SelectValue placeholder="Select MOC" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_MOCS}>All MOCs</SelectItem>
                  {projectOptions.map((projectName) => (
                    <SelectItem key={projectName} value={projectName}>
                      {projectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Drawing Category</label>
              <Select value={selectedCategory} onValueChange={onCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Optional filter / required for upload" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
                  {DRAWING_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="rounded-md border bg-slate-50 p-3">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-700">Selected files</div>
                <Button variant="ghost" size="sm" onClick={onClearSelectedFiles} disabled={isUploading}>
                  Clear
                </Button>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {selectedFiles.map((file) => (
                  <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-md border bg-white px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-800">{file.name}</div>
                      <div className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onRemoveSelectedFile(file)} disabled={isUploading}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isUploading && (
            <div className="rounded-md border bg-white p-3">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">Uploading drawings</span>
                <span className="text-slate-500">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between rounded-md border border-dashed border-blue-300 bg-blue-50 p-4">
          <input type="file" multiple className="hidden" id="drawing-file-input" onChange={onFileChange} />
          <label
            htmlFor="drawing-file-input"
            className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-md bg-white p-5 text-center transition hover:bg-blue-50"
          >
            <UploadCloud className="mb-3 h-10 w-10 text-blue-500" />
            <span className="text-base font-semibold text-slate-800">Choose drawing files</span>
            <span className="mt-1 text-sm text-slate-500">Select multiple files and upload them together.</span>
          </label>
          <Button className="mt-4 w-full bg-blue-500 hover:bg-blue-600" onClick={onUpload} disabled={!canUpload}>
            {isUploading ? "Uploading..." : "Upload Selected Files"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
