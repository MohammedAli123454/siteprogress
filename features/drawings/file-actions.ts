"use server";

import { del, put } from "@vercel/blob";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { files as filesSchema } from "@/db/schema";

export async function uploadFiles(formData: FormData) {
  const projectName = formData.get("projectName") as string;
  const category = formData.get("category") as string;
  const files = formData.getAll("files") as File[];
  const uploadedFiles: { url: string }[] = [];

  for (const file of files) {
    const stream = file.stream();

    const { url } = await put(file.name, stream, {
      access: "public",
      token: process.env.IMAGES_TO_BLOB,
    });

    uploadedFiles.push({ url });

    await db.insert(filesSchema).values({
      project_name: projectName,
      url,
      fileName: file.name,
      category,
    });
  }

  return uploadedFiles;
}

export async function deleteFile(fileUrl: string) {
  const urlParts = new URL(fileUrl);
  const fileKey = urlParts.pathname.substring(1);
  
  await del(fileKey, {
    token: process.env.IMAGES_TO_BLOB,
  });

  const deleteResult = await db
    .delete(filesSchema)
    .where(eq(filesSchema.url, fileUrl));
  
  if (deleteResult.rowCount === 0) {
    throw new Error("File not found in the database.");
  }

  return { success: true, message: "File deleted successfully." };
}
