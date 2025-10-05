import { PrismaClient, UserSegment, LifecycleStage } from "@prisma/client";
import {
  SegmentationService,
  SegmentationCondition,
} from "../services/segmentation-service";
import { UserAnalyticsService } from "../services/user-analytics-service";

const prisma = new PrismaClient();
const analyticsService = new UserAnalyticsService(prisma);
const segmentationService = new SegmentationService(prisma, analyticsService);

describe("SegmentationService", () => {
  beforeAll(async () => {
    // Create test segmentation rules
    await segmentationService.createSegmentationRule({
      name: "Test VIP Rule",
      description: "Test rule for VIP users",
      segment: UserSegment.VIP,
      lifecycleStage: LifecycleStage.ADVOCACY,
      conditions: [
        { field: "lifetimeValue", operator: "gte", value: 1000 },
        { field: "purchaseFrequency", operator: "gte", value: 2 },
      ],
      priority: 100,
      tags: ["test"],
    });

    await segmentationService.createSegmentationRule({
      name: "Test New User Rule",
      description: "Test rule for new users",
      segment: UserSegment.NEW,
      lifecycleStage: LifecycleStage.AWARENESS,
      conditions: [
        { field: "createdAt", operator: "gt", value: "30_days_ago" },
        { field: "lifetimeValue", operator: "eq", value: 0 },
      ],
      priority: 50,
      tags: ["test"],
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.segmentationRule.deleteMany({
      where: { tags: { has: "test" } },
    });
    await prisma.$disconnect();
  });

  describe("evaluateUserSegmentation", () => {
    it("should evaluate user against segmentation rules", async () => {
      // Create a test user
      const testUser = await prisma.user.create({
        data: {
          email: `test-${Date.now()}@example.com`,
          name: "Test User",
          password: "hashedpassword",
          lifetimeValue: 1500,
          purchaseFrequency: 3,
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        },
      });

      const result = await segmentationService.evaluateUserSegmentation(
        testUser.id
      );

      expect(result).toBeDefined();
      expect(result.userId).toBe(testUser.id);
      expect(result.segment).toBe(UserSegment.VIP);
      expect(result.lifecycleStage).toBe(LifecycleStage.ADVOCACY);
      expect(result.confidence).toBeGreaterThan(0);

      // Clean up
      await prisma.user.delete({ where: { id: testUser.id } });
    });

    it("should handle new users correctly", async () => {
      // Create a new test user
      const testUser = await prisma.user.create({
        data: {
          email: `new-test-${Date.now()}@example.com`,
          name: "New Test User",
          password: "hashedpassword",
          lifetimeValue: 0,
          createdAt: new Date(), // Just now
        },
      });

      const result = await segmentationService.evaluateUserSegmentation(
        testUser.id
      );

      expect(result.segment).toBe(UserSegment.NEW);
      expect(result.lifecycleStage).toBe(LifecycleStage.AWARENESS);

      // Clean up
      await prisma.user.delete({ where: { id: testUser.id } });
    });
  });

  describe("updateUserSegmentation", () => {
    it("should update user segmentation in database", async () => {
      // Create a test user
      const testUser = await prisma.user.create({
        data: {
          email: `update-test-${Date.now()}@example.com`,
          name: "Update Test User",
          password: "hashedpassword",
          lifetimeValue: 1500,
          purchaseFrequency: 3,
        },
      });

      const result = await segmentationService.updateUserSegmentation(
        testUser.id
      );

      expect(result.segment).toBe(UserSegment.VIP);
      expect(result.lifecycleStage).toBe(LifecycleStage.ADVOCACY);

      // Verify database was updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: { segment: true, lifecycleStage: true, segmentUpdatedAt: true },
      });

      expect(updatedUser?.segment).toBe(UserSegment.VIP);
      expect(updatedUser?.lifecycleStage).toBe(LifecycleStage.ADVOCACY);
      expect(updatedUser?.segmentUpdatedAt).toBeDefined();

      // Clean up
      await prisma.user.delete({ where: { id: testUser.id } });
    });
  });

  describe("createSegmentationRule", () => {
    it("should create a new segmentation rule", async () => {
      const ruleData = {
        name: "Unit Test Rule",
        description: "Rule created during unit testing",
        segment: UserSegment.ACTIVE,
        lifecycleStage: LifecycleStage.RETENTION,
        conditions: [
          { field: "totalPageViews", operator: "gte", value: 10 },
        ] as SegmentationCondition[],
        priority: 25,
        tags: ["unit-test"],
      };

      const rule = await segmentationService.createSegmentationRule(ruleData);

      expect(rule.id).toBeDefined();
      expect(rule.name).toBe(ruleData.name);
      expect(rule.segment).toBe(ruleData.segment);
      expect(rule.lifecycleStage).toBe(ruleData.lifecycleStage);
      expect(rule.priority).toBe(ruleData.priority);

      // Clean up
      await prisma.segmentationRule.delete({ where: { id: rule.id } });
    });
  });

  describe("getSegmentationAnalytics", () => {
    it("should return segmentation analytics", async () => {
      const analytics = await segmentationService.getSegmentationAnalytics();

      expect(analytics).toBeDefined();
      expect(analytics.segmentDistribution).toBeDefined();
      expect(analytics.lifecycleDistribution).toBeDefined();
      expect(analytics.rulePerformance).toBeDefined();
      expect(analytics.recentChanges).toBeDefined();

      // Should include our test rules
      expect(analytics.rulePerformance.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("calculateChurnRisk", () => {
    it("should calculate churn risk for a user", async () => {
      // Create a test user with high churn risk
      const testUser = await prisma.user.create({
        data: {
          email: `churn-test-${Date.now()}@example.com`,
          name: "Churn Test User",
          password: "hashedpassword",
          totalPageViews: 2,
          totalTimeSpent: 300, // 5 minutes
          lastActivityAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        },
      });

      const riskScore = await segmentationService.calculateChurnRisk(
        testUser.id
      );

      expect(riskScore).toBeGreaterThan(50); // Should be high risk

      // Clean up
      await prisma.user.delete({ where: { id: testUser.id } });
    });
  });
});
