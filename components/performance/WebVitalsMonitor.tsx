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
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  startPerformanceMonitoring,
  getPerformanceReport,
  type WebVitalsMetrics,
  type PerformanceReport,
} from "@/lib/utils/web-vitals";
import {
  Activity,
  Clock,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface WebVitalsDisplayProps {
  showDetails?: boolean;
  showRecommendations?: boolean;
  debug?: boolean;
}

export default function WebVitalsMonitor({
  showDetails = true,
  showRecommendations = true,
  debug = false,
}: WebVitalsDisplayProps) {
  const [metrics, setMetrics] = useState<WebVitalsMetrics | null>(null);
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Start monitoring
    startPerformanceMonitoring({
      debug,
      reportToAnalytics: true,
    });

    // Get initial report
    const getReport = async () => {
      try {
        const performanceReport = await getPerformanceReport();
        setReport(performanceReport);
        setMetrics(performanceReport.webVitals);
      } catch (error) {
        console.error("Failed to get performance report:", error);
      } finally {
        setLoading(false);
      }
    };

    // Wait a bit for metrics to be available
    const timer = setTimeout(getReport, 2000);
    return () => clearTimeout(timer);
  }, [debug]);

  const getMetricRating = (
    value: number,
    thresholds: { good: number; needsImprovement: number }
  ) => {
    if (value <= thresholds.good) return "good";
    if (value <= thresholds.needsImprovement) return "needs-improvement";
    return "poor";
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "good":
        return "bg-green-100 text-green-800";
      case "needs-improvement":
        return "bg-yellow-100 text-yellow-800";
      case "poor":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case "good":
        return <CheckCircle className="w-4 h-4" />;
      case "needs-improvement":
        return <AlertTriangle className="w-4 h-4" />;
      case "poor":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatMetric = (value: number, unit: string = "ms") => {
    if (value === 0) return "N/A";
    return `${value.toFixed(1)}${unit}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Core Web Vitals
          </CardTitle>
          <CardDescription>Loading performance metrics...</CardDescription>
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

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Core Web Vitals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Unable to load performance metrics. Please refresh the page.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const clsRating = getMetricRating(metrics.CLS, {
    good: 0.1,
    needsImprovement: 0.25,
  });
  const fidRating = getMetricRating(metrics.FID, {
    good: 100,
    needsImprovement: 300,
  });
  const fcpRating = getMetricRating(metrics.FCP, {
    good: 1800,
    needsImprovement: 3000,
  });
  const lcpRating = getMetricRating(metrics.LCP, {
    good: 2500,
    needsImprovement: 4000,
  });
  const ttfbRating = getMetricRating(metrics.TTFB, {
    good: 600,
    needsImprovement: 1800,
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Core Web Vitals
            {report && (
              <Badge
                variant={
                  report.score >= 90
                    ? "default"
                    : report.score >= 70
                      ? "secondary"
                      : "destructive"
                }
              >
                Score: {report.score}/100
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Real-time performance metrics for this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* CLS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="font-medium">
                  Cumulative Layout Shift (CLS)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">
                  {formatMetric(metrics.CLS, "")}
                </span>
                <Badge className={getRatingColor(clsRating)}>
                  {getRatingIcon(clsRating)}
                  {clsRating.replace("-", " ")}
                </Badge>
              </div>
            </div>
            <Progress
              value={Math.min((metrics.CLS / 0.25) * 100, 100)}
              className="h-2"
            />
          </div>

          {/* FID */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="font-medium">First Input Delay (FID)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">
                  {formatMetric(metrics.FID)}
                </span>
                <Badge className={getRatingColor(fidRating)}>
                  {getRatingIcon(fidRating)}
                  {fidRating.replace("-", " ")}
                </Badge>
              </div>
            </div>
            <Progress
              value={Math.min((metrics.FID / 300) * 100, 100)}
              className="h-2"
            />
          </div>

          {/* FCP */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="font-medium">
                  First Contentful Paint (FCP)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">
                  {formatMetric(metrics.FCP)}
                </span>
                <Badge className={getRatingColor(fcpRating)}>
                  {getRatingIcon(fcpRating)}
                  {fcpRating.replace("-", " ")}
                </Badge>
              </div>
            </div>
            <Progress
              value={Math.min((metrics.FCP / 3000) * 100, 100)}
              className="h-2"
            />
          </div>

          {/* LCP */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="font-medium">
                  Largest Contentful Paint (LCP)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">
                  {formatMetric(metrics.LCP)}
                </span>
                <Badge className={getRatingColor(lcpRating)}>
                  {getRatingIcon(lcpRating)}
                  {lcpRating.replace("-", " ")}
                </Badge>
              </div>
            </div>
            <Progress
              value={Math.min((metrics.LCP / 4000) * 100, 100)}
              className="h-2"
            />
          </div>

          {/* TTFB */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Time to First Byte (TTFB)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">
                  {formatMetric(metrics.TTFB)}
                </span>
                <Badge className={getRatingColor(ttfbRating)}>
                  {getRatingIcon(ttfbRating)}
                  {ttfbRating.replace("-", " ")}
                </Badge>
              </div>
            </div>
            <Progress
              value={Math.min((metrics.TTFB / 1800) * 100, 100)}
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Metrics</CardTitle>
            <CardDescription>
              Additional performance information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">URL:</span>
                <p className="font-mono text-xs truncate">{metrics.url}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Timestamp:</span>
                <p className="font-mono text-xs">
                  {new Date(metrics.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">User Agent:</span>
                <p className="font-mono text-xs truncate">
                  {metrics.userAgent}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {showRecommendations && report && report.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Recommendations</CardTitle>
            <CardDescription>
              Suggestions to improve page performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.recommendations.map((recommendation, index) => (
                <Alert key={index}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{recommendation}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
