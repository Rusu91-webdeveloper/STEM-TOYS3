import { PrismaClient } from "@prisma/client";
import { getCache } from "@/lib/cache/redis-cache";
import { getReplicationManager } from "@/lib/database/replication-manager";
import { getCircuitBreakerRegistry } from "@/lib/circuit-breaker";
import { logger } from "@/lib/logger";

export interface HealthCheckResult {
  service: string;
  status: "HEALTHY" | "UNHEALTHY" | "DEGRADED";
  responseTime: number;
  message?: string;
  details?: Record<string, any>;
}

export interface SystemHealth {
  overall: "HEALTHY" | "UNHEALTHY" | "DEGRADED";
  timestamp: Date;
  checks: HealthCheckResult[];
  uptime: number;
  version: string;
}

/**
 * Health Check Service for Phase 5 High Availability
 * Comprehensive health monitoring for all user-related services
 */
export class HealthCheckService {
  private startTime = Date.now();
  private prisma: PrismaClient;
  private cache = getCache();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Run comprehensive health check
   */
  async runFullHealthCheck(): Promise<SystemHealth> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkCache(),
      this.checkReplication(),
      this.checkCircuitBreakers(),
      this.checkExternalServices(),
      this.checkUserServices(),
      this.checkPerformanceMetrics(),
    ]);

    const overall = this.determineOverallHealth(checks);

    const health: SystemHealth = {
      overall,
      timestamp: new Date(),
      checks,
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || "1.0.0",
    };

    // Log unhealthy services
    const unhealthyChecks = checks.filter(check => check.status !== "HEALTHY");
    if (unhealthyChecks.length > 0) {
      logger.warn("Health check found unhealthy services", {
        unhealthyCount: unhealthyChecks.length,
        services: unhealthyChecks.map(c => ({
          service: c.service,
          status: c.status,
          message: c.message,
        })),
      });
    }

    return health;
  }

  /**
   * Check database connectivity and performance
   */
  private async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Test basic connectivity
      await this.prisma.$queryRaw`SELECT 1 as health_check`;

      // Test user table access
      const userCount = await this.prisma.user.count({ take: 1 });

      // Test a more complex query with indexes
      const recentUsers = await this.prisma.user.findMany({
        where: { dataArchiveStatus: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, createdAt: true },
      });

      const responseTime = Date.now() - startTime;

      return {
        service: "database",
        status: responseTime > 1000 ? "DEGRADED" : "HEALTHY",
        responseTime,
        message: `Database healthy. User count: ${userCount}, Recent users: ${recentUsers.length}`,
        details: {
          userCount,
          recentUsersCount: recentUsers.length,
          connectionPoolSize: 10, // Would be actual pool size
        },
      };
    } catch (error) {
      return {
        service: "database",
        status: "UNHEALTHY",
        responseTime: Date.now() - startTime,
        message: `Database check failed: ${error.message}`,
        details: { error: error.message },
      };
    }
  }

  /**
   * Check Redis cache health
   */
  private async checkCache(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Test basic cache operations
      const testKey = `health-check-${Date.now()}`;
      await this.cache.set(testKey, { test: true }, { ttl: 10 });
      const retrieved = await this.cache.get(testKey);
      await this.cache.delete(testKey);

      const stats = await this.cache.getStats();
      const responseTime = Date.now() - startTime;

      const isHealthy = retrieved && retrieved.test === true;

      return {
        service: "cache",
        status: isHealthy ? "HEALTHY" : "UNHEALTHY",
        responseTime,
        message: isHealthy ? "Cache healthy" : "Cache read/write failed",
        details: {
          connected: stats.connected,
          totalKeys: stats.totalKeys,
          memoryUsage: stats.memoryUsage,
        },
      };
    } catch (error) {
      return {
        service: "cache",
        status: "UNHEALTHY",
        responseTime: Date.now() - startTime,
        message: `Cache check failed: ${error.message}`,
        details: { error: error.message },
      };
    }
  }

  /**
   * Check database replication health
   */
  private async checkReplication(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const replicationManager = getReplicationManager();
      const health = await replicationManager.getReplicationHealth();

      const responseTime = Date.now() - startTime;
      const healthyReplicas = health.replicas.filter(r => r.isActive).length;

      let status: "HEALTHY" | "UNHEALTHY" | "DEGRADED" = "HEALTHY";
      if (health.overallHealth === "UNHEALTHY" || !health.primary.isHealthy) {
        status = "UNHEALTHY";
      } else if (health.overallHealth === "DEGRADED" || healthyReplicas === 0) {
        status = "DEGRADED";
      }

      return {
        service: "replication",
        status,
        responseTime,
        message: `Replication ${health.overallHealth.toLowerCase()}. Primary: ${health.primary.isHealthy ? "healthy" : "unhealthy"}, Replicas: ${healthyReplicas}/${health.replicas.length}`,
        details: {
          primaryHealthy: health.primary.isHealthy,
          totalReplicas: health.replicas.length,
          healthyReplicas,
          failoverInProgress: health.failoverInProgress,
        },
      };
    } catch (error) {
      return {
        service: "replication",
        status: "UNHEALTHY",
        responseTime: Date.now() - startTime,
        message: `Replication check failed: ${error.message}`,
        details: { error: error.message },
      };
    }
  }

  /**
   * Check circuit breaker status
   */
  private async checkCircuitBreakers(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const registry = getCircuitBreakerRegistry();
      const stats = registry.getAllStats();
      const openBreakers = registry.getOpenBreakers();

      const responseTime = Date.now() - startTime;
      const totalBreakers = Object.keys(stats).length;

      let status: "HEALTHY" | "DEGRADED" = "HEALTHY";
      if (openBreakers.length > 0) {
        status = "DEGRADED";
      }

      return {
        service: "circuit-breakers",
        status,
        responseTime,
        message: `${totalBreakers} circuit breakers monitored. Open breakers: ${openBreakers.length}`,
        details: {
          totalBreakers,
          openBreakers,
          breakerStats: stats,
        },
      };
    } catch (error) {
      return {
        service: "circuit-breakers",
        status: "UNHEALTHY",
        responseTime: Date.now() - startTime,
        message: `Circuit breaker check failed: ${error.message}`,
        details: { error: error.message },
      };
    }
  }

  /**
   * Check external service dependencies
   */
  private async checkExternalServices(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const externalServices = [
      { name: "email-service", url: process.env.SMTP_HOST },
      {
        name: "payment-service",
        url: process.env.STRIPE_SECRET_KEY ? "configured" : null,
      },
      {
        name: "storage-service",
        url: process.env.AWS_S3_BUCKET ? "configured" : null,
      },
    ];

    const serviceChecks = await Promise.all(
      externalServices.map(async service => {
        try {
          // Basic configuration check (in real implementation, you'd ping the services)
          const isConfigured = !!service.url;
          return { name: service.name, configured: isConfigured, error: null };
        } catch (error) {
          return {
            name: service.name,
            configured: false,
            error: error.message,
          };
        }
      })
    );

    const configuredServices = serviceChecks.filter(s => s.configured).length;
    const responseTime = Date.now() - startTime;

    return {
      service: "external-services",
      status:
        configuredServices === externalServices.length ? "HEALTHY" : "DEGRADED",
      responseTime,
      message: `${configuredServices}/${externalServices.length} external services configured`,
      details: { services: serviceChecks },
    };
  }

  /**
   * Check user-specific service health
   */
  private async checkUserServices(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Test user service operations
      const userCount = await this.prisma.user.count();
      const activeUsers = await this.prisma.user.count({
        where: { isActive: true },
      });
      const recentUsers = await this.prisma.user.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      const responseTime = Date.now() - startTime;

      return {
        service: "user-services",
        status: responseTime > 2000 ? "DEGRADED" : "HEALTHY",
        responseTime,
        message: `User services healthy. Total: ${userCount}, Active: ${activeUsers}, Recent: ${recentUsers}`,
        details: {
          totalUsers: userCount,
          activeUsers,
          recentUsers,
          avgResponseTime: responseTime,
        },
      };
    } catch (error) {
      return {
        service: "user-services",
        status: "UNHEALTHY",
        responseTime: Date.now() - startTime,
        message: `User services check failed: ${error.message}`,
        details: { error: error.message },
      };
    }
  }

  /**
   * Check system performance metrics
   */
  private async checkPerformanceMetrics(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Check memory usage
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      // Check event loop lag (simplified)
      const eventLoopLag = 0; // Would be measured in real implementation

      const responseTime = Date.now() - startTime;

      // Determine status based on resource usage
      let status: "HEALTHY" | "DEGRADED" = "HEALTHY";
      if (memUsage.heapUsed / memUsage.heapTotal > 0.9) {
        // >90% heap usage
        status = "DEGRADED";
      }

      return {
        service: "performance",
        status,
        responseTime,
        message: `Performance metrics collected`,
        details: {
          memory: {
            used: Math.round(memUsage.heapUsed / 1024 / 1024),
            total: Math.round(memUsage.heapTotal / 1024 / 1024),
            percentage: Math.round(
              (memUsage.heapUsed / memUsage.heapTotal) * 100
            ),
          },
          cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system,
          },
          eventLoopLag,
          uptime: Math.round((Date.now() - this.startTime) / 1000),
        },
      };
    } catch (error) {
      return {
        service: "performance",
        status: "UNHEALTHY",
        responseTime: Date.now() - startTime,
        message: `Performance check failed: ${error.message}`,
        details: { error: error.message },
      };
    }
  }

  /**
   * Determine overall system health
   */
  private determineOverallHealth(
    checks: HealthCheckResult[]
  ): "HEALTHY" | "UNHEALTHY" | "DEGRADED" {
    const unhealthyCount = checks.filter(c => c.status === "UNHEALTHY").length;
    const degradedCount = checks.filter(c => c.status === "DEGRADED").length;

    if (unhealthyCount > 0) {
      return "UNHEALTHY";
    }

    if (degradedCount > 0) {
      return "DEGRADED";
    }

    return "HEALTHY";
  }

  /**
   * Get quick health status (for load balancers)
   */
  async getQuickHealth(): Promise<{ status: "ok" | "error"; timestamp: Date }> {
    try {
      // Quick database check
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: "ok",
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: "error",
        timestamp: new Date(),
      };
    }
  }
}

// Singleton instance
let healthCheckInstance: HealthCheckService | null = null;

/**
 * Get the global health check service instance
 */
export function getHealthCheckService(): HealthCheckService {
  if (!healthCheckInstance) {
    const prisma = new PrismaClient();
    healthCheckInstance = new HealthCheckService(prisma);
  }

  return healthCheckInstance;
}
