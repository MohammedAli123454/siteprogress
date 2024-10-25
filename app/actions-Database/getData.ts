"use server";

import { db } from "../configs/db";
import { files as filesSchema } from "../configs/schema";
import { mocDetail } from "../configs/schema";
import { and,eq,sql } from "drizzle-orm";

// Fetch unique project names
export async function getUniqueProjectNames() {
  const projectNames = await db
    .select({
      project_name: sql`DISTINCT ${filesSchema.project_name}`.as<string>(),  // Explicitly cast as string
    })
    .from(filesSchema);

  return projectNames;
}


export async function getallAwardedMocs() {
  const allAwardedMocs = await db
    .select({
      mocName: sql`DISTINCT ${mocDetail.mocName}`.as<string>(),  // Explicitly cast as string
    })
    .from(mocDetail);

  return allAwardedMocs;
}

// Fetch URLs by project name
export async function getFilesByProjectName(projectName: string, category?: string) {
  const conditions = [eq(filesSchema.project_name, projectName)];

  if (category) {
    conditions.push(eq(filesSchema.category, category));
  }

  const query = db
    .select({
      url: filesSchema.url,
      fileName: filesSchema.fileName,
      category: filesSchema.category,
    })
    .from(filesSchema)
    .where(and(...conditions)); // Spread the conditions array into `and`

  const files = await query;

  return files;
}

