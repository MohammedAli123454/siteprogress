"use client";

import React, { useState } from "react";
import { Loader } from 'lucide-react';
import { ChevronDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GroupedMOC } from "@/app/actions/invoiceActions";

type DashboardProps = {
  data: GroupedMOC[];
  loading?: boolean;
};


const statusMapping = {
  PAID: { label: "Total Received Payment", color: "text-green-600" },
  FINANCE: { label: "Invoices Under Finance", color: "text-purple-600" },
  PMD: { label: "Invoices Under Supply Chain", color: "text-orange-600" },
  PMT: { label: "Invoices Under PMT", color: "text-blue-600" },
} as const;

type StatusKey = keyof typeof statusMapping;

const formatMillions = (value: number) => {
  const millions = value / 1_000_000;
  return `${millions.toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
};


const Dashboard: React.FC<DashboardProps> = ({ data, loading }) => {
  const [selectedCard, setSelectedCard] = useState<string | null>('awarded');
  const [selectedType, setSelectedType] = useState<string>('Overall');
  const [selectedMoc, setSelectedMoc] = useState<GroupedMOC | null>(null);

  const safeString = (value: string | null) => value || "N/A";
  const safeNumber = (value: number | null) => value ?? 0;
  const types = Array.from(new Set((data ?? []).map(moc => moc.type))).filter(Boolean) as string[];


  type AggregatedSums = {
    AWARDED_MOCS: number;
    TOTAL_PAID: number;
    OVERALL: number;
  } & Record<StatusKey, number>;

  const filteredMOCsForAggregation = data.filter(moc =>
    selectedType === 'Overall' || moc.type === selectedType
  );

  const allInvoicesForAggregation = filteredMOCsForAggregation.flatMap(moc => moc.invoices);

 // Calculate each aggregation value separately
const AWARDED_MOCS = filteredMOCsForAggregation.reduce(
  (sum, moc) => sum + safeNumber(moc.contractValue),
  0
);

const OVERALL = allInvoicesForAggregation.reduce(
  (sum, row) => sum + ((row?.amount ?? 0) + (row?.vat ?? 0) - (row?.retention ?? 0)),
  0
);

const TOTAL_PAID = allInvoicesForAggregation
  .filter((row) => row?.invoiceStatus === "PAID")
  .reduce(
    (sum, row) => sum + ((row?.amount ?? 0) + (row?.vat ?? 0) - (row?.retention ?? 0)),
    0
  );

// Calculate status-based aggregations
const PAID = allInvoicesForAggregation
  .filter((row) => row?.invoiceStatus === "PAID")
  .reduce(
    (sum, row) => sum + ((row?.amount ?? 0) + (row?.vat ?? 0) - (row?.retention ?? 0)),
    0
  );

const FINANCE = allInvoicesForAggregation
  .filter((row) => row?.invoiceStatus === "FINANCE")
  .reduce(
    (sum, row) => sum + ((row?.amount ?? 0) + (row?.vat ?? 0) - (row?.retention ?? 0)),
    0
  );

const PMD = allInvoicesForAggregation
  .filter((row) => row?.invoiceStatus === "PMD")
  .reduce(
    (sum, row) => sum + ((row?.amount ?? 0) + (row?.vat ?? 0) - (row?.retention ?? 0)),
    0
  );

const PMT = allInvoicesForAggregation
  .filter((row) => row?.invoiceStatus === "PMT")
  .reduce(
    (sum, row) => sum + ((row?.amount ?? 0) + (row?.vat ?? 0) - (row?.retention ?? 0)),
    0
  );

// Combine all values into the aggregatedSums object
const aggregatedSums = {
  AWARDED_MOCS,
  OVERALL,
  TOTAL_PAID,
  PAID,
  FINANCE,
  PMD,
  PMT,
} as AggregatedSums;

  const retentionValue = allInvoicesForAggregation
    .filter(row => row?.invoiceStatus === "PAID")
    .reduce((sum, row) => sum + (row?.retention ?? 0), 0);

  const paymentPercentage = aggregatedSums.PAID / aggregatedSums.OVERALL || 0;

  const filteredMOCs = (data ?? [])
  .filter(moc => selectedType === 'Overall' || moc.type === selectedType)
  .map(moc => ({
    ...moc,
    invoices: Object.keys(statusMapping).includes(selectedCard || '')
      ? (moc.invoices ?? []).filter(invoice => invoice.invoiceStatus === selectedCard)
      : moc.invoices ?? []
  }))
  .filter(moc => (moc.invoices ?? []).length > 0);


  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Dropdown Menu */}
      <div className="mb-4 flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              {selectedType} <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedType('Overall')}>
              Overall
            </DropdownMenuItem>
            {types.map(type => (
              <DropdownMenuItem key={type} onClick={() => setSelectedType(type)}>
                {type}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-8">
        <MergedCard
          title="Contract Value Summary"
          leftLabel="Awarded Contract Value"
          leftValue={aggregatedSums.AWARDED_MOCS}
          rightLabel="Total Invoices Submitted"
          rightValue={aggregatedSums.OVERALL}
          onClick={() => setSelectedCard(prev => prev === 'awarded' ? 'submitted' : 'awarded')}
          isSelected={selectedCard === 'awarded' || selectedCard === 'submitted'}
        />

        <MergedCard
          title="Collection Summary"
          leftLabel={statusMapping.PAID.label}
          leftValue={aggregatedSums.PAID}
          rightLabel="Coll. % vs Submitted Inv."
          rightValue={paymentPercentage}
          leftColor={statusMapping.PAID.color}
          rightIsPercentage={true}  // Add this line
          onClick={() => setSelectedCard(prev => prev === 'PAID' ? 'percentage' : 'PAID')}
          isSelected={selectedCard === 'PAID' || selectedCard === 'percentage'}
        />

        <MergedCard
          title="Invoices to Finance & SC"
          leftLabel={statusMapping.FINANCE.label}
          leftValue={aggregatedSums.FINANCE}
          rightLabel={statusMapping.PMD.label}
          rightValue={aggregatedSums.PMD}
          leftColor={statusMapping.FINANCE.color}
          rightColor={statusMapping.PMT.color}
          onClick={() => setSelectedCard(prev => prev === 'FINANCE' ? 'PMT' : 'FINANCE')}
          isSelected={selectedCard === 'FINANCE' || selectedCard === 'PMT'}
        />

        <MergedCard
          title="Invoices Under PMT Review"
          leftLabel={statusMapping.PMT.label}
          leftValue={aggregatedSums.PMT}
          rightLabel="Retention Value"
          rightValue={retentionValue}
          leftColor={statusMapping.PMD.color}
          rightColor="text-amber-600"
          onClick={() => setSelectedCard(prev => prev === 'PMD' ? 'retention' : 'PMD')}
          isSelected={selectedCard === 'PMD' || selectedCard === 'retention'}
        />
      </div>


      {/* MOC Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center items-center">
            <Loader color="blue" size={48} />;
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full table-fixed">
              <thead className="bg-blue-50">
                <tr>
                  <th className="sticky top-0 bg-blue-50 z-10 w-[50px] px-3 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-blue-100">
                    Sr. No
                  </th>
                  {/* Remove chevron column */}
                  <th className="sticky top-0 bg-blue-50 z-10 w-[150px] px-3 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-blue-100">
                    MOC/Project No
                  </th>
                  <th className="sticky top-0 bg-blue-50 z-10 w-[200px] px-3 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-blue-100">
                    Description
                  </th>
                  <th className="sticky top-0 bg-blue-50 z-10 w-[120px] px-3 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-blue-100">
                    CWO No
                  </th>
                  <th className="sticky top-0 bg-blue-50 z-10 w-[150px] px-3 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-blue-100">
                    Awarded (SR)
                  </th>
                  <th className="sticky top-0 bg-blue-50 z-10 w-[180px] px-3 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-blue-100">
                    Awarded inc. VAT(SR)
                  </th>
                  <th className="sticky top-0 bg-blue-50 z-10 w-[180px] px-3 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-blue-100">
                    Submitted inc. VAT(SR)
                  </th>
                  <th className="sticky top-0 bg-blue-50 z-10 w-[180px] px-3 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-blue-100">
                    Received inc. VAT(SR)
                  </th>
                  <th className="sticky top-0 bg-blue-50 z-10w-[180px] px-3 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-blue-100">
                    Balance inc. VAT(SR)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMOCs.map((moc, index) => {
                  const awardedValue = safeNumber(moc.contractValue);
                  const awardedValueWithVAT = awardedValue * 1.15;
                  const totalPayable = moc.invoices?.reduce(
                    (sum, inv) => sum + ((inv?.amount ?? 0) + (inv?.vat ?? 0) - (inv?.retention ?? 0)),
                    0
                  ) ?? 0;
                  const receivedValue = moc.invoices
                    ?.filter(inv => inv?.invoiceStatus === "PAID")
                    ?.reduce(
                      (sum, inv) => sum + ((inv?.amount ?? 0) + (inv?.vat ?? 0) - (inv?.retention ?? 0)),
                      0
                    ) ?? 0;
                  const balanceAmount = awardedValueWithVAT - receivedValue;
                

                  return (
                    <tr
                      key={moc.mocId}
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 cursor-pointer`}
                      onClick={() => setSelectedMoc(moc)}
                    >
                      <td className="px-3 py-3 text-sm text-gray-900">
                        {index + 1}
                      </td>
                      {/* Remove chevron cell */}
                      <td className="px-3 py-3 text-sm font-medium text-gray-900 truncate" title={safeString(moc.mocNo)}>
                        {safeString(moc.mocNo)}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600 truncate" title={safeString(moc.shortDescription)}>
                        {safeString(moc.shortDescription)}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500 truncate">
                        {safeString(moc.cwo)}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900 text-center font-mono">
                        {formatMillions(awardedValue)}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900 text-center font-mono font-medium">
                        {formatMillions(awardedValueWithVAT)}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900 text-center font-mono">
                        {formatMillions(totalPayable)}
                      </td>
                      <td className="px-3 py-3 text-sm text-green-600 text-center font-mono font-semibold">
                        {formatMillions(receivedValue)}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900 text-center font-mono">
                        {formatMillions(balanceAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* Invoice Details Dialog */}
      <Dialog open={!!selectedMoc} onOpenChange={(open) => !open && setSelectedMoc(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800">
              MOC {selectedMoc?.mocNo} - Invoice Management
            </DialogTitle>
            <div className="text-sm text-gray-500 mt-1">
              {selectedMoc?.shortDescription}
            </div>
          </DialogHeader>
          <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Contract Value Card */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Contract Value inc. VAT
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-mono text-blue-800">
                    {formatMillions((selectedMoc?.contractValue || 0) * 1.15)}
                  </div>
                </CardContent>
              </Card>

              {/* Total Invoiced Card */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Invoiced
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-mono text-purple-800">
                    {formatMillions(selectedMoc?.invoices.reduce((sum, inv) => sum + inv.amount + inv.vat, 0) || 0)}
                  </div>
                </CardContent>
              </Card>

              {/* Total Received Card */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Received
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-mono text-green-800">
                    {formatMillions(selectedMoc?.invoices
                      .filter(inv => inv.invoiceStatus === "PAID")
                      .reduce((sum, inv) => sum + inv.amount + inv.vat, 0) || 0)}
                  </div>
                </CardContent>
              </Card>

              {/* Retention Card */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Retention Held
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-mono text-amber-800">
                    {formatMillions(selectedMoc?.invoices
                      .filter(inv => inv.invoiceStatus === "PAID")
                      .reduce((sum, inv) => sum + (inv.amount + inv.vat) * 0.10, 0) || 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Invoices Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Invoice #</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount (SR)</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">VAT (SR)</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Retention (SR)</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Net Payable (SR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedMoc?.invoices.map((invoice) => {
                    const totalAmount = invoice.amount + invoice.vat;
                    const retention = totalAmount * 0.10;
                    const netPayable = totalAmount - retention;
                    const statusConfig = statusMapping[invoice.invoiceStatus as StatusKey];

                    return (
                      <tr key={invoice.invoiceId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {invoice.invoiceNo}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(invoice.invoiceDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`${statusConfig.color} inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}>
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-gray-900">
                          {formatMillions(invoice.amount)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-gray-900">
                          {formatMillions(invoice.vat)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-red-600">
                          {formatMillions(retention)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-green-700">
                          {formatMillions(netPayable)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Totals
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-gray-900">
                      {formatMillions(selectedMoc?.invoices.reduce((sum, inv) => sum + inv.amount, 0) || 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-gray-900">
                      {formatMillions(selectedMoc?.invoices.reduce((sum, inv) => sum + inv.vat, 0) || 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-red-700">
                      {formatMillions(selectedMoc?.invoices.reduce((sum, inv) => sum + (inv.amount + inv.vat) * 0.10, 0) || 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-green-700">
                      {formatMillions(selectedMoc?.invoices.reduce((sum, inv) => sum + (inv.amount + inv.vat - (inv.amount + inv.vat) * 0.10), 0) || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

type MergedCardProps = {
  title: string;
  leftLabel: string;
  leftValue: number;
  rightLabel: string;
  rightValue: number;
  leftColor?: string;
  rightColor?: string;
  onClick: () => void;
  isSelected: boolean;
  rightIsPercentage?: boolean;
};

const MergedCard: React.FC<MergedCardProps> = ({
  title,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  leftColor = "text-gray-900",
  rightColor = "text-gray-900",
  onClick,
  isSelected,
  rightIsPercentage = false,
}) => {
  const formatValue = (value: number, isPercentage: boolean) =>
    isPercentage
      ? value.toLocaleString("en-US", {
        style: "percent",
        minimumFractionDigits: 1,
      })
      : formatMillions(value);

  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all ${isSelected ? "border-2 border-blue-500" : "hover:border-gray-300"
        }`}
    >
      <CardHeader className="pb-2">
        <CardTitle
          className={`text-center text-[15px] font-medium text-blue-900/90 py-1.5 px-3.5
          border-b border-blue-200/30 bg-gradient-to-r from-blue-100/70 to-blue-100/30
          backdrop-blur-sm rounded-t-xl transition-all duration-300 ${isSelected
              ? "bg-blue-100/50 border-b-blue-300/30"
              : "hover:bg-blue-100/40"
            }`}
        >
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Left Metric Row */}
          <div className="grid grid-cols-5 items-center gap-x-1">
            <span className="col-span-4 text-sm text-gray-600 truncate">{leftLabel}</span>
            <span className={`col-span-1 text-xl font-normal ${leftColor} text-right`}>
              {formatValue(leftValue, false)}
            </span>
          </div>

          {/* Right Metric Row */}
          <div className="grid grid-cols-5 items-center gap-x-1">
            <span className="col-span-4 text-sm text-gray-600 truncate">{rightLabel}</span>
            <span className={`col-span-1 text-xl font-normal ${rightColor} text-right`}>
              {formatValue(rightValue, rightIsPercentage)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Dashboard;