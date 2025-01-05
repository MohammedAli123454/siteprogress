"use client";

import React from "react";

// Type definition for sales data
type SalesData = {
  month: string;
  category: string;
  total_sales: number;
};

// SalesTable1 Component
const PivotTable = () => {
  // Static sales data
  const salesData: SalesData[] = [
    { month: "Apr", category: "Clothing", total_sales: 950 },
    { month: "Apr", category: "Electronics", total_sales: 2500 },
    { month: "Aug", category: "Home Appliances", total_sales: 2400 },
    { month: "Aug", category: "Sports", total_sales: 1400 },
    { month: "Dec", category: "Books", total_sales: 700 },
    { month: "Dec", category: "Furniture", total_sales: 3500 },
    { month: "Feb", category: "Electronics", total_sales: 1800 },
    { month: "Feb", category: "Home Appliances", total_sales: 2200 },
    { month: "Jan", category: "Clothing", total_sales: 750 },
    { month: "Jan", category: "Electronics", total_sales: 1500 },
    { month: "Jul", category: "Clothing", total_sales: 1100 },
    { month: "Jul", category: "Electronics", total_sales: 3200 },
    { month: "Jun", category: "Books", total_sales: 800 },
    { month: "Jun", category: "Furniture", total_sales: 2700 },
    { month: "Mar", category: "Books", total_sales: 600 },
    { month: "Mar", category: "Furniture", total_sales: 3000 },
    { month: "May", category: "Home Appliances", total_sales: 1900 },
    { month: "May", category: "Sports", total_sales: 1300 },
    { month: "Nov", category: "Home Appliances", total_sales: 2600 },
    { month: "Nov", category: "Sports", total_sales: 1500 },
    { month: "Oct", category: "Clothing", total_sales: 1250 },
    { month: "Oct", category: "Electronics", total_sales: 4000 },
    { month: "Sep", category: "Books", total_sales: 900 },
    { month: "Sep", category: "Furniture", total_sales: 3100 },
  ];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Sales Data Analysis</h2>
      <PivotalTable
        data={salesData}
        rowKey="category"
        columnKey="month"
        valueKey="total_sales"
        formatNumber={(num) => num.toLocaleString()}
      />
    </div>
  );
};

// Props type for PivotalTable component
type PivotalTableProps<T> = {
  data: T[];
  rowKey: keyof T;
  columnKey: keyof T;
  valueKey: keyof T;
  formatNumber?: (num: number) => string;
};

// Helper to render cell values
const renderCellValue = (value: any, formatNumber?: (num: number) => string): React.ReactNode => {
  if (value === undefined || value === null) return "-";
  return typeof value === "number" && formatNumber ? formatNumber(value) : value;
};

// PivotalTable Component
const PivotalTable = <T extends Record<string, any>>({
  data,
  rowKey,
  columnKey,
  valueKey,
  formatNumber,
}: PivotalTableProps<T>) => {
  // Extract unique row and column keys
  const columnKeys = [...new Set(data.map((item) => item[columnKey]))];
  const rowKeys = [...new Set(data.map((item) => item[rowKey]))];


  console.log("Column Keys" + columnKeys);
  console.log("Row Keys" + rowKeys);

// Column Keys	Apr,Aug,Dec,Feb,Jan,Jul,Jun,Mar,May,Nov,Oct,Sep
// Row Keys	Clothing,Electronics,Home Appliances,Sports,Books,Furniture




// Row Keys	Clothing,Electronics,Home Appliances,Sports,Books,Furniture



  // Map data into row-column structure
  const dataMap = data.reduce((acc, item) => {
    const row = item[rowKey] as string;
    const col = item[columnKey] as string;
    acc[row] = acc[row] || {};
    acc[row][col] = item[valueKey];
    return acc;
  }, {} as Record<string, Record<string, any>>);

  // Calculate totals
  const rowTotals = rowKeys.reduce((totals, row) => {
    totals[row] = columnKeys.reduce(
      (sum, col) => sum + (dataMap[row]?.[col] || 0),
      0
    );
    return totals;
  }, {} as Record<string, number>);

  const columnTotals = columnKeys.reduce((totals, col) => {
    totals[col] = rowKeys.reduce(
      (sum, row) => sum + (dataMap[row]?.[col] || 0),
      0
    );
    return totals;
  }, {} as Record<string, number>);

  const grandTotal = Object.values(columnTotals).reduce((sum, val) => sum + val, 0);

  return (
    <div className="overflow-auto max-h-96">
      <table className="min-w-full border-collapse border border-gray-400 shadow-md">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-400 px-4 py-2" />
            {columnKeys.map((col) => (
              <th key={col as string} className="border border-gray-400 px-4 py-2">
                {col}
              </th>
            ))}
            <th className="border border-gray-400 px-4 py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {rowKeys.map((row) => (
            <tr key={row as string}>
              <td className="border border-gray-400 px-4 py-2 font-medium">{row}</td>
              {columnKeys.map((col) => (
                <td key={`${row}-${col}`} className="border border-gray-400 px-4 py-2 text-center">
                  {renderCellValue(dataMap[row]?.[col], formatNumber)}
                </td>
              ))}
              <td className="border border-gray-400 px-4 py-2 text-center">
                {renderCellValue(rowTotals[row], formatNumber)}
              </td>
            </tr>
          ))}
          <tr className="bg-gray-100">
            <td className="border border-gray-400 px-4 py-2 font-medium">Total</td>
            {columnKeys.map((col) => (
              <td key={col as string} className="border border-gray-400 px-4 py-2 text-center">
                {renderCellValue(columnTotals[col], formatNumber)}
              </td>
            ))}
            <td className="border border-gray-400 px-4 py-2 text-center">
              {renderCellValue(grandTotal, formatNumber)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default PivotTable;
