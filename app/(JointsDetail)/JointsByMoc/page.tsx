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
};

const fetchAllMocsJointsData = async (): Promise<MocDataType[]> => {
  const rawData = await db
    .select({
      moc: mocDetail.moc,
      mocName: mocDetail.mocName,
      shopJoints: sql`SUM(${jointsDetail.shopJoints})`.as('shopJoints'),
      fieldJoints: sql`SUM(${jointsDetail.fieldJoints})`.as('fieldJoints'),
      totalJoints: sql`SUM(${jointsDetail.shopJoints}) + SUM(${jointsDetail.fieldJoints})`.as('totalJoints'),
    })
    .from(mocDetail)
    .innerJoin(jointsDetail, sql`${mocDetail.moc} = ${jointsDetail.moc}`)
    .groupBy(mocDetail.moc, mocDetail.mocName)
    .execute();

  return rawData as MocDataType[];
};

export default function JointsByMoc() {
  // Fetch data for joints only
  const { data: mocData, isLoading: isDataLoading } = useQuery<MocDataType[]>({
    queryKey: ['allMocsJointsData'],
    queryFn: fetchAllMocsJointsData,
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

  return (
    <div className="w-full flex justify-center items-center">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-screen p-4">
        {/* Loop through each MOC data and render the corresponding Pie chart */}
        {safeMocData.length > 0 ? (
          safeMocData.map((moc) => {
            const chartData = [
              { metric: 'Shop Joints', value: Number(moc.shopJoints || 0) },
              { metric: 'Field Joints', value: Number(moc.fieldJoints || 0) },
              { metric: 'Total Joints', value: Number(moc.totalJoints || 0) },
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
                  chartCenterMessage="Total Joints"
                  Type="Joints"
                />
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-500">No MOC data available</div>
        )}
      </div>
    </div>
  );
}
