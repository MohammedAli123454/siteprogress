"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import tradeList from '@/app/tradeList.json';
import Navbar from '../NavBar/page';
import { jsPDF } from "jspdf";

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

  const exportToPDF = () => {
    const doc = new jsPDF();
    let y = 20; // Start position for the first row (lower to give space)
  
    // Set the width for columns (make them fit within the page width)
    const colWidth = 90; // Width for the first column (checkbox + trade name)
    const col2Width = 90; // Width for the second column (empty space for alignment)
    const marginLeft = 10; // Left margin for the first column
    const marginTop = 10; // Top margin for the PDF (to avoid cutting off the content)
    const rowHeight = 30; // Height for each row (for consistent spacing)
    
    // Set font size for better readability
    doc.setFontSize(12);
  
    // Loop over each discipline to group trades by discipline
    disciplines.forEach(discipline => {
      // Add the discipline name (larger font)
      doc.setFontSize(14);
      doc.text(discipline, marginLeft, y);
      y += 10; // Space after the discipline name
  
      // Initialize current position for the first column (TradeName and Checkbox)
      let currentX = marginLeft; // Start the first column from the left
      let currentY = y; // Start the Y position from the current position
  
      // Loop through each trade for the current discipline
      tradeValues
        .filter(trade => trade.Discipline === discipline)
        .forEach((trade, index) => {
          if (index % 2 === 0 && index !== 0) {
            // If it's the second column (after one item in the first column), move to the next row
            currentX = marginLeft + colWidth + 10; // Add some space between columns
            currentY = y; // Reset Y position to start the next row
          }
  
          // Draw the checkbox (✔ or ☐) for each trade
          const selectedStatus = trade.selected ? '✔' : '☐';
          doc.text(selectedStatus, currentX, currentY); // Checkbox (Selected or Not)
          
          // Draw the trade name next to the checkbox (space between checkbox and label)
          doc.text(trade.TradeName, currentX + 15, currentY); // Trade name, adjusted for spacing
  
          // Add some vertical spacing for the next row (for the next trade)
          currentY += rowHeight; // Move Y position down for the next trade
  
          // If we reached the second column (after the first one), reset the Y position for the next trade in the first column
          if (index % 2 !== 0) {
            currentY = y; // Reset for the next row in the first column
          }
        });
  
      // After processing all trades for a discipline, move to the next discipline, add spacing
      y = currentY + 10; // Move down for the next discipline
    });
  
    // Save the generated PDF
    doc.save('TradeList.pdf');
  };
  
  
  
  
  

  return (
    <div>
      {/* Top Navbar (Always Visible) */}
      <nav className="w-full text-white p-0 fixed top-0 left-0 z-50">
        <Navbar />
      </nav>

      {/* Fixed Container (Adjusted to avoid covering Navbar) */}
      <div className="fixed inset-0 flex flex-col justify-center items-center mt-5">
        <div className="w-full max-w-4xl h-[650px] p-6 rounded-lg shadow-lg overflow-hidden">
          {/* Tabs for switching between disciplines */}
          <Tabs defaultValue={disciplines[0]}>
            <TabsList className="rounded-md p-2 mb-4 overflow-x-auto">
              {disciplines.map(discipline => (
                <TabsTrigger key={discipline} value={discipline}>
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
