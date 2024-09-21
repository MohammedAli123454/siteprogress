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
  pieChartTitle: string;
  moc: string;
  chartConfig: ChartConfig;
  totalValue: number;
  chartCenterMessage: string; // Optional: to customize the label under the total value
  Type: string;
  className?: string;
  colors?: string[]; // Optional: to customize pie chart colors
  //onButtonClick?: () => void; // New prop to handle button click event
}


export function PieChartComponent({
  data,
  pieChartTitle,
  moc,
  chartConfig,
  totalValue,
  chartCenterMessage,
  Type,
  className = "",
  colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"], // Default colors
  //onButtonClick, // Accessing the click event handler via props
}: PieChartComponentProps) {

  return (
    <Card>
    <CardHeader className="items-center pb-0">
      <CardTitle className="text-center text-[16px] font-bold">{pieChartTitle}</CardTitle>
    </CardHeader>
  
    <CardContent className="flex justify-between items-center w-full pb-0">
      {/* Left side: Pie chart */}
      <div className="w-1/2 flex items-start">
        <ChartContainer config={chartConfig} className="w-full aspect-square">
          <PieChart width={250} height={250}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={data} dataKey="value" nameKey="metric" innerRadius={60} outerRadius={80} strokeWidth={5}>
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
                        <tspan x={viewBox.cx} y={viewBox.cy} className="font-bold text-2xl fill-foreground">
                          {totalValue.toLocaleString()}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="text-sm fill-muted-foreground">
                          {chartCenterMessage}
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
      <div className="w-1/2 flex flex-col items-end pl-8 justify-center">
        <div className="flex flex-col gap-3">
          {data.map((entry, index) => (
            <div key={`legend-${index}`} className="flex items-center gap-2 leading-none">
              <span className="w-4 h-4" style={{ backgroundColor: colors[index % colors.length] }}></span>
              <span className="text-sm">
                {entry.metric}: {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
  
        {/* Button below the legends */}




        <div className="mt-4">
<Link href={`/WeldSummaryTable/${moc}/${Type}`}>
  <Button className="text-white bg-blue-400 hover:bg-blue-500">
    Get More Detail
  </Button>
</Link>
</div>





      </div>
    </CardContent>
  </Card>
  

  );



}
