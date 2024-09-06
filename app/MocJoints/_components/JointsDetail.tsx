import { useQuery } from '@tanstack/react-query';
import { db } from '@/app/configs/db';
import { sql, eq } from 'drizzle-orm';
import { jointsDetail } from '@/app/configs/schema';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Loader } from 'lucide-react';

export default function JointsDetail({ moc, selectedSidebar }: { moc: string; selectedSidebar: 'singleMoc' | 'allMocs' }) {
  function fetchJointsDetail(moc: string, selectedSidebar: 'singleMoc' | 'allMocs') {
    // Adjust query based on selectedSidebar state
    const whereClause = selectedSidebar === 'singleMoc' ? eq(jointsDetail.moc, moc) : sql`1 = 1`; // Fetch data for all MOCs if 'allMocs' is selected

    return db
      .select({
        sizeInches: jointsDetail.sizeInches,
        pipeSchedule: jointsDetail.pipeSchedule,
        thickness: jointsDetail.thickness,
        shopJoints: sql`SUM(${jointsDetail.shopJoints})`.as('shopJoints'),
        fieldJoints: sql`SUM(${jointsDetail.fieldJoints})`.as('fieldJoints'),
        totalJoints: sql`SUM(${jointsDetail.totalJoints})`.as('totalJoints'),
      })
      .from(jointsDetail)
      .where(whereClause)
      .groupBy(jointsDetail.sizeInches, jointsDetail.pipeSchedule, jointsDetail.thickness)
      .orderBy(sql`${jointsDetail.sizeInches}::numeric ASC`)
      .execute()
      .then(rawData => {
        const pivotedData = [
          { Attribute: 'SIZE (INCHES)', Values: rawData.map(row => row.sizeInches) },
          { Attribute: 'PIPE SCHEDULE', Values: rawData.map(row => row.pipeSchedule) },
          { Attribute: 'THKNESS', Values: rawData.map(row => row.thickness) },
          { Attribute: 'SHOP JOINTS', Values: rawData.map(row => row.shopJoints) },
          { Attribute: 'FIELD JOINTS', Values: rawData.map(row => row.fieldJoints) },
          { Attribute: 'TOTAL JOINTS', Values: rawData.map(row => row.totalJoints) },
        ];

        return { pivotedData };
      });
  }

  // Use React Query to fetch the data
  const { data, isLoading, error } = useQuery({
    queryKey: ['jointsDetail', moc,selectedSidebar],
    queryFn: () => fetchJointsDetail(moc,selectedSidebar),
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

  const { pivotedData } = data;

  return (
    <Card className="w-full">
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-center">
          {selectedSidebar === 'singleMoc' ? `${moc} JOINT SUMMARY` : 'ALL MOC JOINT SUMMARY'}
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="overflow-auto">
        <div className="w-full overflow-x-auto">
          <Table className="w-full min-w-max">
            <TableBody>
              {pivotedData.map((row, rowIndex) => (
                <TableRow key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-100' : 'bg-white'}>
                  <TableCell className="font-semibold px-1 py-1">{row.Attribute}</TableCell>
                  {row.Values.map((value, index) => (
                    <TableCell className="px-2 py-1" key={index}>{String(value)}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
