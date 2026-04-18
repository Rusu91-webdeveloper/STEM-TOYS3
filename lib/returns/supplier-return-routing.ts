const SUPPLIER_AUTH_SLA_HOURS = 48;

type SupplierLike = {
  id?: string | null;
  name?: string | null;
  companyName?: string | null;
  contactPersonEmail?: string | null;
  email?: string | null;
};

type ProductLike = {
  id?: string | null;
  supplierId?: string | null;
  supplier?: SupplierLike | null;
};

type ReturnLike = {
  reason?: string | null;
  supplierAuthorizationStatus?: string | null;
  supplierAuthorizationDeadline?: Date | string | null;
  supplierAuthorizationRequestedAt?: Date | string | null;
  supplierAuthorizationNumber?: string | null;
  supplierAuthorizationNotes?: string | null;
};

export type ReturnRoutingChannel = "SUPPLIER_AUTH" | "INTERNAL" | "COURIER_CLAIM";

export interface SupplierReturnRouting {
  hasSupplier: boolean;
  supplierId: string | null;
  supplierName: string | null;
  supplierEmail: string | null;
  requiresSupplierAuthorization: boolean;
  recommendedChannel: ReturnRoutingChannel;
  isCourierClaimCandidate: boolean;
  supplierAuthorizationStatus: string | null;
  supplierAuthorizationDeadline: string | null;
  supplierAuthorizationRequestedAt: string | null;
  supplierAuthorizationNumber: string | null;
  supplierAuthorizationNotes: string | null;
}

const toIso = (value?: Date | string | null): string | null => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

export function isCourierClaimReason(reason?: string | null): boolean {
  const normalized = String(reason || "").toUpperCase();
  return normalized === "DAMAGED_IN_TRANSIT";
}

export function shouldRequireSupplierAuthorization(product?: ProductLike | null): boolean {
  return Boolean(product?.supplierId || product?.supplier?.id);
}

export function calculateSupplierAuthorizationDeadline(from = new Date()): Date {
  return new Date(from.getTime() + SUPPLIER_AUTH_SLA_HOURS * 60 * 60 * 1000);
}

export function buildInitialSupplierAuthorizationFields(input: {
  product?: ProductLike | null;
  reason?: string | null;
}) {
  const supplierName =
    input.product?.supplier?.name ||
    input.product?.supplier?.companyName ||
    null;
  const requiresSupplierAuthorization = shouldRequireSupplierAuthorization(
    input.product
  );

  if (!requiresSupplierAuthorization) {
    return {
      supplierAuthorizationStatus: null,
      supplierAuthorizationDeadline: null,
      supplierAuthorizationRequestedAt: null,
      supplierAuthorizationNotes: "Internal return workflow (no supplier authorization required).",
    };
  }

  const deadline = calculateSupplierAuthorizationDeadline();
  const courierClaim = isCourierClaimReason(input.reason);
  const noteParts = [
    supplierName ? `Supplier: ${supplierName}` : null,
    "Supplier authorization pending.",
    courierClaim ? "Courier claim may also be required (check packaging photos)." : null,
  ].filter(Boolean);

  return {
    supplierAuthorizationStatus: "PENDING" as const,
    supplierAuthorizationDeadline: deadline,
    supplierAuthorizationRequestedAt: null,
    supplierAuthorizationNotes: noteParts.join(" "),
  };
}

export function deriveSupplierReturnRouting(input: {
  product?: ProductLike | null;
  returnRecord?: ReturnLike | null;
  reason?: string | null;
}): SupplierReturnRouting {
  const supplier = input.product?.supplier || null;
  const supplierId = input.product?.supplierId || supplier?.id || null;
  const hasSupplier = Boolean(supplierId);
  const supplierName = supplier?.name || supplier?.companyName || null;
  const supplierEmail = supplier?.contactPersonEmail || supplier?.email || null;
  const reason = input.returnRecord?.reason || input.reason || null;
  const isCourierClaimCandidate = isCourierClaimReason(reason);
  const requiresSupplierAuthorization = shouldRequireSupplierAuthorization(
    input.product
  );

  let recommendedChannel: ReturnRoutingChannel = "INTERNAL";
  if (isCourierClaimCandidate) {
    recommendedChannel = "COURIER_CLAIM";
  }
  if (requiresSupplierAuthorization) {
    recommendedChannel = "SUPPLIER_AUTH";
  }

  return {
    hasSupplier,
    supplierId,
    supplierName,
    supplierEmail,
    requiresSupplierAuthorization,
    recommendedChannel,
    isCourierClaimCandidate,
    supplierAuthorizationStatus:
      input.returnRecord?.supplierAuthorizationStatus || null,
    supplierAuthorizationDeadline: toIso(
      input.returnRecord?.supplierAuthorizationDeadline
    ),
    supplierAuthorizationRequestedAt: toIso(
      input.returnRecord?.supplierAuthorizationRequestedAt
    ),
    supplierAuthorizationNumber:
      input.returnRecord?.supplierAuthorizationNumber || null,
    supplierAuthorizationNotes:
      input.returnRecord?.supplierAuthorizationNotes || null,
  };
}
