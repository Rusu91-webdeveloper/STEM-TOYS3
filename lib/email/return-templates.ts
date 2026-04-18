/**
 * Return email templates
 * Includes return approved, rejected, and pending confirmation emails
 */

import { getEmailService } from "./index";
import {
  getStoreSettings,
  getBaseUrl,
  generateEmailHTML,
} from "./base";

// Romanian reason labels
const reasonLabelsRo: Record<string, string> = {
  DOES_NOT_MEET_EXPECTATIONS: "Produsul nu este pe placul meu",
  DAMAGED_OR_DEFECTIVE: "Produs defect sau nefuncțional",
  MISSING_PARTS: "Produsul are piese lipsă / incomplet",
  WRONG_ITEM_SHIPPED: "Am primit alt produs decât cel comandat",
  DAMAGED_IN_TRANSIT: "Cutia a ajuns deteriorată și produsul a fost afectat",
  CHANGED_MIND: "M-am răzgândit",
  ORDERED_WRONG_PRODUCT: "Am comandat produsul greșit",
  OTHER: "Alt motiv",
};

/**
 * Send Return Approved Email with PDF Label
 */
export async function sendReturnApprovedEmail({
  to,
  customerName,
  orderNumber,
  orderDate,
  productName,
  quantity,
  reason,
  pdfBase64,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  orderDate: string;
  productName: string;
  quantity: number;
  reason: string;
  pdfBase64?: string;
}) {
  const storeSettings = await getStoreSettings();
  const baseUrl = getBaseUrl();
  const reasonLabel = reasonLabelsRo[reason] || reason;

  const html = `
    <!DOCTYPE html>
    <html lang="ro">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Returnare Aprobată - ${storeSettings.storeName}</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">✅ Returnare Aprobată</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${storeSettings.storeName}</p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Salut <strong>${customerName}</strong>,</p>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">Vă informăm că cererea dumneavoastră de returnare a fost <strong style="color: #059669;">APROBATĂ</strong>.</p>
          
          <!-- Return Details Box -->
          <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <h3 style="color: #047857; margin: 0 0 16px 0; font-size: 18px;">📋 Detalii Returnare</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #047857; font-weight: 600; width: 40%;">Număr Comandă:</td>
                <td style="padding: 8px 0; color: #1f2937;">#${orderNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #047857; font-weight: 600;">Data Comenzii:</td>
                <td style="padding: 8px 0; color: #1f2937;">${orderDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #047857; font-weight: 600;">Produs:</td>
                <td style="padding: 8px 0; color: #1f2937;">${productName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #047857; font-weight: 600;">Cantitate:</td>
                <td style="padding: 8px 0; color: #1f2937;">${quantity}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #047857; font-weight: 600;">Motiv:</td>
                <td style="padding: 8px 0; color: #1f2937;">${reasonLabel}</td>
              </tr>
            </table>
          </div>
          
          <!-- Instructions -->
          <h3 style="color: #1f2937; margin: 24px 0 16px 0;">📦 Instrucțiuni pentru Returnare:</h3>
          <ol style="line-height: 1.8; color: #374151; padding-left: 20px;">
            <li><strong>Printați eticheta de returnare</strong> atașată acestui email.</li>
            <li>Împachetați produsul în ambalajul original (dacă este posibil).</li>
            <li>Atașați eticheta de returnare pe pachet.</li>
            <li>Duceți pachetul la orice oficiu poștal sau punct de curierat.</li>
            <li>Păstrați dovada de expediere până la procesarea returnării.</li>
          </ol>
          
          <!-- Warning -->
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #92400e; font-weight: 600;">⚠️ Aveți la dispoziție 14 zile de la aprobarea acestei returnări pentru a expedia pachetul.</p>
          </div>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">Veți primi o confirmare email când vom procesa returnarea și rambursarea dumneavoastră.</p>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${baseUrl}/account/returns" 
               style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
              📋 Vezi Statusul Returnării
            </a>
          </div>
          
          <p style="font-size: 16px; color: #374151; margin-top: 32px;">Dacă aveți întrebări, contactați-ne la <a href="mailto:${storeSettings.contactEmail}" style="color: #3b82f6;">${storeSettings.contactEmail}</a></p>
          
          <p style="font-size: 16px; color: #374151; margin-top: 24px;">Cu respect,<br><strong>Echipa ${storeSettings.storeName}</strong></p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #1f2937; color: #9ca3af; padding: 30px; text-align: center; font-size: 14px;">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #ffffff;">${storeSettings.storeName}</p>
          <p style="margin: 0 0 16px 0;">📧 ${storeSettings.contactEmail}</p>
          <p style="margin: 0; font-size: 12px;">© ${new Date().getFullYear()} ${storeSettings.storeName}. Toate drepturile rezervate.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailService = getEmailService();
  
  // Build attachments array if PDF is provided
  const attachments = pdfBase64 ? [
    {
      filename: `TechTots_Eticheta_Returnare_${orderNumber}.pdf`,
      content: pdfBase64,
      contentType: "application/pdf",
    },
  ] : undefined;

  return emailService.sendEmail({
    to,
    subject: `✅ Returnare Aprobată - Comanda #${orderNumber} - ${storeSettings.storeName}`,
    html,
    attachments,
  });
}

/**
 * Send Return Rejected Email
 */
export async function sendReturnRejectedEmail({
  to,
  customerName,
  orderNumber,
  orderDate,
  productName,
  reason,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  orderDate: string;
  productName: string;
  reason: string;
}) {
  const storeSettings = await getStoreSettings();
  const baseUrl = getBaseUrl();
  const reasonLabel = reasonLabelsRo[reason] || reason;

  const html = `
    <!DOCTYPE html>
    <html lang="ro">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cerere de Returnare Respinsă - ${storeSettings.storeName}</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">❌ Cerere Respinsă</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${storeSettings.storeName}</p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Salut <strong>${customerName}</strong>,</p>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">Ne pare rău să vă informăm că cererea dumneavoastră de returnare pentru produsul <strong>${productName}</strong> din comanda <strong>#${orderNumber}</strong> a fost <strong style="color: #dc2626;">RESPINSĂ</strong>.</p>
          
          <!-- Return Details Box -->
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <h3 style="color: #991b1b; margin: 0 0 16px 0; font-size: 18px;">📋 Detalii Cerere</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #991b1b; font-weight: 600; width: 40%;">Număr Comandă:</td>
                <td style="padding: 8px 0; color: #1f2937;">#${orderNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #991b1b; font-weight: 600;">Data Comenzii:</td>
                <td style="padding: 8px 0; color: #1f2937;">${orderDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #991b1b; font-weight: 600;">Produs:</td>
                <td style="padding: 8px 0; color: #1f2937;">${productName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #991b1b; font-weight: 600;">Motiv Solicitare:</td>
                <td style="padding: 8px 0; color: #1f2937;">${reasonLabel}</td>
              </tr>
            </table>
          </div>
          
          <!-- What You Can Do -->
          <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <h3 style="color: #c2410c; margin: 0 0 16px 0; font-size: 18px;">🔄 Ce puteți face?</h3>
            <ul style="margin: 0; padding-left: 20px; color: #9a3412; line-height: 1.8;">
              <li>Contactați-ne pentru mai multe detalii despre motivul respingerii</li>
              <li>Furnizați informații suplimentare sau fotografii care ar putea susține cererea</li>
              <li>Solicitați o reevaluare a cererii de returnare</li>
            </ul>
          </div>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">Dacă considerați că această decizie este incorectă sau aveți întrebări, vă rugăm să ne contactați.</p>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="mailto:${storeSettings.contactEmail}" 
               style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
              📧 Contactează-ne
            </a>
          </div>
          
          <p style="font-size: 16px; color: #374151; margin-top: 24px;">Cu respect,<br><strong>Echipa ${storeSettings.storeName}</strong></p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #1f2937; color: #9ca3af; padding: 30px; text-align: center; font-size: 14px;">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #ffffff;">${storeSettings.storeName}</p>
          <p style="margin: 0 0 16px 0;">📧 ${storeSettings.contactEmail}</p>
          <p style="margin: 0; font-size: 12px;">© ${new Date().getFullYear()} ${storeSettings.storeName}. Toate drepturile rezervate.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailService = getEmailService();
  return emailService.sendEmail({
    to,
    subject: `❌ Cerere de Returnare Respinsă - Comanda #${orderNumber} - ${storeSettings.storeName}`,
    html,
  });
}

/**
 * Send Bulk Return Approved Email
 */
export async function sendBulkReturnApprovedEmail({
  to,
  customerName,
  orderNumber,
  orderDate,
  items,
  pdfBase64,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: Array<{
    productName: string;
    quantity: number;
    reason: string;
  }>;
  pdfBase64?: string;
}) {
  const storeSettings = await getStoreSettings();
  const baseUrl = getBaseUrl();

  const itemsHtml = items
    .map(
      item => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 8px; color: #374151;">${item.productName}</td>
      <td style="padding: 12px 8px; text-align: center; color: #374151;">${item.quantity}</td>
      <td style="padding: 12px 8px; color: #374151;">${reasonLabelsRo[item.reason] || item.reason}</td>
    </tr>
  `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="ro">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Returnări Aprobate - ${storeSettings.storeName}</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">✅ Returnări Aprobate</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${items.length} articol(e) din comanda #${orderNumber}</p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Salut <strong>${customerName}</strong>,</p>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">Vă informăm că toate cererile de returnare pentru comanda <strong>#${orderNumber}</strong> au fost <strong style="color: #059669;">APROBATE</strong>.</p>
          
          <!-- Order Info -->
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #6b7280;"><strong>Număr Comandă:</strong> #${orderNumber}</p>
            <p style="margin: 8px 0 0 0; color: #6b7280;"><strong>Data Comenzii:</strong> ${orderDate}</p>
          </div>
          
          <!-- Items Table -->
          <h3 style="color: #1f2937; margin: 24px 0 16px 0;">📦 Articole pentru Returnare:</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background-color: #f8fafc;">
                <th style="text-align: left; padding: 12px 8px; border-bottom: 2px solid #e5e7eb; color: #374151;">Produs</th>
                <th style="text-align: center; padding: 12px 8px; border-bottom: 2px solid #e5e7eb; color: #374151;">Cant.</th>
                <th style="text-align: left; padding: 12px 8px; border-bottom: 2px solid #e5e7eb; color: #374151;">Motiv</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <!-- Instructions -->
          <h3 style="color: #1f2937; margin: 24px 0 16px 0;">📝 Instrucțiuni pentru Returnare:</h3>
          <ol style="line-height: 1.8; color: #374151; padding-left: 20px;">
            <li><strong>Printați eticheta de returnare</strong> atașată acestui email.</li>
            <li><strong>Împachetați TOATE produsele în același pachet</strong> (folosiți ambalajul original dacă este posibil).</li>
            <li>Atașați eticheta de returnare pe pachet.</li>
            <li>Duceți pachetul la orice oficiu poștal sau punct de curierat.</li>
            <li>Păstrați dovada de expediere.</li>
          </ol>
          
          <!-- Important Notice -->
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; color: #92400e; font-weight: 600;">⚠️ Important:</p>
            <p style="margin: 0; color: #92400e;">Toate articolele trebuie returnate într-un singur pachet folosind eticheta atașată. Nu folosiți etichete separate pentru fiecare articol.</p>
          </div>
          
          <p style="font-size: 16px; color: #dc2626; font-weight: 600;">Aveți la dispoziție 14 zile de la aprobarea acestei returnări pentru a expedia pachetul.</p>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${baseUrl}/account/returns" 
               style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
              📋 Vezi Statusul Returnărilor
            </a>
          </div>
          
          <p style="font-size: 16px; color: #374151; margin-top: 24px;">Cu respect,<br><strong>Echipa ${storeSettings.storeName}</strong></p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #1f2937; color: #9ca3af; padding: 30px; text-align: center; font-size: 14px;">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #ffffff;">${storeSettings.storeName}</p>
          <p style="margin: 0 0 16px 0;">📧 ${storeSettings.contactEmail}</p>
          <p style="margin: 0; font-size: 12px;">© ${new Date().getFullYear()} ${storeSettings.storeName}. Toate drepturile rezervate.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailService = getEmailService();
  
  const attachments = pdfBase64 ? [
    {
      filename: `TechTots_Eticheta_Returnare_Bulk_${orderNumber}.pdf`,
      content: pdfBase64,
      contentType: "application/pdf",
    },
  ] : undefined;

  return emailService.sendEmail({
    to,
    subject: `✅ Returnare Aprobată pentru ${items.length} Articol(e) - Comanda #${orderNumber}`,
    html,
    attachments,
  });
}
