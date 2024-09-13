import * as React from "react";
import { Button } from "@/components/ui/button"; // Importing your button component
import { TrendingUp } from "lucide-react";
import { Label, Pie, PieChart, Cell } from "recharts";
import { Separator } from "@/components/ui/separator";
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface PieChartComponentProps {
  data: { metric: string; value: number }[];
  title: string;
  moc: string;
  chartConfig: ChartConfig;
  totalValue: number;
  Type?: string; // Optional: to customize the label under the total value
  className?: string;
  colors?: string[]; // Optional: to customize pie chart colors
  //onButtonClick?: () => void; // New prop to handle button click event
}

export function PieChartComponent({
  data,
  title,
  moc,
  chartConfig,
  totalValue,
  Type = "Total",
  className = "",
  colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"], // Default colors
  //onButtonClick, // Accessing the click event handler via props
}: PieChartComponentProps) {
  return (
    <Card className={`flex flex-col ${className}`}>
      <CardHeader className="items-center pb-0">
        <CardTitle className="font-bold text-[16px] text-center">{title}</CardTitle>
        <CardDescription>{moc}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]" // Increased max height
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="metric"
              innerRadius={60} // Increased inner radius
              outerRadius={100} // Added outer radius for a larger pie
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalValue.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {Type}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>

      <Separator className="mb-2" />

      <CardFooter className="flex justify-between items-center gap-2 text-sm">
  <div className="flex flex-col gap-4">
    {data.map((entry, index) => (
      <div
        key={`legend-${index}`}
        className="flex items-center gap-2 leading-none"
      >
        <span
          className="h-4 w-4"
          style={{ backgroundColor: colors[index % colors.length] }}
        ></span>
        {entry.metric}: {entry.value.toLocaleString()}
      </div>
    ))}
  </div>

  {/* Add the command button here */}

  <Link href={`/WeldSummaryTable/${moc}/${Type}`}>
  <Button className="bg-blue-400 text-white hover:bg-blue-500">
    Get More Detail
  </Button>
</Link>
</CardFooter>


    </Card>
  );
}



