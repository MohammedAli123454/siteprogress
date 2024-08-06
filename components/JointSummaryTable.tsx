"use client";
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LabelList } from 'recharts';

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

interface JointSummaryTableProps {
  data: DataItem[];
  moc?: string; // Make moc optional
}

export function JointSummaryTable({ data, moc }: JointSummaryTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [overallDialogOpen, setOverallDialogOpen] = useState(false);

  const filteredData = moc ? data.filter((item) => item.MOC === moc) : data;

  const totalShopJoints = filteredData.reduce((sum, item) => sum + item['SHOP JOINTS'], 0);
  const totalFieldJoints = filteredData.reduce((sum, item) => sum + item['FIELD JOINTS'], 0);
  const totalJoints = totalShopJoints + totalFieldJoints;

  const totalShopInchDia = filteredData.reduce((sum, item) => sum + item['SHOP INCH DIA'], 0);
  const totalFieldInchDia = filteredData.reduce((sum, item) => sum + item['FIELD INCH DIA'], 0);
  const totalInchDia = totalShopInchDia + totalFieldInchDia;

  const chartDataJoints = [
    { name: 'Shop', value: totalShopJoints },
    { name: 'Field', value: totalFieldJoints },
  ];

  const chartDataInchDia = [
    { name: 'Shop', value: totalShopInchDia },
    { name: 'Field', value: totalFieldInchDia },
  ];

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-center">{moc ? `${moc} JOINT SUMMARY` : 'JOINT SUMMARY'}</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="overflow-auto">
        <div className="w-full overflow-x-auto">
          <Table className="w-full min-w-max">
            <TableBody>
              <TableRow className="h-6 bg-gray-200 font-bold">
                <TableCell className="px-1 py-1">SIZE (INCHES)</TableCell>
                {filteredData.map((item, index) => (
                  <TableCell key={index} className="px-1 py-1">{item['SIZE (INCHES)']}</TableCell>
                ))}
                <TableCell className="px-1 py-1 font-bold">Total</TableCell>
              </TableRow>
              <TableRow className="h-6">
                <TableCell className="px-1 py-1">PIPE SCHEDULE</TableCell>
                {filteredData.map((item, index) => (
                  <TableCell key={index} className="px-1 py-1">{item['PIPE SCHEDULE']}</TableCell>
                ))}
                <TableCell className="px-1 py-1">0</TableCell>
              </TableRow>
              <TableRow className="h-6">
                <TableCell className="px-1 py-1">THKNESS</TableCell>
                {filteredData.map((item, index) => (
                  <TableCell key={index} className="px-1 py-1">{item.THKNESS}</TableCell>
                ))}
                <TableCell className="px-1 py-1">0</TableCell>
              </TableRow>
              <TableRow className="h-6">
                <TableCell className="px-1 py-1">SHOP JOINTS</TableCell>
                {filteredData.map((item, index) => (
                  <TableCell key={index} className="px-1 py-1">{item['SHOP JOINTS']}</TableCell>
                ))}
                <TableCell className="px-1 py-1">{totalShopJoints}</TableCell>
              </TableRow>
              <TableRow className="h-6">
                <TableCell className="px-1 py-1">SHOP INCH DIA</TableCell>
                {filteredData.map((item, index) => (
                  <TableCell key={index} className="px-1 py-1">{item['SHOP INCH DIA']}</TableCell>
                ))}
                <TableCell className="px-1 py-1">{totalShopInchDia}</TableCell>
              </TableRow>
              <TableRow className="h-6">
                <TableCell className="px-1 py-1">FIELD JOINTS</TableCell>
                {filteredData.map((item, index) => (
                  <TableCell key={index} className="px-1 py-1">{item['FIELD JOINTS']}</TableCell>
                ))}
                <TableCell className="px-1 py-1">{totalFieldJoints}</TableCell>
              </TableRow>
              <TableRow className="h-6">
                <TableCell className="px-1 py-1">FIELD INCH DIA</TableCell>
                {filteredData.map((item, index) => (
                  <TableCell key={index} className="px-1 py-1">{item['FIELD INCH DIA']}</TableCell>
                ))}
                <TableCell className="px-1 py-1">{totalFieldInchDia}</TableCell>
              </TableRow>
              <TableRow className="h-6">
                <TableCell className="px-1 py-1">TOTAL JOINTS</TableCell>
                {filteredData.map((item, index) => (
                  <TableCell key={index} className="px-1 py-1">{item['TOTAL JOINTS']}</TableCell>
                ))}
                <TableCell className="px-1 py-1">{totalJoints}</TableCell>
              </TableRow>
              <TableRow className="h-6">
                <TableCell className="px-1 py-1">TOTAL INCH DIA</TableCell>
                {filteredData.map((item, index) => (
                  <TableCell key={index} className="px-1 py-1">{item['TOTAL INCH DIA']}</TableCell>
                ))}
                <TableCell className="px-1 py-1">{totalInchDia}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <Separator />
      </CardContent>
      <CardFooter className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0 lg:space-x-4">
        <div className="flex justify-center lg:justify-end w-full space-x-4 lg:w-auto">
          <Button variant="outline" onClick={() => setDialogOpen(true)}>View Chart</Button>
          <Button variant="outline" onClick={() => setOverallDialogOpen(true)}>View Summary</Button>
        </div>
      </CardFooter>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{moc ? `${moc} Joints Summary Chart` : 'Joints Summary Chart'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col md:flex-row justify-center md:justify-between my-4">
          <div className="w-full md:w-1/2 lg:w-1/3 p-2">
              <BarChart width={400} height={300} data={chartDataJoints}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8">
                  <LabelList dataKey="value" position="top" />
                </Bar>
              </BarChart>
            </div>
            <div className="w-full md:w-1/2 lg:w-1/3 p-2">
              <BarChart width={400} height={300} data={chartDataInchDia}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#82ca9d">
                  <LabelList dataKey="value" position="top" />
                </Bar>
              </BarChart>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={overallDialogOpen} onOpenChange={setOverallDialogOpen}>
      <DialogContent>
          <DialogHeader>
            <DialogTitle>Overall Joints</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col lg:flex-row">
            <div className="flex-grow">
              <h2 className="text-xl font-semibold mb-4">Overall Joint Summary</h2>
              <Table className="w-full">
                <TableBody>
                  <TableRow className="h-8 bg-gray-200 font-bold text-lg">
                    <TableCell className="px-2 py-2">Summary</TableCell>
                    <TableCell className="px-2 py-2">Shop</TableCell>
                    <TableCell className="px-2 py-2">Field</TableCell>
                    <TableCell className="px-2 py-2">Total</TableCell>
                  </TableRow>
                  <TableRow className="h-8 text-lg">
                    <TableCell className="px-2 py-2">Joints</TableCell>
                    <TableCell className="px-2 py-2">{Math.round(totalShopJoints)}</TableCell>
                    <TableCell className="px-2 py-2">{Math.round(totalFieldJoints)}</TableCell>
                    <TableCell className="px-2 py-2">{Math.round(totalJoints)}</TableCell>
                  </TableRow>
                  <TableRow className="h-8 text-lg">
                    <TableCell className="px-2 py-2">Inch Dia</TableCell>
                    <TableCell className="px-2 py-2">{Math.round(totalShopInchDia)}</TableCell>
                    <TableCell className="px-2 py-2">{Math.round(totalFieldInchDia)}</TableCell>
                    <TableCell className="px-2 py-2">{Math.round(totalInchDia)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>

      </Dialog>
    </Card>
  );
}
