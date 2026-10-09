import { sendEmailWithBrevo } from "@/lib/brevo";

import type { DeliveryAudit } from "./delivery-audit";

// Admin sends require a provider acknowledgement, not a queue-job ID.
export async function sendAuditedAdminEmail(params: {
  to: string;
  subject: string;
  html: string;
  audit: DeliveryAudit;
}) {
  const result = await sendEmailWithBrevo(params);
  return {
    success: result.success,
    jobId: result.messageId ?? undefined,
    error: result.error,
  };
}
