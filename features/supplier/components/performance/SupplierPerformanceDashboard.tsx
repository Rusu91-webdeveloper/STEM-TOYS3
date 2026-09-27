"use client";

import {
  TrendingUp,
  Star,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3,
  Award,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PerformanceData } from "@/features/supplier/types/performance";

export function SupplierPerformanceDashboard() {
  const [performanceData, setPerformanceData] =
    useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const supplierId = "mock-supplier-id";

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = () => {
    try {
      setLoading(true);
      setError(null);

      // Performance figures are omitted until they come from real orders.
      setPerformanceData(null);
      setError(
        "Statisticile de performanță apar după comenzi reale. Nu afișăm cifre estimate."
      );
      return;

    } catch (err) {
      console.error("Error fetching performance data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load performance data"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading performance data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !performanceData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || "Failed to load performance data"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { supplier, performance, recommendations } = performanceData;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Performance Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Track your performance and identify areas for improvement
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPerformanceData}>
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Overall Performance Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Overall Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {performance.overallScore}%
                </div>
                <Badge
                  className={`mt-1 ${
                    performance.grade === "A+" || performance.grade === "A"
                      ? "bg-green-100 text-green-800"
                      : performance.grade === "B+" || performance.grade === "B"
                        ? "bg-blue-100 text-blue-800"
                        : performance.grade === "C+" ||
                            performance.grade === "C"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                  }`}
                >
                  Grade {performance.grade}
                </Badge>
              </div>
              <Award className="h-8 w-8 text-blue-600" />
            </div>
            <Progress value={performance.overallScore} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Revenue (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  ${performance.orderMetrics.totalRevenue.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">
                  {performance.orderMetrics.totalOrders} orders
                </div>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Customer Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {performance.qualityMetrics.averageRating}/5
                </div>
                <div className="text-sm text-gray-600">
                  {performance.qualityMetrics.reviewCount} reviews
                </div>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Fulfillment Rate
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {performance.orderMetrics.fulfillmentRate}%
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  On-Time Delivery
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {performance.deliveryMetrics.onTimeDeliveryRate}%
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Avg Delivery Time
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {performance.deliveryMetrics.averageDeliveryDays || "N/A"}{" "}
                  days
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Commission Rate
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {supplier.commissionRate}%
                </p>
              </div>
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Performance Insights
        </h2>
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <Alert
              key={index}
              className={`${
                rec.type === "critical"
                  ? "border-red-200 bg-red-50"
                  : rec.type === "high"
                    ? "border-orange-200 bg-orange-50"
                    : rec.type === "medium"
                      ? "border-yellow-200 bg-yellow-50"
                      : "border-green-200 bg-green-50"
              }`}
            >
              <div className="flex items-start gap-3">
                {rec.type === "critical" && (
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                {rec.type === "high" && (
                  <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                )}
                {rec.type === "medium" && (
                  <Target className="h-5 w-5 text-yellow-600 mt-0.5" />
                )}
                {rec.type === "positive" && (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{rec.title}</h4>
                  <p className="text-sm text-gray-700 mt-1">
                    {rec.description}
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-2">
                    💡 {rec.action}
                  </p>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </div>

      {/* Recent Issues */}
      {performanceData.issues.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Recent Issues
            </CardTitle>
            <CardDescription>
              Issues that may impact your performance score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performanceData.issues.map(issue => (
                <div
                  key={issue.id}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {issue.orderNumber} - {issue.productName}
                    </p>
                    <p className="text-sm text-gray-600">{issue.issue}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-orange-700 border-orange-300"
                  >
                    {new Date(issue.date).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Monthly Trends
          </CardTitle>
          <CardDescription>
            Your performance over the last 4 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {performanceData.trends.map(trend => (
              <div key={trend.month} className="text-center">
                <p className="text-sm font-medium text-gray-600">
                  {trend.month}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {trend.orderCount}
                </p>
                <p className="text-sm text-gray-600">orders</p>
                <p className="text-lg font-semibold text-green-600">
                  ${trend.revenue.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
