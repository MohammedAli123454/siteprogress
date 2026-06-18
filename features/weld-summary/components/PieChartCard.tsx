import { Button } from "@/components/ui/button";
import { Label, Pie, PieChart, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface PieChartCardProps {
  data: { metric: string; value: number }[];
  pieChartTitle: string;
  chartConfig: ChartConfig;
  totalValue: number;
  chartCenterMessage: string;
  className?: string;
  colors?: string[];
  isSelected?: boolean;
  onViewDetails: () => void;
}

export function PieChartCard({
  data,
  pieChartTitle,
  chartConfig,
  totalValue,
  chartCenterMessage,
  className = "",
  colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"],
  isSelected = false,
  onViewDetails,
}: PieChartCardProps) {
  return (
    <Card className={`min-h-[var(--summary-card-min-height,320px)] ${className}`}>
      <CardHeader className="items-center px-5 pb-0 pt-5">
        <CardTitle
          className="line-clamp-2 min-h-8 max-w-[92%] text-center text-[13px] font-semibold leading-4"
          title={pieChartTitle}
        >
          {pieChartTitle}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex w-full items-center justify-between px-5 pb-5 pt-2">
        <div className="flex w-[42%] items-start">
          <ChartContainer config={chartConfig} className="aspect-square w-full max-w-[210px]">
            <PieChart width={210} height={210}>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie data={data} dataKey="value" nameKey="metric" innerRadius={50} outerRadius={67} strokeWidth={4}>
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
                          <tspan x={viewBox.cx} y={viewBox.cy} className="font-bold text-xl fill-foreground">
                            {totalValue.toLocaleString()}
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 18} className="text-xs fill-muted-foreground">
                            {chartCenterMessage}
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>

        <div className="flex w-[58%] flex-col items-end justify-center pl-3">
          <div className="flex flex-col gap-2.5">
            {data.map((entry, index) => (
              <div key={`legend-${index}`} className="flex items-center gap-2 leading-none">
                <span className="h-3.5 w-3.5 shrink-0" style={{ backgroundColor: colors[index % colors.length] }}></span>
                <span className="whitespace-nowrap text-[13px]">
                  {entry.metric}: {entry.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <Button
              className="h-9 rounded-md bg-blue-400 px-5 text-sm font-semibold text-white hover:bg-blue-500"
              onClick={onViewDetails}
              type="button"
            >
              {isSelected ? "Hide Details" : "View Details"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
