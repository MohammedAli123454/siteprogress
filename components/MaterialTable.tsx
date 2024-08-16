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
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"; 
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

const MaterialTable: React.FC<MaterialTableProps> = ({ data, moc }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");
  const [selectedVendor, setSelectedVendor] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedSubCategory("all");
    setSelectedVendor("all");
    setSelectedStatus("all");
  };

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

  const filteredCategories = useMemo(() => {
    return [...new Set(data.filter((item) => !moc || item.MOC === moc).map((item) => item.Category).filter(Boolean))];
  }, [data, moc]);

  const filteredSubCategories = useMemo(() => {
    return [...new Set(data.filter((item) => (!moc || item.MOC === moc) &&
      (selectedCategory === "all" || item.Category === selectedCategory)).map((item) => item.SubCategory).filter(Boolean))];
  }, [data, selectedCategory, moc]);

  const filteredVendors = useMemo(() => {
    return [...new Set(data.filter((item) => (!moc || item.MOC === moc) && 
      (selectedCategory === "all" || item.Category === selectedCategory))
      .map((item) => item.Vendor).filter(Boolean))];
  }, [data, selectedCategory, moc]);

  const filteredStatuses = useMemo(() => {
    return [...new Set(data.filter((item) => (!moc || item.MOC === moc) && 
      (selectedCategory === "all" || item.Category === selectedCategory))
      .map((item) => item.Status).filter(Boolean))];
  }, [data, selectedCategory, moc]);

  const handleRun = () => {
    setIsDialogOpen(false); // Close the dialog when "Run" is clicked
  };

  return (
    <Card>
      <CardHeader className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        <CardDescription className="sm:col-span-10 text-sm flex justify-start space-x-2">
          <span>{moc ? `${moc} - ${mocName}` : null}</span>
          <span>- Material Detail</span>
        </CardDescription>

        <div className="sm:col-span-2 flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Open Filters</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Select Filters</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {filteredCategories.map((category, index) => (
                      <SelectItem key={index} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedSubCategory} onValueChange={setSelectedSubCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select SubCategory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All SubCategories</SelectItem>
                    {filteredSubCategories.map((subCategory, index) => (
                      <SelectItem key={index} value={subCategory}>
                        {subCategory}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vendors</SelectItem>
                    {filteredVendors.map((vendor, index) => (
                      <SelectItem key={index} value={vendor}>
                        {vendor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {filteredStatuses.map((status, index) => (
                      <SelectItem key={index} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between mt-4">
                <Button variant="secondary" onClick={resetFilters}>
                  Reset Filters
                </Button>
                <Button onClick={handleRun}>Run</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="overflow-auto">
        <div className="w-full overflow-x-auto">
          <Table className="w-full">
            <TableRow className="bg-gray-200">
              <TableHead className="min-w-[100px] p-2 text-xs">S.N</TableHead>
              <TableHead className="min-w-[150px] p-2 text-xs">Category</TableHead>
              <TableHead className="min-w-[200px] p-2 text-xs">SubCategory</TableHead>
              <TableHead className="min-w-[350px] p-2 text-xs">Description</TableHead>
              <TableHead className="min-w-[100px] p-2 text-xs">Size</TableHead>
              <TableHead className="min-w-[50px] p-2 text-xs">Qty</TableHead>
              <TableHead className="min-w-[75px] p-2 text-xs">UOM</TableHead>
              <TableHead className="min-w-[100px] p-2 text-xs">MTA</TableHead>
              <TableHead className="min-w-[250px] p-2 text-xs">Vendor</TableHead>
              <TableHead className="min-w-[150px] p-2 text-xs">Est.Delivery</TableHead>
              <TableHead className="min-w-[150px] p-2 text-xs">Target Date</TableHead>
              <TableHead className="min-w-[125px] p-2 text-xs">Status</TableHead>
              <TableHead className="min-w-[200px] p-2 text-xs">Remarks</TableHead>
            </TableRow>
            <TableBody>
              {filteredData.map((item, index) => (
                <TableRow key={index}>
                   <TableCell className="min-w-[100px] p-2 text-xs">{index+1}</TableCell>
                  <TableCell className="min-w-[150px] p-2 text-xs">{item.Category}</TableCell>
                  <TableCell className="min-w-[200px] p-2 text-xs">{item.SubCategory}</TableCell>
                  <TableCell className="min-w-[350px] p-2 text-xs">
                    {truncateText(item.Description, 35)}
                  </TableCell>
                  <TableCell className="min-w-[100px] p-2 text-xs">{item.Size}</TableCell>
                  <TableCell className="min-w-[50px] p-2 text-xs">{item.Qty}</TableCell>
                  <TableCell className="min-w-[75px] p-2 text-xs">{item.UOM}</TableCell>
                  <TableCell className="min-w-[100px] p-2 text-xs">{item.MTA}</TableCell>
                  <TableCell className="min-w-[250px] p-2 text-xs">
                    {truncateText(item.Vendor, 22)}
                  </TableCell>
                  <TableCell className="min-w-[150px] p-2 text-xs">{item.EstimatedDel}</TableCell>
                  <TableCell className="min-w-[150px] p-2 text-xs">{item.TargetDate}</TableCell>
                  <TableCell className="min-w-[125px p-2 text-xs">
                    <Badge variant={item.Status ? "outline" : "destructive"}>
                      {item.Status || "Not Del."}
                    </Badge>
                  </TableCell>
                  <TableCell className="min-w-[200px] p-2 text-xs">{item.Remarks}</TableCell>
                </TableRow>
              ))}
            </TableBody>

          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default MaterialTable;
