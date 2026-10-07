import {
  RETURN_POLICY_REFUND_RO,
  RETURN_REASON_LABELS_RO,
} from "@/lib/returns/policy";

import { getStoreSettings, getBaseUrl } from "./base";
import {
  escapeReturnHtml,
  returnEmailLayout,
  returnItemCards,
  returnItemsText,
  returnParagraph,
  type ReturnEmailItem,
} from "./return-email-layout";
import { getReturnEmailService } from "./return-service";

interface ReturnMessage {
  to: string;
  customerName: string;
  orderNumber: string;
  orderDate: string;
}
interface PdfAttachment {
  filename: string;
  content: string;
  contentType: string;
}
const digitalRefund =
  "Suma și termenul rambursării se verifică separat în funcție de dreptul de retragere sau remediul pentru neconformitate; aprobarea nu confirmă încă efectuarea plății.";
const preparation =
  "Ambalează produsele în siguranță și păstrează dovada expedierii. Grupați într-un colet doar articolele cu aceeași destinație și referință de retur.";

async function approval(
  input: ReturnMessage,
  items: ReturnEmailItem[],
  attachments?: PdfAttachment[]
) {
  const settings = await getStoreSettings();
  const physicalCount = items.filter(item => !item.isDigital).length;
  const introduction =
    items.length === 1
      ? "Am aprobat cererea de retur pentru articolul de mai jos. Urmează instrucțiunile aferente acestui articol."
      : `Am aprobat returul pentru cele ${items.length} articole de mai jos. Fiecare articol are propriile instrucțiuni.`;
  const documents = physicalCount
    ? `Ai ${physicalCount} ${physicalCount === 1 ? "document PDF pentru articolul fizic" : "documente PDF, câte unul pentru fiecare articol fizic"}. Verifică destinația înainte de expediere: articolele pot merge la adrese diferite.`
    : "Produsele digitale nu necesită colet sau document PDF de expediere.";
  const refund = physicalCount ? RETURN_POLICY_REFUND_RO : digitalRefund;
  const body =
    returnParagraph(`Bună, ${input.customerName}!`) +
    returnParagraph(introduction) +
    returnParagraph(documents) +
    returnItemCards(items) +
    (physicalCount ? returnParagraph(preparation) : "") +
    returnParagraph(refund);
  return getReturnEmailService().sendEmail({
    to: input.to,
    subject: `Retur aprobat · Comanda ${input.orderNumber} · ${settings.storeName}`,
    html: returnEmailLayout({
      ...input,
      ...settings,
      baseUrl: getBaseUrl(),
      body,
      title:
        items.length === 1
          ? "Returul tău este aprobat"
          : "Retururile tale sunt aprobate",
      status: "RETUR APROBAT",
      preheader: documents,
    }),
    template: items.length === 1 ? "return-approved" : "return-bulk-approved",
    variables: {},
    text: `Bună, ${input.customerName}!\n${introduction}\nComanda ${input.orderNumber} · ${input.orderDate}\n\n${documents}\n\n${returnItemsText(items)}\n\n${physicalCount ? preparation : ""}\n${refund}\nUrmărește returul: ${getBaseUrl()}/account/returns\nContact: ${settings.contactEmail}`,
    attachments: physicalCount ? attachments : undefined,
  });
}

export function sendReturnApprovedEmail(
  input: ReturnMessage & ReturnEmailItem & { pdfBase64?: string }
) {
  const filename = input.pdfFilename || "TechTots_Document_Retur.pdf";
  return approval(
    input,
    [
      {
        ...input,
        pdfFilename: input.pdfBase64 && !input.isDigital ? filename : undefined,
      },
    ],
    input.pdfBase64 && !input.isDigital
      ? [{ filename, content: input.pdfBase64, contentType: "application/pdf" }]
      : undefined
  );
}

export function sendBulkReturnApprovedEmail(
  input: ReturnMessage & {
    items: ReturnEmailItem[];
    pdfBase64?: string;
    pdfAttachments?: PdfAttachment[];
  }
) {
  const attachments =
    input.pdfAttachments ||
    (input.pdfBase64
      ? [
          {
            filename: "TechTots_Documente_Retur.pdf",
            content: input.pdfBase64,
            contentType: "application/pdf",
          },
        ]
      : undefined);
  return approval(input, input.items, attachments);
}

export async function sendReturnRejectedEmail(
  input: ReturnMessage & { productName: string; reason: string }
) {
  const settings = await getStoreSettings();
  const reason =
    RETURN_REASON_LABELS_RO[
      input.reason as keyof typeof RETURN_REASON_LABELS_RO
    ] || input.reason;
  const explanation =
    "Cererea de retur pentru acest articol a fost respinsă în urma verificării. Pentru motivul deciziei sau o reevaluare, răspunde la acest email și include numărul comenzii. Poți trimite informații suplimentare sau fotografii.";
  const body = `${
    returnParagraph(`Bună, ${input.customerName}!`) +
    returnParagraph(explanation)
  }<div style="padding:20px;background:#f3f7fb;border-radius:8px;overflow-wrap:anywhere;"><p style="margin:0 0 8px;font-size:16px;font-weight:bold;color:#172d42;">${escapeReturnHtml(input.productName)}</p><p style="margin:0;font-size:14px;line-height:1.7;color:#475569;">Motivul cererii: ${escapeReturnHtml(reason)}</p></div>${returnParagraph(
    "Nu expedia articolul până la clarificarea cazului. Drepturile tale legale rămân aplicabile."
  )}`;
  return getReturnEmailService().sendEmail({
    to: input.to,
    subject: `Actualizare cerere de retur · Comanda ${input.orderNumber} · ${settings.storeName}`,
    html: returnEmailLayout({
      ...input,
      ...settings,
      baseUrl: getBaseUrl(),
      body,
      title: "Actualizare pentru returul tău",
      status: "CERERE RESPINSĂ",
      preheader: "Poți solicita detalii sau o reevaluare a cererii.",
    }),
    template: "return-rejected",
    variables: {},
    text: `Bună, ${input.customerName}!\nComanda ${input.orderNumber} · ${input.productName}\n${explanation}\nMotivul cererii: ${reason}\nContact: ${settings.contactEmail}`,
  });
}
