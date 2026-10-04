import { COMPANY_LEGAL, CONSUMER_RIGHTS } from "@/lib/config/company-legal";
import { colors } from "@/lib/email/design-system";
import {
  RETURN_POLICY_CUSTOMER_PAYS_RO,
  RETURN_POLICY_DISPATCH_RO,
  RETURN_POLICY_REFUND_RO,
  RETURN_POLICY_SELLER_PAYS_RO,
} from "@/lib/returns/policy";
import {
  WITHDRAWAL_ACKNOWLEDGEMENT_RO,
  WITHDRAWAL_DECLARATION_RO,
  type WithdrawalReceipt,
} from "@/lib/returns/withdrawal";

const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    character =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!
  );
const bodyStyle = `font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${colors.neutral[700]};`;
const wrapStyle = "overflow-wrap:anywhere;word-break:break-word;";

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;${bodyStyle}">${escapeHtml(text)}</p>`;
}

function section(title: string, text: string): string {
  return `<h2 style="margin:26px 0 10px;font-size:18px;line-height:1.4;color:${colors.neutral[900]};">${escapeHtml(title)}</h2>${paragraph(text)}`;
}

function detail(label: string, value: string): string {
  return `<tr><td style="padding:0 0 18px;${wrapStyle}">
    <p style="margin:0 0 4px;font-size:12px;line-height:1.5;font-weight:bold;color:${colors.neutral[600]};">${label}</p>
    <p style="margin:0;font-size:15px;line-height:1.6;color:${colors.neutral[900]};${wrapStyle}">${escapeHtml(value).replace(/\r\n|\r|\n/g, "<br>")}</p>
  </td></tr>`;
}

/** Pure, table-based HTML. Receipt fields are escaped and never interpolated
 * into links. Legal content stays in the message, independent of remote images,
 * scripts or a later change to the website. The saved receipt is not modified. */
export function withdrawalEmailHtml(
  receipt: WithdrawalReceipt,
  audience: "customer" | "merchant"
): string {
  const customer = audience === "customer";
  const title = customer
    ? "Am primit declarația ta de retragere"
    : "Declarație nouă de retragere";
  const preheader = customer
    ? "Confirmarea primirii, detaliile declarației și pașii pentru retur."
    : "Verifică declarația primită și coordonează pașii următori cu clientul.";
  const localTime = new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "long",
    timeStyle: "medium",
    timeZone: "Europe/Bucharest",
  }).format(new Date(receipt.receivedAt));
  const intro = customer
    ? paragraph(`Bună, ${receipt.name}!`) +
      paragraph(
        "Declarația ta a fost înregistrată la TechTots. Păstrează acest email: este confirmarea primirii și include informațiile transmise de tine."
      )
    : paragraph(
        "A fost înregistrată o declarație prin formularul public de retragere. Mai jos găsești datele transmise de client și momentul primirii."
      );
  const next = customer
    ? section("Ce urmează", RETURN_POLICY_DISPATCH_RO)
    : section(
        "Pașii pentru echipa TechTots",
        "Verifică cererea în secțiunea Retrageri din administrare și identifică produsele sau contractul indicat. Comunică adresa corectă de retur și urmărește termenele de la primirea declarației. Verifică separat suma de rambursat și situația plății; acest mesaj nu confirmă o anulare, o rambursare sau o încasare a garanției."
      );
  const policies = customer
    ? section("Costul transportului de retur", RETURN_POLICY_CUSTOMER_PAYS_RO) +
      section("Cum se face rambursarea", RETURN_POLICY_REFUND_RO) +
      section("Dacă produsul are o problemă", RETURN_POLICY_SELLER_PAYS_RO)
    : "";
  return `<!DOCTYPE html>
<html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>@media only screen and (max-width:480px){.email-padding{padding-left:20px!important;padding-right:20px!important}.email-title{font-size:26px!important}}</style>
</head><body style="margin:0;padding:0;background-color:${colors.neutral[100]};${bodyStyle}">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${colors.neutral[100]}"><tr><td align="center" style="padding:24px 8px;">
<!--[if mso]><table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width:640px;table-layout:fixed;border-radius:16px;border:1px solid ${colors.neutral[200]};">
<tr><td style="height:6px;background-color:${colors.primary[600]};border-radius:16px 16px 0 0;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td class="email-padding" style="padding:30px 36px 22px;border-bottom:1px solid ${colors.neutral[200]};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td width="64" valign="middle"><img src="https://www.techtots.ro/TechTots_LOGO.png" width="48" height="48" alt="" style="display:block;border:0;width:48px;height:48px;"></td>
    <td valign="middle"><p style="margin:0;font-size:22px;line-height:1.3;font-weight:bold;color:${colors.neutral[900]};">TechTots</p><p style="margin:4px 0 0;font-size:11px;letter-spacing:1.5px;color:${colors.primary[700]};">STEM · PLAY · DISCOVER</p></td>
  </tr></table>
</td></tr>
<tr><td class="email-padding" style="padding:32px 36px;${bodyStyle}${wrapStyle}">
  <p style="margin:0 0 12px;font-size:12px;font-weight:bold;letter-spacing:1px;color:${colors.primary[700]};">${customer ? "CONFIRMARE DE PRIMIRE" : "NOTIFICARE PENTRU MAGAZIN"}</p>
  <h1 class="email-title" style="margin:0 0 22px;font-size:30px;line-height:1.25;letter-spacing:-0.5px;color:${colors.neutral[900]};">${title}</h1>
  ${intro}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${colors.primary[50]}" style="margin:24px 0;table-layout:fixed;border:1px solid ${colors.primary[100]};border-radius:10px;"><tr><td style="padding:22px 20px;">
    <h2 style="margin:0 0 20px;font-size:18px;line-height:1.4;color:${colors.neutral[900]};">Detaliile declarației</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed;">
      ${detail("Primită la", `${localTime} (ora României)`)}
      ${detail("Nume", receipt.name)}
      ${detail("Email pentru confirmare", receipt.email)}
      ${detail("Contract / comandă / produse", receipt.contract)}
    </table>
    <p style="margin:0 0 8px;font-size:12px;font-weight:bold;color:${colors.neutral[600]};">Declarația confirmată</p>
    <p style="margin:0;font-size:15px;line-height:1.6;color:${colors.neutral[900]};">${WITHDRAWAL_DECLARATION_RO}</p>
  </td></tr></table>
  ${paragraph(WITHDRAWAL_ACKNOWLEDGEMENT_RO)}
  ${next}${policies}
  ${customer ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr><td bgcolor="${colors.primary[600]}" style="border-radius:8px;"><a href="mailto:${COMPANY_LEGAL.email}" style="display:inline-block;padding:14px 22px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">Contactează echipa TechTots</a></td></tr></table>${paragraph("Pentru ajutor cu expedierea, scrie-ne la info@techtots.ro și include referința de mai jos.")}` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed;border-top:1px solid ${colors.neutral[200]};margin-top:28px;"><tr><td style="padding-top:18px;font-size:12px;line-height:1.7;color:${colors.neutral[600]};${wrapStyle}">
    <strong>Referința declarației</strong><br>${escapeHtml(receipt.reference)}<br>
    <span>Momentul exact al primirii (UTC): ${escapeHtml(receipt.receivedAt)}<br>Fus orar pentru data afișată: Europe/Bucharest</span>
  </td></tr></table>
</td></tr>
<tr><td class="email-padding" bgcolor="${colors.neutral[50]}" style="padding:24px 36px;border-top:1px solid ${colors.neutral[200]};font-size:12px;line-height:1.8;color:${colors.neutral[600]};${wrapStyle}">
  <strong style="color:${colors.neutral[700]};">TechTots · ${COMPANY_LEGAL.name}</strong><br>
  CUI ${COMPANY_LEGAL.cui} · Reg. com. ${COMPANY_LEGAL.regCom}<br>${COMPANY_LEGAL.address}<br>
  <a href="mailto:${COMPANY_LEGAL.email}" style="color:${colors.primary[700]};">${COMPANY_LEGAL.email}</a> · ${COMPANY_LEGAL.phone}<br>
  <a href="${CONSUMER_RIGHTS.policyUrl}" style="color:${colors.primary[700]};">Politica de retur</a> · <a href="${CONSUMER_RIGHTS.termsUrl}" style="color:${colors.primary[700]};">Termeni și condiții</a>
</td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
}
