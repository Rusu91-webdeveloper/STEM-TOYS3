import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Execute a SQL query with parameters
 * @example
 * // Simple query
 * const users = await query`SELECT * FROM users WHERE active = ${true}`;
 *
 * // With multiple parameters
 * const user = await query`SELECT * FROM users WHERE id = ${userId} AND email = ${email}`;
 */
export async function query<T = any>(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<T[]> {
  // Convert tagged template to SQL string and parameters
  const { text, params } = buildSqlQuery(strings, values);
  // Use Prisma's $queryRawUnsafe for SQL queries
  return prisma.$queryRawUnsafe(text, ...params);
}

/**
 * Execute a SQL query and return the first result or null
 */
export async function queryFirst<T = any>(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<T | null> {
  const results = await query<T>(strings, ...values);
  return results.length > 0 ? results[0] : null;
}

/**
 * Execute a SQL query that doesn't return results (INSERT, UPDATE, DELETE)
 */
export async function execute(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<void> {
  const { text, params } = buildSqlQuery(strings, values);
  await prisma.$executeRawUnsafe(text, ...params);
}

/**
 * Helper function to build a SQL query from template strings and values
 */
function buildSqlQuery(strings: TemplateStringsArray, values: any[]) {
  let text = "";
  const params: any[] = [];

  strings.forEach((string, i) => {
    text += string;
    if (i < values.length) {
      text += `$${i + 1}`;
      params.push(values[i]);
    }
  });

  return { text, params };
}

// Export prisma instance for direct database access
export { prisma };
