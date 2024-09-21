'use client';

import { useQuery } from '@tanstack/react-query';
import { db } from '@/app/configs/db';
import { sql } from 'drizzle-orm';
import { jointsDetail, mocDetail } from '@/app/configs/schema';
import { Loader } from 'lucide-react';
import { PieChartComponent } from '@/components/PieChartComponent';
import { Switch } from '@/components/ui/switch'; // Import ShadCN's Switch component
import { useState } from 'react'; // Import useState for handling toggle state


// Define the types
type MocDataType = {
  moc: string;
  mocName: string;
  shopJoints: number;
  fieldJoints: number;
  totalJoints: number;
  shopInchDia?: number; // Add inch dia fields
  fieldInchDia?: number;
  totalInchDia?: number;
};

// Fetch joint data for all MOCs
const fetchAllMocsJointsData = async (isInchDia: boolean): Promise<MocDataType[]> => {
  const rawData = await db
    .select({
      moc: mocDetail.moc,
      mocName: mocDetail.mocName,
      ...(isInchDia
        ? {
            // Inch Dia columns when the switch is toggled
            shopJoints: sql`SUM(${jointsDetail.shopInchDia})`.as('shopInchDia'),
            fieldJoints: sql`SUM(${jointsDetail.fieldInchDia})`.as('fieldInchDia'),
            totalJoints: sql`SUM(${jointsDetail.shopInchDia}) + SUM(${jointsDetail.fieldInchDia})`.as('totalInchDia'),
          }
        : {
            // Joints columns (default)
            shopJoints: sql`SUM(${jointsDetail.shopJoints})`.as('shopJoints'),
            fieldJoints: sql`SUM(${jointsDetail.fieldJoints})`.as('fieldJoints'),
            totalJoints: sql`SUM(${jointsDetail.shopJoints}) + SUM(${jointsDetail.fieldJoints})`.as('totalJoints'),
          }),
    })
    .from(mocDetail)
    .innerJoin(jointsDetail, sql`${mocDetail.moc} = ${jointsDetail.moc}`)
    .groupBy(mocDetail.moc, mocDetail.mocName)
    .execute();

  return rawData as MocDataType[];
};

export default function MOCJointsCharts() {
  const [isInchDia, setIsInchDia] = useState(true); // Set default to true for Inch Dia

  // Fetch data based on toggle state
  const { data: mocData, isLoading: isDataLoading } = useQuery<MocDataType[]>({
    queryKey: ['allMocsJointsData', isInchDia],
    queryFn: () => fetchAllMocsJointsData(isInchDia),
    staleTime: 5 * 60 * 1000,
  });

  // Error and loading states
  if (isDataLoading) {
    return (
      <div className="flex items-center h-64">
        <Loader className="animate-spin text-gray-500" size={32} />
      </div>
    );
  }

  // Ensure mocData is always defined, fallback to an empty array if undefined
  const safeMocData = mocData ?? [];

  // Calculate summary data for "Overall Joints" or "Inch Dia"
  const overallShopValue = safeMocData.reduce((sum, moc) => sum + Number(moc.shopJoints || 0), 0);
  const overallFieldValue = safeMocData.reduce((sum, moc) => sum + Number(moc.fieldJoints || 0), 0);
  const overallTotalValue = overallShopValue + overallFieldValue;

  const overallChartData = [
    { metric: isInchDia ? 'Shop Inch Dia' : 'Shop Joints', value: overallShopValue },
    { metric: isInchDia ? 'Field Inch Dia' : 'Field Joints', value: overallFieldValue },
    { metric: isInchDia ? 'Total Inch Dia' : 'Total Joints', value: overallTotalValue },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-screen w-full p-4">
      {/* Overall Joints or Inch Dia Pie Chart */}
      <div className="relative space-y-4">
        {/* Toggle Switch in top-left corner */}
        <div className="absolute top-4 left-0 p-2">
          <label className="flex items-center space-x-2">
            <Switch checked={isInchDia} onCheckedChange={() => setIsInchDia(!isInchDia)} />
            <span className="text-sm">{isInchDia ? 'Inch Dia' : 'Joints'}</span>
          </label>
        </div>
        <PieChartComponent
          data={overallChartData}
          pieChartTitle={isInchDia ? 'Overall Inch Dia' : 'Overall Joints'}
          moc="Overall"
          totalValue={overallTotalValue}
          chartConfig={{
            value: { label: 'value', color: 'hsl(var(--chart-2))' },
            label: { color: 'hsl(var(--background))' },
          }}
          chartCenterMessage={isInchDia ? 'Overall Inch Dia' : 'Overall Joints'}
          Type={isInchDia ? 'GrossInchDia' : 'GrossJoints'}
        />
      </div>

      {/* Loop through each MOC data and render the corresponding Pie chart */}
      {safeMocData.length > 0 ? (
        safeMocData.map((moc) => {
          const chartData = [
            { metric: isInchDia ? 'Shop Inch Dia' : 'Shop Joints', value: Number(moc.shopJoints || 0) },
            { metric: isInchDia ? 'Field Inch Dia' : 'Field Joints', value: Number(moc.fieldJoints || 0) },
            { metric: isInchDia ? 'Total Inch Dia' : 'Total Joints', value: Number(moc.totalJoints || 0) },
          ];

          const totalValue = Number(moc.shopJoints || 0) + Number(moc.fieldJoints || 0);

          return (
            
            <div key={moc.moc} className="space-y-4">
              <PieChartComponent
                data={chartData}
                pieChartTitle={moc.mocName}
                moc={moc.moc}
                totalValue={totalValue}
                chartConfig={{
                  value: { label: 'value', color: 'hsl(var(--chart-2))' },
                  label: { color: 'hsl(var(--background))' },
                }}
                chartCenterMessage={isInchDia ? 'Total Inch Dia' : 'Total Joints'}
                Type={isInchDia ? 'InchDia' : 'TotalJoints'}
              />
            </div>










          );
        })
      ) : (
        <div className="text-center text-gray-500">No MOC data available</div>
      )}
    </div>
  );
}
