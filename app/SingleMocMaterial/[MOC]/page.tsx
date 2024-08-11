"use client"
import React from 'react';
import { useRouter } from 'next/router';
import data from '@/app/material.json'; // Adjust the path if necessary
import MaterialTable from '@/components/MaterialTable';



import { useParams } from 'next/navigation';




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
const jsonData = data as unknown as DataType[];

export default function SingleMocMaterial() {
    const params =useParams();
    const MOC =params.MOC;

  return (
    <div className="p-4">
    {MOC ? <MaterialTable data={jsonData} moc={MOC as string} /> : <p>Loading...</p>}
  </div>
  );
}