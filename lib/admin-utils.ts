import { db } from "@/lib/db";

/**
 * Resolves the actual user ID for admin operations
 * Handles the case where session.user.id is "admin_env" (environment-based admin)
 * by looking up the actual admin user in the database
 */
export async function resolveAdminUserId(
  sessionUserId: string,
  sessionUserEmail: string | null | undefined
): Promise<string> {
  // If it's not the special admin_env ID, return as is
  if (sessionUserId !== "admin_env") {
    return sessionUserId;
  }

  // For admin_env, look up the actual admin user in the database
  if (!sessionUserEmail) {
    throw new Error("Admin user email not found in session");
  }

  const adminUser = await db.user.findUnique({
    where: { email: sessionUserEmail },
    select: { id: true },
  });

  if (!adminUser) {
    throw new Error("Admin user not found in database");
  }

  return adminUser.id;
}
