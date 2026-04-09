"use client";

import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  Activity,
  BarChart3,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

import { DemoModeBanner } from "@/components/admin/DemoModeBanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboardData, getOperationsOverview } from "@/lib/admin/api";
import type {
  DashboardStat,
  OperationsIssueLine,
  RecentOrder,
  TopProduct,
  OperationsOverview,
  OperationsSupplierTaskLine,
} from "@/lib/admin/api";
import { useCurrency } from "@/lib/currency";

// Mark this route as dynamic to prevent static generation errors
export const dynamic = "force-dynamic";

// Dashboard icons for stats with enhanced styling
const ICONS: Record<string, React.ReactNode> = {
  "Total Revenue": <DollarSign className="h-8 w-8 text-green-600" />,
  "Total Orders": <ShoppingBag className="h-8 w-8 text-blue-600" />,
  "New Customers": <Users className="h-8 w-8 text-purple-600" />,
  "Total Products": <Package className="h-8 w-8 text-orange-600" />,
};

// CurrencyDisplay component for consistent currency formatting
function CurrencyDisplay({ value }: { value: number | string }) {
  const { formatPrice } = useCurrency();
  // Convert string to number if needed
  const numericValue =
    typeof value === "string"
      ? parseFloat(value.replace(/[^0-9.-]+/g, ""))
      : value;
  return <>{formatPrice(numericValue)}</>;
}

// Enhanced StatCard component
function StatCard({ stat }: { stat: DashboardStat }) {
  const Icon = ICONS[stat.title];
  const isPositive = stat.trend === "up";

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">
              {stat.title}
            </p>
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="break-words text-2xl font-bold text-gray-900">
                {stat.title === "Total Revenue" ? (
                  <CurrencyDisplay value={stat.value} />
                ) : (
                  stat.value
                )}
              </p>
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {stat.change}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
          </div>
          <div className="w-fit rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 p-3 transition-all duration-300 group-hover:from-gray-200 group-hover:to-gray-300">
            {Icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatHoursCompact(hours: number | null | undefined) {
  if (typeof hours !== "number" || Number.isNaN(hours)) return "N/A";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.floor(hours)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

function formatDateTimeCompact(value: string | null | undefined) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
}

function percentLabel(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  return `${(value * 100).toFixed(1)}%`;
}

function hoursSinceIso(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return (Date.now() - date.getTime()) / (1000 * 60 * 60);
}

function isSameLocalDay(value: string | null | undefined) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function OpsMetricCard({
  title,
  value,
  hint,
  tone = "default",
}: {
  title: string;
  value: React.ReactNode;
  hint: string;
  tone?: "default" | "danger" | "warning" | "info";
}) {
  const toneClass =
    tone === "danger"
      ? "text-red-700"
      : tone === "warning"
        ? "text-amber-700"
        : tone === "info"
          ? "text-blue-700"
          : "text-gray-900";

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`break-words text-2xl font-bold ${toneClass}`}>
          {value}
        </div>
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      </CardContent>
    </Card>
  );
}

type ActionQueueFilter = "ALL" | "TODAY" | "OVERDUE";

const READY_TO_PLACE_OVERDUE_HOURS = 2;
const AWB_WORK_OVERDUE_HOURS = 12;

// Client component to load dashboard data
export default function AdminDashboard() {
  const [data, setData] = useState<{
    stats: DashboardStat[];
    recentOrders: RecentOrder[];
    topProducts: TopProduct[];
  }>({
    stats: [
      {
        title: "Total Revenue",
        value: "0.00",
        change: "0%",
        trend: "up",
        description: "Last 30 days",
      },
      {
        title: "Total Orders",
        value: "0",
        change: "0%",
        trend: "up",
        description: "Last 30 days",
      },
      {
        title: "New Customers",
        value: "0",
        change: "0%",
        trend: "up",
        description: "Last 30 days",
      },
      {
        title: "Total Products",
        value: "0",
        change: "0%",
        trend: "up",
        description: "Active products",
      },
    ],
    recentOrders: [],
    topProducts: [],
  });
  const [loading, setLoading] = useState(true);
  const [operations, setOperations] = useState<OperationsOverview | null>(null);
  const [operationsLoading, setOperationsLoading] = useState(true);
  const [operationsRefreshing, setOperationsRefreshing] = useState(false);
  const [queueFilter, setQueueFilter] = useState<ActionQueueFilter>("ALL");

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setOperationsLoading(true);

        const [dashboardData, operationsData] = await Promise.all([
          getDashboardData(),
          getOperationsOverview(),
        ]);

        setData(dashboardData);
        setOperations(operationsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
        setOperationsLoading(false);
      }
    };

    fetchData();
  }, []);

  const refreshOperations = async () => {
    try {
      setOperationsRefreshing(true);
      const operationsData = await getOperationsOverview();
      setOperations(operationsData);
    } catch (error) {
      console.error("Error refreshing operations overview:", error);
    } finally {
      setOperationsRefreshing(false);
      setOperationsLoading(false);
    }
  };

  const filteredQueues = useMemo(() => {
    const ready = operations?.actionCenter.readyToPlaceLines || [];
    const awb = operations?.actionCenter.awbWorkLines || [];
    const issues = operations?.actionCenter.issueLines || [];
    const returns = operations?.actionCenter.returnsWaitingAuth || [];

    if (queueFilter === "ALL") {
      return { ready, awb, issues, returns };
    }

    if (queueFilter === "TODAY") {
      return {
        ready: ready.filter(line =>
          isSameLocalDay(line.orderCreatedAt || line.createdAt)
        ),
        awb: awb.filter(line =>
          isSameLocalDay(line.updatedAt || line.createdAt)
        ),
        issues: issues.filter(line =>
          isSameLocalDay(line.updatedAt || line.createdAt)
        ),
        returns: returns.filter(ret =>
          isSameLocalDay(ret.updatedAt || ret.createdAt)
        ),
      };
    }

    return {
      ready: ready.filter(line => {
        const age = hoursSinceIso(line.orderCreatedAt || line.createdAt);
        return typeof age === "number" && age >= READY_TO_PLACE_OVERDUE_HOURS;
      }),
      awb: awb.filter(line => {
        const age = hoursSinceIso(line.updatedAt || line.createdAt);
        return typeof age === "number" && age >= AWB_WORK_OVERDUE_HOURS;
      }),
      issues: issues.filter(
        line =>
          line.needsCustomerNotification ||
          line.isSlaOverdue ||
          (typeof line.issueAgeHours === "number" && line.issueAgeHours >= 24)
      ),
      returns: returns.filter(ret => ret.isAuthOverdue),
    };
  }, [operations, queueFilter]);

  const openOrdersInTabs = (
    lines: Array<
      | Pick<OperationsSupplierTaskLine, "orderId">
      | Pick<OperationsIssueLine, "orderId">
    >,
    limit = 3
  ) => {
    const uniqueOrderIds = Array.from(
      new Set(lines.map(line => line.orderId))
    ).slice(0, limit);
    for (const orderId of uniqueOrderIds) {
      window.open(`/admin/orders/${orderId}`, "_blank", "noopener,noreferrer");
    }
  };

  const readyPlacementQueue = filteredQueues.ready;
  const awbWorkQueue = filteredQueues.awb;
  const issueFollowUpQueue = filteredQueues.issues;
  const returnsAuthQueue = filteredQueues.returns;

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome to your admin dashboard
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="animate-pulse bg-gray-200 h-10 w-32 rounded-md"></div>
            <div className="animate-pulse bg-gray-200 h-10 w-24 rounded-md"></div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-32 rounded-lg"></div>
            </div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-96 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2 text-sm sm:text-base">
            <Activity className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Welcome to your admin dashboard - Monitor your store&apos;s performance</span>
            <span className="sm:hidden">Monitor your store&apos;s performance</span>
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
            <Link href="/admin/fulfillment-issues">
              <AlertCircle className="h-4 w-4 mr-2" />
              Fulfillment Issues
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
            <Link href="/admin/analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Link>
          </Button>
          <Button size="sm" className="w-full sm:w-auto" asChild>
            <Link href="/admin/products">
              <Package className="h-4 w-4 mr-2" />
              Manage Products
            </Link>
          </Button>
        </div>
      </div>

      {/* Demo Mode Banner for VISITOR users */}
      <DemoModeBanner />

      {/* Stats Grid - Enhanced */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {data.stats.map((stat, index) => (
          <StatCard key={index} stat={stat} />
        ))}
      </div>

      {/* Operations Cockpit */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-white">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                Operations Cockpit
              </CardTitle>
              <CardDescription className="text-gray-600 mt-1">
                Daily action center for supplier fulfillment, OOS issues,
                returns, and automation health.
              </CardDescription>
              <p className="text-xs text-gray-500 mt-2">
                {operations?.generatedAt
                  ? `Updated ${formatDateTimeCompact(operations.generatedAt)}`
                  : operationsLoading
                    ? "Loading operational data..."
                    : "Operational data unavailable"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshOperations}
                disabled={operationsRefreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    operationsRefreshing ? "animate-spin" : ""
                  }`}
                />
                Refresh Ops
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/fulfillment-issues">Fulfillment Issues</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/returns">Returns</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/orders">Orders</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            <OpsMetricCard
              title="Ready To Place"
              value={
                operations?.summary.readyToPlaceCount ??
                (operationsLoading ? "..." : 0)
              }
              hint="Supplier lines waiting for manual portal order placement"
              tone="warning"
            />
            <OpsMetricCard
              title="AWB Work Queue"
              value={
                operations?.summary.awbWorkCount ??
                (operationsLoading ? "..." : 0)
              }
              hint="Lines needing AWB upload / shipment completion work"
              tone="info"
            />
            <OpsMetricCard
              title="Open Supplier Issues"
              value={
                operations?.summary.issueCount ??
                (operationsLoading ? "..." : 0)
              }
              hint={`Unnotified: ${operations?.summary.unnotifiedIssueCount ?? 0} • Overdue: ${operations?.summary.overdueIssueCount ?? 0}`}
              tone="danger"
            />
            <OpsMetricCard
              title="Returns Awaiting Supplier"
              value={
                operations?.summary.returnsWaitingAuthCount ??
                (operationsLoading ? "..." : 0)
              }
              hint={`Auth overdue: ${operations?.summary.returnsAuthOverdueCount ?? 0} • Manual refunds pending: ${operations?.summary.manualRefundsPendingCount ?? 0}`}
              tone="default"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-5">
            <OpsMetricCard
              title="Issue Value At Risk"
              value={
                operations?.summary.financialRisk ? (
                  <CurrencyDisplay
                    value={operations.summary.financialRisk.issueValueAtRisk}
                  />
                ) : operationsLoading ? (
                  "..."
                ) : (
                  <CurrencyDisplay value={0} />
                )
              }
              hint="Current open OOS/delay lines (customer-facing value)"
              tone="danger"
            />
            <OpsMetricCard
              title="Returns Exposure"
              value={
                operations?.summary.financialRisk ? (
                  <CurrencyDisplay
                    value={operations.summary.financialRisk.returnsPendingValue}
                  />
                ) : operationsLoading ? (
                  "..."
                ) : (
                  <CurrencyDisplay value={0} />
                )
              }
              hint="Returns waiting supplier authorization"
              tone="warning"
            />
            <OpsMetricCard
              title="Manual Refund Pending"
              value={
                operations?.summary.financialRisk ? (
                  <CurrencyDisplay
                    value={
                      operations.summary.financialRisk
                        .manualRefundsPendingEstimatedAmount
                    }
                  />
                ) : operationsLoading ? (
                  "..."
                ) : (
                  <CurrencyDisplay value={0} />
                )
              }
              hint="Estimated Netopia/manual OOS refund amount"
              tone="warning"
            />
            <OpsMetricCard
              title="Placement Queue Value"
              value={
                operations?.summary.financialRisk ? (
                  <CurrencyDisplay
                    value={operations.summary.financialRisk.readyToPlaceValue}
                  />
                ) : operationsLoading ? (
                  "..."
                ) : (
                  <CurrencyDisplay value={0} />
                )
              }
              hint="Value waiting for manual supplier placement"
              tone="info"
            />
            <OpsMetricCard
              title="AWB Queue Value"
              value={
                operations?.summary.financialRisk ? (
                  <CurrencyDisplay
                    value={operations.summary.financialRisk.awbWorkValue}
                  />
                ) : operationsLoading ? (
                  "..."
                ) : (
                  <CurrencyDisplay value={0} />
                )
              }
              hint="Value waiting for AWB / shipment completion"
              tone="info"
            />
          </div>

          <div className="rounded-xl border bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Action Queue Filters
                </p>
                <p className="text-xs text-gray-600">
                  `Today` uses local date. `Overdue` uses queue-specific rules
                  (placement {READY_TO_PLACE_OVERDUE_HOURS}h+, AWB{" "}
                  {AWB_WORK_OVERDUE_HOURS}h+, issues flagged, returns auth
                  overdue).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(["ALL", "TODAY", "OVERDUE"] as ActionQueueFilter[]).map(
                  filter => (
                    <Button
                      key={filter}
                      size="sm"
                      variant={queueFilter === filter ? "default" : "outline"}
                      onClick={() => setQueueFilter(filter)}
                    >
                      {filter}
                    </Button>
                  )
                )}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={readyPlacementQueue.length === 0}
                onClick={() => openOrdersInTabs(readyPlacementQueue, 3)}
                className="text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Open Top 3 Placement Orders</span>
                <span className="sm:hidden">Top 3 Placement</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={issueFollowUpQueue.length === 0}
                onClick={() => openOrdersInTabs(issueFollowUpQueue, 3)}
                className="text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Open Top 3 Issue Orders</span>
                <span className="sm:hidden">Top 3 Issues</span>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/admin/fulfillment-issues">Open Issues Queue</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/admin/returns">Open Returns Queue</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="border border-amber-100">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Supplier Placement Queue
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-800 border-amber-200"
                  >
                    {readyPlacementQueue.length}
                    {operations &&
                    queueFilter !== "ALL" &&
                    operations.actionCenter.readyToPlaceLines.length !==
                      readyPlacementQueue.length
                      ? ` / ${operations.actionCenter.readyToPlaceLines.length}`
                      : ""}
                  </Badge>
                </div>
                <CardDescription>
                  Paid orders that still need manual supplier portal placement.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {operationsLoading ? (
                  <div className="text-sm text-gray-500">Loading queue...</div>
                ) : readyPlacementQueue.length ? (
                  <div className="space-y-3">
                    {readyPlacementQueue.map(line => (
                      <div
                        key={line.supplierOrderId}
                        className="rounded-lg border bg-white p-3"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              #{line.orderNumber} • {line.supplierName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {line.itemName} ({line.quantity}x)
                            </div>
                            <div className="text-xs text-gray-500">
                              {line.customerName}
                              {line.city ? ` • ${line.city}` : ""} •{" "}
                              {line.paymentStatus}
                            </div>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/orders/${line.orderId}`}>
                              Open
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    No lines waiting for supplier placement.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-cyan-100">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    AWB / Shipment Work Queue
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="bg-cyan-50 text-cyan-800 border-cyan-200"
                  >
                    {awbWorkQueue.length}
                    {operations &&
                    queueFilter !== "ALL" &&
                    operations.actionCenter.awbWorkLines.length !==
                      awbWorkQueue.length
                      ? ` / ${operations.actionCenter.awbWorkLines.length}`
                      : ""}
                  </Badge>
                </div>
                <CardDescription>
                  Supplier lines that are placed and need AWB upload or dispatch
                  completion.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {operationsLoading ? (
                  <div className="text-sm text-gray-500">Loading queue...</div>
                ) : awbWorkQueue.length ? (
                  <div className="space-y-3">
                    {awbWorkQueue.map(line => (
                      <div
                        key={line.supplierOrderId}
                        className="rounded-lg border bg-white p-3"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              #{line.orderNumber} • {line.supplierName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {line.itemName} ({line.quantity}x)
                            </div>
                            <div className="text-xs text-gray-500">
                              Status: {line.status}
                              {line.supplierOrderRef
                                ? ` • Ref: ${line.supplierOrderRef}`
                                : ""}
                              {line.trackingNumber
                                ? ` • AWB: ${line.trackingNumber}`
                                : ""}
                            </div>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/orders/${line.orderId}`}>
                              Open
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    No AWB work pending right now.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-red-100">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Issue Follow-Up Queue
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="bg-red-50 text-red-800 border-red-200"
                  >
                    {issueFollowUpQueue.length}
                    {operations &&
                    queueFilter !== "ALL" &&
                    operations.actionCenter.issueLines.length !==
                      issueFollowUpQueue.length
                      ? ` / ${operations.actionCenter.issueLines.length}`
                      : ""}
                  </Badge>
                </div>
                <CardDescription>
                  OOS and delayed supplier lines that need customer
                  communication or follow-up.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {operationsLoading ? (
                  <div className="text-sm text-gray-500">Loading issues...</div>
                ) : issueFollowUpQueue.length ? (
                  <div className="space-y-3">
                    {issueFollowUpQueue.map(line => (
                      <div
                        key={line.supplierOrderId}
                        className="rounded-lg border bg-white p-3"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">
                              #{line.orderNumber} • {line.supplierName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {line.itemName} ({line.quantity}x) • {line.status}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {line.needsCustomerNotification && (
                                <Badge
                                  variant="outline"
                                  className="bg-red-50 text-red-700 border-red-200"
                                >
                                  Customer not notified
                                </Badge>
                              )}
                              {line.isSlaOverdue && (
                                <Badge
                                  variant="outline"
                                  className="bg-amber-50 text-amber-800 border-amber-200"
                                >
                                  Follow-up overdue
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className="bg-slate-50 text-slate-700"
                              >
                                Issue age:{" "}
                                {formatHoursCompact(line.issueAgeHours)}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="bg-slate-50 text-slate-700"
                              >
                                Inactive:{" "}
                                {formatHoursCompact(line.inactivityHours)}
                              </Badge>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/orders/${line.orderId}`}>
                              Resolve
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    No OOS or delay issues currently open.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-violet-100">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Returns Waiting Supplier Auth
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="bg-violet-50 text-violet-800 border-violet-200"
                  >
                    {returnsAuthQueue.length}
                    {operations &&
                    queueFilter !== "ALL" &&
                    operations.actionCenter.returnsWaitingAuth.length !==
                      returnsAuthQueue.length
                      ? ` / ${operations.actionCenter.returnsWaitingAuth.length}`
                      : ""}
                  </Badge>
                </div>
                <CardDescription>
                  Returns awaiting supplier authorization (RMA/ARP), tracked
                  from your admin flow.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {operationsLoading ? (
                  <div className="text-sm text-gray-500">
                    Loading returns queue...
                  </div>
                ) : returnsAuthQueue.length ? (
                  <div className="space-y-3">
                    {returnsAuthQueue.map(ret => (
                      <div
                        key={ret.returnId}
                        className="rounded-lg border bg-white p-3"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">
                              #{ret.orderNumber} • {ret.supplierName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {ret.itemName} • {ret.status} • Auth:{" "}
                              {ret.supplierAuthorizationStatus || "N/A"}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {ret.isAuthOverdue && (
                                <Badge
                                  variant="outline"
                                  className="bg-red-50 text-red-700 border-red-200"
                                >
                                  Auth deadline overdue
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className="bg-slate-50 text-slate-700"
                              >
                                Deadline:{" "}
                                {ret.supplierAuthorizationDeadline
                                  ? formatDateTimeCompact(
                                      ret.supplierAuthorizationDeadline
                                    )
                                  : "Not set"}
                              </Badge>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <Link href="/admin/returns">Open Returns</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    No returns waiting supplier authorization.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Supplier Health (Operations)
                </CardTitle>
                <CardDescription>
                  Live operational load and recent quality indicators per
                  supplier.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {operationsLoading ? (
                  <div className="text-sm text-gray-500">
                    Loading supplier health...
                  </div>
                ) : operations?.supplierHealth?.length ? (
                  <div className="space-y-3">
                    {operations.supplierHealth.map(supplier => (
                      <div
                        key={supplier.supplierId}
                        className="rounded-lg border p-3"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">
                              {supplier.supplierName}
                            </div>
                            <div className="text-xs text-gray-600">
                              Open: {supplier.openLines} • Ready:{" "}
                              {supplier.readyToPlace} • AWB: {supplier.awbWork}{" "}
                              • Issues: {supplier.issues}
                            </div>
                            <div className="text-xs text-gray-500">
                              7d lines: {supplier.last7dLines} • OOS rate:{" "}
                              {percentLabel(supplier.oosRate7d)} • Delay rate:{" "}
                              {percentLabel(supplier.delayRate7d)} • Avg ship:{" "}
                              {formatHoursCompact(supplier.avgHoursToShip7d)}
                            </div>
                          </div>
                          <div className="flex flex-col items-start sm:items-end gap-1">
                            <Badge
                              variant="outline"
                              className={
                                supplier.latestSyncJob?.status === "FAILED"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : supplier.latestSyncJob?.status === "SUCCESS"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-slate-50 text-slate-700 border-slate-200"
                              }
                            >
                              Sync:{" "}
                              {supplier.latestSyncJob?.status ||
                                "No recent sync"}
                            </Badge>
                            {supplier.latestSyncJob?.startedAt && (
                              <span className="text-[11px] text-gray-500">
                                {supplier.latestSyncJob.jobType} •{" "}
                                {formatDateTimeCompact(
                                  supplier.latestSyncJob.startedAt
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    No supplier operations data yet.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Automation Health</CardTitle>
                <CardDescription>
                  Feed sync jobs, OOS reminder activity, and email delivery
                  signals.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {operationsLoading ? (
                  <div className="text-sm text-gray-500">
                    Loading automation health...
                  </div>
                ) : operations ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-lg border p-3">
                        <div className="text-xs text-gray-500">
                          Emails (24h)
                        </div>
                        <div className="mt-1 text-sm font-medium text-gray-900">
                          Sent: {operations.automationHealth.email24h.sent}
                        </div>
                        <div className="text-xs text-gray-600">
                          Failed: {operations.automationHealth.email24h.failed}{" "}
                          • Other: {operations.automationHealth.email24h.other}
                        </div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-xs text-gray-500">
                          OOS Reminders (24h)
                        </div>
                        <div className="mt-1 text-sm font-medium text-gray-900">
                          {
                            operations.automationHealth.oosReminders
                              .reminderActivityCount24h
                          }{" "}
                          reminder notes
                        </div>
                        <div className="text-xs text-gray-600">
                          Errors:{" "}
                          {
                            operations.automationHealth.oosReminders
                              .reminderErrorCount24h
                          }
                        </div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-xs text-gray-500">
                          Last OOS Reminder Activity
                        </div>
                        <div className="mt-1 text-sm font-medium text-gray-900">
                          {formatDateTimeCompact(
                            operations.automationHealth.oosReminders
                              .lastReminderNoteAt
                          )}
                        </div>
                        <div className="text-xs text-gray-600">
                          Note-based signal from supplier issue lines
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-900">
                        Latest Supplier Sync Jobs
                      </div>
                      {operations.automationHealth.supplierSync.length ? (
                        <div className="space-y-2">
                          {operations.automationHealth.supplierSync.map(job => (
                            <div
                              key={`${job.supplierId}-${job.startedAt || "na"}`}
                              className="rounded-lg border p-3"
                            >
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {job.supplierName}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {job.jobType} •{" "}
                                    {formatDateTimeCompact(job.startedAt)}
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={
                                    job.status === "FAILED"
                                      ? "bg-red-50 text-red-700 border-red-200"
                                      : job.status === "SUCCESS"
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : "bg-slate-50 text-slate-700 border-slate-200"
                                  }
                                >
                                  {job.status}
                                </Badge>
                              </div>
                              <div className="mt-2 text-xs text-gray-600">
                                Imported {job.imported} • Updated {job.updated}{" "}
                                • Failed {job.failed}
                                {job.error ? ` • Error: ${job.error}` : ""}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          No recent supplier sync jobs found.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-red-600">
                    Could not load operations overview. Use the links above to
                    work from the individual admin pages.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Recent Orders
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Latest customer orders and their status
                </CardDescription>
              </div>
              <Link
                href="/admin/orders"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                View all
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentOrders.length > 0 ? (
              <div className="space-y-4">
                {data.recentOrders.slice(0, 5).map(order => (
                  <div
                    key={order.id}
                    className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-white p-3 transition-shadow hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {(order.customer || "C").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {order.customer || "Unknown Customer"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Order #{order.id.slice(-8)}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-medium text-gray-900">
                        <CurrencyDisplay value={order.amount} />
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "shipped"
                              ? "bg-blue-100 text-blue-800"
                              : order.status === "processing"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent orders</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Top Products
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Best performing products by sales
                </CardDescription>
              </div>
              <Link
                href="/admin/products"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                View all
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.topProducts.length > 0 ? (
              <div className="space-y-4">
                {data.topProducts.slice(0, 5).map((product, index) => (
                  <div
                    key={product.id}
                    className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-white p-3 transition-shadow hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {index + 1}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Price: <CurrencyDisplay value={product.price} />
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-medium text-gray-900">
                        {product.sales} sales
                      </p>
                      <p className="text-sm text-gray-500">
                        Stock: {product.inventory}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No product data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Quick Actions
          </CardTitle>
          <CardDescription className="text-gray-600">
            Common admin tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="flex h-auto flex-col items-center gap-2 p-4"
              asChild
            >
              <Link href="/admin/products/create">
                <Package className="h-6 w-6" />
                <span>Add Product</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="flex h-auto flex-col items-center gap-2 p-4"
              asChild
            >
              <Link href="/admin/orders">
                <ShoppingBag className="h-6 w-6" />
                <span>View Orders</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="flex h-auto flex-col items-center gap-2 p-4"
              asChild
            >
              <Link href="/admin/customers">
                <Users className="h-6 w-6" />
                <span>Manage Customers</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="flex h-auto flex-col items-center gap-2 p-4"
              asChild
            >
              <Link href="/admin/analytics">
                <BarChart3 className="h-6 w-6" />
                <span>Analytics</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
