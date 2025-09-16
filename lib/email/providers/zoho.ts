import {
  EmailProvider,
  EmailProviderSendResult,
  UnifiedEmailRequest,
} from "@/lib/email/types";

export class ZohoProvider implements EmailProvider {
  readonly name = "zoho";

  async send(request: UnifiedEmailRequest): Promise<EmailProviderSendResult> {
    const user = process.env.GMAIL_USER || process.env.EMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS;
    const host = process.env.EMAIL_HOST || "smtp.zoho.eu";
    const port = parseInt(process.env.EMAIL_PORT || "465");

    if (!user || !pass) {
      throw new Error("Email credentials are not configured");
    }

    console.log(
      `📧 [Zoho Provider] Sending email via ${host}:${port} as ${user}`
    );

    const nodemailer = await import("nodemailer").catch(() => ({
      default: null,
    }));
    if (!nodemailer.default) {
      throw new Error("nodemailer package is not installed");
    }

    const transporter = nodemailer.default.createTransport({
      host: host,
      port: port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
      // Additional Zoho-specific configuration
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
    });

    // Verify connection before sending
    try {
      await transporter.verify();
      console.log("✅ [Zoho Provider] SMTP connection verified");
    } catch (error) {
      console.error("❌ [Zoho Provider] SMTP connection failed:", error);
      throw new Error(
        `SMTP connection failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    const to = Array.isArray(request.to) ? request.to.join(", ") : request.to;
    const fromEmail = process.env.EMAIL_FROM || user;
    const fromName = process.env.EMAIL_FROM_NAME || "TechTots STEM Store";

    console.log(`📧 [Zoho Provider] Sending to: ${to}`);
    console.log(`📧 [Zoho Provider] From: ${fromName} <${fromEmail}>`);
    console.log(`📧 [Zoho Provider] Subject: ${request.subject}`);

    const info = await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject: request.subject ?? "Message from TechTots",
      html: request.html ?? "",
      text: request.text,
    });

    console.log(
      `✅ [Zoho Provider] Email sent successfully. Message ID: ${info.messageId}`
    );

    return { success: true, messageId: info.messageId ?? null, raw: info };
  }
}
