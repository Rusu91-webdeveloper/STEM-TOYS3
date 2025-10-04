import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";

export interface ConnectionPoolConfig {
  maxConnections: number;
  minConnections: number;
  acquireTimeoutMillis: number;
  createTimeoutMillis: number;
  destroyTimeoutMillis: number;
  reapIntervalMillis: number;
  createRetryIntervalMillis: number;
  propagateCreateError: boolean;
}

export interface QueryOptimizationConfig {
  enableQueryLogging: boolean;
  slowQueryThreshold: number;
  enableQueryCache: boolean;
  maxQueryCacheSize: number;
  enableConnectionPooling: boolean;
  connectionPoolSize: number;
}

/**
 * Database connection pool manager with performance optimizations
 */
export class DatabaseConnectionPool {
  private prisma: PrismaClient;
  private config: ConnectionPoolConfig;
  private queryStats: Map<
    string,
    {
      count: number;
      totalTime: number;
      avgTime: number;
      lastExecuted: Date;
    }
  > = new Map();

  constructor(config: Partial<ConnectionPoolConfig> = {}) {
    this.config = {
      maxConnections: parseInt(process.env.DATABASE_POOL_SIZE || "20"),
      minConnections: parseInt(process.env.DATABASE_MIN_CONNECTIONS || "2"),
      acquireTimeoutMillis: parseInt(
        process.env.DATABASE_ACQUIRE_TIMEOUT || "60000"
      ),
      createTimeoutMillis: parseInt(
        process.env.DATABASE_CREATE_TIMEOUT || "30000"
      ),
      destroyTimeoutMillis: parseInt(
        process.env.DATABASE_DESTROY_TIMEOUT || "5000"
      ),
      reapIntervalMillis: parseInt(
        process.env.DATABASE_REAP_INTERVAL || "1000"
      ),
      createRetryIntervalMillis: parseInt(
        process.env.DATABASE_CREATE_RETRY_INTERVAL || "200"
      ),
      propagateCreateError: false,
      ...config,
    };

    this.prisma = new PrismaClient({
      log: this.getPrismaLogConfig(),
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Set up performance monitoring
    this.setupPerformanceMonitoring();
  }

  /**
   * Get the Prisma client instance
   */
  getClient(): PrismaClient {
    return this.prisma;
  }

  /**
   * Execute a query with performance monitoring
   */
  async executeQuery<T>(
    operation: string,
    queryFn: () => Promise<T>,
    options: {
      enableCache?: boolean;
      cacheKey?: string;
      cacheTtl?: number;
    } = {}
  ): Promise<T> {
    const startTime = Date.now();
    let success = false;

    try {
      // Check cache first if enabled
      if (options.enableCache && options.cacheKey) {
        const cached = await this.getCachedQuery(options.cacheKey);
        if (cached !== null) {
          this.updateQueryStats(operation, Date.now() - startTime, true);
          return cached;
        }
      }

      const result = await queryFn();
      success = true;

      // Cache result if enabled
      if (options.enableCache && options.cacheKey && options.cacheTtl) {
        await this.setCachedQuery(options.cacheKey, result, options.cacheTtl);
      }

      return result;
    } finally {
      const executionTime = Date.now() - startTime;
      this.updateQueryStats(operation, executionTime, success);

      // Log slow queries
      const slowQueryThreshold = parseInt(
        process.env.SLOW_QUERY_THRESHOLD || "1000"
      );
      if (executionTime > slowQueryThreshold) {
        logger.warn("Slow query detected", {
          operation,
          executionTime,
          threshold: slowQueryThreshold,
        });
      }
    }
  }

  /**
   * Get database connection pool statistics
   */
  async getPoolStats(): Promise<{
    totalConnections: number;
    idleConnections: number;
    waitingClients: number;
    activeConnections: number;
    poolSize: number;
    poolUsed: number;
  }> {
    try {
      // Execute a raw query to get connection info
      const result = await this.prisma.$queryRaw<
        Array<{
          count: bigint;
          state: string;
        }>
      >`
        SELECT count(*) as count, state
        FROM pg_stat_activity
        WHERE datname = current_database()
        GROUP BY state
      `;

      let totalConnections = 0;
      let idleConnections = 0;
      let activeConnections = 0;

      result.forEach(row => {
        const count = Number(row.count);
        totalConnections += count;

        if (row.state === "idle") {
          idleConnections += count;
        } else {
          activeConnections += count;
        }
      });

      return {
        totalConnections,
        idleConnections,
        waitingClients: Math.max(
          0,
          totalConnections - this.config.maxConnections
        ),
        activeConnections,
        poolSize: this.config.maxConnections,
        poolUsed: (activeConnections / this.config.maxConnections) * 100,
      };
    } catch (error) {
      logger.error("Failed to get pool stats:", error);
      return {
        totalConnections: 0,
        idleConnections: 0,
        waitingClients: 0,
        activeConnections: 0,
        poolSize: this.config.maxConnections,
        poolUsed: 0,
      };
    }
  }

  /**
   * Optimize query performance with indexes
   */
  async analyzeQueryPerformance(): Promise<{
    slowQueries: Array<{
      operation: string;
      avgTime: number;
      count: number;
      totalTime: number;
    }>;
    recommendedIndexes: string[];
    tableStats: Array<{
      table: string;
      rows: number;
      size: string;
    }>;
  }> {
    const slowQueries = Array.from(this.queryStats.entries())
      .filter(([, stats]) => stats.avgTime > 1000) // Queries taking > 1s on average
      .map(([operation, stats]) => ({
        operation,
        avgTime: stats.avgTime,
        count: stats.count,
        totalTime: stats.totalTime,
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10); // Top 10 slowest

    // Get table statistics
    const tableStats = await this.getTableStatistics();

    // Generate index recommendations based on query patterns
    const recommendedIndexes = this.generateIndexRecommendations(slowQueries);

    return {
      slowQueries,
      recommendedIndexes,
      tableStats,
    };
  }

  /**
   * Health check for database connections
   */
  async healthCheck(): Promise<{
    isHealthy: boolean;
    responseTime: number;
    connectionCount: number;
    poolStats: any;
    lastError?: string;
  }> {
    const startTime = Date.now();

    try {
      // Simple health check query
      await this.prisma.$queryRaw`SELECT 1 as health_check`;

      const responseTime = Date.now() - startTime;
      const poolStats = await this.getPoolStats();

      return {
        isHealthy: true,
        responseTime,
        connectionCount: poolStats.totalConnections,
        poolStats,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        isHealthy: false,
        responseTime,
        connectionCount: 0,
        poolStats: null,
        lastError: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Graceful shutdown with connection cleanup
   */
  async shutdown(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      logger.info("Database connection pool shut down gracefully");
    } catch (error) {
      logger.error("Error during database shutdown:", error);
      throw error;
    }
  }

  /**
   * Force refresh database connections
   */
  async refreshConnections(): Promise<boolean> {
    try {
      // Disconnect and reconnect
      await this.prisma.$disconnect();
      await this.prisma.$connect();

      logger.info("Database connections refreshed");
      return true;
    } catch (error) {
      logger.error("Failed to refresh database connections:", error);
      return false;
    }
  }

  // Private methods

  private getPrismaLogConfig() {
    const logs: Array<"query" | "info" | "warn" | "error"> = ["error"];

    if (process.env.DB_LOGGING === "true") {
      logs.push("query", "info", "warn");
    }

    return logs;
  }

  private setupPerformanceMonitoring() {
    // Monitor Prisma queries
    this.prisma.$on("query", e => {
      const executionTime = e.duration;
      const query = e.query;

      // Extract operation type from query
      const operation = this.extractOperationFromQuery(query);

      this.updateQueryStats(operation, executionTime, true);
    });

    // Periodic cleanup of old stats
    setInterval(() => {
      this.cleanupOldStats();
    }, 300000); // Clean up every 5 minutes
  }

  private extractOperationFromQuery(query: string): string {
    const lowerQuery = query.toLowerCase().trim();

    if (lowerQuery.startsWith("select")) {
      return "SELECT";
    } else if (lowerQuery.startsWith("insert")) {
      return "INSERT";
    } else if (lowerQuery.startsWith("update")) {
      return "UPDATE";
    } else if (lowerQuery.startsWith("delete")) {
      return "DELETE";
    } else {
      return "OTHER";
    }
  }

  private updateQueryStats(
    operation: string,
    executionTime: number,
    success: boolean
  ) {
    const existing = this.queryStats.get(operation) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      lastExecuted: new Date(),
    };

    existing.count++;
    existing.totalTime += executionTime;
    existing.avgTime = existing.totalTime / existing.count;
    existing.lastExecuted = new Date();

    this.queryStats.set(operation, existing);
  }

  private async getCachedQuery(key: string): Promise<any> {
    // In a real implementation, you'd check Redis cache here
    // For now, return null (no caching)
    return null;
  }

  private async setCachedQuery(
    key: string,
    value: any,
    ttl: number
  ): Promise<void> {
    // In a real implementation, you'd set Redis cache here
    // For now, do nothing
  }

  private async getTableStatistics(): Promise<
    Array<{
      table: string;
      rows: number;
      size: string;
    }>
  > {
    try {
      const result = await this.prisma.$queryRaw<
        Array<{
          table_name: string;
          row_count: bigint;
          size: string;
        }>
      >`
        SELECT
          schemaname || '.' || tablename as table_name,
          n_tup_ins - n_tup_del as row_count,
          pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as size
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
        LIMIT 20
      `;

      return result.map(row => ({
        table: row.table_name,
        rows: Number(row.row_count),
        size: row.size,
      }));
    } catch (error) {
      logger.error("Failed to get table statistics:", error);
      return [];
    }
  }

  private generateIndexRecommendations(
    slowQueries: Array<{
      operation: string;
      avgTime: number;
      count: number;
    }>
  ): string[] {
    const recommendations: string[] = [];

    // Analyze query patterns and suggest indexes
    slowQueries.forEach(query => {
      if (query.operation === "SELECT" && query.avgTime > 2000) {
        recommendations.push(
          `Consider adding indexes for frequently queried columns that are causing slow SELECT operations (avg: ${query.avgTime}ms)`
        );
      }
    });

    // Add general recommendations
    recommendations.push(
      "Consider partitioning large tables by date ranges for better query performance"
    );
    recommendations.push(
      "Review and optimize complex JOIN operations that may be causing performance bottlenecks"
    );

    return recommendations;
  }

  private cleanupOldStats() {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

    for (const [operation, stats] of this.queryStats.entries()) {
      if (stats.lastExecuted.getTime() < cutoffTime) {
        this.queryStats.delete(operation);
      }
    }
  }
}

// Singleton instance
let dbPoolInstance: DatabaseConnectionPool | null = null;

/**
 * Get the global database connection pool instance
 */
export function getDatabasePool(): DatabaseConnectionPool {
  if (!dbPoolInstance) {
    dbPoolInstance = new DatabaseConnectionPool();
  }

  return dbPoolInstance;
}

/**
 * Execute a database operation with connection pooling and monitoring
 */
export async function executeWithPool<T>(
  operation: () => Promise<T>,
  operationName: string,
  options: {
    enableCache?: boolean;
    cacheKey?: string;
    cacheTtl?: number;
  } = {}
): Promise<T> {
  const pool = getDatabasePool();
  return pool.executeQuery(operationName, operation, options);
}
