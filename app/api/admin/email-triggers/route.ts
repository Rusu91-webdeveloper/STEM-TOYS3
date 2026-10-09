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
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {};
    const [triggers, total] = await Promise.all([
      db.emailTrigger.findMany({
        where,
        orderBy: [{ priority: "desc" }, { id: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          status: true,
          isActive: true,
          actionType: true,
          _count: { select: { executions: true } },
        },
      }),
      db.emailTrigger.count({ where }),
    ]);
    return emailJson({
      triggers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return emailApiError(error, "Regulile nu au putut fi încărcate");
  }
}
