"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useCurrency } from "@/lib/currency";

interface SalesDataPoint {
  date: string;
  sales: number;
}

interface SalesChartProps {
  data: SalesDataPoint[];
}

export function SalesChart({ data }: SalesChartProps) {
  const { formatPrice, currency } = useCurrency();

  return (
    <ResponsiveContainer
      width="100%"
      height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(date: string) => {
            const d = new Date(date);
            return `${d.getDate()}/${d.getMonth() + 1}`;
          }}
        />
        <YAxis
          tickFormatter={(value: number) => {
            if (currency.code === "RON") {
              return `${value} ${currency.symbol}`;
            } 
              return `${currency.symbol}${value}`;
            
          }}
        />
        <Tooltip
          formatter={(value: number) => [formatPrice(Number(value)), "Sales"]}
          labelFormatter={(label: string) => {
            const date = new Date(label);
            return date.toLocaleDateString();
          }}
        />
        <Line
          type="monotone"
          dataKey="sales"
          stroke="#8884d8"
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
