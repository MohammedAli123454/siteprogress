"use client";
import React, { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // Ensure you have this component

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
    const foundMOC = data.find((item) => item.MOC === moc);
    return foundMOC ? foundMOC.MOCName : "Unknown MOC";
  }, [data, moc]);

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  return (
    <Card>
      <CardHeader className="flex flex-col justify-center text-center space-y-2">
        <CardTitle className="text-center">
          {moc ? `${moc} MATERIAL SUMMARY` : "MATERIAL SUMMARY"}
        </CardTitle>
        <CardDescription>{mocName}</CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="overflow-auto">
        <div className="w-full overflow-x-auto">
          <Table className="w-full">
            {/* Table Head */}
            <TableRow className="bg-gray-200">
              <TableHead className="min-w-[150px]">Category</TableHead>
              <TableHead className="min-w-[200px]">SubCategory</TableHead>
              <TableHead className="min-w-[350px]">Description</TableHead>
              <TableHead className="min-w-[100px]">Size</TableHead>
              <TableHead className="min-w-[50px]">Qty</TableHead>
              <TableHead className="min-w-[75px]">UOM</TableHead>
              <TableHead className="min-w-[100px]">MTA</TableHead>
              <TableHead className="min-w-[250px]">Vendor</TableHead>
              <TableHead className="min-w-[150px]">Est.Delivery</TableHead>
              <TableHead className="min-w-[150px]">Target Date</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="min-w-[200px]">Remarks</TableHead>
            </TableRow>

            <TableBody>
              {filteredData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="min-w-[150px]">{item.Category}</TableCell>
                  <TableCell className="min-w-[200px]">
                    {item.SubCategory}
                  </TableCell>
                  <TableCell className="min-w-[350px]">
                    {truncateText(item.Description ?? "", 35)}
                  </TableCell>
                  <TableCell className="min-w-[100px]">{item.Size}</TableCell>
                  <TableCell className="min-w-[50px]">{item.Qty}</TableCell>
                  <TableCell className="min-w-[75px]">{item.UOM}</TableCell>
                  <TableCell className="min-w-[100px]">{item.MTA}</TableCell>
                  <TableCell className="min-w-[250px]">
                    {truncateText(item.Vendor ?? "", 22)}
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    {item.EstimatedDel}
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    {item.TargetDate}
                  </TableCell>
                  <TableCell className="min-w-[100px]">
  <Badge variant={item.Status ? "outline" : "destructive"}>
    {item.Status || "Not Del."}
  </Badge>
</TableCell>
                  <TableCell className="min-w-[200px]">{item.Remarks}</TableCell>
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
