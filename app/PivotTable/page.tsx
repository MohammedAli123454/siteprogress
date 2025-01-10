"use client";

import React, { useState } from "react";
import Select from "react-select";

// Define the type for sales data
type SalesData = {
  month: string;
  category: string;
  total_sales: number;
};

// Main PivotTable component
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

  // State to manage selected category
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Extract unique categories for the dropdown
  const categoryOptions = Array.from(
    new Set(salesData.map((item) => item.category))
  ).map((category) => ({
    value: category,
    label: category,
  }));

  // Filter data based on selected category
  const filteredData =
    selectedCategory === null
      ? salesData
      : salesData.filter((item) => item.category === selectedCategory);

  return (

    <div className="p-4">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-2xl font-semibold">Sales Data Analysis</h2>
      <div className="w-64">
        <Select
          options={[{ value: null, label: "All Categories" }, ...categoryOptions]}
          onChange={(selectedOption) =>
            setSelectedCategory(selectedOption?.value ?? null)
          }
          placeholder="Select a category"
          isClearable
        />
      </div>
    </div>
  
    <PivotalTable
      data={filteredData}
      rowKey="category"
      columnKey="month"
      valueKey="total_sales"
      formatNumber={(num) => num.toLocaleString()}
    />
  </div>
  );
};

// Props type definition for the generic PivotTable
type PivotalTableProps<T> = {
  data: T[];
  rowKey: keyof T;
  columnKey: keyof T;
  valueKey: keyof T;
  formatNumber?: (num: number) => string;
};

// Helper function to render cell values with optional formatting
const renderCellValue = (
  value: any,
  formatNumber?: (num: number) => string
): React.ReactNode => {
  if (value === undefined || value === null) return "-";
  return typeof value === "number" && formatNumber ? formatNumber(value) : value;
};

// Generic PivotTable component
const PivotalTable = <T extends Record<string, any>>({
  data,
  rowKey,
  columnKey,
  valueKey,
  formatNumber,
}: PivotalTableProps<T>) => {
  // Month ordering based on the calendar
  const monthOrder = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Initialize pivoted data structure
  const pivotedData: Record<string, Record<string, number>> = {};

  // Populate pivotedData
  data.forEach((item) => {
    const { month, category, total_sales } = item;
    if (!pivotedData[category]) {
      pivotedData[category] = {};
    }
    pivotedData[category][month] = total_sales;
  });


  // Extract unique column and row keys
  const columnKeys = [...new Set(data.map((item) => item[columnKey]))].sort(
    (a, b) => monthOrder.indexOf(a as string) - monthOrder.indexOf(b as string)
  );
  const rowKeys = Object.keys(pivotedData);

  // Calculate row totals
  const rowTotals = rowKeys.map((row) =>
    columnKeys.reduce((sum, col) => sum + (pivotedData[row][col] || 0), 0)
  );

  // Calculate column totals
  const columnTotals = columnKeys.map((col) =>
    rowKeys.reduce((sum, row) => sum + (pivotedData[row][col] || 0), 0)
  );

  // Calculate the grand total
  const grandTotal = rowTotals.reduce((sum, val) => sum + (val || 0), 0);

  return (
    <div className="overflow-auto max-h-96">
      <table className="min-w-full border-collapse border border-gray-400 shadow-md">
        <thead>
          <tr className="bg-gray-200">
            {/* <th className="border border-gray-400 px-4 py-2" /> */}
            <th className="border border-gray-400 px-4 py-2">Category</th>
            {columnKeys.map((col) => (
              <th
                key={col as string}
                className="border border-gray-400 px-4 py-2"
              >
                {col}
              </th>
            ))}
            <th className="border border-gray-400 px-4 py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {rowKeys.map((row, rowIndex) => (
            <tr key={row}>
              <td className="border border-gray-400 px-4 py-2 font-medium">
                {row}
              </td>
              {columnKeys.map((col) => (
                <td
                  key={`${row}-${col}`}
                  className="border border-gray-400 px-4 py-2 text-center"
                >
                  {renderCellValue(pivotedData[row][col], formatNumber)}
                </td>
              ))}
              <td className="border border-gray-400 px-4 py-2 text-center">
                {renderCellValue(rowTotals[rowIndex], formatNumber)}
              </td>
            </tr>
          ))}
          <tr className="bg-gray-100">
            <td className="border border-gray-400 px-4 py-2 font-medium">
              Total
            </td>
            {columnTotals.map((total, colIndex) => (
              <td
                key={`total-${colIndex}`}
                className="border border-gray-400 px-4 py-2 text-center"
              >
                {renderCellValue(total, formatNumber)}
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
