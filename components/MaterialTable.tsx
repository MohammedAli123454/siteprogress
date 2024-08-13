"use client";

import React, { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"; // Ensure you have these components

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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");
  const [selectedVendor, setSelectedVendor] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      return (
        (!moc || item.MOC === moc) &&
        (selectedCategory === "all" || item.Category === selectedCategory) &&
        (selectedSubCategory === "all" || item.SubCategory === selectedSubCategory) &&
        (selectedVendor === "all" || item.Vendor === selectedVendor) &&
        (selectedStatus === "all" || item.Status === selectedStatus)
      );
    });
  }, [data, moc, selectedCategory, selectedSubCategory, selectedVendor, selectedStatus]);

  const mocName = useMemo(() => {
    return moc ? (filteredData[0]?.MOCName || "Unknown MOC") : "MATERIAL SUMMARY";
  }, [filteredData, moc]);

  const truncateText = (text: string, maxLength: number) => {
    if (typeof text !== 'string') return '';
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  const filtered_Data = data.filter(item => item.MOC === moc);
// Extract unique values for filters and filter out empty values
const categories = [...new Set(filtered_Data.map((item) => item.Category).filter(Boolean))];
const subCategories = [...new Set(filtered_Data.map((item) => item.SubCategory).filter(Boolean))];
const vendors = [...new Set(filtered_Data.map((item) => item.Vendor).filter(Boolean))];
const statuses = [...new Set(filtered_Data.map((item) => item.Status).filter(Boolean))];


  return (
    <Card>
      <CardHeader className="flex flex-col justify-center text-center space-y-2">
        <CardTitle className="text-center">
          {moc ? `${moc} MATERIAL SUMMARY` : "MATERIAL SUMMARY"}
        </CardTitle>
        <CardDescription>{mocName}</CardDescription>
      </CardHeader>
      <Separator />

      {/* Filters */}
      <CardContent className="grid grid-cols-2 gap-4">
  <Select onValueChange={(value) => setSelectedCategory(value)}>
    <SelectTrigger>
      <SelectValue placeholder="Select Category" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Categories</SelectItem>
      {categories.map((category, index) => (
        <SelectItem key={index} value={category}>
          {category}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>

  <Select onValueChange={(value) => setSelectedSubCategory(value)}>
    <SelectTrigger>
      <SelectValue placeholder="Select SubCategory" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All SubCategories</SelectItem>
      {subCategories.map((subCategory, index) => (
        <SelectItem key={index} value={subCategory}>
          {subCategory}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>

  <Select onValueChange={(value) => setSelectedVendor(value)}>
    <SelectTrigger>
      <SelectValue placeholder="Select Vendor" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Vendors</SelectItem>
      {vendors.map((vendor, index) => (
        <SelectItem key={index} value={vendor}>
          {truncateText(vendor, 22)}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>

  <Select onValueChange={(value) => setSelectedStatus(value)}>
    <SelectTrigger>
      <SelectValue placeholder="Select Status" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Statuses</SelectItem>
      {statuses.map((status, index) => (
        <SelectItem key={index} value={status}>
          {status}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</CardContent>

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
                  <TableCell className="min-w-[200px]">{item.SubCategory}</TableCell>
                  <TableCell className="min-w-[350px]">
                    {truncateText(item.Description, 35)}
                  </TableCell>
                  <TableCell className="min-w-[100px]">{item.Size}</TableCell>
                  <TableCell className="min-w-[50px]">{item.Qty}</TableCell>
                  <TableCell className="min-w-[75px]">{item.UOM}</TableCell>
                  <TableCell className="min-w-[100px]">{item.MTA}</TableCell>
                  <TableCell className="min-w-[250px]">
                    {truncateText(item.Vendor, 22)}
                  </TableCell>
                  <TableCell className="min-w-[150px]">{item.EstimatedDel}</TableCell>
                  <TableCell className="min-w-[150px]">{item.TargetDate}</TableCell>
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
