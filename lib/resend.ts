import { Resend } from "resend";

import { getStoreSettings } from "@/lib/utils/store-settings";

// Lazy initialization of Resend client
let resendInstance: Resend | null = null;

function getResendClient(): Resend {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY is not set in environment variables");
      // For build-time compatibility, create a mock instance
      if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
        throw new Error("RESEND_API_KEY is required for email functionality");
      }
      // Return a mock instance for build time
      return new Resend("re_mock_key_for_build");
    }
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

// Export the lazy getter instead of direct instance
export const resend = {
  get emails() {
    return getResendClient().emails;
  },
  get contacts() {
    return getResendClient().contacts;
  },
  get audiences() {
    return getResendClient().audiences;
  },
  get domains() {
    return getResendClient().domains;
  },
  get apiKeys() {
    return getResendClient().apiKeys;
  },
};

// Default configuration for emails
export const defaultEmailConfig = {
  from: process.env.EMAIL_FROM || "onboarding@resend.dev",
  fromName: process.env.EMAIL_FROM_NAME || "TechTots STEM Store",
};

// Helper function to send transactional emails
export async function sendTransactionalEmail({
  to,
  subject,
  html,
  text,
  from = defaultEmailConfig.from,
  replyTo,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}) {
  try {
    const resendClient = getResendClient();
    const result = await resendClient.emails.send({
      from,
      to,
      subject,
      html,
      text,
      replyTo,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to send email with Resend:", error);
    return { success: false, error };
  }
}

// Email templates for different types of emails
export const sendEmailViaUnifiedSystem = {
  async orderConfirmation(data: {
    to: string;
    order: {
      id: string;
      items: Array<{
        name: string;
        quantity: number;
        price: number;
      }>;
      total: number;
      shippingCost: number;
      tax: number;
      taxRatePercentage?: string;
      isFreeShippingActive?: boolean;
      freeShippingThreshold?: number;
    };
  }) {
    const { to, order } = data;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const storeSettings = await getStoreSettings();
    const logoUrl = `${baseUrl}/TechTots_LOGO.png`;
    const faviconUrl = `${baseUrl}/favicon.ico`;

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
          
          <!-- Header with Logo -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
            <img src="${logoUrl}" alt="TechTots Logo" style="max-width: 200px; height: auto; margin-bottom: 16px;" onerror="this.src='${faviconUrl}'; this.style.width='48px'; this.style.height='48px';">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">✅ Confirmare Comandă</h1>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px;">
            <p style="font-size: 18px; color: #374151; margin-bottom: 20px; line-height: 1.6;">Îți mulțumim pentru comandă!</p>
            
            <div style="background-color: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <h2 style="color: #15803d; margin: 0 0 16px 0; font-size: 20px;">📋 Comanda #${order.id}</h2>
              <p style="color: #15803d; margin: 0;">Am primit comanda ta și o vom procesa în curând!</p>
            </div>
            
            <h3 style="color: #374151; font-size: 18px; margin: 32px 0 16px 0;">🛒 Produse comandate:</h3>
            
            <table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <thead>
                <tr style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);">
                  <th style="padding: 16px 8px; text-align: left; color: #1f2937; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Produs</th>
                  <th style="padding: 16px 8px; text-align: center; color: #1f2937; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Cant.</th>
                  <th style="padding: 16px 8px; text-align: right; color: #1f2937; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Preț</th>
                  <th style="padding: 16px 8px; text-align: right; color: #1f2937; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Total</th>
                </tr>
              </thead>
              <tbody style="background-color: #ffffff;">
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%);">
                  <td colspan="3" style="padding: 16px 8px; text-align: right; color: #ffffff; font-weight: 600; font-size: 16px;">Total Comandă:</td>
                  <td style="padding: 16px 8px; text-align: right; color: #ffffff; font-weight: 700; font-size: 18px;">${order.total.toFixed(2)} Lei</td>
                </tr>
                <tr>
                  <td colspan="3" style="text-align: right; padding: 12px 16px; font-weight: 600;">Transport:</td>
                  <td style="text-align: right; padding: 12px 16px; font-weight: 600;">${order.shippingCost > 0 ? `${order.shippingCost.toFixed(2)} Lei` : `<span style="color: #10b981;">Gratuit</span>`}</td>
                </tr>
                <!-- No VAT line - non-VAT registered SRL, prices are final -->
              </tfoot>
            </table>
            
            <div style="background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 32px 0;">
              <h3 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px;">📦 Ce urmează?</h3>
              <p style="color: #1e40af; margin: 0; line-height: 1.6;">Îți vom trimite un email de confirmare expediere când comanda ta va fi pe drum către tine!</p>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${baseUrl}/account/orders" 
                 style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                📋 Vezi Toate Comenzile
              </a>
            </div>
            
            <p style="font-size: 16px; color: #374151; text-align: center; margin-top: 32px; line-height: 1.6;">Cu respect,<br><strong>Echipa TechTots</strong></p>
          </div>
          
          <!-- Professional Footer -->
          <div style="background-color: #1f2937; color: #9ca3af; padding: 30px; text-align: center; font-size: 14px; line-height: 1.5;">
            <div style="margin-bottom: 16px;">
              <img src="${logoUrl}" alt="TechTots" style="max-width: 120px; height: auto; opacity: 0.8;" onerror="this.src='${faviconUrl}'; this.style.width='32px'; this.style.height='32px';">
            </div>
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #ffffff;">TechTots - Jucării Educaționale STEM</p>
            <p style="margin: 0 0 16px 0;">Mehedinti 54-56,Bl D5,APT 70, Cluj-Napoca,Cluj</p>
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

    return await sendTransactionalEmail({
      to,
      subject: `Confirmare Comandă TechTots #${order.id}`,
      html,
    });
  },

  async orderShipped(data: {
    to: string;
    order: { id: string };
    trackingInfo: {
      carrier: string;
      trackingNumber: string;
      trackingUrl: string;
    };
  }) {
    const { to, order, trackingInfo } = data;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const storeSettings = await getStoreSettings();
    const logoUrl = `${baseUrl}/TechTots_LOGO.png`;
    const faviconUrl = `${baseUrl}/favicon.ico`;

    const html = `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Comanda Expediată - TechTots</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Logo -->
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center;">
            <img src="${logoUrl}" alt="TechTots Logo" style="max-width: 200px; height: auto; margin-bottom: 16px;" onerror="this.src='${faviconUrl}'; this.style.width='48px'; this.style.height='48px';">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">🚚 Comanda Expediată!</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9; color: #ffffff;">Comanda ta este în drum către tine!</p>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px;">
            <p style="font-size: 18px; color: #374151; margin-bottom: 20px; line-height: 1.6;">Vești excelente! Comanda ta #${order.id} a fost expediată și este pe drum către tine.</p>
            
            <!-- Shipping Details Box -->
            <div style="background-color: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <h2 style="color: #1e40af; margin: 0 0 16px 0; font-size: 20px;">📦 Detalii Expediere</h2>
              <div style="background-color: #ffffff; border-radius: 8px; padding: 16px; margin-top: 12px;">
                <p style="margin: 0 0 8px 0; color: #374151;"><strong>🚛 Curier:</strong> ${trackingInfo.carrier}</p>
                <p style="margin: 0 0 8px 0; color: #374151;"><strong>📋 Număr Urmărire:</strong> <span style="font-family: monospace; background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${trackingInfo.trackingNumber}</span></p>
                <p style="margin: 8px 0 0 0; color: #374151;"><strong>🔗 Link Urmărire:</strong></p>
                <div style="text-align: center; margin: 16px 0;">
                  <a href="${trackingInfo.trackingUrl}" 
                     style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                    📱 Urmărește Coletul
                  </a>
                </div>
              </div>
            </div>
            
            <!-- Delivery Info -->
            <div style="background-color: #ecfdf5; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 32px 0;">
              <h3 style="color: #059669; margin: 0 0 12px 0; font-size: 16px;">⏱️ Informații Livrare</h3>
              <ul style="margin: 0; padding-left: 20px; color: #047857; line-height: 1.5;">
                <li style="margin-bottom: 8px;">Livrarea se face de obicei în <strong>3-5 zile lucrătoare</strong></li>
                <li style="margin-bottom: 8px;">Vei fi contactat telefonic înainte de livrare</li>
                <li style="margin-bottom: 8px;">Poți urmări coletul în timp real folosind linkul de mai sus</li>
                <li style="margin-bottom: 8px;">Asigură-te că cineva este prezent la adresa de livrare</li>
              </ul>
            </div>
            
            <!-- Action Buttons -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${trackingInfo.trackingUrl}" 
                 style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); margin: 0 8px 8px 0;">
                📱 Urmărește Coletul
              </a>
              <a href="${baseUrl}/account/orders" 
                 style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); margin: 0 8px 8px 0;">
                📋 Toate Comenzile
              </a>
            </div>
            
            <!-- Important Info -->
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0 0 12px 0; color: #92400e; font-weight: 600;">📋 Informații Importante:</p>
              <p style="margin: 0 0 8px 0; color: #92400e;">Dacă ai întrebări despre expediere, menționează codul comenzii <strong>#${order.id}</strong></p>
              <p style="margin: 0; color: #92400e;">Contactează-ne la <a href="mailto:webira.rem.srl@gmail.com" style="color: #92400e; text-decoration: none; font-weight: 600;">webira.rem.srl@gmail.com</a> sau la <strong>+40 771 248 029</strong></p>
            </div>
            
            <p style="font-size: 16px; color: #374151; text-align: center; margin-top: 32px; line-height: 1.6;">Cu respect,<br><strong>Echipa TechTots</strong></p>
          </div>
          
          <!-- Professional Footer -->
          <div style="background-color: #1f2937; color: #9ca3af; padding: 30px; text-align: center; font-size: 14px; line-height: 1.5;">
            <div style="margin-bottom: 16px;">
              <img src="${logoUrl}" alt="TechTots" style="max-width: 120px; height: auto; opacity: 0.8;" onerror="this.src='${faviconUrl}'; this.style.width='32px'; this.style.height='32px';">
            </div>
            
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #ffffff;">TechTots - Jucării Educaționale STEM</p>
            
            <div style="margin-bottom: 20px;">
              <p style="margin: 0 0 8px 0;">📍 Mehedinti 54-56, Bl D5, sc 2, apt 70</p>
              <p style="margin: 0 0 8px 0;">Cluj-Napoca, Cluj, România</p>
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

    return await sendTransactionalEmail({
      to,
      subject: `Comandă Expediată TechTots #${order.id}`,
      html,
    });
  },

  async passwordReset(data: { to: string; resetLink: string }) {
    const { to, resetLink } = data;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const storeSettings = await getStoreSettings();
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
                 style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);">
                🔐 Resetează Parola
              </a>
            </div>
            
            <!-- Security Warning -->
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0 0 12px 0; color: #92400e; font-weight: 600;">⚠️ Important:</p>
              <p style="margin: 0; color: #92400e;">Acest link va expira în <strong>1 oră</strong> din motive de securitate. Dacă nu ai solicitat resetarea parolei, poți ignora în siguranță acest email.</p>
            </div>
            
            <!-- Security Tips -->
            <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 32px 0;">
              <h3 style="color: #0369a1; margin: 0 0 12px 0; font-size: 16px;">🛡️ Sfaturi pentru securitatea contului:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #0369a1; line-height: 1.5;">
                <li style="margin-bottom: 8px;">Folosește o parolă unică și puternică</li>
                <li style="margin-bottom: 8px;">Nu-ți împărtăși niciodată parola cu alții</li>
                <li style="margin-bottom: 8px;">Fii prudent cu emailurile suspecte</li>
              </ul>
            </div>
            
            <p style="font-size: 16px; color: #374151; text-align: center; margin-top: 32px; line-height: 1.6;">Cu respect,<br><strong>Echipa TechTots</strong></p>
          </div>
          
          <!-- Professional Footer -->
          <div style="background-color: #1f2937; color: #9ca3af; padding: 30px; text-align: center; font-size: 14px; line-height: 1.5;">
            <div style="margin-bottom: 16px;">
              <img src="${logoUrl}" alt="TechTots" style="max-width: 120px; height: auto; opacity: 0.8;" onerror="this.src='${faviconUrl}'; this.style.width='32px'; this.style.height='32px';">
            </div>
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #ffffff;">TechTots - Jucării Educaționale STEM</p>
            <p style="margin: 0 0 16px 0;">Mehedinti 54-56,Bl D5,APT 70, Cluj-Napoca,Cluj</p>
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

    return await sendTransactionalEmail({
      to,
      subject: "Resetare Parolă - TechTots",
      html,
    });
  },
};
