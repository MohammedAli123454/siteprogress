"use server";

import { db } from "../configs/db";
import { files as filesSchema } from "../configs/schema";
import { put,del } from "@vercel/blob";
import { eq } from "drizzle-orm";

// Server action to upload files and save their URLs in the database under the specified project name
export async function uploadFiles(formData: FormData) {
  const projectName = formData.get("projectName") as string;
  const uploadedFiles: { url: string }[] = [];  // Array to store uploaded file URLs
  const category = formData.get("category") as string;
  const files = formData.getAll("files") as File[];  // Extract files from the FormData object

 
 

  // Loop through each file and upload to Vercel Blob
  for (const file of files) {
    const stream = file.stream();  // Get the file stream for upload

    // Upload the file to Vercel Blob storage
    const { url } = await put(file.name, stream, {
      access: "public",  // Set the access to public
      token: process.env.IMAGES_TO_BLOB,  // Use the environment variable for the Blob token
    });

    // Push the uploaded file URL to the array
    uploadedFiles.push({ url });

    // Save the file URL and project name in the 'files' table
    await db.insert(filesSchema).values({
      project_name: projectName,  // Insert the project name
      url,  // Insert the file URL
      fileName: file.name,
      category: category,
    });
  }

  // Return an array of uploaded file URLs
  return uploadedFiles;
}

// Server action to delete a file from Vercel Blob and remove its record from the database
export async function deleteFile(fileUrl: string) {
  // Extract the file key from the URL (assuming it's the part after the domain)
  const urlParts = new URL(fileUrl);
  const fileKey = urlParts.pathname.substring(1); // This will give you the file path in blob storage
  
  // Delete the file from Vercel Blob
  await del(fileKey, {
    token: process.env.IMAGES_TO_BLOB,  // Use the environment variable for the Blob token
  });

  // Delete the file record from the database using the file URL
  const deleteResult = await db
    .delete(filesSchema)
    .where(eq(filesSchema.url, fileUrl));
  
  // Inspect deleteResult to determine if rows were affected
  if (deleteResult.rowCount === 0) {  // Adjust according to the actual delete result structure
    throw new Error("File not found in the database.");
  }

  return { success: true, message: "File deleted successfully." };
}