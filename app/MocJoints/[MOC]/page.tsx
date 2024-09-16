'use client';

import { useQuery } from '@tanstack/react-query';
import { db } from '@/app/configs/db';
import { sql, eq } from 'drizzle-orm';
import { jointsDetail } from '@/app/configs/schema';
import { Loader } from 'lucide-react';
import { PieChartComponent } from '@/components/PieChartComponent';
import { fetchMocName } from '@/components/commoncomponents/fetchMocName';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';

import { useState } from 'react';

// Define the types
type JointsSummaryData = {
  shopJoints: number;
  fieldJoints: number;
  totalJoints: number;
  shopInchDia: number;
  fieldInchDia: number;
  totalInchDia: number;
};

type ChartDataItem = {
  metric: string;
  value: number;
};

// Define the structure of the data returned by the fetch function
interface ChartData {
  jointsChartData: ChartDataItem[];
  inchDiaChartData: ChartDataItem[];
}

// Fetch chart data, optionally filtered by MOC
const fetchChartData = async (moc?: string): Promise<ChartData> => {
  const rawDataQuery = db
    .select({
      shopJoints: sql`SUM(${jointsDetail.shopJoints})`.as('shopJoints'),
      shopInchDia: sql`SUM(${jointsDetail.shopInchDia})`.as('shopInchDia'),
      fieldJoints: sql`SUM(${jointsDetail.fieldJoints})`.as('fieldJoints'),
      fieldInchDia: sql`SUM(${jointsDetail.fieldInchDia})`.as('fieldInchDia'),
      totalJoints: sql`SUM(${jointsDetail.shopJoints}) + SUM(${jointsDetail.fieldJoints})`.as('totalJoints'),
      totalInchDia: sql`SUM(${jointsDetail.shopInchDia}) + SUM(${jointsDetail.fieldInchDia})`.as('totalInchDia'),
    })
    .from(jointsDetail);

  if (moc) {
    rawDataQuery.where(eq(jointsDetail.moc, moc));
  }

  const rawData = await rawDataQuery.execute();

  return {
    jointsChartData: [
      { metric: 'Shop Joints', value: Number(rawData[0]?.shopJoints || 0) },
      { metric: 'Field Joints', value: Number(rawData[0]?.fieldJoints || 0) },
      { metric: 'Total Joints', value: Number(rawData[0]?.totalJoints || 0) },
    ],
    inchDiaChartData: [
      { metric: 'Shop Inch Dia', value: Number(rawData[0]?.shopInchDia || 0) },
      { metric: 'Field Inch Dia', value: Number(rawData[0]?.fieldInchDia || 0) },
      { metric: 'Total Inch Dia', value: Number(rawData[0]?.totalInchDia || 0) },
    ],
  };
};

export default function MOCJoints({ params }: { params: { MOC: string } }) {
  const moc = params.MOC;
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Query for MOC name
  const { data: mocName, isLoading: isMocNameLoading } = useQuery<string>({
    queryKey: ['mocName', moc],
    queryFn: () => fetchMocName(moc),
    staleTime: Infinity,
  });

  // Query for specific MOC chart data
  const { data: chartData, isLoading: chartLoading } = useQuery<ChartData>({
    queryKey: ['chartData', moc],
    queryFn: () => fetchChartData(moc),
    staleTime: 5 * 60 * 1000,
  });

  // Query for full scope chart data
  const { data: fullScopeChartData, isLoading: fullScopeLoading } = useQuery<ChartData>({
    queryKey: ['fullScopeChartData'],
    queryFn: () => fetchChartData(),
    staleTime: 5 * 60 * 1000,
  });

  // Error and loading states
  if (chartLoading || isMocNameLoading || fullScopeLoading) {
    return (
      <div className="flex items-center h-64">
        <Loader className="animate-spin text-gray-500" size={32} />
      </div>
    );
  }

  // Memoized chart data
  const totalJointsValue = chartData?.jointsChartData.find(item => item.metric === 'Total Joints')?.value || 0;
  const totalInchDiaValue = chartData?.inchDiaChartData.find(item => item.metric === 'Total Inch Dia')?.value || 0;

  const totalFullJointsValue = fullScopeChartData?.jointsChartData.find(item => item.metric === 'Total Joints')?.value || 0;
  const totalFullInchDiaValue = fullScopeChartData?.inchDiaChartData.find(item => item.metric === 'Total Inch Dia')?.value || 0;

  // Callback for button click
  const handleButtonClick = () => {
    setIsDialogOpen(true);
  };

  const renderPieChart = (data: ChartDataItem[], title: string, totalValue: number, totalLabel: string, mocValue: string) => (
    <PieChartComponent
      data={data}
      title={title}
      moc={mocValue}
      chartConfig={{ value: { label: 'value', color: 'hsl(var(--chart-2))' }, label: { color: 'hsl(var(--background))' } }}
      totalValue={totalValue}
      Type={totalLabel}
    />
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-screen w-full p-4">
      {/* Chart 1: Selected MOC Joints Data */}
      {chartData ? renderPieChart(chartData.jointsChartData, mocName || '', totalJointsValue, 'TotalJoints', moc) : 'No Data Available'}


      {/* Chart 2: Selected MOC Inch Dia Data */}
      {chartData ? renderPieChart(chartData.inchDiaChartData, mocName || '', totalInchDiaValue, 'TotalInchDia', moc) : 'No Data Available'}

      {/* Chart 3: Full Scope Joints Data */}
      {fullScopeChartData ? renderPieChart(fullScopeChartData.jointsChartData, mocName || '', totalFullJointsValue, 'OverallJoints', "all") : 'No Data Available'}

      {/* Chart 4: Full Scope Inch Dia Data */}
      {fullScopeChartData ? renderPieChart(fullScopeChartData.inchDiaChartData, mocName || '', totalFullInchDiaValue, 'OverallInchDia', "all") : 'No Data Available'}
    </div>
  );
}

