"use client";
import React, { useState,useMemo } from "react";
import data from "@/app/data.json";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { Bold, TrendingUp } from "lucide-react";
import MocTable from "@/components/MocTable";
import ChartComponent from "@/components/BarChartComponent";

type DataType = {
  "SIZE (INCHES)": number;
  "PIPE SCHEDULE": string;
  "THKNESS": string;
  "SHOP JOINTS": number;
  "SHOP INCH DIA": number;
  "FIELD JOINTS": number;
  "FIELD INCH DIA": number;
  "TOTAL JOINTS": number;
  "TOTAL INCH DIA": number;
  "MOC": string;
  "MOC NAME": string;
};

type MOCSummary = {
  MOC: string;
  MOC_NAME: string;
  TOTAL_JOINTS: number;
  SHOP_JOINTS: number;
  FIELD_JOINTS: number;
  TOTAL_INCH_DIA: number;
  SHOP_INCH_DIA: number;
  FIELD_INCH_DIA: number;
};

const jsonData = data as unknown as DataType[];

const calculateMOCSummary = (data: DataType[]): MOCSummary[] => {
  const summary: { [key: string]: MOCSummary } = {};

  data.forEach((item) => {
    if (!summary[item.MOC]) {
      summary[item.MOC] = {
        MOC: item.MOC,
        MOC_NAME: item["MOC NAME"],
        TOTAL_JOINTS: 0,
        SHOP_JOINTS: 0,
        FIELD_JOINTS: 0,
        TOTAL_INCH_DIA: 0,
        SHOP_INCH_DIA: 0,
        FIELD_INCH_DIA: 0,
      };
    }
    summary[item.MOC].TOTAL_JOINTS += item["TOTAL JOINTS"];
    summary[item.MOC].SHOP_JOINTS += item["SHOP JOINTS"];
    summary[item.MOC].FIELD_JOINTS += item["FIELD JOINTS"];
    summary[item.MOC].TOTAL_INCH_DIA += item["TOTAL INCH DIA"];
    summary[item.MOC].SHOP_INCH_DIA += item["SHOP INCH DIA"];
    summary[item.MOC].FIELD_INCH_DIA += item["FIELD INCH DIA"];
  });

  return Object.values(summary);
};

const mocSummaryData = calculateMOCSummary(jsonData);




const chartConfig = {
  value: {
    label: "value",
    color: "hsl(var(--chart-2))",
  },
  label: {
    color: "hsl(var(--background))",
  },
} satisfies ChartConfig;

export default function TotalJointsByMOC() {
  const [showTable, setShowTable] = useState<"joints" | "inchDia" | "chart">("joints");

  const mocSummaryData = useMemo(() => calculateMOCSummary(jsonData), [jsonData]);

  const grandTotalJoints = useMemo(
    () => mocSummaryData.reduce((acc, item) => acc + item.TOTAL_JOINTS, 0),
    [mocSummaryData]
  );

  const grandTotalShopJoints = useMemo(
    () => mocSummaryData.reduce((acc, item) => acc + item.SHOP_JOINTS, 0),
    [mocSummaryData]
  );

  const grandTotalFieldJoints = useMemo(
    () => mocSummaryData.reduce((acc, item) => acc + item.FIELD_JOINTS, 0),
    [mocSummaryData]
  );

  const grandTotalInchDia = useMemo(
    () => mocSummaryData.reduce((acc, item) => acc + item.TOTAL_INCH_DIA, 0),
    [mocSummaryData]
  );

  const grandTotalShopInchDia = useMemo(
    () => mocSummaryData.reduce((acc, item) => acc + item.SHOP_INCH_DIA, 0),
    [mocSummaryData]
  );

  const grandTotalFieldInchDia = useMemo(
    () => mocSummaryData.reduce((acc, item) => acc + item.FIELD_INCH_DIA, 0),
    [mocSummaryData]
  );


  const jointsChartData = useMemo(
    () => [
      { metric: "Shop Joints", value: grandTotalShopJoints },
      { metric: "Field Joints", value: grandTotalFieldJoints },
      { metric: "Total Joints", value: grandTotalJoints },
    ],
    [grandTotalShopJoints, grandTotalFieldJoints, grandTotalJoints]
  );
  
  const inchDiaChartData = useMemo(
    () => [
      { metric: "Shop Inch Dia", value: grandTotalShopInchDia },
      { metric: "Field Inch Dia", value: grandTotalFieldInchDia },
      { metric: "Total Inch Dia", value: grandTotalInchDia },
    ],
    [grandTotalShopInchDia, grandTotalFieldInchDia, grandTotalInchDia]
  );

  const tableHeadersJoints = [
    { label: "Sr. No", className: "font-bold w-16 p-1.5" },
    { label: "MOC", className: "font-bold w-32 p-1.5" },
    { label: "MOC NAME", className: "font-bold flex-1 p-1.5 pr-2" },
    { label: "Shop Joints", className: "font-bold w-32 p-1.5 pl-2" },
    { label: "Field Joints", className: "font-bold w-32 p-1.5" },
    { label: "Total Joints", className: "font-bold w-32 p-1.5" },
  ];
  
  const TableHeadersInchDia = [
    { label: "Sr. No", className: "font-bold w-16 p-1.5" },
    { label: "MOC", className: "font-bold w-32 p-1.5" },
    { label: "MOC NAME", className: "font-bold flex-1 p-1.5 pr-2" },
    { label: "Shop Inch Dia", className: "font-bold w-32 p-1.5 pl-2" },
    { label: "Field Inch Dia", className: "font-bold w-32 p-1.5" },
    { label: "Total Inch Dia", className: "font-bold w-32 p-1.5" },
  ];
  const tableBodyJoints = (item: MOCSummary, index: number) => [
    <TableCell key={`index-${index}`} className="w-16 p-1.5">{index + 1}</TableCell>,
    <TableCell key={`moc-${index}`} className="w-32 p-1.5">{item.MOC}</TableCell>,
    <TableCell key={`mocName-${index}`} className="flex-1 p-1.5 pr-2">{item.MOC_NAME}</TableCell>,
    <TableCell key={`shopJoints-${index}`} className="w-32 p-1.5 pl-2">{item.SHOP_JOINTS}</TableCell>,
    <TableCell key={`fieldJoints-${index}`} className="w-32 p-1.5">{item.FIELD_JOINTS}</TableCell>,
    <TableCell key={`totalJoints-${index}`} className="w-32 p-1.5">{item.TOTAL_JOINTS}</TableCell>,
  ];

  const tableBodyInchDia = (item: MOCSummary, index: number) => [
    <TableCell key={`index-${index}`} className="w-16 p-1.5">{index + 1}</TableCell>,
    <TableCell key={`moc-${index}`} className="w-32 p-1.5">{item.MOC}</TableCell>,
    <TableCell key={`mocName-${index}`} className="flex-1 p-1.5 pr-2">{item.MOC_NAME}</TableCell>,
    <TableCell key={`shopInchDia-${index}`} className="w-32 p-1.5 pl-2">{item.SHOP_INCH_DIA}</TableCell>,
    <TableCell key={`fieldInchDia-${index}`} className="w-32 p-1.5">{item.FIELD_INCH_DIA}</TableCell>,
    <TableCell key={`totalInchDia-${index}`} className="w-32 p-1.5">{item.TOTAL_INCH_DIA}</TableCell>,
  ];

  const grandTotalsJoints = [
    { label: "Grand Total", className: "w-16 p-1.5" },
    { label: "", className: "w-32 p-1.5" },
    { label: "", className: "flex-1 p-1.5 pr-2" },
    { label: grandTotalShopJoints, className: "w-32 p-1.5 pl-2" },
    { label: grandTotalFieldJoints, className: "w-32 p-1.5" },
    { label: grandTotalJoints, className: "w-32 p-1.5" },
  ];

  const grandTotalsInchDia = [
    { label: "Grand Total", className: "w-16 p-1.5" },
    { label: "", className: "w-32 p-1.5" },
    { label: "", className: "flex-1 p-1.5 pr-2" },
    { label: grandTotalShopInchDia, className: "w-32 p-1.5 pl-2" },
    { label: grandTotalFieldInchDia, className: "w-32 p-1.5" },
    { label: grandTotalInchDia, className: "w-32 p-1.5" },
  ];
  


  

  return (
    <Card className="p-4">
      <div className="flex space-x-4 mb-4">
        <Button onClick={() => setShowTable("joints")}>View Joints Detail</Button>
        <Button onClick={() => setShowTable("inchDia")}>View Inch Dia Detail</Button>
        <Button onClick={() => setShowTable("chart")}>View Chart</Button>
      </div>

      {showTable === "joints" && (
       <MocTable
       data={mocSummaryData}
       headers={tableHeadersJoints}
       columns={tableBodyJoints}
       grandTotals={grandTotalsJoints}
       title="Joints Detail By Each MOC"
     />
   )}

      {showTable === "inchDia" && (
        <MocTable
        data={mocSummaryData}
        headers={TableHeadersInchDia}
        columns={tableBodyInchDia}
        grandTotals={grandTotalsInchDia}
        title="Inch Dia Detail By Each MOC"
      />
    )}

      {showTable === "chart" && (
        <div className="flex flex-col md:flex-row w-full gap-4">
          <ChartComponent
            data={jointsChartData}
            title="Total Joints Chart"
            description="Bar chart representing total joints"
            chartConfig={chartConfig}
            className="flex-1"
          />
          <ChartComponent
            data={inchDiaChartData}
            title="Total Inch Dia Chart"
            description="Bar chart representing total inch dia"
            chartConfig={chartConfig}
            className="flex-1"
          />
        </div>
      )}
    </Card>
  );
}