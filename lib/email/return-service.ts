import { getEmailService } from "@/lib/email/index";
import { SmtpProvider } from "@/lib/email/providers/smtp";
import { UnifiedEmailService } from "@/lib/email/unified-service";

export function getReturnEmailService() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)
    return getEmailService();
  return new UnifiedEmailService({
    primaryProvider: new SmtpProvider(),
    fromEmail: process.env.EMAIL_FROM || process.env.EMAIL_USER,
  });
}
