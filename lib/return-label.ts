import fs from "fs";
import path from "path";

import PDFDocument from "pdfkit";

import { COMPANY_LEGAL } from "@/lib/config/company-legal";
import { RETURN_REASON_LABELS_RO } from "@/lib/returns/policy";
import {
  COMPANY_RETURN_DESTINATION,
  type ReturnDestination,
} from "@/lib/returns/return-destination-display";

interface ReturnLabelProps {
  orderId: string;
  orderNumber: string;
  returnId: string;
  productName: string;
  productId: string;
  productSku: string | null;
  reason: string;
  customerName: string;
  customerEmail: string;
  customerAddress?: string;
  language?: "en" | "ro";
  destination?: ReturnDestination;
}

const translations = {
  ro: {
    title: "DOCUMENT DE RETUR",
    details: "Detalii returnare",
    order: "Număr comandă",
    product: "Produs",
    sku: "Cod produs",
    reason: "Motiv",
    instructions: "Instrucțiuni de expediere",
    address: "Adresa pentru acest retur",
    sender: "Informații expeditor",
    steps: [
      "Documentul identifică returul; nu este un AWB preplătit.",
      "Ambalați produsul în siguranță, în ambalajul original dacă este posibil.",
      "Folosiți adresa indicată în document. Pentru neconformitate, așteptați transportul organizat gratuit de TechTots.",
      "Păstrați dovada de expediere până la procesarea returului.",
    ],
    legal:
      "Retragere: expediați în 14 zile de la notificare; clientul plătește returul. Neconformitate: TechTots organizează transportul fără costuri pentru client. Condițiile furnizorului nu limitează drepturile clientului.",
  },
  en: {
    title: "RETURN IDENTIFICATION",
    details: "Return details",
    order: "Order number",
    product: "Product",
    sku: "SKU",
    reason: "Reason",
    instructions: "Shipping instructions",
    address: "Address for this return",
    sender: "Sender information",
    steps: [
      "This document identifies the return; it is not prepaid postage.",
      "Pack the product safely, in its original packaging if possible.",
      "Use the address in this document. For nonconformity, await transport arranged free of charge by TechTots.",
      "Keep your dispatch receipt until the return is processed.",
    ],
    legal:
      "Withdrawal: dispatch within 14 days of notification; customer pays return carriage. Nonconformity: TechTots arranges transport at no cost to you. Supplier conditions do not limit your consumer rights.",
  },
};

export async function generateReturnLabel(
  props: ReturnLabelProps
): Promise<Buffer> {
  const language = props.language || "en";
  const t = translations[language];
  const destination = props.destination || COMPANY_RETURN_DESTINATION;
  if (destination.target === "NONE")
    throw new Error("Digital returns do not have a shipping label");
  const regular = path.join(process.cwd(), "public", "Roboto-Regular.ttf");
  const bold = path.join(process.cwd(), "public", "Roboto-Bold.ttf");
  if (!fs.existsSync(regular) || !fs.existsSync(bold))
    throw new Error("Return label fonts are missing");
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 40, bottom: 65, left: 40, right: 40 },
    bufferPages: true,
    font: regular,
    info: { Title: `${t.title} - ${props.returnId}`, Author: "TechTots" },
  });
  doc.registerFont("Roboto", regular).registerFont("Roboto-Bold", bold);
  const chunks: Buffer[] = [];
  const result = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  const width = doc.page.width - 80;
  const navy = "#172d42";
  const muted = "#526779";
  const accent = "#087fa5";
  const logo = path.join(process.cwd(), "public", "TechTots_LOGO.png");
  const ensure = (height: number) => {
    if (height < 700 && doc.y + height > doc.page.height - 65) doc.addPage();
  };
  doc.on("pageAdded", () => {
    doc
      .font("Roboto-Bold")
      .fontSize(11)
      .fillColor(navy)
      .text("TechTots", 40, 32);
    doc.font("Roboto").fontSize(8).fillColor(muted).text(t.title, 115, 34);
    doc
      .moveTo(40, 54)
      .lineTo(40 + width, 54)
      .strokeColor("#dce5ee")
      .stroke();
    doc.x = 40;
    doc.y = 72;
  });
  if (fs.existsSync(logo)) doc.image(logo, 36, 29, { width: 52, height: 52 });
  doc
    .font("Roboto-Bold")
    .fillColor(navy)
    .fontSize(19)
    .text("TechTots", 100, 35);
  doc
    .font("Roboto")
    .fillColor(accent)
    .fontSize(8)
    .text("STEM · PLAY · DISCOVER", 100, 61);
  doc
    .moveTo(40, 88)
    .lineTo(40 + width, 88)
    .strokeColor("#dce5ee")
    .stroke();
  doc.font("Roboto-Bold").fontSize(23).fillColor(navy).text(t.title, 40, 106);
  doc
    .font("Roboto")
    .fontSize(9)
    .fillColor(muted)
    .text(
      language === "ro"
        ? "Identificarea articolului și destinația confirmată pentru retur."
        : "Item identification and confirmed return destination.",
      40,
      doc.y + 5,
      { width }
    );
  doc.y += 16;
  const section = (title: string) => {
    ensure(45);
    doc
      .font("Roboto-Bold")
      .fontSize(12)
      .fillColor(navy)
      .text(title, 40, doc.y, { width });
    doc.moveDown(0.45).font("Roboto").fontSize(10).fillColor(muted);
  };
  const detail = (label: string, value: string) => {
    doc.font("Roboto").fontSize(10);
    const height = doc.heightOfString(`${label}: ${value}`, { width }) + 7;
    if (height < 180) ensure(height);
    doc
      .font("Roboto-Bold")
      .fillColor(navy)
      .text(`${label}: `, { continued: true });
    doc.font("Roboto").fillColor(muted).text(value, { width });
    doc.moveDown(0.35);
  };
  const card = (title: string, content: string) => {
    doc.font("Roboto").fontSize(11);
    const height =
      doc.heightOfString(content, { width: width - 36, lineGap: 3 }) + 58;
    ensure(height + 12);
    const top = doc.y;
    if (height < 650)
      doc
        .roundedRect(40, top, width, height, 9)
        .fillAndStroke("#f3f7fb", "#dce5ee");
    doc
      .font("Roboto-Bold")
      .fontSize(9)
      .fillColor(accent)
      .text(title.toUpperCase(), 58, top + 16, { width: width - 36 });
    doc
      .font("Roboto")
      .fontSize(11)
      .fillColor(navy)
      .text(content, 58, top + 36, { width: width - 36, lineGap: 3 });
    doc.x = 40;
    doc.y += 24;
  };
  card(
    t.address,
    [
      destination.recipient,
      destination.address,
      destination.authorizationNumber
        ? `ARP / RMA: ${destination.authorizationNumber}`
        : "",
    ]
      .filter(Boolean)
      .join("\n")
  );
  if (destination.arriveBy) {
    const deadline = new Intl.DateTimeFormat(
      language === "ro" ? "ro-RO" : "en-GB",
      {
        timeZone: "Europe/Bucharest",
        dateStyle: "long",
        timeStyle: "short",
      }
    ).format(new Date(destination.arriveBy));
    doc
      .font("Roboto")
      .fontSize(9)
      .fillColor(muted)
      .text(
        language === "ro"
          ? `Sosire la depozit până la ${deadline} (ora României). Dacă termenul nu mai poate fi respectat, contactați TechTots înainte de expediere pentru preluare la adresa companiei.`
          : `Must arrive by ${deadline} (Romanian time). If this is no longer possible, contact TechTots before dispatch for receipt at the company address.`,
        40,
        doc.y,
        { width, lineGap: 2 }
      );
    doc.moveDown(0.8);
  }
  section(t.details);
  detail(t.order, props.orderNumber);
  detail("RMA TechTots", props.returnId);
  detail(t.product, props.productName);
  if (props.productSku) detail(t.sku, props.productSku);
  detail(
    t.reason,
    language === "ro"
      ? RETURN_REASON_LABELS_RO[
          props.reason as keyof typeof RETURN_REASON_LABELS_RO
        ] || props.reason
      : props.reason
  );
  doc.moveDown(0.5);
  section(t.instructions);
  t.steps.forEach((step, index) => {
    doc.font("Roboto").fontSize(9.5);
    ensure(doc.heightOfString(`${index + 1}. ${step}`, { width }) + 5);
    doc
      .fillColor(muted)
      .text(`${index + 1}. ${step}`, 40, doc.y, { width, lineGap: 2 });
    doc.moveDown(0.35);
  });
  doc.moveDown(0.5);
  section(t.sender);
  doc
    .font("Roboto")
    .fontSize(10)
    .fillColor(muted)
    .text(
      [props.customerName, props.customerEmail, props.customerAddress]
        .filter(Boolean)
        .join(" · "),
      40,
      doc.y,
      { width, lineGap: 2 }
    );
  doc.moveDown(0.8).fontSize(8.5).text(t.legal, { width, lineGap: 2 });
  const pages = doc.bufferedPageRange();
  for (let page = pages.start; page < pages.start + pages.count; page++) {
    doc.switchToPage(page);
    const footerY = doc.page.height - 47;
    doc
      .moveTo(40, footerY - 12)
      .lineTo(40 + width, footerY - 12)
      .strokeColor("#dce5ee")
      .stroke();
    doc.page.margins.bottom = 0;
    doc
      .font("Roboto")
      .fontSize(8)
      .fillColor(muted)
      .text(
        `${COMPANY_LEGAL.name} · ${COMPANY_LEGAL.email} · techtots.ro`,
        40,
        footerY,
        { width: width - 60 }
      );
    doc.text(`${page + 1} / ${pages.count}`, 40 + width - 50, footerY, {
      width: 50,
      align: "right",
    });
  }
  doc.end();
  const buffer = await result;
  return buffer;
}
