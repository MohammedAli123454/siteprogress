"use server";

import { db } from "../configs/db";
import { files as filesSchema } from "../configs/schema";
import { put } from "@vercel/blob";
import { useUploadProgressStore } from "../store/uploadProgressStore";  // Import Zustand store

// Server action to upload files and save their URLs in the database under the specified project name
export async function uploadFiles(formData: FormData) {
  const projectName = formData.get("projectName") as string;
  const uploadedFiles: { url: string }[] = [];  // Array to store uploaded file URLs

  const files = formData.getAll("files") as File[];  // Extract files from the FormData object
  const totalFiles = files.length;  // Get the total number of files to upload

  const setProgress = useUploadProgressStore.getState().setProgress;  // Access Zustand's setProgress method

  // Loop through each file and upload to Vercel Blob
  let uploadedCount = 0;
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
    });

    // Increment uploaded count and calculate progress
    uploadedCount += 1;
    const progress = (uploadedCount / totalFiles) * 100;  // Calculate the progress as a percentage
    setProgress(progress);  // Update the progress in the Zustand store
  }

  // After all files are uploaded, reset the progress to 0 or 100 (optional)
  setProgress(100);

  // Return an array of uploaded file URLs
  return uploadedFiles;
}
