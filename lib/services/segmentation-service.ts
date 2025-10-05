import {
  PrismaClient,
  UserSegment,
  LifecycleStage,
  SegmentationRule,
} from "@prisma/client";
import { UserAnalyticsService } from "./user-analytics-service";
import { EmailTriggerService } from "./email-trigger-service";

export interface SegmentationCondition {
  field: string;
  operator:
    | "eq"
    | "neq"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "in"
    | "nin"
    | "contains"
    | "regex";
  value: any;
}

export interface SegmentationRuleData {
  name: string;
  description?: string;
  segment: UserSegment;
  lifecycleStage?: LifecycleStage;
  conditions: SegmentationCondition[];
  priority?: number;
  tags?: string[];
  tenantId?: string;
}

export interface UserSegmentationResult {
  userId: string;
  segment: UserSegment;
  lifecycleStage: LifecycleStage;
  appliedRules: string[];
  confidence: number;
  lastUpdated: Date;
}

export class SegmentationService {
  private prisma: PrismaClient;
  private analyticsService: UserAnalyticsService;
  private emailTriggerService: EmailTriggerService;

  constructor(
    prisma: PrismaClient,
    analyticsService: UserAnalyticsService,
    emailTriggerService?: EmailTriggerService
  ) {
    this.prisma = prisma;
    this.analyticsService = analyticsService;
    this.emailTriggerService =
      emailTriggerService || new EmailTriggerService(prisma);
  }

  /**
   * Evaluate all active segmentation rules for a user
   */
  async evaluateUserSegmentation(
    userId: string
  ): Promise<UserSegmentationResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        orders: {
          select: {
            total: true,
            createdAt: true,
            status: true,
          },
          where: {
            status: "COMPLETED",
          },
        },
        wishlistItems: {
          select: { id: true },
        },
        reviews: {
          select: { rating: true },
        },
      },
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    // Get active segmentation rules
    const rules = await this.prisma.segmentationRule.findMany({
      where: { isActive: true },
      orderBy: { priority: "desc" },
    });

    // Evaluate rules and find the best match
    const appliedRules: string[] = [];
    let bestSegment: UserSegment = UserSegment.NEW;
    let bestLifecycleStage: LifecycleStage = LifecycleStage.AWARENESS;
    let maxConfidence = 0;

    for (const rule of rules) {
      const confidence = this.evaluateRule(user, rule);
      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        bestSegment = rule.segment;
        bestLifecycleStage = rule.lifecycleStage || LifecycleStage.AWARENESS;
        appliedRules.push(rule.id);
      }
    }

    return {
      userId,
      segment: bestSegment,
      lifecycleStage: bestLifecycleStage,
      appliedRules,
      confidence: maxConfidence,
      lastUpdated: new Date(),
    };
  }

  /**
   * Evaluate a single segmentation rule against a user
   */
  private evaluateRule(user: any, rule: SegmentationRule): number {
    try {
      const conditions = rule.conditions as unknown as SegmentationCondition[];
      let totalConditions = conditions.length;
      let matchedConditions = 0;

      for (const condition of conditions) {
        if (this.evaluateCondition(user, condition)) {
          matchedConditions++;
        }
      }

      return totalConditions > 0 ? matchedConditions / totalConditions : 0;
    } catch (error) {
      console.error(`Error evaluating rule ${rule.id}:`, error);
      return 0;
    }
  }

  /**
   * Evaluate a single condition against user data
   */
  private evaluateCondition(
    user: any,
    condition: SegmentationCondition
  ): boolean {
    const { field, operator, value } = condition;
    const fieldValue = this.getNestedValue(user, field);

    switch (operator) {
      case "eq":
        return fieldValue === value;
      case "neq":
        return fieldValue !== value;
      case "gt":
        return fieldValue > value;
      case "gte":
        return fieldValue >= value;
      case "lt":
        return fieldValue < value;
      case "lte":
        return fieldValue <= value;
      case "in":
        return Array.isArray(value) && value.includes(fieldValue);
      case "nin":
        return Array.isArray(value) && !value.includes(fieldValue);
      case "contains":
        return Array.isArray(fieldValue) && fieldValue.includes(value);
      case "regex":
        return new RegExp(value).test(String(fieldValue));
      default:
        return false;
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  /**
   * Update user segmentation based on evaluation result
   */
  async updateUserSegmentation(
    userId: string
  ): Promise<UserSegmentationResult> {
    // Get current user data to detect changes
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { segment: true, lifecycleStage: true },
    });

    const result = await this.evaluateUserSegmentation(userId);

    // Check if segment or lifecycle changed
    const segmentChanged = currentUser?.segment !== result.segment;
    const lifecycleChanged =
      currentUser?.lifecycleStage !== result.lifecycleStage;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        segment: result.segment,
        lifecycleStage: result.lifecycleStage,
        segmentUpdatedAt: result.lastUpdated,
      },
    });

    // Log segmentation change for analytics
    await this.analyticsService.logSegmentationChange(userId, result);

    // Trigger email campaigns if segment changed
    if (segmentChanged) {
      try {
        await this.emailTriggerService.processSegmentTriggers(
          userId,
          result.segment,
          currentUser?.segment
        );
      } catch (error) {
        console.error(
          `Error processing segment triggers for user ${userId}:`,
          error
        );
        // Don't fail the segmentation update if email triggers fail
      }
    }

    // Trigger email campaigns if lifecycle changed
    if (lifecycleChanged) {
      try {
        await this.emailTriggerService.processLifecycleTriggers(
          userId,
          result.lifecycleStage,
          currentUser?.lifecycleStage
        );
      } catch (error) {
        console.error(
          `Error processing lifecycle triggers for user ${userId}:`,
          error
        );
        // Don't fail the segmentation update if email triggers fail
      }
    }

    return result;
  }

  /**
   * Create a new segmentation rule
   */
  async createSegmentationRule(
    data: SegmentationRuleData
  ): Promise<SegmentationRule> {
    return this.prisma.segmentationRule.create({
      data: {
        name: data.name,
        description: data.description,
        segment: data.segment,
        lifecycleStage: data.lifecycleStage,
        conditions: data.conditions as any,
        priority: data.priority || 0,
        tags: data.tags || [],
        tenantId: data.tenantId,
        createdBy: "system", // TODO: Get from context
      },
    });
  }

  /**
   * Update an existing segmentation rule
   */
  async updateSegmentationRule(
    id: string,
    data: Partial<SegmentationRuleData>
  ): Promise<SegmentationRule> {
    return this.prisma.segmentationRule.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        segment: data.segment,
        lifecycleStage: data.lifecycleStage,
        conditions: data.conditions as any,
        priority: data.priority,
        tags: data.tags,
      },
    });
  }

  /**
   * Delete a segmentation rule
   */
  async deleteSegmentationRule(id: string): Promise<void> {
    await this.prisma.segmentationRule.delete({
      where: { id },
    });
  }

  /**
   * Get segmentation analytics for dashboard
   */
  async getSegmentationAnalytics(tenantId?: string) {
    const whereClause = tenantId ? { tenantId } : {};

    const [
      segmentDistribution,
      lifecycleDistribution,
      rulePerformance,
      recentChanges,
    ] = await Promise.all([
      // Segment distribution
      this.prisma.user.groupBy({
        by: ["segment"],
        where: whereClause,
        _count: { id: true },
      }),

      // Lifecycle stage distribution
      this.prisma.user.groupBy({
        by: ["lifecycleStage"],
        where: whereClause,
        _count: { id: true },
      }),

      // Rule performance (simplified - you could add user counting logic here)
      this.prisma.segmentationRule.findMany({
        where: { ...whereClause, isActive: true },
        select: {
          id: true,
          name: true,
          segment: true,
        },
      }),

      // Recent segmentation changes
      this.prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          segment: true,
          lifecycleStage: true,
          segmentUpdatedAt: true,
        },
        orderBy: { segmentUpdatedAt: "desc" },
        take: 50,
      }),
    ]);

    return {
      segmentDistribution,
      lifecycleDistribution,
      rulePerformance,
      recentChanges,
    };
  }

  /**
   * Bulk update segmentation for all users (useful for rule changes)
   */
  async bulkUpdateSegmentation(batchSize: number = 100): Promise<void> {
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

      // Update segmentation for this batch
      await Promise.all(
        users.map(user => this.updateUserSegmentation(user.id))
      );

      processed += users.length;
      console.log(`Processed ${processed} users for segmentation update`);
    }
  }

  /**
   * Get users by segment for targeted campaigns
   */
  async getUsersBySegment(
    segment: UserSegment,
    tenantId?: string
  ): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: {
        segment,
        ...(tenantId && { tenantId }),
      },
      select: { id: true },
    });

    return users.map(user => user.id);
  }

  /**
   * Get users by lifecycle stage
   */
  async getUsersByLifecycleStage(
    stage: LifecycleStage,
    tenantId?: string
  ): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: {
        lifecycleStage: stage,
        ...(tenantId && { tenantId }),
      },
      select: { id: true },
    });

    return users.map(user => user.id);
  }

  /**
   * Calculate churn risk score for a user
   */
  async calculateChurnRisk(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        orders: {
          select: {
            createdAt: true,
            total: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!user) return 0;

    let riskScore = 0;

    // Time since last activity
    const daysSinceLastActivity = user.lastActivityAt
      ? Math.floor(
          (Date.now() - user.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 999;

    if (daysSinceLastActivity > 90) riskScore += 40;
    else if (daysSinceLastActivity > 30) riskScore += 20;
    else if (daysSinceLastActivity > 7) riskScore += 10;

    // Purchase frequency
    const recentOrders = user.orders.filter(
      order => order.createdAt > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    );

    if (recentOrders.length === 0) riskScore += 30;
    else if (recentOrders.length === 1) riskScore += 15;

    // Average order value trend
    if (user.avgOrderValue && user.avgOrderValue < 50) riskScore += 10;

    // Low engagement
    if (user.totalPageViews < 10) riskScore += 15;
    if (user.totalTimeSpent < 300) riskScore += 10; // Less than 5 minutes

    // Lifecycle stage
    if (user.lifecycleStage === LifecycleStage.AWARENESS) riskScore += 20;
    if (user.lifecycleStage === LifecycleStage.CONSIDERATION) riskScore += 10;

    return Math.min(riskScore, 100);
  }

  /**
   * Process behavior-based email triggers
   */
  async processBehaviorTriggers(
    userId: string,
    event: string,
    eventData: any = {}
  ): Promise<void> {
    try {
      await this.emailTriggerService.processBehaviorTriggers(
        userId,
        event,
        eventData
      );
    } catch (error) {
      console.error(
        `Error processing behavior triggers for user ${userId}, event ${event}:`,
        error
      );
      // Don't fail if email triggers fail
    }
  }

  /**
   * Process time-based email triggers (run this periodically, e.g., daily)
   */
  async processTimeBasedTriggers(): Promise<void> {
    try {
      await this.emailTriggerService.processTimeBasedTriggers();
    } catch (error) {
      console.error("Error processing time-based triggers:", error);
      // Don't fail if email triggers fail
    }
  }
}
