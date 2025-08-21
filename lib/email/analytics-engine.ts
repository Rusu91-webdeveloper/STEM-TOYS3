/**
 * Advanced Email Analytics Engine
 * Provides comprehensive email tracking, performance monitoring, and insights
 * for enterprise-grade email analytics
 */

import { prisma } from "@/lib/prisma";
import { cache } from "@/lib/cache";

export interface EmailEvent {
  id: string;
  emailId: string;
  userId?: string;
  email: string;
  eventType:
    | "sent"
    | "delivered"
    | "opened"
    | "clicked"
    | "bounced"
    | "unsubscribed"
    | "spam_reported";
  timestamp: Date;
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    location?: {
      country: string;
      city?: string;
    };
    deviceType?: "mobile" | "desktop" | "tablet";
    emailClient?: string;
    linkClicked?: string;
    subject?: string;
    campaignId?: string;
    templateId?: string;
  };
}

export interface EmailMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  spamReported: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
  bounceRate: number;
  unsubscribeRate: number;
}

export interface CampaignPerformance {
  campaignId: string;
  campaignName: string;
  metrics: EmailMetrics;
  revenue: number;
  conversions: number;
  conversionRate: number;
  averageOrderValue: number;
  topPerformingSegments: string[];
  topPerformingProducts: string[];
  timeSeries: {
    date: string;
    sent: number;
    opened: number;
    clicked: number;
    revenue: number;
  }[];
}

export interface UserEmailBehavior {
  userId: string;
  email: string;
  totalEmailsReceived: number;
  totalEmailsOpened: number;
  totalEmailsClicked: number;
  openRate: number;
  clickRate: number;
  lastEmailSent?: Date;
  lastEmailOpened?: Date;
  lastEmailClicked?: Date;
  preferredEmailTime?: string;
  preferredEmailFrequency: "daily" | "weekly" | "monthly";
  emailClient: string;
  deviceType: "mobile" | "desktop" | "tablet";
  segments: string[];
  tags: string[];
}

export interface ABTestResult {
  testId: string;
  testName: string;
  variantId: string;
  variantName: string;
  metrics: EmailMetrics;
  revenue: number;
  conversions: number;
  conversionRate: number;
  statisticalSignificance: number;
  winner: boolean;
}

/**
 * Advanced Email Analytics Engine
 */
export class EmailAnalyticsEngine {
  private readonly CACHE_TTL = 1800; // 30 minutes
  private readonly METRICS_CACHE_TTL = 3600; // 1 hour

  /**
   * Track email event
   */
  async trackEmailEvent(
    event: Omit<EmailEvent, "id" | "timestamp">
  ): Promise<void> {
    try {
      const emailEvent: EmailEvent = {
        ...event,
        id: this.generateEventId(),
        timestamp: new Date(),
      };

      // Store event in database
      await this.storeEmailEvent(emailEvent);

      // Update real-time metrics
      await this.updateRealTimeMetrics(emailEvent);

      // Trigger real-time notifications if needed
      await this.triggerRealTimeNotifications(emailEvent);

      console.log(
        `📊 Email event tracked: ${event.eventType} for ${event.email}`
      );
    } catch (error) {
      console.error("Error tracking email event:", error);
    }
  }

  /**
   * Get email metrics for a specific period
   */
  async getEmailMetrics(
    startDate: Date,
    endDate: Date,
    filters?: {
      campaignId?: string;
      templateId?: string;
      userId?: string;
      segments?: string[];
    }
  ): Promise<EmailMetrics> {
    const cacheKey = `email-metrics:${startDate.toISOString()}:${endDate.toISOString()}:${JSON.stringify(filters)}`;

    // Check cache first
    const cached = await cache.get<EmailMetrics>(cacheKey);
    if (cached) return cached;

    try {
      // Get events from database
      const events = await this.getEmailEvents(startDate, endDate, filters);

      // Calculate metrics
      const metrics = this.calculateMetrics(events);

      // Cache the results
      await cache.set(cacheKey, metrics, this.METRICS_CACHE_TTL);

      return metrics;
    } catch (error) {
      console.error("Error getting email metrics:", error);
      return this.getDefaultMetrics();
    }
  }

  /**
   * Get campaign performance
   */
  async getCampaignPerformance(
    campaignId: string
  ): Promise<CampaignPerformance | null> {
    const cacheKey = `campaign-performance:${campaignId}`;

    // Check cache first
    const cached = await cache.get<CampaignPerformance>(cacheKey);
    if (cached) return cached;

    try {
      // Get campaign events
      const events = await this.getEmailEvents(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        new Date(),
        { campaignId }
      );

      // Calculate performance metrics
      const performance = await this.calculateCampaignPerformance(
        campaignId,
        events
      );

      // Cache the results
      await cache.set(cacheKey, performance, this.METRICS_CACHE_TTL);

      return performance;
    } catch (error) {
      console.error("Error getting campaign performance:", error);
      return null;
    }
  }

  /**
   * Get user email behavior
   */
  async getUserEmailBehavior(
    userId: string
  ): Promise<UserEmailBehavior | null> {
    const cacheKey = `user-email-behavior:${userId}`;

    // Check cache first
    const cached = await cache.get<UserEmailBehavior>(cacheKey);
    if (cached) return cached;

    try {
      // Get user events
      const events = await this.getEmailEvents(
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        new Date(),
        { userId }
      );

      // Calculate user behavior
      const behavior = this.calculateUserBehavior(userId, events);

      // Cache the results
      await cache.set(cacheKey, behavior, this.CACHE_TTL);

      return behavior;
    } catch (error) {
      console.error("Error getting user email behavior:", error);
      return null;
    }
  }

  /**
   * Get A/B test results
   */
  async getABTestResults(testId: string): Promise<ABTestResult[]> {
    const cacheKey = `ab-test-results:${testId}`;

    // Check cache first
    const cached = await cache.get<ABTestResult[]>(cacheKey);
    if (cached) return cached;

    try {
      // Get test events
      const events = await this.getEmailEvents(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        new Date(),
        { campaignId: testId }
      );

      // Calculate test results
      const results = this.calculateABTestResults(testId, events);

      // Cache the results
      await cache.set(cacheKey, results, this.METRICS_CACHE_TTL);

      return results;
    } catch (error) {
      console.error("Error getting A/B test results:", error);
      return [];
    }
  }

  /**
   * Get email insights and recommendations
   */
  async getEmailInsights(
    startDate: Date,
    endDate: Date
  ): Promise<{
    insights: string[];
    recommendations: string[];
    trends: {
      openRate: number;
      clickRate: number;
      revenue: number;
    };
  }> {
    try {
      const metrics = await this.getEmailMetrics(startDate, endDate);
      const previousMetrics = await this.getEmailMetrics(
        new Date(
          startDate.getTime() - (endDate.getTime() - startDate.getTime())
        ),
        startDate
      );

      const insights: string[] = [];
      const recommendations: string[] = [];

      // Analyze open rate trends
      if (metrics.openRate > previousMetrics.openRate) {
        insights.push("Open rate has improved compared to the previous period");
      } else if (metrics.openRate < previousMetrics.openRate) {
        insights.push(
          "Open rate has decreased compared to the previous period"
        );
        recommendations.push(
          "Consider A/B testing subject lines to improve open rates"
        );
      }

      // Analyze click rate trends
      if (metrics.clickRate > previousMetrics.clickRate) {
        insights.push(
          "Click rate has improved compared to the previous period"
        );
      } else if (metrics.clickRate < previousMetrics.clickRate) {
        insights.push(
          "Click rate has decreased compared to the previous period"
        );
        recommendations.push(
          "Review email content and call-to-action placement"
        );
      }

      // Analyze bounce rate
      if (metrics.bounceRate > 0.05) {
        insights.push("Bounce rate is above industry average");
        recommendations.push("Clean email list and verify email addresses");
      }

      // Analyze unsubscribe rate
      if (metrics.unsubscribeRate > 0.02) {
        insights.push("Unsubscribe rate is above industry average");
        recommendations.push("Review email frequency and content relevance");
      }

      // Performance insights
      if (metrics.openRate > 0.25) {
        insights.push("Open rate is performing well above industry average");
      }

      if (metrics.clickRate > 0.05) {
        insights.push("Click rate is performing well above industry average");
      }

      return {
        insights,
        recommendations,
        trends: {
          openRate: metrics.openRate - previousMetrics.openRate,
          clickRate: metrics.clickRate - previousMetrics.clickRate,
          revenue: 0, // This would be calculated from actual revenue data
        },
      };
    } catch (error) {
      console.error("Error getting email insights:", error);
      return {
        insights: [],
        recommendations: [],
        trends: { openRate: 0, clickRate: 0, revenue: 0 },
      };
    }
  }

  /**
   * Get optimal send time recommendations
   */
  async getOptimalSendTimeRecommendations(userId: string): Promise<{
    bestTime: string;
    bestDay: string;
    confidence: number;
  }> {
    try {
      const behavior = await this.getUserEmailBehavior(userId);
      if (!behavior) {
        return {
          bestTime: "09:00",
          bestDay: "Tuesday",
          confidence: 0.5,
        };
      }

      // Analyze user's email open patterns
      const openEvents = await this.getEmailEvents(
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        new Date(),
        { userId }
      );

      const openedEvents = openEvents.filter(
        event => event.eventType === "opened"
      );

      if (openedEvents.length === 0) {
        return {
          bestTime: "09:00",
          bestDay: "Tuesday",
          confidence: 0.3,
        };
      }

      // Analyze time patterns
      const timeCounts = new Map<number, number>();
      const dayCounts = new Map<number, number>();

      openedEvents.forEach(event => {
        const hour = event.timestamp.getHours();
        const day = event.timestamp.getDay();

        timeCounts.set(hour, (timeCounts.get(hour) || 0) + 1);
        dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
      });

      // Find best time
      let bestHour = 9;
      let maxCount = 0;
      timeCounts.forEach((count, hour) => {
        if (count > maxCount) {
          maxCount = count;
          bestHour = hour;
        }
      });

      // Find best day
      let bestDay = 2; // Tuesday
      maxCount = 0;
      dayCounts.forEach((count, day) => {
        if (count > maxCount) {
          maxCount = count;
          bestDay = day;
        }
      });

      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

      return {
        bestTime: `${bestHour.toString().padStart(2, "0")}:00`,
        bestDay: dayNames[bestDay],
        confidence: Math.min(openedEvents.length / 10, 0.9), // Confidence based on data volume
      };
    } catch (error) {
      console.error("Error getting optimal send time:", error);
      return {
        bestTime: "09:00",
        bestDay: "Tuesday",
        confidence: 0.5,
      };
    }
  }

  // Private helper methods

  private generateEventId(): string {
    return `email-event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async storeEmailEvent(event: EmailEvent): Promise<void> {
    // This would store the event in the database
    // For now, we'll simulate storage
    console.log("Storing email event:", event.id);
  }

  private async updateRealTimeMetrics(event: EmailEvent): Promise<void> {
    // Update real-time metrics cache
    const cacheKey = `realtime-metrics:${event.campaignId || "general"}`;

    const currentMetrics =
      (await cache.get<EmailMetrics>(cacheKey)) || this.getDefaultMetrics();

    // Update metrics based on event type
    switch (event.eventType) {
      case "sent":
        currentMetrics.sent++;
        break;
      case "delivered":
        currentMetrics.delivered++;
        break;
      case "opened":
        currentMetrics.opened++;
        break;
      case "clicked":
        currentMetrics.clicked++;
        break;
      case "bounced":
        currentMetrics.bounced++;
        break;
      case "unsubscribed":
        currentMetrics.unsubscribed++;
        break;
      case "spam_reported":
        currentMetrics.spamReported++;
        break;
    }

    // Recalculate rates
    currentMetrics.openRate =
      currentMetrics.sent > 0 ? currentMetrics.opened / currentMetrics.sent : 0;
    currentMetrics.clickRate =
      currentMetrics.sent > 0
        ? currentMetrics.clicked / currentMetrics.sent
        : 0;
    currentMetrics.clickToOpenRate =
      currentMetrics.opened > 0
        ? currentMetrics.clicked / currentMetrics.opened
        : 0;
    currentMetrics.bounceRate =
      currentMetrics.sent > 0
        ? currentMetrics.bounced / currentMetrics.sent
        : 0;
    currentMetrics.unsubscribeRate =
      currentMetrics.sent > 0
        ? currentMetrics.unsubscribed / currentMetrics.sent
        : 0;

    await cache.set(cacheKey, currentMetrics, 300); // 5 minutes
  }

  private async triggerRealTimeNotifications(event: EmailEvent): Promise<void> {
    // Trigger real-time notifications for important events
    if (event.eventType === "bounced" || event.eventType === "spam_reported") {
      console.log(`🚨 Alert: ${event.eventType} for ${event.email}`);
    }
  }

  private async getEmailEvents(
    startDate: Date,
    endDate: Date,
    filters?: {
      campaignId?: string;
      templateId?: string;
      userId?: string;
      segments?: string[];
    }
  ): Promise<EmailEvent[]> {
    // This would query the database for email events
    // For now, return mock data
    return [];
  }

  private calculateMetrics(events: EmailEvent[]): EmailMetrics {
    const metrics = this.getDefaultMetrics();

    events.forEach(event => {
      switch (event.eventType) {
        case "sent":
          metrics.sent++;
          break;
        case "delivered":
          metrics.delivered++;
          break;
        case "opened":
          metrics.opened++;
          break;
        case "clicked":
          metrics.clicked++;
          break;
        case "bounced":
          metrics.bounced++;
          break;
        case "unsubscribed":
          metrics.unsubscribed++;
          break;
        case "spam_reported":
          metrics.spamReported++;
          break;
      }
    });

    // Calculate rates
    metrics.openRate = metrics.sent > 0 ? metrics.opened / metrics.sent : 0;
    metrics.clickRate = metrics.sent > 0 ? metrics.clicked / metrics.sent : 0;
    metrics.clickToOpenRate =
      metrics.opened > 0 ? metrics.clicked / metrics.opened : 0;
    metrics.bounceRate = metrics.sent > 0 ? metrics.bounced / metrics.sent : 0;
    metrics.unsubscribeRate =
      metrics.sent > 0 ? metrics.unsubscribed / metrics.sent : 0;

    return metrics;
  }

  private async calculateCampaignPerformance(
    campaignId: string,
    events: EmailEvent[]
  ): Promise<CampaignPerformance> {
    const metrics = this.calculateMetrics(events);

    return {
      campaignId,
      campaignName: `Campaign ${campaignId}`,
      metrics,
      revenue: 0, // This would be calculated from actual revenue data
      conversions: 0, // This would be calculated from actual conversion data
      conversionRate: 0,
      averageOrderValue: 0,
      topPerformingSegments: [],
      topPerformingProducts: [],
      timeSeries: [],
    };
  }

  private calculateUserBehavior(
    userId: string,
    events: EmailEvent[]
  ): UserEmailBehavior {
    const receivedEvents = events.filter(event => event.eventType === "sent");
    const openedEvents = events.filter(event => event.eventType === "opened");
    const clickedEvents = events.filter(event => event.eventType === "clicked");

    const lastSent =
      receivedEvents.length > 0
        ? receivedEvents[receivedEvents.length - 1].timestamp
        : undefined;
    const lastOpened =
      openedEvents.length > 0
        ? openedEvents[openedEvents.length - 1].timestamp
        : undefined;
    const lastClicked =
      clickedEvents.length > 0
        ? clickedEvents[clickedEvents.length - 1].timestamp
        : undefined;

    return {
      userId,
      email: events[0]?.email || "",
      totalEmailsReceived: receivedEvents.length,
      totalEmailsOpened: openedEvents.length,
      totalEmailsClicked: clickedEvents.length,
      openRate:
        receivedEvents.length > 0
          ? openedEvents.length / receivedEvents.length
          : 0,
      clickRate:
        receivedEvents.length > 0
          ? clickedEvents.length / receivedEvents.length
          : 0,
      lastEmailSent: lastSent,
      lastEmailOpened: lastOpened,
      lastEmailClicked: lastClicked,
      preferredEmailTime: "09:00",
      preferredEmailFrequency: "weekly",
      emailClient: "Unknown",
      deviceType: "desktop",
      segments: [],
      tags: [],
    };
  }

  private calculateABTestResults(
    testId: string,
    events: EmailEvent[]
  ): ABTestResult[] {
    // This would calculate A/B test results with statistical significance
    // For now, return mock data
    return [];
  }

  private getDefaultMetrics(): EmailMetrics {
    return {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0,
      spamReported: 0,
      openRate: 0,
      clickRate: 0,
      clickToOpenRate: 0,
      bounceRate: 0,
      unsubscribeRate: 0,
    };
  }
}

// Export singleton instance
export const emailAnalyticsEngine = new EmailAnalyticsEngine();
