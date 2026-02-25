import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendSupplierAwbLabelEmail } from "@/lib/email/supplier-awb";
import { getFanCourierAwbLabel } from "@/lib/integrations/fancourier/client";

const COURIER_NAME = "FANCOURIER";
const isSupplierAwbEmailDisabled = () =>
  process.env.DISABLE_SUPPLIER_AWB_EMAIL === "true";

type SupplierContact = {
  id: string;
  name: string;
  email: string | null;
};

const extractSenderFromPayload = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return null;

  const root = payload as Record<string, unknown>;
  const request =
    root.request && typeof root.request === "object"
      ? (root.request as Record<string, unknown>)
      : root;
  const shipments =
    request.shipments && Array.isArray(request.shipments)
      ? (request.shipments as Array<Record<string, unknown>>)
      : root.shipments && Array.isArray(root.shipments)
        ? (root.shipments as Array<Record<string, unknown>>)
        : [];
  const shipmentSender =
    shipments[0]?.sender && typeof shipments[0].sender === "object"
      ? (shipments[0].sender as Record<string, unknown>)
      : null;
  const sender =
    shipmentSender ||
    (request.sender && typeof request.sender === "object"
      ? (request.sender as Record<string, unknown>)
      : null);

  if (!sender) return null;

  const senderAddress =
    sender.address && typeof sender.address === "object"
      ? (sender.address as Record<string, unknown>)
      : null;

  return {
    name: (sender.name as string | undefined) ?? null,
    phone: (sender.phone as string | undefined) ?? null,
    contactPerson: (sender.contactperson as string | undefined) ?? null,
    email: (sender.email as string | undefined) ?? null,
    county:
      (sender.county as string | undefined) ||
      (senderAddress?.county as string | undefined) ||
      null,
    locality:
      (sender.locality as string | undefined) ||
      (senderAddress?.locality as string | undefined) ||
      null,
    street:
      (sender.street as string | undefined) ||
      (senderAddress?.street as string | undefined) ||
      null,
    number:
      (sender.number as string | undefined) ||
      (sender.streetNo as string | undefined) ||
      (senderAddress?.streetNo as string | undefined) ||
      null,
    postalCode:
      (sender.postalCode as string | undefined) ||
      (senderAddress?.zipCode as string | undefined) ||
      null,
  };
};

const resolveSupplierEmail = (supplier: SupplierContact | null) => {
  if (!supplier) return process.env.SUPPLIER_EMAIL || null;

  const normalizedSupplierName = supplier.name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_");
  const supplierSpecificEmail =
    process.env[`${normalizedSupplierName}_SUPPLIER_EMAIL`];

  return (
    supplier.email ||
    supplierSpecificEmail ||
    process.env.SUPPLIER_EMAIL ||
    null
  );
};

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let step = "auth";
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    step = "load-params";
    const { id: orderIdParam } = await params;
    step = "load-order";
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
            name: true,
            quantity: true,
            product: {
              select: {
                sku: true,
                barcode: true,
                images: true,
              },
            },
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
            payload: true,
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
    const senderFromAwbPayload = extractSenderFromPayload(
      order.shipments[0]?.payload
    );
    if (!awbNumber) {
      return NextResponse.json(
        {
          error: "No FAN Courier AWB found for this order",
        },
        { status: 400 }
      );
    }

    step = "resolve-products";
    const productIds = Array.from(
      new Set(
        order.items.map(item => item.productId).filter(Boolean) as string[]
      )
    );

    if (productIds.length === 0) {
      return NextResponse.json(
        {
          error:
            "Order has no physical product links to resolve supplier email",
        },
        { status: 400 }
      );
    }

    step = "load-products";
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
        email:
          product.supplier.contactPersonEmail || product.supplier.email || null,
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

    step = "download-awb-label";
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

    step = "send-email";
    const emailSkipped = isSupplierAwbEmailDisabled();
    if (emailSkipped) {
      console.info(
        `[FAN Courier] Supplier AWB resend email disabled by DISABLE_SUPPLIER_AWB_EMAIL=true. Skipping email for order ${order.orderNumber}.`
      );
    } else {
      await sendSupplierAwbLabelEmail({
        to: supplierEmail,
        supplierName: supplier.name,
        orderNumber: order.orderNumber,
        awbNumber,
        pdfBase64,
        orderItems: order.items.map(item => ({
          name: item.name || "Produs",
          sku: item.product?.sku || null,
          barcode: item.product?.barcode || null,
          imageUrl: item.product?.images?.[0] || null,
          quantity: item.quantity,
        })),
      });
    }

    step = "response";
    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      awbNumber,
      supplierEmail,
      attachmentIncluded: Boolean(pdfBase64),
      emailSkipped,
      debug: {
        useSupplierAddressFlag:
          process.env.FANCOURIER_USE_SUPPLIER_ADDRESS === "true",
        disableSupplierAwbEmailFlag: emailSkipped,
        senderFromAwbPayload,
      },
    });
  } catch (error) {
    console.error("Error resending supplier AWB email:", error);
    return NextResponse.json(
      {
        error: "Failed to resend AWB email",
        step,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
