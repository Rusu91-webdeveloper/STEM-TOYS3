import { isWithinReturnWindowForOrder } from "@/lib/returns/policy";

type Order = {
  status: string;
  paymentStatus?: string;
  createdAt: Date | string;
  deliveredAt?: Date | string | null;
};

export const DIGITAL_RETURN_INSTRUCTIONS_RO =
  "Pentru conținut digital nu expedia nimic și nu plăti transport. Verificăm separat dreptul de retragere, acordul expres pentru furnizare, confirmarea pierderii dreptului și dovada transmisă pe suport durabil. Descărcarea singură nu dovedește renunțarea la drept. Drepturile privind neconformitatea rămân aplicabile.";

export function canRequestReturnForItem(
  order: Order,
  item: { isDigital?: boolean | null }
) {
  if (item.isDigital)
    return (
      order.paymentStatus === "PAID" ||
      ["DELIVERED", "COMPLETED"].includes(order.status)
    );
  return ["DELIVERED", "COMPLETED"].includes(order.status);
}

export function isWithinReturnWindowForItem(
  order: Order,
  item: { isDigital?: boolean | null },
  now = new Date()
) {
  // No item-level express consent, acknowledgement and durable confirmation
  // are recorded by checkout yet. Admit digital requests for review; neither
  // a download count nor the physical delivery date proves an exception.
  return item.isDigital ? true : isWithinReturnWindowForOrder(order, now);
}
