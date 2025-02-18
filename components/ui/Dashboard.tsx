// app/components/Dashboard.tsx
"use client";

import React, { useState } from "react";
import { Loader } from 'lucide-react';
import { ChevronDown, ChevronUp } from "lucide-react";
import type { PartialInvoiceData } from "@/app/actions/invoiceActions";

type DashboardProps = {
  data: PartialInvoiceData[];
  loading?: boolean;
};

type GroupedMOC = {
  mocId: number;
  mocNo: string | null;
  shortDescription: string | null; // Added here
  cwo: string | null;
  po: string | null;
  proposal: string | null;
  contractValue: number | null;
  invoices: PartialInvoiceData[];
};

const statusMapping = {
  PAID: { label: "Payment Received", color: "text-green-600" },
  FINANCE: { label: "Under Finance", color: "text-purple-600" },
  PMD: { label: "Under Supply Chain", color: "text-orange-600" },
  PMT: { label: "Under PMT Review", color: "text-blue-600" },
} as const;

type StatusKey = keyof typeof statusMapping;

// Helper function for formatting values in millions
const formatMillions = (value: number) => {
  const millions = value / 1_000_000;
  return `${millions.toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
};

const Dashboard: React.FC<DashboardProps> = ({ data, loading }) => {
  const [selectedCard, setSelectedCard] = useState<string | null>('awarded');
  const [expandedMOCs, setExpandedMOCs] = useState<Set<number>>(new Set());

  // Helper functions for null safety
  const safeString = (value: string | null) => value || "N/A";
  const safeNumber = (value: number | null) => value ?? 0;

  // Group invoices by MOC
  const groupedMOCs = data.reduce((acc, invoice) => {
    const mocId = invoice.mocId;
    if (!acc.has(mocId)) {
      acc.set(mocId, {
        mocId,
        mocNo: invoice.mocNo,
        shortDescription: invoice.shortDescription, // Added here
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

  // Calculate aggregated sums
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


  // Calculate payment percentage
  const retentionValue = aggregatedSums.TOTAL_PAID * 0.1;
  const paymentPercentage = aggregatedSums.TOTAL_PAID / aggregatedSums.AWARDED_MOCS || 0;

  const toggleMOCExpansion = (mocId: number) => {
    const newExpanded = new Set(expandedMOCs);
    newExpanded.has(mocId) ? newExpanded.delete(mocId) : newExpanded.add(mocId);
    setExpandedMOCs(newExpanded);
  };

  const filteredMOCs = Array.from(groupedMOCs.values()).map((moc) => ({
    ...moc,
    invoices: 
      // Handle status cards
      Object.keys(statusMapping).includes(selectedCard || '') 
        ? moc.invoices.filter(invoice => invoice.invoiceStatus === selectedCard)
        // Handle special cards (show all invoices)
        : moc.invoices,
  })).filter(moc => moc.invoices.length > 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* <h1 className="text-3xl font-bold text-gray-900 mb-8">Project Financial Dashboard</h1> */}

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8 sticky top-0 z-10 bg-gray-50">
        {/* Awarded MOCs Card */}
        <StatusCard
          label="Awarded Value"
          value={aggregatedSums.AWARDED_MOCS}
          isSelected={selectedCard === 'awarded'}
          onClick={() => setSelectedCard('awarded')}
          compact
        />

        {/* Total Invoices Submitted Card */}
        <StatusCard
          label="Submitted Invoices"
          value={aggregatedSums.OVERALL}
          isSelected={selectedCard === 'submitted'}
          onClick={() => setSelectedCard('submitted')}
          compact
        />

        {/* Status Cards */}
        {(Object.keys(statusMapping) as StatusKey[]).map((status) => (
          <StatusCard
            key={status}
            label={statusMapping[status].label}
            value={aggregatedSums[status]}
            color={statusMapping[status].color}
            isSelected={selectedCard === status}
            onClick={() => setSelectedCard(status)}
            compact
          />
        ))}

        <StatusCard
          label="Retention"
          value={retentionValue}
          isSelected={selectedCard === 'retention'}
          onClick={() => setSelectedCard('retention')}
          compact
          color="text-amber-600"
        />

        {/* Payment Percentage Card */}
        <div
          onClick={() => setSelectedCard('percentage')}
          className={`p-2 rounded-lg border bg-white cursor-pointer transition-all ${
            selectedCard === 'percentage' ? "border-2 border-blue-500" : "hover:border-gray-300"
          }`}
        >
          <div className="flex flex-col gap-0 user-select-none">
            <p className="text-xs font-medium text-gray-600">% Received</p>
            <p className="text-lg font-bold text-gray-900">
              {paymentPercentage.toLocaleString("en-US", { 
                style: "percent", 
                minimumFractionDigits: 1 
              })}
            </p>
          </div>
        </div>
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

// Reusable StatusCard component

const StatusCard = ({
  label,
  value,
  color = "text-gray-900",
  isSelected,
  onClick,
  compact
}: {
  label: string;
  value: number;
  color?: string;
  isSelected: boolean;
  onClick: () => void;
  compact?: boolean;
}) => (
  <div
    onClick={onClick}
    className={`p-4 rounded-lg border bg-white cursor-pointer transition-all ${
      isSelected ? "border-2 border-blue-500" : "hover:border-gray-300"
    }`}
  >
    <div className="flex flex-col gap-1 user-select-none">
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className={`text-xl font-bold ${color}`}>
        {formatMillions(value)}
      </p>
    </div>
  </div>
);

export default Dashboard;