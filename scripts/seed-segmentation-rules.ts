import { PrismaClient, UserSegment, LifecycleStage } from "@prisma/client";
import {
  SegmentationService,
  SegmentationCondition,
} from "../lib/services/segmentation-service";
import { UserAnalyticsService } from "../lib/services/user-analytics-service";

const prisma = new PrismaClient();
const analyticsService = new UserAnalyticsService(prisma);
const segmentationService = new SegmentationService(prisma, analyticsService);

async function seedSegmentationRules() {
  console.log("Seeding segmentation rules...");

  const rules = [
    // VIP Customers
    {
      name: "VIP High Value Customers",
      description: "Users with high lifetime value and frequent purchases",
      segment: UserSegment.VIP,
      lifecycleStage: LifecycleStage.ADVOCACY,
      conditions: [
        { field: "lifetimeValue", operator: "gte" as const, value: 1000 },
        { field: "purchaseFrequency", operator: "gte" as const, value: 1 }, // At least monthly
        { field: "avgOrderValue", operator: "gte" as const, value: 200 },
      ],
      priority: 100,
      tags: ["high-value", "loyalty", "premium"],
    },

    // Active Customers
    {
      name: "Active Recent Purchasers",
      description: "Users who have purchased recently and show engagement",
      segment: UserSegment.ACTIVE,
      lifecycleStage: LifecycleStage.RETENTION,
      conditions: [
        { field: "lifetimeValue", operator: "gte" as const, value: 100 },
        {
          field: "lastActivityAt",
          operator: "gt" as const,
          value: "30_days_ago",
        },
        { field: "totalPageViews", operator: "gte" as const, value: 20 },
      ],
      priority: 80,
      tags: ["active", "engaged", "recent-activity"],
    },

    // At Risk Customers
    {
      name: "At Risk Inactive Users",
      description: "Users who were active but have become inactive",
      segment: UserSegment.AT_RISK,
      lifecycleStage: LifecycleStage.RETENTION,
      conditions: [
        { field: "lifetimeValue", operator: "gte" as const, value: 50 },
        {
          field: "lastActivityAt",
          operator: "lt" as const,
          value: "60_days_ago",
        },
        {
          field: "lastActivityAt",
          operator: "gt" as const,
          value: "120_days_ago",
        },
        { field: "churnRiskScore", operator: "gte" as const, value: 50 },
      ],
      priority: 70,
      tags: ["at-risk", "inactive", "retention-needed"],
    },

    // Churned Customers
    {
      name: "Churned Inactive Users",
      description: "Users who have not been active for an extended period",
      segment: UserSegment.CHURNED,
      lifecycleStage: LifecycleStage.ADVOCACY,
      conditions: [
        {
          field: "lastActivityAt",
          operator: "lt" as const,
          value: "120_days_ago",
        },
        { field: "totalPageViews", operator: "lt" as const, value: 50 },
        { field: "churnRiskScore", operator: "gte" as const, value: 80 },
      ],
      priority: 60,
      tags: ["churned", "inactive", "reactivation-needed"],
    },

    // New Users - Awareness Stage
    {
      name: "New Users in Awareness",
      description: "Recently registered users exploring the platform",
      segment: UserSegment.NEW,
      lifecycleStage: LifecycleStage.AWARENESS,
      conditions: [
        { field: "createdAt", operator: "gt" as const, value: "30_days_ago" },
        { field: "totalPageViews", operator: "lt" as const, value: 10 },
        { field: "lifetimeValue", operator: "eq" as const, value: 0 },
      ],
      priority: 50,
      tags: ["new", "awareness", "onboarding"],
    },

    // Consideration Stage
    {
      name: "Users in Consideration",
      description: "Users who have engaged but not purchased yet",
      segment: UserSegment.NEW,
      lifecycleStage: LifecycleStage.CONSIDERATION,
      conditions: [
        { field: "totalPageViews", operator: "gte" as const, value: 10 },
        { field: "lifetimeValue", operator: "eq" as const, value: 0 },
        { field: "wishlistSize", operator: "gte" as const, value: 1 },
      ],
      priority: 40,
      tags: ["consideration", "interested", "pre-purchase"],
    },

    // Purchase Stage
    {
      name: "First Time Purchasers",
      description: "Users who have made their first purchase",
      segment: UserSegment.ACTIVE,
      lifecycleStage: LifecycleStage.PURCHASE,
      conditions: [
        { field: "lifetimeValue", operator: "gt" as const, value: 0 },
        { field: "orders.length", operator: "eq" as const, value: 1 },
        { field: "createdAt", operator: "gt" as const, value: "90_days_ago" },
      ],
      priority: 30,
      tags: ["first-purchase", "new-customer", "conversion"],
    },

    // Romanian Market Intelligence Rules
    {
      name: "Romanian High Engagement Users",
      description: "Romanian users with high engagement and local preferences",
      segment: UserSegment.ACTIVE,
      lifecycleStage: LifecycleStage.RETENTION,
      conditions: [
        { field: "isRomanianResident", operator: "eq" as const, value: true },
        { field: "totalTimeSpent", operator: "gte" as const, value: 1800 }, // 30+ minutes
        {
          field: "regionalPreference",
          operator: "in" as const,
          value: ["Transylvania", "Moldova", "Muntenia"],
        },
      ],
      priority: 45,
      tags: ["romanian", "high-engagement", "regional"],
    },

    // Behavioral Analytics Rules
    {
      name: "High Intent Browsers",
      description: "Users showing strong purchase intent through behavior",
      segment: UserSegment.ACTIVE,
      lifecycleStage: LifecycleStage.CONSIDERATION,
      conditions: [
        { field: "recommendationClicks", operator: "gte" as const, value: 5 },
        { field: "wishlistSize", operator: "gte" as const, value: 3 },
        { field: "totalPageViews", operator: "gte" as const, value: 50 },
        {
          field: "lastActivityAt",
          operator: "gt" as const,
          value: "7_days_ago",
        },
      ],
      priority: 35,
      tags: ["high-intent", "behavioral", "conversion-ready"],
    },
  ];

  for (const rule of rules) {
    try {
      const existingRule = await prisma.segmentationRule.findFirst({
        where: { name: rule.name },
      });

      if (!existingRule) {
        await segmentationService.createSegmentationRule(rule);
        console.log(`Created segmentation rule: ${rule.name}`);
      } else {
        console.log(`Segmentation rule already exists: ${rule.name}`);
      }
    } catch (error) {
      console.error(`Error creating rule ${rule.name}:`, error);
    }
  }

  console.log("Segmentation rules seeding completed!");
}

async function main() {
  try {
    await seedSegmentationRules();
  } catch (error) {
    console.error("Error seeding segmentation rules:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
