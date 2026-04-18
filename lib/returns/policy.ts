import { addDays, endOfDay, startOfDay } from "date-fns";

export const RETURN_WINDOW_DAYS = 14;
export const RETURN_WINDOW_LABEL_RO = "14 zile calendaristice";
export const RETURN_PHOTO_LIMIT = 5;

export const RETURN_REASON_VALUES = [
  "DOES_NOT_MEET_EXPECTATIONS",
  "DAMAGED_OR_DEFECTIVE",
  "MISSING_PARTS",
  "WRONG_ITEM_SHIPPED",
  "DAMAGED_IN_TRANSIT",
  "CHANGED_MIND",
  "ORDERED_WRONG_PRODUCT",
  "OTHER",
] as const;

export type ReturnReasonCode = (typeof RETURN_REASON_VALUES)[number];

export const RETURN_REASON_LABELS_RO: Record<ReturnReasonCode, string> = {
  DOES_NOT_MEET_EXPECTATIONS: "Produsul nu este pe placul meu",
  DAMAGED_OR_DEFECTIVE: "Produs defect sau nefuncțional",
  MISSING_PARTS: "Produsul are piese lipsă / incomplet",
  WRONG_ITEM_SHIPPED: "Am primit alt produs decât cel comandat",
  DAMAGED_IN_TRANSIT: "Cutia a ajuns deteriorată și produsul a fost afectat",
  CHANGED_MIND: "M-am răzgândit",
  ORDERED_WRONG_PRODUCT: "Am comandat produsul greșit",
  OTHER: "Alt motiv",
};

export type ReturnResponsibilityCode =
  | "CUSTOMER"
  | "SUPPLIER"
  | "COURIER"
  | "UNDECIDED";

export const RETURN_RESPONSIBILITY_LABELS_RO: Record<
  ReturnResponsibilityCode,
  string
> = {
  CUSTOMER: "Clientul suportă returul",
  SUPPLIER: "Furnizorul este responsabil",
  COURIER: "Compania de livrare este responsabilă",
  UNDECIDED: "Necesită verificare manuală",
};

export const RETURN_REASON_HELP_TEXT_RO: Record<ReturnReasonCode, string> = {
  DOES_NOT_MEET_EXPECTATIONS:
    "Alege această opțiune dacă produsul este în regulă, dar nu este ceea ce îți doreai.",
  DAMAGED_OR_DEFECTIVE:
    "Alege această opțiune dacă produsul este defect, nu funcționează corect sau are un defect de fabricație.",
  MISSING_PARTS:
    "Alege această opțiune dacă lipsesc piese, accesorii sau elemente din pachet.",
  WRONG_ITEM_SHIPPED:
    "Alege această opțiune dacă ai primit alt produs, alt model, alt SKU sau altă variantă decât cea comandată.",
  DAMAGED_IN_TRANSIT:
    "Alege această opțiune doar când coletul sau cutia a ajuns deteriorată, iar deteriorarea a afectat produsul.",
  CHANGED_MIND:
    "Alege această opțiune dacă pur și simplu nu mai dorești produsul.",
  ORDERED_WRONG_PRODUCT:
    "Alege această opțiune dacă ai ales din greșeală produsul greșit.",
  OTHER:
    "Alege această opțiune doar dacă niciuna dintre variantele de mai sus nu descrie corect situația.",
};

export function getResponsibilityForReturnReason(
  reason: ReturnReasonCode
): ReturnResponsibilityCode {
  switch (reason) {
    case "DAMAGED_OR_DEFECTIVE":
    case "MISSING_PARTS":
    case "WRONG_ITEM_SHIPPED":
      return "SUPPLIER";
    case "DAMAGED_IN_TRANSIT":
      return "COURIER";
    case "DOES_NOT_MEET_EXPECTATIONS":
    case "CHANGED_MIND":
    case "ORDERED_WRONG_PRODUCT":
      return "CUSTOMER";
    default:
      return "UNDECIDED";
  }
}

export function getLiabilityForReturnReason(reason: ReturnReasonCode) {
  switch (getResponsibilityForReturnReason(reason)) {
    case "SUPPLIER":
      return "SUPPLIER" as const;
    case "COURIER":
      return "COURIER" as const;
    case "CUSTOMER":
      return "CUSTOMER" as const;
    default:
      return "UNDECIDED" as const;
  }
}

export const RETURN_POLICY_CUSTOMER_PAYS_RO =
  "Pentru returul exercitat în baza dreptului de retragere, costul transportului de retur este suportat de client.";

export const RETURN_POLICY_SELLER_PAYS_RO =
  "Pentru produse defecte, deteriorate, neconforme sau expediate greșit, costurile de retur și remediere sunt suportate de vânzător.";

export const RETURN_POLICY_COURIER_PAYS_RO =
  "Pentru colete deteriorate în timpul livrării, cazul este încadrat către firma de curierat, iar dovezile foto sunt necesare pentru reclamația de transport.";

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
