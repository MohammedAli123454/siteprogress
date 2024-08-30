import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { db } from '../configs/db';
import { jointsDetail, mocDetail } from '../configs/schema';
import { sql,eq } from 'drizzle-orm';

// Define the types
type MocDetailType = {
  moc: string;
  mocName: string;
  totalInchDia: number;
  totalJoints: number;
};

// Fetch data directly in the component
const fetchMocDetails = async (): Promise<MocDetailType[]> => {
  // Use Drizzle's query-building functions
  const mocData = await db
    .select({
      moc: mocDetail.moc,
      mocName: mocDetail.mocName,
      totalInchDia: sql`SUM(${jointsDetail.totalInchDia})`.as('totalInchDia'),
      totalJoints: sql`SUM(${jointsDetail.totalJoints})`.as('totalJoints')
    })
    .from(mocDetail)
    .innerJoin(jointsDetail, eq(mocDetail.moc, jointsDetail.moc))
    .groupBy(mocDetail.moc, mocDetail.mocName)
    .execute();

  // Cast the result to MocDetailType
  return mocData as MocDetailType[];
};

export default async function MocDetail() {
  // Fetch the MOC details
  const mocDetails = await fetchMocDetails();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {mocDetails.map((mocDetail, index) => (
        <Card key={index} className="transition-transform transform hover:border-blue-500 hover:scale-105 hover:shadow-md">
          <CardHeader className="flex justify-between items-center p-4">
            <div className="flex-1">
              <CardTitle>{mocDetail.moc}</CardTitle>
            </div>
            <div className="font-bold p-2 rounded flex-shrink-0">
              {mocDetail.mocName}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-2">
              <span>Total Inch Dia: {mocDetail.totalInchDia}</span>
              <span>Total Joints: {mocDetail.totalJoints}</span>
              <Link href={`/MocJoints/${mocDetail.moc}`}>
                <Button variant="outline">View Details</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
