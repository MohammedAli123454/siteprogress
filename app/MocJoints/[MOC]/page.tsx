import React from 'react';
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { eq, sql } from 'drizzle-orm';
import { jointsDetail } from '@/app/configs/schema';
import { db } from '@/app/configs/db';

export async function fetchPivotedData(moc: string) {
  const rawData = await db
    .select({
      sizeInches: jointsDetail.sizeInches,
      pipeSchedule: jointsDetail.pipeSchedule,
      thickness: jointsDetail.thickness,
      shopJoints: sql`SUM(${jointsDetail.shopJoints})`.as('SHOP_JOINTS'),
      shopInchDia: sql`SUM(${jointsDetail.shopInchDia})`.as('SHOP_INCH_DIA'),
      fieldJoints: sql`SUM(${jointsDetail.fieldJoints})`.as('FIELD_JOINTS'),
      fieldInchDia: sql`SUM(${jointsDetail.fieldInchDia})`.as('FIELD_INCH_DIA'),
      totalJoints: sql`SUM(${jointsDetail.totalJoints})`.as('TOTAL_JOINTS'),
      totalInchDia: sql`SUM(${jointsDetail.totalInchDia})`.as('TOTAL_INCH_DIA'),
    })
    .from(jointsDetail)
    .where(eq(jointsDetail.moc, moc))
    .groupBy(jointsDetail.sizeInches, jointsDetail.pipeSchedule, jointsDetail.thickness)
    .orderBy(sql`${jointsDetail.sizeInches}::numeric ASC`)
    .execute();

  const pivotedData = [
    { Attribute: 'SIZE (INCHES)', Values: rawData.map(row => row.sizeInches) },
    { Attribute: 'PIPE SCHEDULE', Values: rawData.map(row => row.pipeSchedule) },
    { Attribute: 'THKNESS', Values: rawData.map(row => row.thickness) },
    { Attribute: 'SHOP JOINTS', Values: rawData.map(row => row.shopJoints) },
    { Attribute: 'SHOP INCH DIA', Values: rawData.map(row => row.shopInchDia) },
    { Attribute: 'FIELD JOINTS', Values: rawData.map(row => row.fieldJoints) },
    { Attribute: 'FIELD INCH DIA', Values: rawData.map(row => row.fieldInchDia) },
    { Attribute: 'TOTAL JOINTS', Values: rawData.map(row => row.totalJoints) },
    { Attribute: 'TOTAL INCH DIA', Values: rawData.map(row => row.totalInchDia) },
  ];

  return pivotedData;
}

// This is your page component, which fetches data and renders it
export default async function MOCJoints({ params }: { params: { MOC: string } }) {
  const pivotedData = await fetchPivotedData(params.MOC);

  return (
    <div className="m-4">
  <Card className="w-full">
    <CardHeader className="flex justify-between items-center">
      <CardTitle className="text-center">
        {params.MOC ? `${params.MOC} JOINT SUMMARY` : 'JOINT SUMMARY'}
      </CardTitle>
    </CardHeader>
    <Separator />
    <CardContent className="overflow-auto">
      <div className="w-full overflow-x-auto">
        <Table className="w-full min-w-max">
          <TableBody>
            {pivotedData.map((row, rowIndex) => (
              <TableRow key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-100' : 'bg-white'}>
                <TableCell className="font-semibold px-1 py-1">{row.Attribute}</TableCell>
                {row.Values.map((value, index) => (
                  <TableCell className="px-2 py-1" key={index}>{String(value)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
</div>

  
  );
}
