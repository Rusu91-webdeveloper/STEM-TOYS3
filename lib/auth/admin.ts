import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

/**
 * Helper function to check if the current user is an admin
 * @param request The Next.js request object
 * @returns Promise<boolean> True if the user is an admin, false otherwise
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  try {
    const session = await auth();
    return session?.user?.role === "ADMIN";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}
