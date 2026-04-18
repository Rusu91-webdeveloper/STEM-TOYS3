import { addDays, endOfDay, startOfDay } from "date-fns";

export const RETURN_WINDOW_DAYS = 14;
export const RETURN_WINDOW_LABEL_RO = "14 zile calendaristice";
export const RETURN_PHOTO_LIMIT = 5;

export const RETURN_REASON_VALUES = [
  "DOES_NOT_MEET_EXPECTATIONS",
  "DAMAGED_OR_DEFECTIVE",
  "WRONG_ITEM_SHIPPED",
  "CHANGED_MIND",
  "ORDERED_WRONG_PRODUCT",
  "OTHER",
] as const;

export type ReturnReasonCode = (typeof RETURN_REASON_VALUES)[number];

export const RETURN_REASON_LABELS_RO: Record<ReturnReasonCode, string> = {
  DOES_NOT_MEET_EXPECTATIONS: "Nu corespunde așteptărilor",
  DAMAGED_OR_DEFECTIVE: "Produs deteriorat sau defect",
  WRONG_ITEM_SHIPPED: "Produs greșit livrat",
  CHANGED_MIND: "M-am răzgândit",
  ORDERED_WRONG_PRODUCT: "Am comandat produsul greșit",
  OTHER: "Alt motiv",
};

export const RETURN_POLICY_CUSTOMER_PAYS_RO =
  "Pentru returul exercitat în baza dreptului de retragere, costul transportului de retur este suportat de client.";

export const RETURN_POLICY_SELLER_PAYS_RO =
  "Pentru produse defecte, deteriorate, neconforme sau expediate greșit, costurile de retur și remediere sunt suportate de vânzător.";

export const RETURN_POLICY_COD_RTO_RO =
  "Pentru comenzile cu plata ramburs refuzate la livrare sau neridicate, returul la expeditor este suportat de noi. Dacă acest lucru a fost comunicat înainte de finalizarea comenzii, putem reține doar costul logistic al transportului tur.";

export const RETURN_POLICY_EVIDENCE_RO =
  "Fotografiile încărcate se salvează împreună cu cererea de retur și pot fi folosite ca dovadă pentru analiza internă și pentru relația cu furnizorul.";

type OrderLike = {
  createdAt: Date | string;
  deliveredAt?: Date | string | null;
};

export function isReturnReason(value: unknown): value is ReturnReasonCode {
  return (
    typeof value === "string" &&
    (RETURN_REASON_VALUES as readonly string[]).includes(value)
  );
}

export function normalizeReturnDetails(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeReturnPhotos(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, RETURN_PHOTO_LIMIT);
}

export function getReturnReferenceDate(order: OrderLike): Date {
  return new Date(order.deliveredAt || order.createdAt);
}

export function getReturnDeadline(referenceDate: Date | string): Date {
  return endOfDay(addDays(startOfDay(new Date(referenceDate)), RETURN_WINDOW_DAYS));
}

export function isWithinReturnWindowFromDate(
  referenceDate: Date | string,
  now: Date = new Date()
): boolean {
  return now.getTime() <= getReturnDeadline(referenceDate).getTime();
}

export function isWithinReturnWindowForOrder(
  order: OrderLike,
  now: Date = new Date()
): boolean {
  return isWithinReturnWindowFromDate(getReturnReferenceDate(order), now);
}
