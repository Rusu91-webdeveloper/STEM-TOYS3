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
 * A guest checkout row can be claimed later. Staff accounts stay locked.
 * An inactive customer with no password also never chose credentials.
 */
export function isClaimableGuestCheckoutUser(user: ClaimableUser): boolean {
  if (user.isActive) return false;
  if (STAFF_ROLES.has(user.role ?? "")) return false;

  const tags = user.tags ?? [];
  if (tags.includes(GUEST_CHECKOUT_TAG)) return true;

  const password = user.password ?? "";
  return (user.role ?? "CUSTOMER") === "CUSTOMER" && password.length === 0;
}

/**
 * Google sign-in for a guest checkout user. Activates the same row so the
 * provider account links to the orders already stored on that user id.
 * Returns false when sign-in must stay denied.
 */
export async function activateGuestCheckoutForProviderSignIn(
  user: ClaimableUser
): Promise<boolean> {
  if (user.isActive) return true;
  if (!isClaimableGuestCheckoutUser(user)) return false;

  await db.user.update({
    where: { id: user.id },
    data: {
      isActive: true,
      emailVerified: new Date(),
    },
  });

  return true;
}
