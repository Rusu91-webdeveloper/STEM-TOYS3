/**
 * Alert System for TechTots Search Performance
 * Monitors and alerts on critical issues
 */

import { appConfig } from "@/lib/config/app-config";

interface AlertConfig {
  email: string;
  slackWebhook?: string;
  enableConsoleAlerts: boolean;
  enableEmailAlerts: boolean;
  enableSlackAlerts: boolean;
}

interface Alert {
  id: string;
  type: "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: number;
  resolved: boolean;
  data?: any;
}

class AlertManager {
  private alerts: Alert[] = [];
  private config: AlertConfig;
  private alertThresholds = {
    zeroResultRate: 0.3, // Alert if 30% of searches return zero results
    lowResultRate: 0.5, // Alert if 50% of searches return < 5 results
    highBounceRate: 0.7, // Alert if bounce rate > 70%
    slowPageLoad: 3000, // Alert if page load > 3 seconds
    errorRate: 0.05, // Alert if error rate > 5%
  };

  constructor(config: AlertConfig) {
    this.config = config;
  }

  // Create a new alert
  createAlert(
    type: Alert["type"],
    title: string,
    message: string,
    data?: any
  ): Alert {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: Date.now(),
      resolved: false,
      data,
    };

    this.alerts.push(alert);
    this.sendAlert(alert);
    return alert;
  }

  // Send alert to configured channels
  private async sendAlert(alert: Alert) {
    if (this.config.enableConsoleAlerts) {
      this.sendConsoleAlert(alert);
    }

    if (this.config.enableEmailAlerts) {
      await this.sendEmailAlert(alert);
    }

    if (this.config.enableSlackAlerts && this.config.slackWebhook) {
      await this.sendSlackAlert(alert);
    }
  }

  private sendConsoleAlert(alert: Alert) {
    const emoji = {
      error: "🚨",
      warning: "⚠️",
      info: "ℹ️",
    }[alert.type];

    console.log(`${emoji} ${alert.title}: ${alert.message}`);
    if (alert.data) {
      console.log("Data:", alert.data);
    }
  }

  private async sendEmailAlert(alert: Alert) {
    // In a real implementation, you would send an email here
    // For now, we'll just log it
    console.log(
      `📧 Email alert would be sent to ${this.config.email}: ${alert.title}`
    );
  }

  private async sendSlackAlert(alert: Alert) {
    if (!this.config.slackWebhook) return;

    const color = {
      error: "#ff0000",
      warning: "#ffaa00",
      info: "#00aaff",
    }[alert.type];

    const payload = {
      text: `*${alert.title}*`,
      attachments: [
        {
          color,
          fields: [
            {
              title: "Message",
              value: alert.message,
              short: false,
            },
            {
              title: "Time",
              value: new Date(alert.timestamp).toISOString(),
              short: true,
            },
            {
              title: "Type",
              value: alert.type.toUpperCase(),
              short: true,
            },
          ],
        },
      ],
    };

    try {
      await fetch(this.config.slackWebhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Failed to send Slack alert:", error);
    }
  }

  // Check for various alert conditions
  checkSearchPerformance(metrics: any) {
    const { totalQueries, zeroResultQueries, averageResultsCount } = metrics;

    if (totalQueries === 0) return;

    // Check zero result rate
    const zeroResultRate = zeroResultQueries.length / totalQueries;
    if (zeroResultRate > this.alertThresholds.zeroResultRate) {
      this.createAlert(
        "warning",
        "High Zero Result Rate",
        `${(zeroResultRate * 100).toFixed(1)}% of searches return zero results`,
        { zeroResultRate, zeroResultQueries: zeroResultQueries.slice(0, 10) }
      );
    }

    // Check low result rate
    if (averageResultsCount < 5) {
      this.createAlert(
        "warning",
        "Low Average Results",
        `Average search results: ${averageResultsCount.toFixed(1)}`,
        { averageResultsCount }
      );
    }
  }

  checkPagePerformance(metrics: any) {
    const { loadTime, errorRate } = metrics;

    // Check page load time
    if (loadTime > this.alertThresholds.slowPageLoad) {
      this.createAlert(
        "warning",
        "Slow Page Load",
        `Page load time: ${loadTime}ms`,
        { loadTime }
      );
    }

    // Check error rate
    if (errorRate > this.alertThresholds.errorRate) {
      this.createAlert(
        "error",
        "High Error Rate",
        `Error rate: ${(errorRate * 100).toFixed(1)}%`,
        { errorRate }
      );
    }
  }

  checkCoreWebVitals(metrics: any) {
    const { LCP, INP, CLS } = metrics;

    // Check LCP
    if (LCP > 4000) {
      this.createAlert(
        "error",
        "Poor LCP Performance",
        `Largest Contentful Paint: ${LCP}ms (Poor)`,
        { LCP, threshold: 4000 }
      );
    } else if (LCP > 2500) {
      this.createAlert(
        "warning",
        "LCP Needs Improvement",
        `Largest Contentful Paint: ${LCP}ms (Needs Improvement)`,
        { LCP, threshold: 2500 }
      );
    }

    // Check INP (replaces FID)
    if (INP > 500) {
      this.createAlert(
        "error",
        "Poor INP Performance",
        `Interaction to Next Paint: ${INP}ms (Poor)`,
        { INP, threshold: 500 }
      );
    } else if (INP > 200) {
      this.createAlert(
        "warning",
        "INP Needs Improvement",
        `Interaction to Next Paint: ${INP}ms (Needs Improvement)`,
        { INP, threshold: 200 }
      );
    }

    // Check CLS
    if (CLS > 0.25) {
      this.createAlert(
        "error",
        "Poor CLS Performance",
        `Cumulative Layout Shift: ${CLS} (Poor)`,
        { CLS, threshold: 0.25 }
      );
    } else if (CLS > 0.1) {
      this.createAlert(
        "warning",
        "CLS Needs Improvement",
        `Cumulative Layout Shift: ${CLS} (Needs Improvement)`,
        { CLS, threshold: 0.1 }
      );
    }
  }

  // Get all alerts
  getAlerts(): Alert[] {
    return this.alerts;
  }

  // Get unresolved alerts
  getUnresolvedAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  // Resolve an alert
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  // Clear old alerts (older than 7 days)
  clearOldAlerts(): void {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    this.alerts = this.alerts.filter(alert => alert.timestamp > sevenDaysAgo);
  }
}

// Default configuration
const defaultConfig: AlertConfig = {
  email: appConfig.alertEmail,
  slackWebhook: process.env.SLACK_WEBHOOK_URL,
  enableConsoleAlerts: true,
  enableEmailAlerts: process.env.NODE_ENV === "production",
  enableSlackAlerts: !!process.env.SLACK_WEBHOOK_URL,
};

// Global alert manager instance
export const alertManager = new AlertManager(defaultConfig);

// Convenience functions
export const createAlert = (
  type: Alert["type"],
  title: string,
  message: string,
  data?: any
) => alertManager.createAlert(type, title, message, data);

export const checkSearchPerformance = (metrics: any) =>
  alertManager.checkSearchPerformance(metrics);

export const checkPagePerformance = (metrics: any) =>
  alertManager.checkPagePerformance(metrics);

export const checkCoreWebVitals = (metrics: any) =>
  alertManager.checkCoreWebVitals(metrics);

export const getAlerts = () => alertManager.getAlerts();
export const getUnresolvedAlerts = () => alertManager.getUnresolvedAlerts();
export const resolveAlert = (alertId: string) =>
  alertManager.resolveAlert(alertId);
