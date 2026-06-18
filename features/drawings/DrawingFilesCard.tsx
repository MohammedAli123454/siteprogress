"use client";

import { LoaderCircle, Search } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { ALL_MOCS } from "./constants";
import { DrawingFileCard, EmptyState } from "./components";
import type { DrawingFileGroup } from "./model";
import type { DeleteTarget, SanitizedDrawingFile } from "./types";

type DrawingFilesCardProps = {
  selectedProject: string;
  searchQuery: string;
  validFileCount: number;
  filteredFiles: SanitizedDrawingFile[];
  groupedFiles: DrawingFileGroup[];
  loadingFiles: boolean;
  openMocs: string[];
  onSearchChange: (value: string) => void;
  onOpenMocsChange: (value: string[]) => void;
  onDelete: (target: DeleteTarget) => void;
};

export function DrawingFilesCard({
  selectedProject,
  searchQuery,
  validFileCount,
  filteredFiles,
  groupedFiles,
  loadingFiles,
  openMocs,
  onSearchChange,
  onOpenMocsChange,
  onDelete,
}: DrawingFilesCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-xl">Files</CardTitle>
          <div className="relative w-full lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search drawings..."
              className="pl-9"
              disabled={loadingFiles || validFileCount === 0}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {loadingFiles ? (
          <div className="flex h-48 items-center justify-center">
            <LoaderCircle className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <EmptyState
            title="No drawings found"
            description={
              selectedProject === ALL_MOCS
                ? "Upload drawings with a valid MOC or adjust your search and category filters."
                : "No uploaded drawings match the selected MOC and filters."
            }
          />
        ) : (
          <Accordion type="multiple" value={openMocs} onValueChange={onOpenMocsChange} className="space-y-3">
            {groupedFiles.map((group) => (
              <AccordionItem key={group.mocName} value={group.mocName} className="overflow-hidden rounded-md border bg-white">
                <AccordionTrigger className="px-4 py-3 text-left hover:no-underline">
                  <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="truncate text-base font-semibold text-slate-900">{group.mocName}</span>
                    <div className="flex shrink-0 items-center gap-2 text-sm text-slate-500">
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                        {group.files.length} {group.files.length === 1 ? "file" : "files"}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="border-t bg-slate-50 p-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {group.files.map((file) => (
                      <DrawingFileCard key={file.url} file={file} onDelete={onDelete} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
