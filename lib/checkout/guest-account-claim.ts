import { randomBytes } from "crypto";

import { hash } from "bcryptjs";

import { db } from "@/lib/db";

export const GUEST_CHECKOUT_TAG = "guest-checkout";

const STAFF_ROLES = new Set(["ADMIN", "SUPPLIER"]);

interface ClaimableUser {
  id: string;
  role?: string | null;
  isActive?: boolean | null;
  tags?: string[] | null;
  password?: string | null;
}

/**
 * Only an inactive guest-checkout row can be claimed.
 * Staff stay locked. An admin-deactivated customer with no password stays locked.
 */
export function isClaimableGuestCheckoutUser(user: ClaimableUser): boolean {
  if (user.isActive) return false;
  if (STAFF_ROLES.has(user.role ?? "")) return false;
  return (user.tags ?? []).includes(GUEST_CHECKOUT_TAG);
}

/**
 * Google sign-in for a guest checkout user. Activates the same row so the
 * provider account links to the orders already stored on that user id.
 * Replaces any password so a register attempt cannot keep credentials.
 * Returns false when sign-in must stay denied.
 */
export async function activateGuestCheckoutForProviderSignIn(
  user: ClaimableUser
): Promise<boolean> {
  if (user.isActive) return true;
  if (!isClaimableGuestCheckoutUser(user)) return false;

  const password = await hash(randomBytes(32).toString("hex"), 12);
  const tags = (user.tags ?? []).filter(tag => tag !== GUEST_CHECKOUT_TAG);

  await db.user.update({
    where: { id: user.id },
    data: {
      isActive: true,
      emailVerified: new Date(),
      password,
      verificationToken: null,
      tags,
    },
  });

  return true;
}
