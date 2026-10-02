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
  orderNumber: string;
  refundedAmount: number;
  originalTotal: number;
  refundedAt: Date;
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
          <p style="margin: 0; color: #1f2937; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
            Bună, <strong>${data.customerName}</strong>,
          </p>
        </td>
      </tr>
      
      <!-- Status Badge -->
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <table cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); border-radius: 8px; padding: 16px 24px;">
            <tr>
              <td align="center">
                <p style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  ⚠️ Plata nu a putut fi procesată
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <!-- Main message -->
      <tr>
        <td style="padding-bottom: 24px;">
          <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
            Plata pentru comanda <strong>#${data.orderNumber}</strong> în valoare de <strong>${formatRON(data.amount)}</strong> nu a putut fi procesată.
          </p>
          ${data.failureReason ? `
          <p style="margin: 0; color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
            <strong>Motiv:</strong> ${data.failureReason}
          </p>
          ` : ''}
        </td>
      </tr>
      
      <!-- What to do next -->
      <tr>
        <td style="padding-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 16px 0; color: #92400e; font-size: 16px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  Ce poți face?
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://techtots.ro";
  const trackingLink = `${siteUrl}/orders`;
  const refundDate = data.refundedAt.toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  
  const content = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <!-- Greeting -->
      <tr>
        <td style="padding-bottom: 24px;">
          <p style="margin: 0; color: #1f2937; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
            Bună, <strong>${data.customerName}</strong>,
          </p>
        </td>
      </tr>
      
      <!-- Status Badge -->
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <table cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; padding: 16px 24px;">
            <tr>
              <td align="center">
                <p style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  💳 Rambursare procesată cu succes
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <!-- Main message -->
      <tr>
        <td style="padding-bottom: 24px;">
          <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
            Rambursarea pentru comanda <strong>#${data.orderNumber}</strong> a fost procesată cu succes.
          </p>
          <p style="margin: 0; color: #1f2937; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
            Suma va fi returnată în contul tău conform politicilor procesatorului de plăți.
          </p>
        </td>
      </tr>
      
      <!-- Refund details -->
      <tr>
        <td style="padding-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e5e7eb;">
            <tr>
              <td style="padding: 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                            Comandă
                          </td>
                          <td align="right" style="color: #1f2937; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                            #${data.orderNumber}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                            Sumă rambursată
                          </td>
                          <td align="right" style="color: #10b981; font-size: 18px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                            ${formatRON(data.refundedAmount)}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                            Total original
                          </td>
                          <td align="right" style="color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                            ${formatRON(data.originalTotal)}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                            Data rambursării
                          </td>
                          <td align="right" style="color: #1f2937; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                            ${refundDate}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <!-- What to expect -->
      <tr>
        <td style="padding-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe;">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 12px 0; color: #1e40af; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  ℹ️ Ce se întâmplă acum?
                </p>
                <p style="margin: 0; color: #1e3a8a; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6;">
                  Rambursarea a fost procesată. Timpul de revenire a banilor în contul tău depinde de procesatorul de plăți și de banca ta. De obicei, sumele apar în cont în câteva zile lucrătoare, dar în unele cazuri poate dura mai mult.
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
              <td align="center" style="background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px; padding: 12px 24px;">
                <a href="${trackingLink}" style="color: #374151; text-decoration: none; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  👁️ Vezi toate comenzile
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <!-- Help section -->
      <tr>
        <td style="padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
            <strong>Întrebări?</strong> Echipa noastră de suport este aici să te ajute!
          </p>
          <p style="margin: 0; color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
            📧 Scrie-ne la <a href="mailto:info@techtots.ro" style="color: #3b82f6; text-decoration: none;">info@techtots.ro</a>
          </p>
        </td>
      </tr>
    </table>
  `;
  
  return await wrapEmailLayout(content, {
    preheaderText: `Rambursare procesată pentru comanda #${data.orderNumber}`,
    headerTitle: "💳 Rambursare procesată",
  });
}
