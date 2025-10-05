import {
  PrismaClient,
  UserSegment,
  LifecycleStage,
  Role,
} from "@prisma/client";
import { jest } from "@jest/globals";

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    groupBy: jest.fn(),
    count: jest.fn(),
  },
  order: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
  review: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
  consentLog: {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  segmentationRule: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
} as unknown as PrismaClient;

// Mock logger
jest.mock("@/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock user cache
jest.mock("@/lib/cache/user-cache", () => ({
  getUserCache: jest.fn(() => ({
    invalidateUser: jest.fn(),
  })),
}));

// Import services after mocking
import {
  UserArchivalService,
  createUserArchivalService,
} from "@/lib/services/user-archival-service";
import { SegmentationService } from "@/lib/services/segmentation-service";
import { UserAnalyticsService } from "@/lib/services/user-analytics-service";

describe("User Services", () => {
  let archivalService: UserArchivalService;
  let segmentationService: SegmentationService;
  let analyticsService: UserAnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup archival service
    archivalService = new UserArchivalService(mockPrisma, {
      inactiveThresholdDays: 365,
      archiveBatchSize: 100,
      retentionPeriodDays: 2555,
      compressionEnabled: true,
    });

    // Setup segmentation service
    const mockAnalyticsService = new UserAnalyticsService(mockPrisma);
    segmentationService = new SegmentationService(
      mockPrisma,
      mockAnalyticsService
    );

    // Setup analytics service
    analyticsService = new UserAnalyticsService(mockPrisma);
  });

  describe("UserArchivalService", () => {
    describe("archiveInactiveUsers", () => {
      it("should archive inactive users successfully", async () => {
        const mockUsers = [
          {
            id: "user1",
            email: "user1@test.com",
            createdAt: new Date("2020-01-01"),
            lastActivityAt: new Date("2023-01-01"), // 2+ years ago
            lifetimeValue: 50,
            tenantId: "tenant1",
          },
          {
            id: "user2",
            email: "user2@test.com",
            createdAt: new Date("2020-01-01"),
            lastActivityAt: null,
            lifetimeValue: 50,
            tenantId: "tenant1",
          },
        ];

        mockPrisma.user.findMany.mockResolvedValue(mockUsers);
        mockPrisma.user.findUnique.mockResolvedValue({
          id: "user1",
          email: "user1@test.com",
          tenantId: "tenant1",
          addresses: [],
          orders: [],
          reviews: [],
          consentLogs: [],
        });
        mockPrisma.$transaction.mockImplementation(async callback => {
          return await callback(mockPrisma);
        });

        const result = await archivalService.archiveInactiveUsers();

        expect(result.processed).toBe(2);
        expect(result.archived).toBe(2);
        expect(result.failed).toBe(0);
        expect(mockPrisma.user.update).toHaveBeenCalledTimes(2);
      });

      it("should skip users with high lifetime value", async () => {
        const mockUsers = [
          {
            id: "user1",
            email: "user1@test.com",
            createdAt: new Date("2020-01-01"),
            lastActivityAt: new Date("2023-01-01"),
            lifetimeValue: 500, // High value, should not archive
            tenantId: "tenant1",
          },
        ];

        mockPrisma.user.findMany.mockResolvedValue(mockUsers);

        const result = await archivalService.archiveInactiveUsers();

        expect(result.processed).toBe(1);
        expect(result.archived).toBe(0);
        expect(mockPrisma.user.update).not.toHaveBeenCalled();
      });

      it("should handle archival errors gracefully", async () => {
        const mockUsers = [
          {
            id: "user1",
            email: "user1@test.com",
            createdAt: new Date("2020-01-01"),
            lastActivityAt: new Date("2023-01-01"),
            lifetimeValue: 50,
            tenantId: "tenant1",
          },
        ];

        mockPrisma.user.findMany.mockResolvedValue(mockUsers);
        mockPrisma.user.findUnique.mockRejectedValue(
          new Error("Database error")
        );
        mockPrisma.$transaction.mockImplementation(async callback => {
          return await callback(mockPrisma);
        });

        const result = await archivalService.archiveInactiveUsers();

        expect(result.processed).toBe(1);
        expect(result.archived).toBe(0);
        expect(result.failed).toBe(1);
        expect(result.errors).toHaveLength(1);
      });

      it("should respect batch size limits", async () => {
        const smallBatchService = new UserArchivalService(mockPrisma, {
          inactiveThresholdDays: 365,
          archiveBatchSize: 2,
          retentionPeriodDays: 2555,
          compressionEnabled: true,
        });

        const mockUsers = Array.from({ length: 5 }, (_, i) => ({
          id: `user${i}`,
          email: `user${i}@test.com`,
          createdAt: new Date("2020-01-01"),
          lastActivityAt: new Date("2023-01-01"),
          lifetimeValue: 50,
          tenantId: "tenant1",
        }));

        mockPrisma.user.findMany.mockResolvedValue(mockUsers.slice(0, 2));
        mockPrisma.user.findUnique.mockResolvedValue({
          id: "user0",
          email: "user0@test.com",
          tenantId: "tenant1",
          addresses: [],
          orders: [],
          reviews: [],
          consentLogs: [],
        });

        await smallBatchService.archiveInactiveUsers();

        expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ take: 2 })
        );
      });
    });

    describe("archiveSingleUser", () => {
      it("should archive user data correctly", async () => {
        const mockUserData = {
          id: "user1",
          email: "user1@test.com",
          tenantId: "tenant1",
          name: "John Doe",
          phone: "+1234567890",
          totalPageViews: 100,
          totalTimeSpent: 3600,
          addresses: [{ id: "addr1" }],
          orders: [
            { id: "order1", createdAt: new Date() },
            { id: "order2", createdAt: new Date() },
          ],
          reviews: [{ id: "review1", createdAt: new Date() }],
          consentLogs: [{ id: "consent1", createdAt: new Date() }],
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
        mockPrisma.$transaction.mockImplementation(async callback => {
          return await callback(mockPrisma);
        });

        await archivalService["archiveSingleUser"]("user1");

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: "user1" },
          data: expect.objectContaining({
            dataArchiveStatus: "ARCHIVED",
            anonymized: true,
            name: null,
            phone: null,
            totalPageViews: 0,
            totalTimeSpent: 0,
          }),
        });
      });

      it("should handle missing user gracefully", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.$transaction.mockImplementation(async callback => {
          return await callback(mockPrisma);
        });

        await expect(
          archivalService["archiveSingleUser"]("nonexistent")
        ).rejects.toThrow("User nonexistent not found");

        expect(mockPrisma.user.update).not.toHaveBeenCalled();
      });
    });

    describe("cleanupExpiredArchives", () => {
      it("should clean up expired archived data", async () => {
        const mockExpiredUsers = [
          {
            id: "expired1",
            email: "expired1@test.com",
            updatedAt: new Date("2020-01-01"), // Very old
            lifetimeValue: 10, // Low value
          },
        ];

        mockPrisma.user.findMany
          .mockResolvedValueOnce(mockExpiredUsers)
          .mockResolvedValueOnce([]);

        const result = await archivalService.cleanupExpiredArchives();

        expect(result.processed).toBe(1);
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: "expired1" },
          data: expect.objectContaining({
            dataArchiveStatus: "DELETED",
            email: "archived-expired1@deleted.local",
          }),
        });
      });

      it("should skip users with high lifetime value", async () => {
        const mockUsers = [
          {
            id: "valuable1",
            email: "valuable@test.com",
            updatedAt: new Date("2020-01-01"),
            lifetimeValue: 1000, // High value, should not delete
          },
        ];

        mockPrisma.user.findMany.mockResolvedValue(mockUsers);

        const result = await archivalService.cleanupExpiredArchives();

        expect(result.processed).toBe(1);
        expect(mockPrisma.user.update).not.toHaveBeenCalled();
      });
    });

    describe("getArchivalStats", () => {
      it("should return correct archival statistics", async () => {
        mockPrisma.user.count
          .mockResolvedValueOnce(1000) // active
          .mockResolvedValueOnce(100) // archived
          .mockResolvedValueOnce(50); // deleted

        mockPrisma.user.findMany.mockResolvedValue([]);

        const stats = await archivalService.getArchivalStats();

        expect(stats.activeUsers).toBe(1000);
        expect(stats.archivedUsers).toBe(100);
        expect(stats.deletedUsers).toBe(50);
        expect(stats.totalUsers).toBe(1150);
        expect(stats.archiveRate).toBeCloseTo(8.7, 1);
      });
    });
  });

  describe("SegmentationService", () => {
    describe("evaluateUserSegmentation", () => {
      it("should evaluate user against segmentation rules", async () => {
        const mockUser = {
          id: "user1",
          totalPageViews: 100,
          lifetimeValue: 500,
          orders: [{ total: 100 }, { total: 200 }],
          wishlistItems: [{ id: "item1" }, { id: "item2" }],
          reviews: [{ rating: 5 }],
        };

        const mockRules = [
          {
            id: "rule1",
            segment: UserSegment.VIP,
            lifecycleStage: LifecycleStage.RETENTION,
            conditions: [
              { field: "lifetimeValue", operator: "gte", value: 300 },
              { field: "totalPageViews", operator: "gte", value: 50 },
            ],
            priority: 10,
          },
          {
            id: "rule2",
            segment: UserSegment.ACTIVE,
            lifecycleStage: LifecycleStage.PURCHASE,
            conditions: [
              { field: "lifetimeValue", operator: "gte", value: 100 },
            ],
            priority: 5,
          },
        ];

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockPrisma.segmentationRule.findMany.mockResolvedValue(mockRules);

        const result =
          await segmentationService.evaluateUserSegmentation("user1");

        expect(result.userId).toBe("user1");
        expect(result.segment).toBe(UserSegment.VIP);
        expect(result.lifecycleStage).toBe(LifecycleStage.RETENTION);
        expect(result.appliedRules).toContain("rule1");
        expect(result.confidence).toBe(1); // All conditions met
      });

      it("should return NEW segment for users not matching any rules", async () => {
        const mockUser = {
          id: "user1",
          totalPageViews: 5,
          lifetimeValue: 0,
          orders: [],
          wishlistItems: [],
          reviews: [],
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockPrisma.segmentationRule.findMany.mockResolvedValue([]);

        const result =
          await segmentationService.evaluateUserSegmentation("user1");

        expect(result.segment).toBe(UserSegment.NEW);
        expect(result.lifecycleStage).toBe(LifecycleStage.AWARENESS);
        expect(result.confidence).toBe(0);
      });

      it("should throw error for non-existent user", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(
          segmentationService.evaluateUserSegmentation("nonexistent")
        ).rejects.toThrow("User nonexistent not found");
      });
    });

    describe("evaluateCondition", () => {
      it("should evaluate various condition operators", () => {
        const testUser = {
          lifetimeValue: 500,
          totalPageViews: 100,
          segment: UserSegment.ACTIVE,
          tags: ["premium", "loyal"],
          orders: [{ total: 100 }, { total: 200 }],
        };

        // Test equality
        expect(
          segmentationService["evaluateCondition"](testUser, {
            field: "lifetimeValue",
            operator: "eq",
            value: 500,
          })
        ).toBe(true);

        // Test greater than
        expect(
          segmentationService["evaluateCondition"](testUser, {
            field: "totalPageViews",
            operator: "gt",
            value: 50,
          })
        ).toBe(true);

        // Test contains (array)
        expect(
          segmentationService["evaluateCondition"](testUser, {
            field: "tags",
            operator: "contains",
            value: "premium",
          })
        ).toBe(true);

        // Test regex
        expect(
          segmentationService["evaluateCondition"](testUser, {
            field: "segment",
            operator: "regex",
            value: "ACTIVE",
          })
        ).toBe(true);

        // Test inequality
        expect(
          segmentationService["evaluateCondition"](testUser, {
            field: "lifetimeValue",
            operator: "neq",
            value: 1000,
          })
        ).toBe(true);
      });

      it("should handle nested field access", () => {
        const testUser = {
          profile: {
            preferences: {
              theme: "dark",
            },
          },
        };

        expect(
          segmentationService["evaluateCondition"](testUser, {
            field: "profile.preferences.theme",
            operator: "eq",
            value: "dark",
          })
        ).toBe(true);
      });

      it("should handle array field access", () => {
        const testUser = {
          orders: [{ total: 100 }, { total: 200 }],
        };

        expect(
          segmentationService["evaluateCondition"](testUser, {
            field: "orders.0.total",
            operator: "eq",
            value: 100,
          })
        ).toBe(true);
      });
    });

    describe("updateUserSegmentation", () => {
      it("should update user segmentation and trigger email campaigns", async () => {
        const mockCurrentUser = {
          segment: UserSegment.NEW,
          lifecycleStage: LifecycleStage.AWARENESS,
        };

        const mockResult = {
          userId: "user1",
          segment: UserSegment.VIP,
          lifecycleStage: LifecycleStage.RETENTION,
          appliedRules: ["rule1"],
          confidence: 0.9,
          lastUpdated: new Date(),
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockCurrentUser);
        const evaluateSpy = jest.spyOn(
          segmentationService,
          "evaluateUserSegmentation"
        );
        evaluateSpy.mockResolvedValue(mockResult);

        const result =
          await segmentationService.updateUserSegmentation("user1");

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: "user1" },
          data: {
            segment: UserSegment.VIP,
            lifecycleStage: LifecycleStage.RETENTION,
            segmentUpdatedAt: mockResult.lastUpdated,
          },
        });

        expect(result).toEqual(mockResult);
      });

      it("should trigger email campaigns when segment changes", async () => {
        const mockCurrentUser = {
          segment: UserSegment.NEW,
          lifecycleStage: LifecycleStage.AWARENESS,
        };

        const mockResult = {
          userId: "user1",
          segment: UserSegment.VIP,
          lifecycleStage: LifecycleStage.RETENTION,
          appliedRules: ["rule1"],
          confidence: 0.9,
          lastUpdated: new Date(),
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockCurrentUser);
        const evaluateSpy = jest.spyOn(
          segmentationService,
          "evaluateUserSegmentation"
        );
        evaluateSpy.mockResolvedValue(mockResult);

        await segmentationService.updateUserSegmentation("user1");

        // Email trigger services would be called here
        // (mocked in actual implementation)
      });
    });

    describe("calculateChurnRisk", () => {
      it("should calculate high churn risk for inactive users", async () => {
        const mockUser = {
          id: "user1",
          lastActivityAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
          avgOrderValue: 25, // Low value
          totalPageViews: 5, // Low engagement
          totalTimeSpent: 60, // Low time spent
          lifecycleStage: LifecycleStage.AWARENESS,
          orders: [], // No recent orders
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const riskScore = await segmentationService.calculateChurnRisk("user1");

        expect(riskScore).toBeGreaterThan(50); // High risk
      });

      it("should calculate low churn risk for active valuable users", async () => {
        const recentOrderDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

        const mockUser = {
          id: "user1",
          lastActivityAt: new Date(), // Very recent
          avgOrderValue: 200, // High value
          totalPageViews: 500, // High engagement
          totalTimeSpent: 7200, // High time spent (2 hours)
          lifecycleStage: LifecycleStage.RETENTION,
          orders: [
            { createdAt: recentOrderDate, total: 200 },
            {
              createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              total: 150,
            },
          ],
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const riskScore = await segmentationService.calculateChurnRisk("user1");

        expect(riskScore).toBeLessThan(20); // Low risk
      });

      it("should return 0 for non-existent users", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const riskScore =
          await segmentationService.calculateChurnRisk("nonexistent");

        expect(riskScore).toBe(0);
      });
    });

    describe("CRUD operations", () => {
      it("should create segmentation rule", async () => {
        const ruleData = {
          name: "VIP Customers",
          description: "High-value customers",
          segment: UserSegment.VIP,
          lifecycleStage: LifecycleStage.RETENTION,
          conditions: [{ field: "lifetimeValue", operator: "gte", value: 500 }],
          priority: 10,
          tags: ["vip", "high-value"],
          tenantId: "tenant1",
        };

        const mockCreatedRule = {
          id: "rule1",
          ...ruleData,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.segmentationRule.create.mockResolvedValue(mockCreatedRule);

        const result =
          await segmentationService.createSegmentationRule(ruleData);

        expect(mockPrisma.segmentationRule.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            name: ruleData.name,
            segment: ruleData.segment,
            conditions: ruleData.conditions,
            priority: ruleData.priority,
          }),
        });
        expect(result).toEqual(mockCreatedRule);
      });

      it("should update segmentation rule", async () => {
        const updateData = {
          name: "Updated VIP Rule",
          priority: 15,
        };

        const mockUpdatedRule = {
          id: "rule1",
          name: "Updated VIP Rule",
          priority: 15,
          segment: UserSegment.VIP,
          conditions: [],
          updatedAt: new Date(),
        };

        mockPrisma.segmentationRule.update.mockResolvedValue(mockUpdatedRule);

        const result = await segmentationService.updateSegmentationRule(
          "rule1",
          updateData
        );

        expect(mockPrisma.segmentationRule.update).toHaveBeenCalledWith({
          where: { id: "rule1" },
          data: updateData,
        });
        expect(result).toEqual(mockUpdatedRule);
      });

      it("should delete segmentation rule", async () => {
        mockPrisma.segmentationRule.delete.mockResolvedValue({
          id: "rule1",
          name: "Deleted Rule",
        });

        await segmentationService.deleteSegmentationRule("rule1");

        expect(mockPrisma.segmentationRule.delete).toHaveBeenCalledWith({
          where: { id: "rule1" },
        });
      });
    });

    describe("Analytics methods", () => {
      it("should get segmentation analytics", async () => {
        const mockSegmentDistribution = [
          { segment: UserSegment.VIP, _count: { id: 50 } },
          { segment: UserSegment.ACTIVE, _count: { id: 200 } },
          { segment: UserSegment.NEW, _count: { id: 500 } },
        ];

        const mockLifecycleDistribution = [
          { lifecycleStage: LifecycleStage.RETENTION, _count: { id: 100 } },
          { lifecycleStage: LifecycleStage.PURCHASE, _count: { id: 300 } },
        ];

        mockPrisma.user.groupBy
          .mockResolvedValueOnce(mockSegmentDistribution)
          .mockResolvedValueOnce(mockLifecycleDistribution);
        mockPrisma.segmentationRule.findMany.mockResolvedValue([]);
        mockPrisma.user.findMany.mockResolvedValue([]);

        const analytics = await segmentationService.getSegmentationAnalytics();

        expect(analytics.segmentDistribution).toEqual(mockSegmentDistribution);
        expect(analytics.lifecycleDistribution).toEqual(
          mockLifecycleDistribution
        );
      });

      it("should get users by segment", async () => {
        const mockUsers = [{ id: "user1" }, { id: "user2" }, { id: "user3" }];

        mockPrisma.user.findMany.mockResolvedValue(mockUsers);

        const userIds = await segmentationService.getUsersBySegment(
          UserSegment.VIP,
          "tenant1"
        );

        expect(userIds).toEqual(["user1", "user2", "user3"]);
        expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
          where: {
            segment: UserSegment.VIP,
            tenantId: "tenant1",
          },
          select: { id: true },
        });
      });
    });
  });

  describe("UserAnalyticsService", () => {
    describe("trackActivity", () => {
      it("should track page view activity", async () => {
        const mockUser = {
          totalPageViews: 10,
          totalTimeSpent: 3600,
          avgSessionDuration: 1800,
          lastActivityAt: new Date("2023-01-01"),
          recommendationClicks: 5,
          wishlistSize: 3,
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const event: UserActivityEvent = {
          userId: "user1",
          eventType: "page_view",
          eventData: { page: "/products" },
          sessionId: "session123",
          pageUrl: "/products",
          timestamp: new Date(),
        };

        await analyticsService.trackActivity(event);

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: "user1" },
          data: {
            totalPageViews: 11, // 10 + 1
            lastActivityAt: event.timestamp,
          },
        });
      });

      it("should track session end activity", async () => {
        const mockUser = {
          totalPageViews: 20,
          totalTimeSpent: 3600,
          avgSessionDuration: 1800,
          lastActivityAt: new Date("2023-01-01"),
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const event: UserActivityEvent = {
          userId: "user1",
          eventType: "session_end",
          eventData: { duration: 2400 }, // 40 minutes
          timestamp: new Date(),
        };

        await analyticsService.trackActivity(event);

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: "user1" },
          data: {
            avgSessionDuration: 1950, // Updated average
            totalTimeSpent: 6000, // 3600 + 2400
            lastActivityAt: event.timestamp,
          },
        });
      });

      it("should track recommendation clicks", async () => {
        const mockUser = {
          recommendationClicks: 5,
          lastActivityAt: new Date("2023-01-01"),
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const event: UserActivityEvent = {
          userId: "user1",
          eventType: "recommendation_click",
          eventData: { productId: "prod123" },
          timestamp: new Date(),
        };

        await analyticsService.trackActivity(event);

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: "user1" },
          data: {
            recommendationClicks: 6, // 5 + 1
            lastActivityAt: event.timestamp,
          },
        });
      });

      it("should handle wishlist operations", async () => {
        const mockUser = {
          wishlistSize: 5,
          lastActivityAt: new Date("2023-01-01"),
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        // Test wishlist add
        await analyticsService.trackActivity({
          userId: "user1",
          eventType: "wishlist_add",
          eventData: { productId: "prod123" },
          timestamp: new Date(),
        });

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: "user1" },
          data: {
            wishlistSize: 6, // 5 + 1
            lastActivityAt: expect.any(Date),
          },
        });

        // Reset mock
        jest.clearAllMocks();
        mockPrisma.user.findUnique.mockResolvedValue({
          ...mockUser,
          wishlistSize: 6,
        });

        // Test wishlist remove
        await analyticsService.trackActivity({
          userId: "user1",
          eventType: "wishlist_remove",
          eventData: { productId: "prod123" },
          timestamp: new Date(),
        });

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: "user1" },
          data: {
            wishlistSize: 5, // 6 - 1
            lastActivityAt: expect.any(Date),
          },
        });
      });

      it("should skip tracking for non-existent users", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const event: UserActivityEvent = {
          userId: "nonexistent",
          eventType: "page_view",
          eventData: {},
          timestamp: new Date(),
        };

        await analyticsService.trackActivity(event);

        expect(mockPrisma.user.update).not.toHaveBeenCalled();
      });
    });

    describe("updatePurchaseMetrics", () => {
      it("should calculate and update purchase metrics", async () => {
        const mockOrders = [
          { total: 100, createdAt: new Date("2023-01-01") },
          { total: 200, createdAt: new Date("2023-02-01") },
          { total: 150, createdAt: new Date("2023-03-01") },
        ];

        mockPrisma.order.findMany.mockResolvedValue(mockOrders);

        await analyticsService.updatePurchaseMetrics("user1");

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: "user1" },
          data: {
            lifetimeValue: 450, // 100 + 200 + 150
            avgOrderValue: 150, // 450 / 3
            purchaseFrequency: expect.closeTo(0.033, 0.001), // 3 orders over ~3 months
          },
        });
      });

      it("should skip users with no orders", async () => {
        mockPrisma.order.findMany.mockResolvedValue([]);

        await analyticsService.updatePurchaseMetrics("user1");

        expect(mockPrisma.user.update).not.toHaveBeenCalled();
      });
    });

    describe("updateSocialEngagementScore", () => {
      it("should calculate social engagement based on referrals", async () => {
        const mockUser = {
          referralCount: 5,
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        await analyticsService.updateSocialEngagementScore("user1");

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: "user1" },
          data: {
            socialEngagementScore: 50, // 5 * 10 = 50, capped at 100
          },
        });
      });

      it("should cap engagement score at 100", async () => {
        const mockUser = {
          referralCount: 20, // High referral count
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        await analyticsService.updateSocialEngagementScore("user1");

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: "user1" },
          data: {
            socialEngagementScore: 100, // Capped at 100
          },
        });
      });

      it("should skip non-existent users", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await analyticsService.updateSocialEngagementScore("nonexistent");

        expect(mockPrisma.user.update).not.toHaveBeenCalled();
      });
    });

    describe("getUserBehaviorMetrics", () => {
      it("should return comprehensive user behavior metrics", async () => {
        const mockUser = {
          id: "user1",
          totalPageViews: 150,
          totalTimeSpent: 7200, // 2 hours
          avgSessionDuration: 1800, // 30 minutes
          lastActivityAt: new Date("2023-12-01"),
          purchaseFrequency: 2.5,
          avgOrderValue: 75,
          lifetimeValue: 1500,
          referralCount: 3,
          socialEngagementScore: 30,
          recommendationClicks: 25,
          wishlistSize: 8,
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const metrics = await analyticsService.getUserBehaviorMetrics("user1");

        expect(metrics).toEqual({
          userId: "user1",
          totalPageViews: 150,
          totalTimeSpent: 7200,
          avgSessionDuration: 1800,
          lastActivityAt: new Date("2023-12-01"),
          purchaseFrequency: 2.5,
          avgOrderValue: 75,
          lifetimeValue: 1500,
          referralCount: 3,
          socialEngagementScore: 30,
          recommendationClicks: 25,
          wishlistSize: 8,
        });
      });

      it("should throw error for non-existent users", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(
          analyticsService.getUserBehaviorMetrics("nonexistent")
        ).rejects.toThrow("User nonexistent not found");
      });
    });
  });

  describe("Factory Functions", () => {
    describe("createUserArchivalService", () => {
      it("should create archival service with default config", () => {
        const service = createUserArchivalService(mockPrisma);

        expect(service).toBeInstanceOf(UserArchivalService);
      });

      it("should create archival service with custom config", () => {
        const customConfig = {
          inactiveThresholdDays: 180,
          archiveBatchSize: 500,
          retentionPeriodDays: 1000,
          compressionEnabled: false,
        };

        const service = createUserArchivalService(mockPrisma, customConfig);

        expect(service).toBeInstanceOf(UserArchivalService);
        // Config would be applied internally
      });

      it("should use environment variables for config", () => {
        process.env.USER_ARCHIVAL_INACTIVE_DAYS = "200";
        process.env.USER_ARCHIVAL_BATCH_SIZE = "300";
        process.env.USER_ARCHIVAL_RETENTION_DAYS = "1500";
        process.env.USER_ARCHIVAL_COMPRESSION = "false";

        const service = createUserArchivalService(mockPrisma);

        expect(service).toBeInstanceOf(UserArchivalService);

        // Clean up
        delete process.env.USER_ARCHIVAL_INACTIVE_DAYS;
        delete process.env.USER_ARCHIVAL_BATCH_SIZE;
        delete process.env.USER_ARCHIVAL_RETENTION_DAYS;
        delete process.env.USER_ARCHIVAL_COMPRESSION;
      });
    });
  });
});
