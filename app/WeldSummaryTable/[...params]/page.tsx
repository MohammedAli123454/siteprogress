"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Table, TableCell, TableRow, TableHead, TableHeader, TableBody } from "@/components/ui/table";
import { useParams } from "next/navigation";
import { Loader } from "lucide-react";
import type { MocWiseDataRow, NumericValue, SizeWiseDataRow } from "@/lib/weld-types";

type MocWiseDataType = MocWiseDataRow;
type SizeWiseDataType = SizeWiseDataRow;

type WeldTotals = {
  shopJoints: number;
  fieldJoints: number;
  totalJoints: number;
  shopInchDia: number;
  fieldInchDia: number;
  totalInchDia: number;
};

const fetchWeldDetail = async <T,>(moc: string, Type: string, scope: "summary" | "pipe-size") => {
  const params = new URLSearchParams({ moc, type: Type, scope });
  const response = await fetch(`/api/weld-detail?${params.toString()}`, {
    cache: "no-store",
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || "Failed to load weld detail.");
  }

  return (payload.data ?? []) as T[];
};

const toNumber = (value: NumericValue) => Number(value || 0);

export default function WeldSummaryTable() {
  const [showMicroDetail, setShowMicroDetail] = useState(false);

  const handleToggle = () => {
    setShowMicroDetail(!showMicroDetail);
  };

  const params = useParams();
  const moc: string = params?.params?.[0] ?? "";
  const Type: string = params?.params?.[1] ?? "";

  const { data = [], isLoading: isMocLoading, isError: isMocError, } = useQuery({
    queryKey: ["mocData", moc, Type],
    queryFn: () => fetchWeldDetail<MocWiseDataType>(moc, Type, "summary"),
    retry: 1,
  });

  const { data: microData = [], isLoading: isMicroLoading, isError: isMicroError } = useQuery({
    queryKey: ["microData", moc, Type],
    queryFn: () => fetchWeldDetail<SizeWiseDataType>(moc, Type, "pipe-size"),
    retry: 1,
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

  if (isMocLoading || (showMicroDetail && isMicroLoading)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader color="blue" size={48} />
      </div>
    );
  }

  const totals = data.reduce(
    (acc, item) => ({
      shopJoints: acc.shopJoints + toNumber(item.shopJoints),
      fieldJoints: acc.fieldJoints + toNumber(item.fieldJoints),
      totalJoints: acc.totalJoints + toNumber(item.totalJoints),
      shopInchDia: acc.shopInchDia + toNumber(item.shopInchDia),
      fieldInchDia: acc.fieldInchDia + toNumber(item.fieldInchDia),
      totalInchDia: acc.totalInchDia + toNumber(item.totalInchDia),
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

  const renderHeaders = (Type: string) => (
    <>
      <TableHead className="min-w-[60px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Sr.No</TableHead>
      <TableHead className="min-w-[150px] px-2 py-2 box-border text-center font-bold bg-gray-100 text-lg font-sans">MOC</TableHead>
      <TableHead className="min-w-[600px] px-2 py-2 box-border font-bold bg-gray-100 text-lg font-sans">MOC Name</TableHead>
      {Type.includes("Joints") ? (
        <>
          <TableHead className="min-w-[175px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Shop Joints</TableHead>
          <TableHead className="min-w-[175px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Field Joints</TableHead>
          <TableHead className="min-w-[175px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Total Joints</TableHead>
        </>
      ) : (
        <>
          <TableHead className="min-w-[175px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Shop Inch Dia</TableHead>
          <TableHead className="min-w-[175px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Field Inch Dia</TableHead>
          <TableHead className="min-w-[175px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Total Inch Dia</TableHead>
        </>
      )}
    </>
  );

  const renderMicroTableHeaders = (Type: string) => (
    <>

      <TableHead className="min-w-[60px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Sr.No</TableHead>
      <TableHead className="min-w-[150px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Size (Inches)</TableHead>
      <TableHead className="min-w-[150px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Thickness</TableHead>

      {Type.includes("Joints") ? (
        <>
          <TableHead className="min-w-[175px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Shop Joints</TableHead>
          <TableHead className="min-w-[175px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Field Joints</TableHead>
          <TableHead className="min-w-[175px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Total Joints</TableHead>
        </>
      ) : (
        <>
          <TableHead className="min-w-[175px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Shop Inch Dia</TableHead>
          <TableHead className="min-w-[175px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Field Inch Dia</TableHead>
          <TableHead className="min-w-[175px] px-2 py-2 text-center font-bold bg-gray-100 text-lg font-sans">Total Inch Dia</TableHead>
        </>
      )}
    </>
  );

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

  const renderFooterRow = (totals: WeldTotals, Type: string) => (
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

  const renderMicroTableFooterRow = (totals: WeldTotals, Type: string) => (
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
        {!showMicroDetail ? (
          <div className="overflow-auto max-h-[550px] mx-4 mt-2">
          <Table className="w-full table-fixed">
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="flex w-full box-border">
                {renderHeaders(Type)}
              </TableRow>
            </TableHeader>
              <TableBody>
                {renderRows(data, Type)}
                {renderFooterRow(totals, Type)}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="overflow-auto max-h-[550px] mx-4 mt-2">
          <Table className="w-full table-fixed">
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="flex w-full box-border">
                {renderMicroTableHeaders(Type)}
              </TableRow>
            </TableHeader>
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


