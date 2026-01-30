import { getEmailService } from "@/lib/email";
import { getStoreSettings } from "@/lib/utils/store-settings";

export async function sendSupplierAwbLabelEmail(input: {
    to: string;
    supplierName: string;
    orderNumber: string;
    awbNumber: string;
    pdfBase64: string;
}) {
    const storeSettings = await getStoreSettings();

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
            Atașat găsești AWB-ul FanCourier pentru comanda <strong>#${input.orderNumber}</strong>.
          </p>
          <div style="margin:16px 0;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
            <p style="margin:0;font-size:13px;color:#0f172a;">
              <strong>AWB:</strong> ${input.awbNumber}
            </p>
          </div>
          <p style="font-size:13px;color:#334155;">
            Te rugăm să tipărești eticheta, să pregătești coletul și să o lipești vizibil.
          </p>
          <p style="font-size:13px;color:#334155;margin-top:16px;">
            Mulțumim,<br />${storeSettings.storeName}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

    const attachments = [
        {
            filename: `AWB_${input.orderNumber}_${input.awbNumber}.pdf`,
            content: input.pdfBase64,
            contentType: "application/pdf",
        },
    ];

    const emailService = getEmailService();
    return emailService.sendEmail({
        to: input.to,
        subject,
        html,
        attachments,
    });
}
