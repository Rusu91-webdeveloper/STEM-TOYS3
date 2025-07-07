"use server";

import { compare } from "bcrypt";

/**
 * Server-side utility to verify a password against a hash
 * This function should only be used in server components or API routes
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    return await compare(password, hashedPassword);
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
}
