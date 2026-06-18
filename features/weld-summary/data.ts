import { eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { jointsDetail, mocDetail } from "@/db/schema";
import type { MocSummaryRow, MocWiseDataRow, SizeWiseDataRow, WeldType } from "@/features/weld-summary/types";

export function normalizeWeldType(type: string | null): WeldType {
  return type === "Joints" ? "Joints" : "InchDia";
}

export async function getAllMocsWeldSummary(type: WeldType) {
  const result = await db
    .select({
      moc: mocDetail.moc,
      mocName: mocDetail.mocName,
      ...(type === "InchDia"
        ? {
            shopJoints: sql`SUM(${jointsDetail.shopInchDia})`.as("shopJoints"),
            fieldJoints: sql`SUM(${jointsDetail.fieldInchDia})`.as("fieldJoints"),
            totalJoints: sql`SUM(${jointsDetail.shopInchDia}) + SUM(${jointsDetail.fieldInchDia})`.as("totalJoints"),
          }
        : {
            shopJoints: sql`SUM(${jointsDetail.shopJoints})`.as("shopJoints"),
            fieldJoints: sql`SUM(${jointsDetail.fieldJoints})`.as("fieldJoints"),
            totalJoints: sql`SUM(${jointsDetail.shopJoints}) + SUM(${jointsDetail.fieldJoints})`.as("totalJoints"),
          }),
    })
    .from(mocDetail)
    .innerJoin(jointsDetail, sql`${mocDetail.moc} = ${jointsDetail.moc}`)
    .groupBy(mocDetail.moc, mocDetail.mocName)
    .execute();

  return result as MocSummaryRow[];
}

export async function getMocWiseWeldDetail(moc: string, type: WeldType) {
  const result = await db
    .select({
      MOC: mocDetail.moc,
      MOC_NAME: mocDetail.mocName,
      ...(type === "Joints"
        ? {
            shopJoints: sql`SUM(${jointsDetail.shopJoints})`,
            fieldJoints: sql`SUM(${jointsDetail.fieldJoints})`,
            totalJoints: sql`SUM(${jointsDetail.totalJoints})`,
          }
        : {
            shopInchDia: sql`SUM(${jointsDetail.shopInchDia})`,
            fieldInchDia: sql`SUM(${jointsDetail.fieldInchDia})`,
            totalInchDia: sql`SUM(${jointsDetail.totalInchDia})`,
          }),
    })
    .from(mocDetail)
    .leftJoin(jointsDetail, eq(mocDetail.moc, jointsDetail.moc))
    .where(moc === "*" ? sql`TRUE` : eq(mocDetail.moc, moc))
    .groupBy(mocDetail.moc, mocDetail.mocName);

  return result as MocWiseDataRow[];
}

export async function getPipeSizeWeldDetail(moc: string, type: WeldType) {
  const result = await db
    .select({
      SIZE_INCHES: jointsDetail.sizeInches,
      THKNESS: jointsDetail.thickness,
      ...(type === "Joints"
        ? {
            shopJoints: sql`SUM(${jointsDetail.shopJoints})`,
            fieldJoints: sql`SUM(${jointsDetail.fieldJoints})`,
            totalJoints: sql`SUM(${jointsDetail.totalJoints})`,
          }
        : {
            shopInchDia: sql`SUM(${jointsDetail.shopInchDia})`,
            fieldInchDia: sql`SUM(${jointsDetail.fieldInchDia})`,
            totalInchDia: sql`SUM(${jointsDetail.totalInchDia})`,
          }),
    })
    .from(jointsDetail)
    .where(moc === "*" ? sql`TRUE` : eq(jointsDetail.moc, moc))
    .groupBy(jointsDetail.sizeInches, jointsDetail.thickness)
    .orderBy(sql`CAST(${jointsDetail.sizeInches} AS NUMERIC) DESC`);

  return result as SizeWiseDataRow[];
}
