"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MocWiseDataRow, NumericValue, SizeWiseDataRow, WeldType } from "@/lib/weld-types";

type MocWiseDataType = MocWiseDataRow;
type SizeWiseDataType = SizeWiseDataRow;

type Totals = {
  shopJoints: number;
  fieldJoints: number;
  totalJoints: number;
  shopInchDia: number;
  fieldInchDia: number;
  totalInchDia: number;
};

type WeldDetailPanelProps = {
  moc: string;
  title: string;
  type: WeldType;
  onClose: () => void;
};

const toNumber = (value: NumericValue) => Number(value || 0);

const fetchWeldDetail = async <T,>(moc: string, type: WeldType, scope: "summary" | "pipe-size") => {
  const params = new URLSearchParams({ moc, type, scope });
  const response = await fetch(`/api/weld-detail?${params.toString()}`, {
    cache: "no-store",
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || "Failed to load weld detail.");
  }

  return (payload.data ?? []) as T[];
};

const getMocTotals = (data: MocWiseDataType[]) =>
  data.reduce<Totals>(
    (acc, item) => ({
      shopJoints: acc.shopJoints + toNumber(item.shopJoints),
      fieldJoints: acc.fieldJoints + toNumber(item.fieldJoints),
      totalJoints: acc.totalJoints + toNumber(item.totalJoints),
      shopInchDia: acc.shopInchDia + toNumber(item.shopInchDia),
      fieldInchDia: acc.fieldInchDia + toNumber(item.fieldInchDia),
      totalInchDia: acc.totalInchDia + toNumber(item.totalInchDia),
    }),
    {
      shopJoints: 0,
      fieldJoints: 0,
      totalJoints: 0,
      shopInchDia: 0,
      fieldInchDia: 0,
      totalInchDia: 0,
    }
  );

const getSizeTotals = (data: SizeWiseDataType[]) =>
  data.reduce<Totals>(
    (acc, item) => ({
      shopJoints: acc.shopJoints + toNumber(item.shopJoints),
      fieldJoints: acc.fieldJoints + toNumber(item.fieldJoints),
      totalJoints: acc.totalJoints + toNumber(item.totalJoints),
      shopInchDia: acc.shopInchDia + toNumber(item.shopInchDia),
      fieldInchDia: acc.fieldInchDia + toNumber(item.fieldInchDia),
      totalInchDia: acc.totalInchDia + toNumber(item.totalInchDia),
    }),
    {
      shopJoints: 0,
      fieldJoints: 0,
      totalJoints: 0,
      shopInchDia: 0,
      fieldInchDia: 0,
      totalInchDia: 0,
    }
  );

const renderMetricHeaders = (type: WeldType) =>
  type === "Joints" ? (
    <>
      <TableHead className="sticky top-0 z-30 w-[176px] bg-gray-100 px-3 py-3 text-center font-bold">Shop Joints</TableHead>
      <TableHead className="sticky top-0 z-30 w-[176px] bg-gray-100 px-3 py-3 text-center font-bold">Field Joints</TableHead>
      <TableHead className="sticky top-0 z-30 w-[176px] bg-gray-100 px-3 py-3 text-center font-bold">Total Joints</TableHead>
    </>
  ) : (
    <>
      <TableHead className="sticky top-0 z-30 w-[176px] bg-gray-100 px-3 py-3 text-center font-bold">Shop Inch Dia</TableHead>
      <TableHead className="sticky top-0 z-30 w-[176px] bg-gray-100 px-3 py-3 text-center font-bold">Field Inch Dia</TableHead>
      <TableHead className="sticky top-0 z-30 w-[176px] bg-gray-100 px-3 py-3 text-center font-bold">Total Inch Dia</TableHead>
    </>
  );

const renderSizeMetricCells = (item: SizeWiseDataType, type: WeldType) =>
  type === "Joints" ? (
    <>
      <TableCell className="w-[176px] px-3 py-3 text-center">{toNumber(item.shopJoints).toLocaleString()}</TableCell>
      <TableCell className="w-[176px] px-3 py-3 text-center">{toNumber(item.fieldJoints).toLocaleString()}</TableCell>
      <TableCell className="w-[176px] px-3 py-3 text-center">{toNumber(item.totalJoints).toLocaleString()}</TableCell>
    </>
  ) : (
    <>
      <TableCell className="w-[176px] px-3 py-3 text-center">{toNumber(item.shopInchDia).toLocaleString()}</TableCell>
      <TableCell className="w-[176px] px-3 py-3 text-center">{toNumber(item.fieldInchDia).toLocaleString()}</TableCell>
      <TableCell className="w-[176px] px-3 py-3 text-center">{toNumber(item.totalInchDia).toLocaleString()}</TableCell>
    </>
  );

const renderTotalCells = (totals: Totals, type: WeldType) =>
  type === "Joints" ? (
    <>
      <TableCell className="sticky bottom-0 z-30 w-[176px] bg-slate-50 px-3 py-3 text-center">{totals.shopJoints.toLocaleString()}</TableCell>
      <TableCell className="sticky bottom-0 z-30 w-[176px] bg-slate-50 px-3 py-3 text-center">{totals.fieldJoints.toLocaleString()}</TableCell>
      <TableCell className="sticky bottom-0 z-30 w-[176px] bg-slate-50 px-3 py-3 text-center">{totals.totalJoints.toLocaleString()}</TableCell>
    </>
  ) : (
    <>
      <TableCell className="sticky bottom-0 z-30 w-[176px] bg-slate-50 px-3 py-3 text-center">{totals.shopInchDia.toLocaleString()}</TableCell>
      <TableCell className="sticky bottom-0 z-30 w-[176px] bg-slate-50 px-3 py-3 text-center">{totals.fieldInchDia.toLocaleString()}</TableCell>
      <TableCell className="sticky bottom-0 z-30 w-[176px] bg-slate-50 px-3 py-3 text-center">{totals.totalInchDia.toLocaleString()}</TableCell>
    </>
  );

export function WeldDetailPanel({ moc, title, type, onClose }: WeldDetailPanelProps) {
  const {
    data: mocData = [],
    isLoading: isMocLoading,
    isError: isMocError,
  } = useQuery({
    queryKey: ["inlineMocDetail", moc, type],
    queryFn: () => fetchWeldDetail<MocWiseDataType>(moc, type, "summary"),
    enabled: Boolean(moc),
    retry: 1,
  });

  const {
    data: sizeData = [],
    isLoading: isSizeLoading,
    isError: isSizeError,
  } = useQuery({
    queryKey: ["inlinePipeSizeDetail", moc, type],
    queryFn: () => fetchWeldDetail<SizeWiseDataType>(moc, type, "pipe-size"),
    enabled: Boolean(moc),
    retry: 1,
  });

  const mocTotals = getMocTotals(mocData);
  const sizeTotals = getSizeTotals(sizeData);
  return (
    <Card className="col-span-full overflow-hidden border-blue-200 shadow-md">
      <CardHeader className="flex-row items-start justify-between gap-4 border-b bg-slate-50 p-4">
        <div>
          <CardTitle className="text-xl font-bold leading-tight">{title}</CardTitle>
          <p className="mt-1 text-sm text-slate-500">{moc === "*" ? "Overall summary" : moc}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close details">
          <X className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs defaultValue="summary">
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="pipe-size">Pipe Size Detail</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            {isMocLoading ? (
              <LoadingState />
            ) : isMocError ? (
              <ErrorState message="Error loading summary detail." />
            ) : (
              <SummaryWidgets totals={mocTotals} type={type} />
            )}
          </TabsContent>

          <TabsContent value="pipe-size">
            {isSizeLoading ? (
              <LoadingState />
            ) : isSizeError ? (
              <ErrorState message="Error loading pipe size detail." />
            ) : (
              <div className="h-[430px] overflow-auto rounded-md border">
                <table className="w-full min-w-[980px] table-fixed border-separate border-spacing-0 text-sm">
                  <TableHeader className="bg-gray-100 shadow-sm">
                    <TableRow>
                      <TableHead className="sticky top-0 z-30 w-[90px] bg-gray-100 px-3 py-3 text-center font-bold">Sr.No</TableHead>
                      <TableHead className="sticky top-0 z-30 w-[180px] bg-gray-100 px-3 py-3 text-center font-bold">Size (Inches)</TableHead>
                      <TableHead className="sticky top-0 z-30 w-[180px] bg-gray-100 px-3 py-3 text-center font-bold">Thickness</TableHead>
                      {renderMetricHeaders(type)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sizeData.map((item, index) => (
                      <TableRow key={`${item.SIZE_INCHES}-${item.THKNESS}-${index}`}>
                        <TableCell className="w-[90px] px-3 py-3 text-center">{index + 1}</TableCell>
                        <TableCell className="w-[180px] px-3 py-3 text-center">{item.SIZE_INCHES || 0}</TableCell>
                        <TableCell className="w-[180px] px-3 py-3 text-center">{item.THKNESS || 0}</TableCell>
                        {renderSizeMetricCells(item, type)}
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter className="sticky bottom-0 z-20 bg-slate-50 shadow-[0_-1px_0_0_#e2e8f0]">
                    <TableRow className="font-bold hover:bg-slate-50">
                      <TableCell className="sticky bottom-0 z-30 w-[90px] bg-slate-50 px-3 py-3" />
                      <TableCell className="sticky bottom-0 z-30 w-[180px] bg-slate-50 px-3 py-3" />
                      <TableCell className="sticky bottom-0 z-30 w-[180px] bg-slate-50 px-3 py-3 text-right">Grand Total</TableCell>
                      {renderTotalCells(sizeTotals, type)}
                    </TableRow>
                  </TableFooter>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="flex h-40 items-center justify-center">
      <Loader className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{message}</div>;
}

function SummaryWidgets({ totals, type }: { totals: Totals; type: WeldType }) {
  const detailLabel = type === "Joints" ? "Joints" : "Inch Dia";
  const shopValue = type === "Joints" ? totals.shopJoints : totals.shopInchDia;
  const fieldValue = type === "Joints" ? totals.fieldJoints : totals.fieldInchDia;
  const totalValue = type === "Joints" ? totals.totalJoints : totals.totalInchDia;
  const denominator = totalValue || shopValue + fieldValue || 1;
  const cards = [
    {
      label: `Shop ${detailLabel}`,
      value: shopValue,
      percent: Math.round((shopValue / denominator) * 100),
      barColor: "bg-blue-500",
    },
    {
      label: `Field ${detailLabel}`,
      value: fieldValue,
      percent: Math.round((fieldValue / denominator) * 100),
      barColor: "bg-emerald-500",
    },
    {
      label: `Total ${detailLabel}`,
      value: totalValue,
      percent: 100,
      barColor: "bg-amber-500",
    },
  ];

  return (
    <div className="space-y-5 rounded-md border border-slate-200 bg-white p-5">
      {cards.map((card) => (
        <MetricSummary key={card.label} {...card} />
      ))}
    </div>
  );
}

function MetricSummary({
  label,
  value,
  percent,
  barColor,
}: {
  label: string;
  value: number;
  percent: number;
  barColor: string;
}) {
  const safePercent = Math.min(Math.max(percent, 0), 100);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="font-semibold text-slate-700">{label}</div>
        <div className="flex items-baseline gap-3">
          <span className="text-lg font-bold text-slate-950">{value.toLocaleString()}</span>
          <span className="text-sm font-semibold text-slate-500">{safePercent}%</span>
        </div>
      </div>
      <div className="h-4 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${safePercent}%` }} />
      </div>
    </div>
  );
}
