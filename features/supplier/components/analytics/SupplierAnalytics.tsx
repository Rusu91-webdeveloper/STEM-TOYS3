"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

type StatsResponse = {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  commissionEarned: number;
  pendingInvoices: number;
  revenueSeries?: Array<{ date: string; revenue: number }>;
};

type RevenueSeriesPoint = {
  month: string;
  revenue: number;
  commission: number;
};

export function SupplierAnalytics() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenueSeries, setRevenueSeries] = useState<
    RevenueSeriesPoint[] | null
  >(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/supplier/stats", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to load analytics");
        }
        const data = (await res.json()) as StatsResponse;
        setStats(data);
        // Fetch 12-month revenue/commission series
        const r = await fetch("/api/supplier/revenue", { cache: "no-store" });
        if (r.ok) {
          const rs = (await r.json()) as { series: RevenueSeriesPoint[] };
          setRevenueSeries(rs.series);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error || "Failed to load analytics"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Product Performance
        </h1>
        <p className="text-gray-600 mt-1">
          Key metrics and trends for your products and sales.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>All-time supplier revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              €{stats.totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>Revenue this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              €{stats.monthlyRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Orders</CardTitle>
            <CardDescription>All-time orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.totalOrders.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Orders</CardTitle>
            <CardDescription>Orders awaiting action</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.pendingOrders.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Commission Earned</CardTitle>
            <CardDescription>All-time commission</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              €{stats.commissionEarned.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>Active vs total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.activeProducts}/{stats.totalProducts}
            </div>
          </CardContent>
        </Card>
      </div>

      {stats.revenueSeries && stats.revenueSeries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue (last 30 days)</CardTitle>
            <CardDescription>Daily supplier revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {/* Simple inline chart using SVG to avoid new deps; can swap to Recharts later */}
              <RevenueSparkline data={stats.revenueSeries} />
            </div>
          </CardContent>
        </Card>
      )}

      {revenueSeries && revenueSeries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Commission (last 12 months)</CardTitle>
            <CardDescription>Monthly totals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2 pr-6">Month</th>
                    <th className="py-2 pr-6">Revenue</th>
                    <th className="py-2 pr-6">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueSeries.map(p => (
                    <tr key={p.month} className="border-t">
                      <td className="py-2 pr-6">{p.month}</td>
                      <td className="py-2 pr-6">
                        €{p.revenue.toLocaleString()}
                      </td>
                      <td className="py-2 pr-6">
                        €{p.commission.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RevenueSparkline({
  data,
}: {
  data: Array<{ date: string; revenue: number }>;
}) {
  if (data.length === 0) return null;
  const width = 800;
  const height = 200;
  const padding = 20;
  const xs = data.map((_, i) => i);
  const ys = data.map(d => d.revenue);
  const xMin = 0;
  const xMax = xs.length - 1;
  const yMin = 0;
  const yMax = Math.max(...ys, 1);
  const scaleX = (x: number) =>
    padding + (x - xMin) * ((width - padding * 2) / (xMax - xMin || 1));
  const scaleY = (y: number) =>
    height -
    padding -
    (y - yMin) * ((height - padding * 2) / (yMax - yMin || 1));
  const path = xs
    .map((x, i) => `${i === 0 ? "M" : "L"}${scaleX(x)},${scaleY(ys[i])}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <polyline
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        points={xs.map((x, i) => `${scaleX(x)},${scaleY(ys[i])}`).join(" ")}
      />
      {/* Axes baseline */}
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="#e5e7eb"
      />
      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={height - padding}
        stroke="#e5e7eb"
      />
    </svg>
  );
}
