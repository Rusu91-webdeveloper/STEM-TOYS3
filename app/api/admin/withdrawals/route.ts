import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { validateCsrfForRequest } from "@/lib/csrf";
import { db } from "@/lib/db";
import {
  readWithdrawalReceipt,
  WITHDRAWAL_TYPE,
} from "@/lib/returns/withdrawal";
import { deliverWithdrawal } from "@/lib/returns/withdrawal-service";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
async function isAdmin() {
  const session = await auth().catch(() => null);
  return Boolean(session?.user?.id && session.user.role === "ADMIN");
}
const denied = () =>
  NextResponse.json(
    { error: "Admin access required" },
    { status: 403, headers }
  );

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) return denied();
  const cursor = request.nextUrl.searchParams.get("cursor");
  try {
    const records = await db.emailLog.findMany({
      where: { metadata: { path: ["type"], equals: WITHDRAWAL_TYPE } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 101,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { id: true, status: true, metadata: true },
    });
    return NextResponse.json(
      {
        requests: records.slice(0, 100).flatMap(record => {
          const receipt = readWithdrawalReceipt(record.metadata);
          return receipt ? [{ ...receipt, deliveryStatus: record.status }] : [];
        }),
        nextCursor: records.length > 100 ? records[99].id : null,
      },
      { headers }
    );
  } catch {
    return NextResponse.json(
      { error: "Declarațiile nu sunt disponibile." },
      { status: 503, headers }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return denied();
  if (!(await validateCsrfForRequest(request)).valid) return denied();
  try {
    const parsed = z
      .object({
        reference: z.string().regex(/^withdrawal_[a-f0-9-]{36}$/i),
        action: z.enum(["retry_email", "reviewed"]),
      })
      .strict()
      .safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: "Solicitare invalidă." },
        { status: 400, headers }
      );
    const { reference, action } = parsed.data;
    if (action === "retry_email") {
      const receipt = await deliverWithdrawal(reference);
      return NextResponse.json({ receipt }, { headers });
    }
    const record = await db.emailLog.findUnique({ where: { id: reference } });
    const receipt = readWithdrawalReceipt(record?.metadata);
    if (!receipt)
      return NextResponse.json(
        { error: "Declarația nu a fost găsită." },
        { status: 404, headers }
      );
    if (record?.status === "sending")
      return NextResponse.json(
        {
          error:
            "Trimiterea emailurilor este în curs. Reîncearcă verificarea după trimitere.",
        },
        { status: 409, headers }
      );
    const changed = await db.emailLog.updateMany({
      where: {
        id: reference,
        metadata: { equals: receipt as Prisma.InputJsonValue },
      },
      data: { metadata: { ...receipt, reviewedAt: new Date().toISOString() } },
    });
    if (!changed.count)
      return NextResponse.json(
        { error: "Declarația s-a actualizat. Reîncarcă lista." },
        { status: 409, headers }
      );
    return NextResponse.json({ success: true }, { headers });
  } catch {
    return NextResponse.json(
      { error: "Operația nu a fost confirmată." },
      { status: 503, headers }
    );
  }
}
