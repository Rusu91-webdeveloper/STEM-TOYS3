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
    const { page, limit, search, isActive } = parseEmailListQuery(
      request.nextUrl.searchParams
    );
    const where = {
      ...(isActive ? { isActive: isActive === "true" } : {}),
      ...(search
        ? { email: { contains: search, mode: "insensitive" as const } }
        : {}),
    };
    const [subscribers, total] = await Promise.all([
      db.newsletter.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          createdAt: true,
        },
      }),
      db.newsletter.count({ where }),
    ]);
    return emailJson({
      subscribers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return emailApiError(error, "Abonații nu au putut fi încărcați");
  }
}
