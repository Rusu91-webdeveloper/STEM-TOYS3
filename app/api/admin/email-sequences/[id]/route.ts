import { NextRequest } from "next/server";

import { emailJson, emailApiError } from "@/lib/admin/email-api";
import {
  sequenceInput,
  sequenceInclude,
  savedSequenceSteps,
} from "@/lib/admin/email-sequence-input";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
type Params = { params: Promise<{ id: string }> };
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    if ((await auth())?.user?.role !== "ADMIN")
      return emailJson({ error: "Unauthorized" }, 401);
    const sequence = await db.emailSequence.findUnique({
      where: { id: (await params).id },
      include: sequenceInclude,
    });
    return sequence
      ? emailJson(sequence)
      : emailJson({ error: "Secvența nu există" }, 404);
  } catch (error) {
    return emailApiError(error, "Secvența nu a putut fi încărcată");
  }
}
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    if ((await auth())?.user?.role !== "ADMIN")
      return emailJson({ error: "Unauthorized" }, 401);
    const { id } = await params;
    const existing = await db.emailSequence.findUnique({
      where: { id },
      include: sequenceInclude,
    });
    if (!existing) return emailJson({ error: "Secvența nu există" }, 404);
    const { steps, ...data } = sequenceInput
      .partial()
      .parse(await request.json());
    if (
      (data.isActive ?? existing.isActive) &&
      (steps?.length ?? existing.steps.length) === 0
    )
      return emailJson(
        { error: "Adaugă cel puțin un pas înainte de activare" },
        400
      );
    if (
      (steps?.length ?? existing.steps.length) >
      (data.maxEmails ?? existing.maxEmails)
    )
      return emailJson(
        { error: "Numărul de pași depășește limita de emailuri" },
        400
      );
    // Enrolled users retain their step positions; changing their steps needs a migration.
    if (steps && existing._count.users > 0)
      return emailJson(
        { error: "Secvența are participanți. Pașii nu pot fi înlocuiți." },
        409
      );
    const replacement = steps ? await savedSequenceSteps(steps) : undefined;
    return emailJson(
      await db.emailSequence.update({
        where: { id },
        data: {
          ...data,
          ...(replacement
            ? { steps: { deleteMany: {}, create: replacement } }
            : {}),
        },
        include: sequenceInclude,
      })
    );
  } catch (error) {
    return emailApiError(error, "Secvența nu a putut fi salvată");
  }
}
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    if ((await auth())?.user?.role !== "ADMIN")
      return emailJson({ error: "Unauthorized" }, 401);
    const { id } = await params;
    const existing = await db.emailSequence.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!existing) return emailJson({ error: "Secvența nu există" }, 404);
    if (existing._count.users > 0)
      return emailJson(
        { error: "Secvența are participanți și nu poate fi ștearsă" },
        409
      );
    await db.emailSequence.delete({ where: { id } });
    return emailJson({ success: true });
  } catch (error) {
    return emailApiError(error, "Secvența nu a putut fi ștearsă");
  }
}
