import { z } from "zod";

import {
  COMPANY_RETURN_DESTINATION,
  type ReturnDestination,
} from "@/lib/returns/return-destination-display";
export {
  COMPANY_RETURN_DESTINATION,
  destinationInstruction,
  type ReturnDestination,
} from "@/lib/returns/return-destination-display";

// Server-owned review evidence lives alongside the existing supplier notes.
// It is never accepted from a notes input or exposed to a customer.
const MARKER = "[RETURN_DESTINATION_V1 ";
const REVIEW_LINE = /^\[RETURN_DESTINATION_V1 (.+)\]$/gm;
export const destinationEvidenceSchema = z
  .object({
    version: z.literal(1),
    supplierId: z.string().min(1),
    contract: z.enum(["KIDSTORY_2026", "BORIBON_2026"]),
    reason: z.string(),
    reviewer: z.string().min(1),
    reviewedAt: z.string().datetime(),
    confirmation: z.string().min(5).max(2000),
    checks: z
      .object({
        condition: z.enum([
          "SEALED_UNUSED",
          "MANUFACTURING_DEFECT",
          "WRONG_ITEM",
        ]),
        expectedArrivalAt: z.string().datetime(),
        supplierInvoiceAt: z.string().datetime().optional(),
        deliveredAt: z.string().datetime().optional(),
        authorizationIssuedAt: z.string().datetime().optional(),
        warrantyConfirmed: z.boolean().optional(),
        originalDocumentsConfirmed: z.boolean().optional(),
        descriptionMatchesConfirmed: z.boolean().optional(),
        contractActiveConfirmed: z.literal(true),
        warehouseConfirmed: z.literal(true),
      })
      .strict(),
    authorizationNumber: z.string().nullable(),
    authorizationDeadline: z.string().datetime().nullable(),
    destination: z
      .object({
        target: z.literal("SUPPLIER"),
        recipient: z.string().min(1).max(200),
        address: z.string().min(10).max(700),
        authorizationNumber: z.string().optional(),
        arriveBy: z.string().datetime(),
      })
      .strict(),
  })
  .strict();

export type DestinationEvidence = z.infer<typeof destinationEvidenceSchema>;

export function readDestinationEvidence(
  notes?: string | null
): DestinationEvidence | null {
  const lines = [...(notes || "").matchAll(REVIEW_LINE)];
  if (lines.length !== 1) return null;
  try {
    const result = destinationEvidenceSchema.safeParse(JSON.parse(lines[0][1]));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function supplierNotesWithoutDestination(notes?: string | null): string {
  return (notes || "").replace(REVIEW_LINE, "").trim();
}

export function containsDestinationMarker(notes: string): boolean {
  return notes.includes(MARKER);
}

export function writeDestinationEvidence(
  notes: string | null | undefined,
  evidence: DestinationEvidence | null
): string | null {
  const plainNotes = supplierNotesWithoutDestination(notes);
  return (
    [plainNotes, evidence ? `${MARKER}${JSON.stringify(evidence)}]` : ""]
      .filter(Boolean)
      .join("\n") || null
  );
}

export interface DestinationReturnRecord {
  reason?: string;
  supplierAuthorizationNotes?: string | null;
  supplierAuthorizationStatus?: string | null;
  supplierAuthorizationNumber?: string | null;
  supplierAuthorizationDeadline?: Date | string | null;
  supplierAuthorizationRequestedAt?: Date | string | null;
  orderItem?: {
    isDigital?: boolean;
    product?: {
      supplierId?: string | null;
      supplier?: { id?: string } | null;
    } | null;
  };
}

export function getReturnDestination(
  record: DestinationReturnRecord,
  now = new Date()
): ReturnDestination {
  if (record.orderItem?.isDigital)
    return { target: "NONE", recipient: "", address: "" };
  const evidence = readDestinationEvidence(record.supplierAuthorizationNotes);
  const supplierId =
    record.orderItem?.product?.supplierId ||
    record.orderItem?.product?.supplier?.id;
  const deadline = record.supplierAuthorizationDeadline
    ? new Date(record.supplierAuthorizationDeadline)
    : null;
  const currentDeadline =
    deadline && Number.isFinite(deadline.getTime())
      ? deadline.toISOString()
      : null;
  if (
    !evidence ||
    evidence.supplierId !== supplierId ||
    evidence.reason !== record.reason ||
    record.supplierAuthorizationStatus !== "APPROVED" ||
    evidence.authorizationNumber !==
      (record.supplierAuthorizationNumber || null) ||
    evidence.authorizationDeadline !== currentDeadline ||
    Date.parse(evidence.destination.arriveBy) <= now.getTime()
  ) {
    return { ...COMPANY_RETURN_DESTINATION };
  }
  return { ...evidence.destination };
}
