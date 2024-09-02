import { useQuery } from '@tanstack/react-query';
import { db } from '@/app/configs/db';
import { sql, eq } from 'drizzle-orm';
import { jointsDetail } from '@/app/configs/schema';

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableRow, TableCell } from '@/components/ui/table';

export default function JointsDetail({ moc }: { moc: string }) {
  function fetchJointsDetail(moc: string) {
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
      .where(eq(jointsDetail.moc, moc))
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
    queryKey: ['jointsDetail', moc],
    queryFn: () => fetchJointsDetail(moc),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error || !data) return <div>Error fetching data</div>;

  const { pivotedData } = data;

  return (
    <Card className="w-full">
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-center">
          {moc ? `${moc} JOINT SUMMARY` : 'JOINT SUMMARY'}
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


