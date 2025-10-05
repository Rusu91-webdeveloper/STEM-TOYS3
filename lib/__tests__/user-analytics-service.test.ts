import { PrismaClient } from "@prisma/client";
import { UserAnalyticsService } from "../services/user-analytics-service";

const prisma = new PrismaClient();
const analyticsService = new UserAnalyticsService(prisma);

describe("UserAnalyticsService", () => {
  let testUserId: string;

  beforeAll(async () => {
    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        email: `analytics-test-${Date.now()}@example.com`,
        name: "Analytics Test User",
        password: "hashedpassword",
        totalPageViews: 5,
        totalTimeSpent: 600, // 10 minutes
      },
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } });
    }
    await prisma.$disconnect();
  });

  describe("trackActivity", () => {
    it("should track page view activity", async () => {
      const initialPageViews =
        (
          await prisma.user.findUnique({
            where: { id: testUserId },
            select: { totalPageViews: true },
          })
        )?.totalPageViews || 0;

      await analyticsService.trackActivity({
        userId: testUserId,
        eventType: "page_view",
        eventData: { page: "/products" },
        pageUrl: "/products",
        timestamp: new Date(),
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { totalPageViews: true },
      });

      expect(updatedUser?.totalPageViews).toBe(initialPageViews + 1);
    });

    it("should track session duration", async () => {
      const initialTimeSpent =
        (
          await prisma.user.findUnique({
            where: { id: testUserId },
            select: { totalTimeSpent: true },
          })
        )?.totalTimeSpent || 0;

      await analyticsService.trackActivity({
        userId: testUserId,
        eventType: "session_end",
        eventData: { duration: 1800 }, // 30 minutes
        timestamp: new Date(),
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { totalTimeSpent: true, avgSessionDuration: true },
      });

      expect(updatedUser?.totalTimeSpent).toBe(initialTimeSpent + 1800);
      expect(updatedUser?.avgSessionDuration).toBeDefined();
    });

    it("should track recommendation clicks", async () => {
      const initialClicks =
        (
          await prisma.user.findUnique({
            where: { id: testUserId },
            select: { recommendationClicks: true },
          })
        )?.recommendationClicks || 0;

      await analyticsService.trackActivity({
        userId: testUserId,
        eventType: "recommendation_click",
        eventData: { productId: "test-product-id" },
        timestamp: new Date(),
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { recommendationClicks: true },
      });

      expect(updatedUser?.recommendationClicks).toBe(initialClicks + 1);
    });
  });

  describe("updatePurchaseMetrics", () => {
    it("should update purchase metrics after order creation", async () => {
      // Create a test order for the user
      const order = await prisma.order.create({
        data: {
          orderNumber: `TEST-${Date.now()}`,
          userId: testUserId,
          total: 299.99,
          subtotal: 299.99,
          tax: 0,
          shippingCost: 0,
          status: "COMPLETED",
          paymentStatus: "PAID",
          paymentMethod: "card",
          shippingAddressId: null, // Would need to create addresses in real scenario
          billingAddressId: null,
        },
      });

      await analyticsService.updatePurchaseMetrics(testUserId);

      const updatedUser = await prisma.user.findUnique({
        where: { id: testUserId },
        select: {
          lifetimeValue: true,
          avgOrderValue: true,
          purchaseFrequency: true,
        },
      });

      expect(updatedUser?.lifetimeValue).toBe(299.99);
      expect(updatedUser?.avgOrderValue).toBe(299.99);
      expect(updatedUser?.purchaseFrequency).toBeDefined();

      // Clean up
      await prisma.order.delete({ where: { id: order.id } });
    });
  });

  describe("getUserBehaviorMetrics", () => {
    it("should return user behavior metrics", async () => {
      const metrics = await analyticsService.getUserBehaviorMetrics(testUserId);

      expect(metrics).toBeDefined();
      expect(metrics?.userId).toBe(testUserId);
      expect(metrics?.totalPageViews).toBeDefined();
      expect(metrics?.totalTimeSpent).toBeDefined();
      expect(metrics?.lastActivityAt).toBeDefined();
    });

    it("should return null for non-existent user", async () => {
      const metrics =
        await analyticsService.getUserBehaviorMetrics("non-existent-id");
      expect(metrics).toBeNull();
    });
  });

  describe("calculateChurnRiskForAllUsers", () => {
    it("should calculate churn risk for all users", async () => {
      // This would run the bulk calculation
      // In a real test environment, we might want to mock this or use a smaller batch
      const result = await analyticsService.calculateChurnRiskForAllUsers(10);

      // The function should complete without throwing
      expect(result).toBeUndefined();
    });
  });

  describe("getBehavioralAnalytics", () => {
    it("should return behavioral analytics data", async () => {
      const analytics = await analyticsService.getBehavioralAnalytics();

      expect(analytics).toBeDefined();
      expect(analytics.userEngagement).toBeDefined();
      expect(analytics.purchasePatterns).toBeDefined();
      expect(analytics.activityTrends).toBeDefined();
      expect(analytics.topSegments).toBeDefined();
    });
  });
});
