/**
 * Advanced Email Performance Optimization Engine
 * Provides caching, delivery optimization, and performance monitoring
 * for enterprise-grade email performance
 */

import { cache } from "@/lib/cache";
import { emailAnalyticsEngine } from "./analytics-engine";

export interface EmailPerformanceMetrics {
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  spamRate: number;
  unsubscribeRate: number;
  averageDeliveryTime: number;
  averageOpenTime: number;
  averageClickTime: number;
}

export interface DeliveryOptimization {
  optimalSendTime: string;
  optimalSendDay: string;
  timezone: string;
  frequency: number; // emails per week
  batchSize: number;
  retryAttempts: number;
  retryDelay: number; // in minutes
}

export interface CacheStrategy {
  templateCache: boolean;
  userDataCache: boolean;
  analyticsCache: boolean;
  cacheTTL: number; // in seconds
  cacheKey: string;
}

export interface PerformanceConfig {
  maxConcurrentEmails: number;
  rateLimitPerMinute: number;
  rateLimitPerHour: number;
  batchProcessing: boolean;
  batchSize: number;
  batchDelay: number; // in milliseconds
  retryStrategy: "immediate" | "exponential" | "linear";
  maxRetries: number;
  timeout: number; // in milliseconds
}

/**
 * Advanced Email Performance Optimization Engine
 */
export class EmailPerformanceEngine {
  private readonly DEFAULT_CACHE_TTL = 3600; // 1 hour
  private readonly TEMPLATE_CACHE_TTL = 7200; // 2 hours
  private readonly USER_DATA_CACHE_TTL = 1800; // 30 minutes
  private readonly ANALYTICS_CACHE_TTL = 900; // 15 minutes

  private performanceConfig: PerformanceConfig = {
    maxConcurrentEmails: 100,
    rateLimitPerMinute: 60,
    rateLimitPerHour: 1000,
    batchProcessing: true,
    batchSize: 50,
    batchDelay: 1000,
    retryStrategy: "exponential",
    maxRetries: 3,
    timeout: 30000,
  };

  private emailQueue: Array<{
    id: string;
    userId: string;
    email: string;
    subject: string;
    content: string;
    priority: number;
    retryCount: number;
    scheduledAt: Date;
  }> = [];

  private isProcessing = false;

  /**
   * Optimize email delivery based on user behavior
   */
  async optimizeDelivery(
    userId: string,
    email: string,
    subject: string,
    content: string
  ): Promise<DeliveryOptimization> {
    try {
      // Get user behavior data
      const userBehavior = await this.getUserEmailBehavior(userId);

      // Get optimal send time
      const optimalSendTime = await this.getOptimalSendTime(
        userId,
        userBehavior
      );

      // Get optimal send day
      const optimalSendDay = await this.getOptimalSendDay(userId, userBehavior);

      // Get user timezone
      const timezone = await this.getUserTimezone(userId);

      // Calculate optimal frequency
      const frequency = await this.calculateOptimalFrequency(
        userId,
        userBehavior
      );

      // Get batch size based on user segment
      const batchSize = await this.getOptimalBatchSize(userId);

      // Get retry configuration
      const retryAttempts = await this.getRetryAttempts(userId);
      const retryDelay = await this.getRetryDelay(userId);

      return {
        optimalSendTime,
        optimalSendDay,
        timezone,
        frequency,
        batchSize,
        retryAttempts,
        retryDelay,
      };
    } catch (error) {
      console.error("Error optimizing delivery:", error);
      return this.getDefaultDeliveryOptimization();
    }
  }

  /**
   * Queue email for optimized delivery
   */
  async queueEmail(
    userId: string,
    email: string,
    subject: string,
    content: string,
    priority: number = 1
  ): Promise<string> {
    try {
      const emailId = this.generateEmailId();
      const optimization = await this.optimizeDelivery(
        userId,
        email,
        subject,
        content
      );

      // Calculate scheduled time
      const scheduledAt = this.calculateScheduledTime(optimization);

      // Add to queue
      this.emailQueue.push({
        id: emailId,
        userId,
        email,
        subject,
        content,
        priority,
        retryCount: 0,
        scheduledAt,
      });

      // Sort queue by priority and scheduled time
      this.sortEmailQueue();

      // Start processing if not already running
      if (!this.isProcessing) {
        this.processEmailQueue();
      }

      return emailId;
    } catch (error) {
      console.error("Error queuing email:", error);
      throw error;
    }
  }

  /**
   * Get email performance metrics
   */
  async getPerformanceMetrics(
    userId?: string,
    timeRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
    }
  ): Promise<EmailPerformanceMetrics> {
    try {
      const cacheKey = `performance-metrics-${userId || "global"}-${timeRange.start.getTime()}-${timeRange.end.getTime()}`;

      // Check cache first
      const cached = await cache.get<EmailPerformanceMetrics>(cacheKey);
      if (cached) return cached;

      // Get analytics data
      const analytics = await emailAnalyticsEngine.getEmailMetrics(
        userId,
        timeRange
      );

      // Calculate performance metrics
      const metrics: EmailPerformanceMetrics = {
        deliveryRate: this.calculateDeliveryRate(analytics),
        openRate: this.calculateOpenRate(analytics),
        clickRate: this.calculateClickRate(analytics),
        bounceRate: this.calculateBounceRate(analytics),
        spamRate: this.calculateSpamRate(analytics),
        unsubscribeRate: this.calculateUnsubscribeRate(analytics),
        averageDeliveryTime: this.calculateAverageDeliveryTime(analytics),
        averageOpenTime: this.calculateAverageOpenTime(analytics),
        averageClickTime: this.calculateAverageClickTime(analytics),
      };

      // Cache the metrics
      await cache.set(cacheKey, metrics, this.ANALYTICS_CACHE_TTL);

      return metrics;
    } catch (error) {
      console.error("Error getting performance metrics:", error);
      return this.getDefaultPerformanceMetrics();
    }
  }

  /**
   * Optimize email content for better performance
   */
  async optimizeEmailContent(content: string): Promise<string> {
    try {
      // Remove unnecessary whitespace
      let optimized = content.replace(/\s+/g, " ").trim();

      // Optimize images
      optimized = this.optimizeImages(optimized);

      // Optimize CSS
      optimized = this.optimizeCSS(optimized);

      // Add tracking pixel
      optimized = this.addTrackingPixel(optimized);

      // Add unsubscribe link
      optimized = this.addUnsubscribeLink(optimized);

      return optimized;
    } catch (error) {
      console.error("Error optimizing email content:", error);
      return content;
    }
  }

  /**
   * Get cache strategy for email components
   */
  async getCacheStrategy(component: string): Promise<CacheStrategy> {
    const strategies: Record<string, CacheStrategy> = {
      template: {
        templateCache: true,
        userDataCache: false,
        analyticsCache: false,
        cacheTTL: this.TEMPLATE_CACHE_TTL,
        cacheKey: `email-template-${component}`,
      },
      userData: {
        templateCache: false,
        userDataCache: true,
        analyticsCache: false,
        cacheTTL: this.USER_DATA_CACHE_TTL,
        cacheKey: `user-data-${component}`,
      },
      analytics: {
        templateCache: false,
        userDataCache: false,
        analyticsCache: true,
        cacheTTL: this.ANALYTICS_CACHE_TTL,
        cacheKey: `analytics-${component}`,
      },
    };

    return strategies[component] || strategies.template;
  }

  /**
   * Update performance configuration
   */
  updatePerformanceConfig(config: Partial<PerformanceConfig>): void {
    this.performanceConfig = { ...this.performanceConfig, ...config };
  }

  /**
   * Get current performance configuration
   */
  getPerformanceConfig(): PerformanceConfig {
    return { ...this.performanceConfig };
  }

  // Private helper methods

  private async getUserEmailBehavior(userId: string): Promise<any> {
    try {
      const cacheKey = `user-email-behavior-${userId}`;

      // Check cache first
      const cached = await cache.get(cacheKey);
      if (cached) return cached;

      // Get user behavior from analytics engine
      const behavior = await emailAnalyticsEngine.getUserEmailBehavior(userId);

      // Cache the behavior
      await cache.set(cacheKey, behavior, this.USER_DATA_CACHE_TTL);

      return behavior;
    } catch (error) {
      console.error("Error getting user email behavior:", error);
      return {};
    }
  }

  private async getOptimalSendTime(
    userId: string,
    behavior: any
  ): Promise<string> {
    try {
      // Analyze user open times
      const openTimes = behavior.openTimes || [];
      if (openTimes.length === 0) return "09:00";

      // Group by hour and find most common
      const hourCounts: Record<number, number> = {};
      openTimes.forEach((time: string) => {
        const hour = new Date(time).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      const optimalHour = Object.entries(hourCounts).sort(
        ([, a], [, b]) => b - a
      )[0][0];

      return `${optimalHour.padStart(2, "0")}:00`;
    } catch (error) {
      console.error("Error getting optimal send time:", error);
      return "09:00";
    }
  }

  private async getOptimalSendDay(
    userId: string,
    behavior: any
  ): Promise<string> {
    try {
      // Analyze user open days
      const openDays = behavior.openDays || [];
      if (openDays.length === 0) return "monday";

      // Group by day and find most common
      const dayCounts: Record<string, number> = {};
      openDays.forEach((day: string) => {
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      });

      const optimalDay = Object.entries(dayCounts).sort(
        ([, a], [, b]) => b - a
      )[0][0];

      return optimalDay;
    } catch (error) {
      console.error("Error getting optimal send day:", error);
      return "monday";
    }
  }

  private async getUserTimezone(userId: string): Promise<string> {
    try {
      // This would get user timezone from user profile
      // For now, return default
      return "Europe/Bucharest";
    } catch (error) {
      console.error("Error getting user timezone:", error);
      return "Europe/Bucharest";
    }
  }

  private async calculateOptimalFrequency(
    userId: string,
    behavior: any
  ): Promise<number> {
    try {
      // Analyze user engagement patterns
      const engagementRate = behavior.engagementRate || 0;
      const unsubscribeRate = behavior.unsubscribeRate || 0;

      // Calculate optimal frequency based on engagement
      if (engagementRate > 0.8 && unsubscribeRate < 0.02) {
        return 3; // High engagement, can send more
      } else if (engagementRate > 0.5 && unsubscribeRate < 0.05) {
        return 2; // Medium engagement
      } else {
        return 1; // Low engagement, send less
      }
    } catch (error) {
      console.error("Error calculating optimal frequency:", error);
      return 1;
    }
  }

  private async getOptimalBatchSize(userId: string): Promise<number> {
    try {
      // This would be based on user segment and system capacity
      return this.performanceConfig.batchSize;
    } catch (error) {
      console.error("Error getting optimal batch size:", error);
      return 50;
    }
  }

  private async getRetryAttempts(userId: string): Promise<number> {
    try {
      // This would be based on user importance and email type
      return this.performanceConfig.maxRetries;
    } catch (error) {
      console.error("Error getting retry attempts:", error);
      return 3;
    }
  }

  private async getRetryDelay(userId: string): Promise<number> {
    try {
      // This would be based on retry strategy
      return this.performanceConfig.retryStrategy === "exponential" ? 5 : 2;
    } catch (error) {
      console.error("Error getting retry delay:", error);
      return 5;
    }
  }

  private calculateScheduledTime(optimization: DeliveryOptimization): Date {
    try {
      const now = new Date();
      const [hour, minute] = optimization.optimalSendTime
        .split(":")
        .map(Number);

      // Set to optimal time today
      const scheduled = new Date(now);
      scheduled.setHours(hour, minute, 0, 0);

      // If optimal time has passed today, schedule for tomorrow
      if (scheduled <= now) {
        scheduled.setDate(scheduled.getDate() + 1);
      }

      return scheduled;
    } catch (error) {
      console.error("Error calculating scheduled time:", error);
      return new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    }
  }

  private sortEmailQueue(): void {
    this.emailQueue.sort((a, b) => {
      // Sort by priority first (higher priority first)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }

      // Then by scheduled time (earlier first)
      return a.scheduledAt.getTime() - b.scheduledAt.getTime();
    });
  }

  private async processEmailQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      while (this.emailQueue.length > 0) {
        const batch = this.emailQueue.splice(
          0,
          this.performanceConfig.batchSize
        );

        // Process batch
        await this.processEmailBatch(batch);

        // Wait before processing next batch
        if (this.emailQueue.length > 0) {
          await this.delay(this.performanceConfig.batchDelay);
        }
      }
    } catch (error) {
      console.error("Error processing email queue:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processEmailBatch(batch: any[]): Promise<void> {
    try {
      const promises = batch.map(email => this.sendEmailWithRetry(email));
      await Promise.allSettled(promises);
    } catch (error) {
      console.error("Error processing email batch:", error);
    }
  }

  private async sendEmailWithRetry(email: any): Promise<void> {
    try {
      // Attempt to send email
      await this.sendEmail(email);

      // Track successful send
      await emailAnalyticsEngine.trackEmailEvent({
        emailId: email.id,
        userId: email.userId,
        email: email.email,
        eventType: "sent",
        metadata: {
          subject: email.subject,
          retryCount: email.retryCount,
        },
      });
    } catch (error) {
      console.error(`Error sending email ${email.id}:`, error);

      // Retry logic
      if (email.retryCount < this.performanceConfig.maxRetries) {
        email.retryCount++;
        email.scheduledAt = new Date(
          Date.now() + this.calculateRetryDelay(email.retryCount)
        );

        // Add back to queue
        this.emailQueue.push(email);
        this.sortEmailQueue();
      } else {
        // Max retries reached, track as failed
        await emailAnalyticsEngine.trackEmailEvent({
          emailId: email.id,
          userId: email.userId,
          email: email.email,
          eventType: "failed",
          metadata: {
            subject: email.subject,
            retryCount: email.retryCount,
            error: error.message,
          },
        });
      }
    }
  }

  private calculateRetryDelay(retryCount: number): number {
    switch (this.performanceConfig.retryStrategy) {
      case "exponential":
        return Math.pow(2, retryCount) * 60 * 1000; // Exponential backoff
      case "linear":
        return retryCount * 5 * 60 * 1000; // Linear backoff
      default:
        return 5 * 60 * 1000; // Fixed delay
    }
  }

  private async sendEmail(email: any): Promise<void> {
    // This would actually send the email
    // For now, just simulate sending
    await this.delay(100);
    console.log(`Sending email ${email.id} to ${email.email}`);
  }

  private optimizeImages(content: string): string {
    // Add loading="lazy" to images
    return content.replace(
      /<img([^>]*)>/gi,
      '<img$1 loading="lazy" style="max-width: 100%; height: auto;">'
    );
  }

  private optimizeCSS(content: string): string {
    // Inline critical CSS
    // Remove unused CSS
    // Optimize selectors
    return content;
  }

  private addTrackingPixel(content: string): string {
    const trackingPixel =
      '<img src="https://techtots.com/api/email/track" width="1" height="1" style="display:none;" alt="" />';
    return content.replace("</body>", `${trackingPixel}</body>`);
  }

  private addUnsubscribeLink(content: string): string {
    const unsubscribeLink =
      '<p style="font-size: 12px; color: #666; text-align: center; margin-top: 20px;"><a href="https://techtots.com/unsubscribe" style="color: #666;">Unsubscribe</a></p>';
    return content.replace("</body>", `${unsubscribeLink}</body>`);
  }

  private calculateDeliveryRate(analytics: any): number {
    const sent = analytics.sent || 0;
    const delivered = analytics.delivered || 0;
    return sent > 0 ? (delivered / sent) * 100 : 0;
  }

  private calculateOpenRate(analytics: any): number {
    const delivered = analytics.delivered || 0;
    const opened = analytics.opened || 0;
    return delivered > 0 ? (opened / delivered) * 100 : 0;
  }

  private calculateClickRate(analytics: any): number {
    const opened = analytics.opened || 0;
    const clicked = analytics.clicked || 0;
    return opened > 0 ? (clicked / opened) * 100 : 0;
  }

  private calculateBounceRate(analytics: any): number {
    const sent = analytics.sent || 0;
    const bounced = analytics.bounced || 0;
    return sent > 0 ? (bounced / sent) * 100 : 0;
  }

  private calculateSpamRate(analytics: any): number {
    const sent = analytics.sent || 0;
    const spamReported = analytics.spamReported || 0;
    return sent > 0 ? (spamReported / sent) * 100 : 0;
  }

  private calculateUnsubscribeRate(analytics: any): number {
    const sent = analytics.sent || 0;
    const unsubscribed = analytics.unsubscribed || 0;
    return sent > 0 ? (unsubscribed / sent) * 100 : 0;
  }

  private calculateAverageDeliveryTime(analytics: any): number {
    const deliveryTimes = analytics.deliveryTimes || [];
    if (deliveryTimes.length === 0) return 0;

    const total = deliveryTimes.reduce(
      (sum: number, time: number) => sum + time,
      0
    );
    return total / deliveryTimes.length;
  }

  private calculateAverageOpenTime(analytics: any): number {
    const openTimes = analytics.openTimes || [];
    if (openTimes.length === 0) return 0;

    const total = openTimes.reduce(
      (sum: number, time: number) => sum + time,
      0
    );
    return total / openTimes.length;
  }

  private calculateAverageClickTime(analytics: any): number {
    const clickTimes = analytics.clickTimes || [];
    if (clickTimes.length === 0) return 0;

    const total = clickTimes.reduce(
      (sum: number, time: number) => sum + time,
      0
    );
    return total / clickTimes.length;
  }

  private getDefaultDeliveryOptimization(): DeliveryOptimization {
    return {
      optimalSendTime: "09:00",
      optimalSendDay: "monday",
      timezone: "Europe/Bucharest",
      frequency: 1,
      batchSize: 50,
      retryAttempts: 3,
      retryDelay: 5,
    };
  }

  private getDefaultPerformanceMetrics(): EmailPerformanceMetrics {
    return {
      deliveryRate: 0,
      openRate: 0,
      clickRate: 0,
      bounceRate: 0,
      spamRate: 0,
      unsubscribeRate: 0,
      averageDeliveryTime: 0,
      averageOpenTime: 0,
      averageClickTime: 0,
    };
  }

  private generateEmailId(): string {
    return `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const emailPerformanceEngine = new EmailPerformanceEngine();
