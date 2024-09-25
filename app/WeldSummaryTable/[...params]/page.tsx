"use client"; // Ensure it's a client component

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableCell, TableRow, TableHead, TableBody } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { db } from "@/app/configs/db";
import { mocDetail, jointsDetail } from "@/app/configs/schema";
import { sql, eq } from "drizzle-orm";
import { useParams } from "next/navigation";

type DataType = {
  MOC: string;
  MOC_NAME: string;
  shopJoints?: number;
  fieldJoints?: number;
  totalJoints?: number;
  shopInchDia?: number;
  fieldInchDia?: number;
  totalInchDia?: number;
};

type MicroDetailType = {
  SIZE_INCHES: string;
  THKNESS: number;
  shopJoints: number;
  fieldJoints: number;
  totalJoints: number;
  shopInchDia: number;
  fieldInchDia: number;
  totalInchDia: number;
};

// Query function to fetch data
const getQuery = async (moc: string, Type: string) => {
  const baseQuery = db
    .select({
      MOC: mocDetail.moc,
      MOC_NAME: mocDetail.mocName,
      ...(Type === "Joints"
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

    const result = await baseQuery;
    return result as DataType[];
  
};

// Query function for micro details
const getMicroDetails = async (moc: string, Type: string) => {
  const baseQuery = db
    .select({
      SIZE_INCHES: jointsDetail.sizeInches,
        THKNESS: jointsDetail.thickness,

        ...(Type === "Joints"
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
      .where(moc === '*' ? sql`TRUE` : eq(jointsDetail.moc, moc))
      .groupBy(jointsDetail.sizeInches, jointsDetail.thickness)
      .orderBy(sql`CAST(${jointsDetail.sizeInches} AS NUMERIC) DESC`);
  const result = await baseQuery;
  return result as MicroDetailType[];
};

// React component to display the table
export default function WeldSummaryTable() {
  const [showMicroDetail, setShowMicroDetail] = useState(false); // Default is false to show the Moc Wise Detail Table

  const handleToggle = () => {
    setShowMicroDetail(!showMicroDetail);
  };

  const params = useParams(); // Get the parameters from the URL
  const moc = params?.params?.[0]; // Access the first parameter
  const Type = params?.params?.[1]; // Access the second parameter

  // Fetch data using useQuery hook
  const { data = [], isLoading } = useQuery({
    queryKey: ["mocData", moc, Type],
    queryFn: () => getQuery(moc, Type),
  });

  // Fetch micro detail data
  const { data: microData = [], isLoading: isMicroLoading, isError: isMicroError } = useQuery({
    queryKey: ["microData", moc],
    queryFn: () => getMicroDetails(moc, Type),
    enabled: showMicroDetail,
  });

  if (isMicroError) {
    console.error("Error fetching micro details");
  }

  const totals = {
    gshopJoints: data?.reduce((sum, item) => sum + Number(item.shopJoints || 0), 0),
    gfieldJoints: data?.reduce((sum, item) => sum + Number(item.fieldJoints || 0), 0),
    gtotalJoints: data?.reduce((sum, item) => sum + Number(item.totalJoints || 0), 0),
    gshopInchDia: data?.reduce((sum, item) => sum + Number(item.shopInchDia || 0), 0),
    gfieldInchDia: data?.reduce((sum, item) => sum + Number(item.fieldInchDia || 0), 0),
    gtotalInchDia: data?.reduce((sum, item) => sum + Number(item.totalInchDia || 0), 0),
  };
  

  return (
    <Card>
      <CardContent>
        <div className="flex mb-4 items-center justify-end">
          <label className="flex items-center space-x-2">
            <Switch checked={showMicroDetail} onCheckedChange={handleToggle} />
            <span className="text-sm">{showMicroDetail ? 'Detail By MOC' : 'Details By Size'}</span>
          </label>
        </div>

        {!showMicroDetail ? ( // Show Moc Wise Detail Table by default
          <div className="overflow-auto mx-4">
            <Table className="w-full table-fixed">
              <TableHead>
                <TableRow className="flex w-full box-border font-bold text-lg">
                  <TableCell className="font-semibold min-w-[60px] px-2 py-2 box-border text-center">Sr.No</TableCell>
                  <TableCell className="font-semibold min-w-[150px] px-2 py-2 box-border text-center">MOC</TableCell>
                  <TableCell className="font-semibold min-w-[600px] px-2 py-2 box-border">MOC Name</TableCell>
                  {Type.includes("Joints") ? (
                    <>
                      <TableCell className="font-semibold min-w-[175px] px-2 py-2 box-border text-center">Shop Joints</TableCell>
                      <TableCell className="font-semibold min-w-[175px] px-2 py-2 box-border text-center">Field Joints</TableCell>
                      <TableCell className="font-semibold min-w-[175px] px-2 py-2 box-border text-center">Total Joints</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-semibold min-w-[175px] px-2 py-2 box-border text-center">Shop Inch Dia</TableCell>
                      <TableCell className="font-semibold min-w-[175px] px-2 py-2 box-border text-center">Field Inch Dia</TableCell>
                      <TableCell className="font-semibold min-w-[175px] px-2 py-2 box-border text-center">Total Inch Dia</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={index} className="flex w-full box-border">
                    <TableCell className="min-w-[60px] px-2 py-2 box-border text-center">{index + 1}</TableCell>
                    <TableCell className="min-w-[150px] px-2 py-2 box-border text-center">{item.MOC}</TableCell>
                    <TableCell className="min-w-[600px] px-2 py-2 box-border">{item.MOC_NAME}</TableCell>
                    {Type.includes("Joints") ? (
                      <>
                        <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{item.shopJoints || 0}</TableCell>
                        <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{item.fieldJoints || 0}</TableCell>
                        <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{item.totalJoints || 0}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{item.shopInchDia || 0}</TableCell>
                        <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{item.fieldInchDia || 0}</TableCell>
                        <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{item.totalInchDia || 0}</TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
                {/* Footer Row */}

                <TableRow className="flex w-full box-border font-bold">
                  <TableCell className="px-2 py-2 min-w-[210px] box-border"></TableCell>
                  <TableCell className="px-2 py-2 min-w-[450px] box-border"></TableCell>
                  <TableCell className="px-2 py-2 min-w-[150px] box-border text-right">Grand Total</TableCell>

                  {Type.includes("Joints") ? (
                    <>
                      <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{totals.gshopJoints}</TableCell>
                      <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{totals.gfieldJoints}</TableCell>
                      <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{totals.gtotalJoints}</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{totals.gshopInchDia}</TableCell>
                      <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{totals.gfieldInchDia}</TableCell>
                      <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{totals.gtotalInchDia}</TableCell>
                    </>
                  )}
                </TableRow>
              </TableBody>
            </Table>
          </div>

        ) : ( // Show Micro Detail Table
          <div className="mt-4">
            <Table className="w-full table-fixed">
              <TableHead>
                <TableRow className="flex w-full box-border font-bold text-lg">
                  <TableCell className="min-w-[60px] px-2 py-2 box-border text-center">Sr.No</TableCell>
                  <TableCell className="min-w-[150px] px-2 py-2 box-border text-center">Size (Inches)</TableCell>
                  <TableCell className="min-w-[150px] px-2 py-2 box-border text-center">Thickness</TableCell>

                  {/* Conditional Columns based on Type */}
                  {Type.includes("Joints") ? (
                    <>
                      <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">Shop Joints</TableCell>
                      <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">Field Joints</TableCell>
                      <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">Total Joints</TableCell>
                    </>
                  ) : Type === "InchDia" ? (
                    <>
                      <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">Shop Inch Dia</TableCell>
                      <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">Field Inch Dia</TableCell>
                      <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">Total Inch Dia</TableCell>
                    </>
                  ) : null}
                </TableRow>
              </TableHead>
              <TableBody>
                {microData.map((item, index) => (
                  <TableRow key={index} className="flex w-full box-border">
                    <TableCell className="min-w-[60px] px-2 py-2 box-border text-center">{index + 1}</TableCell>
                    <TableCell className="min-w-[150px] px-2 py-2 box-border text-center">{item.SIZE_INCHES || 0}</TableCell>
                    <TableCell className="min-w-[150px] px-2 py-2 box-border text-center">{item.THKNESS || 0}</TableCell>

                    {/* Conditional Columns based on Type */}
                    {Type.includes("Joints") ? (
                      <>
                        <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{item.shopJoints ? Number(item.shopJoints) : 0}</TableCell>
                        <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{item.fieldJoints ? Number(item.fieldJoints) : 0}</TableCell>
                        <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{item.totalJoints ? Number(item.totalJoints) : 0}</TableCell>
                      </>
                    ) : Type === "InchDia" ? (
                      <>
                        <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{item.shopInchDia ? Number(item.shopInchDia) : 0}</TableCell>
                        <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{item.fieldInchDia ? Number(item.fieldInchDia) : 0}</TableCell>
                        <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{item.totalInchDia ? Number(item.totalInchDia) : 0}</TableCell>
                      </>
                    ) : null}
                  </TableRow>
                ))}

              </TableBody>
            </Table>
          </div>

        )}
      </CardContent>
    </Card>
  );
}



