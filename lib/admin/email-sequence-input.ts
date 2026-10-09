import { z } from "zod";

import { db } from "@/lib/db";
export const sequenceInput = z
  .object({
    name: z.string().trim().min(1).max(100),
    description: z.string().max(1000).optional(),
    trigger: z.enum([
      "USER_REGISTRATION",
      "FIRST_PURCHASE",
      "ABANDONED_CART",
      "ORDER_PLACED",
      "ORDER_SHIPPED",
      "ORDER_DELIVERED",
      "INACTIVE_USER",
      "BIRTHDAY",
      "CUSTOM",
    ]),
    isActive: z.boolean().default(false),
    maxEmails: z.number().int().min(1).max(20).default(5),
    cooldownHours: z.number().int().min(0).max(8760).default(24),
    steps: z
      .array(
        z.object({
          templateId: z.string().min(1),
          delayHours: z.number().int().min(0).max(8760),
        })
      )
      .max(20)
      .optional(),
  })
  .strict();
export const sequenceInclude = {
  steps: { orderBy: { order: "asc" as const } },
  _count: { select: { steps: true, users: true } },
};
export async function savedSequenceSteps(
  steps: NonNullable<z.infer<typeof sequenceInput>["steps"]>
) {
  const templates = await db.emailTemplate.findMany({
    where: { id: { in: steps.map(step => step.templateId) } },
  });
  return steps.map((step, index) => {
    const template = templates.find(
      template => template.id === step.templateId
    );
    if (!template?.isActive)
      throw new z.ZodError([
        {
          code: "custom",
          path: ["steps", index, "templateId"],
          message: "Șablonul nu există sau este inactiv",
        },
      ]);
    return {
      ...step,
      order: index + 1,
      subject: template.subject,
      content: template.content,
    };
  });
}
