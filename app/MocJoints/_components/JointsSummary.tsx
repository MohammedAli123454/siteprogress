import { useQuery } from '@tanstack/react-query';
import { db } from '@/app/configs/db';
import { sql, eq } from 'drizzle-orm';
import { jointsDetail } from '@/app/configs/schema';

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';

// Define the type for the data returned by the fetchInchDiaSummary function
type JointsSummaryData = {
  shopJoints: number;
  fieldJoints: number;
  totalJoints: number;
};

export default function JointsSummary ({ moc }: { moc: string }) {


  async function fetchInchDiaSummary(moc: string): Promise<JointsSummaryData> {
    const result = await db
      .select({
        shopJoints: sql<number>`SUM(${jointsDetail.shopJoints})`.as('shopjoints'),
        fieldJoints: sql<number>`SUM(${jointsDetail.fieldJoints})`.as('fieldjoints'),
        totalJoints: sql<number>`SUM(${jointsDetail.shopJoints}) + SUM(${jointsDetail.fieldJoints})`.as('totaljoints'),
      })
      .from(jointsDetail)
      .where(eq(jointsDetail.moc, moc))
      .execute();

    // Destructure the result to get the single row returned
    const [data] = result;
    return data;
  }

  // Use React Query to fetch the data
  const { data, isLoading, error } = useQuery({
    queryKey: ['jointsSummary', moc],
    queryFn: () => fetchInchDiaSummary(moc),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <div>Loading...</div>;
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
