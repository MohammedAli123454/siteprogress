"use client";

import { useQuery } from '@tanstack/react-query';
import { db } from '@/app/configs/db';
import { sql, eq } from 'drizzle-orm';
import { jointsDetail } from '@/app/configs/schema';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import Link from 'next/link';
import {Button} from "@/components/ui/button";
import JointsSummary from '../_components/JointsSummary';
import JointsDetail from '../_components/JointsDetail';
import InchDiaDetail from '../_components/InchDiaDetail';
import Charts from '../_components/Charts';
import InchDiaSummary from '../_components/InchDiaSummary';



// Define the type for the data returned by the fetchInchDiaSummary function
type InchDiaSummaryData = {
  shopInchDia: number;
  fieldInchDia: number;
  totalInchDia: number;
};

export default function MOCJoints({ params }: { params: { MOC: string } }) {
  const [currentComponent, setCurrentComponent] = useState('InchDiaSummary');
  const moc = params.MOC;

  async function fetchInchDiaSummary(moc: string): Promise<InchDiaSummaryData> {
    const result = await db
      .select({
        shopInchDia: sql<number>`SUM(${jointsDetail.shopInchDia})`.as('shopInchDia'),
        fieldInchDia: sql<number>`SUM(${jointsDetail.fieldInchDia})`.as('fieldInchDia'),
        totalInchDia: sql<number>`SUM(${jointsDetail.shopInchDia}) + SUM(${jointsDetail.fieldInchDia})`.as('totalInchDia'),
      })
      .from(jointsDetail)
      .where(eq(jointsDetail.moc, moc))
      .execute();

    const [data] = result;
    return data;
  }

  // Use React Query to fetch the data
  const { data, isLoading, error } = useQuery({
    queryKey: ['inchDiaSummary', moc],
    queryFn: () => fetchInchDiaSummary(moc),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error || !data) return <div>Error fetching data</div>;

  // Mapping button clicks to components
  const renderContent = () => {
    switch (currentComponent) {
      case 'JointsSummary':
        return <JointsSummary moc={params.MOC} />;
      case 'InchDiaSummary':
        return (
          <div className="flex items-center justify-center min-h-screen">
            <Card className="max-w-md w-full mx-auto">
              <CardHeader>
                <CardTitle className="text-center font-bold text-sm">MOC NO - {moc.toUpperCase()}</CardTitle>
                <CardTitle className="text-center font-bold text-sm">PIPING METALLURGY UPGRADE</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between px-6 py-2">
                  <span>SHOP INCH DIA FABRICATION</span>
                  <span>{data.shopInchDia}</span>
                </div>
                <div className="flex justify-between px-6 py-2">
                  <span>FIELD INCH DIA FABRICATION</span>
                  <span>{data.fieldInchDia}</span>
                </div>
                <div className="flex justify-between font-bold px-6 py-2 border-t-2 border-black">
                  <span>TOTAL INCH DIA</span>
                  <span>{data.totalInchDia}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'JointsDetail':
        return <JointsDetail moc={params.MOC} />;
      case 'InchDiaDetail':
        return <InchDiaDetail moc={params.MOC} />;
      case 'Charts':
        return <Charts moc={params.MOC} />;
      default:
        return <InchDiaSummary moc={params.MOC} />;
    }
  };

  const buttonClasses = 'px-3 py-2 text-sm bg-transparent text-black border-none disabled:opacity-50 hover:bg-blue-500 hover:text-white';

  return (
    <div className="grid grid-cols-5 h-screen">
      {/* Sidebar */}
      <div className="col-span-1 bg-gray-200 p-4 flex flex-col space-y-2">
        <Link href='/' className='font-semibold text-neutral-700'>Home</Link>
        <Button onClick={() => setCurrentComponent('JointsSummary')} className={buttonClasses}>
          Joints Summary
        </Button>
        <Button onClick={() => setCurrentComponent('InchDiaSummary')} className={buttonClasses}>
          Inch Dia Summary
        </Button>
        <Button onClick={() => setCurrentComponent('JointsDetail')} className={buttonClasses}>
          Joints Detail
        </Button>
        <Button onClick={() => setCurrentComponent('InchDiaDetail')} className={buttonClasses}>
          Inch Dia Detail
        </Button>
        <Button onClick={() => setCurrentComponent('Charts')} className={buttonClasses}>
          Charts
        </Button>
      </div>

      {/* Main Content */}
      <div className="col-span-4 p-4">
        {renderContent()}
      </div>
    </div>
  );
}
