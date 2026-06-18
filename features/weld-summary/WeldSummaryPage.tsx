'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader } from 'lucide-react';
import { PieChartCard } from '@/features/weld-summary/components/PieChartCard';
import { WeldDetailPanel } from '@/features/weld-summary/components/WeldDetailPanel';
import { Switch } from '@/components/ui/switch';
import { useEffect, useRef, useState } from 'react';
import type { MocSummaryRow, WeldType } from '@/features/weld-summary/types';

type SelectedDetail = {
  moc: string;
  title: string;
  type: WeldType;
} | null;

type ChartItem = {
  id: string;
  title: string;
  moc: string;
  chartData: { metric: string; value: number }[];
  totalValue: number;
  centerMessage: string;
  type: WeldType;
};

const MAX_COLUMN_COUNT = 3;
const MIN_CARD_WIDTH = 430;
const GRID_GAP = 12;

const fetchAllMocsJointsData = async (isInchDia: boolean): Promise<MocSummaryRow[]> => {
  const response = await fetch(`/api/weld-summary?type=${isInchDia ? 'InchDia' : 'Joints'}`, {
    cache: 'no-store',
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to load weld summary.');
  }

  return payload.data ?? [];
};

export default function WeldSummaryPage() {
  const [isInchDia, setIsInchDia] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState<SelectedDetail>(null);
  const [columnCount, setColumnCount] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);

  const {
    data: mocData,
    isLoading: isDataLoading,
    isError: isDataError,
    error: dataError,
  } = useQuery<MocSummaryRow[]>({
    queryKey: ['allMocsJointsData', isInchDia],
    queryFn: () => fetchAllMocsJointsData(isInchDia),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const updateColumnCount = (width: number) => {
      const nextColumnCount = Math.max(
        1,
        Math.min(MAX_COLUMN_COUNT, Math.floor((width + GRID_GAP) / (MIN_CARD_WIDTH + GRID_GAP)))
      );

      setColumnCount((currentColumnCount) =>
        currentColumnCount === nextColumnCount ? currentColumnCount : nextColumnCount
      );
    };

    updateColumnCount(element.getBoundingClientRect().width);

    const resizeObserver = new ResizeObserver(([entry]) => {
      updateColumnCount(entry.contentRect.width);
    });

    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [isDataError, isDataLoading]);

  if (isDataLoading) {
    return (
      <div className="flex items-center h-64">
        <Loader color="blue" size={48} />
      </div>
    );
  }

  if (isDataError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {dataError instanceof Error ? dataError.message : 'Failed to load MOC data.'}
      </div>
    );
  }

  const safeMocData = mocData ?? [];

  const overallShopValue = safeMocData.reduce((sum, moc) => sum + Number(moc.shopJoints || 0), 0);
  const overallFieldValue = safeMocData.reduce((sum, moc) => sum + Number(moc.fieldJoints || 0), 0);
  const overallTotalValue = overallShopValue + overallFieldValue;

  const type: WeldType = isInchDia ? 'InchDia' : 'Joints';
  const centerMessage = isInchDia ? 'Total Inch Dia' : 'Total Joints';

  const overallChartData = [
    { metric: isInchDia ? 'Shop Inch Dia' : 'Shop Joints', value: overallShopValue },
    { metric: isInchDia ? 'Field Inch Dia' : 'Field Joints', value: overallFieldValue },
    { metric: isInchDia ? 'Total Inch Dia' : 'Total Joints', value: overallTotalValue },
  ];

  const chartItems: ChartItem[] = [
    {
      id: `overall-${type}`,
      title: isInchDia ? 'Overall Inch Dia' : 'Overall Joints',
      moc: '*',
      chartData: overallChartData,
      totalValue: overallTotalValue,
      centerMessage: isInchDia ? 'Overall Inch Dia' : 'Overall Joints',
      type,
    },
    ...safeMocData.map((moc) => {
      const shopValue = Number(moc.shopJoints || 0);
      const fieldValue = Number(moc.fieldJoints || 0);

      return {
        id: `${moc.moc}-${type}`,
        title: moc.mocName,
        moc: moc.moc,
        chartData: [
          { metric: isInchDia ? 'Shop Inch Dia' : 'Shop Joints', value: shopValue },
          { metric: isInchDia ? 'Field Inch Dia' : 'Field Joints', value: fieldValue },
          { metric: isInchDia ? 'Total Inch Dia' : 'Total Joints', value: Number(moc.totalJoints || 0) },
        ],
        totalValue: shopValue + fieldValue,
        centerMessage,
        type,
      };
    }),
  ];

  const chartRows = chartItems.reduce<ChartItem[][]>((rows, item, index) => {
    if (index % columnCount === 0) {
      rows.push([]);
    }

    rows[rows.length - 1].push(item);
    return rows;
  }, []);

  const handleToggleType = (checked: boolean) => {
    setIsInchDia(checked);
    setSelectedDetail(null);
  };

  const handleViewDetails = (item: ChartItem) => {
    setSelectedDetail((current) =>
      current?.moc === item.moc && current.type === item.type
        ? null
        : {
            moc: item.moc,
            title: item.title,
            type: item.type,
          }
    );
  };

  return (
    <div className="w-full pb-4 pl-8 pr-2 pt-4">
      <div ref={contentRef} className="space-y-4">
        {chartRows.map((row, rowIndex) => {
          const selectedInRow = row.some(
            (item) => selectedDetail?.moc === item.moc && selectedDetail.type === item.type
          );

          return (
            <div key={`row-${rowIndex}`} className="space-y-4">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,430px),1fr))] gap-3">
                {row.map((item) => (
                  <div key={item.id} className="relative">
                    {item.moc === '*' && (
                      <div className="absolute right-4 top-4 z-10">
                        <label className="flex items-center gap-2 rounded-full bg-white/95 px-2 py-1 text-slate-950 shadow-sm">
                          <Switch
                            checked={isInchDia}
                            onCheckedChange={handleToggleType}
                            className="h-5 w-9 [&>span]:h-4 [&>span]:w-4 [&>span[data-state=checked]]:translate-x-4"
                          />
                          <span className="text-xs font-medium">{isInchDia ? 'Inch Dia' : 'Joints'}</span>
                        </label>
                      </div>
                    )}
                    <PieChartCard
                        data={item.chartData}
                        pieChartTitle={item.title}
                        totalValue={item.totalValue}
                        chartConfig={{
                          value: { label: 'value', color: 'hsl(var(--chart-2))' },
                          label: { color: 'hsl(var(--background))' },
                        }}
                        chartCenterMessage={item.centerMessage}
                        isSelected={selectedDetail?.moc === item.moc && selectedDetail.type === item.type}
                        onViewDetails={() => handleViewDetails(item)}
                      />
                  </div>
                ))}
              </div>

              {selectedInRow && selectedDetail && (
                <WeldDetailPanel
                  moc={selectedDetail.moc}
                  title={selectedDetail.title}
                  type={selectedDetail.type}
                  onClose={() => setSelectedDetail(null)}
                />
              )}
            </div>
          );
        })}

        {safeMocData.length === 0 && (
          <div className="text-center text-gray-500">No MOC data available</div>
        )}
      </div>
    </div>
  );
  
}
