import { COMPANY_LEGAL, CONSUMER_RIGHTS } from "@/lib/config/company-legal";
import { DIGITAL_RETURN_INSTRUCTIONS_RO } from "@/lib/returns/item-eligibility";
import {
  getCustomerReturnInstructions,
  RETURN_REASON_LABELS_RO,
} from "@/lib/returns/policy";
import {
  COMPANY_RETURN_DESTINATION,
  destinationInstruction,
  type ReturnDestination,
} from "@/lib/returns/return-destination-display";

export const escapeReturnHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    char =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ] || char
  );
export interface ReturnEmailItem {
  productName: string;
  quantity: number;
  reason: string;
  isDigital?: boolean;
  destination?: ReturnDestination;
  pdfFilename?: string;
}
const wrap = "overflow-wrap:anywhere;word-break:break-word;";
export const returnParagraph = (text: string) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#475569;${wrap}">${escapeReturnHtml(text)}</p>`;

export function returnItemCards(items: ReturnEmailItem[]): string {
  return items
    .map((item, index) => {
      const destination = item.destination || COMPANY_RETURN_DESTINATION;
      const reason =
        RETURN_REASON_LABELS_RO[
          item.reason as keyof typeof RETURN_REASON_LABELS_RO
        ] || item.reason;
      const deadline = destination.arriveBy
        ? new Intl.DateTimeFormat("ro-RO", {
            timeZone: "Europe/Bucharest",
            dateStyle: "long",
            timeStyle: "short",
          }).format(new Date(destination.arriveBy))
        : null;
      return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;margin:0 0 16px;border:1px solid #dce5ee;border-radius:12px;"><tr><td style="padding:22px 20px;${wrap}">
      <p style="margin:0 0 8px;font-size:11px;font-weight:bold;letter-spacing:1px;color:#64748b;">ARTICOL ${String(index + 1).padStart(2, "0")} · ${item.isDigital ? "PRODUS DIGITAL" : "PRODUS FIZIC"}</p>
      <h2 style="margin:0 0 8px;font-size:18px;line-height:1.4;color:#172d42;">${escapeReturnHtml(item.productName)}</h2>
      <p style="margin:0 0 18px;font-size:13px;line-height:1.6;color:#64748b;">Cantitate: ${item.quantity} · ${escapeReturnHtml(reason)}</p>
      ${
        item.isDigital
          ? returnParagraph(DIGITAL_RETURN_INSTRUCTIONS_RO)
          : `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f3f7fb" style="table-layout:fixed;border-radius:8px;"><tr><td style="padding:16px;${wrap}">
        <p style="margin:0 0 8px;font-size:11px;font-weight:bold;letter-spacing:1px;color:#60778b;">DESTINAȚIE DE RETUR</p>
        <p style="margin:0;font-size:15px;font-weight:bold;line-height:1.6;color:#172d42;">${escapeReturnHtml(destination.recipient)}</p>
        <p style="margin:4px 0 0;font-size:14px;line-height:1.7;color:#475569;">${escapeReturnHtml(destination.address)}</p>
        ${destination.authorizationNumber ? `<p style="margin:12px 0 0;font-size:13px;color:#172d42;"><strong>Referință furnizor:</strong> ${escapeReturnHtml(destination.authorizationNumber)}</p>` : ""}
        ${deadline ? `<p style="margin:12px 0 0;font-size:13px;line-height:1.7;color:#172d42;"><strong>Sosire la depozit până la ${escapeReturnHtml(deadline)} (ora României).</strong><br>Dacă termenul nu mai poate fi respectat, contactează TechTots înainte de expediere; preluăm returul la adresa companiei.</p>` : ""}
      </td></tr></table>
      <p style="margin:16px 0 8px;font-size:13px;line-height:1.7;color:#475569;"><strong>Documentul de retur ${String(index + 1).padStart(2, "0")}</strong> este atașat${item.pdfFilename ? `: ${escapeReturnHtml(item.pdfFilename)}` : "."} Atașați eticheta de identificare pe pachet; documentul nu este un AWB preplătit.</p>
      <p style="margin:0;font-size:13px;line-height:1.7;color:#475569;">${escapeReturnHtml(getCustomerReturnInstructions(item.reason))}</p>`
      }
    </td></tr></table>`;
    })
    .join("");
}

export function returnEmailLayout(input: {
  title: string;
  preheader: string;
  status: string;
  orderNumber: string;
  orderDate: string;
  body: string;
  storeName: string;
  contactEmail: string;
  baseUrl: string;
}): string {
  const e = escapeReturnHtml;
  return `<!DOCTYPE html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(input.title)}</title>
<style>@media only screen and (max-width:480px){.return-padding{padding-left:20px!important;padding-right:20px!important}.return-title{font-size:26px!important}}</style></head>
<body style="margin:0;padding:0;background:#edf2f7;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${e(input.preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#edf2f7"><tr><td align="center" style="padding:24px 8px;">
<!--[if mso]><table role="presentation" width="640"><tr><td><![endif]-->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="max-width:640px;table-layout:fixed;border:1px solid #dce5ee;border-radius:16px;">
<tr><td style="height:5px;background:#087fa5;border-radius:16px 16px 0 0;font-size:0;">&nbsp;</td></tr>
<tr><td class="return-padding" style="padding:26px 36px;border-bottom:1px solid #e2e8f0;"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
<td width="64"><img src="https://www.techtots.ro/TechTots_LOGO.png" width="48" height="48" alt="" style="display:block;border:0;"></td>
<td><p style="margin:0;font-size:22px;font-weight:bold;color:#172d42;">${e(input.storeName)}</p><p style="margin:4px 0 0;font-size:10px;letter-spacing:1.5px;color:#087fa5;">STEM · PLAY · DISCOVER</p></td></tr></table></td></tr>
<tr><td class="return-padding" style="padding:30px 36px 24px;background:#f7fafc;${wrap}">
<p style="margin:0 0 12px;font-size:11px;font-weight:bold;letter-spacing:1.5px;color:#087fa5;">${e(input.status)}</p>
<h1 class="return-title" style="margin:0 0 14px;font-size:30px;line-height:1.25;letter-spacing:-0.5px;color:#172d42;">${e(input.title)}</h1>
<p style="margin:0;font-size:13px;line-height:1.8;color:#64748b;">Comanda <strong style="color:#172d42;">${e(input.orderNumber)}</strong><br>${e(input.orderDate)}</p>
</td></tr>
<tr><td class="return-padding" style="padding:28px 36px 32px;${wrap}">${input.body}
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;"><tr><td bgcolor="#087fa5" style="border-radius:8px;"><a href="${e(input.baseUrl)}/account/returns" style="display:inline-block;padding:14px 22px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">Urmărește returul</a></td></tr></table>
${returnParagraph("Pentru ajutor, răspunde la acest email sau contactează echipa TechTots. Include numărul comenzii, ca să identificăm rapid returul.")}
<p style="margin:0;font-size:14px;line-height:1.7;color:#172d42;"><strong>Echipa ${e(input.storeName)}</strong><br><a href="mailto:${e(input.contactEmail)}" style="color:#087fa5;">${e(input.contactEmail)}</a></p>
</td></tr>
<tr><td class="return-padding" bgcolor="#f7fafc" style="padding:22px 36px;border-top:1px solid #e2e8f0;font-size:11px;line-height:1.9;color:#64748b;${wrap}">
<strong style="color:#475569;">TechTots · ${COMPANY_LEGAL.name}</strong><br>CUI ${COMPANY_LEGAL.cui} · Reg. com. ${COMPANY_LEGAL.regCom}<br>${COMPANY_LEGAL.address}<br>
<a href="${CONSUMER_RIGHTS.policyUrl}" style="color:#087fa5;">Politica de retur</a> · <a href="${CONSUMER_RIGHTS.termsUrl}" style="color:#087fa5;">Termeni și condiții</a>
</td></tr></table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>`;
}

export function returnItemsText(items: ReturnEmailItem[]): string {
  return items
    .map(
      item =>
        `${item.productName} · Cantitate: ${item.quantity}\n${item.isDigital ? DIGITAL_RETURN_INSTRUCTIONS_RO : `${destinationInstruction(item.destination || COMPANY_RETURN_DESTINATION)  }\n${  getCustomerReturnInstructions(item.reason)  }${item.pdfFilename ? `\nDocument atașat: ${item.pdfFilename}` : ""}`}`
    )
    .join("\n\n");
}
