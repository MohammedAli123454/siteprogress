import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import data from '@/app/material.json';

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

// First cast the data to `unknown`, then to `DataType[]`
const jsonData = data as unknown as DataType[];

// Create a Set of MOC values
const mocSet = new Set<string>(jsonData.map(item => item.MOC));

// Convert Set to Array
const uniqueMOC = Array.from(mocSet);

export default function AllMocMaterials() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {uniqueMOC.map((moc, index) => {
        const mocRecords = jsonData.filter(item => item.MOC === moc);

        const totalBulkLineItems = mocRecords.filter(item => item['Category'] === 'Bulk').length;
        const totalLLILineItems = mocRecords.filter(item => item['Category'] === 'LLI').length;
        const mocName = mocRecords[0]?.MOCName || '';

        return (
          <Card key={index} className="transition-transform transform hover:border-blue-500 hover:scale-105 hover:shadow-md">
            <CardHeader className="flex justify-between items-center p-4">
              <div className="flex-1">
                <CardTitle>{moc}</CardTitle>
              </div>
              <div className="font-bold p-2 rounded flex-shrink-0">
                {mocName}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-2">
                <span>Bulk Line Items: {totalBulkLineItems}</span>
                <span>LLI Line Items: {totalLLILineItems}</span>
                <Link href={`/SingleMocMaterial/${moc}`}>
                  <Button variant="outline">View Details</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
