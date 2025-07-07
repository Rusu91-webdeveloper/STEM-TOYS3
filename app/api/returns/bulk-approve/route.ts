import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { sendMail } from "@/lib/brevo";
import { db } from "@/lib/db";
import { ro as roTranslations } from "@/lib/i18n/translations/ro";
import { generateReturnLabel } from "@/lib/return-label";

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

    // Get all returns with order and product details
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
        { error: "No pending returns found with the provided IDs" },
        { status: 404 }
      );
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

    // Process each order's returns separately
    const processedOrders = [];

    for (const [orderId, orderReturns] of Object.entries(returnsByOrder)) {
      try {
        // Update all return statuses in a transaction
        await db.$transaction(async (tx) => {
          await Promise.all(
            orderReturns.map((returnItem) =>
              tx.return.update({
                where: { id: returnItem.id },
                data: { status: "APPROVED" },
              })
            )
          );
        });

        // Get customer details (all returns in this order have the same customer)
        const firstReturn = orderReturns[0];
        const customer = firstReturn.user;
        const order = firstReturn.order;
        const defaultAddress = customer.addresses[0];

        const customerAddress = defaultAddress
          ? `${defaultAddress.addressLine1}, ${defaultAddress.city}, ${defaultAddress.state}, ${defaultAddress.postalCode}, ${defaultAddress.country}`
          : undefined;

        // Create consolidated label with all items
        const allProductNames = orderReturns
          .map((r) => r.orderItem.name)
          .join(", ");
        const allReturnIds = orderReturns.map((r) => r.id);

        // Generate one return label for all items
        const pdfBuffer = await generateReturnLabel({
          orderId: order.id,
          orderNumber: order.orderNumber,
          returnId: allReturnIds.join(","), // Combine all return IDs
          productName: `${orderReturns.length} articol(e): ${allProductNames}`,
          productId: orderReturns[0].orderItem.productId, // Use first product ID as reference
          productSku: orderReturns
            .map((r) => r.orderItem.product.sku || "N/A")
            .join(", "),
          reason: "Returnare în bloc", // Bulk return
          customerName: customer.name || customer.email,
          customerEmail: customer.email,
          customerAddress,
          language: "ro",
        });

        // Format order date
        const orderDate = new Date(order.createdAt).toLocaleDateString(
          "ro-RO",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        );

        // Create consolidated email content
        const itemsList = orderReturns
          .map(
            (returnItem) =>
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
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Numărul total de articole returnatе:</strong></td>
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

        // Convert PDF to Base64 for email attachment
        const pdfBase64 = pdfBuffer.toString("base64");

        // Send one consolidated email for all items
        await sendMail({
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

        processedOrders.push({
          orderId,
          orderNumber: order.orderNumber,
          customerEmail: customer.email,
          itemCount: orderReturns.length,
          returnIds: allReturnIds,
        });

        console.log(
          `✅ Bulk return approval email sent to ${customer.email} for order ${order.orderNumber} with ${orderReturns.length} items`
        );
      } catch (emailError) {
        console.error(
          `❌ Error processing bulk return for order ${orderId}:`,
          emailError
        );
        // Continue processing other orders even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully approved ${returns.length} returns across ${processedOrders.length} orders`,
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
