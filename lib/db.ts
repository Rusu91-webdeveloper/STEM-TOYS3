import { Pool } from "@neondatabase/serverless";
import { PrismaClient } from "@prisma/client";

// Configure connection pool if we're using Neon
const connectionString = process.env.DATABASE_URL || "";
const isNeonDatabase = connectionString.includes("neon.tech");

// Setup connection pool for Neon
let pool: Pool | undefined;
if (isNeonDatabase) {
  pool = new Pool({ connectionString });
}

// Create global Prisma client instance
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
    // Connect pool if available
    ...(pool
      ? {
          datasources: {
            db: {
              url: connectionString,
            },
          },
        }
      : {}),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

/**
 * Database client exports
 */

// Re-export the prisma client from our prisma.ts file
export { prisma } from "./prisma";
