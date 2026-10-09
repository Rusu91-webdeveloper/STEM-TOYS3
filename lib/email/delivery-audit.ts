import { db } from "@/lib/db";

export interface DeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  logId?: string;
}
export interface DeliveryAudit {
  templateId?: string;
  campaignId?: string;
  sequenceId?: string;
  testMode?: boolean;
}

// Keep acceptance separate from delivery. A log failure must never turn an
// accepted message into a failed send that callers might retry and duplicate.
export async function auditEmailDelivery(
  to: string | string[],
  subject: string,
  provider: string,
  send: () => Promise<
    Omit<DeliveryResult, "messageId"> & {
      messageId?: string | null;
      rejectedRecipients?: string[];
    }
  >,
  audit: DeliveryAudit = {}
): Promise<DeliveryResult> {
  let result: DeliveryResult;
  let rejected = new Set<string>();
  try {
    const outcome = await send();
    rejected = new Set(
      (outcome.rejectedRecipients ?? []).map(email => email.toLowerCase())
    );
    result = { ...outcome, messageId: outcome.messageId ?? undefined };
  } catch (error) {
    result = {
      success: false,
      error: error instanceof Error ? error.message : "Trimiterea a eșuat",
    };
  }
  if (result.messageId?.startsWith("dev-"))
    result = {
      success: false,
      error: "Emailul a fost simulat local; furnizorul nu l-a acceptat.",
    };
  const recipients = Array.isArray(to) ? to : [to];
  const accepted =
    result.success &&
    !!result.messageId &&
    recipients.some(email => !rejected.has(email.toLowerCase()));
  if (result.success && !accepted)
    result = {
      success: false,
      error: "Furnizorul nu a returnat confirmarea trimiterii.",
    };
  try {
    for (const recipient of recipients) {
      const recipientAccepted =
        accepted && !rejected.has(recipient.toLowerCase());
      const log = await db.emailLog.create({
        data: {
          to: recipient,
          subject,
          templateId: audit.templateId,
          status: recipientAccepted ? "accepted" : "failed",
          sentAt: recipientAccepted ? new Date() : null,
          error: rejected.has(recipient.toLowerCase())
            ? "SMTP a respins destinatarul"
            : (result.error ?? null),
          metadata: { provider, messageId: result.messageId ?? null, ...audit },
        },
      });
      result.logId = log.id;
    }
  } catch (error) {
    console.error("Email delivery audit could not be saved", error);
  }
  return result;
}
