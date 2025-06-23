/**
 * Critical Monitoring and Alerting System
 *
 * Monitors critical application metrics and sends alerts when thresholds are breached.
 * Supports multiple notification channels and escalation policies.
 */

import { logger } from "../logger";
import { TIME, MONITORING } from "../constants";

interface AlertRule {
  id: string;
  name: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  metric: string;
  condition: "greater_than" | "less_than" | "equals" | "not_equals";
  threshold: number;
  duration: number; // How long condition must persist (in ms)
  enabled: boolean;
  notificationChannels: string[];
  tags: string[];
}

interface AlertNotification {
  ruleId: string;
  severity: string;
  message: string;
  timestamp: Date;
  metric: string;
  currentValue: number;
  threshold: number;
  runbookUrl?: string;
  dashboardUrl?: string;
}

interface NotificationChannel {
  id: string;
  type: "email" | "webhook" | "slack" | "sms";
  name: string;
  config: Record<string, any>;
  enabled: boolean;
}

interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

class CriticalAlertsService {
  private alertRules: Map<string, AlertRule> = new Map();
  private notificationChannels: Map<string, NotificationChannel> = new Map();
  private alertStates: Map<
    string,
    { triggered: boolean; triggerTime?: Date; lastNotification?: Date }
  > = new Map();
  private metricHistory: Map<string, MetricData[]> = new Map();
  private isEnabled = process.env.NODE_ENV === "production";

  constructor() {
    this.initializeDefaultRules();
    this.initializeNotificationChannels();
    this.startMonitoring();
  }

  /**
   * Initialize default alert rules for critical system components
   */
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      // Application Health
      {
        id: "app_health_check_failed",
        name: "Application Health Check Failed",
        description: "Main application health endpoint is failing",
        severity: "critical",
        metric: "health_check_status",
        condition: "equals",
        threshold: 0, // 0 = failed, 1 = success
        duration: 2 * TIME.MINUTE,
        enabled: true,
        notificationChannels: ["email_critical", "slack_alerts"],
        tags: ["health", "application", "critical"],
      },

      // Database Connectivity
      {
        id: "database_connection_failed",
        name: "Database Connection Failed",
        description: "Unable to connect to primary database",
        severity: "critical",
        metric: "database_connection_status",
        condition: "equals",
        threshold: 0,
        duration: 1 * TIME.MINUTE,
        enabled: true,
        notificationChannels: ["email_critical", "slack_alerts"],
        tags: ["database", "connectivity", "critical"],
      },

      // High Error Rate
      {
        id: "high_error_rate",
        name: "High Application Error Rate",
        description: "Application error rate exceeds acceptable threshold",
        severity: "high",
        metric: "error_rate_percentage",
        condition: "greater_than",
        threshold: 5.0, // 5% error rate
        duration: 5 * TIME.MINUTE,
        enabled: true,
        notificationChannels: ["email_alerts", "slack_alerts"],
        tags: ["errors", "performance", "high"],
      },

      // Response Time
      {
        id: "slow_response_time",
        name: "Slow API Response Time",
        description: "API response time is significantly elevated",
        severity: "medium",
        metric: "avg_response_time_ms",
        condition: "greater_than",
        threshold: 2000, // 2 seconds
        duration: 10 * TIME.MINUTE,
        enabled: true,
        notificationChannels: ["email_alerts", "slack_alerts"],
        tags: ["performance", "latency", "medium"],
      },

      // Memory Usage
      {
        id: "high_memory_usage",
        name: "High Memory Usage",
        description: "Application memory usage is critically high",
        severity: "high",
        metric: "memory_usage_percentage",
        condition: "greater_than",
        threshold: 90.0, // 90%
        duration: 5 * TIME.MINUTE,
        enabled: true,
        notificationChannels: ["email_alerts", "slack_alerts"],
        tags: ["resources", "memory", "high"],
      },

      // Disk Space
      {
        id: "low_disk_space",
        name: "Low Disk Space",
        description: "Available disk space is critically low",
        severity: "high",
        metric: "disk_usage_percentage",
        condition: "greater_than",
        threshold: 85.0, // 85%
        duration: 15 * TIME.MINUTE,
        enabled: true,
        notificationChannels: ["email_alerts", "slack_alerts"],
        tags: ["resources", "disk", "high"],
      },

      // Failed Backups
      {
        id: "backup_failed",
        name: "Database Backup Failed",
        description: "Automated database backup has failed",
        severity: "high",
        metric: "backup_status",
        condition: "equals",
        threshold: 0, // 0 = failed, 1 = success
        duration: 0, // Immediate alert
        enabled: true,
        notificationChannels: ["email_alerts", "slack_alerts"],
        tags: ["backup", "database", "high"],
      },

      // SSL Certificate Expiry
      {
        id: "ssl_cert_expiring",
        name: "SSL Certificate Expiring Soon",
        description: "SSL certificate will expire within 7 days",
        severity: "medium",
        metric: "ssl_cert_days_until_expiry",
        condition: "less_than",
        threshold: 7,
        duration: 0,
        enabled: true,
        notificationChannels: ["email_alerts"],
        tags: ["ssl", "security", "medium"],
      },

      // Active Users Drop
      {
        id: "active_users_drop",
        name: "Significant Drop in Active Users",
        description: "Active user count has dropped significantly",
        severity: "medium",
        metric: "active_users_percentage_change",
        condition: "less_than",
        threshold: -50, // 50% drop
        duration: 10 * TIME.MINUTE,
        enabled: true,
        notificationChannels: ["email_alerts", "slack_alerts"],
        tags: ["users", "traffic", "medium"],
      },

      // Payment Processing
      {
        id: "payment_processing_failed",
        name: "Payment Processing Failures",
        description: "High rate of payment processing failures",
        severity: "high",
        metric: "payment_failure_rate_percentage",
        condition: "greater_than",
        threshold: 10.0, // 10% failure rate
        duration: 5 * TIME.MINUTE,
        enabled: true,
        notificationChannels: ["email_critical", "slack_alerts"],
        tags: ["payments", "revenue", "high"],
      },
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
      this.alertStates.set(rule.id, { triggered: false });
    });
  }

  /**
   * Initialize notification channels
   */
  private initializeNotificationChannels(): void {
    const channels: NotificationChannel[] = [
      {
        id: "email_critical",
        type: "email",
        name: "Critical Email Alerts",
        config: {
          recipients: (process.env.CRITICAL_ALERT_EMAILS || "")
            .split(",")
            .filter(Boolean),
          subject: "[CRITICAL] {{alertName}} - {{severity}}",
          template: "critical_alert",
        },
        enabled: true,
      },
      {
        id: "email_alerts",
        type: "email",
        name: "Standard Email Alerts",
        config: {
          recipients: (process.env.ALERT_EMAILS || "")
            .split(",")
            .filter(Boolean),
          subject: "[ALERT] {{alertName}} - {{severity}}",
          template: "standard_alert",
        },
        enabled: true,
      },
      {
        id: "slack_alerts",
        type: "slack",
        name: "Slack Alerts Channel",
        config: {
          webhookUrl: process.env.SLACK_ALERT_WEBHOOK_URL,
          channel: "#alerts",
          username: "AlertBot",
          emoji: ":warning:",
        },
        enabled: !!process.env.SLACK_ALERT_WEBHOOK_URL,
      },
      {
        id: "webhook_alerts",
        type: "webhook",
        name: "Generic Webhook Alerts",
        config: {
          url: process.env.ALERT_WEBHOOK_URL,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.ALERT_WEBHOOK_TOKEN || ""}`,
          },
        },
        enabled: !!process.env.ALERT_WEBHOOK_URL,
      },
      {
        id: "sms_alerts",
        type: "sms",
        name: "SMS Alerts for Critical Issues",
        config: {
          recipients: (process.env.CRITICAL_ALERT_PHONES || "")
            .split(",")
            .filter(Boolean),
          provider: "twilio", // or 'aws_sns'
          accountSid: process.env.TWILIO_ACCOUNT_SID,
          authToken: process.env.TWILIO_AUTH_TOKEN,
          fromNumber: process.env.TWILIO_FROM_NUMBER,
        },
        enabled: !!(
          process.env.TWILIO_ACCOUNT_SID && process.env.CRITICAL_ALERT_PHONES
        ),
      },
    ];

    channels.forEach(channel => {
      this.notificationChannels.set(channel.id, channel);
    });
  }

  /**
   * Record a metric value for monitoring
   */
  recordMetric(
    name: string,
    value: number,
    labels?: Record<string, string>
  ): void {
    const metric: MetricData = {
      name,
      value,
      timestamp: new Date(),
      labels,
    };

    // Store metric history (keep last 1000 points per metric)
    if (!this.metricHistory.has(name)) {
      this.metricHistory.set(name, []);
    }

    const history = this.metricHistory.get(name)!;
    history.push(metric);

    if (history.length > 1000) {
      history.shift(); // Remove oldest metric
    }

    // Check alert rules for this metric
    this.checkAlertRules(name, value);

    logger.debug("Metric recorded", { name, value, labels });
  }

  /**
   * Check alert rules against the current metric value
   */
  private checkAlertRules(metricName: string, currentValue: number): void {
    const relevantRules = Array.from(this.alertRules.values()).filter(
      rule => rule.enabled && rule.metric === metricName
    );

    for (const rule of relevantRules) {
      const shouldTrigger = this.evaluateCondition(
        rule.condition,
        currentValue,
        rule.threshold
      );
      const alertState = this.alertStates.get(rule.id)!;
      const now = new Date();

      if (shouldTrigger) {
        if (!alertState.triggered) {
          // First time condition is met
          alertState.triggerTime = now;
          this.alertStates.set(rule.id, alertState);
        } else if (alertState.triggerTime) {
          // Check if duration threshold has been met
          const durationMet =
            now.getTime() - alertState.triggerTime.getTime() >= rule.duration;

          if (
            durationMet &&
            (!alertState.lastNotification ||
              this.shouldNotifyAgain(
                alertState.lastNotification,
                rule.severity
              ))
          ) {
            // Send alert
            this.sendAlert(rule, currentValue);
            alertState.triggered = true;
            alertState.lastNotification = now;
            this.alertStates.set(rule.id, alertState);
          }
        }
      } else {
        // Condition no longer met - reset state
        if (alertState.triggered) {
          // Send recovery notification
          this.sendRecoveryNotification(rule, currentValue);
        }
        this.alertStates.set(rule.id, { triggered: false });
      }
    }
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(
    condition: string,
    value: number,
    threshold: number
  ): boolean {
    switch (condition) {
      case "greater_than":
        return value > threshold;
      case "less_than":
        return value < threshold;
      case "equals":
        return value === threshold;
      case "not_equals":
        return value !== threshold;
      default:
        return false;
    }
  }

  /**
   * Determine if we should send another notification based on severity
   */
  private shouldNotifyAgain(lastNotification: Date, severity: string): boolean {
    const now = new Date();
    const timeSinceLastNotification =
      now.getTime() - lastNotification.getTime();

    switch (severity) {
      case "critical":
        return timeSinceLastNotification >= 5 * TIME.MINUTE; // Every 5 minutes
      case "high":
        return timeSinceLastNotification >= 15 * TIME.MINUTE; // Every 15 minutes
      case "medium":
        return timeSinceLastNotification >= TIME.HOUR; // Every hour
      case "low":
        return timeSinceLastNotification >= 4 * TIME.HOUR; // Every 4 hours
      default:
        return false;
    }
  }

  /**
   * Send alert notification
   */
  private async sendAlert(
    rule: AlertRule,
    currentValue: number
  ): Promise<void> {
    const notification: AlertNotification = {
      ruleId: rule.id,
      severity: rule.severity,
      message: `${rule.name}: ${rule.description}`,
      timestamp: new Date(),
      metric: rule.metric,
      currentValue,
      threshold: rule.threshold,
      runbookUrl: this.getRunbookUrl(rule.id),
      dashboardUrl: this.getDashboardUrl(rule.metric),
    };

    logger.warn("Sending critical alert", {
      ruleId: rule.id,
      severity: rule.severity,
      metric: rule.metric,
      currentValue,
      threshold: rule.threshold,
    });

    // Send to all configured notification channels
    const promises = rule.notificationChannels
      .map(channelId => {
        const channel = this.notificationChannels.get(channelId);
        if (channel && channel.enabled) {
          return this.sendNotification(channel, notification, rule);
        }
      })
      .filter(Boolean);

    try {
      await Promise.allSettled(promises);
    } catch (error) {
      logger.error("Failed to send some alert notifications", {
        error,
        ruleId: rule.id,
      });
    }
  }

  /**
   * Send recovery notification
   */
  private async sendRecoveryNotification(
    rule: AlertRule,
    currentValue: number
  ): Promise<void> {
    const notification: AlertNotification = {
      ruleId: rule.id,
      severity: "info" as any,
      message: `RECOVERED: ${rule.name} - Metric has returned to normal levels`,
      timestamp: new Date(),
      metric: rule.metric,
      currentValue,
      threshold: rule.threshold,
    };

    logger.info("Sending recovery notification", {
      ruleId: rule.id,
      metric: rule.metric,
      currentValue,
    });

    // Send recovery notifications (usually fewer channels)
    const recoveryChannels = rule.notificationChannels.filter(
      id => !id.includes("sms") && !id.includes("pagerduty")
    );

    const promises = recoveryChannels
      .map(channelId => {
        const channel = this.notificationChannels.get(channelId);
        if (channel && channel.enabled) {
          return this.sendNotification(channel, notification, rule);
        }
      })
      .filter(Boolean);

    await Promise.allSettled(promises);
  }

  /**
   * Send notification to specific channel
   */
  private async sendNotification(
    channel: NotificationChannel,
    notification: AlertNotification,
    rule: AlertRule
  ): Promise<void> {
    try {
      switch (channel.type) {
        case "email":
          await this.sendEmailNotification(channel, notification, rule);
          break;
        case "slack":
          await this.sendSlackNotification(channel, notification, rule);
          break;
        case "webhook":
          await this.sendWebhookNotification(channel, notification, rule);
          break;
        case "sms":
          await this.sendSMSNotification(channel, notification, rule);
          break;
        default:
          logger.warn("Unknown notification channel type", {
            type: channel.type,
          });
      }
    } catch (error) {
      logger.error("Failed to send notification", {
        channelId: channel.id,
        error,
        ruleId: rule.id,
      });
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    channel: NotificationChannel,
    notification: AlertNotification,
    rule: AlertRule
  ): Promise<void> {
    try {
      const { sendMail } = await import("../brevo");

      const subject = channel.config.subject
        .replace("{{alertName}}", rule.name)
        .replace("{{severity}}", notification.severity.toUpperCase());

      const htmlContent = this.generateEmailHtml(notification, rule);

      for (const recipient of channel.config.recipients) {
        await sendMail({
          to: recipient,
          subject,
          html: htmlContent,
        });
      }

      logger.info("Email alert sent", {
        channelId: channel.id,
        recipients: channel.config.recipients.length,
      });
    } catch (error) {
      logger.error("Failed to send email alert", {
        error,
        channelId: channel.id,
      });
      throw error;
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(
    channel: NotificationChannel,
    notification: AlertNotification,
    rule: AlertRule
  ): Promise<void> {
    const color = this.getSeverityColor(notification.severity);
    const emoji = this.getSeverityEmoji(notification.severity);

    const payload = {
      username: channel.config.username,
      icon_emoji: channel.config.emoji,
      channel: channel.config.channel,
      attachments: [
        {
          color,
          title: `${emoji} ${rule.name}`,
          text: notification.message,
          fields: [
            {
              title: "Severity",
              value: notification.severity.toUpperCase(),
              short: true,
            },
            {
              title: "Metric",
              value: notification.metric,
              short: true,
            },
            {
              title: "Current Value",
              value: notification.currentValue.toString(),
              short: true,
            },
            {
              title: "Threshold",
              value: notification.threshold.toString(),
              short: true,
            },
            {
              title: "Time",
              value: notification.timestamp.toISOString(),
              short: true,
            },
          ],
          actions: notification.runbookUrl
            ? [
                {
                  type: "button",
                  text: "View Runbook",
                  url: notification.runbookUrl,
                },
              ]
            : [],
        },
      ],
    };

    const response = await fetch(channel.config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    logger.info("Slack alert sent", { channelId: channel.id });
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(
    channel: NotificationChannel,
    notification: AlertNotification,
    rule: AlertRule
  ): Promise<void> {
    const payload = {
      event: "alert_triggered",
      alert: {
        ...notification,
        rule: {
          id: rule.id,
          name: rule.name,
          description: rule.description,
          tags: rule.tags,
        },
      },
    };

    const response = await fetch(channel.config.url, {
      method: channel.config.method || "POST",
      headers: channel.config.headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.status}`);
    }

    logger.info("Webhook alert sent", { channelId: channel.id });
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(
    channel: NotificationChannel,
    notification: AlertNotification,
    rule: AlertRule
  ): Promise<void> {
    const message = `ALERT: ${rule.name}\n${notification.message}\nValue: ${notification.currentValue} (threshold: ${notification.threshold})`;

    // This would require Twilio SDK or similar
    logger.info("SMS notification would be sent", {
      channelId: channel.id,
      recipients: channel.config.recipients.length,
      message: message.substring(0, 50) + "...",
    });
  }

  /**
   * Generate HTML content for email alerts
   */
  private generateEmailHtml(
    notification: AlertNotification,
    rule: AlertRule
  ): string {
    const severityColor = this.getSeverityColor(notification.severity);

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${severityColor}; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">🚨 Alert Triggered</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #333; margin-top: 0;">${rule.name}</h2>
          <p style="font-size: 16px; color: #666;">${notification.message}</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #fff;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Severity</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${notification.severity.toUpperCase()}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Metric</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${notification.metric}</td>
            </tr>
            <tr style="background-color: #fff;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Current Value</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${notification.currentValue}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Threshold</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${notification.threshold}</td>
            </tr>
          </table>

          ${
            notification.runbookUrl
              ? `
            <div style="text-align: center; margin: 20px 0;">
              <a href="${notification.runbookUrl}" style="background-color: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Runbook</a>
            </div>
          `
              : ""
          }

          ${
            notification.dashboardUrl
              ? `
            <div style="text-align: center; margin: 20px 0;">
              <a href="${notification.dashboardUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Dashboard</a>
            </div>
          `
              : ""
          }
        </div>

        <div style="background-color: #333; color: #fff; padding: 10px; text-align: center; font-size: 12px;">
          This is an automated alert from the STEM Toys monitoring system.
        </div>
      </div>
    `;
  }

  /**
   * Start continuous monitoring
   */
  private startMonitoring(): void {
    if (!this.isEnabled) {
      logger.info("Critical alerts monitoring disabled (not in production)");
      return;
    }

    // Run monitoring checks every minute
    setInterval(() => {
      this.performHealthChecks();
    }, TIME.MINUTE);

    // Clean up old metric history every hour
    setInterval(() => {
      this.cleanupMetricHistory();
    }, TIME.HOUR);

    logger.info("Critical alerts monitoring started");
  }

  /**
   * Perform automated health checks
   */
  private async performHealthChecks(): Promise<void> {
    try {
      // Application health check
      const healthResponse = await fetch("/api/health").catch(() => null);
      this.recordMetric("health_check_status", healthResponse?.ok ? 1 : 0);

      // Database health check
      const dbHealthResponse = await fetch("/api/health/live").catch(
        () => null
      );
      this.recordMetric(
        "database_connection_status",
        dbHealthResponse?.ok ? 1 : 0
      );

      // Memory usage (if available)
      if (process.memoryUsage) {
        const memUsage = process.memoryUsage();
        const memoryPercentage =
          (memUsage.rss / (memUsage.rss + memUsage.external)) * 100;
        this.recordMetric("memory_usage_percentage", memoryPercentage);
      }
    } catch (error) {
      logger.error("Error performing health checks", { error });
    }
  }

  /**
   * Clean up old metric history to prevent memory leaks
   */
  private cleanupMetricHistory(): void {
    const cutoffTime = new Date(Date.now() - 24 * TIME.HOUR); // Keep 24 hours

    for (const [metricName, history] of this.metricHistory.entries()) {
      const filteredHistory = history.filter(
        metric => metric.timestamp > cutoffTime
      );
      this.metricHistory.set(metricName, filteredHistory);
    }
  }

  /**
   * Utility methods
   */
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case "critical":
        return "#dc3545";
      case "high":
        return "#fd7e14";
      case "medium":
        return "#ffc107";
      case "low":
        return "#6c757d";
      default:
        return "#007bff";
    }
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case "critical":
        return "🚨";
      case "high":
        return "⚠️";
      case "medium":
        return "🔔";
      case "low":
        return "ℹ️";
      default:
        return "📊";
    }
  }

  private getRunbookUrl(ruleId: string): string {
    return `${process.env.NEXT_PUBLIC_SITE_URL}/docs/runbooks/${ruleId}`;
  }

  private getDashboardUrl(metric: string): string {
    return `${process.env.NEXT_PUBLIC_SITE_URL}/admin/monitoring?metric=${metric}`;
  }

  /**
   * Public API methods
   */

  /**
   * Get current alert status
   */
  getAlertStatus() {
    const activeAlerts = Array.from(this.alertStates.entries())
      .filter(([_, state]) => state.triggered)
      .map(([ruleId, state]) => ({
        ruleId,
        rule: this.alertRules.get(ruleId),
        triggerTime: state.triggerTime,
        lastNotification: state.lastNotification,
      }));

    return {
      totalRules: this.alertRules.size,
      activeAlerts: activeAlerts.length,
      alerts: activeAlerts,
    };
  }

  /**
   * Add or update an alert rule
   */
  setAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    if (!this.alertStates.has(rule.id)) {
      this.alertStates.set(rule.id, { triggered: false });
    }
    logger.info("Alert rule updated", { ruleId: rule.id, name: rule.name });
  }

  /**
   * Enable or disable an alert rule
   */
  toggleAlertRule(ruleId: string, enabled: boolean): void {
    const rule = this.alertRules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      this.alertRules.set(ruleId, rule);
      logger.info("Alert rule toggled", { ruleId, enabled });
    }
  }

  /**
   * Test notification channel
   */
  async testNotificationChannel(channelId: string): Promise<void> {
    const channel = this.notificationChannels.get(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    const testNotification: AlertNotification = {
      ruleId: "test",
      severity: "low",
      message: "This is a test notification to verify channel configuration",
      timestamp: new Date(),
      metric: "test_metric",
      currentValue: 100,
      threshold: 50,
    };

    const testRule: AlertRule = {
      id: "test",
      name: "Test Alert",
      description: "Test notification",
      severity: "low",
      metric: "test_metric",
      condition: "greater_than",
      threshold: 50,
      duration: 0,
      enabled: true,
      notificationChannels: [channelId],
      tags: ["test"],
    };

    await this.sendNotification(channel, testNotification, testRule);
    logger.info("Test notification sent", { channelId });
  }
}

// Export singleton instance
export const criticalAlertsService = new CriticalAlertsService();

// Export types for external use
export type { AlertRule, AlertNotification, NotificationChannel, MetricData };
