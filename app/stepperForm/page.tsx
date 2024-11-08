'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import tradeList from '@/app/tradeList.json';

// Define the Trade interface
interface Trade {
  TradeName: string;
  Discipline: string;
  selected: boolean;
  nos: string | number;
}

const typedTradeList: Trade[] = tradeList as Trade[];

// Main component
const TradeListComponent: React.FC = () => {
  const [tradeValues, setTradeValues] = useState<Trade[]>(
    typedTradeList.map((trade) => ({
      ...trade,
      selected: false,
      nos: '',
    }))
  );

  // Toggle selection of a single trade
  const toggleTradeSelection = (tradeName: string, discipline: string) => {
    setTradeValues((prev) =>
      prev.map((trade) =>
        trade.TradeName === tradeName && trade.Discipline === discipline
          ? { ...trade, selected: !trade.selected }
          : trade
      )
    );
  };

  // Handle NOS input change
  const handleNosChange = (tradeName: string, discipline: string, value: string) => {
    setTradeValues((prev) =>
      prev.map((trade) =>
        trade.TradeName === tradeName && trade.Discipline === discipline
          ? { ...trade, nos: value }
          : trade
      )
    );
  };

  // Group trades by discipline
  const groupedTrades = tradeValues.reduce((acc, trade) => {
    if (!acc[trade.Discipline]) {
      acc[trade.Discipline] = [];
    }
    acc[trade.Discipline].push(trade);
    return acc;
  }, {} as Record<string, Trade[]>);

  const disciplines = Object.entries(groupedTrades);

  return (
    <div className="flex justify-center items-center fixed inset-0 p-4">
      <div className="w-full max-w-5xl h-[600px] p-6 rounded-lg shadow-lg space-y-6 bg-white overflow-hidden">
        {/* ShadCN UI Tabs for disciplines */}
        <Tabs defaultValue={disciplines[0]?.[0] || ''}>
          <TabsList>
            {disciplines.map(([discipline]) => (
              <TabsTrigger key={discipline} value={discipline}>
                {discipline}
              </TabsTrigger>
            ))}
          </TabsList>

          {disciplines.map(([discipline, trades]) => (
            <TabsContent key={discipline} value={discipline}>
              <Card className="border p-4 shadow-none h-full overflow-hidden">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg font-semibold">
                    Select the trade persons for {discipline}
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-full">
                  {/* Single ScrollArea with two columns */}
                  <ScrollArea className="h-[450px] overflow-y-auto">
                    <div className="flex space-x-4">
                      {/* First Column - First Half of Trades */}
                      <div className="w-1/2 space-y-4">
                        {trades.slice(0, Math.ceil(trades.length / 2)).map((trade, index) => (
                          <div key={index} className="flex items-center space-x-4">
                            <Checkbox
                              checked={trade.selected}
                              onCheckedChange={() =>
                                toggleTradeSelection(trade.TradeName, trade.Discipline)
                              }
                            />
                            <span className="w-40">{trade.TradeName}</span> {/* Fixed width for Trade name */}
                            <Input
                              className="w-20" // Fixed width for Nos input
                              type="number"
                              placeholder="No."
                              value={trade.nos}
                              onChange={(e) =>
                                handleNosChange(trade.TradeName, trade.Discipline, e.target.value)
                              }
                            />
                          </div>
                        ))}
                      </div>

                      {/* Second Column - Second Half of Trades */}
                      <div className="w-1/2 space-y-4">
                        {trades.slice(Math.ceil(trades.length / 2)).map((trade, index) => (
                          <div key={index} className="flex items-center space-x-4">
                            <Checkbox
                              checked={trade.selected}
                              onCheckedChange={() =>
                                toggleTradeSelection(trade.TradeName, trade.Discipline)
                              }
                            />
                            <span className="w-32">{trade.TradeName}</span> {/* Fixed width for Trade name */}
                            <Input
                              className="w-20" // Fixed width for Nos input
                              type="number"
                              placeholder="No."
                              value={trade.nos}
                              onChange={(e) =>
                                handleNosChange(trade.TradeName, trade.Discipline, e.target.value)
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default TradeListComponent;
