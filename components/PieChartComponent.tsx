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
  Type: string; // Optional: to customize the label under the total value
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
  Type,
  className = "",
  colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"], // Default colors
  //onButtonClick, // Accessing the click event handler via props
}: PieChartComponentProps) {

  return (
    <Card className={`flex flex-col items-center ${className} p-4`}>
      <CardHeader className="items-center pb-0">
        <CardTitle className="font-bold text-[16px] text-center">{title}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-row justify-center items-center w-full pb-0">
        {/* Left side: Pie chart */}
        <div className="flex justify-center items-center w-1/2"> {/* Ensure pie chart takes 50% of the width */}
          <ChartContainer
            config={chartConfig}
            className="aspect-square w-full max-w-[250px] flex justify-center items-center" // Add fixed width and height
          >
            <PieChart width={250} height={250}> {/* Define specific chart width and height */}
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="metric"
                innerRadius={60} // Increase radius to ensure better visibility
                outerRadius={80} // Increase outer radius for better size
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
                            className="fill-foreground text-2xl font-bold"
                          >
                            {totalValue.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 20}
                            className="fill-muted-foreground text-sm"
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
        </div>

        {/* Right side: Legends and button */}
        <div className="flex flex-col justify-center items-start w-1/2 pl-8"> {/* Add padding and 50% width */}
          <div className="flex flex-col gap-3">
            {data.map((entry, index) => (
              <div
                key={`legend-${index}`}
                className="flex items-center gap-2 leading-none"
              >
                <span
                  className="h-4 w-4"
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></span>
                <span className="text-sm">{entry.metric}: {entry.value.toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Button below the legends */}
          <div className="mt-4">
            <Link href={`/WeldSummaryTable/${moc}/${Type}`}>
              <Button className="bg-blue-400 text-white hover:bg-blue-500">
                Get More Detail
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
