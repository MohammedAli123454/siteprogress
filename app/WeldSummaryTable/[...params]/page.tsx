"use client"; // Ensure it's a client component

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableCell, TableRow, TableHead, TableBody } from "@/components/ui/table";
import { db } from "@/app/configs/db";
import { mocDetail, jointsDetail } from "@/app/configs/schema";
import { sql, eq } from "drizzle-orm";
import { useParams } from "next/navigation";
import { Loader } from 'lucide-react';
import { useMemo } from "react";
import Navbar from "@/app/NavBar/page";

type MocWiseDataType = {
  MOC: string;
  MOC_NAME: string;
  shopJoints?: number;
  fieldJoints?: number;
  totalJoints?: number;
  shopInchDia?: number;
  fieldInchDia?: number;
  totalInchDia?: number;
};

type SizeWiseDataType = {
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
const mocWiseQuery = async (moc: string, Type: string) => {
  const mocQuery = db
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

  const result = await mocQuery;
  return result as MocWiseDataType[];

};

// Query function for micro details
const sizeWiseQuery = async (moc: string, Type: string) => {
  const microQuery = db
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
    .where(moc === "*" ? sql`TRUE` : eq(mocDetail.moc, moc))
    .groupBy(jointsDetail.sizeInches, jointsDetail.thickness)
    .orderBy(sql`CAST(${jointsDetail.sizeInches} AS NUMERIC) DESC`);
  const result = await microQuery;
  return result as SizeWiseDataType[];
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

  console.log("Type=" + Type);

  // Fetch data using useQuery hook
  const { data = [], isLoading: isMocLoading, isError: isMocError, } = useQuery({

    queryKey: ["mocData", moc, Type],
    queryFn: () => mocWiseQuery(moc, Type),
    
  
  });

  // Fetch micro detail data
  const { data: microData = [], isLoading: isMicroLoading, isError: isMicroError } = useQuery({
    queryKey: ["microData", moc, Type],
    queryFn: () => sizeWiseQuery(moc, Type),
  });

  if (isMocError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Error loading MOC data. Please try again.</p>
      </div>
    );
  }
  if (isMicroError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Error loading micro details. Please try again.</p>
      </div>
    );
  }

  // Loading States
  if (isMocLoading || (showMicroDetail && isMicroLoading)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader color="blue" size={48} />;
      </div>
    );
  }

  const totals = data.reduce(
    (acc, item) => ({
      shopJoints: acc.shopJoints + Number(item.shopJoints || 0),
      fieldJoints: acc.fieldJoints + Number(item.fieldJoints || 0),
      totalJoints: acc.totalJoints + Number(item.totalJoints || 0),
      shopInchDia: acc.shopInchDia + Number(item.shopInchDia || 0),
      fieldInchDia: acc.fieldInchDia + Number(item.fieldInchDia || 0),
      totalInchDia: acc.totalInchDia + Number(item.totalInchDia || 0),
    }),
    {
      shopJoints: 0,
      fieldJoints: 0,
      totalJoints: 0,
      shopInchDia: 0,
      fieldInchDia: 0,
      totalInchDia: 0,
    }
  );

  // Helper function to render table headers based on the Type
  const renderHeaders = (Type: string) => (
    <>
      <TableCell className="min-w-[60px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Sr.No</TableCell>
      <TableCell className="min-w-[150px] px-2 py-2 box-border text-center font-bold bg-gray-100 text-lg font-sans">MOC</TableCell>
      <TableCell className="min-w-[600px] px-2 py-2 box-border font-bold bg-gray-100 text-lg font-sans">MOC Name</TableCell>
      {Type.includes("Joints") ? (
        <>
          <TableCell className="min-w-[175px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Shop Joints</TableCell>
          <TableCell className="min-w-[175px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Field Joints</TableCell>
          <TableCell className="min-w-[175px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Total Joints</TableCell>
        </>
      ) : (
        <>
          <TableCell className="min-w-[175px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Shop Inch Dia</TableCell>
          <TableCell className="min-w-[175px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Field Inch Dia</TableCell>
          <TableCell className="min-w-[175px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Total Inch Dia</TableCell>
        </>
      )}
    </>
  );


  // Helper function to render table headers based on the Type
  const renderMicroTableHeaders = (Type: string) => (
    <>

      <TableCell className="min-w-[60px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Sr.No</TableCell>
      <TableCell className="min-w-[150px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Size (Inches)</TableCell>
      <TableCell className="min-w-[150px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Thickness</TableCell>

      {Type.includes("Joints") ? (
        <>
          <TableCell className="min-w-[175px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Shop Joints</TableCell>
          <TableCell className="min-w-[175px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Field Joints</TableCell>
          <TableCell className="min-w-[175px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Total Joints</TableCell>
        </>
      ) : (
        <>
          <TableCell className="min-w-[175px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Shop Inch Dia</TableCell>
          <TableCell className="min-w-[175px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Field Inch Dia</TableCell>
          <TableCell className="min-w-[175px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Total Inch Dia</TableCell>
        </>
      )}
    </>
  );

  // Helper function to render table rows
  const renderRows = (data: MocWiseDataType[], Type: string) =>
    data.map((item, index) => (
      <TableRow key={index} className="flex w-full box-border">
        <TableCell className="min-w-[60px] px-2 py-2 box-border text-center ">{index + 1}</TableCell>
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

    ));

  const renderMicroTableRows = (microData: SizeWiseDataType[], Type: string) =>
    microData.map((item, index) => (
      <TableRow key={index} className="flex w-full box-border">
        <TableCell className="min-w-[60px] px-2 py-2 box-border text-center">{index + 1}</TableCell>
        <TableCell className="min-w-[150px] px-2 py-2 box-border text-center">{item.SIZE_INCHES || 0}</TableCell>
        <TableCell className="min-w-[150px] px-2 py-2 box-border text-center">{item.THKNESS || 0}</TableCell>
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

    ));

  // Helper function to render footer row
  const renderFooterRow = (totals: any, Type: string) => (

    <TableRow className="flex w-full box-border font-bold">
      <TableCell className="px-2 py-2 min-w-[210px] box-border"></TableCell>
      <TableCell className="px-2 py-2 min-w-[450px] box-border"></TableCell>
      <TableCell className="px-2 py-2 min-w-[150px] box-border text-right">Grand Total</TableCell>
      {Type.includes("Joints") ? (
        <>

          <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{totals.shopJoints}</TableCell>
          <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{totals.fieldJoints}</TableCell>
          <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{totals.totalJoints}</TableCell>
        </>
      ) : (
        <>
          <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{totals.shopInchDia}</TableCell>
          <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{totals.fieldInchDia}</TableCell>
          <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{totals.totalInchDia}</TableCell>
        </>
      )}
    </TableRow>
  );


  // Helper function to render footer row
  const renderMicroTableFooterRow = (totals: any, Type: string) => (

    <TableRow className="sticky flex w-full box-border font-bold">
      <TableCell className="px-2 py-2 min-w-[60px] box-border"></TableCell>
      <TableCell className="px-2 py-2 min-w-[150px] box-border"></TableCell>
      <TableCell className="px-2 py-2 min-w-[150px] box-border text-right">Grand Total</TableCell>
      {Type.includes("Joints") ? (
        <>

          <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{totals.shopJoints}</TableCell>
          <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{totals.fieldJoints}</TableCell>
          <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{totals.totalJoints}</TableCell>
        </>
      ) : (
        <>
          <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{totals.shopInchDia}</TableCell>
          <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{totals.fieldInchDia}</TableCell>
          <TableCell className="min-w-[175px] px-2 py-2 box-border text-center">{totals.totalInchDia}</TableCell>
        </>
      )}
    </TableRow>
  );

  return (
    <Card>
      <CardHeader className="grid grid-cols-6 items-center justify-between p-1 text-lg font-sans font-bold">
        {/* First div with 80% width, centered content */}
        <div className="col-span-5 text-center">
          {!showMicroDetail ? (
            Type === 'Joints' ?
              "Joints Detail by Listed MOC’s and Projects" :
              "Inch Dia Detail by Listed MOC’s and Projects"
          ) : (
            Type === 'Joints' ?
              "Joints Detail By Pipe Size and Pipe Thickness" :
              "Inch Dia Detail By Pipe Size and Pipe Thickness"
          )}
        </div>

        {/* Second div with 20% width for the toggle button */}
        <div className="col-span-1">
          <button
            className="ml-4 px-2 py-2 bg-blue-500 text-white"
            onClick={handleToggle}
          >
            {showMicroDetail ? "Hide Details" : "Show Micro Details"}
          </button>
        </div>
      </CardHeader>


      <CardContent className="flex justify-center items-center">
        {/* Conditionally Render Moc Wise Detail Table or Micro Detail Table */}
        {!showMicroDetail ? (
          // Moc Wise Detail Table (Default View)
          <div className="overflow-auto max-h-[550px] mx-4 mt-2">
          <Table className="w-full table-fixed">
            <TableHead className="fixed">
                {renderHeaders(Type)}
              </TableHead>
              <TableBody>
                {renderRows(data, Type)}
                {renderFooterRow(totals, Type)}
              </TableBody>
            </Table>
          </div>
        ) : (
          // Micro Detail Table (Shown when toggled)
          <div className="overflow-auto max-h-[550px] mx-4 mt-2">
          <Table className="w-full table-fixed">
            <TableHead className="fixed">
                {renderMicroTableHeaders(Type)}
            </TableHead>
            <TableBody>
              {renderMicroTableRows(microData, Type)}
              {renderMicroTableFooterRow(totals, Type)}
            </TableBody>
          </Table>
        </div>
        
        )}
      </CardContent>

    </Card>

  );

}







