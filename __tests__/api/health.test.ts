/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { GET, HEAD } from "@/app/api/health/route";

// Mock Prisma client
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $queryRaw: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

describe("/api/health", () => {
  let mockPrisma: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Get the mocked Prisma instance
    const { PrismaClient } = require("@prisma/client");
    mockPrisma = new PrismaClient();
    
    // Mock successful database connection by default
    mockPrisma.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    mockPrisma.$disconnect.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("GET /api/health", () => {
    it("should return healthy status when all checks pass", async () => {
      // Arrange
      const request = new NextRequest("http://localhost:3000/api/health");

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.status).toBe("healthy");
      expect(data.checks.database).toBe("healthy");
      expect(data.checks.memory).toBeDefined();
      expect(data.checks.storage).toBeDefined();
      expect(data.timestamp).toBeDefined();
      expect(data.responseTime).toBeDefined();
      expect(data.memory).toBeDefined();
      expect(mockPrisma.$queryRaw).toHaveBeenCalledWith(expect.arrayContaining(["SELECT 1"]));
      expect(mockPrisma.$disconnect).toHaveBeenCalled();
    });

    it("should return degraded status when database is unhealthy", async () => {
      // Arrange
      mockPrisma.$queryRaw.mockRejectedValue(new Error("Database connection failed"));
      const request = new NextRequest("http://localhost:3000/api/health");

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200); // Still 200 for degraded
      expect(data.status).toBe("degraded");
      expect(data.checks.database).toBe("unhealthy");
      expect(mockPrisma.$disconnect).toHaveBeenCalled();
    });

    it("should return unhealthy status when multiple critical systems fail", async () => {
      // Arrange
      mockPrisma.$queryRaw.mockRejectedValue(new Error("Database connection failed"));
      
      // Mock high memory usage to trigger critical memory status
      const originalMemoryUsage = process.memoryUsage;
      (process as any).memoryUsage = jest.fn(() => ({
        rss: 1000000000, // 1GB
        heapTotal: 900000000, // 900MB
        heapUsed: 850000000, // 850MB (over 800MB threshold)
        external: 10000000,
        arrayBuffers: 1000000
      }));

      const request = new NextRequest("http://localhost:3000/api/health");

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(503);
      expect(data.status).toBe("unhealthy");
      expect(data.checks.database).toBe("unhealthy");
      expect(data.checks.memory).toBe("critical");

      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });

    it("should handle unexpected errors gracefully", async () => {
      // Arrange
      mockPrisma.$queryRaw.mockImplementation(() => {
        throw new Error("Unexpected error");
      });
      const request = new NextRequest("http://localhost:3000/api/health");

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(503);
      expect(data.status).toBe("unhealthy");
      expect(data.error).toBe("Health check failed");
      expect(data.responseTime).toBeDefined();
    });

    it("should include environment and version information", async () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      const originalVersion = process.env.npm_package_version;
      
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'test',
        configurable: true
      });
      Object.defineProperty(process.env, 'npm_package_version', {
        value: '1.0.0',
        configurable: true
      });
      
      const request = new NextRequest("http://localhost:3000/api/health");

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(data.environment).toBe("test");
      expect(data.version).toBe("1.0.0");
      expect(data.uptime).toBeGreaterThan(0);

      // Restore environment
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        configurable: true
      });
      Object.defineProperty(process.env, 'npm_package_version', {
        value: originalVersion,
        configurable: true
      });
    });

    it("should measure response time accurately", async () => {
      // Arrange
      const request = new NextRequest("http://localhost:3000/api/health");

      // Act
      const startTime = Date.now();
      const response = await GET(request);
      const endTime = Date.now();
      const data = await response.json();

      // Assert
      const measuredTime = endTime - startTime;
      const reportedTime = parseInt(data.responseTime.replace("ms", ""));
      
      // Allow some tolerance for timing differences
      expect(reportedTime).toBeGreaterThanOrEqual(0);
      expect(reportedTime).toBeLessThanOrEqual(measuredTime + 50); // 50ms tolerance
    });
  });

  describe("HEAD /api/health", () => {
    it("should return 200 when database is healthy", async () => {
      // Act
      const response = await HEAD();

      // Assert
      expect(response.status).toBe(200);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledWith(expect.arrayContaining(["SELECT 1"]));
      expect(mockPrisma.$disconnect).toHaveBeenCalled();
    });

    it("should return 503 when database is unhealthy", async () => {
      // Arrange
      mockPrisma.$queryRaw.mockRejectedValue(new Error("Database connection failed"));

      // Act
      const response = await HEAD();

      // Assert
      expect(response.status).toBe(503);
      expect(mockPrisma.$disconnect).toHaveBeenCalled();
    });

    it("should handle disconnect errors gracefully", async () => {
      // Arrange
      mockPrisma.$disconnect.mockRejectedValue(new Error("Disconnect failed"));

      // Act
      const response = await HEAD();

      // Assert
      expect(response.status).toBe(200); // Should still succeed despite disconnect error
    });
  });

  describe("Memory usage calculations", () => {
    it("should correctly categorize memory usage levels", async () => {
      const testCases = [
        { heapUsed: 400 * 1024 * 1024, expected: "healthy" }, // 400MB
        { heapUsed: 600 * 1024 * 1024, expected: "warning" }, // 600MB
        { heapUsed: 850 * 1024 * 1024, expected: "critical" }, // 850MB
      ];

      for (const testCase of testCases) {
        // Arrange
        const originalMemoryUsage = process.memoryUsage;
        (process as any).memoryUsage = jest.fn(() => ({
          rss: testCase.heapUsed + 100000000,
          heapTotal: testCase.heapUsed + 50000000,
          heapUsed: testCase.heapUsed,
          external: 10000000,
          arrayBuffers: 1000000
        }));

        const request = new NextRequest("http://localhost:3000/api/health");

        // Act
        const response = await GET(request);
        const data = await response.json();

        // Assert
        expect(data.checks.memory).toBe(testCase.expected);

        // Restore
        process.memoryUsage = originalMemoryUsage;
      }
    });
  });
}); 