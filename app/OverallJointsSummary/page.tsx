"use client";

import React from 'react';
import { JointSummaryTable } from '@/components/JointSummaryTable';

import { eq } from 'drizzle-orm';
import { jointsDetail } from '@/app/configs/schema';
import { db } from '@/app/configs/db';

// Define the DataItem type as expected by the JointSummaryTable component
type DataItem = {
  moc: string;
  sizeInches: number | null;
  pipeSchedule: string | null;
  thickness: number | null;
  shopJoints: number | null;
  shopInchDia: number | null;
  fieldJoints: number | null;
  fieldInchDia: number | null;
  totalJoints: number | null;
  totalInchDia: number | null;
};

// Fetch data directly from the database and map it to DataItem[]
const fetchJointsData = async (moc: string): Promise<DataItem[]> => {
  try {
    const result = await db
      .select({
        sizeInches: jointsDetail.sizeInches,
        pipeSchedule: jointsDetail.pipeSchedule,
        thickness: jointsDetail.thickness,
        shopJoints: jointsDetail.shopJoints,
        shopInchDia: jointsDetail.shopInchDia,
        fieldJoints: jointsDetail.fieldJoints,
        fieldInchDia: jointsDetail.fieldInchDia,
        totalJoints: jointsDetail.totalJoints,
        totalInchDia: jointsDetail.totalInchDia,
        moc: jointsDetail.moc,
      })
      .from(jointsDetail)
      .where(eq(jointsDetail.moc, moc))
      .execute();

    return result.map(row => ({
      moc: row.moc,
      sizeInches: row.sizeInches !== null ? parseFloat(row.sizeInches as unknown as string) : null,
      pipeSchedule: row.pipeSchedule,
      thickness: row.thickness !== null ? (row.thickness as unknown as number) : null,
      shopJoints: row.shopJoints as unknown as number,
      shopInchDia: row.shopInchDia as unknown as number,
      fieldJoints: row.fieldJoints as unknown as number,
      fieldInchDia: row.fieldInchDia as unknown as number,
      totalJoints: row.totalJoints as unknown as number,
      totalInchDia: row.totalInchDia as unknown as number,
    })) as DataItem[];
  } catch (error) {
    console.error('Error fetching joints data:', error);
    return [];
  }
};

// Process and aggregate data to match the DataItem type
const aggregateData = (data: DataItem[]): DataItem[] => {
  return data.reduce<DataItem[]>((acc, item) => {
    const existing = acc.find(i => i.sizeInches === item.sizeInches);
    if (existing) {
      existing.shopJoints = (existing.shopJoints ?? 0) + (item.shopJoints ?? 0);
      existing.shopInchDia = (existing.shopInchDia ?? 0) + (item.shopInchDia ?? 0);
      existing.fieldJoints = (existing.fieldJoints ?? 0) + (item.fieldJoints ?? 0);
      existing.fieldInchDia = (existing.fieldInchDia ?? 0) + (item.fieldInchDia ?? 0);
      existing.totalJoints = (existing.totalJoints ?? 0) + (item.totalJoints ?? 0);
      existing.totalInchDia = (existing.totalInchDia ?? 0) + (item.totalInchDia ?? 0);
    } else {
      acc.push({ ...item });
    }
    return acc;
  }, []);
};

export default async function OverallJointsSummary() {
  // Fetch the data from the database (you need to provide the MOC value)
  const MOC = "someMocValue"; // Replace this with your actual MOC value or logic to get it

  const data = await fetchJointsData(MOC);
  const overallData = aggregateData(data);

  return (
    <div className="grid grid-cols-1 gap-4 p-4">
      <div>
        <JointSummaryTable data={overallData} />
      </div>
    </div>
  );
}
