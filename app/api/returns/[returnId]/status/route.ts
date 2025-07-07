import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { sendMail } from "@/lib/brevo";
import { db } from "@/lib/db";
import { ro as roTranslations } from "@/lib/i18n/translations/ro";
import { generateReturnLabel } from "@/lib/return-label";

// Return reason display labels (unused but kept for future use)
 
const _reasonLabels = {
  DOES_NOT_MEET_EXPECTATIONS: "Does not meet expectations",
  DAMAGED_OR_DEFECTIVE: "Damaged or defective",
  WRONG_ITEM_SHIPPED: "Wrong item shipped",
  CHANGED_MIND: "Changed my mind",
  ORDERED_WRONG_PRODUCT: "Ordered wrong product",
  OTHER: "Other reason",
};

// Romanian reason labels
const reasonLabelsRo = {
  DOES_NOT_MEET_EXPECTATIONS: "Nu îndeplinește așteptările",
  DAMAGED_OR_DEFECTIVE: "Deteriorat sau defect",
  WRONG_ITEM_SHIPPED: "Produs greșit expediat",
  CHANGED_MIND: "M-am răzgândit",
  ORDERED_WRONG_PRODUCT: "Am comandat produsul greșit",
  OTHER: "Alt motiv",
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ returnId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    // Properly await params in Next.js 15
    const params = await context.params;
    const returnId = params.returnId;
    const { status } = await request.json();

    console.log(`🔄 Processing return ${returnId} status change to: ${status}`);

    // Validate status
    const validStatuses = [
      "PENDING",
      "APPROVED",
      "REJECTED",
      "RECEIVED",
      "REFUNDED",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Get return data with order and product details
    const returnData = await db.return.findUnique({
      where: { id: returnId },
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

    if (!returnData) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }

    // Update return status
    const updatedReturn = await db.return.update({
      where: { id: returnId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            addresses: {
              where: { isDefault: true },
              take: 1,
            },
          },
        },
        order: true,
        orderItem: {
          include: {
            product: true,
          },
        },
      },
    });

    console.log(`✅ Return ${returnId} status updated to: ${status}`);

    // If status is changed to APPROVED, send email with return label
    if (status === "APPROVED") {
      console.log(
        `📧 Attempting to send return approval email for return ${returnId}`
      );
      console.log(`📧 Customer email: ${updatedReturn.user.email}`);

      try {
        // Get customer address from default address if available
        const defaultAddress = updatedReturn.user.addresses[0];
        const customerAddress = defaultAddress
          ? `${defaultAddress.addressLine1}, ${defaultAddress.city}, ${defaultAddress.state}, ${defaultAddress.postalCode}, ${defaultAddress.country}`
          : undefined;

        console.log(`📄 Generating PDF label...`);

        // Generate return label PDF
        const pdfBuffer = await generateReturnLabel({
          orderId: updatedReturn.order.id,
          orderNumber: updatedReturn.order.orderNumber,
          returnId: updatedReturn.id,
          productName: updatedReturn.orderItem.name,
          productId: updatedReturn.orderItem.productId,
          productSku: updatedReturn.orderItem.product?.sku || "",
          reason:
            reasonLabelsRo[
              updatedReturn.reason as keyof typeof reasonLabelsRo
            ] ?? updatedReturn.reason,
          customerName: (updatedReturn.user.name ??
            updatedReturn.user.email) as string,
          customerEmail: updatedReturn.user.email,
          customerAddress,
          language: "ro", // Set Romanian language for the label
        });

        console.log(
          `✅ PDF generated successfully, size: ${pdfBuffer.length} bytes`
        );

        // Format order date
        const orderDate = new Date(
          updatedReturn.order.createdAt
        ).toLocaleDateString("ro-RO", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        // Product image handling removed as it's not currently used in the email template

        // Create email content with professional Romanian template
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333333;">
            <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">TechTots</h1>
              <p style="color: white; margin: 5px 0 0 0;">Magazin de Jucării STEM</p>
            </div>
            
            <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
              <h2 style="color: #4f46e5; margin-top: 0;">${roTranslations.email_return_approved_subject.replace("#{orderNumber}", updatedReturn.order.orderNumber)}</h2>
              
              <p style="font-size: 16px;">${roTranslations.email_return_approved_greeting.replace("{name}", updatedReturn.user.name ?? "Client")}</p>
              
              <p>${roTranslations.email_return_approved_body.replace("{productName}", updatedReturn.orderItem.name)}</p>
              
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Detalii Returnare:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Număr Comandă:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${updatedReturn.order.orderNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Data Comenzii:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${orderDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Produs:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${updatedReturn.orderItem.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Cantitate:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${updatedReturn.orderItem.quantity}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong>Motiv Returnare:</strong></td>
                    <td style="padding: 8px 0;">${reasonLabelsRo[updatedReturn.reason as keyof typeof reasonLabelsRo] || updatedReturn.reason}</td>
                  </tr>
                </table>
              </div>
              
              <h3>Instrucțiuni pentru Returnare:</h3>
              <ol style="line-height: 1.6;">
                <li>Printați eticheta de returnare atașată acestui email.</li>
                <li>Împachetați produsul în ambalajul original (dacă este posibil).</li>
                <li>Atașați eticheta de returnare pe pachet.</li>
                <li>Duceți pachetul la orice oficiu poștal sau punct de curierat.</li>
                <li>Păstrați dovada de expediere până la procesarea returnării.</li>
              </ol>
              
              <p style="margin-top: 20px; color: #b91c1c; font-weight: bold;">${roTranslations.email_return_approved_legal}</p>
              
              <p>${roTranslations.email_return_approved_tracking}</p>
              
              <p style="margin-top: 30px;">${roTranslations.email_return_approved_footer.replace("{contactEmail}", "support@techtots.com")}</p>
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

        console.log(`📧 Sending email to ${updatedReturn.user.email}...`);

        // Convert PDF to Base64 for email attachment
        const pdfBase64 = pdfBuffer.toString("base64");

        // Send email with attachment
        await sendMail({
          to: updatedReturn.user.email,
          subject: `TechTots - ${roTranslations.email_return_approved_subject.replace("#{orderNumber}", updatedReturn.order.orderNumber)}`,
          html: emailHtml,
          attachments: [
            {
              filename: `TechTots_Eticheta_Returnare_${updatedReturn.order.orderNumber}.pdf`,
              content: pdfBase64,
              encoding: "base64",
              contentType: "application/pdf",
            },
          ],
        });

        console.log(
          `✅ Return label email sent successfully to ${updatedReturn.user.email}`
        );
      } catch (emailError) {
        console.error("❌ Error sending return label email:", emailError);
        console.error("❌ Email error details:", {
          errorMessage:
            emailError instanceof Error ? emailError.message : "Unknown error",
          returnId: updatedReturn.id,
          customerEmail: updatedReturn.user.email,
          orderNumber: updatedReturn.order.orderNumber,
        });
        // We don't want to fail the status update if email fails
        // But we log the error for troubleshooting
      }
    }

    return NextResponse.json({
      success: true,
      message: `Return status updated to ${status}`,
      data: updatedReturn,
    });
  } catch (error: unknown) {
    console.error("Error updating return status:", error);

    // Check for Prisma errors
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to update return status" },
      { status: 500 }
    );
  }
}
