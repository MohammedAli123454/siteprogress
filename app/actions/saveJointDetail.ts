"use server";

import { db } from "../configs/db";
import { jointSummary, jointTable } from "../configs/schema";
import { eq } from "drizzle-orm";

type JointsSummary = {
  moc: string;
  mocName: string;
  mocStartDate: string;
  MCCDate: string;
  totalShopJoints: number;
  totalFieldJoints: number;
  totalJoints: number;
  totalShopInchDia: number;
  totalFieldInchDia: number;
  totalInchDia: number;
};

type LineItem = {
  pipeSize: number;
  thk: string;
  type: string;
  shopJoint: number;
  fieldJoint: number;
  totalJoint: number;
  shopInchDia: number;
  fieldInchDia: number;
  totalInchDia: number;
};

type JointsData = {
  header: JointsSummary;
  lineItems: LineItem[];
};

// Save Joints Detail Function
export async function saveJointsDetail(data: JointsData) {
  const { header, lineItems: items } = data;

  try {
    // Check if a record with the same `moc` already exists
    const existingHeader = await db
      .select()
      .from(jointSummary)
      .where(eq(jointSummary.moc, header.moc));

    const headerExists = existingHeader[0]; // Access the first result if available

    if (headerExists) {
      // Update the existing record if `moc` already exists
      await db
        .update(jointSummary)
        .set({
          mocName: header.mocName,
          totalShopJoints: header.totalShopJoints,
          totalFieldJoints: header.totalFieldJoints,
          totalJoints: header.totalJoints,
          totalShopInchDia: header.totalShopInchDia,
          totalFieldInchDia: header.totalFieldInchDia,
          totalInchDia: header.totalInchDia,
        })
        .where(eq(jointSummary.moc, header.moc));
    } else {
      // Insert new record if `moc` does not exist
      await db.insert(jointSummary).values({
        moc: header.moc,
        mocName: header.mocName,
        mocStartDate: header.mocStartDate,
        MCCDate: header.MCCDate,
        totalShopJoints: header.totalShopJoints,
        totalFieldJoints: header.totalFieldJoints,
        totalJoints: header.totalJoints,
        totalShopInchDia: header.totalShopInchDia,
        totalFieldInchDia: header.totalFieldInchDia,
        totalInchDia: header.totalInchDia,
      });
    }

    // Insert line items, each referencing the `moc` from `jointSummary`
    const lineItemsData = items.map((item) => ({
      pipeSize: item.pipeSize,
      thk: item.thk,
      type: item.type,
      shopJoint: item.shopJoint,
      fieldJoint: item.fieldJoint,
      totalJoint: item.totalJoint,
      shopInchDia: item.shopInchDia,
      fieldInchDia: item.fieldInchDia,
      totalInchDia: item.totalInchDia,
      moc: header.moc, // Foreign key to `jointSummary.moc`
    }));

    // Insert line items into the `jointTable`
    await db.insert(jointTable).values(lineItemsData);

    return { success: true };
  } catch (error) {
    console.error("Error saving joints detail:", error);
    return { success: false, message: "Failed to save joints detail" };
  }
}
