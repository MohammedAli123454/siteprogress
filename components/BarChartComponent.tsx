"use client";
import React from "react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface ChartComponentProps {
  data: { metric: string; value: number }[];
  title: string;
  description: string;
  chartConfig: ChartConfig;
  className?: string;
}

export default function ChartComponent({
  data,
  title,
  description,
  chartConfig,
  className = '',
}: ChartComponentProps) {
  return (
    <Card className={`p-4 w-full ${className}`}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{
              right: 16,
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="metric"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
              hide
            />
            <XAxis dataKey="value" type="number" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <Bar dataKey="value" layout="vertical" fill="var(--color-value)" radius={4}>
              <LabelList
                dataKey="metric"
                position="insideLeft"
                offset={8}
                className="fill-[--color-label]"
                fontSize={14}
              />
              <LabelList
                dataKey="value"
                position="right"
                offset={8}
                className="fill-foreground font-bold"
                fontSize={14}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}