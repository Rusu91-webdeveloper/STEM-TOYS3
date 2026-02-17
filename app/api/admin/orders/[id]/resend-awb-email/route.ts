import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendSupplierAwbLabelEmail } from "@/lib/email/supplier-awb";
import { getFanCourierAwbLabel } from "@/lib/integrations/fancourier/client";

const COURIER_NAME = "FANCOURIER";

type SupplierContact = {
  id: string;
  name: string;
  email: string | null;
};

const resolveSupplierEmail = (supplier: SupplierContact | null) => {
  if (!supplier) return process.env.SUPPLIER_EMAIL || null;

  const normalizedSupplierName = supplier.name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_");
  const supplierSpecificEmail =
    process.env[`${normalizedSupplierName}_SUPPLIER_EMAIL`];

  return supplier.email || supplierSpecificEmail || process.env.SUPPLIER_EMAIL || null;
};

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { id: orderIdParam } = await params;
    const order = await db.order.findFirst({
      where: {
        OR: [{ id: orderIdParam }, { orderNumber: orderIdParam }],
      },
      select: {
        id: true,
        orderNumber: true,
        items: {
          where: { isDigital: { not: true } },
          select: {
            productId: true,
          },
        },
        shipments: {
          where: {
            courier: COURIER_NAME,
            awbNumber: { not: null },
          },
          select: {
            awbNumber: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const awbNumber = order.shipments[0]?.awbNumber;
    if (!awbNumber) {
      return NextResponse.json(
        {
          error: "No FAN Courier AWB found for this order",
        },
        { status: 400 }
      );
    }

    const productIds = Array.from(
      new Set(order.items.map(item => item.productId).filter(Boolean) as string[])
    );

    if (productIds.length === 0) {
      return NextResponse.json(
        { error: "Order has no physical product links to resolve supplier email" },
        { status: 400 }
      );
    }

    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: {
        supplier: {
          select: {
            id: true,
            companyName: true,
            contactPersonName: true,
            contactPersonEmail: true,
            email: true,
          },
        },
      },
    });

    const suppliersMap = new Map<string, SupplierContact>();
    for (const product of products) {
      if (!product.supplier?.id) continue;
      if (suppliersMap.has(product.supplier.id)) continue;
      suppliersMap.set(product.supplier.id, {
        id: product.supplier.id,
        name:
          product.supplier.companyName ||
          product.supplier.contactPersonName ||
          "Supplier",
        email: product.supplier.contactPersonEmail || product.supplier.email || null,
      });
    }

    const suppliers = Array.from(suppliersMap.values());
    if (suppliers.length !== 1) {
      return NextResponse.json(
        {
          error:
            suppliers.length === 0
              ? "Could not resolve supplier for this order"
              : "Order contains multiple suppliers. Resend AWB email manually per supplier.",
        },
        { status: 400 }
      );
    }

    const supplier = suppliers[0];
    const supplierEmail = resolveSupplierEmail(supplier);
    if (!supplierEmail) {
      return NextResponse.json(
        { error: "Supplier email is missing for this order" },
        { status: 400 }
      );
    }

    let pdfBase64: string | undefined;
    try {
      const labelResponse = await getFanCourierAwbLabel({ awbNumber });
      pdfBase64 = Buffer.from(labelResponse.buffer).toString("base64");
    } catch (labelError) {
      console.error(
        `[FAN Courier] Failed to download AWB PDF for resend (order ${order.orderNumber}, AWB ${awbNumber}). Sending without attachment.`,
        labelError
      );
    }

    await sendSupplierAwbLabelEmail({
      to: supplierEmail,
      supplierName: supplier.name,
      orderNumber: order.orderNumber,
      awbNumber,
      pdfBase64,
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      awbNumber,
      supplierEmail,
      attachmentIncluded: Boolean(pdfBase64),
    });
  } catch (error) {
    console.error("Error resending supplier AWB email:", error);
    return NextResponse.json(
      {
        error: "Failed to resend AWB email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
