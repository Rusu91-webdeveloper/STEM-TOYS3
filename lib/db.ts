import { Pool } from "@neondatabase/serverless";
import { PrismaClient } from "@prisma/client";

// Configure connection pool if we're using Neon
const connectionString = process.env.DATABASE_URL || "";
const isNeonDatabase = connectionString.includes("neon.tech");

// Enhanced connection pool configuration for Neon
let pool: Pool | undefined;
if (isNeonDatabase) {
  pool = new Pool({
    connectionString,
    max: 20, // Maximum number of connections
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
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
    // Enhanced datasource configuration
    datasources: {
      db: {
        url: connectionString,
      },
    },
    // Add connection pool configuration
    ...(pool && {
      // Custom connection management for Neon
      __internal: {
        engine: {
          connectionLimit: 20,
          pool,
        },
      },
    }),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

/**
 * Database client exports
 */

// Re-export the prisma client from our prisma.ts file
export { prisma } from "./prisma";
