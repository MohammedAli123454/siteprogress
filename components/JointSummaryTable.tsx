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
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend,LabelList } from 'recharts';
import { Badge } from '@/components/ui/badge'; // Import the Badge component

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
        <Table className="table-fixed">
          <TableBody>
            <TableRow className="h-6 bg-gray-200 font-bold">
              <TableCell className="px-1 py-1" style={{ width: '150px' }}>SIZE (INCHES)</TableCell>
              {filteredData.map((item, index) => (
                <TableCell key={index} className="px-1 py-1">{item['SIZE (INCHES)']}</TableCell>
              ))}
              <TableCell className="px-1 py-1 font-bold">Total</TableCell>
            </TableRow>
            <TableRow className="h-6">
              <TableCell className="px-1 py-1" style={{ width: '150px' }}>PIPE SCHEDULE</TableCell>
              {filteredData.map((item, index) => (
                <TableCell key={index} className="px-1 py-1">{item['PIPE SCHEDULE']}</TableCell>
              ))}
              <TableCell className="px-1 py-1">0</TableCell>
            </TableRow>
            <TableRow className="h-6">
              <TableCell className="px-1 py-1" style={{ width: '150px' }}>THKNESS</TableCell>
              {filteredData.map((item, index) => (
                <TableCell key={index} className="px-1 py-1">{item.THKNESS}</TableCell>
              ))}
              <TableCell className="px-1 py-1">0</TableCell>
            </TableRow>
            <TableRow className="h-6">
              <TableCell className="px-1 py-1" style={{ width: '150px' }}>SHOP JOINTS</TableCell>
              {filteredData.map((item, index) => (
                <TableCell key={index} className="px-1 py-1">{item['SHOP JOINTS']}</TableCell>
              ))}
              <TableCell className="px-1 py-1">{totalShopJoints}</TableCell>
            </TableRow>
            <TableRow className="h-6">
              <TableCell className="px-1 py-1" style={{ width: '150px' }}>SHOP INCH DIA</TableCell>
              {filteredData.map((item, index) => (
                <TableCell key={index} className="px-1 py-1">{item['SHOP INCH DIA']}</TableCell>
              ))}
              <TableCell className="px-1 py-1">{totalShopInchDia}</TableCell>
            </TableRow>
            <TableRow className="h-6">
              <TableCell className="px-1 py-1" style={{ width: '150px' }}>FIELD JOINTS</TableCell>
              {filteredData.map((item, index) => (
                <TableCell key={index} className="px-1 py-1">{item['FIELD JOINTS']}</TableCell>
              ))}
              <TableCell className="px-1 py-1">{totalFieldJoints}</TableCell>
            </TableRow>
            <TableRow className="h-6">
              <TableCell className="px-1 py-1" style={{ width: '150px' }}>FIELD INCH DIA</TableCell>
              {filteredData.map((item, index) => (
                <TableCell key={index} className="px-1 py-1">{item['FIELD INCH DIA']}</TableCell>
              ))}
              <TableCell className="px-1 py-1">{totalFieldInchDia}</TableCell>
            </TableRow>
            <TableRow className="h-6">
              <TableCell className="px-1 py-1" style={{ width: '150px' }}>TOTAL JOINTS</TableCell>
              {filteredData.map((item, index) => (
                <TableCell key={index} className="px-1 py-1">{item['TOTAL JOINTS']}</TableCell>
              ))}
              <TableCell className="px-1 py-1">{totalJoints}</TableCell>
            </TableRow>
            <TableRow className="h-6">
              <TableCell className="px-1 py-1" style={{ width: '150px' }}>TOTAL INCH DIA</TableCell>
              {filteredData.map((item, index) => (
                <TableCell key={index} className="px-1 py-1">{item['TOTAL INCH DIA']}</TableCell>
              ))}
              <TableCell className="px-1 py-1">{totalInchDia}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Separator />
      </CardContent>
      <CardFooter className="overflow-auto flex">
        <div className="w-1/3">
          <Table className="table-fixed" style={{ width: 'auto' }}>
            <TableBody>
              <TableRow className="h-8 bg-gray-200 font-bold text-lg">
                <TableCell className="px-2 py-2" style={{ width: '70px' }}>Summary</TableCell>
                <TableCell className="px-2 py-2" style={{ width: '40px' }}>Shop</TableCell>
                <TableCell className="px-2 py-2" style={{ width: '40px' }}>Field</TableCell>
                <TableCell className="px-2 py-2" style={{ width: '40px' }}>Total</TableCell>
              </TableRow>
              <TableRow className="h-8 text-lg">
                <TableCell className="px-2 py-2" style={{ width: '70px' }}>Joints</TableCell>
                <TableCell className="px-2 py-2" style={{ width: '40px' }}>{Math.round(totalShopJoints)}</TableCell>
                <TableCell className="px-2 py-2" style={{ width: '40px' }}>{Math.round(totalFieldJoints)}</TableCell>
                <TableCell className="px-2 py-2" style={{ width: '40px' }}>{Math.round(totalJoints)}</TableCell>
              </TableRow>
              <TableRow className="h-8 text-lg">
                <TableCell className="px-2 py-2" style={{ width: '70px' }}>Inch Dia</TableCell>
                <TableCell className="px-2 py-2" style={{ width: '40px' }}>{Math.round(totalShopInchDia)}</TableCell>
                <TableCell className="px-2 py-2" style={{ width: '40px' }}>{Math.round(totalFieldInchDia)}</TableCell>
                <TableCell className="px-2 py-2" style={{ width: '40px' }}>{Math.round(totalInchDia)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div className="w-2/3 flex">
          <div className="flex-1">
            <h3 className="text-center text-lg">Joints</h3>
            <BarChart width={400} height={300} data={chartDataJoints}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8"  barSize={20} />
              <LabelList dataKey="value" position="center" fill="#fff" />
            </BarChart>
          </div>
          <div className="flex-1">
            <h3 className="text-center text-lg">Inch Dia</h3>
            <BarChart width={400} height={300} data={chartDataInchDia}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#82ca9d"  barSize={20} />
              <LabelList dataKey="value" position="center" fill="#fff" />
            </BarChart>
          </div>
        </div>
      </CardFooter>

    </Card>
  );
}
