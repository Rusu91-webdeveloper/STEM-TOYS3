import { NextRequest } from "next/server";
import { z } from "zod";

import { emailJson, emailApiError } from "@/lib/admin/email-api";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendAuditedAdminEmail } from "@/lib/email/admin-delivery";
const sendInput = z
  .object({
    recipientEmails: z.array(z.string().trim().email()).min(1).max(100),
    testMode: z.boolean().default(false),
  })
  .strict();
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if ((await auth())?.user?.role !== "ADMIN")
      return emailJson({ error: "Unauthorized" }, 401);
    const { id } = await params;
    const { recipientEmails, testMode } = sendInput.parse(await request.json());
    const recipients = [
      ...new Set(recipientEmails.map(email => email.toLowerCase())),
    ];
    if (testMode && recipients.length !== 1)
      return emailJson(
        { error: "Testul folosește o singură adresă aleasă explicit" },
        400
      );
    const campaign = await db.emailCampaign.findUnique({
      where: { id },
      include: { template: true },
    });
    if (!campaign) return emailJson({ error: "Campania nu există" }, 404);
    if (/\{\{[^}]+\}\}/.test(campaign.subject + campaign.content))
      return emailJson(
        { error: "Completează variabilele șablonului înainte de trimitere" },
        400
      );
    if (!campaign.template.isActive)
      return emailJson({ error: "Șablonul campaniei este inactiv" }, 400);
    if (campaign.status !== "DRAFT")
      return emailJson(
        { error: "Trimiterea este permisă numai din draft" },
        409
      );
    if (!testMode) {
      const subscribed = await db.newsletter.findMany({
        where: {
          isActive: true,
          OR: recipients.map(email => ({
            email: { equals: email, mode: "insensitive" as const },
          })),
        },
        select: { email: true },
      });
      const activeEmails = new Set(
        subscribed.map(row => row.email.toLowerCase())
      );
      if (recipients.some(email => !activeEmails.has(email)))
        return emailJson(
          {
            error:
              "Destinatarii campaniei trebuie să fie abonați activi. Pentru verificare folosește trimiterea de test.",
          },
          400
        );
      // Claim the draft before provider calls so concurrent requests cannot send it twice.
      const claim = await db.emailCampaign.updateMany({
        where: { id, status: "DRAFT" },
        data: { status: "SENDING" },
      });
      if (!claim.count)
        return emailJson({ error: "Campania este deja în procesare" }, 409);
    }
    const results = [];
    for (const email of recipients) {
      const result = await sendAuditedAdminEmail({
        to: email,
        subject: campaign.subject,
        html: campaign.content,
        audit: { campaignId: id, templateId: campaign.templateId, testMode },
      });
      results.push({
        email,
        success: result.success,
        messageId: result.jobId,
        error: result.error,
      });
      if (result.success && result.jobId) {
        try {
          await db.emailEvent.create({
            data: {
              emailId: result.jobId,
              email,
              eventType: "SENT",
              campaignId: id,
              templateId: campaign.templateId,
              metadata: { testMode, providerAccepted: true },
            },
          });
        } catch (error) {
          console.error(
            "Provider accepted campaign email; tracking could not be saved",
            error
          );
        }
      }
    }
    const successful = results.filter(result => result.success).length;
    if (!testMode)
      await db.emailCampaign.update({
        where: { id },
        data: {
          status: successful === results.length ? "SENT" : "PAUSED",
          sentAt: successful ? new Date() : null,
          metadata: {
            ...((campaign.metadata as object) ?? {}),
            lastSend: {
              successful,
              failed: results.length - successful,
              recipients: results.length,
            },
          },
        },
      });
    return emailJson(
      {
        success: successful === results.length,
        results,
        summary: {
          total: results.length,
          successful,
          failed: results.length - successful,
          testMode,
        },
      },
      successful ? 200 : 502
    );
  } catch (error) {
    return emailApiError(error, "Campania nu a putut fi trimisă");
  }
}
