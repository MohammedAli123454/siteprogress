'use client';

import { useQuery } from '@tanstack/react-query';
import { db } from '@/app/configs/db';
import { sql, eq } from 'drizzle-orm';
import { jointsDetail } from '@/app/configs/schema';
import { Loader } from 'lucide-react';
import { PieChartComponent } from '@/components/PieChartComponent';
import { fetchMocName } from '@/components/commoncomponents/fetchMocName';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';

// Define the type for the data returned by the fetchInchDiaSummary function
type JointsSummaryData = {
  shopJoints: number;
  fieldJoints: number;
  totalJoints: number;
  shopInchDia: number;
  fieldInchDia: number;
  totalInchDia: number;
};

// Define the type for chart data
type ChartDataItem = {
  metric: string;
  value: number;
};

// Fetch chart data for a specific MOC
const fetchChartData = async (moc: string) => {
  const rawData = await db
    .select({
      shopJoints: sql`SUM(${jointsDetail.shopJoints})`.as('shopJoints'),
      shopInchDia: sql`SUM(${jointsDetail.shopInchDia})`.as('shopInchDia'),
      fieldJoints: sql`SUM(${jointsDetail.fieldJoints})`.as('fieldJoints'),
      fieldInchDia: sql`SUM(${jointsDetail.fieldInchDia})`.as('fieldInchDia'),
      totalJoints: sql`SUM(${jointsDetail.shopJoints}) + SUM(${jointsDetail.fieldJoints})`.as('totalJoints'),
      totalInchDia: sql`SUM(${jointsDetail.shopInchDia}) + SUM(${jointsDetail.fieldInchDia})`.as('totalInchDia'),
    })
    .from(jointsDetail)
    .where(eq(jointsDetail.moc, moc))
    .execute();

  return {
    jointsChartData: [
      { metric: "Shop Joints", value: Number(rawData[0]?.shopJoints || 0) },
      { metric: "Field Joints", value: Number(rawData[0]?.fieldJoints || 0) },
      { metric: "Total Joints", value: Number(rawData[0]?.totalJoints || 0) },
    ],
    inchDiaChartData: [
      { metric: "Shop Inch Dia", value: Number(rawData[0]?.shopInchDia || 0) },
      { metric: "Field Inch Dia", value: Number(rawData[0]?.fieldInchDia || 0) },
      { metric: "Total Inch Dia", value: Number(rawData[0]?.totalInchDia || 0) },
    ],
  };
};

// Fetch full-scope chart data (without MOC filtering)
const fetchFullScopeChartData = async () => {
  const rawData = await db
    .select({
      shopJoints: sql`SUM(${jointsDetail.shopJoints})`.as('shopJoints'),
      shopInchDia: sql`SUM(${jointsDetail.shopInchDia})`.as('shopInchDia'),
      fieldJoints: sql`SUM(${jointsDetail.fieldJoints})`.as('fieldJoints'),
      fieldInchDia: sql`SUM(${jointsDetail.fieldInchDia})`.as('fieldInchDia'),
      totalJoints: sql`SUM(${jointsDetail.shopJoints}) + SUM(${jointsDetail.fieldJoints})`.as('totalJoints'),
      totalInchDia: sql`SUM(${jointsDetail.shopInchDia}) + SUM(${jointsDetail.fieldInchDia})`.as('totalInchDia'),
    })
    .from(jointsDetail)
    .execute();

  return {
    jointsChartData: [
      { metric: "Shop Joints", value: Number(rawData[0]?.shopJoints || 0) },
      { metric: "Field Joints", value: Number(rawData[0]?.fieldJoints || 0) },
      { metric: "Total Joints", value: Number(rawData[0]?.totalJoints || 0) },
    ],
    inchDiaChartData: [
      { metric: "Shop Inch Dia", value: Number(rawData[0]?.shopInchDia || 0) },
      { metric: "Field Inch Dia", value: Number(rawData[0]?.fieldInchDia || 0) },
      { metric: "Total Inch Dia", value: Number(rawData[0]?.totalInchDia || 0) },
    ],
  };
};

export default function MOCJoints({ params }: { params: { MOC: string } }) {
  const moc = params.MOC;

  // Fetch MOC Name
  const { data: mocName, isLoading: isMocNameLoading, error: mocNameError } = useQuery({
    queryKey: ['mocName', moc],
    queryFn: () => fetchMocName(moc),
    staleTime: Infinity,
  });

  // Fetch chart data for selected MOC
  const { data: chartData, isLoading: chartLoading, error: chartError } = useQuery({
    queryKey: ['chartData', moc],
    queryFn: () => fetchChartData(moc),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch chart data for the full scope
  const { data: fullScopeChartData, isLoading: fullScopeLoading, error: fullScopeError } = useQuery({
    queryKey: ['fullScopeChartData'],
    queryFn: fetchFullScopeChartData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (chartLoading || isMocNameLoading || fullScopeLoading) {
    return (
      <div className="flex items-center h-64">
        <Loader className="animate-spin text-gray-500" size={32} />
      </div>
    );
  }

  if (chartError || mocNameError || fullScopeError || !chartData || !fullScopeChartData) {
    return <div>Error fetching data</div>;
  }

  // Total values for chart components
  const totalJointsValue = chartData.jointsChartData.find(item => item.metric === "Total Joints")?.value || 0;
  const totalInchDiaValue = chartData.inchDiaChartData.find(item => item.metric === "Total Inch Dia")?.value || 0;

  const totalFullJointsValue = fullScopeChartData.jointsChartData.find(item => item.metric === "Total Joints")?.value || 0;
  const totalFullInchDiaValue = fullScopeChartData.inchDiaChartData.find(item => item.metric === "Total Inch Dia")?.value || 0;

  // Dynamic chart titles based on selected sidebar
  const chartTitleJoints = mocName ? mocName : 'Undefined';
  const chartTitleInchDia = mocName ? mocName : 'Undefined';

  const chartConfig = {
    value: { label: "value", color: "hsl(var(--chart-2))" },
    label: { color: "hsl(var(--background))" },
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-8 p-4">
      {/* Selected MOC Data Section */}
     
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {/* Joints Chart */}
        <div className="p-1">
          <PieChartComponent
            data={chartData.jointsChartData}
            title={chartTitleJoints}
            description={moc}
            chartConfig={chartConfig}
            totalValue={totalJointsValue}
            totalLabel="Total Joints"
          />
        </div>
        {/* Inch Dia Chart */}
        <div className="p-1">
          <PieChartComponent
            data={chartData.inchDiaChartData}
            title={chartTitleInchDia}
            description={moc}
            chartConfig={chartConfig}
            totalValue={totalInchDiaValue}
            totalLabel="Total Inch Dia"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="w-full border-t-4 border-gray-400 my-4" />

      {/* Full Scope Data Section */}
   
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {/* Joints Chart */}
        <div className="p-1">
          <PieChartComponent
            data={fullScopeChartData.jointsChartData}
            title="Complete Scope"
            description="Total Joints"
            chartConfig={chartConfig}
            totalValue={totalFullJointsValue}
            totalLabel="Total Joints"
          />
        </div>
        {/* Inch Dia Chart */}
        <div className="p-1">
          <PieChartComponent
            data={fullScopeChartData.inchDiaChartData}
            title="Complete Scope"
            description="Total Inch Dia"
            chartConfig={chartConfig}
            totalValue={totalFullInchDiaValue}
            totalLabel="Total Inch Dia"
          />
        </div>
      </div>
    </div>
  );
}
