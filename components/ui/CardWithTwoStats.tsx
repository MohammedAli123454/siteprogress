"use client";

import React, { useState } from "react";
import { Loader } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// ... other imports remain the same ...

type CardWithTwoStatsProps = {
    title: string;
    leftLabel: string;
    leftValue: number;
    rightLabel: string;
    rightValue: number;
    leftColor?: string;
    rightColor?: string;
    onClick: () => void;
    isSelected: boolean;
    rightIsPercentage?: boolean;
  };
const formatMillions = (value: number) => {
    const millions = value / 1_000_000;
    return `${millions.toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
  };

  const CardWithTwoStats: React.FC<CardWithTwoStatsProps> = ({
    title,
    leftLabel,
    leftValue,
    rightLabel,
    rightValue,
    leftColor = "text-gray-900",
    rightColor = "text-gray-900",
    onClick,
    isSelected,
    rightIsPercentage = false,
  }) => {
  const formatValue = (value: number, isPercentage: boolean) =>
    isPercentage
      ? value.toLocaleString("en-US", {
          style: "percent",
          minimumFractionDigits: 1,
        })
      : formatMillions(value);

  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all ${
        isSelected ? "border-2 border-blue-500" : "hover:border-gray-300"
      }`}
    >
      <CardHeader className="pb-2">
        <CardTitle
          className={`text-center text-[15px] font-medium text-blue-900/90 py-1.5 px-3.5
          border-b border-blue-200/30 bg-gradient-to-r from-blue-100/70 to-blue-100/30
          backdrop-blur-sm rounded-t-xl transition-all duration-300 ${
            isSelected
              ? "bg-blue-100/50 border-b-blue-300/30"
              : "hover:bg-blue-100/40"
          }`}
        >
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-5 items-center gap-x-1">
            <span className="col-span-4 text-sm text-gray-600 truncate">{leftLabel}</span>
            <span className={`col-span-1 text-xl font-normal ${leftColor} text-right`}>
              {formatValue(leftValue, false)}
            </span>
          </div>
          <div className="grid grid-cols-5 items-center gap-x-1">
            <span className="col-span-4 text-sm text-gray-600 truncate">{rightLabel}</span>
            <span className={`col-span-1 text-xl font-normal ${rightColor} text-right`}>
              {formatValue(rightValue, rightIsPercentage)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

