import {
  EmailProvider,
  EmailProviderSendResult,
  UnifiedEmailRequest,
} from "@/lib/email/types";

export class ResendProvider implements EmailProvider {
  readonly name = "resend";

  async send(request: UnifiedEmailRequest): Promise<EmailProviderSendResult> {
    const apiKey =
      process.env.RESEND_API_KEY || process.env.EMAIL_PRIMARY_API_KEY;
    if (!apiKey) {
      throw new Error("Resend API key is not configured");
    }

    // Lazy import to avoid bundling in edge contexts if not used
    const { Resend } = await import("resend").catch(() => ({
      Resend: null as any,
    }));
    if (!Resend) {
      throw new Error("resend package is not installed");
    }

    const resend = new Resend(apiKey);
    const toArray = Array.isArray(request.to) ? request.to : [request.to];

    // For migration, allow raw html/text, otherwise rely on pre-rendered html passed in
    const subject = request.subject ?? `Message from TechTots`;
    const html = request.html ?? "";
    const text = request.text;

    const response = await resend.emails.send({
      from: `${process.env.EMAIL_FROM_NAME || "TechTots STEM Store"} <${process.env.EMAIL_FROM}>`,
      to: toArray,
      subject,
      html,
      text,
      reply_to: process.env.EMAIL_REPLY_TO,
      attachments: request.attachments?.map(a => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    } as any);

    return {
      success: true,
      messageId: (response as any)?.id ?? null,
      raw: response,
    };
  }
}
