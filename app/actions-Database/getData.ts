"use server";

import { db } from "../configs/db";
import { files as filesSchema, mocDetail } from "../configs/schema";
import { and, eq, sql } from "drizzle-orm";
import { list as listBlobs } from "@vercel/blob";

type DrawingFileRecord = {
  projectName: string;
  url: string;
  fileName: string;
  category: string;
};

async function readPublicFileSize(fileUrl: string) {
  try {
    const headResponse = await fetch(fileUrl, { method: "HEAD", cache: "no-store" });
    const contentLength = headResponse.headers.get("content-length");

    if (contentLength) {
      const parsedSize = Number(contentLength);
      return Number.isFinite(parsedSize) ? parsedSize : null;
    }

    const rangeResponse = await fetch(fileUrl, {
      method: "GET",
      headers: { Range: "bytes=0-0" },
      cache: "no-store",
    });
    const contentRange = rangeResponse.headers.get("content-range");
    const rangeSize = contentRange?.match(/\/(\d+)$/)?.[1];

    if (rangeSize) {
      const parsedSize = Number(rangeSize);
      return Number.isFinite(parsedSize) ? parsedSize : null;
    }
  } catch (error) {
    console.error(`Failed to read file size for ${fileUrl}:`, error);
  }

  return null;
}

async function attachFileSizes<T extends DrawingFileRecord>(drawingFiles: T[]) {
  const token = process.env.IMAGES_TO_BLOB;

  if (drawingFiles.length === 0) {
    return [];
  }

  const sizesByUrl = new Map<string, number>();

  try {
    if (token) {
      let cursor: string | undefined;

      do {
        const result = await listBlobs({ token, limit: 1000, cursor });
        result.blobs.forEach((blob) => sizesByUrl.set(blob.url, blob.size));
        cursor = result.cursor;
      } while (cursor);
    }
  } catch (error) {
    console.error("Failed to read blob file sizes:", error);
  }

  const filesWithSizes = await Promise.all(
    drawingFiles.map(async (file) => {
      const blobSize = sizesByUrl.get(file.url);
      return {
        ...file,
        fileSize: blobSize ?? (await readPublicFileSize(file.url)),
      };
    })
  );

  return filesWithSizes;
}

export async function getUniqueProjectNames() {
  const projectNames = await db
    .select({
      project_name: sql`DISTINCT ${filesSchema.project_name}`.as<string>(),
    })
    .from(filesSchema);

  return projectNames;
}

export async function getUniqueMOCNumbers() {
  const mocNumbers = await db
    .select({
      moc_no: sql`DISTINCT ${mocDetail.moc}`.as<string>(),
    })
    .from(mocDetail);

  return mocNumbers;
}

export async function getProjectsByMoc(mocName: string) {
  const projects = await db
    .select({
      project_name: mocDetail.mocName,
    })
    .from(mocDetail)
    .where(sql`${mocDetail.moc} = ${mocName}`)
    .limit(1);

  return projects[0]?.project_name || null;
}


export async function getallAwardedMocs() {
  const allAwardedMocs = await db
    .select({
      mocName: sql`DISTINCT ${mocDetail.mocName}`.as<string>(),
    })
    .from(mocDetail);

  return allAwardedMocs;
}

export async function getFilesByProjectName(projectName: string, category?: string) {
  const conditions = [eq(filesSchema.project_name, projectName)];

  if (category) {
    conditions.push(eq(filesSchema.category, category));
  }

  const query = db
    .select({
      projectName: filesSchema.project_name,
      url: filesSchema.url,
      fileName: filesSchema.fileName,
      category: filesSchema.category,
    })
    .from(filesSchema)
    .where(and(...conditions));

  const files = await query;

  return attachFileSizes(files);
}

export async function getAllDrawingFiles(category?: string) {
  const query = db
    .select({
      projectName: filesSchema.project_name,
      url: filesSchema.url,
      fileName: filesSchema.fileName,
      category: filesSchema.category,
    })
    .from(filesSchema);

  if (category) {
    const files = await query.where(eq(filesSchema.category, category));
    return attachFileSizes(files);
  }

  const files = await query;
  return attachFileSizes(files);
}
