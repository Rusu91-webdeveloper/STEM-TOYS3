import { NextRequest } from "next/server";
import { z } from "zod";

import { emailJson, emailApiError } from "@/lib/admin/email-api";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if ((await auth())?.user?.role !== "ADMIN")
      return emailJson({ error: "Unauthorized" }, 401);
    const { status } = z
      .object({ status: z.enum(["ACTIVE", "PAUSED"]) })
      .strict()
      .parse(await request.json());
    const { id } = await params;
    const trigger = await db.emailTrigger.findUnique({ where: { id } });
    if (!trigger) return emailJson({ error: "Regula nu există" }, 404);
    if (status === "ACTIVE") {
      const action = trigger.actionData as {
        templateId?: string;
        sequenceId?: string;
      };
      if (trigger.actionType === "send_email") {
        const template = action.templateId
          ? await db.emailTemplate.findUnique({
              where: { id: action.templateId },
            })
          : null;
        if (!template?.isActive)
          return emailJson(
            { error: "Regula trebuie să folosească un șablon activ" },
            400
          );
      } else if (trigger.actionType === "start_sequence") {
        const sequence = action.sequenceId
          ? await db.emailSequence.findUnique({
              where: { id: action.sequenceId },
              include: { _count: { select: { steps: true } } },
            })
          : null;
        if (!sequence?.isActive || !sequence._count.steps)
          return emailJson(
            { error: "Regula trebuie să folosească o secvență activă cu pași" },
            400
          );
      } else if (trigger.actionType !== "update_user")
        return emailJson(
          { error: "Acțiunea regulii nu este disponibilă" },
          400
        );
    }
    return emailJson(
      await db.emailTrigger.update({
        where: { id },
        data: { status, isActive: status === "ACTIVE" },
      })
    );
  } catch (error) {
    return emailApiError(error, "Regula nu a putut fi salvată");
  }
}
