import { PrismaClient } from "@prisma/client";
import { logger } from "../logger";

// Define connection pool configuration based on environment
const getConnectionConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const isDevelopment = process.env.NODE_ENV === "development";
  
  return {
    // Connection pool configuration
    connectionLimit: isProduction ? 20 : 10, // More connections in production
    poolTimeout: 20000, // 20 seconds
    acquireTimeout: 60000, // 60 seconds
    createTimeout: 30000, // 30 seconds
    destroyTimeout: 5000, // 5 seconds
    idleTimeout: 600000, // 10 minutes
    reapInterval: 1000, // 1 second
    createRetryInterval: 200, // 200ms
    
    // Query performance settings
    queryTimeout: 30000, // 30 seconds for queries
    
    // Logging configuration
    log: isDevelopment 
      ? ["query", "error", "warn", "info"]
      : ["error", "warn"]
  };
};

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const config = getConnectionConfig();

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: config.log as any,
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Connection health check function
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> {
  try {
    const startTime = Date.now();
    await db.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;
    
    return {
      status: 'healthy',
      latency
    };
  } catch (error) {
    logger.error('Database health check failed', { error });
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Database connection pool statistics
export async function getDatabaseStats(): Promise<{
  activeConnections?: number;
  idleConnections?: number;
  totalConnections?: number;
  status: string;
}> {
  try {
    // Note: Prisma doesn't expose direct connection pool stats
    // This is a placeholder that could be enhanced with custom metrics
    const health = await checkDatabaseHealth();
    
    return {
      status: health.status,
      // These would need to be implemented with custom monitoring
      // activeConnections: undefined,
      // idleConnections: undefined,
      // totalConnections: undefined,
    };
  } catch (error) {
    logger.error('Failed to get database stats', { error });
    return {
      status: 'error'
    };
  }
}

// Graceful shutdown handler
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await db.$disconnect();
    logger.info('Database connection closed gracefully');
  } catch (error) {
    logger.error('Error closing database connection', { error });
  }
}

// Set up graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', closeDatabaseConnection);
  process.on('SIGTERM', closeDatabaseConnection);
  process.on('beforeExit', closeDatabaseConnection);
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

// Export additional utilities
export { PrismaClient } from "@prisma/client";
export type { Prisma } from "@prisma/client";
