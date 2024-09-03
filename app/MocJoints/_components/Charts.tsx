import { useQuery } from '@tanstack/react-query';
import { db } from '@/app/configs/db';
import { sql, eq } from 'drizzle-orm';
import { jointsDetail } from '@/app/configs/schema';
import ChartComponent from '@/components/BarChartComponent';
import { Loader } from 'lucide-react';
import { PieChartComponent } from '@/components/PieChartComponent';


// Define the type for chart data
type ChartDataItem = {
  metric: string;
  value: number;
};

export default function Charts({ moc, selectedSidebar }: { moc: string; selectedSidebar: 'singleMoc' | 'allMocs' }) {
  // Fetch data function
  async function fetchChartData(moc: string, selectedSidebar: 'singleMoc' | 'allMocs') {
    const whereClause = selectedSidebar === 'singleMoc' ? eq(jointsDetail.moc, moc) : sql`1 = 1`; // Fetch data for all MOCs if 'allMocs' is selected
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
      .groupBy(jointsDetail.sizeInches, jointsDetail.pipeSchedule, jointsDetail.thickness)
      .execute();

    // Prepare chart data in the format needed for the charts
    const jointsChartData: ChartDataItem[] = [
      { metric: "Shop Joints", value: rawData.reduce((acc, row) => acc + (Number(row.shopJoints) || 0), 0) },
      { metric: "Field Joints", value: rawData.reduce((acc, row) => acc + (Number(row.fieldJoints) || 0), 0) },
      { metric: "Total Joints", value: rawData.reduce((acc, row) => acc + (Number(row.totalJoints) || 0), 0) },
    ];

    const inchDiaChartData: ChartDataItem[] = [
      { metric: "Shop Inch Dia", value: rawData.reduce((acc, row) => acc + (Number(row.shopInchDia) || 0), 0) },
      { metric: "Field Inch Dia", value: rawData.reduce((acc, row) => acc + (Number(row.fieldInchDia) || 0), 0) },
      { metric: "Total Inch Dia", value: rawData.reduce((acc, row) => acc + (Number(row.totalInchDia) || 0), 0) },
    ];

    return { jointsChartData, inchDiaChartData };
  }

  // Use React Query to fetch the data
  const { data, isLoading, error } = useQuery({
    queryKey: ['chartData', moc],  // Removed selectedSidebar from queryKey
    queryFn: () => fetchChartData(moc, selectedSidebar), // Pass selectedSidebar as a parameter
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin text-gray-500" size={32} />
      </div>
    );
  }
  if (error || !data) return <div>Error fetching data</div>;

  const { jointsChartData, inchDiaChartData } = data;

  const chartConfig = {
    value: {
      label: "value",
      color: "hsl(var(--chart-2))",
    },
    label: {
      color: "hsl(var(--background))",
    },
  };

  return (
    <div className="flex flex-col md:flex-row justify-center md:justify-between my-4">
      <div className="w-full md:w-1/2 lg:w-1/2 p-1">
        <PieChartComponent
          data={jointsChartData}
          title="Total Joints Chart"
          description="Bar chart representing total joints"
          chartConfig={chartConfig}
          className="flex-1"
        />
      </div>
      <div className="w-full md:w-1/2 lg:w-1/2 p-1">
        <PieChartComponent
          data={inchDiaChartData}
          title="Total Inch Dia Chart"
          description="Bar chart representing total inch diameter"
          chartConfig={chartConfig}
          className="flex-1"
        />
      </div>
    </div>
  );
}
