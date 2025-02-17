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

// Helper function for currency formatting without symbol
const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

const Dashboard: React.FC<DashboardProps> = ({ data, loading }) => {
  const [selectedStatus, setSelectedStatus] = useState<StatusKey | null>(null);
  const [expandedMOCs, setExpandedMOCs] = useState<Set<number>>(new Set());

  // Helper functions for null safety
  const safeString = (value: string | null) => value || "N/A";
  const safeNumber = (value: number | null) => value ?? 0;

  // Group invoices by MOC using reduce
  const groupedMOCs = data.reduce((acc, invoice) => {
    const mocId = invoice.mocId;
    if (!acc.has(mocId)) {
      acc.set(mocId, {
        mocId,
        mocNo: invoice.mocNo,
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
    OVERALL: number;
    TOTAL_PAID: number;
    TOTAL_CONTRACT_VALUE: number;
  } & Record<StatusKey, number>;

  const aggregatedSums = Array.from(groupedMOCs.values()).reduce(
    (acc, moc) => {
      acc.TOTAL_CONTRACT_VALUE += safeNumber(moc.contractValue);
      return acc;
    },
    {
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
  const paymentPercentage = aggregatedSums.TOTAL_PAID / aggregatedSums.TOTAL_CONTRACT_VALUE || 0;

  const toggleMOCExpansion = (mocId: number) => {
    const newExpanded = new Set(expandedMOCs);
    newExpanded.has(mocId) ? newExpanded.delete(mocId) : newExpanded.add(mocId);
    setExpandedMOCs(newExpanded);
  };

  const filteredMOCs = Array.from(groupedMOCs.values()).map((moc) => ({
    ...moc,
    invoices: selectedStatus
      ? moc.invoices.filter((invoice) => invoice.invoiceStatus === selectedStatus)
      : moc.invoices,
  })).filter((moc) => moc.invoices.length > 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Project Financial Dashboard</h1>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Overall Card */}
        <StatusCard
          label="Total Invoices Submitted"
          value={aggregatedSums.OVERALL}
          isSelected={!selectedStatus}
          onClick={() => setSelectedStatus(null)}
        />

        {/* Payment Percentage Card */}
        <div
          onClick={() => setSelectedStatus(null)}
          className={`p-4 rounded-lg border bg-white cursor-pointer transition-all ${
            !selectedStatus ? "border-2 border-blue-500" : "hover:border-gray-300"
          }`}
        >
          <p className="text-sm font-medium text-gray-600">Payment % Received (TA & Non-TA)</p>
          <p className="text-xl font-bold text-gray-900">
            {paymentPercentage.toLocaleString("en-US", { style: "percent", minimumFractionDigits: 1 })}
          </p>
        </div>

        {/* Status Cards */}
        {(Object.keys(statusMapping) as StatusKey[]).map((status) => (
          <StatusCard
            key={status}
            label={statusMapping[status].label}
            value={aggregatedSums[status]}
            color={statusMapping[status].color}
            isSelected={selectedStatus === status}
            onClick={() => setSelectedStatus(status)}
          />
        ))}
      </div>

      {/* MOC Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center items-center">
              <Loader color="blue" size={48} />;
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-8 px-2 py-2"></th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase">MOC/Project No</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase">CWO</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase">MOC/Project Value</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase">Issued Invoices</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase">Client Payable</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase">Balance Amount to Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMOCs.map((moc) => {
                const totalPayable = moc.invoices.reduce(
                  (sum, inv) => sum + (inv.amount + inv.vat - inv.retention),
                  0
                );
                const balanceAmount = safeNumber(moc.contractValue) * 1.15 - totalPayable;
                const isExpanded = expandedMOCs.has(moc.mocId);

                return (
                  <React.Fragment key={moc.mocId}>
                    <tr
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleMOCExpansion(moc.mocId)}
                    >
                      <td className="px-2 py-2">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </td>
                      <td className="px-4 py-2 font-medium text-gray-900">{safeString(moc.mocNo)}</td>
                      <td className="px-4 py-2 text-gray-600">{safeString(moc.cwo)}</td>
                      <td className="px-4 py-2 text-gray-900">{formatNumber(safeNumber(moc.contractValue))}</td>
                      <td className="px-4 py-2 text-gray-600">{moc.invoices.length}</td>
                      <td className="px-4 py-2 font-semibold text-gray-900">{formatNumber(totalPayable)}</td>
                      <td className="px-4 py-2 text-gray-900">{formatNumber(balanceAmount)}</td>
                    </tr>

                    {isExpanded && moc.invoices.map((invoice) => {
                      const payable = invoice.amount + invoice.vat - invoice.retention;
                      const statusConfig = statusMapping[invoice.invoiceStatus as StatusKey];

                      return (
                        <tr key={invoice.invoiceId} className="bg-gray-50">
                          <td className="px-2"></td>
                          <td className="px-4 py-1 text-sm" colSpan={6}>
                            <div className="grid grid-cols-6 gap-4 items-center">
                              <div className="text-gray-500">{invoice.invoiceNo}</div>
                              <div className="text-gray-500">
                                {new Date(invoice.invoiceDate).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                              <div className="col-span-2">
                                <span className={`${statusConfig.color} font-medium`}>
                                  {statusConfig.label}
                                </span>
                              </div>
                              <div className="text-gray-900">{formatNumber(payable)}</div>
                              <div className="text-gray-500 text-sm">
                                Amount: {formatNumber(invoice.amount)}
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
}: {
  label: string;
  value: number;
  color?: string;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className={`p-4 rounded-lg border bg-white cursor-pointer transition-all ${
      isSelected ? "border-2 border-blue-500" : "hover:border-gray-300"
    }`}
  >
    <p className="text-sm font-medium text-gray-600">{label}</p>
    <p className={`text-xl font-bold ${color}`}>{formatNumber(value)}</p>
  </div>
);

export default Dashboard;