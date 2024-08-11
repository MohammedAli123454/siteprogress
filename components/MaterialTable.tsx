"use client";
import React, { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table';
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

type DataType = {
    MOC: string;
    MOCName: string;
    Category: string;
    SubCategory: string;
    Description: string;
    Size: string;
    Qty: string;
    UOM: string;
    LOI: string;
    PO: string; 
    MTA: string;
    Vendor: string;
    Mfgr: string;
    NMR601: string; 
    NMR602: string; 
    NMR603: string; 
    FAT: string;
    EstimatedDel: string;
    TargetDate: string;
    Status: string;
    Remarks: string;
};

interface MaterialTableProps {
  data: DataType[];
  moc?: string;
}

export function MaterialTable({ data, moc }: MaterialTableProps) {
  const filteredData = moc ? data.filter((item) => item.MOC === moc) : data;

  const mocName = useMemo(() => {
    const foundMOC = data.find(item => item.MOC === moc);
    return foundMOC ? foundMOC.MOCName : 'Unknown MOC';
  }, [data, moc]);

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-center">{moc ? `${moc} MATERIAL SUMMARY` : 'MATERIAL SUMMARY'}</CardTitle>
        <CardDescription>{mocName}</CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="overflow-auto">
        <div className="w-full overflow-x-auto">
          <Table className="w-full min-w-max">
            {/* Table Head */}
            <TableHead>
              <TableRow className="bg-gray-200">
                <TableCell className="font-semibold px-2 py-2">Category</TableCell>
                <TableCell className="font-semibold px-2 py-2">SubCategory</TableCell>
                <TableCell className="font-semibold px-2 py-2">Description</TableCell>
                <TableCell className="font-semibold px-2 py-2">Size</TableCell>
                <TableCell className="font-semibold px-2 py-2">Qty</TableCell>
                <TableCell className="font-semibold px-2 py-2">UOM</TableCell>
                <TableCell className="font-semibold px-2 py-2">MTA</TableCell>
                <TableCell className="font-semibold px-2 py-2">Vendor</TableCell>
                <TableCell className="font-semibold px-2 py-2">Estimated Delivery</TableCell>
                <TableCell className="font-semibold px-2 py-2">Target Date</TableCell>
                <TableCell className="font-semibold px-2 py-2">Status</TableCell>
                <TableCell className="font-semibold px-2 py-2">Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="px-2 py-2">{item.Category}</TableCell>
                  <TableCell className="px-2 py-2">{item.SubCategory}</TableCell>
                  <TableCell className="px-2 py-2">{item.Description}</TableCell>
                  <TableCell className="px-2 py-2">{item.Size}</TableCell>
                  <TableCell className="px-2 py-2">{item.Qty}</TableCell>
                  <TableCell className="px-2 py-2">{item.UOM}</TableCell>
                  <TableCell className="px-2 py-2">{item.MTA}</TableCell>
                  <TableCell className="px-2 py-2">{item.Vendor}</TableCell>
                  <TableCell className="px-2 py-2">{item.EstimatedDel}</TableCell>
                  <TableCell className="px-2 py-2">{item.TargetDate}</TableCell>
                  <TableCell className="px-2 py-2">{item.Status}</TableCell>
                  <TableCell className="px-2 py-2">{item.Remarks}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default MaterialTable;
