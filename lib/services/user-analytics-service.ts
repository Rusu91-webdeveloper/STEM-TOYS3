import { PrismaClient } from "@prisma/client";
import { UserSegmentationResult } from "./segmentation-service";

export interface UserActivityEvent {
  userId: string;
  eventType: string;
  eventData: Record<string, any>;
  sessionId?: string;
  pageUrl?: string;
  userAgent?: string;
  ipAddress?: string;
  timestamp?: Date;
}

export interface UserBehaviorMetrics {
  userId: string;
  totalPageViews: number;
  totalTimeSpent: number;
  avgSessionDuration: number;
  lastActivityAt: Date;
  purchaseFrequency: number;
  avgOrderValue: number;
  lifetimeValue: number;
  referralCount: number;
  socialEngagementScore: number;
  recommendationClicks: number;
  wishlistSize: number;
}

export class UserAnalyticsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Track user activity event
   */
  async trackActivity(event: UserActivityEvent): Promise<void> {
    const {
      userId,
      eventType,
      eventData,
      sessionId,
      pageUrl,
      userAgent,
      ipAddress,
      timestamp = new Date(),
    } = event;

    // Store in a generic analytics table (you might want to create a dedicated UserActivity table)
    // For now, we'll update user metrics directly

    await this.updateUserMetrics(userId, eventType, eventData, timestamp);
  }

  /**
   * Update user metrics based on activity
   */
  private async updateUserMetrics(
    userId: string,
    eventType: string,
    eventData: Record<string, any>,
    timestamp: Date
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalPageViews: true,
        totalTimeSpent: true,
        avgSessionDuration: true,
        lastActivityAt: true,
        recommendationClicks: true,
        wishlistSize: true,
      },
    });

    if (!user) return;

    const updateData: any = {
      lastActivityAt: timestamp,
    };

    switch (eventType) {
      case "page_view":
        updateData.totalPageViews = (user.totalPageViews || 0) + 1;
        break;

      case "session_end":
        const sessionDuration = eventData.duration || 0;
        const currentAvg = user.avgSessionDuration || 0;
        const totalSessions = Math.floor((user.totalPageViews || 0) / 10) + 1; // Rough estimate
        updateData.avgSessionDuration =
          (currentAvg * (totalSessions - 1) + sessionDuration) / totalSessions;
        updateData.totalTimeSpent =
          (user.totalTimeSpent || 0) + sessionDuration;
        break;

      case "recommendation_click":
        updateData.recommendationClicks = (user.recommendationClicks || 0) + 1;
        break;

      case "wishlist_add":
        updateData.wishlistSize = (user.wishlistSize || 0) + 1;
        break;

      case "wishlist_remove":
        updateData.wishlistSize = Math.max((user.wishlistSize || 0) - 1, 0);
        break;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  /**
   * Calculate and update purchase-related metrics
   */
  async updatePurchaseMetrics(userId: string): Promise<void> {
    const orders = await this.prisma.order.findMany({
      where: {
        userId,
        status: "COMPLETED",
      },
      select: {
        total: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (orders.length === 0) return;

    const totalValue = orders.reduce((sum, order) => sum + order.total, 0);
    const avgOrderValue = totalValue / orders.length;

    // Calculate purchase frequency (orders per month)
    const firstOrder = orders[0].createdAt;
    const lastOrder = orders[orders.length - 1].createdAt;
    const monthsDiff = Math.max(
      1,
      (lastOrder.getTime() - firstOrder.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    const purchaseFrequency = orders.length / monthsDiff;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lifetimeValue: totalValue,
        avgOrderValue,
        purchaseFrequency,
      },
    });
  }

  /**
   * Calculate and update social engagement score
   */
  async updateSocialEngagementScore(userId: string): Promise<void> {
    // This would integrate with social media analytics
    // For now, we'll use referral count as a proxy
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCount: true },
    });

    if (!user) return;

    // Simple scoring based on referrals (you can expand this)
    const engagementScore = Math.min((user.referralCount || 0) * 10, 100);

    await this.prisma.user.update({
      where: { id: userId },
      data: { socialEngagementScore: engagementScore },
    });
  }

  /**
   * Log segmentation change for analytics
   */
  async logSegmentationChange(
    userId: string,
    result: UserSegmentationResult
  ): Promise<void> {
    // You could create a dedicated SegmentationHistory table
    // For now, we'll just log to console or you could use a logging service
    console.log(`User ${userId} segmentation updated:`, {
      segment: result.segment,
      lifecycleStage: result.lifecycleStage,
      confidence: result.confidence,
      appliedRules: result.appliedRules,
      timestamp: result.lastUpdated,
    });
  }

  /**
   * Get comprehensive user behavior metrics
   */
  async getUserBehaviorMetrics(
    userId: string
  ): Promise<UserBehaviorMetrics | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalPageViews: true,
        totalTimeSpent: true,
        avgSessionDuration: true,
        lastActivityAt: true,
        purchaseFrequency: true,
        avgOrderValue: true,
        lifetimeValue: true,
        referralCount: true,
        socialEngagementScore: true,
        recommendationClicks: true,
        wishlistSize: true,
      },
    });

    if (!user) return null;

    return {
      userId,
      totalPageViews: user.totalPageViews || 0,
      totalTimeSpent: user.totalTimeSpent || 0,
      avgSessionDuration: user.avgSessionDuration || 0,
      lastActivityAt: user.lastActivityAt || new Date(),
      purchaseFrequency: user.purchaseFrequency || 0,
      avgOrderValue: user.avgOrderValue || 0,
      lifetimeValue: user.lifetimeValue || 0,
      referralCount: user.referralCount || 0,
      socialEngagementScore: user.socialEngagementScore || 0,
      recommendationClicks: user.recommendationClicks || 0,
      wishlistSize: user.wishlistSize || 0,
    };
  }

  /**
   * Get behavioral analytics for dashboard
   */
  async getBehavioralAnalytics(
    tenantId?: string,
    dateRange?: { start: Date; end: Date }
  ) {
    const whereClause: any = {};
    if (tenantId) whereClause.tenantId = tenantId;
    if (dateRange) {
      whereClause.createdAt = {
        gte: dateRange.start,
        lte: dateRange.end,
      };
    }

    const [userEngagement, purchasePatterns, activityTrends, topSegments] =
      await Promise.all([
        // User engagement metrics
        this.prisma.user.aggregate({
          where: whereClause,
          _avg: {
            totalPageViews: true,
            totalTimeSpent: true,
            avgSessionDuration: true,
            lifetimeValue: true,
          },
          _count: { id: true },
        }),

        // Purchase pattern analysis
        this.prisma.user.aggregate({
          where: whereClause,
          _avg: {
            purchaseFrequency: true,
            avgOrderValue: true,
          },
        }),

        // Activity trends (last 30 days)
        this.prisma.user.findMany({
          where: {
            ...whereClause,
            lastActivityAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          select: {
            lastActivityAt: true,
            segment: true,
          },
        }),

        // Top performing segments
        this.prisma.user.groupBy({
          by: ["segment"],
          where: whereClause,
          _avg: {
            lifetimeValue: true,
            avgOrderValue: true,
          },
          _count: { id: true },
          orderBy: {
            _avg: {
              lifetimeValue: "desc",
            },
          },
        }),
      ]);

    return {
      userEngagement,
      purchasePatterns,
      activityTrends,
      topSegments,
    };
  }

  /**
   * Identify users at risk of churning
   */
  async getAtRiskUsers(
    threshold: number = 70,
    tenantId?: string
  ): Promise<string[]> {
    const atRiskUsers = await this.prisma.user.findMany({
      where: {
        churnRiskScore: {
          gte: threshold,
        },
        ...(tenantId && { tenantId }),
      },
      select: { id: true },
    });

    return atRiskUsers.map(user => user.id);
  }

  /**
   * Calculate churn prediction score for all users
   */
  async calculateChurnRiskForAllUsers(batchSize: number = 100): Promise<void> {
    let processed = 0;
    let hasMore = true;

    while (hasMore) {
      const users = await this.prisma.user.findMany({
        select: { id: true },
        take: batchSize,
        skip: processed,
      });

      if (users.length === 0) {
        hasMore = false;
        break;
      }

      // Calculate churn risk for this batch
      const updates = users.map(async user => {
        // This would call the segmentation service's calculateChurnRisk method
        // For now, we'll use a simple calculation
        const riskScore = await this.calculateSimpleChurnRisk(user.id);
        return this.prisma.user.update({
          where: { id: user.id },
          data: { churnRiskScore: riskScore },
        });
      });

      await Promise.all(updates);
      processed += users.length;
      console.log(`Calculated churn risk for ${processed} users`);
    }
  }

  /**
   * Simple churn risk calculation (placeholder for more sophisticated ML model)
   */
  private async calculateSimpleChurnRisk(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        orders: {
          select: { createdAt: true },
          where: {
            status: "COMPLETED",
            createdAt: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
            },
          },
        },
      },
    });

    if (!user) return 0;

    let riskScore = 0;

    // No recent orders
    if (user.orders.length === 0) riskScore += 50;

    // Low activity
    if ((user.totalPageViews || 0) < 5) riskScore += 20;
    if ((user.totalTimeSpent || 0) < 600) riskScore += 15; // Less than 10 minutes

    // Low engagement
    if ((user.recommendationClicks || 0) === 0) riskScore += 10;
    if ((user.wishlistSize || 0) === 0) riskScore += 5;

    return Math.min(riskScore, 100);
  }
}
