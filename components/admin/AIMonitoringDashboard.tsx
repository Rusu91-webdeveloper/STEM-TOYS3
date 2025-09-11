/**
 * AI Monitoring Dashboard
 * Real-time monitoring of AI services, performance, and health
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Cpu,
  Database,
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  BarChart3,
  Settings,
} from "lucide-react";

interface AIMonitoringData {
  status: string;
  timestamp: string;
  overallHealth: {
    score: number;
    status: "healthy" | "degraded" | "unhealthy";
    issues: string[];
  };
  config: {
    isConfigured: boolean;
    isEnhancementEnabled: boolean;
    provider: string;
    model: string;
  };
  health: Record<string, any>;
  rateLimits: Record<string, any>;
  circuitBreakers: Record<string, any>;
  memory: {
    stats: any;
    recommendations: string[];
  };
  cache: any;
  performance?: any;
  alerts?: any[];
}

export function AIMonitoringDashboard() {
  const [data, setData] = useState<AIMonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/ai/health");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch monitoring data"
      );
      console.error("Failed to fetch AI monitoring data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getHealthIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "unhealthy":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500";
      case "degraded":
        return "bg-yellow-500";
      case "unhealthy":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading AI monitoring data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Failed to load AI monitoring data: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>No monitoring data available</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Monitoring Dashboard</h2>
          <p className="text-gray-600">
            Real-time monitoring of AI services and performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            Auto Refresh
          </Button>
        </div>
      </div>

      {/* Overall Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getHealthIcon(data.overallHealth.status)}
            <span>Overall Health Status</span>
          </CardTitle>
          <CardDescription>
            Last updated: {new Date(data.timestamp).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Health Score</span>
              <span className="text-2xl font-bold">
                {data.overallHealth.score}%
              </span>
            </div>
            <Progress value={data.overallHealth.score} className="h-2" />
            <div className="flex items-center space-x-2">
              <Badge
                variant={
                  data.overallHealth.status === "healthy"
                    ? "default"
                    : "destructive"
                }
                className={getHealthColor(data.overallHealth.status)}
              >
                {data.overallHealth.status.toUpperCase()}
              </Badge>
              {data.overallHealth.issues.length > 0 && (
                <span className="text-sm text-red-600">
                  {data.overallHealth.issues.length} issue(s)
                </span>
              )}
            </div>
            {data.overallHealth.issues.length > 0 && (
              <div className="space-y-1">
                {data.overallHealth.issues.map((issue, index) => (
                  <div key={index} className="text-sm text-red-600">
                    • {issue}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different monitoring views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Configuration Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Provider</span>
                    <Badge variant="outline">{data.config.provider}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Model</span>
                    <Badge variant="outline">{data.config.model}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Configured</span>
                    {data.config.isConfigured ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Enabled</span>
                    {data.config.isEnhancementEnabled ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Memory Usage */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                  <Cpu className="h-4 w-4" />
                  <span>Memory Usage</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Used</span>
                    <span className="text-sm font-medium">
                      {data.memory.stats.usedMemory} MB
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Total</span>
                    <span className="text-sm font-medium">
                      {data.memory.stats.totalMemory} MB
                    </span>
                  </div>
                  <Progress
                    value={data.memory.stats.memoryUsagePercent}
                    className="h-2"
                  />
                  <div className="text-xs text-gray-600">
                    {data.memory.stats.memoryUsagePercent.toFixed(1)}% used
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cache Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                  <Database className="h-4 w-4" />
                  <span>Cache Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Total Keys</span>
                    <span className="text-sm font-medium">
                      {data.cache.totalKeys}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Response Keys</span>
                    <span className="text-sm font-medium">
                      {data.cache.responseKeys}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Enhancement Keys</span>
                    <span className="text-sm font-medium">
                      {data.cache.enhancementKeys}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Provider Health Status */}
          <Card>
            <CardHeader>
              <CardTitle>Provider Health Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(data.health).map(([provider, status]) => (
                  <div key={provider} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{provider}</span>
                      {getHealthIcon(
                        status.isHealthy ? "healthy" : "unhealthy"
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>Response Time: {status.responseTime}ms</div>
                      <div>Error Rate: {status.errorRate?.toFixed(2)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {data.performance ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Request Metrics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Requests</span>
                      <span className="font-medium">
                        {data.performance.overall.totalRequests}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Success Rate</span>
                      <span className="font-medium">
                        {data.performance.overall.successRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Avg Response Time</span>
                      <span className="font-medium">
                        {data.performance.overall.averageResponseTime.toFixed(
                          0
                        )}
                        ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cache Hit Rate</span>
                      <span className="font-medium">
                        {data.performance.overall.cacheHitRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Batch Processing</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Batches</span>
                      <span className="font-medium">
                        {data.performance.overall.totalBatches}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Success Rate</span>
                      <span className="font-medium">
                        {data.performance.overall.successfulBatches > 0
                          ? (
                              (data.performance.overall.successfulBatches /
                                data.performance.overall.totalBatches) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Avg Batch Size</span>
                      <span className="font-medium">
                        {data.performance.overall.averageBatchSize.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Avg Processing Time</span>
                      <span className="font-medium">
                        {data.performance.overall.averageBatchProcessingTime.toFixed(
                          0
                        )}
                        ms
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  Performance data not available
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {data.alerts && data.alerts.length > 0 ? (
            <div className="space-y-3">
              {data.alerts.map((alert, index) => (
                <Alert
                  key={index}
                  className={
                    alert.severity === "critical"
                      ? "border-red-200 bg-red-50"
                      : ""
                  }
                >
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{alert.message}</div>
                        <div className="text-sm text-gray-600">
                          {alert.provider} •{" "}
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <Badge
                        variant={
                          alert.severity === "critical"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  No active alerts
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rate Limits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Rate Limits</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data.rateLimits).map(([provider, limits]) => (
                    <div key={provider} className="space-y-1">
                      <div className="font-medium capitalize">{provider}</div>
                      <div className="text-sm text-gray-600">
                        <div>
                          Minute: {limits.minute?.remaining || 0} remaining
                        </div>
                        <div>Hour: {limits.hour?.remaining || 0} remaining</div>
                        <div>Day: {limits.day?.remaining || 0} remaining</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Memory Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Cpu className="h-5 w-5" />
                  <span>Memory Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.memory.recommendations.length > 0 ? (
                  <div className="space-y-2">
                    {data.memory.recommendations.map(
                      (recommendation, index) => (
                        <div key={index} className="text-sm text-amber-600">
                          • {recommendation}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-green-600">
                    No memory optimization recommendations
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
