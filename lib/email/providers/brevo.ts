import {
  EmailProvider,
  EmailProviderSendResult,
  UnifiedEmailRequest,
} from "@/lib/email/types";

export class BrevoProvider implements EmailProvider {
  readonly name = "brevo";

  async send(request: UnifiedEmailRequest): Promise<EmailProviderSendResult> {
    const apiKey =
      process.env.BREVO_API_KEY || process.env.EMAIL_PRIMARY_API_KEY;
    if (!apiKey) {
      throw new Error("Brevo API key is not configured");
    }

    const toArray = Array.isArray(request.to) ? request.to : [request.to];

    // Prefer official API via axios-like call to /smtp/email
    const payload: any = {
      sender: {
        email: process.env.EMAIL_FROM,
        name: process.env.EMAIL_FROM_NAME || "TechTots STEM Store",
      },
      to: toArray.map(email => ({ email })),
      subject: request.subject ?? "Message from TechTots",
      htmlContent: request.html ?? "",
      textContent: request.text,
    };

    if (request.attachments?.length) {
      payload.attachment = request.attachments.map(a => ({
        content: a.content,
        name: a.filename,
      }));
    }

    const url = "https://api.brevo.com/v3/smtp/email";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Brevo API error: ${res.status} ${text}`);
    }

    const data = await res.json();
    return { success: true, messageId: data?.messageId ?? null, raw: data };
  }
}
