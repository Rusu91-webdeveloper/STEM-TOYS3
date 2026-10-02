/**
 * Improved Order Confirmation Email
 * Supports both COD and paid orders with correct formatting and information
 */

import {
  wrapEmailLayout,
  formatRON,
  generateOrderTrackingLink,
} from "./shared-layout";

export interface OrderConfirmationData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  orderDate: Date;
  paymentMethod: string;
  paymentStatus: string;
  
  // Line items
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  
  // Pricing breakdown
  subtotal: number;
  shippingCost: number;
  codFee?: number;
  discountAmount?: number;
  total: number;
  
  // Shipping
  shippingAddress: {
    fullName?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
    phone?: string | null;
  };
  
  // COD-specific
  isCOD: boolean;
  codAmount?: number;
  hasCardHold?: boolean;
  cardHoldAmount?: number;
}

/**
 * Format shipping address for display
 */
function formatShippingAddress(address: OrderConfirmationData["shippingAddress"]): string {
  const parts = [
    address.fullName,
    address.addressLine1,
    address.addressLine2,
    `${address.postalCode} ${address.city}`,
    address.state,
    address.country,
  ].filter(Boolean);
  
  return parts.join("<br>");
}

/**
 * Generate order confirmation email HTML
 */
export async function generateOrderConfirmationEmail(
  data: OrderConfirmationData
): Promise<string> {
  const trackingLink = generateOrderTrackingLink(data.orderNumber, data.customerEmail);
  const formattedDate = new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "long",
  }).format(data.orderDate);
  
  const content = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <!-- Greeting -->
      <tr>
        <td style="padding-bottom: 24px;">
          <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
            Bună ${data.customerName}! 👋
          </h2>
          <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
            Îți mulțumim pentru comandă! Am primit comanda ta <strong>#${data.orderNumber}</strong> și o procesăm cu atenție.
          </p>
        </td>
      </tr>
      
      ${data.isCOD ? `
      <!-- COD Notice -->
      <tr>
        <td style="padding-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  💵 Plată la livrare (ramburs)
                </p>
                <p style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  <strong>Sumă de plată curierului:</strong> ${formatRON(data.codAmount || data.total)}
                </p>
                <p style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  ☎️ Te vom suna pentru confirmarea comenzii înainte de a o expedia.
                </p>
                ${data.hasCardHold && data.cardHoldAmount != null ? `
                <p style="margin: 0; color: #92400e; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  💳 Am blocat temporar ${formatRON(data.cardHoldAmount)} pe cardul tău ca garanție. Această sumă va fi eliberată automat după livrare.
                </p>
                ` : ""}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ` : `
      <!-- Paid Order Notice -->
      <tr>
        <td style="padding-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #d1fae5; border-radius: 8px; border: 1px solid #6ee7b7;">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0; color: #065f46; font-size: 16px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  ✅ Plată finalizată cu succes
                </p>
                <p style="margin: 8px 0 0 0; color: #065f46; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  Plata în valoare de <strong>${formatRON(data.total)}</strong> a fost procesată.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      `}
      
      <!-- Order Details -->
      <tr>
        <td style="padding-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e5e7eb;">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  📦 Detalii comandă
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      <strong>Număr comandă:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      #${data.orderNumber}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      <strong>Data:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      ${formattedDate}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      <strong>Metodă plată:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      ${data.isCOD ? "Ramburs (plată la livrare)" : "Card bancar"}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <!-- Order Items -->
      <tr>
        <td style="padding-bottom: 24px;">
          <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
            🛍️ Produse comandate
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; border-radius: 8px;">
            ${data.items.map((item, index) => {
              const lineTotal = item.quantity * item.price;
              const isLast = index === data.items.length - 1;
              return `
                <tr>
                  <td style="padding: 16px; ${!isLast ? 'border-bottom: 1px solid #e5e7eb;' : ''}">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="color: #1f2937; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                          ${item.name}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 4px;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                                ${item.quantity} × ${formatRON(item.price)}
                              </td>
                              <td style="color: #1f2937; font-size: 14px; font-weight: 600; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                                ${formatRON(lineTotal)}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              `;
            }).join("")}
          </table>
        </td>
      </tr>
      
      <!-- Price Breakdown -->
      <tr>
        <td style="padding-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e5e7eb;">
            <tr>
              <td style="padding: 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      Subtotal produse:
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      ${formatRON(data.subtotal)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      Transport:
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      ${formatRON(data.shippingCost)}
                    </td>
                  </tr>
                  ${data.codFee ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      Taxă ramburs:
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      ${formatRON(data.codFee)}
                    </td>
                  </tr>
                  ` : ""}
                  ${data.discountAmount && data.discountAmount > 0 ? `
                  <tr>
                    <td style="padding: 8px 0; color: #16a34a; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      Reducere aplicată:
                    </td>
                    <td style="padding: 8px 0; color: #16a34a; font-size: 14px; font-weight: 600; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      -${formatRON(data.discountAmount)}
                    </td>
                  </tr>
                  ` : ""}
                  <tr>
                    <td colspan="2" style="padding: 8px 0;">
                      <div style="height: 1px; background-color: #e5e7eb;"></div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 18px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      ${data.isCOD ? "Total de plată:" : "Total plătit:"}
                    </td>
                    <td style="padding: 8px 0; color: #3b82f6; font-size: 18px; font-weight: 700; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      ${formatRON(data.total)}
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding: 4px 0 0 0;">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                        TVA inclus în prețuri
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <!-- Shipping Address -->
      <tr>
        <td style="padding-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0f9ff; border-radius: 8px; border: 1px solid #bfdbfe;">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  🏠 Adresa de livrare
                </p>
                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  ${formatShippingAddress(data.shippingAddress)}
                  ${data.shippingAddress.phone ? `<br>📞 ${data.shippingAddress.phone}` : ""}
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
                <a href="${trackingLink}" style="color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  👁️ Urmărește comanda
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
  
  return await wrapEmailLayout(content, {
    preheaderText: `Comanda #${data.orderNumber} confirmată! ${data.isCOD ? "Plată la livrare" : "Plată finalizată cu succes"}`,
    headerTitle: "✅ Comanda confirmată!",
    footerNote: data.isCOD ? "Te vom contacta telefonic pentru confirmarea comenzii înainte de expediere." : undefined,
  });
}
