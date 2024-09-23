"use client"; // Ensure it's a client component

import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableCell, TableRow, TableHead, TableBody } from "@/components/ui/table";
import { db } from "@/app/configs/db";
import { mocDetail, jointsDetail } from "@/app/configs/schema";
import { sql, eq } from "drizzle-orm";
import { useParams } from "next/navigation"; // Use this instead of useRouter

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
      // If '*' is passed, select all records, otherwise filter by moc
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

// React component to display the table
export default function WeldSummaryTable() {
  const params = useParams(); // Get the parameters from the URL
  const moc = params?.params?.[0]; // Access the first parameter
  const Type = params?.params?.[1]; // Access the second parameter

  // Fetch data using useQuery hook
  const { data = [], isLoading } = useQuery({
    queryKey: ["mocData", moc, Type],
    queryFn: () => getQuery(moc, Type),
  });

   // Precompute totals
   const totals = data.reduce(
    (acc, item) => {
      // Ensure valid numbers are used for each field
      const shopJoints = Number(item.SHOP_JOINTS || 0);
      const fieldJoints = Number(item.FIELD_JOINTS || 0);
      const totalJoints = Number(item.TOTAL_JOINTS || 0);

      const shopInchDia = Number(item.SHOP_INCH_DIA || 0);
      const fieldInchDia = Number(item.FIELD_INCH_DIA || 0);
      const totalInchDia = Number(item.TOTAL_INCH_DIA || 0);
  
      if (Type.includes("Joints")) {
        // Accumulate joint totals
        acc.gshopJoints += shopJoints;
        acc.gfieldJoints += fieldJoints;
        acc.gtotalJoints += totalJoints;
      } else {
        // Accumulate inch dia totals
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
                    <TableCell className="px-2 py-2 min-w-[60px] box-border text-center">{index + 1}</TableCell>
                    <TableCell className="px-2 py-2 min-w-[150px] box-border text-center">{item.MOC}</TableCell>
                    <TableCell className="px-2 py-2 min-w-[600px] box-border">{item.MOC_NAME}</TableCell>
                    {Type.includes("Joints") ? (
                      <>
                        <TableCell className="px-2 py-2 min-w-[175px] box-border text-center">{item.SHOP_JOINTS}</TableCell>
                        <TableCell className="px-2 py-2 min-w-[175px] box-border text-center">{item.FIELD_JOINTS}</TableCell>
                        <TableCell className="px-2 py-2 min-w-[175px] box-border text-center">{item.TOTAL_JOINTS}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="px-2 py-2 min-w-[175px] box-border text-center">{item.SHOP_INCH_DIA}</TableCell>
                        <TableCell className="px-2 py-2 min-w-[175px] box-border text-center">{item.FIELD_INCH_DIA}</TableCell>
                        <TableCell className="px-2 py-2 min-w-[175px] box-border text-center">{item.TOTAL_INCH_DIA}</TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
                {/* Grand totals */}
                <TableRow className="flex w-full box-border font-bold">
                  <TableCell className="px-2 py-2 min-w-[210px] box-border"></TableCell>
                  <TableCell className="px-2 py-2 min-w-[450px] box-border"></TableCell>
                  <TableCell className="px-2 py-2 min-w-[150px] box-border text-right">Grand Total</TableCell>
                  {Type.includes("Joints") ? (
                    <>
                      <TableCell className="px-2 py-2 min-w-[175px] box-border text-center">{totals.gshopJoints}</TableCell>
                      <TableCell className="px-2 py-2 min-w-[175px] box-border text-center">{totals.gfieldJoints}</TableCell>
                      <TableCell className="px-2 py-2 min-w-[175px] box-border text-center">{totals.gtotalJoints}</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="px-2 py-2 min-w-[175px] box-border text-center">{totals.gshopInchDia}</TableCell>
                      <TableCell className="px-2 py-2 min-w-[175px] box-border text-center">{totals.gfieldInchDia}</TableCell>
                      <TableCell className="px-2 py-2 min-w-[175px] box-border text-center">{totals.gtotalInchDia}</TableCell>
                    </>
                  )}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

