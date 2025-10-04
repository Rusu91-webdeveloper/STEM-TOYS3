"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Bell,
  BarChart3,
  Calendar,
  Download,
  RefreshCw,
  Target,
  Zap,
  Activity,
  Users,
  DollarSign,
  ShoppingCart,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { formatPriceWithCurrency } from "@/lib/currency-converter";

interface TrendData {
  period: string;
  value: number;
  change: number;
  changePercent: number;
  trend: "up" | "down" | "stable";
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: "above" | "below" | "equals";
  threshold: number;
  enabled: boolean;
  lastTriggered?: Date;
  severity: "low" | "medium" | "high" | "critical";
}

interface AutomatedAlert {
  id: string;
  title: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  metric: string;
  value: number;
  threshold: number;
  acknowledged: boolean;
}

interface AnalyticsData {
  trends: {
    revenue: TrendData[];
    orders: TrendData[];
    customers: TrendData[];
    conversion: TrendData[];
  };
  predictions: {
    revenue: {
      nextMonth: number;
      confidence: number;
      trend: "up" | "down" | "stable";
    };
    orders: {
      nextMonth: number;
      confidence: number;
      trend: "up" | "down" | "stable";
    };
  };
  alerts: AutomatedAlert[];
  alertRules: AlertRule[];
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    conversionRate: number;
    customerRetention: number;
    profitMargin: number;
  };
}

export function AdvancedAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [alertSettings, setAlertSettings] = useState({
    emailNotifications: true,
    dashboardAlerts: true,
    criticalOnly: false,
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/analytics/advanced?period=${selectedPeriod}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch advanced analytics");
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/admin/analytics/alerts/${alertId}/acknowledge`, {
        method: "POST",
      });

      // Update local state
      setAnalyticsData(prev =>
        prev
          ? {
              ...prev,
              alerts: prev.alerts.map(alert =>
                alert.id === alertId ? { ...alert, acknowledged: true } : alert
              ),
            }
          : null
      );
    } catch (err) {
      console.error("Error acknowledging alert:", err);
    }
  };

  const updateAlertRule = async (ruleId: string, enabled: boolean) => {
    try {
      await fetch(`/api/admin/analytics/alert-rules/${ruleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });

      // Update local state
      setAnalyticsData(prev =>
        prev
          ? {
              ...prev,
              alertRules: prev.alertRules.map(rule =>
                rule.id === ruleId ? { ...rule, enabled } : rule
              ),
            }
          : null
      );
    } catch (err) {
      console.error("Error updating alert rule:", err);
    }
  };

  const exportAnalyticsReport = async () => {
    try {
      const response = await fetch(
        `/api/admin/analytics/export?period=${selectedPeriod}&type=advanced`
      );
      if (!response.ok) {
        throw new Error("Failed to export report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `advanced-analytics-${selectedPeriod}days-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error exporting report:", err);
      setError("Failed to export analytics report");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="w-4 h-4" />;
      case "high":
        return <AlertTriangle className="w-4 h-4" />;
      case "medium":
        return <AlertCircle className="w-4 h-4" />;
      case "low":
        return <Bell className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading advanced analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Advanced Analytics
          </h1>
          <p className="text-gray-600 mt-2">
            Comprehensive trend analysis and automated intelligence
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="90">90 Days</SelectItem>
              <SelectItem value="365">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalyticsData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportAnalyticsReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* KPI Overview */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPriceWithCurrency(analyticsData.kpis.totalRevenue)}
                  </p>
                  <div className="flex items-center mt-1">
                    {analyticsData.trends.revenue[0]?.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                    )}
                    <span
                      className={`text-sm ${analyticsData.trends.revenue[0]?.trend === "up" ? "text-green-600" : "text-red-600"}`}
                    >
                      {Math.abs(
                        analyticsData.trends.revenue[0]?.changePercent || 0
                      )}
                      %
                    </span>
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Orders
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsData.kpis.totalOrders}
                  </p>
                  <div className="flex items-center mt-1">
                    {analyticsData.trends.orders[0]?.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                    )}
                    <span
                      className={`text-sm ${analyticsData.trends.orders[0]?.trend === "up" ? "text-green-600" : "text-red-600"}`}
                    >
                      {Math.abs(
                        analyticsData.trends.orders[0]?.changePercent || 0
                      )}
                      %
                    </span>
                  </div>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Avg Order Value
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPriceWithCurrency(
                      analyticsData.kpis.averageOrderValue
                    )}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Conversion: {analyticsData.kpis.conversionRate}%
                  </p>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Profit Margin
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsData.kpis.profitMargin}%
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Customer Retention: {analyticsData.kpis.customerRetention}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trend Analysis
          </TabsTrigger>
          <TabsTrigger value="predictions" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Predictions
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Automated Alerts (
            {analyticsData?.alerts.filter(a => !a.acknowledged).length || 0})
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Alert Settings
          </TabsTrigger>
        </TabsList>

        {/* Trend Analysis Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Revenue Trends
                </CardTitle>
                <CardDescription>
                  Revenue performance over the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.trends.revenue
                    .slice(0, 6)
                    .map((trend, index) => (
                      <div
                        key={trend.period}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${trend.trend === "up" ? "bg-green-500" : trend.trend === "down" ? "bg-red-500" : "bg-gray-500"}`}
                          />
                          <span className="text-sm font-medium">
                            {trend.period}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {formatPriceWithCurrency(trend.value)}
                          </span>
                          <Badge
                            variant={
                              trend.changePercent >= 0
                                ? "default"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {trend.changePercent >= 0 ? "+" : ""}
                            {trend.changePercent}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  Order Trends
                </CardTitle>
                <CardDescription>
                  Order volume and frequency analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.trends.orders
                    .slice(0, 6)
                    .map((trend, index) => (
                      <div
                        key={trend.period}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${trend.trend === "up" ? "bg-green-500" : trend.trend === "down" ? "bg-red-500" : "bg-gray-500"}`}
                          />
                          <span className="text-sm font-medium">
                            {trend.period}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {trend.value}
                          </span>
                          <Badge
                            variant={
                              trend.changePercent >= 0
                                ? "default"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {trend.changePercent >= 0 ? "+" : ""}
                            {trend.changePercent}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Conversion Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Conversion Trends
                </CardTitle>
                <CardDescription>
                  Website conversion rate analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.trends.conversion
                    .slice(0, 6)
                    .map((trend, index) => (
                      <div
                        key={trend.period}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${trend.trend === "up" ? "bg-green-500" : trend.trend === "down" ? "bg-red-500" : "bg-gray-500"}`}
                          />
                          <span className="text-sm font-medium">
                            {trend.period}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {trend.value}%
                          </span>
                          <Badge
                            variant={
                              trend.changePercent >= 0
                                ? "default"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {trend.changePercent >= 0 ? "+" : ""}
                            {trend.changePercent}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Customer Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Customer Trends
                </CardTitle>
                <CardDescription>
                  Customer acquisition and retention metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.trends.customers
                    .slice(0, 6)
                    .map((trend, index) => (
                      <div
                        key={trend.period}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${trend.trend === "up" ? "bg-green-500" : trend.trend === "down" ? "bg-red-500" : "bg-gray-500"}`}
                          />
                          <span className="text-sm font-medium">
                            {trend.period}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {trend.value}
                          </span>
                          <Badge
                            variant={
                              trend.changePercent >= 0
                                ? "default"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {trend.changePercent >= 0 ? "+" : ""}
                            {trend.changePercent}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Revenue Prediction
                </CardTitle>
                <CardDescription>
                  AI-powered revenue forecasting for next month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {formatPriceWithCurrency(
                        analyticsData?.predictions.revenue.nextMonth || 0
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Predicted revenue next month
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Confidence Level</span>
                      <span className="text-sm font-medium">
                        {analyticsData?.predictions.revenue.confidence || 0}%
                      </span>
                    </div>
                    <Progress
                      value={analyticsData?.predictions.revenue.confidence || 0}
                      className="h-2"
                    />
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    {analyticsData?.predictions.revenue.trend === "up" ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : analyticsData?.predictions.revenue.trend === "down" ? (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    ) : (
                      <Activity className="w-5 h-5 text-gray-600" />
                    )}
                    <span className="text-sm font-medium">
                      {analyticsData?.predictions.revenue.trend === "up"
                        ? "Trending Upward"
                        : analyticsData?.predictions.revenue.trend === "down"
                          ? "Trending Downward"
                          : "Stable Trend"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-purple-600" />
                  Order Volume Prediction
                </CardTitle>
                <CardDescription>
                  Forecasted order volume for next month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {analyticsData?.predictions.orders.nextMonth || 0}
                    </div>
                    <p className="text-sm text-gray-600">
                      Predicted orders next month
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Confidence Level</span>
                      <span className="text-sm font-medium">
                        {analyticsData?.predictions.orders.confidence || 0}%
                      </span>
                    </div>
                    <Progress
                      value={analyticsData?.predictions.orders.confidence || 0}
                      className="h-2"
                    />
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    {analyticsData?.predictions.orders.trend === "up" ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : analyticsData?.predictions.orders.trend === "down" ? (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    ) : (
                      <Activity className="w-5 h-5 text-gray-600" />
                    )}
                    <span className="text-sm font-medium">
                      {analyticsData?.predictions.orders.trend === "up"
                        ? "Increasing Demand"
                        : analyticsData?.predictions.orders.trend === "down"
                          ? "Decreasing Demand"
                          : "Stable Demand"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Automated Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Automated Alerts</CardTitle>
              <CardDescription>
                System-generated alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <p className="text-gray-600">
                      No active alerts at this time
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      All systems are operating within normal parameters
                    </p>
                  </div>
                ) : (
                  analyticsData?.alerts.map(alert => (
                    <Alert
                      key={alert.id}
                      className={`${alert.acknowledged ? "bg-gray-50 border-gray-200" : ""} ${alert.severity === "critical" ? "border-red-200 bg-red-50" : alert.severity === "high" ? "border-orange-200 bg-orange-50" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(alert.severity)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">
                              {alert.title}
                            </h4>
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            {alert.acknowledged && (
                              <Badge
                                variant="outline"
                                className="text-green-700 border-green-300"
                              >
                                Acknowledged
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            {alert.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>
                                {alert.metric}: {alert.value} (Threshold:{" "}
                                {alert.threshold})
                              </span>
                              <span>
                                {new Date(alert.timestamp).toLocaleString()}
                              </span>
                            </div>
                            {!alert.acknowledged && (
                              <Button
                                size="sm"
                                onClick={() => acknowledgeAlert(alert.id)}
                              >
                                Acknowledge
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Alert>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alert Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Configuration</CardTitle>
              <CardDescription>
                Configure automated alert rules and notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notification Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Notification Preferences
                </h3>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-gray-600">
                      Receive alert notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={alertSettings.emailNotifications}
                    onCheckedChange={checked =>
                      setAlertSettings({
                        ...alertSettings,
                        emailNotifications: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Dashboard Alerts</Label>
                    <p className="text-sm text-gray-600">
                      Show alerts on the dashboard
                    </p>
                  </div>
                  <Switch
                    checked={alertSettings.dashboardAlerts}
                    onCheckedChange={checked =>
                      setAlertSettings({
                        ...alertSettings,
                        dashboardAlerts: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Critical Alerts Only</Label>
                    <p className="text-sm text-gray-600">
                      Only show critical and high-priority alerts
                    </p>
                  </div>
                  <Switch
                    checked={alertSettings.criticalOnly}
                    onCheckedChange={checked =>
                      setAlertSettings({
                        ...alertSettings,
                        criticalOnly: checked,
                      })
                    }
                  />
                </div>
              </div>

              <Separator />

              {/* Alert Rules */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Alert Rules</h3>

                {analyticsData?.alertRules.map(rule => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{rule.name}</h4>
                        <Badge className={getSeverityColor(rule.severity)}>
                          {rule.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {rule.description}
                      </p>
                      <div className="text-xs text-gray-500">
                        {rule.metric} {rule.condition} {rule.threshold}
                        {rule.lastTriggered && (
                          <span className="ml-2">
                            Last triggered:{" "}
                            {new Date(rule.lastTriggered).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={checked =>
                        updateAlertRule(rule.id, checked)
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
