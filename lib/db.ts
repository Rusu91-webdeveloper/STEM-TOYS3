import { Pool } from "@neondatabase/serverless";
import { PrismaClient } from "@prisma/client";

// Configure connection pool if we're using Neon
const connectionString = process.env.DATABASE_URL || "";
const isNeonDatabase = connectionString.includes("neon.tech");

// **PERFORMANCE**: Ultra-optimized connection pool configuration for Neon
let pool: Pool | undefined;
if (isNeonDatabase) {
  pool = new Pool({
    connectionString,
    // **PERFORMANCE**: Optimized pool sizing for faster startup
    max: 10, // Reduced for faster initialization
    min: 2, // Reduced for faster startup
    idleTimeoutMillis: 30000, // Reduced for faster cleanup
    connectionTimeoutMillis: 5000, // Reduced for faster startup
    maxUses: 1000, // Reduced for faster connection refresh
    allowExitOnIdle: true,
    acquireTimeoutMillis: 5000, // Reduced for faster startup
    // **PERFORMANCE**: Additional optimizations
    keepAlive: true,
    keepAliveInitialDelayMillis: 0,
    tcpKeepAliveIdle: 10000, // Reduced for faster startup
  });
}

// Create global Prisma client instance with enhanced configuration
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    // **PERFORMANCE**: Enhanced datasource configuration
    datasources: {
      db: {
        url: connectionString,
      },
    },
    // **PERFORMANCE**: Add connection pool configuration with optimized settings
    ...(pool && {
      // Custom connection management for Neon
      __internal: {
        engine: {
          connectionLimit: 4, // **PERFORMANCE**: Further reduced for faster startup
          pool,
        },
      },
    }),
    // **PERFORMANCE**: Add transaction timeout for better performance
    transactionOptions: {
      maxWait: 2000, // **PERFORMANCE**: Reduced wait time for faster TTFB
      timeout: 3000, // **PERFORMANCE**: Reduced timeout for faster TTFB
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

/**
 * Database client exports
 */

// Re-export the prisma client from our prisma.ts file
export { prisma } from "./prisma";
