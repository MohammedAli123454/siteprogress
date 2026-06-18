"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";

import { deleteFile, uploadFiles } from "@/features/drawings/file-actions";
import { StatusMessage, type StatusMessageValue } from "./components";
import { ALL_CATEGORIES, ALL_MOCS, EMPTY_DRAWING_FILES } from "./constants";
import { DeleteDrawingDialog } from "./DeleteDrawingDialog";
import { DrawingFilesCard } from "./DrawingFilesCard";
import {
  fetchDrawingFiles,
  fetchMocNames,
  fetchUniqueProjectNames,
  filterDrawingFiles,
  getProjectOptions,
  groupDrawingFiles,
  sanitizeDrawingFiles,
} from "./model";
import type { DeleteTarget } from "./types";
import { UploadDrawingsCard } from "./UploadDrawingsCard";

export default function DrawingsPage() {
  const [selectedProject, setSelectedProject] = useState(ALL_MOCS);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);
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
    () => getProjectOptions(mocNames, existingProjectNames),
    [mocNames, existingProjectNames]
  );

  const {
    data: files = EMPTY_DRAWING_FILES,
    isLoading: loadingFiles,
    refetch: refetchFiles,
  } = useQuery({
    queryKey: ["drawingFiles", selectedProject, selectedCategory],
    queryFn: () =>
      fetchDrawingFiles(
        selectedProject === ALL_MOCS ? undefined : selectedProject,
        selectedCategory
      ),
    staleTime: 60 * 1000,
  });

  const validFiles = useMemo(() => sanitizeDrawingFiles(files), [files]);

  const filteredFiles = useMemo(() => filterDrawingFiles(validFiles, searchQuery), [validFiles, searchQuery]);

  const groupedFiles = useMemo(() => groupDrawingFiles(filteredFiles), [filteredFiles]);

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

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
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

        {message && <StatusMessage message={message} />}

        <UploadDrawingsCard
          selectedProject={selectedProject}
          selectedCategory={selectedCategory}
          selectedFiles={selectedFiles}
          projectOptions={projectOptions}
          loadingMocs={loadingMocs}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          canUpload={canUpload}
          onProjectChange={setSelectedProject}
          onCategoryChange={setSelectedCategory}
          onFileChange={handleFileChange}
          onRemoveSelectedFile={removeSelectedFile}
          onClearSelectedFiles={() => setSelectedFiles([])}
          onUpload={handleUpload}
        />

        <DrawingFilesCard
          selectedProject={selectedProject}
          searchQuery={searchQuery}
          validFileCount={validFiles.length}
          filteredFiles={filteredFiles}
          groupedFiles={groupedFiles}
          loadingFiles={loadingFiles}
          openMocs={openMocs}
          onSearchChange={setSearchQuery}
          onOpenMocsChange={setOpenMocs}
          onDelete={setDeleteTarget}
        />
      </div>

      <DeleteDrawingDialog
        target={deleteTarget}
        isDeleting={isDeleting}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
