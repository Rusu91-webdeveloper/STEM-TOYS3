import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

/** Aggregate-only inventory. Never load or decrypt PAN/CVV or card metadata. */
export async function GET() {
  const session = await auth().catch(() => null);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403, headers }
    );
  }
  try {
    const [total, withCardData, withCvv, deletionRequests] = await Promise.all([
      db.paymentCard.count(),
      db.paymentCard.count({ where: { encryptedCardData: { not: "" } } }),
      db.paymentCard.count({
        where: {
          AND: [{ encryptedCvv: { not: null } }, { encryptedCvv: { not: "" } }],
        },
      }),
      db.consentLog.count({
        where: {
          consentType: "account_deletion_request",
          consentDetails: { path: ["status"], equals: "pending_review" },
        },
      }),
    ]);
    return NextResponse.json(
      {
        checkedAt: new Date().toISOString(),
        legacyCards: { total, withCardData, withCvv },
        deletionRequestsAwaitingReview: deletionRequests,
      },
      { headers }
    );
  } catch {
    return NextResponse.json(
      { error: "Inventory unavailable; no card data was retrieved" },
      { status: 503, headers }
    );
  }
}
