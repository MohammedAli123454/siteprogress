"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  LoaderCircle,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import { getAllDrawingFiles, getallAwardedMocs, getFilesByProjectName, getUniqueProjectNames } from "@/app/actions-Database/getData";
import { deleteFile, uploadFiles } from "@/app/actions/uploadFile";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type DrawingFile = {
  projectName: unknown;
  url: string;
  fileName: string;
  category: unknown;
  fileSize?: number | null;
};

type SanitizedDrawingFile = Omit<DrawingFile, "projectName" | "category"> & {
  projectName: string;
  category: string;
};

type DeleteTarget = {
  url: string;
  fileName: string;
} | null;

const CATEGORIES = ["P&I Drawings", "Isometric Drawings"];
const ALL_MOCS = "__all_mocs__";
const ALL_CATEGORIES = "__all_categories__";
const EMPTY_DRAWING_FILES: DrawingFile[] = [];
const INVALID_TEXT_VALUES = new Set(["", "[object object]", "undefined", "null"]);

function getCleanText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmedValue = value.trim();
  return INVALID_TEXT_VALUES.has(trimmedValue.toLowerCase()) ? "" : trimmedValue;
}

function formatFileSize(bytes: number | null | undefined) {
  if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes < 0) {
    return "";
  }

  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / 1024 ** unitIndex;
  const digits = size >= 10 || unitIndex === 0 ? 0 : 1;

  return `${size.toFixed(digits)} ${units[unitIndex]}`;
}

const fetchMocNames = async () => {
  const names = await getallAwardedMocs();
  return names.map((name: { mocName: string }) => getCleanText(name.mocName)).filter(Boolean);
};

const fetchUniqueProjectNames = async () => {
  const names = await getUniqueProjectNames();
  return names.map((name: { project_name: string }) => getCleanText(name.project_name)).filter(Boolean);
};

const fetchFiles = async (projectName?: string, category?: string) => {
  if (projectName) {
    return getFilesByProjectName(projectName, category) as Promise<DrawingFile[]>;
  }

  return getAllDrawingFiles(category) as Promise<DrawingFile[]>;
};

export default function FileUploader() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedProject, setSelectedProject] = useState(ALL_MOCS);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [openMocs, setOpenMocs] = useState<string[]>([]);

  const { data: mocNames = [], isLoading: loadingMocs } = useQuery({
    queryKey: ["mocNames"],
    queryFn: fetchMocNames,
    staleTime: 5 * 60 * 1000,
  });

  const { data: existingProjectNames = [] } = useQuery({
    queryKey: ["uniqueProjectNames"],
    queryFn: fetchUniqueProjectNames,
    staleTime: 5 * 60 * 1000,
  });

  const projectOptions = useMemo(
    () => Array.from(new Set([...mocNames, ...existingProjectNames])).sort((a, b) => a.localeCompare(b)),
    [mocNames, existingProjectNames]
  );

  const {
    data: files = EMPTY_DRAWING_FILES,
    isLoading: loadingFiles,
    refetch: refetchFiles,
  } = useQuery({
    queryKey: ["drawingFiles", selectedProject, selectedCategory],
    queryFn: () =>
      fetchFiles(
        selectedProject === ALL_MOCS ? undefined : selectedProject,
        selectedCategory === ALL_CATEGORIES ? undefined : selectedCategory
      ),
    staleTime: 60 * 1000,
  });

  const validFiles = useMemo<SanitizedDrawingFile[]>(() => {
    return files
      .map((file) => ({
        ...file,
        projectName: getCleanText(file.projectName),
        category: getCleanText(file.category),
      }))
      .filter((file) => file.projectName);
  }, [files]);

  const filteredFiles = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return validFiles;
    }

    return validFiles.filter((file) => {
      const searchableText = `${file.projectName} ${file.fileName} ${file.category}`.toLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }, [validFiles, searchQuery]);

  const groupedFiles = useMemo(() => {
    const groups = new Map<string, SanitizedDrawingFile[]>();

    filteredFiles.forEach((file) => {
      const mocName = file.projectName;
      groups.set(mocName, [...(groups.get(mocName) || []), file]);
    });

    return Array.from(groups.entries())
      .map(([mocName, mocFiles]) => ({
        mocName,
        files: mocFiles.sort((a, b) => a.category.localeCompare(b.category) || a.fileName.localeCompare(b.fileName)),
      }))
      .sort((a, b) => a.mocName.localeCompare(b.mocName));
  }, [filteredFiles]);

  const groupedMocKey = useMemo(() => groupedFiles.map((group) => group.mocName).join("|"), [groupedFiles]);

  useEffect(() => {
    const nextOpenMocs = groupedFiles.map((group) => group.mocName);

    setOpenMocs((currentOpenMocs) => {
      const isSame =
        currentOpenMocs.length === nextOpenMocs.length &&
        currentOpenMocs.every((mocName, index) => mocName === nextOpenMocs[index]);

      return isSame ? currentOpenMocs : nextOpenMocs;
    });
  }, [groupedMocKey, groupedFiles]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incomingFiles = Array.from(event.target.files || []);

    setSelectedFiles((currentFiles) => {
      const filesByKey = new Map(currentFiles.map((file) => [`${file.name}-${file.size}`, file]));
      incomingFiles.forEach((file) => filesByKey.set(`${file.name}-${file.size}`, file));
      return Array.from(filesByKey.values());
    });

    event.target.value = "";
  };

  const removeSelectedFile = (fileToRemove: File) => {
    setSelectedFiles((currentFiles) => currentFiles.filter((file) => file !== fileToRemove));
  };

  const handleUpload = async () => {
    setMessage(null);

    if (selectedProject === ALL_MOCS) {
      setMessage({ type: "error", text: "Select a project before uploading drawings." });
      return;
    }

    if (selectedCategory === ALL_CATEGORIES) {
      setMessage({ type: "error", text: "Select a drawing category before uploading drawings." });
      return;
    }

    if (selectedFiles.length === 0) {
      setMessage({ type: "error", text: "Choose at least one drawing file to upload." });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (const [index, file] of selectedFiles.entries()) {
        const formData = new FormData();
        formData.append("projectName", selectedProject);
        formData.append("category", selectedCategory);
        formData.append("files", file);

        await uploadFiles(formData);
        setUploadProgress(((index + 1) / selectedFiles.length) * 100);
      }

      setSelectedFiles([]);
      setMessage({ type: "success", text: "Drawings uploaded successfully." });
      await refetchFiles();
    } catch (error) {
      console.error("Drawing upload failed:", error);
      setMessage({ type: "error", text: "Upload failed. Please try again." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    setMessage(null);

    try {
      await deleteFile(deleteTarget.url);
      setMessage({ type: "success", text: `${deleteTarget.fileName} deleted successfully.` });
      setDeleteTarget(null);
      await refetchFiles();
    } catch (error) {
      console.error("Drawing delete failed:", error);
      setMessage({ type: "error", text: "Delete failed. Please try again." });
    } finally {
      setIsDeleting(false);
    }
  };

  const canUpload = Boolean(
    selectedProject !== ALL_MOCS && selectedCategory !== ALL_CATEGORIES && selectedFiles.length > 0 && !isUploading
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-normal text-slate-950">Drawings</h1>
            <p className="mt-1 text-sm text-slate-500">Upload, view, and manage project drawings in one place.</p>
          </div>
          <div className="rounded-md border bg-white px-4 py-2 text-sm text-slate-600">
            {filteredFiles.length} of {validFiles.length} files
          </div>
        </div>

        {message && (
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
        )}

        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-white p-4">
            <CardTitle className="text-xl">Upload Drawings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Project</label>
                  <Select value={selectedProject} onValueChange={setSelectedProject} disabled={loadingMocs}>
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
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional filter / required for upload" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
                      {CATEGORIES.map((category) => (
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
                    <Button variant="ghost" size="sm" onClick={() => setSelectedFiles([])} disabled={isUploading}>
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
                        <Button variant="ghost" size="icon" onClick={() => removeSelectedFile(file)} disabled={isUploading}>
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
              <input ref={fileInputRef} type="file" multiple className="hidden" id="drawing-file-input" onChange={handleFileChange} />
              <label
                htmlFor="drawing-file-input"
                className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-md bg-white p-5 text-center transition hover:bg-blue-50"
              >
                <UploadCloud className="mb-3 h-10 w-10 text-blue-500" />
                <span className="text-base font-semibold text-slate-800">Choose drawing files</span>
                <span className="mt-1 text-sm text-slate-500">Select multiple files and upload them together.</span>
              </label>
              <Button className="mt-4 w-full bg-blue-500 hover:bg-blue-600" onClick={handleUpload} disabled={!canUpload}>
                {isUploading ? "Uploading..." : "Upload Selected Files"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle className="text-xl">Files</CardTitle>
              <div className="relative w-full lg:w-80">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search drawings..."
                  className="pl-9"
                  disabled={loadingFiles || validFiles.length === 0}
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
              <Accordion type="multiple" value={openMocs} onValueChange={setOpenMocs} className="space-y-3">
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
                          <DrawingFileCard key={file.url} file={file} onDelete={setDeleteTarget} />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete drawing?</DialogTitle>
            <DialogDescription>
              This will permanently remove {deleteTarget?.fileName ? `"${deleteTarget.fileName}"` : "this drawing"} from storage and the file list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DrawingFileCard({ file, onDelete }: { file: SanitizedDrawingFile; onDelete: (target: DeleteTarget) => void }) {
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

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex h-48 flex-col items-center justify-center rounded-md border border-dashed bg-slate-50 text-center">
      <FileText className="mb-3 h-9 w-9 text-slate-300" />
      <div className="font-semibold text-slate-700">{title}</div>
      <div className="mt-1 text-sm text-slate-500">{description}</div>
    </div>
  );
}
