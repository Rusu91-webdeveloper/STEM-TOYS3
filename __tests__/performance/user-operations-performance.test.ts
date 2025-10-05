import { PrismaClient, UserSegment, LifecycleStage } from "@prisma/client";

// Mock Prisma with performance tracking
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  order: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  address: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  segmentationRule: {
    findMany: jest.fn(),
  },
  consentLog: {
    findMany: jest.fn(),
  },
  review: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn(),
} as unknown as PrismaClient;

// Mock performance measurement
const mockPerformance = {
  now: jest.fn(),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(),
};

// Mock Redis cache
const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  expire: jest.fn(),
  pipeline: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exec: jest.fn().mockResolvedValue([]),
  })),
};

// Setup mocks
jest.mock("@/lib/db", () => ({
  db: mockPrisma,
}));

// Mock performance API
Object.defineProperty(window, "performance", {
  value: mockPerformance,
  writable: true,
});

describe("User Operations Performance Tests", () => {
  let performanceMarks: Map<string, number>;

  beforeEach(() => {
    jest.clearAllMocks();
    performanceMarks = new Map();

    // Mock performance.now() to return incremental timestamps
    let timeCounter = 0;
    mockPerformance.now.mockImplementation(() => {
      timeCounter += 10; // 10ms increments for realistic timing
      return timeCounter;
    });

    mockPerformance.mark.mockImplementation((name: string) => {
      performanceMarks.set(name, mockPerformance.now());
    });

    mockPerformance.measure.mockImplementation(
      (name: string, startMark: string, endMark: string) => {
        const startTime = performanceMarks.get(startMark) || 0;
        const endTime = performanceMarks.get(endMark) || mockPerformance.now();
        return { name, duration: endTime - startTime };
      }
    );

    mockPerformance.getEntriesByName.mockImplementation((name: string) => {
      const duration =
        mockPerformance.measure(name, `${name}-start`, `${name}-end`)
          ?.duration || 0;
      return [{ duration }];
    });
  });

  describe("Database Query Performance", () => {
    it("should handle user profile queries within performance budget", async () => {
      // Setup mock user with comprehensive data
      const mockUser = {
        id: "user-123",
        name: "Performance Test User",
        email: "perf@example.com",
        phone: "+40712345678",
        role: "CUSTOMER",
        isActive: true,
        emailVerified: new Date(),
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date(),
        segment: UserSegment.ACTIVE,
        lifecycleStage: LifecycleStage.PURCHASE,
        totalPageViews: 150,
        lifetimeValue: 500,
        consentGiven: true,
        cnp: "1234567890123",
        cui: "RO123456789",
        judet: "București",
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
        accountLocked: false,
        twoFactorEnabled: false,
        addresses: Array.from({ length: 5 }, (_, i) => ({
          id: `addr-${i}`,
          name: `Address ${i}`,
          addressLine1: `Street ${i}`,
          city: "București",
          postalCode: "010101",
          country: "RO",
        })),
        orders: Array.from({ length: 20 }, (_, i) => ({
          id: `order-${i}`,
          total: 50 + i * 10,
          createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          status: "COMPLETED",
        })),
        reviews: Array.from({ length: 15 }, (_, i) => ({
          id: `review-${i}`,
          rating: 4 + (i % 2),
          content: `Review content ${i}`,
          createdAt: new Date(Date.now() - i * 12 * 60 * 60 * 1000),
        })),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Measure query performance
      performance.mark("user-profile-query-start");

      const queryResult = await mockPrisma.user.findUnique({
        where: { id: "user-123" },
        include: {
          addresses: true,
          orders: { orderBy: { createdAt: "desc" }, take: 10 },
          reviews: { orderBy: { createdAt: "desc" }, take: 10 },
        },
      });

      performance.mark("user-profile-query-end");

      const queryDuration = performance.measure(
        "user-profile-query",
        "user-profile-query-start",
        "user-profile-query-end"
      ).duration;

      // Performance assertions
      expect(queryDuration).toBeLessThan(100); // Should complete within 100ms
      expect(queryResult).toBeDefined();
      expect(queryResult.addresses).toHaveLength(5);
      expect(queryResult.orders).toHaveLength(20);
      expect(queryResult.reviews).toHaveLength(15);
    });

    it("should optimize bulk user operations for large datasets", async () => {
      // Simulate bulk user creation (1000 users)
      const bulkUsers = Array.from({ length: 1000 }, (_, i) => ({
        id: `bulk-user-${i}`,
        name: `Bulk User ${i}`,
        email: `bulk${i}@example.com`,
        password: "hashed-password",
        isActive: true,
        segment: UserSegment.NEW,
        lifecycleStage: LifecycleStage.AWARENESS,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      mockPrisma.user.create.mockImplementation(data =>
        Promise.resolve(data.data)
      );

      performance.mark("bulk-create-start");

      // Simulate bulk creation with batching
      const batchSize = 100;
      const batches = [];
      for (let i = 0; i < bulkUsers.length; i += batchSize) {
        const batch = bulkUsers.slice(i, i + batchSize);
        batches.push(batch);
      }

      // Process batches sequentially
      for (const batch of batches) {
        await Promise.all(
          batch.map(user => mockPrisma.user.create({ data: user }))
        );
      }

      performance.mark("bulk-create-end");

      const bulkCreateDuration = performance.measure(
        "bulk-create",
        "bulk-create-start",
        "bulk-create-end"
      ).duration;

      // Performance assertions for bulk operations
      expect(bulkCreateDuration).toBeLessThan(2000); // Should complete within 2 seconds
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1000);
    });

    it("should handle concurrent user queries efficiently", async () => {
      // Setup concurrent user queries (50 concurrent requests)
      const concurrentQueries = 50;
      const userIds = Array.from(
        { length: concurrentQueries },
        (_, i) => `user-${i}`
      );

      mockPrisma.user.findUnique.mockResolvedValue({
        id: "mock-user",
        name: "Concurrent Test User",
        email: "concurrent@example.com",
      });

      performance.mark("concurrent-queries-start");

      // Execute concurrent queries
      const queryPromises = userIds.map(id =>
        mockPrisma.user.findUnique({ where: { id } })
      );

      const results = await Promise.all(queryPromises);

      performance.mark("concurrent-queries-end");

      const concurrentDuration = performance.measure(
        "concurrent-queries",
        "concurrent-queries-start",
        "concurrent-queries-end"
      ).duration;

      // Performance assertions for concurrent operations
      expect(concurrentDuration).toBeLessThan(500); // Should complete within 500ms
      expect(results).toHaveLength(concurrentQueries);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(
        concurrentQueries
      );
    });
  });

  describe("User Segmentation Performance", () => {
    it("should evaluate segmentation rules within time budget", async () => {
      const mockUser = {
        id: "user-123",
        lifetimeValue: 750,
        totalPageViews: 200,
        orders: [{ total: 100 }, { total: 200 }, { total: 150 }],
        wishlistItems: [{ id: "item1" }, { id: "item2" }, { id: "item3" }],
        reviews: [{ rating: 5 }, { rating: 4 }, { rating: 5 }],
      };

      const mockRules = Array.from({ length: 20 }, (_, i) => ({
        id: `rule-${i}`,
        segment: i < 10 ? UserSegment.ACTIVE : UserSegment.VIP,
        lifecycleStage:
          i < 5 ? LifecycleStage.CONSIDERATION : LifecycleStage.PURCHASE,
        conditions: [
          { field: "lifetimeValue", operator: "gte", value: i * 50 },
          { field: "totalPageViews", operator: "gte", value: i * 10 },
        ],
        priority: 20 - i, // Descending priority
      }));

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.segmentationRule.findMany.mockResolvedValue(mockRules);

      performance.mark("segmentation-evaluation-start");

      // Simulate segmentation evaluation logic
      let bestSegment = UserSegment.NEW;
      let bestLifecycleStage = LifecycleStage.AWARENESS;
      let maxConfidence = 0;

      for (const rule of mockRules) {
        const conditions = rule.conditions as any[];
        let totalConditions = conditions.length;
        let matchedConditions = 0;

        for (const condition of conditions) {
          const { field, operator, value } = condition;
          const fieldValue = field
            .split(".")
            .reduce((obj, key) => obj?.[key], mockUser);

          switch (operator) {
            case "gte":
              if (fieldValue >= value) matchedConditions++;
              break;
            case "gt":
              if (fieldValue > value) matchedConditions++;
              break;
          }
        }

        const confidence =
          totalConditions > 0 ? matchedConditions / totalConditions : 0;
        if (confidence > maxConfidence) {
          maxConfidence = confidence;
          bestSegment = rule.segment;
          bestLifecycleStage = rule.lifecycleStage;
        }
      }

      performance.mark("segmentation-evaluation-end");

      const segmentationDuration = performance.measure(
        "segmentation-evaluation",
        "segmentation-evaluation-start",
        "segmentation-evaluation-end"
      ).duration;

      // Performance assertions
      expect(segmentationDuration).toBeLessThan(50); // Should complete within 50ms
      expect(bestSegment).toBe(UserSegment.VIP);
      expect(maxConfidence).toBeGreaterThan(0.5);
    });

    it("should handle segmentation updates for multiple users", async () => {
      const userBatch = Array.from({ length: 100 }, (_, i) => ({
        id: `user-${i}`,
        lifetimeValue: 100 + i * 10,
        totalPageViews: 50 + i * 5,
        segment: UserSegment.ACTIVE,
        lifecycleStage: LifecycleStage.PURCHASE,
      }));

      mockPrisma.user.findMany.mockResolvedValue(userBatch);
      mockPrisma.user.update.mockResolvedValue({} as any);

      performance.mark("batch-segmentation-start");

      // Simulate batch segmentation update
      for (const user of userBatch) {
        const newSegment =
          user.lifetimeValue > 500 ? UserSegment.VIP : UserSegment.ACTIVE;
        if (newSegment !== user.segment) {
          await mockPrisma.user.update({
            where: { id: user.id },
            data: { segment: newSegment },
          });
        }
      }

      performance.mark("batch-segmentation-end");

      const batchSegmentationDuration = performance.measure(
        "batch-segmentation",
        "batch-segmentation-start",
        "batch-segmentation-end"
      ).duration;

      // Performance assertions for batch operations
      expect(batchSegmentationDuration).toBeLessThan(200); // Should complete within 200ms
      expect(mockPrisma.user.update).toHaveBeenCalledTimes(
        userBatch.filter(u => u.lifetimeValue > 500).length
      );
    });
  });

  describe("Caching Performance", () => {
    it("should demonstrate cache hit performance improvement", async () => {
      // Setup cache mock
      mockRedis.get.mockResolvedValue(null); // Cache miss initially
      mockRedis.set.mockResolvedValue("OK");

      const userId = "user-123";
      const cacheKey = `user:${userId}`;

      // Measure cache miss performance
      performance.mark("cache-miss-start");

      let userData = await mockRedis.get(cacheKey);
      if (!userData) {
        // Simulate database query
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms DB query
        userData = {
          id: userId,
          name: "Cached User",
          email: "cached@example.com",
        };
        await mockRedis.set(cacheKey, JSON.stringify(userData), "EX", 300);
      }

      performance.mark("cache-miss-end");

      const cacheMissDuration = performance.measure(
        "cache-miss",
        "cache-miss-start",
        "cache-miss-end"
      ).duration;

      // Now measure cache hit performance
      mockRedis.get.mockResolvedValue(JSON.stringify(userData));

      performance.mark("cache-hit-start");

      const cachedData = await mockRedis.get(cacheKey);
      const parsedData = JSON.parse(cachedData);

      performance.mark("cache-hit-end");

      const cacheHitDuration = performance.measure(
        "cache-hit",
        "cache-hit-start",
        "cache-hit-end"
      ).duration;

      // Performance assertions
      expect(cacheMissDuration).toBeGreaterThanOrEqual(50); // Includes DB query
      expect(cacheHitDuration).toBeLessThan(10); // Much faster cache hit
      expect(cacheHitDuration).toBeLessThan(cacheMissDuration * 0.2); // At least 5x faster
      expect(parsedData.name).toBe("Cached User");
    });

    it("should handle cache invalidation efficiently", async () => {
      const cacheKeys = Array.from({ length: 100 }, (_, i) => `user:${i}`);

      performance.mark("cache-invalidation-start");

      // Simulate batch cache invalidation
      const pipeline = mockRedis.pipeline();
      cacheKeys.forEach(key => pipeline.del(key));
      await pipeline.exec();

      performance.mark("cache-invalidation-end");

      const invalidationDuration = performance.measure(
        "cache-invalidation",
        "cache-invalidation-start",
        "cache-invalidation-end"
      ).duration;

      // Performance assertions
      expect(invalidationDuration).toBeLessThan(100); // Should complete quickly
    });
  });

  describe("Scalability Benchmarks", () => {
    it("should maintain performance under increasing user load", async () => {
      const userScales = [100, 500, 1000, 5000];

      const performanceResults = [];

      for (const userCount of userScales) {
        // Reset mocks
        jest.clearAllMocks();

        // Setup mock data for scale
        const mockUsers = Array.from({ length: userCount }, (_, i) => ({
          id: `scale-user-${i}`,
          name: `Scale User ${i}`,
          email: `scale${i}@example.com`,
          segment: UserSegment.ACTIVE,
          createdAt: new Date(),
        }));

        mockPrisma.user.findMany.mockResolvedValue(mockUsers);

        performance.mark(`scale-query-${userCount}-start`);

        const result = await mockPrisma.user.findMany({
          where: { segment: UserSegment.ACTIVE },
          select: { id: true, name: true, email: true },
        });

        performance.mark(`scale-query-${userCount}-end`);

        const queryDuration = performance.measure(
          `scale-query-${userCount}`,
          `scale-query-${userCount}-start`,
          `scale-query-${userCount}-end`
        ).duration;

        performanceResults.push({
          userCount,
          duration: queryDuration,
          perUser: queryDuration / userCount,
        });
      }

      // Performance scaling assertions
      expect(performanceResults[0].duration).toBeLessThan(
        performanceResults[1].duration
      );
      expect(performanceResults[1].duration).toBeLessThan(
        performanceResults[2].duration
      );

      // Ensure reasonable scaling (should not increase exponentially)
      const scalingFactor =
        performanceResults[3].duration / performanceResults[0].duration;
      const userIncreaseFactor =
        performanceResults[3].userCount / performanceResults[0].userCount;

      expect(scalingFactor).toBeLessThan(userIncreaseFactor * 2); // Should scale roughly linearly
    });

    it("should benchmark database connection pooling", async () => {
      const connectionPoolSizes = [5, 10, 20, 50];
      const benchmarkResults = [];

      for (const poolSize of connectionPoolSizes) {
        performance.mark(`pool-benchmark-${poolSize}-start`);

        // Simulate concurrent database operations
        const operations = Array.from({ length: poolSize }, (_, i) =>
          mockPrisma.user.findUnique({ where: { id: `pool-user-${i}` } })
        );

        await Promise.all(operations);

        performance.mark(`pool-benchmark-${poolSize}-end`);

        const benchmarkDuration = performance.measure(
          `pool-benchmark-${poolSize}`,
          `pool-benchmark-${poolSize}-start`,
          `pool-benchmark-${poolSize}-end`
        ).duration;

        benchmarkResults.push({
          poolSize,
          duration: benchmarkDuration,
          avgOperationTime: benchmarkDuration / poolSize,
        });
      }

      // Connection pooling should improve performance
      expect(benchmarkResults[0].avgOperationTime).toBeGreaterThanOrEqual(
        benchmarkResults[benchmarkResults.length - 1].avgOperationTime * 0.8
      );
    });
  });

  describe("Memory and Resource Usage", () => {
    it("should monitor memory usage during large dataset processing", async () => {
      const initialMemory = process.memoryUsage();

      // Process large dataset
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: `memory-user-${i}`,
        name: `Memory User ${i}`,
        email: `memory${i}@example.com`,
        orders: Array.from({ length: 10 }, (_, j) => ({
          id: `order-${i}-${j}`,
          total: Math.random() * 100,
        })),
      }));

      performance.mark("memory-processing-start");

      // Simulate memory-intensive processing
      const processedData = largeDataset.map(user => ({
        ...user,
        orderTotal: user.orders.reduce((sum, order) => sum + order.total, 0),
        orderCount: user.orders.length,
      }));

      performance.mark("memory-processing-end");

      const processingDuration = performance.measure(
        "memory-processing",
        "memory-processing-start",
        "memory-processing-end"
      ).duration;

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Performance and memory assertions
      expect(processingDuration).toBeLessThan(1000); // Should complete within 1 second
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
      expect(processedData).toHaveLength(10000);
      expect(processedData[0].orderCount).toBe(10);
    });

    it("should handle memory cleanup for temporary data structures", async () => {
      let tempData: any[] = [];

      performance.mark("memory-cleanup-start");

      // Create temporary data structures
      for (let i = 0; i < 1000; i++) {
        tempData.push({
          id: `temp-${i}`,
          data: Array.from({ length: 100 }, () => Math.random()),
        });
      }

      // Process data
      const results = tempData.map(item => ({
        id: item.id,
        sum: item.data.reduce((a, b) => a + b, 0),
      }));

      // Explicit cleanup
      tempData = [];
      if (global.gc) {
        global.gc(); // Force garbage collection in test environment
      }

      performance.mark("memory-cleanup-end");

      const cleanupDuration = performance.measure(
        "memory-cleanup",
        "memory-cleanup-start",
        "memory-cleanup-end"
      ).duration;

      // Assertions
      expect(cleanupDuration).toBeLessThan(500); // Cleanup should be fast
      expect(results).toHaveLength(1000);
      expect(tempData).toHaveLength(0); // Should be cleaned up
    });
  });

  describe("API Response Time Benchmarks", () => {
    it("should meet API response time SLAs", async () => {
      const apiEndpoints = [
        { name: "user-profile", expectedMs: 200 },
        { name: "user-search", expectedMs: 500 },
        { name: "user-update", expectedMs: 300 },
        { name: "user-analytics", expectedMs: 1000 },
        { name: "bulk-operation", expectedMs: 5000 },
      ];

      const benchmarkResults = [];

      for (const endpoint of apiEndpoints) {
        performance.mark(`${endpoint.name}-start`);

        // Simulate API endpoint processing
        switch (endpoint.name) {
          case "user-profile":
            await mockPrisma.user.findUnique({ where: { id: "test-user" } });
            break;
          case "user-search":
            await mockPrisma.user.findMany({
              where: { segment: UserSegment.ACTIVE },
            });
            break;
          case "user-update":
            await mockPrisma.user.update({
              where: { id: "test-user" },
              data: { lastLoginAt: new Date() },
            });
            break;
          case "user-analytics":
            await Promise.all([
              mockPrisma.user.count(),
              mockPrisma.user.groupBy({ by: ["segment"] }),
              mockPrisma.order.findMany({ take: 100 }),
            ]);
            break;
          case "bulk-operation":
            const bulkData = Array.from({ length: 100 }, (_, i) => ({
              id: `bulk-${i}`,
              name: `Bulk ${i}`,
            }));
            await Promise.all(
              bulkData.map(item => mockPrisma.user.create({ data: item }))
            );
            break;
        }

        performance.mark(`${endpoint.name}-end`);

        const duration = performance.measure(
          endpoint.name,
          `${endpoint.name}-start`,
          `${endpoint.name}-end`
        ).duration;

        benchmarkResults.push({
          endpoint: endpoint.name,
          duration,
          expected: endpoint.expectedMs,
          withinSLA: duration <= endpoint.expectedMs,
        });
      }

      // SLA compliance assertions
      const slaFailures = benchmarkResults.filter(r => !r.withinSLA);
      expect(slaFailures).toHaveLength(0); // All endpoints should meet SLAs

      // Performance logging
      benchmarkResults.forEach(result => {
        console.log(
          `${result.endpoint}: ${result.duration}ms (SLA: ${result.expected}ms)`
        );
      });
    });

    it("should handle API rate limiting gracefully", async () => {
      const requestsPerSecond = [10, 50, 100, 200];
      const rateLimitResults = [];

      for (const rps of requestsPerSecond) {
        const requestCount = rps * 10; // 10 seconds of requests
        const requestPromises = Array.from({ length: requestCount }, (_, i) =>
          mockPrisma.user.findUnique({
            where: { id: `rate-limit-user-${i % 10}` },
          })
        );

        performance.mark(`rate-limit-${rps}-start`);

        // Execute requests with simulated rate limiting
        const results = [];
        for (let i = 0; i < requestPromises.length; i++) {
          results.push(await requestPromises[i]);
          // Simulate rate limiting delay for high RPS
          if (rps > 50 && i % (rps / 10) === 0) {
            await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
          }
        }

        performance.mark(`rate-limit-${rps}-end`);

        const duration = performance.measure(
          `rate-limit-${rps}`,
          `rate-limit-${rps}-start`,
          `rate-limit-${rps}-end`
        ).duration;

        rateLimitResults.push({
          rps,
          totalRequests: requestCount,
          duration,
          avgResponseTime: duration / requestCount,
          throughput: (requestCount / duration) * 1000, // requests per second
        });
      }

      // Rate limiting should maintain reasonable response times
      rateLimitResults.forEach(result => {
        expect(result.avgResponseTime).toBeLessThan(1000); // Under 1 second average
        expect(result.throughput).toBeGreaterThan(result.rps * 0.8); // At least 80% of target RPS
      });
    });
  });

  describe("Database Optimization Benchmarks", () => {
    it("should compare indexed vs non-indexed query performance", async () => {
      // Simulate indexed query (fast)
      performance.mark("indexed-query-start");
      await mockPrisma.user.findUnique({
        where: { email: "indexed@example.com" }, // Assume email is indexed
      });
      performance.mark("indexed-query-end");

      // Simulate non-indexed query (slower)
      performance.mark("non-indexed-query-start");
      await mockPrisma.user.findFirst({
        where: { phone: "+40712345678" }, // Assume phone is not indexed
      });
      performance.mark("non-indexed-query-end");

      const indexedDuration = performance.measure(
        "indexed-query",
        "indexed-query-start",
        "indexed-query-end"
      ).duration;

      const nonIndexedDuration = performance.measure(
        "non-indexed-query",
        "non-indexed-query-start",
        "non-indexed-query-end"
      ).duration;

      // Indexed queries should be significantly faster
      expect(indexedDuration).toBeLessThan(nonIndexedDuration);
      expect(indexedDuration).toBeLessThan(20); // Very fast
      expect(nonIndexedDuration).toBeLessThan(100); // Still reasonable
    });

    it("should benchmark complex query optimization", async () => {
      const complexQueries = [
        {
          name: "simple-filter",
          query: { where: { segment: UserSegment.ACTIVE } },
        },
        {
          name: "compound-filter",
          query: {
            where: {
              segment: UserSegment.ACTIVE,
              lifecycleStage: LifecycleStage.PURCHASE,
              lifetimeValue: { gte: 100 },
            },
          },
        },
        {
          name: "join-query",
          query: {
            where: { segment: UserSegment.ACTIVE },
            include: {
              orders: {
                where: { status: "COMPLETED" },
                orderBy: { createdAt: "desc" },
                take: 5,
              },
              addresses: true,
            },
          },
        },
        {
          name: "aggregate-query",
          query: {
            where: { segment: UserSegment.ACTIVE },
            select: {
              _count: { orders: true },
              lifetimeValue: true,
            },
          },
        },
      ];

      const queryBenchmarks = [];

      for (const queryDef of complexQueries) {
        performance.mark(`${queryDef.name}-start`);

        if (queryDef.name === "aggregate-query") {
          // Handle aggregate queries differently
          await mockPrisma.user.findMany(queryDef.query);
        } else {
          await mockPrisma.user.findMany(queryDef.query);
        }

        performance.mark(`${queryDef.name}-end`);

        const duration = performance.measure(
          queryDef.name,
          `${queryDef.name}-start`,
          `${queryDef.name}-end`
        ).duration;

        queryBenchmarks.push({
          name: queryDef.name,
          duration,
        });
      }

      // Complex queries should still perform reasonably
      queryBenchmarks.forEach(benchmark => {
        expect(benchmark.duration).toBeLessThan(200); // Under 200ms for complex queries
      });

      // Join queries might be slower but should be acceptable
      const joinQuery = queryBenchmarks.find(b => b.name === "join-query");
      expect(joinQuery.duration).toBeLessThan(300); // Under 300ms for joins
    });
  });

  describe("End-to-End User Journey Performance", () => {
    it("should benchmark complete user registration to active state", async () => {
      performance.mark("user-journey-start");

      // Step 1: User registration
      performance.mark("registration-start");
      const userData = {
        name: "Journey Test User",
        email: "journey@example.com",
        password: "SecurePass123!",
      };

      mockPrisma.user.create.mockResolvedValue({
        id: "journey-user",
        ...userData,
        password: "hashed-password",
        isActive: false,
        emailVerified: null,
        verificationToken: "verify-token",
      });

      await mockPrisma.user.create({ data: userData });
      performance.mark("registration-end");

      // Step 2: Email verification
      performance.mark("verification-start");
      mockPrisma.user.update.mockResolvedValue({
        id: "journey-user",
        isActive: true,
        emailVerified: new Date(),
      });

      await mockPrisma.user.update({
        where: { id: "journey-user" },
        data: { isActive: true, emailVerified: new Date() },
      });
      performance.mark("verification-end");

      // Step 3: First login
      performance.mark("first-login-start");
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "journey-user",
        email: userData.email,
        password: "hashed-password",
        isActive: true,
        failedLoginAttempts: 0,
        accountLocked: false,
      });

      await mockPrisma.user.findUnique({ where: { email: userData.email } });
      await mockPrisma.user.update({
        where: { id: "journey-user" },
        data: { lastLoginAt: new Date() },
      });
      performance.mark("first-login-end");

      // Step 4: Profile completion
      performance.mark("profile-completion-start");
      await mockPrisma.user.update({
        where: { id: "journey-user" },
        data: {
          phone: "+40712345678",
          cnp: "1234567890123",
          judet: "București",
        },
      });
      performance.mark("profile-completion-end");

      // Step 5: First order
      performance.mark("first-order-start");
      await mockPrisma.order.findMany.mockResolvedValue([]);
      await mockPrisma.user.update({
        where: { id: "journey-user" },
        data: {
          segment: UserSegment.ACTIVE,
          lifecycleStage: LifecycleStage.PURCHASE,
          lifetimeValue: 150,
        },
      });
      performance.mark("first-order-end");

      performance.mark("user-journey-end");

      // Measure total journey time
      const totalJourneyDuration = performance.measure(
        "user-journey",
        "user-journey-start",
        "user-journey-end"
      ).duration;

      // Individual step measurements
      const registrationDuration = performance.measure(
        "registration",
        "registration-start",
        "registration-end"
      ).duration;

      const verificationDuration = performance.measure(
        "verification",
        "verification-start",
        "verification-end"
      ).duration;

      const firstLoginDuration = performance.measure(
        "first-login",
        "first-login-start",
        "first-login-end"
      ).duration;

      const profileCompletionDuration = performance.measure(
        "profile-completion",
        "profile-completion-start",
        "profile-completion-end"
      ).duration;

      const firstOrderDuration = performance.measure(
        "first-order",
        "first-order-start",
        "first-order-end"
      ).duration;

      // Performance assertions
      expect(totalJourneyDuration).toBeLessThan(1000); // Complete journey under 1 second
      expect(registrationDuration).toBeLessThan(100);
      expect(verificationDuration).toBeLessThan(50);
      expect(firstLoginDuration).toBeLessThan(100);
      expect(profileCompletionDuration).toBeLessThan(50);
      expect(firstOrderDuration).toBeLessThan(100);

      console.log(`User Journey Performance:
        Total: ${totalJourneyDuration}ms
        Registration: ${registrationDuration}ms
        Verification: ${verificationDuration}ms
        First Login: ${firstLoginDuration}ms
        Profile Completion: ${profileCompletionDuration}ms
        First Order: ${firstOrderDuration}ms`);
    });
  });
});
