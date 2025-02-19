// app/components/Dashboard.tsx
"use client";

import React, { useState } from "react";
import { Loader } from 'lucide-react';
import { ChevronDown, ChevronUp } from "lucide-react";
import type { PartialInvoiceData } from "@/app/actions/invoiceActions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type DashboardProps = {
  data: PartialInvoiceData[];
  loading?: boolean;
};

type GroupedMOC = {
  mocId: number;
  mocNo: string | null;
  shortDescription: string | null;
  cwo: string | null;
  po: string | null;
  proposal: string | null;
  contractValue: number | null;
  invoices: PartialInvoiceData[];
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
  const [expandedMOCs, setExpandedMOCs] = useState<Set<number>>(new Set());

  const safeString = (value: string | null) => value || "N/A";
  const safeNumber = (value: number | null) => value ?? 0;

  const groupedMOCs = data.reduce((acc, invoice) => {
    const mocId = invoice.mocId;
    if (!acc.has(mocId)) {
      acc.set(mocId, {
        mocId,
        mocNo: invoice.mocNo,
        shortDescription: invoice.shortDescription,
        cwo: invoice.cwo,
        po: invoice.po,
        proposal: invoice.proposal,
        contractValue: invoice.contractValue,
        invoices: [],
      });
    }
    acc.get(mocId)?.invoices.push(invoice);
    return acc;
  }, new Map<number, GroupedMOC>());

  type AggregatedSums = {
    AWARDED_MOCS: number;
    TOTAL_PAID: number;
    OVERALL: number;
  } & Record<StatusKey, number>;

  const aggregatedSums = Array.from(groupedMOCs.values()).reduce(
    (acc, moc) => {
      acc.AWARDED_MOCS += safeNumber(moc.contractValue);
      return acc;
    },
    {
      AWARDED_MOCS: 0,
      OVERALL: data.reduce((sum, row) => sum + (row.amount + row.vat - row.retention), 0),
      TOTAL_PAID: data
        .filter((row) => row.invoiceStatus === "PAID")
        .reduce((sum, row) => sum + (row.amount + row.vat - row.retention), 0),
      ...(Object.keys(statusMapping) as StatusKey[]).reduce((acc, status) => {
        acc[status] = data
          .filter((row) => row.invoiceStatus === status)
          .reduce((sum, row) => sum + (row.amount + row.vat - row.retention), 0);
        return acc;
      }, {} as Record<StatusKey, number>),
    } as AggregatedSums
  );

  const retentionValue = aggregatedSums.TOTAL_PAID * 0.1;
  const paymentPercentage = aggregatedSums.PAID / aggregatedSums.OVERALL || 0;

  const toggleMOCExpansion = (mocId: number) => {
    const newExpanded = new Set(expandedMOCs);
    newExpanded.has(mocId) ? newExpanded.delete(mocId) : newExpanded.add(mocId);
    setExpandedMOCs(newExpanded);
  };

  const filteredMOCs = Array.from(groupedMOCs.values()).map((moc) => ({
    ...moc,
    invoices:
      Object.keys(statusMapping).includes(selectedCard || '')
        ? moc.invoices.filter(invoice => invoice.invoiceStatus === selectedCard)
        : moc.invoices,
  })).filter(moc => moc.invoices.length > 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
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
                  <th className="sticky top-0 bg-blue-50 z-10 w-[40px] px-2 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-blue-100">
                  </th>
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
                  const totalPayable = moc.invoices.reduce(
                    (sum, inv) => sum + (inv.amount + inv.vat - inv.retention),
                    0
                  );
                  const receivedValue = moc.invoices
                    .filter(inv => inv.invoiceStatus === "PAID")
                    .reduce((sum, inv) => sum + (inv.amount + inv.vat - inv.retention), 0);
                  const balanceAmount = awardedValueWithVAT - receivedValue;
                  const isExpanded = expandedMOCs.has(moc.mocId);

                  return (
                    <React.Fragment key={moc.mocId}>
                      <tr
                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 cursor-pointer`}
                        onClick={() => toggleMOCExpansion(moc.mocId)}
                      >
                        <td className="px-2 py-3">
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-blue-600" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </td>
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

                      {isExpanded && moc.invoices.map((invoice) => {
                        const payable = invoice.amount + invoice.vat - invoice.retention;
                        const statusConfig = statusMapping[invoice.invoiceStatus as StatusKey];

                        return (
                          <tr key={invoice.invoiceId} className="bg-blue-50">
                            <td className="px-2"></td>
                            <td className="px-3 py-2 text-sm" colSpan={8}>
                              <div className="grid grid-cols-8 gap-4 items-center">
                                <div className="col-span-2 text-gray-500 truncate" title={invoice.invoiceNo}>
                                  {invoice.invoiceNo}
                                </div>
                                <div className="text-gray-500 text-sm">
                                  {new Date(invoice.invoiceDate).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </div>
                                <div className="col-span-2">
                                  <span className={`${statusConfig.color} font-medium text-sm`}>
                                    {statusConfig.label}
                                  </span>
                                </div>
                                <div className="text-gray-900 text-center font-mono text-sm">
                                  {formatMillions(payable)}
                                </div>
                                <div className="text-gray-500 text-sm text-center font-mono">
                                  {formatMillions(invoice.amount)}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
  className="text-center text-[15px] font-medium bg-gradient-to-r from-blue-50 to-blue-100 
            text-blue-800 border-b border-b-blue-100 py-2 px-4 rounded-t-lg shadow-sm
            transition-all duration-200 hover:bg-blue-50/90"
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


// ... (keep StatusCard component if still needed elsewhere)
export default Dashboard;