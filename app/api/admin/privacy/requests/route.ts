import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getUserCache } from "@/lib/cache/user-cache";
import { withCsrfProtection } from "@/lib/csrf";
import { db } from "@/lib/db";
import { eraseCustomerAccount } from "@/lib/privacy/account-erasure";
import { privacyRequestDeadline } from "@/lib/privacy/request-deadline";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const pending = {
  consentType: "account_deletion_request",
  consentDetails: { path: ["status"], equals: "pending_review" },
};
const reply = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers });
async function handle(request: NextRequest) {
  const session = await auth().catch(() => null);
  if (!session?.user?.id || session.user.role !== "ADMIN")
    return reply({ error: "Admin access required" }, 403);
  try {
    if (request.method === "GET") {
      const requests = await db.consentLog.findMany({
        where: pending,
        orderBy: { createdAt: "asc" },
        take: 100,
        select: {
          id: true,
          createdAt: true,
          user: { select: { email: true, name: true } },
        },
      });
      return reply({
        requests: requests.map(request => ({
          ...request,
          ...privacyRequestDeadline(request.createdAt),
        })),
      });
    }
    const response = await withCsrfProtection(
      request.clone() as NextRequest,
      async () => {
        const body = await request.json().catch(() => null);
        if (
          typeof body?.requestId !== "string" ||
          body.confirmProcessing !== true
        )
          return reply({ error: "Confirm an existing customer request" }, 400);
        const recorded = await db.consentLog.findFirst({
          where: { ...pending, id: body.requestId },
          select: { userId: true },
        });
        if (!recorded)
          return reply({ error: "Pending request not found" }, 404);
        const result = await eraseCustomerAccount(db, recorded.userId);
        if (result.status === "completed")
          await getUserCache()
            .invalidateUser(recorded.userId)
            .catch(() => {});
        return reply(
          result,
          result.status === "pending_review"
            ? 202
            : result.status === "completed"
              ? 200
              : 409
        );
      }
    );
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    console.error("Privacy request review failed");
    return reply(
      { error: "Request review unavailable; no completion confirmed" },
      503
    );
  }
}
export const GET = handle;
export const POST = handle;
