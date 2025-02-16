// app/components/Dashboard.tsx
"use client";

import React, { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp, CheckCircle, Clock, Briefcase, Truck, DollarSign } from "lucide-react";
import type { PartialInvoiceData } from "@/app/actions/invoiceActions";

type DashboardProps = {
  data: PartialInvoiceData[];
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
  PAID: { label: "Paid", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  PMT: { label: "Pending Payment", color: "bg-blue-100 text-blue-800", icon: <Clock className="w-4 h-4" /> },
  FINANCE: { label: "Finance Review", color: "bg-purple-100 text-purple-800", icon: <Briefcase className="w-4 h-4" /> },
  PMD: { label: "Supply Chain", color: "bg-orange-100 text-orange-800", icon: <Truck className="w-4 h-4" /> },
} as const;

type StatusKey = keyof typeof statusMapping;

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [selectedStatus, setSelectedStatus] = useState<StatusKey | null>(null);
  const [expandedMOCs, setExpandedMOCs] = useState<Set<number>>(new Set());

  // Helper functions for null safety
  const safeString = (value: string | null) => value || 'N/A';
  const safeNumber = (value: number | null) => value ?? 0;

  // Group invoices by MOC
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
  } & Record<StatusKey, number>;
  
  const aggregatedSums: AggregatedSums = {
    OVERALL: data.reduce((sum, row) => sum + (row.amount + row.vat - row.retention), 0),
    ...(Object.keys(statusMapping) as StatusKey[]).reduce((acc, status) => {
      acc[status] = data
        .filter(row => row.invoiceStatus === status)
        .reduce((sum, row) => sum + (row.amount + row.vat - row.retention), 0);
      return acc;
    }, {} as Record<StatusKey, number>)
  };

  const maxSum = Math.max(...Object.values(aggregatedSums));

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const toggleMOCExpansion = (mocId: number) => {
    const newExpanded = new Set(expandedMOCs);
    newExpanded.has(mocId) ? newExpanded.delete(mocId) : newExpanded.add(mocId);
    setExpandedMOCs(newExpanded);
  };

  const filteredMOCs = Array.from(groupedMOCs.values()).map(moc => ({
    ...moc,
    invoices: selectedStatus 
      ? moc.invoices.filter(invoice => invoice.invoiceStatus === selectedStatus)
      : moc.invoices
  })).filter(moc => moc.invoices.length > 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Project Financial Dashboard</h1>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Overall Card */}
        <div
          onClick={() => setSelectedStatus(null)}
          className={`p-4 rounded-lg shadow-sm cursor-pointer transition-all ${
            !selectedStatus ? 'ring-2 ring-blue-500' : 'bg-white hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Value</p>
              <p className="text-xl font-bold">{formatCurrency(aggregatedSums.OVERALL)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-500" />
          </div>
          <Progress 
            value={(aggregatedSums.OVERALL / maxSum) * 100} 
            className="h-1 mt-2 bg-gray-200" 
          />
        </div>

        {/* Status Cards */}
        {(Object.keys(statusMapping) as StatusKey[]).map((status) => {
          const config = statusMapping[status];
          return (
            <div
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`p-4 rounded-lg shadow-sm cursor-pointer transition-all ${
                selectedStatus === status ? 'ring-2 ring-blue-500' : 'bg-white hover:shadow-md'
              } ${config.color}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{config.label}</p>
                  <p className="text-xl font-bold">{formatCurrency(aggregatedSums[status])}</p>
                </div>
                <div className="p-2 rounded-full bg-white">
                  {config.icon}
                </div>
              </div>
              <Progress 
                value={(aggregatedSums[status] / maxSum) * 100} 
                className="h-1 mt-2 bg-white/30" 
              />
            </div>
          );
        })}
      </div>

      {/* MOC Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-8 px-4 py-3"></th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">MOC No</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">CWO</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Contract Value</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Invoices</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Total Payable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredMOCs.map(moc => {
              const totalPayable = moc.invoices.reduce(
                (sum, inv) => sum + (inv.amount + inv.vat - inv.retention), 0
              );
              const isExpanded = expandedMOCs.has(moc.mocId);

              return (
                <React.Fragment key={moc.mocId}>
                  <tr 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleMOCExpansion(moc.mocId)}
                  >
                    <td className="px-4 py-2">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </td>
                    <td className="px-6 py-4 font-medium">{safeString(moc.mocNo)}</td>
                    <td className="px-6 py-4">{safeString(moc.cwo)}</td>
                    <td className="px-6 py-4">{formatCurrency(safeNumber(moc.contractValue))}</td>
                    <td className="px-6 py-4">{moc.invoices.length}</td>
                    <td className="px-6 py-4 font-semibold">{formatCurrency(totalPayable)}</td>
                  </tr>

                  {isExpanded && moc.invoices.map(invoice => {
                    const payable = invoice.amount + invoice.vat - invoice.retention;
                    const statusConfig = statusMapping[invoice.invoiceStatus as StatusKey];

                    return (
                      <tr key={invoice.invoiceId} className="bg-gray-50">
                        <td className="px-4"></td>
                        <td className="px-6 py-3 text-sm" colSpan={4}>
                          <div className="grid grid-cols-4 gap-4 items-center">
                            <div>{invoice.invoiceNo}</div>
                            <div>
                              {new Date(invoice.invoiceDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`${statusConfig.color} px-2 py-1 rounded-full text-xs`}>
                                {statusConfig.label}
                              </span>
                            </div>
                            <div>{formatCurrency(payable)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Amount:</span>
                            {formatCurrency(invoice.amount)}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">VAT:</span>
                            {formatCurrency(invoice.vat)}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Retention:</span>
                            {formatCurrency(invoice.retention)}
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
    </div>
  );
};

export default Dashboard;