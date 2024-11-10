'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import tradeList from '@/app/tradeList.json';
import Navbar from '../NavBar/page';


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

  const disciplines = Array.from(new Set(tradeValues.map(trade => trade.Discipline)));

  return (
    <div>
      {/* Top Navbar (Always Visible) */}
      <nav className="w-full text-white p-0 fixed top-0 left-0 z-50">

       <Navbar/>
      </nav>

      {/* Fixed Container (Adjusted to avoid covering Navbar) */}
      <div className="fixed inset-0 flex justify-center items-center mt-16 bg-gray-100">
        <div className="w-full max-w-4xl h-[650px] p-6 rounded-lg shadow-lg bg-white overflow-hidden">
          {/* Tabs for switching between disciplines */}
          <Tabs defaultValue={disciplines[0]}>
            <TabsList className="bg-gray-200 rounded-md p-2 mb-4 overflow-x-auto">
              {disciplines.map(discipline => (
                <TabsTrigger key={discipline} value={discipline} className="text-gray-700 hover:text-blue-600">
                  {discipline}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Tab content for each discipline */}
            {disciplines.map(discipline => (
              <TabsContent key={discipline} value={discipline}>
                <Card className="border p-4 shadow-none h-full">
                  <CardContent>
                    {/* Scrollable content with fixed height and internal scrollbar */}
                    <div className="h-[500px] overflow-y-auto p-4 rounded-md">
                      {/* Two-column layout for scrollable items */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {tradeValues
                          .filter(trade => trade.Discipline === discipline)
                          .map(trade => (
                            <div key={trade.TradeName} className="flex items-center space-x-4">
                              <Checkbox
                                checked={trade.selected}
                                onCheckedChange={() => {
                                  const newSelected = !trade.selected;

                                  if (!newSelected) {
                                    updateTrade(trade.TradeName, trade.Discipline, 'nos', '');
                                  }

                                  updateTrade(trade.TradeName, trade.Discipline, 'selected', newSelected);
                                }}
                              />
                              <span className="w-40 text-gray-800">{trade.TradeName}</span>
                              <Input
                                className="w-40 bg-slate-50"
                                placeholder="Enter Required NOS"
                                value={trade.nos}
                                onChange={e => updateTrade(trade.TradeName, trade.Discipline, 'nos', e.target.value)}
                                disabled={!trade.selected}
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
    </div>
  );
};

export default TradeListComponent;
