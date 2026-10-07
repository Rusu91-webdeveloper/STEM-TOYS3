import nodemailer from "nodemailer";

import type {
  EmailProvider,
  EmailProviderSendResult,
  UnifiedEmailRequest,
} from "@/lib/email/types";

/** The same EMAIL_* SMTP credentials used by withdrawal receipts. */
export class SmtpProvider implements EmailProvider {
  readonly name = "smtp";

  async send(request: UnifiedEmailRequest): Promise<EmailProviderSendResult> {
    const { EMAIL_USER: user, EMAIL_PASS: pass } = process.env;
    const port = Number(process.env.EMAIL_PORT || "587");
    if (!user || !pass || !Number.isInteger(port) || port <= 0 || port > 65535)
      throw new Error("SMTP configuration is incomplete");
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: true },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
    const info = await transporter.sendMail({
      from: {
        name: process.env.EMAIL_FROM_NAME || "TechTots",
        address: process.env.EMAIL_FROM || user,
      },
      replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM || user,
      to: request.to,
      subject: request.subject,
      html: request.html,
      text: request.text,
      attachments: request.attachments?.map(attachment => ({
        filename: attachment.filename,
        content: Buffer.from(
          attachment.content,
          (attachment.encoding as BufferEncoding) || "base64"
        ),
        contentType: attachment.contentType,
      })),
    });
    const recipients = Array.isArray(request.to) ? request.to.length : 1;
    return {
      success: info.rejected.length === 0 && info.accepted.length >= recipients,
      messageId: info.messageId,
      raw: info,
    };
  }
}
