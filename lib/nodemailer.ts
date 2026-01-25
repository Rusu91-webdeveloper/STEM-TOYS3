import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

import { logger } from "./logger";

const prisma = new PrismaClient();

// Load environment variables
const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || "587");
const EMAIL_USER = process.env.EMAIL_USER || "";
const EMAIL_PASS = process.env.EMAIL_PASS || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "";

// Check configuration on startup
if (!EMAIL_USER || !EMAIL_PASS) {
  logger.warn("Email credentials are not properly configured in .env.local!");
  logger.warn(
    "Required variables: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM"
  );
}

// Create reusable transporter with Gmail configuration
export const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465, // true for 465, false for other ports
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  // Required for Gmail since May 30, 2022
  tls: {
    // Only disable certificate validation in development
    rejectUnauthorized: process.env.NODE_ENV !== "development",
  },
});

// For development environment, provide console-based email simulation
const devTransporter = {
  sendEmailViaUnifiedSystem: async (options: any) => {
    logger.debug("Email would be sent (DEV MODE)", {
      from: options.from,
      to: options.to,
      subject: options.subject,
      contentPreview: `${options.html.substring(0, 100)}...`,
    });
    return { messageId: `dev-${Date.now()}@localhost` };
  },
  verify: async () => true,
};

// Use dev transporter in development mode if email credentials are missing
const activeTransporter =
  process.env.NODE_ENV === "development" && (!EMAIL_USER || !EMAIL_PASS)
    ? devTransporter
    : transporter;

// Verify transporter configuration on startup
activeTransporter
  .verify()
  .then(() => {
    logger.info("Email transport configured successfully");
  })
  .catch(error => {
    logger.error("Email transport configuration failed", error);
    logger.info("Will use fallback development mode for emails");
  });

// Send an email using Nodemailer
export async function sendEmailViaUnifiedSystem({
  to,
  subject,
  html,
  text,
  from = EMAIL_FROM,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}) {
  try {
    // In development mode with missing credentials, use the dev transporter
    if (
      process.env.NODE_ENV === "development" &&
      (!EMAIL_USER || !EMAIL_PASS)
    ) {
      logger.debug("Email would be sent (DEV MODE)", {
        from,
        to: typeof to === "string" ? to : to.join(", "),
        subject,
        contentPreview: `${html.substring(0, 100)}...`,
      });
      return { success: true, messageId: `dev-${Date.now()}@localhost` };
    }

    // Send mail with defined transport object
    const info = await activeTransporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    logger.info("Email sent successfully", { messageId: info.messageId });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Error sending email", error);

    // In development mode, simulate success
    if (process.env.NODE_ENV === "development") {
      logger.debug("Email would be sent despite error (DEV MODE)", {
        from,
        to: typeof to === "string" ? to : to.join(", "),
        subject,
      });
      return { success: true, messageId: `dev-error-${Date.now()}@localhost` };
    }

    throw error;
  }
}

// Email templates
export const emailTemplates = {
  /**
   * Welcome email with professional Romanian styling
   */
  welcome: async ({ to, name }: { to: string; name: string }) => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const logoUrl = `${baseUrl}/TechTots_LOGO.png`;
    const faviconUrl = `${baseUrl}/favicon.ico`;

    const html = `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bun venit la TechTots!</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Logo -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
            <img src="${logoUrl}" alt="TechTots Logo" style="max-width: 200px; height: auto; margin-bottom: 16px;" onerror="this.src='${faviconUrl}'; this.style.width='48px'; this.style.height='48px';">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">🎉 Bun venit la TechTots!</h1>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px;">
            <p style="font-size: 18px; color: #374151; margin-bottom: 20px; line-height: 1.6;">Salut <strong>${name}</strong>,</p>
            
            <p style="font-size: 16px; color: #374151; margin-bottom: 24px; line-height: 1.6;">Îți mulțumim că ți-ai creat un cont la <strong>TechTots</strong>! Suntem încântați să te primim în comunitatea noastră de minți curioase!</p>
            
            <div style="background-color: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 24px; margin: 24px 0;">
              <h3 style="color: #15803d; margin: 0 0 16px 0; font-size: 18px;">🚀 Cu noul tău cont poți:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.6;">
                <li style="margin-bottom: 8px;"><strong>Să comanzi</strong> din colecția noastră exclusivă de jucării STEM și produse educaționale</li>
                <li style="margin-bottom: 8px;"><strong>Să urmărești</strong> comenzile și statusul livrării</li>
                <li style="margin-bottom: 8px;"><strong>Să salvezi</strong> produsele preferate pentru achiziții viitoare</li>
                <li style="margin-bottom: 8px;"><strong>Să primești</strong> recomandări personalizate pe baza vârstei și intereselor</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${baseUrl}" 
                 style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                🛒 Începe să Explorezi Colecția
              </a>
            </div>
            
            <!-- Featured Categories -->
            <div style="background-color: #fef7ff; border: 1px solid #d946ef; border-radius: 8px; padding: 20px; margin: 32px 0;">
              <h3 style="color: #a21caf; margin: 0 0 16px 0; font-size: 16px;">🎯 Categorii Populare:</h3>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                <a href="${baseUrl}/categories" style="background-color: #f3e8ff; color: #7c3aed; padding: 8px 16px; text-decoration: none; border-radius: 20px; font-size: 14px; font-weight: 600;">🔬 Kit-uri Științifice</a>
                <a href="${baseUrl}/categories" style="background-color: #f3e8ff; color: #7c3aed; padding: 8px 16px; text-decoration: none; border-radius: 20px; font-size: 14px; font-weight: 600;">🤖 Robotică</a>
                <a href="${baseUrl}/categories" style="background-color: #f3e8ff; color: #7c3aed; padding: 8px 16px; text-decoration: none; border-radius: 20px; font-size: 14px; font-weight: 600;">🧮 Matematică</a>
              </div>
            </div>
            
            <p style="font-size: 16px; color: #374151; text-align: center; margin-top: 32px; line-height: 1.6;">Învățare fericită!<br><strong>Echipa TechTots</strong></p>
          </div>
          
          <!-- Professional Footer -->
          <div style="background-color: #1f2937; color: #9ca3af; padding: 30px; text-align: center; font-size: 14px; line-height: 1.5;">
            <div style="margin-bottom: 16px;">
              <img src="${logoUrl}" alt="TechTots" style="max-width: 120px; height: auto; opacity: 0.8;" onerror="this.src='${faviconUrl}'; this.style.width='32px'; this.style.height='32px';">
            </div>
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #ffffff;">TechTots - Jucării Educaționale STEM</p>
            <p style="margin: 0 0 16px 0;">📧 webira.rem.srl@gmail.com | 📞 +40 771 248 029</p>
            <div style="border-top: 1px solid #374151; padding-top: 16px; margin-top: 16px;">
              <p style="margin: 0; font-size: 12px;">
                © ${new Date().getFullYear()} TechTots. Toate drepturile rezervate. | 
                <a href="${baseUrl}/privacy" style="color: #60a5fa; text-decoration: none;">Politica de Confidențialitate</a> | 
                <a href="${baseUrl}/terms" style="color: #60a5fa; text-decoration: none;">Termeni și Condiții</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return emailTemplates({
      to,
      subject: "Bun venit la TechTots! 🎉",
      html: html.replace("+40 123 456 789", "+40 771 248 029"),
      from: `"TechTots" <webira.rem.srl@gmail.com>`,
    });
  },

  /**
   * Return notification email for admin
   */
  returnNotification: async ({
    to,
    orderNumber,
    productName,
    productSku,
    customerName,
    customerEmail,
    reason,
    details,
    returnId,
  }: {
    to: string;
    orderNumber: string;
    productName: string;
    productSku?: string;
    customerName: string;
    customerEmail: string;
    reason: string;
    details?: string;
    returnId: string;
  }) => {
    // Make sure we log the email being used
    logger.info("Sending return notification email", {
      to,
      from: EMAIL_FROM || process.env.EMAIL_FROM || "webira.rem.srl@gmail.com",
    });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://techtots.ro";
    const logoUrl = `${baseUrl}/TechTots_LOGO.png`;
    const faviconUrl = `${baseUrl}/favicon.ico`;

    const html = `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cerere de Returnare Nouă - TechTots Admin</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Logo -->
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
            <img src="${logoUrl}" alt="TechTots Logo" style="max-width: 160px; height: auto; margin-bottom: 16px;" onerror="this.src='${faviconUrl}'; this.style.width='48px'; this.style.height='48px';">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">🔄 Cerere de Returnare Nouă</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Necesită atenție administrativă</p>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 24px; line-height: 1.6;">Un client a inițiat o cerere de returnare și necesită aprobare. Vă rugăm să verificați detaliile de mai jos:</p>
            
            <!-- Return Details Box -->
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 24px; margin: 24px 0;">
              <h3 style="color: #92400e; margin: 0 0 16px 0; font-size: 18px;">📋 Detalii Returnare</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #92400e; font-weight: 600; width: 40%;">ID Returnare:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-family: monospace; font-size: 14px;">${returnId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #92400e; font-weight: 600;">Comanda:</td>
                  <td style="padding: 8px 0; color: #1f2937;">#${orderNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #92400e; font-weight: 600;">Produs:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${productName}${productSku ? ` (SKU: ${productSku})` : ""}</td>
                </tr>
              </table>
            </div>
            
            <!-- Customer Info Box -->
            <div style="background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 24px; margin: 24px 0;">
              <h3 style="color: #1e40af; margin: 0 0 16px 0; font-size: 18px;">👤 Informații Client</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #1e40af; font-weight: 600; width: 40%;">Nume:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #1e40af; font-weight: 600;">Email:</td>
                  <td style="padding: 8px 0; color: #1f2937;"><a href="mailto:${customerEmail}" style="color: #3b82f6; text-decoration: none;">${customerEmail}</a></td>
                </tr>
              </table>
            </div>
            
            <!-- Reason Box -->
            <div style="background-color: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 24px; margin: 24px 0;">
              <h3 style="color: #991b1b; margin: 0 0 12px 0; font-size: 18px;">📝 Motivul Returnării</h3>
              <p style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600;">${reason}</p>
              ${details ? `<p style="margin: 0; color: #6b7280; font-style: italic;">${details}</p>` : ""}
            </div>
            
            <!-- Timestamp -->
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>Data solicitării:</strong> ${new Date().toLocaleString("ro-RO", { dateStyle: "full", timeStyle: "short" })}
              </p>
            </div>
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${baseUrl}/admin/returns/${returnId}" 
                 style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                📋 Gestionează Returnarea
              </a>
            </div>
          </div>
          
          <!-- Professional Footer -->
          <div style="background-color: #1f2937; color: #9ca3af; padding: 30px; text-align: center; font-size: 14px; line-height: 1.5;">
            <div style="margin-bottom: 16px;">
              <img src="${logoUrl}" alt="TechTots" style="max-width: 120px; height: auto; opacity: 0.8;" onerror="this.src='${faviconUrl}'; this.style.width='32px'; this.style.height='32px';">
            </div>
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #ffffff;">TechTots Admin - Notificare Internă</p>
            <p style="margin: 0 0 16px 0;">📧 webira.rem.srl@gmail.com | 📞 +40 771 248 029</p>
            <div style="border-top: 1px solid #374151; padding-top: 16px; margin-top: 16px;">
              <p style="margin: 0; font-size: 12px;">
                © ${new Date().getFullYear()} TechTots. Toate drepturile rezervate.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Force the use of the EMAIL_FROM environment variable
    const from =
      EMAIL_FROM || process.env.EMAIL_FROM || "webira.rem.srl@gmail.com";

    return emailTemplates({
      to,
      from,
      subject: `New Return Request - Order #${orderNumber}`,
      html,
    });
  },

  /**
   * Verification email with professional Romanian styling
   */
  verification: async ({
    to,
    name,
    verificationLink,
    expiresIn = "24 ore",
  }: {
    to: string;
    name: string;
    verificationLink: string;
    expiresIn?: string;
  }) => {
    const logoUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/TechTots_LOGO.png`;
    const faviconUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/favicon.ico`;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // Fetch the latest 2 published blog posts
    const latestBlogs = await prisma.blog.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      take: 2,
      include: {
        author: { select: { name: true } },
        category: { select: { name: true, slug: true } },
      },
    });

    // Generate blog section HTML based on available blogs
    let blogSectionHtml = "";
    if (latestBlogs.length > 0) {
      blogSectionHtml = `
        <div style="background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 32px 0;">
          <h3 style="color: #1e40af; margin: 0 0 16px 0; font-size: 16px;">📚 În timp ce aștepți...</h3>
          <p style="color: #1e40af; margin: 0 0 12px 0;">Consultă articolele noastre populare despre educația STEM:</p>
          <ul style="margin: 0; padding-left: 20px; color: #1f2937; line-height: 1.5;">
            ${latestBlogs
          .map(
            blog =>
              `<li style="margin-bottom: 8px;"><a href="${baseUrl}/blog/${blog.slug}" style="color: #3b82f6; text-decoration: none;">${blog.title}</a></li>`
          )
          .join("")}
          </ul>
        </div>
      `;
    } else {
      blogSectionHtml = `
        <div style="background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 32px 0;">
          <h3 style="color: #1e40af; margin: 0 0 16px 0; font-size: 16px;">📚 În timp ce aștepți...</h3>
          <p style="color: #1e40af; margin: 0 0 12px 0;">Consultă articolele noastre despre educația STEM:</p>
          <p style="margin: 0; color: #1f2937;">
            <a href="${baseUrl}/blog" style="color: #3b82f6; text-decoration: none;">Vizitează blogul nostru pentru articole educaționale</a>
          </p>
        </div>
      `;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verifică adresa de email - TechTots</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Logo -->
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%); text-align: center; padding: 30px; color: white;">
            <img src="${logoUrl}" alt="TechTots" style="max-width: 180px; height: auto; margin-bottom: 16px;" onerror="this.src='${faviconUrl}'; this.style.width='40px'; this.style.height='40px';">
            <h1 style="margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">🔐 Verifică-ți Adresa de Email</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Finalizează înregistrarea ta</p>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px; color: #374151; line-height: 1.6;">
            <p style="font-size: 16px; margin-bottom: 16px;">Salut <strong style="color: #1f2937;">${name}</strong>,</p>
            
            <p style="font-size: 16px; margin-bottom: 24px;">Îți mulțumim că ți-ai creat un cont la TechTots. Pentru a finaliza înregistrarea și a începe să explorezi colecția noastră de jucării educaționale STEM, te rugăm să îți verifici adresa de email.</p>
            
            <!-- Verification Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verificationLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); transition: all 0.3s ease;">
                ✅ Verifică Adresa de Email
              </a>
            </div>
            
            <!-- Warning Box -->
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0 0 12px 0; color: #92400e; font-weight: 600;">⚠️ Important:</p>
              <p style="margin: 0; color: #92400e;">Acest link va expira în <strong>${expiresIn}</strong>. Dacă nu ți-ai creat un cont la TechTots, te rugăm să ignori acest email.</p>
            </div>
            
            <!-- Manual Link -->
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">Sau copiază și lipește acest link în browserul tău:</p>
              <p style="word-break: break-all; color: #3b82f6; margin: 0; font-family: monospace; font-size: 13px; background-color: #ffffff; padding: 8px; border-radius: 4px; border: 1px solid #e5e7eb;">${verificationLink}</p>
            </div>
            
            ${blogSectionHtml}
            
            <p style="font-size: 16px; color: #374151; text-align: center; margin-top: 32px; line-height: 1.6;">Cu respect,<br><strong>Echipa TechTots</strong></p>
          </div>
          
          <!-- Professional Footer -->
          <div style="background-color: #1f2937; color: #9ca3af; padding: 30px; text-align: center; font-size: 14px; line-height: 1.5;">
            <div style="margin-bottom: 16px;">
              <img src="${logoUrl}" alt="TechTots" style="max-width: 120px; height: auto; opacity: 0.8;" onerror="this.src='${faviconUrl}'; this.style.width='30px'; this.style.height='30px';">
            </div>
            
            <p style="margin: 0 0 16px 0; font-weight: 600; color: #f3f4f6;">TechTots - Jucării STEM pentru Minți Curioase</p>
            
            <div style="margin-bottom: 20px;">
              <p style="margin: 0 0 8px 0;">📧 webira.rem.srl@gmail.com</p>
              <p style="margin: 0 0 16px 0;">📞 +40 771 248 029</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <a href="${baseUrl}/privacy" style="color: #60a5fa; text-decoration: none; margin: 0 12px;">Politica de Confidențialitate</a>
              <a href="${baseUrl}/terms" style="color: #60a5fa; text-decoration: none; margin: 0 12px;">Termeni și Condiții</a>
              <a href="${baseUrl}/unsubscribe" style="color: #9ca3af; text-decoration: none; margin: 0 12px;">Dezabonare</a>
            </div>
            
            <p style="margin: 0; font-size: 12px; color: #6b7280;">© ${new Date().getFullYear()} TechTots. Toate drepturile rezervate.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return emailTemplates({
      to,
      subject: "Verifică-ți adresa de email - TechTots",
      html,
    });
  },

  /**
   * Order confirmation email
   */
  orderConfirmation: async ({
    to,
    order,
  }: {
    to: string;
    order: {
      id: string;
      items: Array<{
        name: string;
        quantity: number;
        price: number;
      }>;
      total: number;
      subtotal?: number;
      tax?: number;
      shippingCost?: number;
      discountAmount?: number;
      couponCode?: string;
      shippingAddress?: any;
      shippingMethod?: any;
      orderDate?: string;
      taxRatePercentage?: string;
      isFreeShippingActive?: boolean;
      freeShippingThreshold?: number;
    };
  }) => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const logoUrl = `${baseUrl}/TechTots_LOGO.png`;
    const faviconUrl = `${baseUrl}/favicon.ico`;

    // Build items table HTML
    const itemsHtml = order.items
      .map(
        item =>
          `<tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 8px; color: #374151;">${item.name}</td>
            <td style="padding: 12px 8px; text-align: center; color: #374151;">${item.quantity}</td>
            <td style="padding: 12px 8px; text-align: right; color: #374151;">${item.price.toFixed(2)} Lei</td>
            <td style="padding: 12px 8px; text-align: right; font-weight: 600; color: #374151;">${(item.price * item.quantity).toFixed(2)} Lei</td>
          </tr>`
      )
      .join("");

    // Build shipping info HTML
    const shippingHtml = order.shippingAddress
      ? `
        <div style="margin-top: 32px; border-top: 2px solid #e5e7eb; padding-top: 24px;">
          <h2 style="color: #1f2937; margin-bottom: 16px; font-size: 18px;">🚚 Informații Livrare</h2>
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px;">
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937;">${order.shippingAddress.fullName}</p>
            <p style="margin: 0 0 4px 0; color: #4b5563;">${order.shippingAddress.addressLine1}</p>
            ${order.shippingAddress.addressLine2 ? `<p style="margin: 0 0 4px 0; color: #4b5563;">${order.shippingAddress.addressLine2}</p>` : ""}
            <p style="margin: 0 0 4px 0; color: #4b5563;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}</p>
            <p style="margin: 0 0 4px 0; color: #4b5563;">${order.shippingAddress.country}</p>
            <p style="margin: 0; color: #4b5563;"><strong>📞 Telefon:</strong> ${order.shippingAddress.phone}</p>
          </div>
        </div>
      `
      : "";

    const html = `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmare Comandă - TechTots</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Logo - Enhanced Design -->
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%); padding: 48px 30px; text-align: center; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <!-- Decorative background elements -->
            <div style="position: absolute; top: -30%; right: -15%; width: 200px; height: 200px; background: rgba(255,255,255,0.15); border-radius: 50%;"></div>
            <div style="position: absolute; bottom: -20%; left: -10%; width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
            <div style="position: relative; z-index: 1;">
              <img src="${logoUrl}" alt="TechTots Logo" style="max-width: 220px; height: auto; margin-bottom: 20px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));" onerror="this.src='${faviconUrl}'; this.style.width='48px'; this.style.height='48px';">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 12px rgba(0,0,0,0.2); letter-spacing: -0.5px;">🎉 Confirmare Comandă</h1>
              <p style="margin: 12px 0 0 0; font-size: 18px; opacity: 0.95; color: #ffffff; font-weight: 500; text-shadow: 0 1px 4px rgba(0,0,0,0.15);">Îți mulțumim pentru încrederea acordată!</p>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px;">
            <p style="font-size: 18px; color: #374151; margin-bottom: 20px; line-height: 1.6;">Vă mulțumim pentru comanda dumneavoastră!</p>
            
            <!-- Order Summary Box - Enhanced Design -->
            <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #bfdbfe; border-radius: 16px; padding: 24px; margin: 32px 0; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div>
                  <p style="margin: 0; font-size: 20px; font-weight: 700; color: #1e40af; letter-spacing: -0.3px;">Comandă #${order.id}</p>
                  <p style="margin: 6px 0 0; color: #475569; font-size: 15px; font-weight: 500;">📅 ${order.orderDate ? new Date(order.orderDate).toLocaleDateString("ro-RO") : new Date().toLocaleDateString("ro-RO")}</p>
                </div>
                <div style="text-align: right;">
                  <span style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%); color: white; padding: 8px 16px; border-radius: 24px; font-size: 13px; font-weight: 700; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3); letter-spacing: 0.5px;">CONFIRMATĂ</span>
                </div>
              </div>
              <p style="margin: 0; color: #1e40af; font-size: 16px; font-weight: 600;">Am primit comanda ta și o vom procesa în curând!</p>
            </div>
            
            <!-- Products Table -->
            <h2 style="color: #1f2937; margin: 32px 0 16px 0; font-size: 20px;">🛍️ Produse Comandate</h2>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);">
                  <th style="text-align: left; padding: 16px 8px; border-bottom: 2px solid #e5e7eb; font-weight: 700; color: #1f2937;">Produs</th>
                  <th style="text-align: center; padding: 16px 8px; border-bottom: 2px solid #e5e7eb; font-weight: 700; color: #1f2937;">Cant.</th>
                  <th style="text-align: right; padding: 16px 8px; border-bottom: 2px solid #e5e7eb; font-weight: 700; color: #1f2937;">Preț</th>
                  <th style="text-align: right; padding: 16px 8px; border-bottom: 2px solid #e5e7eb; font-weight: 700; color: #1f2937;">Total</th>
                </tr>
              </thead>
              <tbody style="background-color: #ffffff;">
                ${itemsHtml}
              </tbody>
              <tfoot style="background-color: #f8fafc;">
                ${order.discountAmount && order.discountAmount > 0
        ? `
                <tr style="color: #10b981;">
                  <td colspan="3" style="text-align: right; padding: 12px 16px; font-weight: 600;">
                    Reducere ${order.couponCode ? `(${order.couponCode})` : ""}:
                  </td>
                  <td style="text-align: right; padding: 12px 16px; font-weight: 700;">-${order.discountAmount.toFixed(2)} Lei</td>
                </tr>`
        : ""
      }
                ${order.shippingCost !== undefined && order.shippingCost > 0
        ? `
                <tr>
                  <td colspan="3" style="text-align: right; padding: 12px 16px; font-weight: 600;">Transport${order.shippingMethod ? ` (${order.shippingMethod.name || "Standard"})` : ""}:</td>
                  <td style="text-align: right; padding: 12px 16px; font-weight: 600;">${order.shippingCost.toFixed(2)} Lei</td>
                </tr>`
        : ""
      }
                <!-- No VAT/TVA line - non-VAT registered SRL, prices are final -->
                <tr style="font-weight: 700; font-size: 18px; background: linear-gradient(135deg, #1f2937 0%, #374151 100%); color: #ffffff;">
                  <td colspan="3" style="text-align: right; padding: 16px; border-top: 2px solid #3b82f6;">TOTAL:</td>
                  <td style="text-align: right; padding: 16px; border-top: 2px solid #3b82f6;">${order.total.toFixed(2)} Lei</td>
                </tr>
                ${order.discountAmount && order.discountAmount > 0
        ? `
                <tr>
                  <td colspan="4" style="text-align: center; padding: 8px; background-color: #ecfdf5; color: #059669; font-size: 14px; font-weight: 600;">
                    🎉 Ai economisit ${order.discountAmount.toFixed(2)} Lei cu acest cupon!
                  </td>
                </tr>`
        : ""
      }
              </tfoot>
            </table>

            ${shippingHtml}
            
            <!-- Action Button - Enhanced Design -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="${baseUrl}/account/orders" 
                 style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 17px; display: inline-block; box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4); letter-spacing: 0.3px; transition: all 0.3s ease;">
                📋 Vezi Toate Comenzile
              </a>
            </div>
            
            <!-- What's Next Section -->
            <div style="background-color: #ecfdf5; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 32px 0;">
              <h3 style="color: #059669; margin: 0 0 12px 0; font-size: 16px;">✅ Ce Urmează?</h3>
              <ul style="margin: 0; padding-left: 20px; color: #047857; line-height: 1.5;">
                <li style="margin-bottom: 8px;">Vei primi o confirmare de expediere când comanda ta este pe drum</li>
                <li style="margin-bottom: 8px;">Poți urmări statusul comenzii tale oricând din <a href="${baseUrl}/account/orders" style="color: #059669; text-decoration: none; font-weight: 600;">panoul de control al contului tău</a></li>
                <li style="margin-bottom: 8px;">Dacă ai întrebări despre comanda ta, te rugăm să <a href="${baseUrl}/contact" style="color: #059669; text-decoration: none; font-weight: 600;">contactezi echipa noastră de asistență</a></li>
                <li style="margin-bottom: 8px;">Livrarea se face în 3-5 zile lucrătoare${order.shippingMethod?.description ? ` (${order.shippingMethod.description})` : ""}</li>
              </ul>
            </div>
            
            <!-- Important Info Box -->
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0 0 12px 0; color: #92400e; font-weight: 600;">📋 Informații Importante:</p>
              <p style="margin: 0 0 8px 0; color: #92400e;">Pentru orice întrebări legate de comanda ta, menționează ID-ul comenzii <strong>#${order.id}</strong></p>
              <p style="margin: 0; color: #92400e;">Contactează-ne la <a href="mailto:webira.rem.srl@gmail.com" style="color: #92400e; text-decoration: none; font-weight: 600;">webira.rem.srl@gmail.com</a> sau la <strong>+40 771 248 029</strong></p>
            </div>
            
            <p style="font-size: 16px; color: #374151; text-align: center; margin-top: 32px; line-height: 1.6;">Cu respect,<br><strong>Echipa TechTots</strong></p>
          </div>
          
          <!-- Professional Footer -->
          <div style="background-color: #1f2937; color: #9ca3af; padding: 30px; text-align: center; font-size: 14px; line-height: 1.5;">
            <div style="margin-bottom: 16px;">
              <img src="${logoUrl}" alt="TechTots" style="max-width: 120px; height: auto; opacity: 0.8;" onerror="this.src='${faviconUrl}'; this.style.width='32px'; this.style.height='32px';">
            </div>
            
            <p style="margin: 0 0 16px 0; font-weight: 600; color: #f3f4f6;">TechTots - Jucării STEM pentru Minți Curioase</p>
            
            <div style="margin-bottom: 20px;">
              <p style="margin: 0 0 8px 0;">📧 webira.rem.srl@gmail.com</p>
              <p style="margin: 0 0 16px 0;">📞 +40 771 248 029</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <a href="${baseUrl}/privacy" style="color: #60a5fa; text-decoration: none; margin: 0 12px;">Politica de Confidențialitate</a>
              <a href="${baseUrl}/terms" style="color: #60a5fa; text-decoration: none; margin: 0 12px;">Termeni și Condiții</a>
              <a href="${baseUrl}/contact" style="color: #60a5fa; text-decoration: none; margin: 0 12px;">Contact</a>
            </div>
            
            <p style="margin: 0; font-size: 12px; color: #6b7280;">© ${new Date().getFullYear()} TechTots. Toate drepturile rezervate.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return emailTemplates({
      to,
      subject: `Confirmare Comandă TechTots #${order.id}`,
      html,
      from: `"TechTots" <webira.rem.srl@gmail.com>`,
    });
  },

  /**
   * Password reset email with professional Romanian styling
   */
  passwordReset: async ({
    to,
    resetLink,
  }: {
    to: string;
    resetLink: string;
  }) => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const logoUrl = `${baseUrl}/TechTots_LOGO.png`;
    const faviconUrl = `${baseUrl}/favicon.ico`;

    const html = `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resetare Parolă - TechTots</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Logo -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <img src="${logoUrl}" alt="TechTots Logo" style="max-width: 200px; height: auto; margin-bottom: 16px;" onerror="this.src='${faviconUrl}'; this.style.width='48px'; this.style.height='48px';">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">🔑 Resetare Parolă</h1>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px; line-height: 1.6;">Am primit o solicitare de resetare a parolei pentru contul tău <strong>TechTots</strong>.</p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}" 
                 style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); transition: all 0.3s ease;">
                🔐 Resetează Parola
              </a>
            </div>
            
            <!-- Security Warning -->
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0 0 12px 0; color: #92400e; font-weight: 600;">⚠️ Important:</p>
              <p style="margin: 0; color: #92400e;">Acest link va expira în <strong>1 oră</strong> din motive de securitate. Dacă nu ai solicitat resetarea parolei, poți ignora în siguranță acest email.</p>
            </div>
            
            <!-- Alternative Link -->
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">Sau copiază și lipește acest link în browserul tău:</p>
              <p style="word-break: break-all; color: #3b82f6; margin: 0; font-family: 'Courier New', monospace; font-size: 13px; background-color: #ffffff; padding: 8px; border-radius: 4px; border: 1px solid #e5e7eb;">${resetLink}</p>
            </div>
            
            <!-- Security Tips -->
            <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 32px 0;">
              <h3 style="color: #0369a1; margin: 0 0 12px 0; font-size: 16px;">🛡️ Sfaturi pentru securitatea contului:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #0369a1; line-height: 1.5;">
                <li style="margin-bottom: 8px;">Folosește o parolă unică și puternică, pe care nu o folosești în altă parte</li>
                <li style="margin-bottom: 8px;">Nu-ți împărtăși niciodată parola cu alții</li>
                <li style="margin-bottom: 8px;">Fii prudent cu emailurile suspecte care îți cer informațiile de autentificare</li>
              </ul>
              <p style="margin: 16px 0 0 0;">
                <a href="${baseUrl}/contact" style="color: #0369a1; text-decoration: none; font-weight: 600;">📞 Contactează-ne dacă ai întrebări despre securitate</a>
              </p>
            </div>
            
            <p style="font-size: 16px; color: #374151; text-align: center; margin-top: 32px; line-height: 1.6;">Cu respect,<br><strong>Echipa TechTots</strong></p>
          </div>
          
          <!-- Professional Footer -->
          <div style="background-color: #1f2937; color: #9ca3af; padding: 30px; text-align: center; font-size: 14px; line-height: 1.5;">
            <div style="margin-bottom: 16px;">
              <img src="${logoUrl}" alt="TechTots" style="max-width: 120px; height: auto; opacity: 0.8;" onerror="this.src='${faviconUrl}'; this.style.width='32px'; this.style.height='32px';">
            </div>
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #ffffff;">TechTots - Jucării Educaționale STEM</p>
            <p style="margin: 0 0 16px 0;">📧 webira.rem.srl@gmail.com | 📞 +40 771 248 029</p>
            <div style="border-top: 1px solid #374151; padding-top: 16px; margin-top: 16px;">
              <p style="margin: 0; font-size: 12px;">
                © ${new Date().getFullYear()} TechTots. Toate drepturile rezervate. | 
                <a href="${baseUrl}/privacy" style="color: #60a5fa; text-decoration: none;">Politica de Confidențialitate</a> | 
                <a href="${baseUrl}/terms" style="color: #60a5fa; text-decoration: none;">Termeni și Condiții</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return emailTemplates({
      to,
      subject: "Resetare Parolă - TechTots",
      html: html.replace("+40 123 456 789", "+40 771 248 029"),
      from: `"TechTots" <webira.rem.srl@gmail.com>`,
    });
  },
};
