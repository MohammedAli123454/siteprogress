'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import tradeList from '@/app/tradeList.json';

interface Trade {
  TradeName: string;
  Discipline: string;
  selected: boolean;
  nos: string | number;
}

const TradeListComponent: React.FC = () => {
  const [tradeValues, setTradeValues] = useState<Trade[]>(
    tradeList.map(trade => ({ ...trade, selected: false, nos: '' }))
  );

  const updateTrade = (tradeName: string, discipline: string, field: keyof Trade, value: any) => {
    setTradeValues(prev =>
      prev.map(trade =>
        trade.TradeName === tradeName && trade.Discipline === discipline
          ? { ...trade, [field]: value }
          : trade
      )
    );
  };

  console.log(tradeValues);
  const disciplines = Array.from(new Set(tradeValues.map(trade => trade.Discipline)));

  return (
    <div className="flex justify-center items-center fixed inset-0 p-4 overflow-hidden bg-gray-100">
      <div className="w-full max-w-4xl h-[650px] p-6 rounded-lg shadow-lg bg-white">
        {/* Tabs for switching between disciplines */}
        <Tabs defaultValue={disciplines[0]}>
          <TabsList className="bg-gray-200 rounded-md p-2 mb-4">
            {disciplines.map(discipline => (
              <TabsTrigger key={discipline} value={discipline} className="text-gray-700 hover:text-blue-600">
                {discipline}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab content for each discipline */}
          {disciplines.map(discipline => (
            <TabsContent key={discipline} value={discipline}>
              <Card className="border p-4 shadow-none h-full bg-gray-50">
                <CardContent>
                  {/* Scrollable content with fixed height and internal scrollbar */}
                  <div className="h-[500px] overflow-y-auto bg-gray-100 p-4 rounded-md">
                    {/* Two-column layout for scrollable items */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {tradeValues
                        .filter(trade => trade.Discipline === discipline)
                        .map(trade => (
                          <div key={trade.TradeName} className="flex items-center space-x-4">
                            <Checkbox
                              checked={trade.selected}
                              onCheckedChange={() => {
                                // Update selected status
                                const newSelected = !trade.selected;

                                // If deselected, reset 'nos' to an empty string
                                if (!newSelected) {
                                  updateTrade(trade.TradeName, trade.Discipline, 'nos', '');
                                }

                                updateTrade(trade.TradeName, trade.Discipline, 'selected', newSelected);
                              }}
                            />
                            <span className="w-40 text-gray-800">{trade.TradeName}</span>
                            <Input
                              className="w-20 bg-gray-200 text-gray-800 border-gray-300"
                              type="number"
                              placeholder="Enter No"
                              value={trade.nos}
                              onChange={e => updateTrade(trade.TradeName, trade.Discipline, 'nos', e.target.value)}
                              disabled={!trade.selected} // Disable input if not selected
                            />
                          </div>
                        ))}
                    </div>
                  </div>
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
