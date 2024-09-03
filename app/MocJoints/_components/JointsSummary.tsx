import { useQuery } from '@tanstack/react-query';
import { db } from '@/app/configs/db';
import { sql, eq } from 'drizzle-orm';
import { jointsDetail } from '@/app/configs/schema';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Loader } from 'lucide-react';

// Define the type for the data returned by the fetchInchDiaSummary function
type JointsSummaryData = {
  shopJoints: number;
  fieldJoints: number;
  totalJoints: number;
};

export default function JointsSummary({ moc, selectedSidebar }: { moc: string; selectedSidebar: 'singleMoc' | 'allMocs' }) {

  // Fetch data function
  async function fetchInchDiaSummary(moc: string, selectedSidebar: 'singleMoc' | 'allMocs'): Promise<JointsSummaryData> {
    const whereClause = selectedSidebar === 'singleMoc' ? eq(jointsDetail.moc, moc) : sql`1 = 1`; // Fetch data for all MOCs if 'allMocs' is selected

    const result = await db
      .select({
        shopJoints: sql<number>`SUM(${jointsDetail.shopJoints})`.as('shopjoints'),
        fieldJoints: sql<number>`SUM(${jointsDetail.fieldJoints})`.as('fieldjoints'),
        totalJoints: sql<number>`SUM(${jointsDetail.shopJoints}) + SUM(${jointsDetail.fieldJoints})`.as('totaljoints'),
      })
      .from(jointsDetail)
      .where(whereClause)
      .execute();

    // Destructure the result to get the single row returned
    const [data] = result;
    return data;
  }

  // Use React Query to fetch the data
  const { data, isLoading, error } = useQuery({
    queryKey: ['jointsSummary', moc],  // Removed selectedSidebar from queryKey
    queryFn: () => fetchInchDiaSummary(moc, selectedSidebar),  // Pass selectedSidebar as a parameter
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
  if (error || !data) return <div>Error fetching data</div>;  // Added a check for undefined data

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="max-w-md w-full mx-auto">
        <CardHeader>
          <CardTitle className="text-center font-bold text-sm">MOC NO - {moc.toUpperCase()}</CardTitle>
          <CardTitle className="text-center font-bold text-sm">PIPING METALLURGY UPGRADE</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between px-6 py-2">
            <span>SHOP JOINTS FABRICATION</span>
            <span>{data.shopJoints}</span>  {/* Data is guaranteed to be defined here */}
          </div>
          <div className="flex justify-between px-6 py-2">
            <span>FIELD JOINTS FABRICATION</span>
            <span>{data.fieldJoints}</span>
          </div>
          <div className="flex justify-between font-bold px-6 py-2 border-t-2 border-black">
            <span>TOTAL JOINTS</span>
            <span>{data.totalJoints}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
