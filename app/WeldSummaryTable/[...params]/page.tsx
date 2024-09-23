"use client"; // Ensure it's a client component

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableCell, TableRow, TableHead, TableBody } from "@/components/ui/table";
import { db } from "@/app/configs/db";
import { mocDetail, jointsDetail } from "@/app/configs/schema";
import { sql, eq } from "drizzle-orm";
import { useParams } from "next/navigation";

type DataType = {
  MOC: string;
  MOC_NAME: string;
  SHOP_JOINTS?: number;
  FIELD_JOINTS?: number;
  TOTAL_JOINTS?: number;
  SHOP_INCH_DIA?: number;
  FIELD_INCH_DIA?: number;
  TOTAL_INCH_DIA?: number;
};

type MicroDetailType = {
  SIZE_INCHES: number;
  PIPE_SCHEDULE: string;
  THKNESS: number;
  SHOP_JOINTS: number;
  SHOP_INCH_DIA: number;
  FIELD_JOINTS: number;
  FIELD_INCH_DIA: number;
  TOTAL_JOINTS: number;
  TOTAL_INCH_DIA: number;
};
// Query function to fetch data
const getQuery = async (moc: string, Type: string) => {
  let query;

  if (Type === "Joints") {
    query = db
      .select({
        MOC: mocDetail.moc,
        MOC_NAME: mocDetail.mocName,
        SHOP_JOINTS: sql`SUM(${jointsDetail.shopJoints})`.as("SHOP_JOINTS"),
        FIELD_JOINTS: sql`SUM(${jointsDetail.fieldJoints})`.as("FIELD_JOINTS"),
        TOTAL_JOINTS: sql`SUM(${jointsDetail.totalJoints})`.as("TOTAL_JOINTS"),
      })
      .from(mocDetail)
      .leftJoin(jointsDetail, eq(mocDetail.moc, jointsDetail.moc))
      .where(moc === '*' ? sql`TRUE` : eq(mocDetail.moc, moc))
      .groupBy(mocDetail.moc, mocDetail.mocName);
  } else if (Type === "InchDia") {
    query = db
      .select({
        MOC: mocDetail.moc,
        MOC_NAME: mocDetail.mocName,
        SHOP_INCH_DIA: sql`SUM(${jointsDetail.shopInchDia})`.as("SHOP_INCH_DIA"),
        FIELD_INCH_DIA: sql`SUM(${jointsDetail.fieldInchDia})`.as("FIELD_INCH_DIA"),
        TOTAL_INCH_DIA: sql`SUM(${jointsDetail.totalInchDia})`.as("TOTAL_INCH_DIA"),
      })
      .from(mocDetail)
      .leftJoin(jointsDetail, eq(mocDetail.moc, jointsDetail.moc))
      .where(moc === '*' ? sql`TRUE` : eq(mocDetail.moc, moc))
      .groupBy(mocDetail.moc, mocDetail.mocName);
  }

  const result = await query;
  return result as DataType[];
};

// Query function for micro details
const getMicroDetails = async (moc: string) => {
  const query = db
    .select({
      SIZE_INCHES: jointsDetail.sizeInches,
      PIPE_SCHEDULE: jointsDetail.pipeSchedule,
      THKNESS: jointsDetail.thickness,
      SHOP_JOINTS: sql`SUM(${jointsDetail.shopJoints})`.as("SHOP_JOINTS"),
      FIELD_JOINTS: sql`SUM(${jointsDetail.fieldJoints})`.as("FIELD_JOINTS"),
      TOTAL_JOINTS: sql`SUM(${jointsDetail.totalJoints})`.as("TOTAL_JOINTS"),

      SHOP_INCH_DIA: sql`SUM(${jointsDetail.shopInchDia})`.as("SHOP_INCH_DIA"),
      FIELD_INCH_DIA: sql`SUM(${jointsDetail.fieldInchDia})`.as("FIELD_INCH_DIA"),
      TOTAL_INCH_DIA: sql`SUM(${jointsDetail.totalInchDia})`.as("TOTAL_INCH_DIA"),
    })
    .from(jointsDetail)
    .where(moc === '*' ? sql`TRUE` : eq(jointsDetail.moc, moc))
    .groupBy(jointsDetail.sizeInches, jointsDetail.pipeSchedule, jointsDetail.thickness);

  const result = await query;
  console.log(result); // Log the result to see the actual query output
  return result;
};



// React component to display the table
export default function WeldSummaryTable() {
  const [showMicroDetail, setShowMicroDetail] = useState(false);
  
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
    queryFn: () => getMicroDetails(moc),
    enabled: showMicroDetail,
  });

  if (isMicroError) {
    console.error("Error fetching micro details");
  }

  // Precompute totals
  const totals = data.reduce(
    (acc, item) => {
      const shopJoints = Number(item.SHOP_JOINTS || 0);
      const fieldJoints = Number(item.FIELD_JOINTS || 0);
      const totalJoints = Number(item.TOTAL_JOINTS || 0);

      const shopInchDia = Number(item.SHOP_INCH_DIA || 0);
      const fieldInchDia = Number(item.FIELD_INCH_DIA || 0);
      const totalInchDia = Number(item.TOTAL_INCH_DIA || 0);

      if (Type.includes("Joints")) {
        acc.gshopJoints += shopJoints;
        acc.gfieldJoints += fieldJoints;
        acc.gtotalJoints += totalJoints;
      } else {
        acc.gshopInchDia += shopInchDia;
        acc.gfieldInchDia += fieldInchDia;
        acc.gtotalInchDia += totalInchDia;
      }

      return acc;
    },
    {
      gshopJoints: 0,
      gfieldJoints: 0,
      gtotalJoints: 0,
      gshopInchDia: 0,
      gfieldInchDia: 0,
      gtotalInchDia: 0,
    }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {Type.includes("Joints") ? "Total Joints Summary" : "Total Inch Dia Summary"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
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
                        <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{item.SHOP_JOINTS || 0}</TableCell>
                        <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{item.FIELD_JOINTS || 0}</TableCell>
                        <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{item.TOTAL_JOINTS || 0}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{item.SHOP_INCH_DIA || 0}</TableCell>
                        <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{item.FIELD_INCH_DIA || 0}</TableCell>
                        <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{item.TOTAL_INCH_DIA || 0}</TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
                {/* Footer Row */}
                <TableRow className="flex w-full box-border font-semibold text-md bg-slate-200">
                  <TableCell colSpan={3} className="min-w-[60px] px-2 py-2 box-border text-center">Total</TableCell>
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
        )}

        {/* Micro Details Toggle */}
        <div className="text-center mt-4">
          <button
            className="px-3 py-2 text-sm bg-blue-500 text-white rounded"
            onClick={() => setShowMicroDetail(!showMicroDetail)}
          >
            {showMicroDetail ? "Hide Micro Details" : "Show Micro Details"}
          </button>
        </div>

        {/* Micro Details Table */}
        {showMicroDetail && (
          <div className="mt-4">
            <Table className="w-full table-fixed">
              <TableHead>
                <TableRow className="flex w-full box-border font-bold text-lg">
                  <TableCell className="min-w-[60px] px-2 py-2 box-border text-center">Sr.No</TableCell>
                  <TableCell className="min-w-[150px] px-2 py-2 box-border text-center">Size (Inches)</TableCell>
                  <TableCell className="min-w-[150px] px-2 py-2 box-border text-center">Pipe Schedule</TableCell>
                  <TableCell className="min-w-[150px] px-2 py-2 box-border text-center">Thickness</TableCell>
                  <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">Shop Joints</TableCell>
                  <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">Shop Inch Dia</TableCell>
                  <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">Field Joints</TableCell>
                  <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">Field Inch Dia</TableCell>
                  <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">Total Joints</TableCell>
                  <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">Total Inch Dia</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
              {microData.map((item, index) => (
  <TableRow key={index} className="flex w-full box-border">
    <TableCell className="min-w-[60px] px-2 py-2 box-border text-center">{index + 1}</TableCell>
    <TableCell className="min-w-[150px] px-2 py-2 box-border text-center">{item.SIZE_INCHES || 0}</TableCell>
    <TableCell className="min-w-[150px] px-2 py-2 box-border text-center">{item.PIPE_SCHEDULE || ''}</TableCell>
    <TableCell className="min-w-[150px] px-2 py-2 box-border text-center">{item.THKNESS || 0}</TableCell>
      <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{item.SHOP_JOINTS ? Number(item.SHOP_JOINTS) : 0}</TableCell>
      <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{item.FIELD_JOINTS ? Number(item.FIELD_JOINTS) : 0}</TableCell>
      <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{item.TOTAL_JOINTS ? Number(item.TOTAL_JOINTS) : 0}</TableCell>
      <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{item.SHOP_INCH_DIA ? Number(item.SHOP_INCH_DIA) : 0}</TableCell>
      <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{item.FIELD_INCH_DIA ? Number(item.FIELD_INCH_DIA) : 0}</TableCell>
      <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{item.TOTAL_INCH_DIA ? Number(item.TOTAL_INCH_DIA) : 0}</TableCell>
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
