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
  shopInchDia: number;
  fieldInchDia: number;
  totalInchDia: number;
};

// Fetch joint data for all MOCs (Inch Dia only)
const fetchAllMocsInchDiaData = async (): Promise<MocDataType[]> => {
  const rawData = await db
    .select({
      moc: mocDetail.moc,
      mocName: mocDetail.mocName,
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

export default function InchDiaByMoc() {
  // Fetch data for Inch Dia only
  const { data: mocData, isLoading: isDataLoading } = useQuery<MocDataType[]>({
    queryKey: ['allMocsInchDiaData'],
    queryFn: fetchAllMocsInchDiaData,
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
        {/* Loop through each MOC data and render the corresponding Pie chart for Inch Dia */}
        {safeMocData.length > 0 ? (
          safeMocData.map((moc) => {
            const chartData = [
              { metric: 'Shop Inch Dia', value: Number(moc.shopInchDia || 0) },
              { metric: 'Field Inch Dia', value: Number(moc.fieldInchDia || 0) },
              { metric: 'Total Inch Dia', value: Number(moc.totalInchDia || 0) },
            ];

            const totalValue = Number(moc.shopInchDia || 0) + Number(moc.fieldInchDia || 0);

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
                  chartCenterMessage="Total Inch Dia"
                  Type="InchDia"
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
