"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { JointSummaryTable } from '@/components/JointSummaryTable';

import { eq, desc } from 'drizzle-orm';
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
      .where(eq(jointsDetail.moc, moc)) // Filter by MOC
      .orderBy(desc(jointsDetail.totalInchDia)) // Order by totalInchDia in descending order
      .execute();

    // Map the result to match the DataItem type
    return result.map(row => ({
      sizeInches: row.sizeInches !== null ? parseFloat(row.sizeInches as string) : null,
      pipeSchedule: row.pipeSchedule,
      thickness: row.thickness !== null ? row.thickness as number : null,
      shopJoints: row.shopJoints as number,
      shopInchDia: row.shopInchDia as number,
      fieldJoints: row.fieldJoints as number,
      fieldInchDia: row.fieldInchDia as number,
      totalJoints: row.totalJoints as number,
      totalInchDia: row.totalInchDia as number,
      moc: row.moc,
    })) as DataItem[];
  } catch (error) {
    console.error('Error fetching joints data:', error);
    return [];
  }
};

export default async function MOCJoints() {
  const params = useParams();
  const MOC = Array.isArray(params.MOC) ? params.MOC[0] : params.MOC;

  // Ensure MOC is defined and is a string
  if (!MOC || typeof MOC !== 'string') {
    return <p>Loading...</p>;
  }

  // Fetch the joints data from the database
  const data = await fetchJointsData(MOC);

  return (
    <div className="p-4">
      {data.length > 0 ? (
        <JointSummaryTable data={data} moc={MOC} />
      ) : (
        <p>No data found for MOC: {MOC}</p>
      )}
    </div>
  );
}
