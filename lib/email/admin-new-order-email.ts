/**
 * Admin New Order Email
 * Notify admins of new orders with complete details
 */

import { wrapEmailLayout, formatRON } from "./shared-layout";

export interface AdminNewOrderData {
  orderNumber: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  paymentMethod: string;
  
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    sku?: string;
  }>;
  
  subtotal: number;
  shippingCost: number;
  codFee?: number;
  total: number;
}

/**
 * Generate admin new-order email HTML
 */
export async function generateAdminNewOrderEmail(data: AdminNewOrderData): Promise<string> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://techtots.ro";
  const adminLink = `${siteUrl}/admin/orders/${data.orderId}`;
  
  const content = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <!-- Alert Header -->
      <tr>
        <td style="padding-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #dbeafe; border-radius: 8px; border: 1px solid #93c5fd;">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0; color: #1e40af; font-size: 18px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  🛒 Comandă nouă #${data.orderNumber}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <!-- Customer & Order Info -->
      <tr>
        <td style="padding-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e5e7eb;">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  👤 Date client
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      Nume:
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 700; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      ${data.customerName}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      Email:
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 700; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      <a href="mailto:${data.customerEmail}" style="color: #3b82f6; text-decoration: none;">${data.customerEmail}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      Metodă plată:
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 700; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      ${data.paymentMethod}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      Total comandă:
                    </td>
                    <td style="padding: 8px 0; color: #3b82f6; font-size: 18px; font-weight: 700; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      ${formatRON(data.total)}
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
            📦 Produse comandate
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
                                ${item.quantity} × ${formatRON(item.price)}${item.sku ? ` | SKU: ${item.sku}` : ""}
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
      
      <!-- Price Summary -->
      <tr>
        <td style="padding-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e5e7eb;">
            <tr>
              <td style="padding: 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      Subtotal:
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
                  <tr>
                    <td colspan="2" style="padding: 8px 0;">
                      <div style="height: 1px; background-color: #e5e7eb;"></div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 16px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      TOTAL:
                    </td>
                    <td style="padding: 8px 0; color: #3b82f6; font-size: 16px; font-weight: 700; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      ${formatRON(data.total)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <!-- Admin CTA -->
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); border-radius: 8px; padding: 16px 32px;">
                <a href="${adminLink}" style="color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  👁️ Vezi comanda în admin
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
  
  return await wrapEmailLayout(content, {
    preheaderText: `Comandă nouă #${data.orderNumber} de la ${data.customerName} - ${formatRON(data.total)}`,
    headerTitle: "🛒 Comandă nouă",
  });
}
