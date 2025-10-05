"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Users,
  TrendingUp,
  Target,
  AlertTriangle,
  RefreshCw,
  Download,
  Settings,
} from "lucide-react";

interface SegmentationAnalytics {
  segmentDistribution: Array<{
    segment: string;
    _count: { id: number };
  }>;
  lifecycleDistribution: Array<{
    lifecycleStage: string;
    _count: { id: number };
  }>;
  rulePerformance: Array<{
    id: string;
    name: string;
    segment: string;
  }>;
  recentChanges: Array<{
    id: string;
    email: string;
    segment: string;
    lifecycleStage: string;
    segmentUpdatedAt: string;
  }>;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function SegmentationAnalyticsPage() {
  const [analytics, setAnalytics] = useState<SegmentationAnalytics | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/segmentation");
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdate = async () => {
    setUpdating(true);
    try {
      await fetch("/api/admin/segmentation/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize: 100 }),
      });
      // Refresh analytics after a delay
      setTimeout(fetchAnalytics, 2000);
    } catch (error) {
      console.error("Error starting bulk update:", error);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Segmentation Analytics</h1>
          <p className="text-muted-foreground">Unable to load analytics data</p>
        </div>
      </div>
    );
  }

  const segmentData = analytics.segmentDistribution.map(item => ({
    name: item.segment,
    value: item._count.id,
    percentage: (
      (item._count.id /
        analytics.segmentDistribution.reduce(
          (sum, d) => sum + d._count.id,
          0
        )) *
      100
    ).toFixed(1),
  }));

  const lifecycleData = analytics.lifecycleDistribution.map(item => ({
    name: item.lifecycleStage,
    value: item._count.id,
  }));

  const totalUsers = analytics.segmentDistribution.reduce(
    (sum, item) => sum + item._count.id,
    0
  );

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Quick Navigation */}
      <div className="flex items-center gap-4 text-sm">
        <Link
          href="/admin/analytics"
          className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          <BarChart3 className="h-4 w-4" />
          Analytics Hub
        </Link>
        <span className="text-muted-foreground">•</span>
        <span className="font-medium">User Segmentation</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Segmentation Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Automated user classification and behavioral analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button onClick={handleBulkUpdate} disabled={updating}>
            <Settings
              className={`h-4 w-4 mr-2 ${updating ? "animate-spin" : ""}`}
            />
            Update All Users
          </Button>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/analytics">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Sales Analytics
              </CardTitle>
              <CardDescription>
                Revenue, orders, and business performance
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/analytics/dashboard">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                User Analytics
              </CardTitle>
              <CardDescription>
                Real-time user metrics and behavior analytics
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/customers">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Customer Management
              </CardTitle>
              <CardDescription>
                User profiles, roles, and account management
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/analytics/unit-economics">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Unit Economics
              </CardTitle>
              <CardDescription>
                Cost analysis and profitability insights
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Active segmented users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIP Users</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.segmentDistribution.find(s => s.segment === "VIP")
                ?._count.id || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              High-value customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.segmentDistribution.find(s => s.segment === "AT_RISK")
                ?._count.id || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Users needing attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.rulePerformance.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Segmentation rules active
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="segments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="segments">Segment Distribution</TabsTrigger>
          <TabsTrigger value="lifecycle">Lifecycle Stages</TabsTrigger>
          <TabsTrigger value="rules">Segmentation Rules</TabsTrigger>
          <TabsTrigger value="recent">Recent Changes</TabsTrigger>
        </TabsList>

        <TabsContent value="segments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Segment Distribution</CardTitle>
                <CardDescription>
                  Current user distribution across segments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={segmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) =>
                        `${name}: ${percentage}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {segmentData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Segment Breakdown</CardTitle>
                <CardDescription>Detailed view of each segment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {segmentData.map((segment, index) => (
                  <div
                    key={segment.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="font-medium">{segment.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{segment.value}</div>
                      <div className="text-sm text-muted-foreground">
                        {segment.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="lifecycle" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lifecycle Stage Distribution</CardTitle>
              <CardDescription>
                User progression through the customer lifecycle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={lifecycleData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Segmentation Rules</CardTitle>
              <CardDescription>
                Active rules powering automated user classification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.rulePerformance.map(rule => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium">{rule.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Targets: <Badge variant="outline">{rule.segment}</Badge>
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit Rule
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Segmentation Changes</CardTitle>
              <CardDescription>
                Latest user segment and lifecycle updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.recentChanges.slice(0, 20).map(change => (
                  <div
                    key={change.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{change.email}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary">{change.segment}</Badge>
                        <Badge variant="outline">{change.lifecycleStage}</Badge>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(change.segmentUpdatedAt).toLocaleDateString()}
                    </div>
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
