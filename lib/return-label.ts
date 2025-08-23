import fs from "fs";
import path from "path";

import PDFDocument from "pdfkit";
import { getStoreSettings } from "@/lib/utils/store-settings";

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
  customerAddress?: string; // Add customer address
  language?: "en" | "ro"; // Add language option
}

// Translations for the return label
const translations = {
  en: {
    title: "RETURN SHIPPING LABEL",
    rma: "RMA",
    returnDetails: "Return Details",
    orderNumber: "Order Number",
    returnId: "Return ID",
    product: "Product",
    sku: "SKU",
    reason: "Reason",
    shippingInstructions: "Shipping Instructions",
    step1:
      "1. Cut along the dotted line and attach this label to your package.",
    step2: "2. Pack the product in its original packaging if possible.",
    step3: "3. Drop off the package at any post office.",
    step4: "4. Keep your receipt until the return is processed.",
    legalNote:
      "According to the legislation, you have 14 days to return your product.",
    returnAddress: "Return Address",
    from: "From",
    reference: "Reference",
    signature: "Signature",
    date: "Date",
    companyAddress: "", // Will be populated from database
    companyCity: "", // Will be populated from database
    companyCountry: "", // Will be populated from database
    fromSender: "SENDER INFORMATION",
  },
  ro: {
    title: "ETICHETĂ DE RETURNARE",
    rma: "RMA",
    returnDetails: "Detalii Returnare",
    orderNumber: "Număr Comandă",
    returnId: "ID Returnare",
    product: "Produs",
    sku: "Cod Produs",
    reason: "Motiv",
    shippingInstructions: "Instrucțiuni de Expediere",
    step1:
      "1. Tăiați de-a lungul liniei punctate și atașați această etichetă pe pachet.",
    step2: "2. Ambalați produsul în ambalajul original, dacă este posibil.",
    step3: "3. Predați pachetul la orice oficiu poștal sau punct de curierat.",
    step4: "4. Păstrați dovada de expediere până la procesarea returului.",
    legalNote:
      "Conform legislației din România, aveți la dispoziție 14 zile pentru a returna produsul.",
    returnAddress: "Adresa de Returnare",
    from: "De la",
    reference: "Referință",
    signature: "Semnătură",
    date: "Data",
    companyAddress: "", // Will be populated from database
    companyCity: "", // Will be populated from database
    companyCountry: "", // Will be populated from database
    fromSender: "INFORMAȚII EXPEDITOR",
  },
};

export async function generateReturnLabel(
  props: ReturnLabelProps
): Promise<Buffer> {
  try {
    const language = props.language || "en";
    const t = translations[language as keyof typeof translations];

    // Get store settings for business address
    const storeSettings = await getStoreSettings();

    // Populate business address from database
    t.companyAddress = storeSettings.businessAddress;
    t.companyCity = `${storeSettings.businessCity}, ${storeSettings.businessState}`;
    t.companyCountry = storeSettings.businessCountry;

    // Define font paths
    const regularFontPath = path.join(
      process.cwd(),
      "public",
      "Roboto-Regular.ttf"
    );
    const boldFontPath = path.join(process.cwd(), "public", "Roboto-Bold.ttf");

    // Check if font files exist
    if (!fs.existsSync(regularFontPath)) {
      throw new Error(`Font file not found: ${regularFontPath}`);
    }

    if (!fs.existsSync(boldFontPath)) {
      throw new Error(`Font file not found: ${boldFontPath}`);
    }

    // Create a new PDF document with explicit fonts
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      info: {
        Title: `${t.title} - ${props.returnId}`,
        Author: "TechTots",
      },
      autoFirstPage: true,
      font: regularFontPath, // Set default font explicitly
    });

    // Register fonts with explicit names to avoid using default fonts
    doc.registerFont("Roboto", regularFontPath);
    doc.registerFont("Roboto-Bold", boldFontPath);

    // Use our custom fonts
    doc.font("Roboto");

    // Create a buffer to store the PDF
    const chunks: Buffer[] = [];
    doc.on("data", chunk => chunks.push(chunk));

    // Header with TechTots branding
    doc.rect(0, 0, 595.28, 60).fill("#2563eb");
    doc
      .font("Roboto-Bold")
      .fillColor("#ffffff")
      .fontSize(24)
      .text(t.title, 40, 20);

    // Return ID
    doc
      .font("Roboto-Bold")
      .fillColor("#000000")
      .fontSize(16)
      .text(`${t.rma}: ${props.returnId}`, 40, 80);

    // Return Details Section
    doc
      .font("Roboto-Bold")
      .fillColor("#2563eb")
      .fontSize(14)
      .text(t.returnDetails, 40, 120);
    doc.moveTo(40, 140).lineTo(555, 140).stroke("#2563eb");

    // Details table
    const startY = 150;
    const lineHeight = 25;
    let currentY = startY;

    // Order Number
    doc
      .font("Roboto-Bold")
      .fillColor("#000000")
      .fontSize(12)
      .text(t.orderNumber, 40, currentY);
    doc.font("Roboto").text(props.orderNumber, 200, currentY);
    currentY += lineHeight;

    // Return ID
    doc.font("Roboto-Bold").text(t.returnId, 40, currentY);
    doc.font("Roboto").text(props.returnId, 200, currentY);
    currentY += lineHeight;

    // Product
    doc.font("Roboto-Bold").text(t.product, 40, currentY);
    doc.font("Roboto").text(props.productName, 200, currentY);
    currentY += lineHeight;

    // SKU if available
    if (props.productSku) {
      doc.font("Roboto-Bold").text(t.sku, 40, currentY);
      doc.font("Roboto").text(props.productSku, 200, currentY);
      currentY += lineHeight;
    }

    // Reason
    doc.font("Roboto-Bold").text(t.reason, 40, currentY);
    doc.font("Roboto").text(props.reason, 200, currentY);
    currentY += lineHeight * 1.5;

    // Shipping Instructions
    doc
      .font("Roboto-Bold")
      .fillColor("#2563eb")
      .fontSize(14)
      .text(t.shippingInstructions, 40, currentY);
    doc
      .moveTo(40, currentY + 20)
      .lineTo(555, currentY + 20)
      .stroke("#2563eb");
    currentY += lineHeight * 1.5;

    // Steps
    doc
      .font("Roboto")
      .fillColor("#000000")
      .fontSize(12)
      .text(t.step1, 40, currentY);
    currentY += lineHeight;
    doc.text(t.step2, 40, currentY);
    currentY += lineHeight;
    doc.text(t.step3, 40, currentY);
    currentY += lineHeight;
    doc.text(t.step4, 40, currentY);
    currentY += lineHeight * 1.5;

    // Return Address
    doc
      .font("Roboto-Bold")
      .fillColor("#2563eb")
      .fontSize(14)
      .text(t.returnAddress, 40, currentY);
    doc
      .moveTo(40, currentY + 20)
      .lineTo(555, currentY + 20)
      .stroke("#2563eb");
    currentY += lineHeight * 1.5;

    // Company Address
    doc
      .font("Roboto-Bold")
      .fillColor("#000000")
      .fontSize(12)
      .text("TechTots", 40, currentY);
    currentY += lineHeight - 10;
    doc.font("Roboto").fontSize(12).text(t.companyAddress, 40, currentY);
    currentY += lineHeight - 10;
    doc.text(t.companyCity, 40, currentY);
    currentY += lineHeight - 10;
    doc.text(t.companyCountry, 40, currentY);
    currentY += lineHeight * 1.5;

    // Customer Info
    doc
      .font("Roboto-Bold")
      .fillColor("#2563eb")
      .fontSize(14)
      .text(t.fromSender, 40, currentY);
    doc
      .moveTo(40, currentY + 20)
      .lineTo(555, currentY + 20)
      .stroke("#2563eb");
    currentY += lineHeight * 1.5;

    // Customer details
    doc
      .font("Roboto-Bold")
      .fillColor("#000000")
      .fontSize(12)
      .text(props.customerName, 40, currentY);
    currentY += lineHeight - 10;
    doc.font("Roboto").fontSize(12).text(props.customerEmail, 40, currentY);
    currentY += lineHeight - 10;

    // Add customer address if available
    if (props.customerAddress) {
      doc.text(props.customerAddress, 40, currentY);
      currentY += lineHeight;
    }

    // Legal note at the bottom
    currentY = 700;
    doc
      .font("Roboto")
      .fontSize(10)
      .fillColor("#666666")
      .text(t.legalNote, 40, currentY, {
        width: 515,
        align: "center",
      });

    // Finalize the PDF
    doc.end();

    // Return the buffer
    return new Promise((resolve, reject) => {
      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      doc.on("error", reject);
    });
  } catch (error) {
    console.error("Error generating return label:", error);
    throw error;
  }
}
