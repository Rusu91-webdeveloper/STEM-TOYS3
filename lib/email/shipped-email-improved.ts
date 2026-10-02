/**
 * Improved Shipped Email
 * Automatic email sent when AWB is created or order is marked as shipped
 */

import {
  wrapEmailLayout,
  formatRON,
  generateFanCourierTrackingLink,
  generateOrderTrackingLink,
} from "./shared-layout";

export interface ShippedEmailData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  trackingNumber: string;
  carrier: string;
  shippedDate: Date;
  estimatedDeliveryDays?: number;
  
  // For COD orders
  isCOD?: boolean;
  codAmount?: number;
}

/**
 * Generate shipped email HTML
 */
export async function generateShippedEmail(data: ShippedEmailData): Promise<string> {
  const trackingLink = data.carrier.toLowerCase().includes("fancourier")
    ? generateFanCourierTrackingLink(data.trackingNumber)
    : generateOrderTrackingLink(data.orderNumber, data.customerEmail);
    
  const formattedDate = new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "long",
  }).format(data.shippedDate);
  
  const content = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <!-- Greeting -->
      <tr>
        <td style="padding-bottom: 24px;">
          <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
            Bună ${data.customerName}! 🎉
          </h2>
          <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
            Vestea bună! Comanda ta <strong>#${data.orderNumber}</strong> a fost predată curierului ${data.carrier}.
          </p>
        </td>
      </tr>
      
      <!-- Shipping Details -->
      <tr>
        <td style="padding-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #d1fae5; border-radius: 8px; border: 1px solid #6ee7b7;">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 16px 0; color: #065f46; font-size: 18px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  📦 Informații expediere
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding: 8px 0; color: #065f46; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      Număr AWB:
                    </td>
                    <td style="padding: 8px 0; color: #065f46; font-size: 14px; font-weight: 700; text-align: right; font-family: 'Courier New', monospace;">
                      ${data.trackingNumber}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #065f46; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      Curier:
                    </td>
                    <td style="padding: 8px 0; color: #065f46; font-size: 14px; font-weight: 700; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      ${data.carrier}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #065f46; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      Data expedierii:
                    </td>
                    <td style="padding: 8px 0; color: #065f46; font-size: 14px; font-weight: 700; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      ${formattedDate}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      ${data.isCOD && data.codAmount ? `
      <!-- COD Reminder -->
      <tr>
        <td style="padding-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 8px 0; color: #92400e; font-size: 16px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  💵 Plată la primire
                </p>
                <p style="margin: 0; color: #92400e; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  Pregătește suma de <strong>${formatRON(data.codAmount)}</strong> pentru plata către curier la primirea coletului.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ` : ""}
      
      <!-- Tracking Instructions -->
      <tr>
        <td style="padding-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0f9ff; border-radius: 8px; border: 1px solid #bfdbfe;">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  📱 Urmărește-ți coletul
                </p>
                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  Folosește numărul AWB de mai sus pentru a urmări statusul coletului în timp real pe site-ul ${data.carrier}.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <!-- Delivery Tips -->
      <tr>
        <td style="padding-bottom: 24px;">
          <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
            💡 Sfaturi pentru primirea coletului
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 12px 0;">
                <p style="margin: 0 0 4px 0; color: #1f2937; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  1️⃣ Urmărește statusul
                </p>
                <p style="margin: 0; color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  Folosește numărul AWB pentru a ști exact când ajunge coletul
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0;">
                <p style="margin: 0 0 4px 0; color: #1f2937; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  2️⃣ Fii prezent
                </p>
                <p style="margin: 0; color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  Asigură-te că cineva este acasă pentru a prelua coletul
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0;">
                <p style="margin: 0 0 4px 0; color: #1f2937; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  3️⃣ Verifică conținutul
                </p>
                <p style="margin: 0; color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  Verifică starea coletului și conținutul la primire
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <!-- CTA Buttons -->
      <tr>
        <td align="center" style="padding-bottom: 12px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; padding: 16px 32px;">
                <a href="${trackingLink}" style="color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  📦 Urmărește pe ${data.carrier}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
  
  return await wrapEmailLayout(content, {
    preheaderText: `Comanda #${data.orderNumber} a fost expediată! AWB: ${data.trackingNumber}`,
    headerTitle: "🚚 Comanda expediată!",
  });
}
