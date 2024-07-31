import React from 'react';
import data from '@/app/data.json';
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
} from "@/components/ui/card";

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
  TOTAL_INCH_DIA: number;
};

const jsonData = data as unknown as DataType[];

const calculateMOCSummary = (data: DataType[]): MOCSummary[] => {
  const summary: { [key: string]: MOCSummary } = {};

  data.forEach(item => {
    if (!summary[item.MOC]) {
      summary[item.MOC] = {
        MOC: item.MOC,
        MOC_NAME: item["MOC NAME"],
        TOTAL_JOINTS: 0,
        TOTAL_INCH_DIA: 0
      };
    }
    summary[item.MOC].TOTAL_JOINTS += item['TOTAL JOINTS'];
    summary[item.MOC].TOTAL_INCH_DIA += item['TOTAL INCH DIA'];
  });

  return Object.values(summary);
};

const mocSummaryData = calculateMOCSummary(jsonData);

// Calculate grand totals
const grandTotalJoints = mocSummaryData.reduce((acc, item) => acc + item.TOTAL_JOINTS, 0);
const grandTotalInchDia = mocSummaryData.reduce((acc, item) => acc + item.TOTAL_INCH_DIA, 0);

export default function TotalJointsByMOC() {
  return (
    <Card className="p-4">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="flex sticky top-0 bg-gray-200">
            <TableCell className="font-bold w-16 p-1.5">Sr. No</TableCell>
            <TableCell className="font-bold w-32 p-1.5">MOC</TableCell>
            <TableCell className="font-bold flex-1 p-1.5 pr-2">MOC NAME</TableCell>
            <TableCell className="font-bold w-32 p-1.5 pl-2">Total Joints</TableCell>
            <TableCell className="font-bold w-32 p-1.5">Total Inch Dia</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mocSummaryData.map((moc, index) => (
            <TableRow key={moc.MOC} className={`flex ${index % 2 === 0 ? "bg-gray-100" : ""}`}>
              <TableCell className="w-16 p-1.5">{index + 1}</TableCell>
              <TableCell className="w-32 p-1.5">{moc.MOC}</TableCell>
              <TableCell className="flex-1 p-1.5 pr-2">{moc.MOC_NAME}</TableCell>
              <TableCell className="w-32 p-1.5 pl-2">{moc.TOTAL_JOINTS}</TableCell>
              <TableCell className="w-32 p-1.5">{moc.TOTAL_INCH_DIA}</TableCell>
            </TableRow>
          ))}
          <TableRow className="flex bg-gray-200 font-bold">
            <TableCell className="w-16 p-1.5">Grand Total</TableCell>
            <TableCell className="w-32 p-1.5"></TableCell>
            <TableCell className="flex-1 p-1.5 pr-2"></TableCell>
            <TableCell className="w-32 p-1.5 pl-2">{grandTotalJoints}</TableCell>
            <TableCell className="w-32 p-1.5">{grandTotalInchDia}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  );
}
