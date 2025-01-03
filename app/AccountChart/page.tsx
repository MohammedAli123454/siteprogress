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
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer as PieResponsiveContainer,
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
  { date: "2024-12-25", type: "INCOME", amount: 1200, category: "Salary" },
  { date: "2024-12-26", type: "EXPENSE", amount: 500, category: "Groceries" },
  { date: "2024-12-27", type: "INCOME", amount: 800, category: "Freelance" },
  { date: "2024-12-28", type: "EXPENSE", amount: 300, category: "Transportation" },
  { date: "2024-12-29", type: "INCOME", amount: 1500, category: "Bonus" },
  { date: "2024-12-30", type: "EXPENSE", amount: 800, category: "Rent" },
  { date: "2024-12-31", type: "INCOME", amount: 1000, category: "Salary" },
  { date: "2024-11-15", type: "EXPENSE", amount: 450, category: "Utilities" },
  { date: "2024-11-20", type: "INCOME", amount: 1000, category: "Freelance" },
  { date: "2024-11-25", type: "EXPENSE", amount: 600, category: "Entertainment" },
  { date: "2024-11-30", type: "INCOME", amount: 1300, category: "Salary" },
  { date: "2024-10-01", type: "EXPENSE", amount: 300, category: "Groceries" },
  { date: "2024-10-05", type: "INCOME", amount: 1100, category: "Salary" },
  { date: "2024-10-10", type: "EXPENSE", amount: 200, category: "Transportation" },
  { date: "2024-10-15", type: "INCOME", amount: 950, category: "Freelance" },
  { date: "2024-09-07", type: "INCOME", amount: 850, category: "Salary" },
  { date: "2024-09-12", type: "EXPENSE", amount: 400, category: "Groceries" },
  { date: "2024-09-18", type: "INCOME", amount: 1300, category: "Bonus" },
  { date: "2024-09-25", type: "EXPENSE", amount: 500, category: "Rent" },
  { date: "2024-08-14", type: "EXPENSE", amount: 600, category: "Utilities" },
  { date: "2024-08-20", type: "INCOME", amount: 1250, category: "Salary" },
  { date: "2024-08-25", type: "EXPENSE", amount: 450, category: "Groceries" },
  { date: "2024-07-30", type: "INCOME", amount: 1000, category: "Salary" },
  { date: "2024-07-31", type: "EXPENSE", amount: 550, category: "Entertainment" },
  { date: "2024-06-30", type: "INCOME", amount: 1000, category: "Freelance" },
  { date: "2024-06-31", type: "EXPENSE", amount: 550, category: "Groceries" },
  { date: "2024-05-30", type: "INCOME", amount: 1000, category: "Freelance" },
  { date: "2024-05-31", type: "EXPENSE", amount: 550, category: "Transportation" },
  { date: "2024-04-28", type: "EXPENSE", amount: 300, category: "Utilities" },
  { date: "2024-04-29", type: "INCOME", amount: 1500, category: "Bonus" },
];

const categoryColors = [
  "#22c55e", "#ef4444", "#2563eb", "#fbbf24", "#9333ea", "#10b981", "#6ee7b7", "#d97706"
];

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

  const categoryData = useMemo(() => {
    const range = DATE_RANGES[dateRange];
    const now = new Date();
    const startDate = range.days
      ? startOfDay(subDays(now, range.days))
      : startOfDay(new Date(0));

    const filtered = transactions.filter(
      (t) => new Date(t.date) >= startDate && new Date(t.date) <= endOfDay(now)
    );

    const grouped = filtered.reduce((acc, transaction) => {
      if (!acc[transaction.category]) {
        acc[transaction.category] = 0;
      }
      acc[transaction.category] += transaction.amount;
      return acc;
    }, {} as Record<string, number>);

    const data = Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
    }));

    return data;
  }, [dateRange]);

  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, day) => ({
        income: acc.income + day.income,
        expense: acc.expense + day.expense,
        balance: acc.income + day.income - (acc.expense + day.expense), // Calculate balance
      }),
      { income: 0, expense: 0, balance: 0 } // Initialize balance as 0
    );
  }, [filteredData]);
  


  type CardProps = {
    title: string;
    value: number;
    color: string;
  };
  
  const CardComponent = ({ title, value, color }: CardProps) => (
    <Card>
      <CardContent className="flex items-center justify-center text-center py-6 space-x-4">
        <div>
          <p className="text-lg gradient-title tracking-wider">{title}</p>
        </div>
        <div>
          <p className={`text-lg font-bold text-${color}`}>${value.toFixed(2)}</p>
        </div>
      </CardContent>
    </Card>
  );

  // Define types for the props
interface CategoryData {
  name: string;
  value: number;
}

interface PieChartComponentProps {
  categoryData: CategoryData[];
  categoryColors: string[];
}

const PieChartComponent = ({ categoryData, categoryColors }: PieChartComponentProps) => (
  // Check if categoryData has items
  categoryData.length > 0 ? (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={categoryData}
          dataKey="value"
          nameKey="name"
          outerRadius="80%"
          innerRadius="60%"
          paddingAngle={5}
          label={({ name, value }) => `${name}: $${value.toFixed(2)}`}
        >
          {categoryData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={categoryColors[index % categoryColors.length]}
            />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  ) : (
    // Fallback message when categoryData is empty
    <p>No data available for the selected range.</p>
  )
);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-7">
        <CardTitle className="text-base font-normal">Transaction Overview</CardTitle>
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
        <div className="grid grid-cols-12 gap-6">
          {/* Left side - Cards */}
          <div className="col-span-12 md:col-span-5 space-y-4">
          <CardComponent title="TOTAL INCOME" value={totals.income} color="green-500" />
          <CardComponent title="TOTAL EXPENSES" value={totals.expense} color="red-500" />
          <CardComponent  title="NET BALANCE"   value={totals.balance}
              color={totals.income - totals.expense >= 0 ? 'green-500' : 'red-500'}
            />
          </div>

          {/* Right side - Pie Chart */}
          <div className="col-span-12 md:col-span-7 flex justify-center">
          <PieChartComponent categoryData={categoryData} categoryColors={categoryColors} />
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-[300px] mt-8">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredData}>
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

