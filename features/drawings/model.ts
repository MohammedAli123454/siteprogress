import {
  getAllDrawingFiles,
  getAwardedMocNames,
  getFilesByProjectName,
  getUniqueProjectNames,
} from "@/features/drawings/data-actions";

import { ALL_CATEGORIES } from "./constants";
import type { DrawingFile, SanitizedDrawingFile } from "./types";
import { getCleanText } from "./utils";

export type DrawingFileGroup = {
  mocName: string;
  files: SanitizedDrawingFile[];
};

export async function fetchMocNames() {
  const names = await getAwardedMocNames();
  return names.map((name: { mocName: string }) => getCleanText(name.mocName)).filter(Boolean);
}

export async function fetchUniqueProjectNames() {
  const names = await getUniqueProjectNames();
  return names.map((name: { project_name: string }) => getCleanText(name.project_name)).filter(Boolean);
}

export async function fetchDrawingFiles(projectName?: string, category?: string) {
  const categoryFilter = category === ALL_CATEGORIES ? undefined : category;

  if (projectName) {
    return getFilesByProjectName(projectName, categoryFilter) as Promise<DrawingFile[]>;
  }

  return getAllDrawingFiles(categoryFilter) as Promise<DrawingFile[]>;
}

export function getProjectOptions(mocNames: string[], existingProjectNames: string[]) {
  return Array.from(new Set([...mocNames, ...existingProjectNames])).sort((a, b) => a.localeCompare(b));
}

export function sanitizeDrawingFiles(files: DrawingFile[]): SanitizedDrawingFile[] {
  return files
    .map((file) => ({
      ...file,
      projectName: getCleanText(file.projectName),
      category: getCleanText(file.category),
    }))
    .filter((file) => file.projectName);
}

export function filterDrawingFiles(files: SanitizedDrawingFile[], searchQuery: string) {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  if (!normalizedQuery) {
    return files;
  }

  return files.filter((file) => {
    const searchableText = `${file.projectName} ${file.fileName} ${file.category}`.toLowerCase();
    return searchableText.includes(normalizedQuery);
  });
}

export function groupDrawingFiles(files: SanitizedDrawingFile[]): DrawingFileGroup[] {
  const groups = new Map<string, SanitizedDrawingFile[]>();

  files.forEach((file) => {
    const mocName = file.projectName;
    groups.set(mocName, [...(groups.get(mocName) || []), file]);
  });

  return Array.from(groups.entries())
    .map(([mocName, mocFiles]) => ({
      mocName,
      files: mocFiles.sort((a, b) => a.category.localeCompare(b.category) || a.fileName.localeCompare(b.fileName)),
    }))
    .sort((a, b) => a.mocName.localeCompare(b.mocName));
}
