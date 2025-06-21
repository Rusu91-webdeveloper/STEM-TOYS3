import { NextResponse } from "next/server";
import { z } from "zod";
import { sendMail } from "@/lib/brevo";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the request body
    const result = contactFormSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid form data", details: result.error.format() },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = result.data;

    // Get the correct recipient email from environment or use default
    const recipientEmail =
      process.env.CONTACT_EMAIL || "webira.rem.srl@gmail.com";

    // Create HTML email content
    const html = `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contact Form - ${subject}</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
        <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">📧 Mesaj Nou de Contact</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">${subject}</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px;">
            
            <!-- Sender Info -->
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #3b82f6;">
              <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600;">👤 Informații Expeditor</h3>
              <div style="display: grid; grid-template-columns: auto 1fr; gap: 12px 16px; align-items: center;">
                <strong style="color: #374151;">Nume:</strong>
                <span style="color: #1f2937;">${name}</span>
                <strong style="color: #374151;">Email:</strong>
                <span style="color: #1f2937;"><a href="mailto:${email}" style="color: #3b82f6; text-decoration: none;">${email}</a></span>
                <strong style="color: #374151;">Subiect:</strong>
                <span style="color: #1f2937;">${subject}</span>
              </div>
            </div>
            
            <!-- Message -->
            <div style="background-color: #ffffff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px;">
              <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600;">💬 Mesaj</h3>
              <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; border-left: 4px solid #10b981;">
                <p style="margin: 0; color: #374151; line-height: 1.6; white-space: pre-wrap; font-size: 16px;">${message}</p>
              </div>
            </div>
            
            <!-- Response Instructions -->
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-top: 24px; text-align: center;">
              <p style="margin: 0; color: #92400e; font-weight: 600;">💡 Pentru a răspunde, folosește adresa de email: <a href="mailto:${email}" style="color: #d97706;">${email}</a></p>
            </div>
            
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              Mesaj primit prin formularul de contact de pe 
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}" style="color: #3b82f6; text-decoration: none; font-weight: 600;">TechTots STEM Store</a>
            </p>
            <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px;">
              ${new Date().toLocaleDateString("ro-RO", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `;

    // Create plain text version
    const textContent = `
Contact Form Message - ${subject}

From: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
This message was received through the contact form on TechTots STEM Store.
To reply, use: ${email}
Date: ${new Date().toLocaleDateString("ro-RO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}
    `.trim();

    // Send email using Brevo
    await sendMail({
      to: recipientEmail,
      subject: `[Contact Form] ${subject} - de la ${name}`,
      html,
      text: textContent,
      from: process.env.EMAIL_FROM || "noreply@techtots.ro",
      fromName: "TechTots Contact Form",
    });

    // Send confirmation email to user
    const confirmationHtml = `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmare - Mesajul tău a fost trimis</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
        <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Mesaj Trimis cu Succes!</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px; text-align: center;">
            <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">Mulțumim, ${name}!</h2>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Am primit mesajul tău cu subiectul "<strong>${subject}</strong>" și îți vom răspunde în cel mai scurt timp posibil.
            </p>
            
            <div style="background-color: #ecfdf5; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <h3 style="color: #047857; margin: 0 0 12px 0; font-size: 16px;">📞 Informații de Contact</h3>
              <p style="margin: 0; color: #047857; font-size: 14px;">
                <strong>Email:</strong> webira.rem.srl@gmail.com<br>
                <strong>Telefon:</strong> +40 771 248 029<br>
                <strong>Program:</strong> Luni-Vineri, 9:00-17:00
              </p>
            </div>
            
            <div style="margin: 32px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}" 
                 style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                🏠 Înapoi la Site
              </a>
            </div>
            
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase
            </p>
            <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px;">
              Mehedinti 54-56, Cluj-Napoca, Cluj | +40 771 248 029
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `;

    // Send confirmation to user
    await sendMail({
      to: email,
      subject: "Confirmare - Am primit mesajul tău | TechTots",
      html: confirmationHtml,
      text: `Bună ${name},\n\nAm primit mesajul tău cu subiectul "${subject}" și îți vom răspunde în cel mai scurt timp posibil.\n\nÎți mulțumim că ne-ai contactat!\n\nEchipa TechTots\nEmail: webira.rem.srl@gmail.com\nTelefon: +40 771 248 029`,
      from: process.env.EMAIL_FROM || "noreply@techtots.ro",
      fromName: "TechTots STEM Store",
    });

    return NextResponse.json({
      success: true,
      message: "Mesajul a fost trimis cu succes! Îți vom răspunde în curând.",
    });
  } catch (error) {
    console.error("Error sending contact form email:", error);

    return NextResponse.json(
      {
        error: "Failed to send message",
        details:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
}
