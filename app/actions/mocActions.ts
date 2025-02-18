"use server";

import { db } from "../configs/db";
import { mocs } from "../configs/schema";
import { eq } from "drizzle-orm";

export type MOC = typeof mocs.$inferSelect;
export type MOCFormValues = Omit<typeof mocs.$inferInsert, "id">;

export const addMOC = async (data: MOCFormValues) => {
  try {
    const [moc] = await db.insert(mocs).values(data).returning();
    return { success: true, data: moc };
  } catch (error) {
    return { success: false, message: "Failed to create MOC" };
  }
};

export const updateMOC = async (id: number, data: Partial<MOCFormValues>) => {
  try {
    const [moc] = await db
      .update(mocs)
      .set(data)
      .where(eq(mocs.id, id))
      .returning();
    return { success: true, data: moc };
  } catch (error) {
    return { success: false, message: "Failed to update MOC" };
  }
};

export const deleteMOC = async (id: number) => {
  try {
    await db.delete(mocs).where(eq(mocs.id, id));
    return { success: true };
  } catch (error) {
    return { success: false, message: "Failed to delete MOC" };
  }
};

export const getMOCs = async () => {
    const result = await db.select().from(mocs);
    return result; // Remove the parseFloat conversion
  };


