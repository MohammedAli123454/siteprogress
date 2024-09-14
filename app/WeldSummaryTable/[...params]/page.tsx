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

// The getQuery function (async to fetch data from the database)
const getQuery = async (moc: string | null, Type: string) => {
  let query;

  if (moc && Type === "TotalJoints") {
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
      .where(eq(mocDetail.moc, moc))
      .groupBy(mocDetail.moc, mocDetail.mocName);
  } else if (moc && Type === "TotalInchDia") {
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
      .where(eq(mocDetail.moc, moc))
      .groupBy(mocDetail.moc, mocDetail.mocName);
  } else if (moc && Type === "OverallJoints") {
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
      .groupBy(mocDetail.moc, mocDetail.mocName);
  } else if (moc && Type === "OverallInchDia") {
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
      .groupBy(mocDetail.moc, mocDetail.mocName);
  }

  const result = await query;
  return result as DataType[];
};

// React component to display the table
export default function WeldSummaryTable() {
  const params = useParams(); // Get the parameters from the URL
  console.log(params); // Inspect what's in params
  const moc = params?.params?.[0]; // Access the first parameter
  const Type = params?.params?.[1]; // Access the second parameter




  console.log("Moc Value" +moc);
  console.log("Type Value" +Type);


  // Call useQuery with moc and type, and handle loading state
  const { data = [], isLoading } = useQuery({
    queryKey: ["mocData", moc, Type], // Use moc and type as part of queryKey
    queryFn: () => getQuery(moc, Type), // Fetch data based on moc and type
  });

  // Calculate totals based on the type (TotalJoints or TotalInchDia)
  const grandTotalShopJoints = data.reduce((total, item) => total + Number(item.SHOP_JOINTS), 0);
  const grandTotalFieldJoints = data.reduce((total, item) => total + Number(item.FIELD_JOINTS), 0);
  const grandTotalTotalJoints = data.reduce((total, item) => total + Number(item.TOTAL_JOINTS), 0);

  const grandTotalShopInchDia = data.reduce((acc, item) => acc + Number(item.SHOP_INCH_DIA), 0);
  const grandTotalFieldInchDia = data.reduce((acc, item) => acc + Number(item.FIELD_INCH_DIA), 0);
  const grandTotalTotalInchDia = data.reduce((acc, item) => acc + Number(item.TOTAL_INCH_DIA), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {Type === 'TotalJoints' ? 'Total Joints Summary' : 'Total Inch Dia Summary'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          data.length > 0 && (
            <div className="overflow-auto mx-4">
              <Table className="w-full table-fixed">
                <TableHead>
                <TableRow className="flex w-full box-border font-bold text-lg bg-gray-200">
                  <TableCell className="font-semibold min-w-[60px] px-2 py-2 box-border text-center">Sr.No</TableCell>
                  <TableCell className="font-semibold min-w-[150px] px-2 py-2 box-border text-center">MOC</TableCell>
                  <TableCell className="font-semibold min-w-[600px] px-2 py-2 box-border">MOC Name</TableCell>
                    {Type === 'TotalJoints' ? (
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
                   <TableRow key={index} className={`flex w-full box-border ${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}>
                   <TableCell className="px-2 py-2 min-w-[60px] box-border text-center">{index + 1}</TableCell>
                   <TableCell className="px-2 py-2 min-w-[150px] box-border text-center">{item.MOC}</TableCell>
                   <TableCell className="px-2 py-2 min-w-[600px] box-border">{item.MOC_NAME}</TableCell>
                      {Type === 'TotalJoints' ? (
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
                    <TableRow className="flex w-full box-border font-bold bg-gray-300">
                  <TableCell className="px-2 py-2 min-w-[210px] box-border"></TableCell>
                  <TableCell className="px-2 py-2 min-w-[450px] box-border"></TableCell>
                  <TableCell className="px-2 py-2 min-w-[150px] box-border text-right">Grand Total</TableCell>
                    {Type === 'TotalJoints' ? (
                      <>
                       <TableCell className="px-2 py-2 min-w-[175px] box-border text-center">{grandTotalShopJoints}</TableCell>
                  <TableCell className="px-2 py-2 min-w-[175px] box-border text-center">{grandTotalFieldJoints}</TableCell>
                  <TableCell className="px-2 py-2 min-w-[175px] box-border text-center">{grandTotalTotalJoints}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="px-2 py-2 min-w-[175px] box-border text-center">{grandTotalShopInchDia}</TableCell>
                        <TableCell className="px-2 py-2 min-w-[175px] box-border text-center">{grandTotalFieldInchDia}</TableCell>
                        <TableCell className="px-2 py-2 min-w-[175px] box-border text-center">{grandTotalTotalInchDia}</TableCell>
                      </>
                    )}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
  
}
