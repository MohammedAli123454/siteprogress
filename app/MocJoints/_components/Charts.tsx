"use client";
import { useQuery } from '@tanstack/react-query';
import { db } from '@/app/configs/db';
import { sql, eq } from 'drizzle-orm';
import { jointsDetail, mocDetail } from '@/app/configs/schema';
import { Loader } from 'lucide-react';
import { PieChartComponent } from '@/components/PieChartComponent';
import { fetchMocName } from '@/components/commoncomponents/fetchMocName';

// Define the type for chart data
type ChartDataItem = {
  metric: string;
  value: number;
};



// Helper function to fetch chart data
const fetchChartData = async (moc: string, selectedSidebar: 'singleMoc' | 'allMocs') => {
  const whereClause = selectedSidebar === 'singleMoc' ? eq(jointsDetail.moc, moc) : sql`1 = 1`;

  const rawData = await db
    .select({
      shopJoints: sql`SUM(${jointsDetail.shopJoints})`.as('shopJoints'),
      shopInchDia: sql`SUM(${jointsDetail.shopInchDia})`.as('shopInchDia'),
      fieldJoints: sql`SUM(${jointsDetail.fieldJoints})`.as('fieldJoints'),
      fieldInchDia: sql`SUM(${jointsDetail.fieldInchDia})`.as('fieldInchDia'),
      totalJoints: sql`SUM(${jointsDetail.totalJoints})`.as('totalJoints'),
      totalInchDia: sql`SUM(${jointsDetail.totalInchDia})`.as('totalInchDia'),
    })
    .from(jointsDetail)
    .where(whereClause)
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

// Main component
export default function ChartsData({ moc, selectedSidebar }: { moc: string; selectedSidebar: 'singleMoc' | 'allMocs' }) {
  // Queries for fetching chart data and MOC name
  const { data: chartData, isLoading: isChartDataLoading, error: chartError } = useQuery({
    queryKey: ['chartData', moc, selectedSidebar],
    queryFn: () => fetchChartData(moc, selectedSidebar),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const { data: mocName, isLoading: isMocNameLoading, error: mocNameError } = useQuery({
    queryKey: ['mocName', moc],
    queryFn: () => fetchMocName(moc),
    staleTime: Infinity, // MOC names rarely change
  });

  // Combined loading and error states
  const isLoading = isChartDataLoading || isMocNameLoading;
  const error = chartError || mocNameError;

  // Loading and error UI
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin text-gray-500" size={32} />
      </div>
    );
  }

  if (error || !chartData) {
    return <div className="text-center text-red-500">Error fetching data</div>;
  }

  // Total values for chart components
  const totalJointsValue = chartData.jointsChartData.find(item => item.metric === "Total Joints")?.value || 0;
  const totalInchDiaValue = chartData.inchDiaChartData.find(item => item.metric === "Total Inch Dia")?.value || 0;

  // Dynamic chart titles based on selected sidebar
  const chartTitleJoints = selectedSidebar === 'singleMoc'
    ? `${mocName}`
    : 'Overall Scope';

  const chartTitleInchDia = selectedSidebar === 'singleMoc'
    ? `${mocName}`
    : 'Overall Scope';

  // Configuration for PieChartComponent
  const chartConfig = {
    value: {
      label: "value",
      color: "hsl(var(--chart-2))",
    },
    label: {
      color: "hsl(var(--background))",
    },
  };

  // Conditionally set description based on selectedSidebar
  const description = selectedSidebar === 'singleMoc' ? moc : '';

  // Render the Pie Charts for Joints and Inch Dia
  return (
    <div className="flex flex-col md:flex-row justify-center md:justify-between my-4">
      {/* Joints Chart */}
      <div className="w-full md:w-1/2 lg:w-1/2 p-1">
        <PieChartComponent
          data={chartData.jointsChartData}
          title={chartTitleJoints}
          description={description}
          chartConfig={chartConfig}
          totalValue={totalJointsValue}
          totalLabel="Total Joints"
          className="flex-1"
        />
      </div>
      {/* Inch Dia Chart */}
      <div className="w-full md:w-1/2 lg:w-1/2 p-1">
        <PieChartComponent
          data={chartData.inchDiaChartData}
          title={chartTitleInchDia}
          description={description}
          chartConfig={chartConfig}
          totalValue={totalInchDiaValue}
          totalLabel="Total Inch Dia"
          className="flex-1"
        />
      </div>
    </div>
  );
}
