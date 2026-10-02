/**
 * Payment Failed and Refund Email Templates
 * Romanian professional emails for failed payments and refunds
 */

import { wrapEmailLayout, formatRON, generateOrderTrackingLink } from "./shared-layout";

export interface PaymentFailedData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  amount: number;
  failureReason?: string;
  retryPaymentLink?: string;
}

export interface RefundData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  refundAmount: number;
  refundReason?: string;
  originalPaymentMethod: string;
  estimatedDays?: number;
}

/**
 * Generate payment failed email HTML
 */
export async function generatePaymentFailedEmail(data: PaymentFailedData): Promise<string> {
  const trackingLink = generateOrderTrackingLink(data.orderNumber, data.customerEmail);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://techtots.ro";
  const retryLink = data.retryPaymentLink || `${siteUrl}/checkout?retry=${data.orderNumber}`;
  
  const content = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <!-- Greeting -->
      <tr>
        <td style="padding-bottom: 24px;">
          <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
            Bună ${data.customerName},
          </h2>
          <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
            Din păcate, plata pentru comanda <strong>#${data.orderNumber}</strong> nu a putut fi procesată.
          </p>
        </td>
      </tr>
      
      <!-- Failure Notice -->
      <tr>
        <td style="padding-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fee2e2; border-radius: 8px; border: 1px solid #fca5a5;">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 12px 0; color: #991b1b; font-size: 18px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  ⚠️ Plată eșuată
                </p>
                <p style="margin: 0 0 8px 0; color: #991b1b; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  <strong>Suma:</strong> ${formatRON(data.amount)}
                </p>
                ${data.failureReason ? `
                <p style="margin: 0; color: #991b1b; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  <strong>Motiv:</strong> ${data.failureReason}
                </p>
                ` : ""}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <!-- What to Do -->
      <tr>
        <td style="padding-bottom: 24px;">
          <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
            Ce poți face acum:
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 12px 0;">
                <p style="margin: 0 0 4px 0; color: #1f2937; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  1️⃣ Verifică datele cardului
                </p>
                <p style="margin: 0; color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  Asigură-te că datele cardului sunt corecte și că are fonduri suficiente
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0;">
                <p style="margin: 0 0 4px 0; color: #1f2937; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  2️⃣ Încearcă din nou
                </p>
                <p style="margin: 0; color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  Poți încerca să finalizezi plata folosind butonul de mai jos
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0;">
                <p style="margin: 0 0 4px 0; color: #1f2937; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  3️⃣ Contactează banca
                </p>
                <p style="margin: 0; color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  Dacă problema persistă, contactează banca pentru clarificări
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
              <td align="center" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); border-radius: 8px; padding: 16px 32px;">
                <a href="${retryLink}" style="color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  🔄 Încearcă din nou plata
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <tr>
        <td align="center" style="padding-top: 12px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px; padding: 12px 24px;">
                <a href="${trackingLink}" style="color: #374151; text-decoration: none; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  👁️ Vezi detalii comandă
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
  
  return await wrapEmailLayout(content, {
    preheaderText: `Plata pentru comanda #${data.orderNumber} nu a putut fi procesată. Încearcă din nou.`,
    headerTitle: "⚠️ Plată eșuată",
  });
}

/**
 * Generate refund email HTML
 */
export async function generateRefundEmail(data: RefundData): Promise<string> {
  const trackingLink = generateOrderTrackingLink(data.orderNumber, data.customerEmail);
  const estimatedDays = data.estimatedDays || 5;
  
  const content = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <!-- Greeting -->
      <tr>
        <td style="padding-bottom: 24px;">
          <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
            Bună ${data.customerName},
          </h2>
          <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
            Rambursarea pentru comanda <strong>#${data.orderNumber}</strong> a fost procesată cu succes.
          </p>
        </td>
      </tr>
      
      <!-- Refund Details -->
      <tr>
        <td style="padding-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #d1fae5; border-radius: 8px; border: 1px solid #6ee7b7;">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 16px 0; color: #065f46; font-size: 18px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  💳 Detalii rambursare
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding: 8px 0; color: #065f46; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      Sumă rambursată:
                    </td>
                    <td style="padding: 8px 0; color: #065f46; font-size: 14px; font-weight: 700; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      ${formatRON(data.refundAmount)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #065f46; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      Metodă de plată:
                    </td>
                    <td style="padding: 8px 0; color: #065f46; font-size: 14px; font-weight: 700; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      ${data.originalPaymentMethod}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #065f46; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      Timp estimat:
                    </td>
                    <td style="padding: 8px 0; color: #065f46; font-size: 14px; font-weight: 700; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      ${estimatedDays} zile lucrătoare
                    </td>
                  </tr>
                  ${data.refundReason ? `
                  <tr>
                    <td colspan="2" style="padding: 12px 0 0 0;">
                      <div style="height: 1px; background-color: #6ee7b7;"></div>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding: 8px 0;">
                      <p style="margin: 0; color: #065f46; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                        <strong>Motiv:</strong> ${data.refundReason}
                      </p>
                    </td>
                  </tr>
                  ` : ""}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <!-- Important Information -->
      <tr>
        <td style="padding-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0f9ff; border-radius: 8px; border: 1px solid #bfdbfe;">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  📋 Informații importante
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  <li>Banii vor fi returnați pe același card/metodă folosită la plată</li>
                  <li>Timpul de procesare depinde de banca ta (${estimatedDays} zile lucrătoare în medie)</li>
                  <li>Vei primi confirmarea de la banca ta când suma va fi creditată</li>
                  <li>Dacă nu primești suma în ${estimatedDays + 2} zile, te rugăm să ne contactezi</li>
                </ul>
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
                <a href="${trackingLink}" style="color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  👁️ Vezi detalii comandă
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
  
  return await wrapEmailLayout(content, {
    preheaderText: `Rambursarea pentru comanda #${data.orderNumber} a fost procesată. Suma: ${formatRON(data.refundAmount)}`,
    headerTitle: "💳 Rambursare procesată",
  });
}
