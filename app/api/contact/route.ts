import { after, NextResponse } from "next/server";
import { z } from "zod";

import {
  appConfig,
  type AppConfig,
  getAppConfig,
} from "@/lib/config/app-config";
import { sendEmailViaUnifiedSystem } from "@/lib/email/migration-helper";

export const runtime = "nodejs";

const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email address"),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject too long"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message too long"),
});

const CONTACT_CONFIG_TIMEOUT_MS = 3000;
const CONTACT_EMAIL_TIMEOUT_MS = parseTimeout(
  process.env.CONTACT_EMAIL_TIMEOUT_MS,
  8000
);
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://www.techtots.ro");

function parseTimeout(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise.then(
      value => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      error => {
        clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getFallbackConfig(): AppConfig {
  const storeName = process.env.EMAIL_FROM_NAME || "TechTots";

  return {
    storeName,
    contactEmail: appConfig.contactEmail,
    supportEmail: appConfig.supportEmail,
    contactPhone: appConfig.storePhone,
    storePhoneFormatted: appConfig.storePhoneFormatted,
    alertEmail: appConfig.alertEmail,
    fromEmail: appConfig.fromEmail,
    streetAddress: appConfig.streetAddress,
    city: appConfig.city,
    state: appConfig.state,
    postalCode: appConfig.postalCode,
    country: "România",
    fullAddress: appConfig.fullAddress,
    legalName: process.env.STORE_LEGAL_NAME || "WEBIRA REM S.R.L.",
  };
}

async function loadContactConfig(): Promise<AppConfig> {
  try {
    return await withTimeout(
      getAppConfig(),
      CONTACT_CONFIG_TIMEOUT_MS,
      "Loading contact configuration"
    );
  } catch (error) {
    console.warn("Contact route falling back to env config:", error);
    return getFallbackConfig();
  }
}

function normalizeSubject(subject: string): string {
  switch (subject) {
    case "general":
      return "General Inquiry";
    case "order":
      return "Order Question";
    case "return":
      return "Return or Refund";
    case "product":
      return "Product Information";
    case "support":
      return "Technical Support";
    case "partnership":
      return "Partnership";
    default:
      return subject;
  }
}

async function sendBoundedEmail(
  to: string,
  subject: string,
  html: string,
  textContent: string
) {
  const result = await withTimeout(
    sendEmailViaUnifiedSystem(to, subject, html, {
      variables: { textContent },
    }),
    CONTACT_EMAIL_TIMEOUT_MS,
    `Sending email to ${to}`
  );

  if (!result.success) {
    throw new Error(result.error || `Email delivery failed for ${to}`);
  }

  return result;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = contactFormSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid form data", details: result.error.format() },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = result.data;
    const cfg = await loadContactConfig();
    const recipientEmail = cfg.contactEmail;
    const subjectLabel = normalizeSubject(subject);
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subjectLabel);
    const safeMessage = escapeHtml(message);
    const sentAt = new Date().toLocaleString("ro-RO", {
      timeZone: "Europe/Bucharest",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const contactHtml = `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contact Form - ${safeSubject}</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
        <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Mesaj Nou de Contact</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">${safeSubject}</p>
          </div>

          <div style="padding: 32px;">
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #3b82f6;">
              <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600;">Informatii Expeditor</h3>
              <div style="display: grid; grid-template-columns: auto 1fr; gap: 12px 16px; align-items: center;">
                <strong style="color: #374151;">Nume:</strong>
                <span style="color: #1f2937;">${safeName}</span>
                <strong style="color: #374151;">Email:</strong>
                <span style="color: #1f2937;"><a href="mailto:${safeEmail}" style="color: #3b82f6; text-decoration: none;">${safeEmail}</a></span>
                <strong style="color: #374151;">Subiect:</strong>
                <span style="color: #1f2937;">${safeSubject}</span>
                <strong style="color: #374151;">Trimis la:</strong>
                <span style="color: #1f2937;">${escapeHtml(sentAt)}</span>
              </div>
            </div>

            <div style="background-color: #ffffff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px;">
              <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600;">Mesaj</h3>
              <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; border-left: 4px solid #10b981;">
                <p style="margin: 0; color: #374151; line-height: 1.6; white-space: pre-wrap; font-size: 16px;">${safeMessage}</p>
              </div>
            </div>

            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-top: 24px; text-align: center;">
              <p style="margin: 0; color: #92400e; font-weight: 600;">Pentru a raspunde, foloseste adresa de email: <a href="mailto:${safeEmail}" style="color: #d97706;">${safeEmail}</a></p>
            </div>
          </div>

          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              Mesaj primit prin formularul de contact de pe
              <a href="${siteUrl}" style="color: #3b82f6; text-decoration: none;"> ${siteUrl}</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `.trim();

    const contactText = `
Buna,

Ai primit un mesaj nou prin formularul de contact.

Nume: ${name}
Email: ${email}
Subiect: ${subjectLabel}
Trimis la: ${sentAt}

Mesaj:
${message}
    `.trim();

    await sendBoundedEmail(
      recipientEmail,
      `[Contact Form] ${subjectLabel} - de la ${name}`,
      contactHtml,
      contactText
    );

    const confirmationHtml = `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmare - Mesajul tau a fost trimis</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
        <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Mesaj trimis cu succes</h1>
          </div>

          <div style="padding: 32px; text-align: center;">
            <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">Multumim, ${safeName}!</h2>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Am primit mesajul tau cu subiectul "<strong>${safeSubject}</strong>" si iti vom raspunde in cel mai scurt timp posibil.
            </p>

            <div style="background-color: #ecfdf5; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <h3 style="color: #047857; margin: 0 0 12px 0; font-size: 16px;">Informatii de contact</h3>
              <p style="margin: 0; color: #047857; font-size: 14px;">
                <strong>Email:</strong> ${escapeHtml(cfg.contactEmail)}<br>
                <strong>Telefon:</strong> ${escapeHtml(cfg.storePhoneFormatted)}<br>
                <strong>Program:</strong> Luni-Vineri, 9:00-17:00
              </p>
            </div>

            <div style="margin: 32px 0;">
              <a href="${siteUrl}"
                 style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                Inapoi la site
              </a>
            </div>
          </div>

          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>TechTots STEM Store</strong> - Jucarii STEM pentru minti curioase
            </p>
            <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px;">
              ${escapeHtml(cfg.fullAddress)} | ${escapeHtml(cfg.storePhoneFormatted)}
            </p>
          </div>
        </div>
      </body>
      </html>
    `.trim();

    const confirmationText = `
Buna ${name},

Am primit mesajul tau cu subiectul "${subjectLabel}" si iti vom raspunde in cel mai scurt timp posibil.

Iti multumim ca ne-ai contactat!

Echipa TechTots
Email: ${cfg.contactEmail}
Telefon: ${cfg.storePhoneFormatted}
    `.trim();

    after(async () => {
      try {
        await sendBoundedEmail(
          email,
          "Confirmare - Am primit mesajul tau | TechTots",
          confirmationHtml,
          confirmationText
        );
      } catch (error) {
        console.error("Error sending contact confirmation email:", error);
      }
    });

    return NextResponse.json({
      success: true,
      message: "Mesajul a fost trimis cu succes. Iti vom raspunde in curand.",
    });
  } catch (error) {
    console.error("Error sending contact form email:", error);

    return NextResponse.json(
      {
        error:
          "Mesajul nu a putut fi trimis acum. Te rugam sa incerci din nou in cateva momente.",
        details:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
}
