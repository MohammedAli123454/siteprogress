"use server";

import { db } from "../configs/db";
import { files as filesSchema } from "../configs/schema";
import { eq,sql } from "drizzle-orm";

// Fetch unique project names
export async function getUniqueProjectNames() {
  const projectNames = await db
    .select({
      project_name: sql`DISTINCT ${filesSchema.project_name}`.as<string>(),  // Explicitly cast as string
    })
    .from(filesSchema);

  return projectNames;
}

// Fetch URLs by project name
export async function getFilesByProjectName(projectName: string) {
  const files = await db
    .select({
      url: filesSchema.url,  // Select the URL
      fileName: filesSchema.fileName,  // Select the file name
    })
    .from(filesSchema)
    .where(eq(filesSchema.project_name, projectName));  // Use eq for equality check

  return files;  // Return both URL and fileName for each file
}
