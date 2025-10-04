"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Star,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3,
  Calendar,
  Award,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { PerformanceData } from "@/features/supplier/types/performance";

export function SupplierPerformanceDashboard() {
  const [performanceData, setPerformanceData] =
    useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("30");

  // Mock supplier ID - in real app this would come from auth context
  const supplierId = "mock-supplier-id";

  useEffect(() => {
    fetchPerformanceData();
  }, [period]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, we'll use mock data since we don't have supplier auth yet
      // In production, this would call the real API with the authenticated supplier's ID
      const mockData: PerformanceData = {
        supplier: {
          id: "supplier-1",
          name: "TechToys Romania SRL",
          email: "contact@techtots.ro",
          status: "APPROVED",
          commissionRate: 15.0,
          paymentTerms: 30,
          businessCountry: "Romania",
          createdAt: "2024-01-15T10:00:00Z",
          totalProducts: 45,
          totalOrders: 127,
        },
        period: {
          startDate: "2024-09-04",
          endDate: "2024-10-04",
          days: 30,
        },
        performance: {
          overallScore: 87,
          grade: "B+",
          orderMetrics: {
            totalOrders: 23,
            fulfilledOrders: 21,
            pendingOrders: 2,
            cancelledOrders: 0,
            fulfillmentRate: 91.3,
            cancellationRate: 0,
            totalRevenue: 12540.5,
            averageOrderValue: 545.24,
          },
          qualityMetrics: {
            reviewCount: 18,
            averageRating: 4.2,
            ratingDistribution: { "5": 12, "4": 4, "3": 2, "2": 0, "1": 0 },
            satisfactionTrend: "improving",
            qualityScore: 4.2,
          },
          deliveryMetrics: {
            totalTrackedOrders: 21,
            deliveredOrders: 19,
            onTimeDeliveries: 17,
            lateDeliveries: 2,
            onTimeDeliveryRate: 89.5,
            lateDeliveryRate: 10.5,
            averageDeliveryDays: 4.2,
          },
        },
        trends: [
          { month: "2024-07", orderCount: 18, revenue: 9850 },
          { month: "2024-08", orderCount: 22, revenue: 11200 },
          { month: "2024-09", orderCount: 25, revenue: 13450 },
          { month: "2024-10", orderCount: 23, revenue: 12540 },
        ],
        issues: [
          {
            id: "1",
            orderNumber: "ORD-2024-001",
            productName: "STEM Robotics Kit",
            issue: "Late delivery by 2 days",
            date: "2024-09-28T14:30:00Z",
            impact: "negative",
          },
        ],
        recommendations: [
          {
            type: "high",
            title: "Improve On-Time Delivery",
            description:
              "Your on-time delivery rate is 89.5%, which is below the 95% target.",
            action:
              "Review shipping processes and carrier selection to reduce delivery times.",
          },
          {
            type: "medium",
            title: "Increase Product Reviews",
            description:
              "Only 18 reviews this month. More reviews help build trust.",
            action:
              "Encourage customers to leave reviews and respond promptly to feedback.",
          },
          {
            type: "positive",
            title: "Strong Fulfillment Rate",
            description:
              "Your 91.3% fulfillment rate is excellent. Keep up the great work!",
            action: "Maintain current order processing standards.",
          },
        ],
      };

      setPerformanceData(mockData);
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
            {performanceData.trends.map((trend, index) => (
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
