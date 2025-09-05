"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface AnalyticsChartProps {
  data: ChartData[];
  type: "line" | "bar" | "pie";
  title: string;
  description?: string;
  dataKey?: string;
  xAxisKey?: string;
  yAxisKey?: string;
  color?: string;
  height?: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export function AnalyticsChart({
  data,
  type,
  title,
  description,
  dataKey = "value",
  xAxisKey = "name",
  yAxisKey = "value",
  color = "#0088FE",
  height = 300,
}: AnalyticsChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    switch (type) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey={yAxisKey}
                stroke={color}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <Tooltip />
              <Bar dataKey={yAxisKey} fill={color} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey={dataKey}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{renderChart()}</CardContent>
    </Card>
  );
}

// Simple progress bar component for conversion funnels
interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  color?: string;
}

export function ProgressBar({
  label,
  value,
  max,
  color = "#0088FE",
}: ProgressBarProps) {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">
          {value} / {max}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
