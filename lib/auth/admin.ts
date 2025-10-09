import { NextRequest } from "next/server";

import { auth } from "@/lib/auth";

/**
 * Helper function to check if the current user is an admin or visitor
 * @param request The Next.js request object
 * @returns Promise<boolean> True if the user is an admin or visitor, false otherwise
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  try {
    const session = await auth();
    return session?.user?.role === "ADMIN" || session?.user?.role === "VISITOR";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Helper function to check if the current user is an admin only (not visitor)
 * @param request The Next.js request object
 * @returns Promise<boolean> True if the user is an admin (not visitor), false otherwise
 */
export async function isAdminOnly(request: NextRequest): Promise<boolean> {
  try {
    const session = await auth();
    return session?.user?.role === "ADMIN";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}
