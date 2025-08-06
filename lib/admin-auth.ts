import "server-only";
import crypto from "crypto";

import { hash } from "bcrypt";

/**
 * Generates a hash that combines the admin password with a secret key
 * This prevents storing plaintext passwords in environment variables
 *
 * @param password The plaintext password
 * @returns A secure one-way hash of the password
 */
export function hashAdminPassword(password: string): Promise<string> {
  // First, create a derived key using PBKDF2 with env secret as salt
  const secret =
    process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-hashing";
  const derivedKey = crypto
    .pbkdf2Sync(
      password,
      secret,
      10000, // iterations
      64, // key length
      "sha512"
    )
    .toString("hex");

  // Then, hash the derived key with bcrypt
  return hash(derivedKey, 12);
}

/**
 * Validates an admin password against a stored hash
 * This function handles PBKDF2 hashes stored in environment variables
 *
 * @param password The plaintext password to verify
 * @param storedHash The stored PBKDF2 hash to compare against
 * @returns True if the password matches the hash
 */
export function verifyAdminPassword(
  password: string,
  storedHash: string
): boolean {
  // Create a derived key using PBKDF2 with env secret as salt
  const secret =
    process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-hashing";
  const derivedKey = crypto
    .pbkdf2Sync(
      password,
      secret,
      10000, // iterations
      64, // key length
      "sha512"
    )
    .toString("hex");

  // Compare the derived key directly with the stored hash
  return derivedKey === storedHash;
}

/**
 * Creates a hash for storing in environment variables
 * This can be used to generate a secure hash for the ADMIN_PASSWORD_HASH env var
 *
 * @param password The plaintext password to hash
 * @returns A hash that can be stored in environment variables
 */
export function createEnvPasswordHash(password: string): string {
  const secret =
    process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-hashing";
  // Use a simpler hash for environment variable storage
  return crypto
    .pbkdf2Sync(password, secret, 10000, 64, "sha512")
    .toString("hex");
}
