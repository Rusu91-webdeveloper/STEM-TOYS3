import { normalizeCheckoutEmail } from "@/lib/checkout/guest-customer";
import { romanianPhoneMatchKey } from "@/lib/checkout/romanian-phone";
import { db } from "@/lib/db";

export interface CodGuaranteeUserStats {
  priorOrderCount: number;
  priorCodRtoCount: number;
}

const STAFF_ROLES = new Set(["ADMIN", "SUPPLIER"]);
const COD_PAYMENT_METHODS = ["cash_on_delivery", "cod"];

/**
 * Same refusal definition the admin "Mark Refused (RTO)" action writes:
 * cancelled COD with a failed/pending payment, an explicit COD REJECTED note,
 * or a captured guarantee note.
 */
const codRefusalWhere = {
  paymentMethod: { in: COD_PAYMENT_METHODS },
  OR: [
    {
      status: "CANCELLED" as const,
      paymentStatus: { in: ["FAILED" as const, "PENDING" as const] },
    },
    { notes: { contains: "COD REJECTED" } },
    { notes: { contains: "COD Guarantee captured" } },
  ],
};

interface UserCodHistory {
  priorOrderCount: number;
  refusalIds: string[];
}

const mergeRefusalStats = (
  priorOrderCount: number,
  userRefusalIds: string[],
  phoneRefusalIds: string[]
): CodGuaranteeUserStats => {
  const refusalIds = new Set<string>([...userRefusalIds, ...phoneRefusalIds]);
  return {
    priorOrderCount,
    priorCodRtoCount: refusalIds.size,
  };
};

async function loadUserCodHistory(userId: string): Promise<UserCodHistory> {
  const [priorOrderCount, refusals] = await Promise.all([
    db.order.count({
      where: { userId },
    }),
    db.order.findMany({
      where: {
        userId,
        ...codRefusalWhere,
      },
      select: { id: true },
    }),
  ]);

  return {
    priorOrderCount,
    refusalIds: refusals.map(order => order.id),
  };
}

async function listPhoneCodRefusalIds(
  phone: string | null | undefined
): Promise<string[]> {
  const matchKey = romanianPhoneMatchKey(phone);
  if (!matchKey) return [];

  const refusals = await db.order.findMany({
    where: codRefusalWhere,
    select: {
      id: true,
      shippingAddress: { select: { phone: true } },
    },
  });

  return refusals
    .filter(
      order => romanianPhoneMatchKey(order.shippingAddress?.phone) === matchKey
    )
    .map(order => order.id);
}

/**
 * Same inputs the order route and policy endpoint use. Logged-in shoppers are
 * scored by user id. Guests are new customers unless the email already belongs
 * to a non-staff customer. Refused COD orders are also matched by shipping
 * phone, including orders on a different account or email.
 */
export async function resolveCodGuaranteeCustomerStats(input: {
  userId?: string | null;
  guestEmail?: string | null;
  phone?: string | null;
}): Promise<CodGuaranteeUserStats> {
  const phoneRefusalIds = await listPhoneCodRefusalIds(input.phone);

  if (input.userId) {
    const history = await loadUserCodHistory(input.userId);
    return mergeRefusalStats(
      history.priorOrderCount,
      history.refusalIds,
      phoneRefusalIds
    );
  }

  const guestEmail = normalizeCheckoutEmail(input.guestEmail);
  if (!guestEmail) {
    return mergeRefusalStats(0, [], phoneRefusalIds);
  }

  const existing = await db.user.findUnique({
    where: { email: guestEmail },
    select: { id: true, role: true },
  });

  if (!existing || STAFF_ROLES.has(existing.role)) {
    return mergeRefusalStats(0, [], phoneRefusalIds);
  }

  const history = await loadUserCodHistory(existing.id);
  return mergeRefusalStats(
    history.priorOrderCount,
    history.refusalIds,
    phoneRefusalIds
  );
}

export async function getCodGuaranteeUserStats(
  userId: string
): Promise<CodGuaranteeUserStats> {
  const history = await loadUserCodHistory(userId);
  return {
    priorOrderCount: history.priorOrderCount,
    priorCodRtoCount: history.refusalIds.length,
  };
}
