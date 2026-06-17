"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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

  const disciplines = Array.from(new Set(tradeValues.map(trade => trade.Discipline)));

  const exportToPDF = async () => {
    const jsPdfModule = await import("jspdf/dist/jspdf.umd.min.js");
    const { jsPDF } = jsPdfModule.default;
    const doc = new jsPDF();
    let y = 20;
  
    const colWidth = 90;
    const marginLeft = 10;
    const rowHeight = 30;
    
    doc.setFontSize(12);
  
    disciplines.forEach(discipline => {
      doc.setFontSize(14);
      doc.text(discipline, marginLeft, y);
      y += 10;
  
      let currentX = marginLeft;
      let currentY = y;
  
      tradeValues
        .filter(trade => trade.Discipline === discipline)
        .forEach((trade, index) => {
          if (index % 2 === 0 && index !== 0) {
            currentX = marginLeft + colWidth + 10;
            currentY = y;
          }
  
          const selectedStatus = trade.selected ? '✔' : '☐';
          doc.text(selectedStatus, currentX, currentY);
          
          doc.text(trade.TradeName, currentX + 15, currentY);
  
          currentY += rowHeight;
  
          if (index % 2 !== 0) {
            currentY = y;
          }
        });
  
      y = currentY + 10;
    });
  
    doc.save('TradeList.pdf');
  };

  return (
    <div>
      <div className="fixed inset-0 flex flex-col justify-center items-center mt-5">
        <div className="w-full max-w-4xl h-[650px] p-6 rounded-lg shadow-lg overflow-hidden">
          <Tabs defaultValue={disciplines[0]}>
            <TabsList className="rounded-md p-2 mb-4 overflow-x-auto">
              {disciplines.map(discipline => (
                <TabsTrigger key={discipline} value={discipline}>
                  {discipline}
                </TabsTrigger>
              ))}
            </TabsList>

            {disciplines.map(discipline => (
              <TabsContent key={discipline} value={discipline}>
                <Card className="border p-4 shadow-none h-full">
                  <CardContent>
                    <div className="h-[500px] overflow-y-auto p-4 rounded-md">
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
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          onClick={exportToPDF}
        >
          Export to PDF
        </button>
      </div>
    </div>
  );
};

export default TradeListComponent;
