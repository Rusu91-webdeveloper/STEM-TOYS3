import { NextRequest } from "next/server";

import {
  emailJson,
  emailApiError,
  parseEmailListQuery,
} from "@/lib/admin/email-api";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    if ((await auth())?.user?.role !== "ADMIN")
      return emailJson({ error: "Unauthorized" }, 401);
    const { page, limit, search } = parseEmailListQuery(
      request.nextUrl.searchParams
    );
    const where = search
      ? {
          OR: [
            { to: { contains: search, mode: "insensitive" as const } },
            { subject: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};
    const [logs, total] = await Promise.all([
      db.emailLog.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          to: true,
          subject: true,
          status: true,
          sentAt: true,
          error: true,
          createdAt: true,
          template: { select: { name: true } },
        },
      }),
      db.emailLog.count({ where }),
    ]);
    return emailJson({
      logs: logs.map(log => ({ ...log, verified: log.status === "accepted" })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return emailApiError(error, "Istoricul email nu a putut fi încărcat");
  }
}
