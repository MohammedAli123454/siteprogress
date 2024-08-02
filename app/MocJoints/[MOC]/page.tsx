"use client"
import React from 'react';
import { useRouter } from 'next/router';
import data from '@/app/data.json'; // Adjust the path if necessary
import { JointSummaryTable } from '@/components/JointSummaryTable';



import { useParams } from 'next/navigation';

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
};

const jsonData = data as unknown as DataType[];

export default function MOCJoints() {
    const params =useParams();
    const MOC =params.MOC;

  return (
    <div className="p-4">
      {MOC ? <JointSummaryTable data={jsonData} moc={MOC as string} /> : <p>Loading...</p>}
    </div>
  );
}
