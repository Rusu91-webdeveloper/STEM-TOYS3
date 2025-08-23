import { NextRequest, NextResponse } from "next/server";
import { performanceMonitor, getPerformanceMetrics, getSlowQueries, getOptimizationRecommendations, exportPerformanceData } from "../../../../lib/monitoring/performance-monitor";
import { withRateLimiting } from "../../../../lib/security/rate-limiter";
import { withSecurityHeaders } from "../../../../lib/security/security-middleware";

// GET - Get performance metrics and analytics
export const GET = withSecurityHeaders(
  withRateLimiting(
    async (req: NextRequest) => {
      try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get("action");
        const timeRange = searchParams.get("timeRange") ?? "24h";
        const metric = searchParams.get("metric");

        switch (action) {
          case "metrics":
            const metrics = await getPerformanceMetrics(timeRange, metric);
            return NextResponse.json({
              success: true,
              metrics,
            });

          case "slow-queries":
            const slowQueries = await getSlowQueries(timeRange);
            return NextResponse.json({
              success: true,
              slowQueries,
            });

          case "recommendations":
            const recommendations = await getOptimizationRecommendations();
            return NextResponse.json({
              success: true,
              recommendations,
            });

          case "alerts":
            const alerts = performanceMonitor.getActiveAlerts();
            return NextResponse.json({
              success: true,
              alerts,
            });

          case "summary":
            const summary = performanceMonitor.getPerformanceSummary(timeRange);
            return NextResponse.json({
              success: true,
              summary,
            });

          case "export":
            const format = searchParams.get("format") ?? "json";
            const data = await exportPerformanceData(timeRange, format);
            
            if (format === "csv") {
              return new NextResponse(data, {
                headers: {
                  "Content-Type": "text/csv",
                  "Content-Disposition": `attachment; filename="performance-${timeRange}.csv"`,
                },
              });
            }
            
            return NextResponse.json({
              success: true,
              data,
            });

          case "health":
            const health = performanceMonitor.getHealthStatus();
            return NextResponse.json({
              success: true,
              health,
            });

          default:
            return NextResponse.json({
              success: true,
              summary: performanceMonitor.getPerformanceSummary(timeRange),
              metrics: await getPerformanceMetrics(timeRange),
            });
        }
      } catch (error) {
        console.error("Performance API error:", error);
        return NextResponse.json(
          { error: "Failed to process performance request" },
          { status: 500 }
        );
      }
    },
    {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 requests per minute
      message: "Too many performance requests. Please slow down.",
    }
  )
);

// POST - Configure performance monitoring and set thresholds
export const POST = withSecurityHeaders(
  withRateLimiting(
    async (req: NextRequest) => {
      try {
        const body = await req.json();
        const { action, config, thresholds, alerts } = body;

        switch (action) {
          case "update-config":
            if (!config) {
              return NextResponse.json(
                { error: "Configuration is required" },
                { status: 400 }
              );
            }

            performanceMonitor.updateConfig(config);

            return NextResponse.json({
              success: true,
              message: "Performance monitoring configuration updated",
              config: performanceMonitor.getConfig(),
            });

          case "set-thresholds":
            if (!thresholds) {
              return NextResponse.json(
                { error: "Thresholds are required" },
                { status: 400 }
              );
            }

            performanceMonitor.setThresholds(thresholds);

            return NextResponse.json({
              success: true,
              message: "Performance thresholds updated",
            });

          case "configure-alerts":
            if (!alerts) {
              return NextResponse.json(
                { error: "Alert configuration is required" },
                { status: 400 }
              );
            }

            performanceMonitor.configureAlerts(alerts);

            return NextResponse.json({
              success: true,
              message: "Performance alerts configured",
            });

          case "start-monitoring":
            performanceMonitor.startMonitoring();

            return NextResponse.json({
              success: true,
              message: "Performance monitoring started",
            });

          case "stop-monitoring":
            performanceMonitor.stopMonitoring();

            return NextResponse.json({
              success: true,
              message: "Performance monitoring stopped",
            });

          case "clear-metrics":
            const { timeRange: clearTimeRange } = body;
            performanceMonitor.clearMetrics(clearTimeRange);

            return NextResponse.json({
              success: true,
              message: `Performance metrics cleared for ${clearTimeRange ?? "all time"}`,
            });

          default:
            return NextResponse.json(
              { error: "Invalid action" },
              { status: 400 }
            );
        }
      } catch (error) {
        console.error("Performance configuration error:", error);
        return NextResponse.json(
          { error: "Failed to configure performance monitoring" },
          { status: 500 }
        );
      }
    },
    {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20, // 20 requests per minute
      message: "Too many performance configurations. Please slow down.",
    }
  )
);

// PUT - Update performance monitoring settings
export const PUT = withSecurityHeaders(
  withRateLimiting(
    async (req: NextRequest) => {
      try {
        const body = await req.json();
        const { action, metric, value, enabled } = body;

        switch (action) {
          case "enable-metric":
            if (!metric) {
              return NextResponse.json(
                { error: "Metric is required" },
                { status: 400 }
              );
            }

            performanceMonitor.enableMetric(metric);

            return NextResponse.json({
              success: true,
              message: `Metric ${metric} enabled`,
            });

          case "disable-metric":
            if (!metric) {
              return NextResponse.json(
                { error: "Metric is required" },
                { status: 400 }
              );
            }

            performanceMonitor.disableMetric(metric);

            return NextResponse.json({
              success: true,
              message: `Metric ${metric} disabled`,
            });

          case "update-threshold":
            if (!metric || value === undefined) {
              return NextResponse.json(
                { error: "Metric and value are required" },
                { status: 400 }
              );
            }

            performanceMonitor.updateThreshold(metric, value);

            return NextResponse.json({
              success: true,
              message: `Threshold updated for ${metric}`,
            });

          case "toggle-monitoring":
            if (enabled === undefined) {
              return NextResponse.json(
                { error: "Enabled status is required" },
                { status: 400 }
              );
            }

            if (enabled) {
              performanceMonitor.startMonitoring();
            } else {
              performanceMonitor.stopMonitoring();
            }

            return NextResponse.json({
              success: true,
              message: `Performance monitoring ${enabled ? "started" : "stopped"}`,
            });

          case "acknowledge-alert":
            const { alertId } = body;
            if (!alertId) {
              return NextResponse.json(
                { error: "Alert ID is required" },
                { status: 400 }
              );
            }

            performanceMonitor.acknowledgeAlert(alertId);

            return NextResponse.json({
              success: true,
              message: `Alert ${alertId} acknowledged`,
            });

          default:
            return NextResponse.json(
              { error: "Invalid action" },
              { status: 400 }
            );
        }
      } catch (error) {
        console.error("Performance update error:", error);
        return NextResponse.json(
          { error: "Failed to update performance monitoring" },
          { status: 500 }
        );
      }
    },
    {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 requests per minute
      message: "Too many performance updates. Please slow down.",
    }
  )
);

// DELETE - Clear performance data and reset monitoring
export const DELETE = withSecurityHeaders(
  withRateLimiting(
    (req: NextRequest) => {
      try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") ?? "all";
        const timeRange = searchParams.get("timeRange");

        switch (type) {
          case "all":
            performanceMonitor.clearAllData();
            break;
          case "metrics":
            performanceMonitor.clearMetrics(timeRange);
            break;
          case "alerts":
            performanceMonitor.clearAlerts();
            break;
          case "thresholds":
            performanceMonitor.resetThresholds();
            break;
          default:
            return NextResponse.json(
              { error: "Invalid clear type" },
              { status: 400 }
            );
        }

        return NextResponse.json({
          success: true,
          message: `Cleared ${type} performance data`,
        });
      } catch (error) {
        console.error("Performance clear error:", error);
        return NextResponse.json(
          { error: "Failed to clear performance data" },
          { status: 500 }
        );
      }
    },
    {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 requests per minute
      message: "Too many performance clear requests. Please slow down.",
    }
  )
);
