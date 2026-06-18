export type DrawingFile = {
  projectName: unknown;
  url: string;
  fileName: string;
  category: unknown;
  fileSize?: number | null;
};

export type SanitizedDrawingFile = Omit<DrawingFile, "projectName" | "category"> & {
  projectName: string;
  category: string;
};

export type DeleteTarget = {
  url: string;
  fileName: string;
} | null;
