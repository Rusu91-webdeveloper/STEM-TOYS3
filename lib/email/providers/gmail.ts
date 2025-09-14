import {
  EmailProvider,
  EmailProviderSendResult,
  UnifiedEmailRequest,
} from "@/lib/email/types";

export class GmailProvider implements EmailProvider {
  readonly name = "gmail";

  async send(request: UnifiedEmailRequest): Promise<EmailProviderSendResult> {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) {
      throw new Error("Gmail credentials are not configured");
    }

    const nodemailer = await import("nodemailer").catch(() => ({
      default: null,
    }));
    if (!nodemailer.default) {
      throw new Error("nodemailer package is not installed");
    }

    const transporter = nodemailer.default.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    const to = Array.isArray(request.to) ? request.to.join(", ") : request.to;
    const info = await transporter.sendEmailViaUnifiedSystem({
      from: `${process.env.EMAIL_FROM_NAME || "TechTots STEM Store"} <${process.env.EMAIL_FROM || user}>`,
      to,
      subject: request.subject ?? "Message from TechTots",
      html: request.html ?? "",
      text: request.text,
    });

    return { success: true, messageId: info.messageId ?? null, raw: info };
  }
}
