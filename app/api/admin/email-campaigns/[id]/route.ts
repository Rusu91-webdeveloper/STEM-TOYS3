import { NextRequest } from "next/server";
import { z } from "zod";

import { emailJson, emailApiError } from "@/lib/admin/email-api";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
type Params = { params: Promise<{ id: string }> };
const draftEdit = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().optional(),
    subject: z.string().min(1).max(200).optional(),
    content: z.string().min(1).optional(),
  })
  .strict();
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    if ((await auth())?.user?.role !== "ADMIN")
      return emailJson({ error: "Unauthorized" }, 401);
    const { id } = await params;
    const data = draftEdit.parse(await request.json());
    const updated = await db.emailCampaign.updateMany({
      where: { id, status: "DRAFT" },
      data,
    });
    if (!updated.count)
      return emailJson(
        { error: "Campania nu există sau nu mai este draft" },
        409
      );
    return emailJson({ success: true });
  } catch (error) {
    return emailApiError(error, "Campania nu a putut fi salvată");
  }
}
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    if ((await auth())?.user?.role !== "ADMIN")
      return emailJson({ error: "Unauthorized" }, 401);
    const { id } = await params;
    const deleted = await db.emailCampaign.deleteMany({
      where: { id, status: "DRAFT" },
    });
    if (!deleted.count)
      return emailJson({ error: "Pot fi șterse numai campaniile draft" }, 409);
    return emailJson({ success: true });
  } catch (error) {
    return emailApiError(error, "Campania nu a putut fi ștearsă");
  }
}
