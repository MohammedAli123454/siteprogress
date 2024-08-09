"use client";
import React, { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
} from '@/components/ui/table';
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle,DialogFooter } from "@/components/ui/dialog";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import ChartComponent from './BarChartComponent';

import valveData from '@/app/valvedata.json'; // Import the valve data

interface DataItem {
  MOC: string;
  'SIZE (INCHES)': number;
  'PIPE SCHEDULE': string;
  THKNESS: string;
  'SHOP JOINTS': number;
  'SHOP INCH DIA': number;
  'FIELD JOINTS': number;
  'FIELD INCH DIA': number;
  'TOTAL JOINTS': number;
  'TOTAL INCH DIA': number;
}

interface ValveDataItem {
  MOC: string;
  Type: string;
"Materials Description": string;
  Size: string;
  Qty: number;
}

interface JointSummaryTableProps {
  data: DataItem[];
  moc?: string;
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

export function JointSummaryTable({ data, moc }: JointSummaryTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [overallDialogOpen, setOverallDialogOpen] = useState(false);
  const [valveDialogOpen, setValveDialogOpen] = useState(false); // State for valve dialog
  const [showFullValveInfo, setShowFullValveInfo] = useState(false);

  const filteredData = moc ? data.filter((item) => item.MOC === moc) : data;
  const filteredValveData = moc ? valveData.filter((item) => item.MOC === moc) : [];

  const totalShopJoints = filteredData.reduce((sum, item) => sum + item['SHOP JOINTS'], 0);
  const totalFieldJoints = filteredData.reduce((sum, item) => sum + item['FIELD JOINTS'], 0);
  const totalJoints = totalShopJoints + totalFieldJoints;

  const totalShopInchDia = filteredData.reduce((sum, item) => sum + item['SHOP INCH DIA'], 0);
  const totalFieldInchDia = filteredData.reduce((sum, item) => sum + item['FIELD INCH DIA'], 0);
  const totalInchDia = totalShopInchDia + totalFieldInchDia;

   // Get the MOC Name based on the MOC passed as props
   const mocName = useMemo(() => {
    const foundMOC = data.find(item => item.MOC === moc);
    return foundMOC ? (foundMOC as any)['MOC NAME'] : 'Unknown MOC';
  }, [data, moc]);
  ;

  const jointsChartData = useMemo(
    () => [
      { metric: "Shop Joints", value: totalShopJoints },
      { metric: "Field Joints", value: totalFieldJoints },
      { metric: "Total Joints", value: totalJoints },
    ],
    [totalShopJoints, totalFieldJoints, totalJoints]
  );

  const inchDiaChartData = useMemo(
    () => [
      { metric: "Shop Inch Dia", value: totalShopInchDia },
      { metric: "Field Inch Dia", value: totalFieldInchDia },
      { metric: "Total Inch Dia", value: totalInchDia },
    ],
    [totalShopInchDia, totalFieldInchDia, totalInchDia]
  );

  const generateRow = (label: string, key: keyof DataItem, total?: number, totalLabel?: string) => (
    <TableRow className="h-6">
      <TableCell className="px-1 py-1">{label}</TableCell>
      {filteredData.map((item, index) => (
        <TableCell key={index} className="px-1 py-1">{item[key]}</TableCell>
      ))}
      <TableCell className="px-1 py-1">{totalLabel ? totalLabel : (total !== undefined ? total : 0)}</TableCell>
    </TableRow>
  );

  const generateOverallRow = (label: string, shop: number, field: number, total: number) => (
    <TableRow className="h-8 text-lg">
      <TableCell className="px-2 py-2">{label}</TableCell>
      <TableCell className="px-2 py-2">{Math.round(shop)}</TableCell>
      <TableCell className="px-2 py-2">{Math.round(field)}</TableCell>
      <TableCell className="px-2 py-2">{Math.round(total)}</TableCell>
    </TableRow>
  );

// Consolidate the valve data by Type and Size
const consolidatedValveData = filteredValveData.reduce((acc, curr) => {
  const key = `${curr.Type}-${curr.Size}`;
  if (!acc[key]) {
    acc[key] = { ...curr };
  } else {
    acc[key].Qty += curr.Qty;
  }
  return acc;
}, {} as Record<string, ValveDataItem>);

const generateValveRow = (label: string, key: keyof ValveDataItem, isFirstRow: boolean = false) => (
  <TableRow className={`h-6 ${isFirstRow ? "bg-gray-200 font-bold text-lg" : ""}`}>
    <TableCell className="px-1 py-1">{label}</TableCell>
    {Object.values(consolidatedValveData).map((item, index) => (
      <TableCell key={index} className="px-1 py-1">{item[key]}</TableCell>
    ))}
  </TableRow>
);

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-center">{moc ? `${moc} JOINT SUMMARY` : 'JOINT SUMMARY'}</CardTitle>
        <CardDescription>{mocName}</CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="overflow-auto">
        <div className="w-full overflow-x-auto">
          <Table className="w-full min-w-max">
            <TableBody>
              {generateRow('SIZE (INCHES)', 'SIZE (INCHES)', undefined, 'Total')}
              {generateRow('PIPE SCHEDULE', 'PIPE SCHEDULE')}
              {generateRow('THKNESS', 'THKNESS')}
              {generateRow('SHOP JOINTS', 'SHOP JOINTS', totalShopJoints)}
              {generateRow('SHOP INCH DIA', 'SHOP INCH DIA', totalShopInchDia)}
              {generateRow('FIELD JOINTS', 'FIELD JOINTS', totalFieldJoints)}
              {generateRow('FIELD INCH DIA', 'FIELD INCH DIA', totalFieldInchDia)}
              {generateRow('TOTAL JOINTS', 'TOTAL JOINTS', totalJoints)}
              {generateRow('TOTAL INCH DIA', 'TOTAL INCH DIA', totalInchDia)}
            </TableBody>
          </Table>
        </div>
        <Separator />
      </CardContent>
      <CardFooter className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0 lg:space-x-4">
        <div className="flex justify-center lg:justify-end w-full space-x-4 lg:w-auto">
          <Button variant="outline" onClick={() => setDialogOpen(true)}>View Chart</Button>
          <Button variant="outline" onClick={() => setOverallDialogOpen(true)}>View Summary</Button>
          <Button variant="outline" onClick={() => setValveDialogOpen(true)}>View Valve Detail</Button> {/* New Button */}
        </div>
      </CardFooter>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>{moc ? `${moc} Joints Summary Chart` : 'Joints Summary Chart'}</DialogTitle>
            <CardDescription>{mocName}</CardDescription>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>

      <Dialog open={overallDialogOpen} onOpenChange={setOverallDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Overall Joints</DialogTitle>

            <DialogTitle>{moc ? `${moc} Overall Joints` : 'Overall Joints'}</DialogTitle>
            <CardDescription>{mocName}</CardDescription>
            
          </DialogHeader>
          <div className="flex flex-col lg:flex-row">
            <div className="flex-grow">
              <h2 className="text-xl font-semibold mb-4">Overall Joint Summary</h2>
              <Table className="w-full">
                <TableBody>
                  <TableRow className="h-8 bg-gray-200 font-bold text-lg">
                    <TableCell className="px-2 py-2">Summary</TableCell>
                    <TableCell className="px-2 py-2">Shop Joints</TableCell>
                    <TableCell className="px-2 py-2">Field Joints</TableCell>
                    <TableCell className="px-2 py-2">Total</TableCell>
                  </TableRow>
                  {generateOverallRow("Overall Joints", totalShopJoints, totalFieldJoints, totalJoints)}
                  {generateOverallRow("Overall Inch Dia", totalShopInchDia, totalFieldInchDia, totalInchDia)}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={valveDialogOpen} onOpenChange={setValveDialogOpen}> {/* Valve Detail Dialog */}
  <DialogContent className="max-w-6xl">
    <DialogHeader>
      <DialogTitle>{moc ? `${moc} Valve Detail` : 'Valve Detail'}</DialogTitle>
      <CardDescription>{mocName}</CardDescription>
    </DialogHeader>
    <div className="flex flex-col lg:flex-row">
      <div className="flex-grow">
        <h2 className="text-xl font-semibold mb-4">Valve Details</h2>
        
        {showFullValveInfo ? (
          <div className="mt-4">
            <h3 className="text-lg font-bold mb-2">Full Valve Information</h3>
            <Table className="w-full">
              <TableHead>
                <TableRow>
                  <TableCell className="font-semibold w-1/6">Valve Type</TableCell>
                  <TableCell className="font-semibold w-3/5">Description</TableCell>
                  <TableCell className="font-semibold w-1/6">Size</TableCell>
                  <TableCell className="font-semibold w-1/6">Quantities</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.values(consolidatedValveData).map((item, index) => (
                  <TableRow key={index} className="h-6">
                    <TableCell className="px-1 py-1">{item.Type}</TableCell>
                    <TableCell className="px-1 py-1">{item['Materials Description']}</TableCell>
                    <TableCell className="px-1 py-1">{item.Size}</TableCell>
                    <TableCell className="px-1 py-1">{item.Qty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Table className="w-full">
            <TableBody>
              {generateValveRow("Valve Type", "Type", true)}
              {generateValveRow("Size", "Size")}
              {generateValveRow("Qty", "Qty")}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
    <DialogFooter className="w-full flex justify-between items-center">
      <Button onClick={() => setShowFullValveInfo(!showFullValveInfo)}>
        {showFullValveInfo ? "Hide Full Valves Info" : "Show Full Valves Info"}
      </Button>
      <p className="text-lg font-semibold">Total No Of Valves: {filteredValveData.reduce((sum, item) => sum + item.Qty, 0)}</p>
    </DialogFooter>
  </DialogContent>
</Dialog>


    </Card>
  );
}

export default JointSummaryTable;
