import { db } from "@/lib/db";
import { getShippingSettings } from "@/lib/utils/store-settings";
import {
  DEFAULT_COURIERS,
  getDefaultCourierId,
  parseShippingMethodId,
} from "@/lib/shipping/couriers";
import { createFanAwbForOrder } from "@/lib/shipping/fancourier-awb";
import { createAwbForOrder as createSamedayAwbForOrder } from "@/lib/shipping/sameday-awb";

export async function createCourierAwbForOrder(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, shippingMethod: true },
  });

  if (!order) {
    return { success: false, error: "Order not found" };
  }

  const { courierId } = parseShippingMethodId(order.shippingMethod);
  let resolvedCourierId = courierId;

  if (!resolvedCourierId) {
    const settings = await getShippingSettings();
    const couriers =
      (settings as any)?.couriers && Array.isArray((settings as any).couriers)
        ? (settings as any).couriers
        : DEFAULT_COURIERS;
    resolvedCourierId = getDefaultCourierId(couriers);
  }

  if (!resolvedCourierId) {
    return {
      success: false,
      error: "No courier configured for this order",
    };
  }

  switch (resolvedCourierId) {
    case "fancourier":
      return createFanAwbForOrder(orderId);
    case "sameday":
      return createSamedayAwbForOrder(orderId);
    default:
      return {
        success: false,
        error: `Courier integration not implemented: ${resolvedCourierId}`,
      };
  }
}
