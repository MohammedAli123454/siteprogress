"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableCell, TableRow, TableHead, TableBody } from "@/components/ui/table";
import { db } from "@/app/configs/db";
import { mocDetail, jointsDetail } from "@/app/configs/schema";
import { sql, eq } from "drizzle-orm";

type DataType = {
  MOC: string;
  MOC_NAME: string;
  SHOP_JOINTS: number;
  FIELD_JOINTS: number;
  TOTAL_JOINTS: number;
};

const fetchMOCData = async (): Promise<DataType[]> => {
  const result = await db
    .select({
      MOC: mocDetail.moc,
      MOC_NAME: mocDetail.mocName,
      SHOP_JOINTS: sql`SUM(${jointsDetail.shopJoints})`.as("SHOP_JOINTS"),
      FIELD_JOINTS: sql`SUM(${jointsDetail.fieldJoints})`.as("FIELD_JOINTS"),
      TOTAL_JOINTS: sql`SUM(${jointsDetail.totalJoints})`.as("TOTAL_JOINTS"),
    })
    .from(mocDetail)
    .leftJoin(jointsDetail, eq(mocDetail.moc, jointsDetail.moc))
    .groupBy(mocDetail.moc, mocDetail.mocName);

  // Directly cast the result if database guarantees types
  return result as DataType[];
};

export default function InchDiaDetailByMOC() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["mocData"],
    queryFn: fetchMOCData,
  });

  const { grandTotalShopJoints, grandTotalFieldJoints, grandTotalTotalJoints } = useMemo(() => {
    const grandTotals = data.reduce(
      (totals, item) => ({
        grandTotalShopJoints: totals.grandTotalShopJoints + item.SHOP_JOINTS,
        grandTotalFieldJoints: totals.grandTotalFieldJoints + item.FIELD_JOINTS,
        grandTotalTotalJoints: totals.grandTotalTotalJoints + item.TOTAL_JOINTS,
      }),
      { grandTotalShopJoints: 0, grandTotalFieldJoints: 0, grandTotalTotalJoints: 0 }
    );
    return grandTotals;
  }, [data]);

  const renderTableRows = () => {
    return data.map((item, index) => (
      <TableRow key={index} className="flex w-full box-border">
        <TableCell className="px-2 py-3 min-w-[60px] box-border text-center">{index + 1}</TableCell>
        <TableCell className="px-2 py-3 min-w-[150px] box-border text-center">{item.MOC}</TableCell>
        <TableCell className="px-2 py-3 min-w-[600px] box-border">{item.MOC_NAME}</TableCell>
        <TableCell className="px-2 py-3 min-w-[175px] box-border text-center">{item.SHOP_JOINTS}</TableCell>
        <TableCell className="px-2 py-3 min-w-[175px] box-border text-center">{item.FIELD_JOINTS}</TableCell>
        <TableCell className="px-2 py-3 min-w-[175px] box-border text-center">{item.TOTAL_JOINTS}</TableCell>
      </TableRow>
    ));
  };

  const renderGrandTotalRow = () => (
    <TableRow className="font-bold bg-gray-100">
      <TableCell colSpan={2}>Grand Total</TableCell>
      <TableCell>{grandTotalShopJoints}</TableCell>
      <TableCell>{grandTotalFieldJoints}</TableCell>
      <TableCell>{grandTotalTotalJoints}</TableCell>
    </TableRow>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inch Dia Detail By All MOCs</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto mx-4"> {/* Added margin for better spacing */}
            <Table className="w-full min-w-full">
              <TableHead>
                <TableRow className="flex w-full box-border font-bold text-lg bg-gray-200">
                  <TableCell className="font-semibold min-w-[60px] px-2 py-3 box-border text-center">Sr.No</TableCell>
                  <TableCell className="font-semibold min-w-[150px] px-2 py-3 box-border text-center">MOC</TableCell>
                  <TableCell className="font-semibold min-w-[600px] px-2 py-3 box-border">MOC Name</TableCell>
                  <TableCell className="font-semibold min-w-[175px] px-2 py-3 box-border text-center">Shop Joints</TableCell>
                  <TableCell className="font-semibold min-w-[175px] px-2 py-3 box-border text-center">Field Joints</TableCell>
                  <TableCell className="font-semibold min-w-[175px] px-2 py-3 box-border text-center">Total Joints</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {renderTableRows()}
                {renderGrandTotalRow()}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
