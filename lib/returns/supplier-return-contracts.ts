import { z } from "zod";

import { supplierCalendarDeadline } from "@/lib/returns/contract-deadline";
import {
  type DestinationEvidence,
  type DestinationReturnRecord,
} from "@/lib/returns/return-destination";

export const supplierReturnSelect = {
  id: true,
  name: true,
  companyName: true,
  cui: true,
  codFiscal: true,
  businessAddress: true,
  businessCity: true,
  businessState: true,
  businessPostalCode: true,
  businessCountry: true,
} as const;

export interface ReturnSupplier {
  id: string;
  name: string;
  companyName?: string | null;
  cui?: string | null;
  codFiscal?: string | null;
  businessAddress?: string | null;
  businessCity?: string | null;
  businessState?: string | null;
  businessPostalCode?: string | null;
  businessCountry?: string | null;
}

export function supplierContract(
  supplier?: ReturnSupplier | null
): DestinationEvidence["contract"] | null {
  if (!supplier) return null;
  const taxId = (supplier.cui || supplier.codFiscal || "")
    .replace(/^RO/i, "")
    .trim();
  if (taxId === "39581359") return "KIDSTORY_2026";
  if (taxId === "16874325") return "BORIBON_2026";
  // Existing supplier records sometimes omit the tax identifier.
  if (taxId) return null;
  const name = (supplier.name || supplier.companyName || "")
    .trim()
    .toLowerCase();
  if (
    ["kidstory", "proiecte si idei srl", "proiecte si idei s.r.l."].includes(
      name
    )
  )
    return "KIDSTORY_2026";
  if (["boribon", "boribon com srl", "boribon com s.r.l."].includes(name))
    return "BORIBON_2026";
  return null;
}

export const destinationReviewSchema = z.discriminatedUnion("target", [
  z.object({ target: z.literal("COMPANY") }).strict(),
  z
    .object({
      target: z.literal("SUPPLIER"),
      condition: z.enum([
        "SEALED_UNUSED",
        "MANUFACTURING_DEFECT",
        "WRONG_ITEM",
      ]),
      confirmation: z.string().trim().min(5).max(2000),
      contractActiveConfirmed: z.literal(true),
      warehouseConfirmed: z.literal(true),
      expectedArrivalAt: z.string().datetime(),
      supplierInvoiceAt: z.string().datetime().optional(),
      deliveredAt: z.string().datetime().optional(),
      authorizationIssuedAt: z.string().datetime().optional(),
      warrantyConfirmed: z.boolean().optional(),
      originalDocumentsConfirmed: z.boolean().optional(),
      descriptionMatchesConfirmed: z.boolean().optional(),
    })
    .strict(),
]);

export type DestinationReview = z.infer<typeof destinationReviewSchema>;
const WITHDRAWAL_REASONS = new Set([
  "CHANGED_MIND",
  "DOES_NOT_MEET_EXPECTATIONS",
  "ORDERED_WRONG_PRODUCT",
]);
const DEFECT_REASONS = new Set(["DAMAGED_OR_DEFECTIVE", "MISSING_PARTS"]);

export function reviewSupplierDestination(input: {
  record: DestinationReturnRecord;
  supplier?: ReturnSupplier | null;
  review: DestinationReview;
  reviewer: string;
  now?: Date;
}): DestinationEvidence | null {
  const { record, supplier, review, reviewer } = input;
  const now = input.now || new Date();
  if (review.target === "COMPANY") return null;
  const contract = supplierContract(supplier);
  if (record.orderItem?.isDigital)
    throw new Error("Produsele digitale nu au destinație de expediere.");
  if (!supplier || !contract)
    throw new Error(
      "Contractul furnizorului nu este verificat. Folosește adresa TechTots."
    );
  if (record.supplierAuthorizationStatus !== "APPROVED")
    throw new Error(
      "Înregistrează mai întâi confirmarea furnizorului (APPROVED)."
    );
  if (!supplier.businessAddress || !supplier.businessCity)
    throw new Error(
      "Adresa depozitului lipsește din baza de date. Folosește adresa TechTots."
    );
  if (record.reason === "DAMAGED_IN_TRANSIT" || record.reason === "OTHER")
    throw new Error(
      "Acest caz necesită verificare la TechTots; nu este un retur standard la furnizor."
    );

  const expected = Date.parse(review.expectedArrivalAt);
  if (expected <= now.getTime())
    throw new Error("Sosirea estimată trebuie să fie în viitor.");
  for (const value of [
    review.supplierInvoiceAt,
    review.deliveredAt,
    review.authorizationIssuedAt,
  ]) {
    if (value && Date.parse(value) > now.getTime())
      throw new Error("Data dovezii nu poate fi în viitor.");
  }
  const withdrawal = WITHDRAWAL_REASONS.has(record.reason || "");
  const defect = DEFECT_REASONS.has(record.reason || "");
  const wrongItem = record.reason === "WRONG_ITEM_SHIPPED";
  if (
    (withdrawal && review.condition !== "SEALED_UNUSED") ||
    (defect && review.condition !== "MANUFACTURING_DEFECT") ||
    (wrongItem && review.condition !== "WRONG_ITEM")
  )
    throw new Error("Starea verificată nu corespunde motivului returului.");

  let arriveBy: number;
  const authorizationNumber =
    record.supplierAuthorizationNumber?.trim() || null;
  const authorizationDeadline = record.supplierAuthorizationDeadline
    ? new Date(record.supplierAuthorizationDeadline).toISOString()
    : null;
  if (contract === "KIDSTORY_2026") {
    // Annex 1: every supplier return requires an ARP and physical receipt in 10 days.
    if (
      !authorizationNumber ||
      !review.authorizationIssuedAt ||
      !authorizationDeadline
    )
      throw new Error(
        "KidStory necesită ARP, data emiterii și termenul de sosire confirmat."
      );
    arriveBy = Math.min(
      supplierCalendarDeadline(review.authorizationIssuedAt, 10),
      Date.parse(authorizationDeadline)
    );
    if (withdrawal && !review.originalDocumentsConfirmed)
      throw new Error(
        "Confirmă produsul sigilat, nefolosit și documentele originale."
      );
    if (defect && !review.warrantyConfirmed) {
      if (!review.supplierInvoiceAt || !record.supplierAuthorizationRequestedAt)
        throw new Error(
          "Confirmă data facturii și data solicitării ARP, sau aprobarea în garanție."
        );
      const requested = new Date(
        record.supplierAuthorizationRequestedAt
      ).getTime();
      if (
        requested < Date.parse(review.supplierInvoiceAt) ||
        requested > supplierCalendarDeadline(review.supplierInvoiceAt, 10)
      )
        throw new Error(
          "Solicitarea depășește fereastra inițială KidStory; verifică traseul de garanție sau TechTots."
        );
    }
    if (wrongItem) {
      // Invoice/delivery wording is ambiguous: use the earlier confirmed anchor.
      if (
        !review.supplierInvoiceAt ||
        !review.deliveredAt ||
        !record.supplierAuthorizationRequestedAt
      )
        throw new Error(
          "Produs greșit: confirmă factura, livrarea și data solicitării ARP."
        );
      const anchor = new Date(
        Math.min(
          Date.parse(review.supplierInvoiceAt),
          Date.parse(review.deliveredAt)
        )
      ).toISOString();
      const requested = new Date(
        record.supplierAuthorizationRequestedAt
      ).getTime();
      if (
        requested < Date.parse(anchor) ||
        requested > supplierCalendarDeadline(anchor, 5)
      )
        throw new Error(
          "Solicitarea depășește cele 5 zile KidStory. Folosește TechTots pentru acest caz."
        );
    }
  } else {
    // Boribon §5.1(c), §8.3: ordinary returns must physically arrive by day 18.
    // Manufacturing defects follow §3.6 warranty handling, without this ordinary-return limit.
    if (defect) {
      if (!review.warrantyConfirmed || !authorizationDeadline)
        throw new Error(
          "Confirmă traseul de garanție Boribon și termenul de sosire agreat."
        );
      arriveBy = Date.parse(authorizationDeadline);
    } else {
      if (
        !withdrawal ||
        !review.deliveredAt ||
        !review.descriptionMatchesConfirmed
      )
        throw new Error(
          "Boribon: returul standard trebuie să fie sigilat, nefolosit, cu descriere corectă și livrare confirmată. Alte cazuri merg la TechTots."
        );
      arriveBy = supplierCalendarDeadline(review.deliveredAt, 18);
      if (authorizationDeadline)
        arriveBy = Math.min(arriveBy, Date.parse(authorizationDeadline));
    }
  }
  if (
    !Number.isFinite(arriveBy) ||
    expected > arriveBy ||
    arriveBy <= now.getTime()
  )
    throw new Error(
      "Coletul nu poate ajunge în termenul furnizorului. Folosește adresa TechTots."
    );
  const address = [
    supplier.businessAddress,
    supplier.businessCity,
    supplier.businessState,
    supplier.businessPostalCode,
    supplier.businessCountry || "România",
  ]
    .filter(Boolean)
    .join(", ");
  return {
    version: 1,
    supplierId: supplier.id,
    contract,
    reason: record.reason || "",
    reviewer,
    reviewedAt: now.toISOString(),
    confirmation: review.confirmation,
    checks: {
      condition: review.condition,
      expectedArrivalAt: review.expectedArrivalAt,
      supplierInvoiceAt: review.supplierInvoiceAt,
      deliveredAt: review.deliveredAt,
      authorizationIssuedAt: review.authorizationIssuedAt,
      warrantyConfirmed: review.warrantyConfirmed,
      originalDocumentsConfirmed: review.originalDocumentsConfirmed,
      descriptionMatchesConfirmed: review.descriptionMatchesConfirmed,
      contractActiveConfirmed: true,
      warehouseConfirmed: true,
    },
    authorizationNumber,
    authorizationDeadline,
    destination: {
      target: "SUPPLIER",
      recipient: supplier.companyName || supplier.name,
      address,
      ...(authorizationNumber ? { authorizationNumber } : {}),
      arriveBy: new Date(arriveBy).toISOString(),
    },
  };
}
