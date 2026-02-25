import { sendEmailViaUnifiedSystem } from "@/lib/nodemailer";
import { getStoreSettings } from "@/lib/utils/store-settings";

type SupplierAwbEmailItem = {
  name: string;
  sku?: string | null;
  barcode?: string | null;
  imageUrl?: string | null;
  quantity: number;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export async function sendSupplierAwbLabelEmail(input: {
  to: string;
  supplierName: string;
  orderNumber: string;
  awbNumber: string;
  pdfBase64?: string;
  orderItems?: SupplierAwbEmailItem[];
}) {
  const storeSettings = await getStoreSettings();
  const hasAttachment = Boolean(input.pdfBase64);
  const hasItems =
    Array.isArray(input.orderItems) && input.orderItems.length > 0;

  const orderItemsSection = hasItems
    ? `
          <div style="margin:16px 0;">
            <p style="margin:0 0 8px 0;font-size:13px;color:#0f172a;">
              <strong>Produse în comandă:</strong>
            </p>
            <table role="presentation" style="width:100%;border-collapse:collapse;font-size:13px;color:#0f172a;">
              <thead>
                <tr>
                  <th align="left" style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;width:60px;">Foto</th>
                  <th align="left" style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;">Produs</th>
                  <th align="left" style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;">SKU / Cod</th>
                  <th align="right" style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;">Cant.</th>
                </tr>
              </thead>
              <tbody>
                ${input
                  .orderItems!.map(
                    item => `
                  <tr>
                    <td style="padding:8px;border:1px solid #e2e8f0;text-align:center;">
                      ${
                        item.imageUrl
                          ? `<img src="${item.imageUrl}" alt="" width="50" height="50" style="width:50px;height:50px;object-fit:cover;border-radius:4px;display:block;margin:0 auto;" />`
                          : `<div style="width:50px;height:50px;background:#f1f5f9;border-radius:4px;display:inline-block;line-height:50px;text-align:center;font-size:18px;">📦</div>`
                      }
                    </td>
                    <td style="padding:8px;border:1px solid #e2e8f0;">${escapeHtml(item.name || "Produs")}</td>
                    <td style="padding:8px;border:1px solid #e2e8f0;">
                      ${item.sku?.trim() ? `<span style="display:block;font-weight:600;">SKU: ${escapeHtml(item.sku.trim())}</span>` : ""}
                      ${item.barcode?.trim() ? `<span style="display:block;color:#475569;font-size:12px;">Cod de bare: ${escapeHtml(item.barcode.trim())}</span>` : ""}
                      ${!item.sku?.trim() && !item.barcode?.trim() ? `<span style="color:#94a3b8;">-</span>` : ""}
                    </td>
                    <td align="right" style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">${item.quantity}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `
    : "";

  const subject = `AWB FanCourier pentru comanda #${input.orderNumber}`;
  const html = `
    <!DOCTYPE html>
    <html lang="ro">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>AWB FanCourier</title>
    </head>
    <body style="margin:0;padding:20px;background-color:#f3f4f6;font-family:Arial,sans-serif;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:#0f172a;color:#ffffff;padding:24px 32px;">
          <h1 style="margin:0;font-size:20px;">Etichetă AWB FanCourier</h1>
          <p style="margin:8px 0 0 0;font-size:14px;opacity:0.9;">${storeSettings.storeName}</p>
        </div>
        <div style="padding:24px 32px;">
          <p style="font-size:14px;color:#111827;">Salut ${input.supplierName || "partener"},</p>
          <p style="font-size:14px;color:#111827;">
            AWB-ul FanCourier pentru comanda <strong>#${input.orderNumber}</strong> este gata.
          </p>
	          <div style="margin:16px 0;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
	            <p style="margin:0;font-size:13px;color:#0f172a;">
	              <strong>AWB:</strong> ${input.awbNumber}
	            </p>
	          </div>
              ${orderItemsSection}
	          <p style="font-size:13px;color:#334155;">
	            ${
                hasAttachment
                  ? "Te rugăm să tipărești eticheta din atașament, să pregătești coletul și să o lipești vizibil."
                  : "Nu am putut atașa PDF-ul etichetei în acest email. Te rugăm să folosești AWB-ul de mai sus pentru procesare."
              }
          </p>
          <p style="font-size:13px;color:#334155;margin-top:16px;">
            Mulțumim,<br />${storeSettings.storeName}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const attachments = hasAttachment
    ? [
        {
          filename: `AWB_${input.orderNumber}_${input.awbNumber}.pdf`,
          content: input.pdfBase64 as string,
          contentType: "application/pdf",
        },
      ]
    : undefined;

  const result = await sendEmailViaUnifiedSystem({
    to: input.to,
    subject,
    html,
    attachments,
  });

  if (!result.success) {
    throw new Error(result.error || "Failed to send supplier AWB email");
  }

  return result;
}
