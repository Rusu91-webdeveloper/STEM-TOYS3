import { NextResponse } from "next/server";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailViaUnifiedSystem } from "@/lib/nodemailer";

// Return reason labels in Romanian
const reasonLabelsRo: Record<string, string> = {
  DOES_NOT_MEET_EXPECTATIONS: "Nu corespunde așteptărilor",
  DAMAGED_OR_DEFECTIVE: "Produs deteriorat sau defect",
  WRONG_ITEM_SHIPPED: "Produs greșit livrat",
  CHANGED_MIND: "M-am răzgândit",
  ORDERED_WRONG_PRODUCT: "Am comandat produsul greșit",
  OTHER: "Alt motiv",
};

// Generate supplier email HTML template
function generateSupplierEmailTemplate(data: {
  returnId: string;
  orderNumber: string;
  productName: string;
  productSku: string;
  quantity: number;
  price: number;
  reason: string;
  reasonLabel: string;
  details: string | null;
  customerName: string;
  orderDate: string;
  photos: string[];
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
}) {
  const photosHtml = data.photos.length > 0
    ? `
      <div style="margin: 24px 0;">
        <h3 style="color: #1f2937; margin-bottom: 16px; font-size: 16px;">📸 Fotografii Atașate (${data.photos.length})</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 12px;">
          ${data.photos.map((photo, i) => `
            <a href="${photo}" target="_blank" style="display: block;">
              <img src="${photo}" alt="Fotografie returnare ${i + 1}" style="width: 150px; height: 150px; object-fit: cover; border-radius: 8px; border: 2px solid #e5e7eb;" />
            </a>
          `).join("")}
        </div>
        <p style="margin-top: 12px; color: #6b7280; font-size: 14px;">
          💡 Click pe imagini pentru a le vizualiza în dimensiune completă
        </p>
      </div>
    `
    : `<p style="color: #6b7280; font-style: italic;">Nu au fost atașate fotografii</p>`;

  return `
    <!DOCTYPE html>
    <html lang="ro">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cerere Returnare Produs - ${data.storeName}</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">🔄 Cerere de Returnare Produs</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 16px;">Solicitare RMA / Autorizare Returnare</p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 24px; line-height: 1.6;">
            Stimate Partener,<br><br>
            Vă transmitem o cerere de returnare pentru următorul produs achiziționat de la dumneavoastră. 
            Vă rugăm să analizați situația și să ne comunicați dacă aprobați returnarea și numărul RMA/ARP.
          </p>
          
          <!-- Return Details -->
          <div style="background-color: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="color: #991b1b; margin: 0 0 20px 0; font-size: 18px; border-bottom: 1px solid #fecaca; padding-bottom: 12px;">
              📋 Detalii Returnare
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #991b1b; font-weight: 600; width: 40%; vertical-align: top;">ID Returnare:</td>
                <td style="padding: 10px 0; color: #1f2937; font-family: monospace;">${data.returnId}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #991b1b; font-weight: 600; vertical-align: top;">Nr. Comandă:</td>
                <td style="padding: 10px 0; color: #1f2937;">#${data.orderNumber}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #991b1b; font-weight: 600; vertical-align: top;">Data Comandă:</td>
                <td style="padding: 10px 0; color: #1f2937;">${data.orderDate}</td>
              </tr>
            </table>
          </div>
          
          <!-- Product Details -->
          <div style="background-color: #eff6ff; border: 2px solid #bfdbfe; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 18px; border-bottom: 1px solid #bfdbfe; padding-bottom: 12px;">
              📦 Detalii Produs
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #1e40af; font-weight: 600; width: 40%; vertical-align: top;">Denumire Produs:</td>
                <td style="padding: 10px 0; color: #1f2937; font-weight: 600;">${data.productName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #1e40af; font-weight: 600; vertical-align: top;">Cod SKU:</td>
                <td style="padding: 10px 0; color: #1f2937; font-family: monospace;">${data.productSku || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #1e40af; font-weight: 600; vertical-align: top;">Cantitate:</td>
                <td style="padding: 10px 0; color: #1f2937;">${data.quantity} buc.</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #1e40af; font-weight: 600; vertical-align: top;">Preț Achiziție:</td>
                <td style="padding: 10px 0; color: #1f2937;">${data.price.toFixed(2)} Lei</td>
              </tr>
            </table>
          </div>
          
          <!-- Reason Box -->
          <div style="background-color: #fef3c7; border: 2px solid #fcd34d; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="color: #92400e; margin: 0 0 16px 0; font-size: 18px;">⚠️ Motivul Returnării</h2>
            <p style="margin: 0 0 12px 0; color: #1f2937; font-weight: 600; font-size: 16px; background-color: #ffffff; padding: 12px; border-radius: 8px;">
              ${data.reasonLabel}
            </p>
            ${data.details ? `
              <div style="margin-top: 16px; padding: 16px; background-color: #ffffff; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0 0 8px 0; color: #92400e; font-weight: 600; font-size: 14px;">Descriere detaliată de la client:</p>
                <p style="margin: 0; color: #374151; font-style: italic; line-height: 1.6;">"${data.details}"</p>
              </div>
            ` : ""}
          </div>
          
          <!-- Photos Section -->
          <div style="background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0;">
            ${photosHtml}
          </div>
          
          <!-- Action Required -->
          <div style="background-color: #ecfdf5; border: 2px solid #a7f3d0; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="color: #065f46; margin: 0 0 16px 0; font-size: 18px;">✅ Acțiune Necesară</h2>
            <p style="margin: 0; color: #065f46; line-height: 1.6;">
              Vă rugăm să ne confirmați:<br>
              • Dacă aprobați returnarea produsului<br>
              • Numărul RMA/ARP pentru această returnare<br>
              • Instrucțiuni speciale de ambalare sau expediere<br>
              • Adresa de returnare (dacă diferă de cea standard)
            </p>
          </div>
          
          <!-- Store Info -->
          <div style="margin-top: 32px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
            <p style="margin: 0; color: #374151; line-height: 1.6;">
              Cu respect,<br><br>
              <strong>${data.storeName}</strong><br>
              📧 ${data.storeEmail}<br>
              📞 +40 771 248 029<br>
              📍 ${data.storeAddress}
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #1f2937; color: #9ca3af; padding: 24px; text-align: center; font-size: 14px;">
          <p style="margin: 0;">
            Acest email a fost generat automat de sistemul de management al returnărilor ${data.storeName}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate courier damage claim email HTML template
function generateCourierEmailTemplate(data: {
  returnId: string;
  orderNumber: string;
  awbNumber?: string;
  productName: string;
  quantity: number;
  deliveryDate?: string;
  reason: string;
  reasonLabel: string;
  details: string | null;
  customerName: string;
  customerAddress: string;
  photos: string[];
  storeName: string;
  storeLegalName: string;
  storeCUI: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
}) {
  const photosHtml = data.photos.length > 0
    ? `
      <div style="margin: 24px 0;">
        <h3 style="color: #1f2937; margin-bottom: 16px; font-size: 16px;">📸 Dovezi Fotografice (${data.photos.length})</h3>
        <p style="color: #dc2626; font-weight: 600; margin-bottom: 12px;">
          ⚠️ Fotografiile de mai jos demonstrează starea coletului/produsului la primire:
        </p>
        <div style="display: flex; flex-wrap: wrap; gap: 12px;">
          ${data.photos.map((photo, i) => `
            <a href="${photo}" target="_blank" style="display: block;">
              <img src="${photo}" alt="Dovadă deteriorare ${i + 1}" style="width: 180px; height: 180px; object-fit: cover; border-radius: 8px; border: 3px solid #dc2626;" />
            </a>
          `).join("")}
        </div>
        <p style="margin-top: 12px; color: #6b7280; font-size: 14px;">
          💡 Click pe imagini pentru vizualizare în dimensiune completă
        </p>
      </div>
    `
    : `<p style="color: #dc2626; font-weight: 600;">⚠️ Nu au fost atașate fotografii</p>`;

  return `
    <!DOCTYPE html>
    <html lang="ro">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reclamație Colet Deteriorat - ${data.storeName}</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">📦 Reclamație Colet Deteriorat</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 16px;">Cerere de Despăgubire pentru Transport</p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 24px; line-height: 1.6;">
            Către Departamentul Reclamații,<br><br>
            Vă informăm că am primit o reclamație din partea unui client referitoare la un colet deteriorat în timpul transportului. 
            Vă rugăm să analizați situația și să ne comunicați procedura de despăgubire.
          </p>
          
          <!-- Shipment Details -->
          <div style="background-color: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="color: #991b1b; margin: 0 0 20px 0; font-size: 18px; border-bottom: 1px solid #fecaca; padding-bottom: 12px;">
              🚚 Detalii Expediere
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #991b1b; font-weight: 600; width: 40%; vertical-align: top;">Nr. AWB:</td>
                <td style="padding: 10px 0; color: #1f2937; font-family: monospace; font-weight: 600; font-size: 16px;">${data.awbNumber || "A se verifica în sistem"}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #991b1b; font-weight: 600; vertical-align: top;">Nr. Comandă:</td>
                <td style="padding: 10px 0; color: #1f2937;">#${data.orderNumber}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #991b1b; font-weight: 600; vertical-align: top;">Data Livrării:</td>
                <td style="padding: 10px 0; color: #1f2937;">${data.deliveryDate || "A se verifica în sistem"}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #991b1b; font-weight: 600; vertical-align: top;">Destinatar:</td>
                <td style="padding: 10px 0; color: #1f2937;">${data.customerName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #991b1b; font-weight: 600; vertical-align: top;">Adresa Livrare:</td>
                <td style="padding: 10px 0; color: #1f2937;">${data.customerAddress}</td>
              </tr>
            </table>
          </div>
          
          <!-- Product Details -->
          <div style="background-color: #eff6ff; border: 2px solid #bfdbfe; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 18px; border-bottom: 1px solid #bfdbfe; padding-bottom: 12px;">
              📦 Conținut Colet
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #1e40af; font-weight: 600; width: 40%; vertical-align: top;">Produs:</td>
                <td style="padding: 10px 0; color: #1f2937; font-weight: 600;">${data.productName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #1e40af; font-weight: 600; vertical-align: top;">Cantitate:</td>
                <td style="padding: 10px 0; color: #1f2937;">${data.quantity} buc.</td>
              </tr>
            </table>
          </div>
          
          <!-- Damage Description -->
          <div style="background-color: #fef3c7; border: 2px solid #fcd34d; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="color: #92400e; margin: 0 0 16px 0; font-size: 18px;">⚠️ Descrierea Deteriorării</h2>
            <p style="margin: 0 0 12px 0; color: #1f2937; font-weight: 600; font-size: 16px; background-color: #ffffff; padding: 12px; border-radius: 8px;">
              ${data.reasonLabel}
            </p>
            ${data.details ? `
              <div style="margin-top: 16px; padding: 16px; background-color: #ffffff; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0 0 8px 0; color: #92400e; font-weight: 600; font-size: 14px;">Declarația clientului:</p>
                <p style="margin: 0; color: #374151; font-style: italic; line-height: 1.6;">"${data.details}"</p>
              </div>
            ` : ""}
          </div>
          
          <!-- Photos Section -->
          <div style="background-color: #fff7ed; border: 2px solid #fdba74; border-radius: 12px; padding: 24px; margin: 24px 0;">
            ${photosHtml}
          </div>
          
          <!-- Request -->
          <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="color: #166534; margin: 0 0 16px 0; font-size: 18px;">📋 Solicitare</h2>
            <p style="margin: 0; color: #166534; line-height: 1.6;">
              În conformitate cu contractul de prestări servicii, vă rugăm să:<br><br>
              ✅ Investigați incidentul și confirmați deteriorarea în timpul transportului<br>
              ✅ Ne comunicați procedura de despăgubire aplicabilă<br>
              ✅ Specificați documentele necesare pentru procesarea cererii<br>
              ✅ Indicați termenul estimat de soluționare
            </p>
          </div>
          
          <!-- Sender Info -->
          <div style="margin-top: 32px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
            <p style="margin: 0; color: #374151; line-height: 1.8;">
              Cu respect,<br><br>
              <strong>${data.storeLegalName}</strong><br>
              CUI: ${data.storeCUI}<br>
              📧 ${data.storeEmail}<br>
              📞 +40 771 248 029<br>
              📍 ${data.storeAddress}
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #1f2937; color: #9ca3af; padding: 24px; text-align: center; font-size: 14px;">
          <p style="margin: 0;">
            Reclamație generată automat de sistemul de management ${data.storeName} | ID: ${data.returnId}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ returnId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Neautorizat. Acces administrator necesar." },
        { status: 403 }
      );
    }

    const { returnId } = await params;
    const body = await request.json();
    const { recipientType } = body; // "supplier" or "courier"

    if (!recipientType || !["supplier", "courier"].includes(recipientType)) {
      return NextResponse.json(
        { error: "Tip destinatar invalid. Utilizați 'supplier' sau 'courier'." },
        { status: 400 }
      );
    }

    // Get the return with all related data
    const returnData = await prisma.return.findUnique({
      where: { id: returnId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            createdAt: true,
            deliveredAt: true,
            shippingAddress: true,
            awbNumber: true,
          },
        },
        orderItem: {
          select: {
            name: true,
            price: true,
            quantity: true,
            product: {
              select: {
                name: true,
                sku: true,
                images: true,
              },
            },
          },
        },
      },
    });

    if (!returnData) {
      return NextResponse.json(
        { error: "Returnare negăsită." },
        { status: 404 }
      );
    }

    // Get environment variables
    const supplierEmail = process.env.SUPPLIER_EMAIL;
    const courierEmail = process.env.COURIER_CLAIMS_EMAIL;
    const storeName = process.env.EMAIL_FROM_NAME || "TechTots STEM Store";
    const storeLegalName = process.env.STORE_LEGAL_NAME || "WEBIRA REM S.R.L.";
    const storeCUI = process.env.STORE_CUI || "";
    const storeEmail = process.env.EMAIL_FROM || "webira.rem.srl@gmail.com";
    const storeAddress = process.env.STORE_ADDRESS || "Cluj-Napoca, România";

    // Determine recipient email
    let recipientEmail: string;
    let emailSubject: string;
    let emailHtml: string;

    if (recipientType === "supplier") {
      if (!supplierEmail) {
        return NextResponse.json(
          { error: "Email furnizor nu este configurat. Adăugați SUPPLIER_EMAIL în .env.local" },
          { status: 400 }
        );
      }
      recipientEmail = supplierEmail;
      emailSubject = `Cerere Returnare Produs - Comandă #${returnData.order.orderNumber} - ${returnData.orderItem.name}`;
      emailHtml = generateSupplierEmailTemplate({
        returnId: returnData.id,
        orderNumber: returnData.order.orderNumber,
        productName: returnData.orderItem.name,
        productSku: returnData.orderItem.product?.sku || "",
        quantity: returnData.orderItem.quantity,
        price: returnData.orderItem.price,
        reason: returnData.reason,
        reasonLabel: reasonLabelsRo[returnData.reason] || returnData.reason,
        details: returnData.details,
        customerName: returnData.user.name || "Client",
        orderDate: format(new Date(returnData.order.createdAt), "dd MMMM yyyy", { locale: ro }),
        photos: returnData.photos || [],
        storeName,
        storeEmail,
        storePhone: "+40 771 248 029",
        storeAddress,
      });
    } else {
      // courier
      if (!courierEmail) {
        return NextResponse.json(
          { error: "Email curier nu este configurat. Adăugați COURIER_CLAIMS_EMAIL în .env.local" },
          { status: 400 }
        );
      }
      recipientEmail = courierEmail;
      
      // Build customer address string
      const addr = returnData.order.shippingAddress as any;
      const customerAddress = addr 
        ? `${addr.addressLine1}${addr.addressLine2 ? ", " + addr.addressLine2 : ""}, ${addr.city}, ${addr.state}, ${addr.postalCode}`
        : "Adresă indisponibilă";

      emailSubject = `Reclamație Colet Deteriorat - AWB: ${(returnData.order as any).awbNumber || "N/A"} - Comandă #${returnData.order.orderNumber}`;
      emailHtml = generateCourierEmailTemplate({
        returnId: returnData.id,
        orderNumber: returnData.order.orderNumber,
        awbNumber: (returnData.order as any).awbNumber,
        productName: returnData.orderItem.name,
        quantity: returnData.orderItem.quantity,
        deliveryDate: returnData.order.deliveredAt 
          ? format(new Date(returnData.order.deliveredAt), "dd MMMM yyyy", { locale: ro })
          : undefined,
        reason: returnData.reason,
        reasonLabel: reasonLabelsRo[returnData.reason] || returnData.reason,
        details: returnData.details,
        customerName: returnData.user.name || "Client",
        customerAddress,
        photos: returnData.photos || [],
        storeName,
        storeLegalName,
        storeCUI,
        storeEmail,
        storePhone: "+40 771 248 029",
        storeAddress,
      });
    }

    // Send the email
    const result = await sendEmailViaUnifiedSystem({
      to: recipientEmail,
      subject: emailSubject,
      html: emailHtml,
      from: `"${storeName}" <${storeEmail}>`,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Trimiterea emailului a eșuat." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: recipientType === "supplier" 
        ? `Raport trimis cu succes către furnizor (${recipientEmail})`
        : `Reclamație trimisă cu succes către curier (${recipientEmail})`,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("Error sending return report:", error);
    return NextResponse.json(
      { error: "Eroare internă la trimiterea raportului." },
      { status: 500 }
    );
  }
}
