'use client';

import { useQuery } from '@tanstack/react-query';
import { db } from '@/app/configs/db';
import { sql } from 'drizzle-orm';
import { jointsDetail, mocDetail } from '@/app/configs/schema';
import { Loader } from 'lucide-react';
import { PieChartComponent } from '@/components/PieChartComponent';

// Define the types
type MocDataType = {
  moc: string;
  mocName: string;
  shopJoints: number;
  fieldJoints: number;
  totalJoints: number;
  shopInchDia: number;
  fieldInchDia: number;
  totalInchDia: number;
};

// Fetch joint data for all MOCs (Joints and Inch Dia)
const fetchAllMocsData = async (): Promise<MocDataType[]> => {
  const rawData = await db
    .select({
      moc: mocDetail.moc,
      mocName: mocDetail.mocName,
      shopJoints: sql`SUM(${jointsDetail.shopJoints})`.as('shopJoints'),
      fieldJoints: sql`SUM(${jointsDetail.fieldJoints})`.as('fieldJoints'),
      totalJoints: sql`SUM(${jointsDetail.shopJoints}) + SUM(${jointsDetail.fieldJoints})`.as('totalJoints'),
      shopInchDia: sql`SUM(${jointsDetail.shopInchDia})`.as('shopInchDia'),
      fieldInchDia: sql`SUM(${jointsDetail.fieldInchDia})`.as('fieldInchDia'),
      totalInchDia: sql`SUM(${jointsDetail.shopInchDia}) + SUM(${jointsDetail.fieldInchDia})`.as('totalInchDia'),
    })
    .from(mocDetail)
    .innerJoin(jointsDetail, sql`${mocDetail.moc} = ${jointsDetail.moc}`)
    .groupBy(mocDetail.moc, mocDetail.mocName)
    .execute();

  return rawData as MocDataType[];
};

export default function OverallJoints() {
  // Fetch data for Joints and Inch Dia
  const { data: mocData, isLoading: isDataLoading } = useQuery<MocDataType[]>({
    queryKey: ['allMocsData'],
    queryFn: fetchAllMocsData,
    staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
  });

  // Error and loading states
  if (isDataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader color="blue" size={48} />
      </div>
    );
  }

  // Ensure mocData is always defined, fallback to an empty array if undefined
  const safeMocData = mocData ?? [];

  // Calculate summary data for "Overall Joints"
  const overallShopJoints = safeMocData.reduce((sum, moc) => sum + Number(moc.shopJoints || 0), 0);
  const overallFieldJoints = safeMocData.reduce((sum, moc) => sum + Number(moc.fieldJoints || 0), 0);
  const overallTotalJoints = overallShopJoints + overallFieldJoints;

  // Calculate summary data for "Overall Inch Dia"
  const overallShopInchDia = safeMocData.reduce((sum, moc) => sum + Number(moc.shopInchDia || 0), 0);
  const overallFieldInchDia = safeMocData.reduce((sum, moc) => sum + Number(moc.fieldInchDia || 0), 0);
  const overallTotalInchDia = overallShopInchDia + overallFieldInchDia;

  // Chart data for "Overall Joints"
  const overallJointsChartData = [
    { metric: 'Shop Joints', value: overallShopJoints },
    { metric: 'Field Joints', value: overallFieldJoints },
    { metric: 'Total Joints', value: overallTotalJoints },
  ];

  // Chart data for "Overall Inch Dia"
  const overallInchDiaChartData = [
    { metric: 'Shop Inch Dia', value: overallShopInchDia },
    { metric: 'Field Inch Dia', value: overallFieldInchDia },
    { metric: 'Total Inch Dia', value: overallTotalInchDia },
  ];

  return (
    <div className="w-full flex justify-center items-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-screen p-4">
        {/* Overall Joints Pie Chart */}
        <div className="relative space-y-4">
          <PieChartComponent
            data={overallJointsChartData}
            pieChartTitle="Overall Joints"
            moc="*"
            totalValue={overallTotalJoints}
            chartConfig={{
              value: { label: 'value', color: 'hsl(var(--chart-2))' },
              label: { color: 'hsl(var(--background))' },
            }}
            chartCenterMessage="Total Joints"
            Type="Joints"
          />
        </div>

        {/* Overall Inch Dia Pie Chart */}
        <div className="relative space-y-4">
          <PieChartComponent
            data={overallInchDiaChartData}
            pieChartTitle="Overall Inch Dia"
            moc="*"
            totalValue={overallTotalInchDia}
            chartConfig={{
              value: { label: 'value', color: 'hsl(var(--chart-2))' },
              label: { color: 'hsl(var(--background))' },
            }}
            chartCenterMessage="Total Inch Dia"
            Type="InchDia"
          />
        </div>
      </div>
    </div>
  );
}
