/**
 * Shared branded email layout for TechTots
 * Professional, mobile-responsive table-based layout with Romanian branding
 */

import { getAppConfig } from "@/lib/config/app-config";

export interface EmailLayoutOptions {
  preheaderText?: string;
  headerTitle?: string;
  footerNote?: string;
}

/**
 * Format currency in Romanian format (comma decimal, space thousands)
 */
export function formatRON(amount: number): string {
  return new Intl.NumberFormat("ro-RO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + " RON";
}

/**
 * Generate branded email header with logo and styling
 */
export function generateEmailHeader(title: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table width="600" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  ${title}
                </h1>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Generate branded email footer with contact info, legal details, and links
 */
export async function generateEmailFooter(): Promise<string> {
  const config = await getAppConfig();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://techtots.ro";
  
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-top: 1px solid #e5e7eb;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table width="600" cellpadding="0" cellspacing="0" border="0">
            <!-- Contact Information -->
            <tr>
              <td style="padding-bottom: 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center">
                      <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                        Contact
                      </p>
                      <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                        📞 ${config.storePhoneFormatted}
                      </p>
                      <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                        📧 <a href="mailto:${config.contactEmail}" style="color: #3b82f6; text-decoration: none;">${config.contactEmail}</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- Legal Information -->
            <tr>
              <td style="padding-bottom: 20px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center">
                      <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                        <strong>${config.legalName}</strong>
                      </p>
                      <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                        ${config.fullAddress}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- Consumer Rights -->
            <tr>
              <td style="padding-bottom: 20px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center">
                      <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                        🛡️ Drepturile tale
                      </p>
                      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                        Ai dreptul de a returna produsele în termen de <strong>14 zile</strong> de la primire, conform OUG 34/2014.
                      </p>
                      <p style="margin: 0; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                        <a href="${siteUrl}/politica-returnari" style="color: #3b82f6; text-decoration: none;">Politica de returnări</a>
                        <span style="color: #d1d5db; margin: 0 8px;">|</span>
                        <a href="${siteUrl}/termeni-si-conditii" style="color: #3b82f6; text-decoration: none;">Termeni și condiții</a>
                        <span style="color: #d1d5db; margin: 0 8px;">|</span>
                        <a href="${siteUrl}/politica-confidentialitate" style="color: #3b82f6; text-decoration: none;">Confidențialitate</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- Branding -->
            <tr>
              <td style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                        <strong>${config.storeName}</strong> - Jucării STEM pentru Minți Curioase
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Wrap content in a complete branded email layout
 */
export async function wrapEmailLayout(
  content: string,
  options: EmailLayoutOptions = {}
): Promise<string> {
  const { preheaderText = "", headerTitle = "TechTots", footerNote } = options;
  const footer = await generateEmailFooter();

  return `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${headerTitle}</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    .ReadMsgBody { width: 100%; }
    .ExternalClass { width: 100%; }
  </style>
  <![endif]-->
  ${preheaderText ? `
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    ${preheaderText}
  </div>
  ` : ""}
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff;">
          ${generateEmailHeader(headerTitle)}
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 20px;">
              ${content}
            </td>
          </tr>
          
          ${footerNote ? `
          <!-- Footer Note -->
          <tr>
            <td style="padding: 0 20px 20px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      <strong>💡 Notă:</strong> ${footerNote}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ""}
          
          ${footer}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generate order tracking link for both guests and logged-in users
 */
export function generateOrderTrackingLink(orderNumber: string, email: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://techtots.ro";
  return `${siteUrl}/track-order?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`;
}

/**
 * Generate FanCourier tracking link
 */
export function generateFanCourierTrackingLink(awbNumber: string): string {
  return `https://www.fancourier.ro/awb-tracking/?tracking=${encodeURIComponent(awbNumber)}`;
}
