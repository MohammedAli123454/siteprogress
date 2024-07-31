import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import data from '@/app/data.json';

type DataType = {
  MOC: string;
  'MOC NAME': string;
  'SIZE (INCHES)': number;
  'PIPE SCHEDULE': string;
  THKNESS: string;
  'SHOP JOINTS': number;
  'SHOP INCH DIA': number;
  'FIELD JOINTS': number;
  'FIELD INCH DIA': number;
  'TOTAL JOINTS': number;
  'TOTAL INCH DIA': number;
};

const jsonData = data as DataType[];

// Create a Set of MOC values
const mocSet = new Set<string>(jsonData.map(item => item.MOC));

// Convert Set to Array
const uniqueMOC = Array.from(mocSet);

export default function MocDetail() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {uniqueMOC.map((moc, index) => {
        const mocRecords = jsonData.filter(item => item.MOC === moc);

        const totalInchDia = mocRecords.reduce((sum, item) => sum + item['TOTAL INCH DIA'], 0);
        const totalJoints = mocRecords.reduce((sum, item) => sum + item['TOTAL JOINTS'], 0);
        const mocName = mocRecords[0]?.['MOC NAME'] || '';

        return (
          <Card key={index} className="transition-transform transform hover:scale-105 hover:shadow-md">
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
                <span>Total Inch Dia: {totalInchDia}</span>
                <span>Total Joints: {totalJoints}</span>
                <Link href={`/MocJoints/${moc}`}>
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
