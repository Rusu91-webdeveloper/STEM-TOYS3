import { normalizeCheckoutEmail } from "@/lib/checkout/guest-customer";
import { db } from "@/lib/db";

export interface CodGuaranteeUserStats {
  priorOrderCount: number;
  priorCodRtoCount: number;
}

const EMPTY_COD_GUARANTEE_STATS: CodGuaranteeUserStats = {
  priorOrderCount: 0,
  priorCodRtoCount: 0,
};

const STAFF_ROLES = new Set(["ADMIN", "SUPPLIER"]);

/**
 * Same inputs the order route uses. Logged-in shoppers are scored by user id.
 * Guests are new customers unless the email already belongs to a non-staff
 * customer, in which case that customer's COD history is used. Staff rows are
 * treated as new customers here so the response cannot reveal the account.
 */
export async function resolveCodGuaranteeCustomerStats(input: {
  userId?: string | null;
  guestEmail?: string | null;
}): Promise<CodGuaranteeUserStats> {
  if (input.userId) {
    return getCodGuaranteeUserStats(input.userId);
  }

  const guestEmail = normalizeCheckoutEmail(input.guestEmail);
  if (!guestEmail) return { ...EMPTY_COD_GUARANTEE_STATS };

  const existing = await db.user.findUnique({
    where: { email: guestEmail },
    select: { id: true, role: true },
  });

  if (!existing || STAFF_ROLES.has(existing.role)) {
    return { ...EMPTY_COD_GUARANTEE_STATS };
  }

  return getCodGuaranteeUserStats(existing.id);
}

export async function getCodGuaranteeUserStats(
  userId: string
): Promise<CodGuaranteeUserStats> {
  const codPaymentMethods = ["cash_on_delivery", "cod"];

  const [priorOrderCount, priorCodRtoCount] = await Promise.all([
    db.order.count({
      where: {
        userId,
      },
    }),
    db.order.count({
      where: {
        userId,
        paymentMethod: { in: codPaymentMethods },
        OR: [
          {
            status: "CANCELLED",
            paymentStatus: { in: ["FAILED", "PENDING"] },
          },
          {
            notes: { contains: "COD REJECTED" },
          },
          {
            notes: { contains: "COD Guarantee captured" },
          },
        ],
      },
    }),
  ]);

  return {
    priorOrderCount,
    priorCodRtoCount,
  };
}
