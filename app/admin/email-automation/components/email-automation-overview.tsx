"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Mail,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Target,
  Eye,
  MousePointer,
  AlertCircle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EmailStats {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  activeSequences: number;
  activeCampaigns: number;
  totalSubscribers: number;
}

interface RecentActivity {
  id: string;
  type: "campaign" | "sequence" | "template" | "segment";
  title: string;
  description: string;
  status: "active" | "paused" | "completed" | "draft";
  timestamp: string;
  metrics?: {
    sent?: number;
    opened?: number;
    clicked?: number;
    openRate?: number;
    clickRate?: number;
  };
}

interface PerformanceMetric {
  name: string;
  value: number;
  change: number;
  target: number;
  trend: "up" | "down" | "stable";
}

export function EmailAutomationOverview({ stats }: { stats: EmailStats }) {
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<
    PerformanceMetric[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      // Mock data - replace with actual API calls
      const mockRecentActivity: RecentActivity[] = [
        {
          id: "1",
          type: "campaign",
          title: "Summer Sale Campaign",
          description: "Promoting summer STEM toys with 20% discount",
          status: "active",
          timestamp: "2 hours ago",
          metrics: {
            sent: 1250,
            opened: 1000,
            clicked: 250,
            openRate: 80.0,
            clickRate: 25.0,
          },
        },
        {
          id: "2",
          type: "sequence",
          title: "Welcome Series",
          description: "3-email welcome sequence for new subscribers",
          status: "active",
          timestamp: "1 day ago",
          metrics: {
            sent: 89,
            opened: 71,
            clicked: 18,
            openRate: 79.8,
            clickRate: 25.4,
          },
        },
        {
          id: "3",
          type: "template",
          title: "Order Confirmation",
          description: "Updated order confirmation template",
          status: "completed",
          timestamp: "3 days ago",
        },
        {
          id: "4",
          type: "segment",
          title: "High-Value Customers",
          description: "Customers with orders over $100",
          status: "active",
          timestamp: "1 week ago",
        },
      ];

      const mockPerformanceMetrics: PerformanceMetric[] = [
        {
          name: "Open Rate",
          value: stats.openRate,
          change: 2.5,
          target: 85,
          trend: "up",
        },
        {
          name: "Click Rate",
          value: stats.clickRate,
          change: -1.2,
          target: 25,
          trend: "down",
        },
        {
          name: "Bounce Rate",
          value: stats.bounceRate,
          change: -0.5,
          target: 2,
          trend: "up",
        },
        {
          name: "Unsubscribe Rate",
          value: stats.unsubscribeRate,
          change: 0.1,
          target: 0.5,
          trend: "down",
        },
      ];

      setRecentActivity(mockRecentActivity);
      setPerformanceMetrics(mockPerformanceMetrics);
    } catch (error) {
      console.error("Error fetching overview data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Play className="h-4 w-4" />;
      case "paused":
        return <Pause className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "draft":
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "campaign":
        return <Mail className="h-4 w-4" />;
      case "sequence":
        return <Clock className="h-4 w-4" />;
      case "template":
        return <Target className="h-4 w-4" />;
      case "segment":
        return <Users className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map(metric => (
          <Card key={metric.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.name}
              </CardTitle>
              {metric.trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : metric.trend === "down" ? (
                <TrendingDown className="h-4 w-4 text-red-600" />
              ) : (
                <div className="h-4 w-4" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}%</div>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-xs ${
                    metric.change > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {metric.change > 0 ? "+" : ""}
                  {metric.change}%
                </span>
                <span className="text-xs text-muted-foreground">
                  vs last month
                </span>
              </div>
              <div className="mt-2">
                <Progress
                  value={(metric.value / metric.target) * 100}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Target: {metric.target}%
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest email automation activities and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-4 p-4 border rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        {getTypeIcon(activity.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {activity.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge className={getStatusColor(activity.status)}>
                          {getStatusIcon(activity.status)}
                          <span className="ml-1 capitalize">
                            {activity.status}
                          </span>
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {activity.timestamp}
                        </span>
                      </div>
                      {activity.metrics && (
                        <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
                          <div className="text-center">
                            <div className="text-sm font-medium">
                              {activity.metrics.sent?.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">Sent</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium">
                              {activity.metrics.openRate}%
                            </div>
                            <div className="text-xs text-gray-500">
                              Open Rate
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium">
                              {activity.metrics.clickRate}%
                            </div>
                            <div className="text-xs text-gray-500">
                              Click Rate
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common email automation tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Create Sequence
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Target className="h-4 w-4 mr-2" />
                Create Template
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Create Segment
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Email automation system health</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Service</span>
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Operational
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Automation Engine</span>
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Analytics</span>
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Tracking
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cache</span>
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
