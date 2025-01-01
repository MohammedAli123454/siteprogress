"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const transactions = [
  { date: "2024-12-25", type: "INCOME", amount: 1200 },
  { date: "2024-12-26", type: "EXPENSE", amount: 500 },
  { date: "2024-12-27", type: "INCOME", amount: 800 },
  { date: "2024-12-28", type: "EXPENSE", amount: 300 },
  { date: "2024-12-29", type: "INCOME", amount: 1500 },
  { date: "2024-12-30", type: "EXPENSE", amount: 800 },
  { date: "2024-12-31", type: "INCOME", amount: 1000 },
  { date: "2024-11-15", type: "EXPENSE", amount: 450 },
  { date: "2024-11-20", type: "INCOME", amount: 1000 },
  { date: "2024-11-25", type: "EXPENSE", amount: 600 },
  { date: "2024-11-30", type: "INCOME", amount: 1300 },
  { date: "2024-10-01", type: "EXPENSE", amount: 300 },
  { date: "2024-10-05", type: "INCOME", amount: 1100 },
  { date: "2024-10-10", type: "EXPENSE", amount: 200 },
  { date: "2024-10-15", type: "INCOME", amount: 950 },
  { date: "2024-09-07", type: "INCOME", amount: 850 },
  { date: "2024-09-12", type: "EXPENSE", amount: 400 },
  { date: "2024-09-18", type: "INCOME", amount: 1300 },
  { date: "2024-09-25", type: "EXPENSE", amount: 500 },
  { date: "2024-08-14", type: "EXPENSE", amount: 600 },
  { date: "2024-08-20", type: "INCOME", amount: 1250 },
  { date: "2024-08-25", type: "EXPENSE", amount: 450 },
  { date: "2024-07-30", type: "INCOME", amount: 1000 },
  { date: "2024-07-31", type: "EXPENSE", amount: 550 },
  { date: "2024-06-30", type: "INCOME", amount: 1000 },
  { date: "2024-06-31", type: "EXPENSE", amount: 550 },
  { date: "2024-05-30", type: "INCOME", amount: 1000 },
  { date: "2024-05-31", type: "EXPENSE", amount: 550 },
  { date: "2024-04-28", type: "EXPENSE", amount: 300 },
  { date: "2024-04-29", type: "INCOME", amount: 1500 },
];


//filteredData for All Time
// [
//     { date: "Apr 2024", income: 1500, expense: 300 },
//     { date: "May 2024", income: 1000, expense: 550 },
//     { date: "Jun 2024", income: 1000, expense: 550 },
//     { date: "Jul 2024", income: 1000, expense: 550 },
//     { date: "Aug 2024", income: 1250, expense: 1050 },
//     { date: "Sep 2024", income: 2150, expense: 900 },
//     { date: "Oct 2024", income: 2050, expense: 500 },
//     { date: "Nov 2024", income: 2300, expense: 1050 },
//     { date: "Dec 2024", income: 4500, expense: 1600 }
//   ];


const DATE_RANGES = {
  "7D": { label: "Last 7 Days", days: 7 },
  "1M": { label: "Last Month", days: 30 },
  "3M": { label: "Last 3 Months", days: 90 },
  "6M": { label: "Last 6 Months", days: 180 },
  ALL: { label: "All Time", days: null },
} as const;

type DateRange = keyof typeof DATE_RANGES;

export default function AccountChart() {
  const [dateRange, setDateRange] = useState<DateRange>("1M");

  const filteredData = useMemo(() => {
    const range = DATE_RANGES[dateRange];
    const now = new Date();
    const startDate = range.days
      ? startOfDay(subDays(now, range.days))
      : startOfDay(new Date(0));

    const filtered = transactions.filter(
      (t) => new Date(t.date) >= startDate && new Date(t.date) <= endOfDay(now)
    );

    const grouped = filtered.reduce((acc, transaction) => {
      const dateKey = dateRange === "7D"
        ? format(new Date(transaction.date), "MMM dd")
        : format(new Date(transaction.date), "MMM yyyy");

      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, income: 0, expense: 0 };
      }
      if (transaction.type === "INCOME") {
        acc[dateKey].income += transaction.amount;
      } else {
        acc[dateKey].expense += transaction.amount;
      }
      return acc;
    }, {} as Record<string, { date: string; income: number; expense: number }>);

    return Object.values(grouped).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [dateRange]);

  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, day) => ({
        income: acc.income + day.income,
        expense: acc.expense + day.expense,
      }),
      { income: 0, expense: 0 }
    );
  }, [filteredData]);

console.log(filteredData);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-7">
        <CardTitle className="text-base font-normal">
          Transaction Overview
        </CardTitle>
        <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DATE_RANGES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="flex justify-around mb-6 text-sm">
          <div className="text-center">
            <p className="text-muted-foreground">Total Income</p>
            <p className="text-lg font-bold text-green-500">
              ${totals.income.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Total Expenses</p>
            <p className="text-lg font-bold text-red-500">
              ${totals.expense.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Net</p>
            <p
              className={`text-lg font-bold ${
                totals.income - totals.expense >= 0
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              ${(totals.income - totals.expense).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                formatter={(value) => [`$${value}`, undefined]}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <Bar
                dataKey="income"
                name="Income"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
                barSize={30}
              />
              <Bar
                dataKey="expense"
                name="Expense"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
