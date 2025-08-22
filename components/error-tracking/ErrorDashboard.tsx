"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Bug,
  Activity,
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
} from "lucide-react";

interface ErrorData {
  errors: any[];
  statistics: {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    criticalErrors: number;
    recentErrors: any[];
    errorRate: number;
    uptime: number;
  };
  summary: {
    dateRange: string;
    type: string;
    severity: string;
    userId: string;
  };
}

export default function ErrorDashboard() {
  const [errorData, setErrorData] = useState<ErrorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchErrorData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/analytics/errors?days=7&limit=50");
      if (!response.ok) {
        throw new Error("Failed to fetch error data");
      }

      const data = await response.json();
      if (data.success) {
        setErrorData(data.data);
      } else {
        throw new Error(data.error || "Failed to fetch error data");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrorData();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "api":
        return <Activity className="w-4 h-4" />;
      case "client":
        return <Bug className="w-4 h-4" />;
      case "network":
        return <AlertTriangle className="w-4 h-4" />;
      case "validation":
        return <AlertCircle className="w-4 h-4" />;
      case "authentication":
        return <XCircle className="w-4 h-4" />;
      case "authorization":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            Error Dashboard
          </CardTitle>
          <CardDescription>Loading error data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            Error Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={fetchErrorData}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!errorData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            Error Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>No error data available</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { statistics, errors, summary } = errorData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bug className="w-6 h-6" />
            Error Dashboard
          </h2>
          <p className="text-muted-foreground">
            {summary.dateRange} • {summary.type} • {summary.severity}
          </p>
        </div>
        <Button onClick={fetchErrorData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalErrors}</div>
            <p className="text-xs text-muted-foreground">{summary.dateRange}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Critical Errors
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statistics.criticalErrors}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.errorRate.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics.errorRate > 5 ? (
                <span className="text-red-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  High error rate
                </span>
              ) : (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Normal
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.uptime.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics.uptime > 99 ? (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Excellent
                </span>
              ) : (
                <span className="text-yellow-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Needs attention
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed View */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="errors">Recent Errors</TabsTrigger>
          <TabsTrigger value="types">By Type</TabsTrigger>
          <TabsTrigger value="severity">By Severity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Errors by Type</CardTitle>
                <CardDescription>
                  Distribution of errors by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(statistics.errorsByType).map(
                    ([type, count]) => (
                      <div
                        key={type}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          {getTypeIcon(type)}
                          <span className="capitalize">{type}</span>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Errors by Severity</CardTitle>
                <CardDescription>
                  Distribution of errors by severity level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(statistics.errorsBySeverity).map(
                    ([severity, count]) => (
                      <div
                        key={severity}
                        className="flex items-center justify-between"
                      >
                        <span className="capitalize">{severity}</span>
                        <Badge className={getSeverityColor(severity)}>
                          {count}
                        </Badge>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
              <CardDescription>Latest error occurrences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statistics.recentErrors.length === 0 ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>No recent errors found</AlertDescription>
                  </Alert>
                ) : (
                  statistics.recentErrors.map((error: any) => (
                    <div
                      key={error.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(error.type)}
                          <span className="font-medium">{error.message}</span>
                        </div>
                        <Badge className={getSeverityColor(error.severity)}>
                          {error.severity}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div>URL: {error.url}</div>
                        <div>Time: {formatTimestamp(error.timestamp)}</div>
                        {error.metadata?.endpoint && (
                          <div>Endpoint: {error.metadata.endpoint}</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Types Analysis</CardTitle>
              <CardDescription>
                Detailed breakdown by error type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(statistics.errorsByType).map(
                  ([type, count]) => (
                    <div key={type} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(type)}
                          <span className="font-medium capitalize">{type}</span>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {type === "api" &&
                          "API endpoint failures and server errors"}
                        {type === "client" && "Client-side JavaScript errors"}
                        {type === "network" && "Network connectivity issues"}
                        {type === "validation" && "Data validation failures"}
                        {type === "authentication" &&
                          "User authentication errors"}
                        {type === "authorization" &&
                          "Permission and access control errors"}
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="severity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Severity Analysis</CardTitle>
              <CardDescription>
                Error severity distribution and impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(statistics.errorsBySeverity).map(
                  ([severity, count]) => (
                    <div key={severity} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">
                          {severity}
                        </span>
                        <Badge className={getSeverityColor(severity)}>
                          {count}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {severity === "critical" &&
                          "System-breaking errors requiring immediate attention"}
                        {severity === "high" &&
                          "Significant issues affecting user experience"}
                        {severity === "medium" &&
                          "Moderate issues with limited impact"}
                        {severity === "low" &&
                          "Minor issues with minimal impact"}
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
