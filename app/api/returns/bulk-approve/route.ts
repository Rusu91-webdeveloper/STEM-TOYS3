import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { sendEmailViaUnifiedSystem } from "@/lib/email/migration-helper";
import { db } from "@/lib/db";
import { generateReturnLabel } from "@/lib/return-label";

// Increase timeout for this route (Vercel)
export const maxDuration = 60; // 60 seconds

// Return reason display labels
const reasonLabelsRo = {
  DOES_NOT_MEET_EXPECTATIONS: "Nu îndeplinește așteptările",
  DAMAGED_OR_DEFECTIVE: "Deteriorat sau defect",
  WRONG_ITEM_SHIPPED: "Produs greșit expediat",
  CHANGED_MIND: "M-am răzgândit",
  ORDERED_WRONG_PRODUCT: "Am comandat produsul greșit",
  OTHER: "Alt motiv",
};

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { returnIds } = await request.json();

    if (!returnIds || !Array.isArray(returnIds) || returnIds.length === 0) {
      return NextResponse.json(
        { error: "Please provide return IDs to approve" },
        { status: 400 }
      );
    }

    console.log("Processing bulk approval for returns:", returnIds);

    // First, check what returns exist with these IDs (regardless of status)
    const existingReturns = await db.return.findMany({
      where: {
        id: { in: returnIds },
      },
      select: {
        id: true,
        status: true,
      },
    });

    console.log("Existing returns found:", existingReturns);

    // If no returns found at all, the IDs are invalid
    if (existingReturns.length === 0) {
      return NextResponse.json(
        { error: "Nu s-au găsit returnări cu ID-urile furnizate" },
        { status: 404 }
      );
    }

    // Check if all returns are already processed (not PENDING)
    const nonPendingReturns = existingReturns.filter(r => r.status !== "PENDING");
    if (nonPendingReturns.length === existingReturns.length) {
      const statusInfo = existingReturns.map(r => `${r.id.slice(-6)}: ${r.status}`).join(", ");
      return NextResponse.json(
        { 
          error: `Toate returnările selectate au fost deja procesate. Status curent: ${statusInfo}`,
          details: existingReturns
        },
        { status: 400 }
      );
    }

    // Get all returns with order and product details (only PENDING ones)
    const returns = await db.return.findMany({
      where: {
        id: { in: returnIds },
        status: "PENDING", // Only approve pending returns
      },
      include: {
        order: true,
        orderItem: {
          include: {
            product: true,
          },
        },
        user: {
          include: {
            addresses: {
              where: { isDefault: true },
              take: 1,
            },
          },
        },
      },
    });

    if (returns.length === 0) {
      return NextResponse.json(
        { error: "Nu s-au găsit returnări în așteptare cu ID-urile furnizate" },
        { status: 404 }
      );
    }
    
    // Log if some returns were skipped
    if (returns.length < returnIds.length) {
      console.log(`⚠️ Only ${returns.length} of ${returnIds.length} returns are PENDING. Skipping ${returnIds.length - returns.length} already processed returns.`);
    }

    // Group returns by order ID to handle bulk returns per order
    const returnsByOrder = returns.reduce(
      (acc, returnItem) => {
        const orderId = returnItem.orderId;
        if (!acc[orderId]) {
          acc[orderId] = [];
        }
        acc[orderId].push(returnItem);
        return acc;
      },
      {} as Record<string, typeof returns>
    );

    // STEP 1: Update ALL return statuses first (fast operation)
    console.log(`📝 Updating ${returns.length} returns to APPROVED status...`);
    
    await db.$transaction(async tx => {
      await Promise.all(
        returns.map(returnItem =>
          tx.return.update({
            where: { id: returnItem.id },
            data: { status: "APPROVED" },
          })
        )
      );
    });
    
    console.log(`✅ All ${returns.length} returns updated to APPROVED`);

    // Build response data
    const processedOrders = Object.entries(returnsByOrder).map(([orderId, orderReturns]) => {
      const firstReturn = orderReturns[0];
      return {
        orderId,
        orderNumber: firstReturn.order.orderNumber,
        customerEmail: firstReturn.user.email,
        itemCount: orderReturns.length,
        returnIds: orderReturns.map(r => r.id),
      };
    });

    // STEP 2: Fire-and-forget email sending (non-blocking)
    // This runs in background after we return the response
    console.log(`📧 Queueing emails for ${processedOrders.length} orders...`);
    
    sendBulkApprovalEmailsAsync(returnsByOrder, reasonLabelsRo).catch(err => {
      console.error("❌ Background bulk email sending failed:", err);
    });

    // Return immediately - don't wait for emails
    return NextResponse.json({
      success: true,
      message: `Aprobat ${returns.length} returnări din ${processedOrders.length} comenzi. Emailurile se trimit în fundal.`,
      data: {
        processedOrders,
        totalReturns: returns.length,
        totalOrders: processedOrders.length,
      },
    });
  } catch (error) {
    console.error("Error in bulk return approval:", error);
    return NextResponse.json(
      { error: "Failed to process bulk return approval" },
      { status: 500 }
    );
  }
}

// Async helper function to send bulk approval emails - runs in background
async function sendBulkApprovalEmailsAsync(
  returnsByOrder: Record<string, any[]>,
  reasonLabelsRo: Record<string, string>
) {
  console.log(`📧 Background: Starting bulk email processing...`);
  
  for (const [orderId, orderReturns] of Object.entries(returnsByOrder)) {
    try {
      const firstReturn = orderReturns[0];
      const customer = firstReturn.user;
      const order = firstReturn.order;
      const defaultAddress = customer.addresses[0];

      const customerAddress = defaultAddress
        ? `${defaultAddress.addressLine1}, ${defaultAddress.city}, ${defaultAddress.state}, ${defaultAddress.postalCode}, ${defaultAddress.country}`
        : undefined;

      const allProductNames = orderReturns
        .map((r: any) => r.orderItem.name)
        .join(", ");
      const allReturnIds = orderReturns.map((r: any) => r.id);

      console.log(`📄 Background: Generating PDF for order ${order.orderNumber}...`);

      // Generate one return label for all items
      const pdfBuffer = await generateReturnLabel({
        orderId: order.id,
        orderNumber: order.orderNumber,
        returnId: allReturnIds.join(","),
        productName: `${orderReturns.length} articol(e): ${allProductNames}`,
        productId: orderReturns[0].orderItem.productId || "",
        productSku: orderReturns
          .map((r: any) => r.orderItem.product?.sku || "N/A")
          .join(", "),
        reason: "Returnare în bloc",
        customerName: customer.name || customer.email,
        customerEmail: customer.email,
        customerAddress,
        language: "ro",
      });

      const orderDate = new Date(order.createdAt).toLocaleDateString("ro-RO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const itemsList = orderReturns
        .map(
          (returnItem: any) =>
            `<tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px 0;">${returnItem.orderItem.name}</td>
          <td style="padding: 8px 0; text-align: center;">${returnItem.orderItem.quantity}</td>
          <td style="padding: 8px 0;">${reasonLabelsRo[returnItem.reason as keyof typeof reasonLabelsRo] || returnItem.reason}</td>
        </tr>`
        )
        .join("");

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333333;">
          <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">TechTots</h1>
            <p style="color: white; margin: 5px 0 0 0;">Magazin de Jucării STEM</p>
          </div>
          
          <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #4f46e5; margin-top: 0;">Solicitările de returnare au fost aprobate - Comanda #${order.orderNumber}</h2>
            
            <p style="font-size: 16px;">Salut ${customer.name || "Client"},</p>
            
            <p>Ne pare rău să aflăm că doriți să returnați aceste produse din comanda dumneavoastră. Am aprobat toate solicitările de returnare și am atașat o singură etichetă de returnare pentru toate articolele.</p>
            
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Detalii Returnare:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Număr Comandă:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${order.orderNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Data Comenzii:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${orderDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Numărul total de articole returnate:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${orderReturns.length}</td>
                </tr>
              </table>
            </div>

            <h3>Articole pentru returnare:</h3>
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 10px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 2px solid #e5e7eb; font-weight: bold;">
                  <td style="padding: 8px 0;">Produs</td>
                  <td style="padding: 8px 0; text-align: center;">Cantitate</td>
                  <td style="padding: 8px 0;">Motiv</td>
                </tr>
                ${itemsList}
              </table>
            </div>
            
            <h3>Instrucțiuni pentru Returnare:</h3>
            <ol style="line-height: 1.6;">
              <li><strong>Printați eticheta de returnare atașată acestui email.</strong></li>
              <li><strong>Împachetați TOATE produsele în același pachet</strong> (folosiți ambalajul original dacă este posibil).</li>
              <li>Atașați eticheta de returnare pe pachet.</li>
              <li>Duceți pachetul la orice oficiu poștal sau punct de curierat.</li>
              <li>Păstrați dovada de expediere până la procesarea returnării.</li>
            </ol>

            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-weight: bold;">⚠️ Important:</p>
              <p style="margin: 5px 0 0 0; color: #92400e;">Toate articolele trebuie să fie returnate într-un singur pachet folosind eticheta atașată. Nu folosiți etichete separate pentru fiecare articol.</p>
            </div>
            
            <p style="margin-top: 20px; color: #b91c1c; font-weight: bold;">Aveți la dispoziție 14 zile de la aprobarea acestei returnări pentru a expedia pachetul.</p>
            
            <p>Veți primi o confirmare email când vom procesa returnarea și ramburarea dumneavoastră.</p>
            
            <p style="margin-top: 30px;">Dacă aveți întrebări despre procesul de returnare, vă rugăm să ne contactați la support@techtots.com.</p>
            
            <p>Mulțumim că ați ales TechTots!</p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
            <p style="margin: 0;">© ${new Date().getFullYear()} TechTots STEM Store. Toate drepturile rezervate.</p>
            <p style="margin: 5px 0 0 0;">Mehedinti 54-56, Bl D5, sc 2, apt 70, Cluj-Napoca, Cluj, România</p>
            <p style="margin: 15px 0 0 0;">
              <a href="https://techtots.com/terms" style="color: #4f46e5; text-decoration: none; margin: 0 10px;">Termeni și Condiții</a> | 
              <a href="https://techtots.com/privacy" style="color: #4f46e5; text-decoration: none; margin: 0 10px;">Politica de Confidențialitate</a>
            </p>
          </div>
        </div>
      `;

      const pdfBase64 = pdfBuffer.toString("base64");

      console.log(`📧 Background: Sending email to ${customer.email}...`);

      await sendEmailViaUnifiedSystem({
        to: customer.email,
        subject: `TechTots - Returnare aprobată pentru ${orderReturns.length} articol(e) - Comanda #${order.orderNumber}`,
        html: emailHtml,
        attachments: [
          {
            filename: `TechTots_Eticheta_Returnare_Bulk_${order.orderNumber}.pdf`,
            content: pdfBase64,
            encoding: "base64",
            contentType: "application/pdf",
          },
        ],
      });

      console.log(
        `✅ Background: Email sent to ${customer.email} for order ${order.orderNumber}`
      );
    } catch (emailError) {
      console.error(
        `❌ Background: Error sending email for order ${orderId}:`,
        emailError
      );
      // Continue processing other orders even if one fails
    }
  }
  
  console.log(`✅ Background: Bulk email processing complete`);
}
