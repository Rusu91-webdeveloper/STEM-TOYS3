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

// Warranty complaints are not statutory change-of-mind withdrawals. Admit
// them for review rather than rejecting them at the 14-day withdrawal gate.
export function isConformityComplaint(reason: ReturnReasonCode): boolean {
  const responsibility = getResponsibilityForReturnReason(reason);
  return responsibility === "SUPPLIER" || responsibility === "COURIER";
}

export const RETURN_POLICY_CUSTOMER_PAYS_RO =
  "Dacă te răzgândești și îți exerciți dreptul de retragere, suporți costul direct al expedierii returului, plătit transportatorului ales. Acesta nu este o taxă de penalizare sau de procesare impusă de TechTots.";

export const RETURN_POLICY_REFUND_RO =
  "La retragerea din întreaga comandă, rambursăm sumele achitate, inclusiv costul livrării standard inițiale. Diferența pentru o livrare mai scumpă aleasă expres nu se rambursează. Rambursăm în cel mult 14 zile de la informarea despre retragere; putem amâna până primim bunurile sau dovada expedierii, oricare survine prima. Nu percepem o taxă fixă de restocare; poate fi reținută doar diminuarea valorii dovedită, rezultată din manipularea peste ceea ce este necesar pentru verificarea produsului.";

export const RETURN_POLICY_DISPATCH_RO =
  "La retragere, expediază bunurile în cel mult 14 zile de la comunicarea retragerii, fără să aștepți aprobarea sau autorizarea furnizorului. Contactează TechTots pentru adresa corectă și instrucțiunile de expediere. Pentru produse neconforme, organizăm transportul fără costuri pentru tine; termenul de retragere nu limitează garanția legală.";

export const RETURN_POLICY_CUSTOMER_PAYS_EN =
  "If you change your mind and withdraw, you pay the direct cost of sending the goods back to your chosen carrier. This is not a penalty or a processing fee charged by TechTots.";
export const RETURN_POLICY_REFUND_EN =
  "For withdrawal from the entire order, we refund the amounts paid, including the initial standard delivery charge. The extra cost of a more expensive delivery expressly chosen is excluded. Refunds are due within 14 days of your withdrawal notice; we may withhold them until we receive the goods or proof of dispatch, whichever comes first. No fixed restocking fee applies; only a proven loss in value from handling beyond necessary inspection may be deducted.";
export const RETURN_POLICY_SELLER_PAYS_EN =
  "For defective, damaged, non-conforming or incorrectly supplied goods, TechTots arranges the necessary return and remedy without cost to you. Contact us before booking transport.";

export const RETURN_POLICY_SELLER_PAYS_RO =
  "Pentru produse defecte, deteriorate, neconforme sau expediate greșit, TechTots organizează transportul necesar și remedierea fără costuri pentru tine. Contactează-ne înainte de a contracta transportul.";

export const RETURN_POLICY_COURIER_PAYS_RO =
  "Pentru colete deteriorate în timpul livrării, cazul este încadrat către firma de curierat, iar dovezile foto sunt necesare pentru reclamația de transport.";

export const RETURN_POLICY_COD_RTO_RO =
  "Fiecare comandă ramburs necesită o autorizare temporară pe card pentru transportul tur, fără încasare la plasarea comenzii. Produsele se plătesc la primire; autorizarea nu este o plată și nu salvează cardul în cont. Refuzul sau nepreluarea coletului nu declanșează automat încasarea garanției și nu reprezintă, singure, o declarație de retragere. Orice eventuală solicitare de recuperare a unui prejudiciu necesită verificarea individuală a situației, dovezi și un temei legal; nu este o penalizare automată. O retragere legală comunicată valabil nu este penalizată. TechTots suportă returul la expeditor în cazul RTO; pentru retragerea după primire se aplică politica de retur. Pentru FANbox alegi plata online, deoarece rambursul nu este disponibil.";

export const RETURN_POLICY_COD_RTO_EN =
  "Every COD order requires a temporary card authorization for outbound shipping, without capture when placing the order. Goods are paid for on delivery; authorization is not a payment and does not save the card in your account. Refusal or non-collection alone neither automatically captures the guarantee nor constitutes a withdrawal declaration. Any claim for loss requires individual review, evidence and a legal basis; it is not an automatic penalty. A valid statutory withdrawal is not penalized. TechTots covers return-to-sender shipping for RTO; withdrawal after receipt follows the return policy. FANbox requires online payment because COD is unavailable.";

export function getCustomerReturnInstructions(reason: string): string {
  if (!isReturnReason(reason))
    return `${RETURN_POLICY_CUSTOMER_PAYS_RO} ${RETURN_POLICY_SELLER_PAYS_RO} ${RETURN_POLICY_DISPATCH_RO}`;
  const responsibility = getResponsibilityForReturnReason(reason);
  return `${responsibility === "CUSTOMER" ? RETURN_POLICY_CUSTOMER_PAYS_RO : responsibility === "UNDECIDED" ? `${RETURN_POLICY_CUSTOMER_PAYS_RO} ${RETURN_POLICY_SELLER_PAYS_RO}` : RETURN_POLICY_SELLER_PAYS_RO} ${RETURN_POLICY_DISPATCH_RO}`;
}

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
  return endOfDay(
    addDays(startOfDay(new Date(referenceDate)), RETURN_WINDOW_DAYS)
  );
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
  // Missing delivery evidence requires review, not an invented expiry based on purchase.
  if (!order.deliveredAt || Number.isNaN(new Date(order.deliveredAt).getTime()))
    return true;
  return isWithinReturnWindowFromDate(getReturnReferenceDate(order), now);
}
