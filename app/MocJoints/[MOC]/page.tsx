"use client";
import { useQuery } from '@tanstack/react-query';
import { db } from '@/app/configs/db';
import { sql, eq } from 'drizzle-orm';
import { jointsDetail } from '@/app/configs/schema';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import JointsSummary from '../_components/JointsSummary';
import JointsDetail from '../_components/JointsDetail';
import InchDiaDetail from '../_components/InchDiaDetail';
import Charts from '../_components/Charts';
import InchDiaSummary from '../_components/InchDiaSummary';
import { Separator } from '@/components/ui/separator';


export default function MOCJoints({ params }: { params: { MOC: string } }) {
  const [currentComponent, setCurrentComponent] = useState('InchDiaSummary');
  const [selectedSidebar, setSelectedSidebar] = useState<'singleMoc' | 'allMocs'>('singleMoc');

  const moc = params.MOC;

  async function fetchInchDiaSummary(moc: string) {
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

  const { data, isLoading, error } = useQuery({
    queryKey: ['inchDiaSummary', moc, selectedSidebar],
    queryFn: () => fetchInchDiaSummary(moc),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error || !data) return <div>Error fetching data</div>;

  const renderContent = () => {
    switch (currentComponent) {
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
      case 'JointsSummary':
        return <JointsSummary moc={params.MOC} selectedSidebar={selectedSidebar} />;
      case 'JointsDetail':
        return <JointsDetail moc={params.MOC} selectedSidebar={selectedSidebar} />;
      case 'InchDiaDetail':
        return <InchDiaDetail moc={params.MOC} selectedSidebar={selectedSidebar} />;
      case 'Charts':
        return <Charts moc={params.MOC} selectedSidebar={selectedSidebar} />;
      default:
        return <InchDiaSummary moc={params.MOC} />;
    }
  };

  const buttonClasses = 'px-3 py-2 text-sm bg-transparent text-black border-none disabled:opacity-50 hover:bg-blue-500 hover:text-white';

  return (
    <div className="grid grid-cols-5 h-screen p-4 gap-4">
      {/* Sidebar */}
      <div className="col-span-1  bg-gray-100 shadow-lg rounded-lg p-4 flex flex-col space-y-4">
        {/* Single MOC Data Section */}
        <div className="mb-6">
          <div className="text-lg font-bold mb-4 text-center">Single MOC Data Menu</div>
          <Button
            onClick={() => {
              setSelectedSidebar('singleMoc');
              setCurrentComponent('JointsSummary');
            }}
            className={`${buttonClasses} w-full`}
          >
            Joints Summary
          </Button>
          <Button
            onClick={() => {
              setSelectedSidebar('singleMoc');
              setCurrentComponent('InchDiaSummary');
            }}
            className={`${buttonClasses} w-full`}
          >
            Inch Dia Summary
          </Button>
          <Button
            onClick={() => {
              setSelectedSidebar('singleMoc');
              setCurrentComponent('JointsDetail');
            }}
            className={`${buttonClasses} w-full`}
          >
            Joints Detail
          </Button>
          <Button
            onClick={() => {
              setSelectedSidebar('singleMoc');
              setCurrentComponent('InchDiaDetail');
            }}
            className={`${buttonClasses} w-full`}
          >
            Inch Dia Detail
          </Button>
          <Button
            onClick={() => {
              setSelectedSidebar('singleMoc');
              setCurrentComponent('Charts');
            }}
            className={`${buttonClasses} w-full`}
          >
            Charts
          </Button>
        </div>

        <Separator className="my-5 w-2" />

        {/* All MOCs Data Section */}
        <div>
          <div className="text-lg font-bold mb-4 text-center">Overall Data Menu</div>
          <Button
            onClick={() => {
              setSelectedSidebar('allMocs');
              setCurrentComponent('JointsSummary');
            }}
            className={`${buttonClasses} w-full`}
          >
            Joints Summary
          </Button>
          <Button
            onClick={() => {
              setSelectedSidebar('allMocs');
              setCurrentComponent('JointsDetail');
            }}
            className={`${buttonClasses} w-full`}
          >
            Joints Detail
          </Button>
          <Button
            onClick={() => {
              setSelectedSidebar('allMocs');
              setCurrentComponent('InchDiaSummary');
            }}
            className={`${buttonClasses} w-full`}
          >
            Inch Dia Summary
          </Button>
          <Button
            onClick={() => {
              setSelectedSidebar('allMocs');
              setCurrentComponent('InchDiaDetail');
            }}
            className={`${buttonClasses} w-full`}
          >
            Inch Dia Detail
          </Button>
          <Button
            onClick={() => {
              setSelectedSidebar('allMocs');
              setCurrentComponent('Charts');
            }}
            className={`${buttonClasses} w-full`}
          >
            Charts
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="col-span-4  bg-gray-50 shadow-lg rounded-lg p-2">
        {renderContent()}
      </div>
    </div>
  );
}
