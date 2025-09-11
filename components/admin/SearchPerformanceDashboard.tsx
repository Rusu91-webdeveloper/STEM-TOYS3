"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  getSearchMetrics,
  getAlerts,
  getUnresolvedAlerts,
  resolveAlert,
} from "@/lib/analytics/search-performance";
import {
  getAlerts as getAlertManagerAlerts,
  getUnresolvedAlerts as getUnresolvedAlertManagerAlerts,
  resolveAlert as resolveAlertManager,
} from "@/lib/analytics/alerts";

interface SearchPerformanceDashboardProps {
  refreshInterval?: number;
}

export default function SearchPerformanceDashboard({
  refreshInterval = 30000, // 30 seconds
}: SearchPerformanceDashboardProps) {
  const [searchMetrics, setSearchMetrics] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = () => {
    setIsLoading(true);

    // Get search metrics
    const metrics = getSearchMetrics();
    setSearchMetrics(metrics);

    // Get alerts
    const allAlerts = getAlertManagerAlerts();
    setAlerts(allAlerts);

    setIsLoading(false);
  };

  useEffect(() => {
    refreshData();

    if (refreshInterval > 0) {
      const interval = setInterval(refreshData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  const handleResolveAlert = (alertId: string) => {
    const success = resolveAlertManager(alertId);
    if (success) {
      refreshData();
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "error":
        return "destructive";
      case "warning":
        return "default";
      case "info":
        return "secondary";
      default:
        return "default";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return "🚨";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "📢";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Search Performance Dashboard</h1>
        <Button onClick={refreshData} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Active Alerts</h2>
          {alerts
            .filter(alert => !alert.resolved)
            .map(alert => (
              <Alert key={alert.id} variant={getAlertColor(alert.type)}>
                <AlertTitle className="flex items-center gap-2">
                  {getAlertIcon(alert.type)} {alert.title}
                </AlertTitle>
                <AlertDescription className="mt-2">
                  {alert.message}
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveAlert(alert.id)}
                    >
                      Resolve
                    </Button>
                    <span className="text-sm text-gray-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
        </div>
      )}

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Searches</CardTitle>
            <CardDescription>All time search queries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {searchMetrics?.totalQueries || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Results</CardTitle>
            <CardDescription>Average results per search</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {searchMetrics?.averageResultsCount || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Zero Result Queries</CardTitle>
            <CardDescription>Queries with no results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {searchMetrics?.zeroResultQueries?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Queries */}
      {searchMetrics?.popularQueries &&
        searchMetrics.popularQueries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Popular Search Queries</CardTitle>
              <CardDescription>Most searched terms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {searchMetrics.popularQueries
                  .slice(0, 10)
                  .map((query: any, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <span className="font-medium">{query.query}</span>
                      <Badge variant="secondary">{query.count} searches</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Language Distribution */}
      {searchMetrics?.languageDistribution &&
        Object.keys(searchMetrics.languageDistribution).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Language Distribution</CardTitle>
              <CardDescription>Search queries by language</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(searchMetrics.languageDistribution).map(
                  ([language, count]) => (
                    <div
                      key={language}
                      className="flex justify-between items-center"
                    >
                      <span className="font-medium">
                        {language === "ro" ? "Romanian" : "English"}
                      </span>
                      <Badge variant="outline">
                        {count as number} searches
                      </Badge>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Category Performance */}
      {searchMetrics?.categoryPerformance &&
        Object.keys(searchMetrics.categoryPerformance).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>Searches by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(searchMetrics.categoryPerformance).map(
                  ([category, count]) => (
                    <div
                      key={category}
                      className="flex justify-between items-center"
                    >
                      <span className="font-medium capitalize">{category}</span>
                      <Badge variant="outline">
                        {count as number} searches
                      </Badge>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Zero Result Queries */}
      {searchMetrics?.zeroResultQueries &&
        searchMetrics.zeroResultQueries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Zero Result Queries</CardTitle>
              <CardDescription>
                Queries that returned no results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {searchMetrics.zeroResultQueries
                  .slice(0, 20)
                  .map((query: string, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <span className="font-medium text-red-600">{query}</span>
                      <Badge variant="destructive">No results</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
