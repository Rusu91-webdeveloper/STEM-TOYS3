import { NextRequest } from "next/server";

import {
  emailJson,
  emailApiError,
  parseEmailListQuery,
} from "@/lib/admin/email-api";
import {
  sequenceInput,
  sequenceInclude,
  savedSequenceSteps,
} from "@/lib/admin/email-sequence-input";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    if ((await auth())?.user?.role !== "ADMIN")
      return emailJson({ error: "Unauthorized" }, 401);
    const { page, limit, search, isActive } = parseEmailListQuery(
      request.nextUrl.searchParams
    );
    const trigger = request.nextUrl.searchParams.get("trigger");
    const where = {
      ...(isActive ? { isActive: isActive === "true" } : {}),
      ...(trigger && trigger !== "all" ? { trigger } : {}),
      ...(search
        ? { name: { contains: search, mode: "insensitive" as const } }
        : {}),
    };
    const [sequences, total] = await Promise.all([
      db.emailSequence.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: sequenceInclude,
      }),
      db.emailSequence.count({ where }),
    ]);
    return emailJson({
      sequences,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return emailApiError(error, "Secvențele nu au putut fi încărcate");
  }
}
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" || !session.user.id)
      return emailJson({ error: "Unauthorized" }, 401);
    const { steps = [], ...data } = sequenceInput.parse(await request.json());
    if (data.isActive && !steps.length)
      return emailJson(
        { error: "Adaugă cel puțin un pas înainte de activare" },
        400
      );
    if (steps.length > data.maxEmails)
      return emailJson(
        { error: "Numărul de pași depășește limita de emailuri" },
        400
      );
    return emailJson(
      await db.emailSequence.create({
        data: {
          ...data,
          createdBy: session.user.id,
          steps: { create: await savedSequenceSteps(steps) },
        },
        include: sequenceInclude,
      }),
      201
    );
  } catch (error) {
    return emailApiError(error, "Secvența nu a putut fi creată");
  }
}
