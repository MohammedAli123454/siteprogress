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



// Fetch unique project names
// Fetch unique project names
export async function getUniqueMOCNumbers() {
  const mocNumbers = await db
      .select({
          moc_no: sql`DISTINCT ${mocDetail.moc}`.as<string>(),
      })
      .from(mocDetail);

  // Assuming mocNumbers is an array of objects, return it as is
  return mocNumbers; // Ensure this returns [{ moc_no: 'value' }, ...]
}




// Fetch unique project names
export async function getProjectsByMoc(mocName: string) {
  const projects = await db
    .select({
      project_name: mocDetail.mocName, // Select project_name column
    })
    .from(mocDetail)
    .where(sql`${mocDetail.moc} = ${mocName}`) // Filter by mocName
    .limit(1); // Limit to 1 if only one project_name is expected

  return projects[0]?.project_name || null; // Return project_name or null if not found
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

