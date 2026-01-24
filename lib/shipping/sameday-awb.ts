import { db } from "@/lib/db";
import { createSamedayAwb } from "@/lib/integrations/sameday/client";
import { validateSamedayOrder } from "@/lib/shipping/sameday-validation";

const COURIER_NAME = "SAMEDAY";

const extractAwbNumber = (response: Record<string, unknown>) => {
  return (
    (response.awbNumber as string | undefined) ||
    (response.awb_number as string | undefined) ||
    ((response.data as Record<string, unknown> | undefined)?.awbNumber as
      | string
      | undefined) ||
    ((response.data as Record<string, unknown> | undefined)?.awb_number as
      | string
      | undefined) ||
    (response.awb as string | undefined) ||
    null
  );
};

const redactPayload = (payload: Record<string, unknown>) => {
  const redacted = { ...payload };
  if ("password" in redacted) redacted.password = "***";
  if ("token" in redacted) redacted.token = "***";
  if ("access_token" in redacted) redacted.access_token = "***";
  return redacted;
};

const buildAwbPayload = (input: {
  order: {
    id: string;
    orderNumber: string;
    total: number;
    paymentMethod: string;
    codAmount?: number | null;
    lockerId?: string | null;
    shippingAddress: {
      fullName: string;
      addressLine1: string;
      addressLine2?: string | null;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      phone: string;
      companyName?: string | null;
      cui?: string | null;
    };
    user?: { email?: string | null } | null;
  };
  service: string | null;
  chargeableWeightKg: number;
  recipientType: "B2B" | "B2C";
}) => {
  const isCodPayment =
    input.order.paymentMethod === "cash_on_delivery" ||
    input.order.paymentMethod === "cod";

  return {
    reference: input.order.orderNumber,
    orderId: input.order.id,
    service: input.service,
    lockerId: input.order.lockerId || undefined,
    recipient: {
      name: input.order.shippingAddress.fullName,
      companyName: input.order.shippingAddress.companyName || undefined,
      cui: input.order.shippingAddress.cui || undefined,
      phone: input.order.shippingAddress.phone,
      email: input.order.user?.email || undefined,
    },
    address: {
      line1: input.order.shippingAddress.addressLine1,
      line2: input.order.shippingAddress.addressLine2 || undefined,
      city: input.order.shippingAddress.city,
      county: input.order.shippingAddress.state,
      postalCode: input.order.shippingAddress.postalCode,
      country: input.order.shippingAddress.country,
    },
    parcels: [
      {
        weightKg: input.chargeableWeightKg,
      },
    ],
    cod: isCodPayment
      ? {
          amount: input.order.codAmount ?? input.order.total,
          currency: "RON",
        }
      : null,
    recipientType: input.recipientType,
  };
};

export const createAwbForOrder = async (orderId: string) => {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      user: true,
      shippingAddress: true,
      billingAddress: true,
    },
  });

  if (!order) {
    return { success: false, error: "Order not found" };
  }

  if (!order.shippingAddress) {
    return { success: false, error: "Shipping address missing" };
  }

  const hasPhysicalItems = order.items.some(item => item.isDigital !== true);
  if (!hasPhysicalItems) {
    return { success: false, error: "Order has no shippable items" };
  }

  const isCodPayment =
    order.paymentMethod === "cash_on_delivery" || order.paymentMethod === "cod";

  if (order.paymentStatus !== "PAID" && !isCodPayment) {
    return {
      success: false,
      error: "Order payment is not confirmed",
    };
  }

  const existingShipment = await db.shipment.findFirst({
    where: { orderId, courier: COURIER_NAME },
  });

  if (existingShipment?.awbNumber) {
    return {
      success: true,
      shipment: existingShipment,
      awbNumber: existingShipment.awbNumber,
      alreadyExists: true,
    };
  }

  const productIds = order.items
    .filter(item => item.isDigital !== true)
    .map(item => item.productId)
    .filter(Boolean) as string[];
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, weight: true, dimensions: true },
  });
  const productMap = new Map(products.map(product => [product.id, product]));

  const shippingItems = order.items
    .filter(item => item.isDigital !== true)
    .map(item => {
      const product = item.productId ? productMap.get(item.productId) : null;
      if (!product) return null;
      return {
        quantity: item.quantity,
        weightKg: product.weight,
        dimensions: product.dimensions as Record<string, unknown>,
      };
    })
    .filter(Boolean) as Array<{
    quantity: number;
    weightKg?: number | null;
    dimensions?: Record<string, unknown> | null;
  }>;

  const validation = await validateSamedayOrder({
    order: {
      id: order.id,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      total: order.total,
      codAmount: order.codAmount,
      shippingMethod: order.shippingMethod,
      lockerId: order.lockerId,
      user: order.user,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
    },
    shippingItems,
  });

  if (!validation.valid) {
    return {
      success: false,
      error: "Order validation failed",
      details: validation,
    };
  }

  const payload = buildAwbPayload({
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      paymentMethod: order.paymentMethod,
      codAmount: order.codAmount ?? null,
      lockerId: order.lockerId,
      shippingAddress: order.shippingAddress,
      user: order.user,
    },
    service: validation.service,
    chargeableWeightKg: validation.chargeableWeightKg || 0,
    recipientType: validation.recipientType,
  });

  const shipment = await db.shipment.create({
    data: {
      orderId: order.id,
      courier: COURIER_NAME,
      status: "PENDING",
      payload: payload,
    },
  });

  let response: Record<string, unknown> | null = null;
  let awbNumber: string | null = null;
  let status = "FAILED";
  try {
    response = await createSamedayAwb(payload);
    awbNumber = extractAwbNumber(response);
    status = awbNumber ? "CREATED" : "FAILED";
  } catch (error) {
    response = {
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  await db.awbEvent.create({
    data: {
      shipmentId: shipment.id,
      eventType: "CREATE_AWB",
      requestJson: redactPayload(payload),
      responseJson: response,
    },
  });

  const updatedShipment = await db.shipment.update({
    where: { id: shipment.id },
    data: {
      awbNumber,
      status,
      payload: response ? { request: payload, response } : payload,
    },
  });

  if (!awbNumber) {
    return {
      success: false,
      error: "AWB creation failed",
      shipment: updatedShipment,
      response,
    };
  }

  return {
    success: true,
    shipment: updatedShipment,
    awbNumber,
  };
};
