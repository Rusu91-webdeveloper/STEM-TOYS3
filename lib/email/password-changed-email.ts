import { COMPANY_LEGAL } from "@/lib/config/company-legal";
import { wrapEmailLayout } from "./shared-layout";

export interface PasswordChangedData {
  userName: string;
  userEmail: string;
  changeTime: string;
  deviceInfo: string;
  ipAddress: string;
}

/**
 * Generate password changed email HTML
 */
export async function generatePasswordChangedEmail(data: PasswordChangedData): Promise<string> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://techtots.ro";
  const supportEmail = COMPANY_LEGAL.email;
  
  const content = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <!-- Greeting -->
      <tr>
        <td style="padding-bottom: 24px;">
          <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
            Salut, ${data.userName}! 👋
          </h2>
          <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
            Parola contului tău TechTots a fost schimbată cu succes la ${data.changeTime}.
          </p>
        </td>
      </tr>
      
      <!-- Success Notice -->
      <tr>
        <td style="padding-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #d1fae5; border-radius: 8px; border: 1px solid #6ee7b7;">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 8px 0; color: #065f46; font-size: 18px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  ✅ Schimbare confirmată
                </p>
                <p style="margin: 0; color: #065f46; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  Parola ta a fost actualizată cu succes. Contul tău este sigur.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <!-- Change Details -->
      <tr>
        <td style="padding-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e5e7eb;">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  📱 Detalii despre schimbare
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      Data și ora:
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      ${data.changeTime}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      Dispozitiv:
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      ${data.deviceInfo}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      Adresă IP:
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      ${data.ipAddress}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <!-- Security Warning -->
      <tr>
        <td style="padding-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 8px 0; color: #92400e; font-size: 16px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  ⚠️ Important
                </p>
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  Dacă nu ai făcut tu această schimbare, te rugăm să ne contactezi imediat la <a href="mailto:${supportEmail}" style="color: #92400e; text-decoration: underline;">${supportEmail}</a> sau la <strong>+40 771 248 029</strong>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <!-- CTA Button -->
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); border-radius: 8px; padding: 16px 32px;">
                <a href="${siteUrl}/account" style="color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  🔐 Accesează contul
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
  
  return await wrapEmailLayout(content, {
    preheaderText: "Parola contului tău TechTots a fost schimbată cu succes.",
    headerTitle: "🔒 Parolă schimbată",
  });
}
