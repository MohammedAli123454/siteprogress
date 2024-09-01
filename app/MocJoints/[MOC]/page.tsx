'use client'

import { useQuery } from '@tanstack/react-query';
import { Table,TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
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
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import ChartComponent from '@/components/BarChartComponent';

async function fetchPivotedData(moc: string) {
  const rawData = await db
    .select({
      sizeInches: jointsDetail.sizeInches,
      pipeSchedule: jointsDetail.pipeSchedule,
      thickness: jointsDetail.thickness,
      shopJoints: sql`SUM(${jointsDetail.shopJoints})`.as('shopJoints'),
      shopInchDia: sql`SUM(${jointsDetail.shopInchDia})`.as('shopInchDia'),
      fieldJoints: sql`SUM(${jointsDetail.fieldJoints})`.as('fieldJoints'),
      fieldInchDia: sql`SUM(${jointsDetail.fieldInchDia})`.as('fieldInchDia'),
      totalJoints: sql`SUM(${jointsDetail.totalJoints})`.as('totalJoints'),
      totalInchDia: sql`SUM(${jointsDetail.totalInchDia})`.as('totalInchDia'),
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

  // Prepare chart data in the format needed for the charts
  const jointsChartData = [
    { metric: "Shop Joints", value: rawData.reduce((acc, row) => acc + (Number(row.shopJoints) || 0), 0) },
    { metric: "Field Joints", value: rawData.reduce((acc, row) => acc + (Number(row.fieldJoints) || 0), 0) },
    { metric: "Total Joints", value: rawData.reduce((acc, row) => acc + (Number(row.totalJoints) || 0), 0) },
  ];

  const inchDiaChartData = [
    { metric: "Shop Inch Dia", value: rawData.reduce((acc, row) => acc + (Number(row.shopInchDia) || 0), 0) },
    { metric: "Field Inch Dia", value: rawData.reduce((acc, row) => acc + (Number(row.fieldInchDia) || 0), 0) },
    { metric: "Total Inch Dia", value: rawData.reduce((acc, row) => acc + (Number(row.totalInchDia) || 0), 0) },
  ];

  // Prepare summary data
  const summary = {
    overallJoints: {
      shopJoints: jointsChartData[0].value,
      fieldJoints: jointsChartData[1].value,
      totalJoints: jointsChartData[2].value,
    },
    overallInchDia: {
      shopInchDia: inchDiaChartData[0].value,
      fieldInchDia: inchDiaChartData[1].value,
      totalInchDia: inchDiaChartData[2].value,
    },
  };

  return {
    pivotedData,
    jointsChartData,
    inchDiaChartData,
    summary,
  };
}

const chartConfig = {
  value: {
    label: "value",
    color: "hsl(var(--chart-2))",
  },
  label: {
    color: "hsl(var(--background))",
  },
} satisfies ChartConfig;


// This is your page component, which fetches data and renders it
export default function MOCJoints({ params }: { params: { MOC: string } }) {
  const moc = params.MOC;

  // Use React Query to fetch data
  const { data, isLoading, error } = useQuery({
    queryKey: ['pivotedData', moc],
    queryFn: () => fetchPivotedData(moc),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error fetching data</div>;
  }

  const { pivotedData, jointsChartData, inchDiaChartData,summary } = data!;

  return (
    <div className="m-4">
      <Card className="w-full">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-center">
            {moc ? `${moc} JOINT SUMMARY` : 'JOINT SUMMARY'}
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

<TableCell className="px-2 py-1">
          {row.Attribute === 'SHOP JOINTS' && jointsChartData.find(data => data.metric === 'Shop Joints')?.value}
          {row.Attribute === 'FIELD JOINTS' && jointsChartData.find(data => data.metric === 'Field Joints')?.value}
          {row.Attribute === 'TOTAL JOINTS' && jointsChartData.find(data => data.metric === 'Total Joints')?.value}
          {row.Attribute === 'SHOP INCH DIA' && inchDiaChartData.find(data => data.metric === 'Shop Inch Dia')?.value}
          {row.Attribute === 'FIELD INCH DIA' && inchDiaChartData.find(data => data.metric === 'Field Inch Dia')?.value}
          {row.Attribute === 'TOTAL INCH DIA' && inchDiaChartData.find(data => data.metric === 'Total Inch Dia')?.value}
        </TableCell>


                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row justify-center md:justify-between my-4">
        <div className="w-full md:w-1/2 lg:w-1/2 p-1">
          <ChartComponent
            data={jointsChartData}
            title="Total Joints Chart"
            description="Bar chart representing total joints"
            chartConfig={chartConfig}
            className="flex-1"
          />
        </div>
        <div className="w-full md:w-1/2 lg:w-1/2 p-1">
          <ChartComponent
            data={inchDiaChartData}
            title="Total Inch Chart"
            description="Bar chart representing total joints"
            chartConfig={chartConfig}
            className="flex-1"
          />
        </div>
      </div>

      <Table className="w-full">
    <TableBody>
      <TableRow className="h-8 bg-gray-200 font-bold text-lg">
        <TableCell className="px-2 py-2">Summary</TableCell>
        <TableCell className="px-2 py-2">Shop Joints</TableCell>
        <TableCell className="px-2 py-2">Field Joints</TableCell>
        <TableCell className="px-2 py-2">Total</TableCell>
      </TableRow>

      <TableRow>
        <TableCell className="font-semibold px-2 py-1">Overall Joints</TableCell>
        <TableCell className="px-2 py-2">{summary.overallJoints.shopJoints}</TableCell>
        <TableCell className="px-2 py-2">{summary.overallJoints.fieldJoints}</TableCell>
        <TableCell className="px-2 py-1">{summary.overallJoints.totalJoints}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell className="font-semibold px-2 py-1">Overall Inch Dia</TableCell>
        <TableCell className="px-2 py-2">{summary.overallInchDia.shopInchDia}</TableCell>
        <TableCell className="px-2 py-2">{summary.overallInchDia.fieldInchDia}</TableCell>
        <TableCell className="px-2 py-2">{summary.overallInchDia.totalInchDia}</TableCell>
      </TableRow>
    </TableBody>
  </Table>
    </div>
  );
}
