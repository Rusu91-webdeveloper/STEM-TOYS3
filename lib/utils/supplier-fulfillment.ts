export type SupplierFulfillmentPhase =
  | "READY_TO_PLACE"
  | "PLACED_TO_SUPPLIER"
  | "AWB_PENDING"
  | "AWB_UPLOADED"
  | "SHIPPED"
  | "DELIVERED"
  | "ISSUE_OOS"
  | "ISSUE_DELAYED"
  | "CANCELLED"
  | "REFUNDED"
  | "UNKNOWN";

export type DerivedOrderDbStatus =
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type DerivedOrderFulfillmentDisplayStatus =
  | "PROCESSING"
  | "PARTIALLY_SHIPPED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "ISSUE";

export interface SupplierOrderStatusInput {
  status?: string | null;
  trackingNumber?: string | null;
  shippedAt?: Date | string | null;
  supplierOrderId?: string | null;
}

export interface SupplierOrderLike extends SupplierOrderStatusInput {
  id?: string;
  orderId?: string;
  supplierId?: string | null;
  quantity?: number | null;
  supplier?: {
    id?: string;
    name?: string | null;
    companyName?: string | null;
  } | null;
  product?: {
    id?: string;
    name?: string | null;
    sku?: string | null;
  } | null;
}

export interface SupplierFulfillmentSummary {
  total: number;
  byPhase: Record<SupplierFulfillmentPhase, number>;
  hasMixedSuppliers: boolean;
  supplierCount: number;
  hasIssues: boolean;
  hasPendingPlacement: boolean;
  hasActiveShipment: boolean;
  hasDeliveredLines: boolean;
  allTerminal: boolean;
  allCancelledOrRefunded: boolean;
  dbOrderStatus: DerivedOrderDbStatus;
  displayStatus: DerivedOrderFulfillmentDisplayStatus;
}

export interface SupplierShipmentTaskGroup {
  key: string;
  supplierId: string | null;
  supplierName: string;
  lineCount: number;
  totalQuantity: number;
  displayStatus: DerivedOrderFulfillmentDisplayStatus;
  dbOrderStatus: DerivedOrderDbStatus;
  phases: SupplierFulfillmentPhase[];
  trackingNumbers: string[];
  lines: Array<{
    supplierOrderId: string | undefined;
    lineStatus: string | null | undefined;
    phase: SupplierFulfillmentPhase;
    productName: string | null;
    productSku: string | null;
    quantity: number;
    trackingNumber: string | null;
  }>;
}

const EMPTY_PHASE_COUNTS: Record<SupplierFulfillmentPhase, number> = {
  READY_TO_PLACE: 0,
  PLACED_TO_SUPPLIER: 0,
  AWB_PENDING: 0,
  AWB_UPLOADED: 0,
  SHIPPED: 0,
  DELIVERED: 0,
  ISSUE_OOS: 0,
  ISSUE_DELAYED: 0,
  CANCELLED: 0,
  REFUNDED: 0,
  UNKNOWN: 0,
};

function upper(value?: string | null) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

export function normalizeSupplierFulfillmentPhase(
  input: SupplierOrderStatusInput
): SupplierFulfillmentPhase {
  const raw = upper(input.status);

  if (!raw) {
    return "UNKNOWN";
  }

  if (raw === "READY_TO_PLACE") return "READY_TO_PLACE";
  if (raw === "PLACED_TO_SUPPLIER") return "PLACED_TO_SUPPLIER";
  if (raw === "AWB_PENDING") return "AWB_PENDING";
  if (raw === "AWB_UPLOADED") return "AWB_UPLOADED";
  if (raw === "SHIPPED" || raw === "IN_TRANSIT" || raw === "OUT_FOR_DELIVERY") {
    return "SHIPPED";
  }
  if (raw === "DELIVERED" || raw === "COMPLETED") return "DELIVERED";
  if (raw === "ISSUE_OOS") return "ISSUE_OOS";
  if (raw === "ISSUE_DELAYED") return "ISSUE_DELAYED";
  if (raw === "CANCELLED") return "CANCELLED";
  if (raw === "REFUNDED") return "REFUNDED";

  // Backward-compatible mapping from the existing supplier workflow statuses.
  if (raw === "PENDING") {
    if (input.supplierOrderId) return "PLACED_TO_SUPPLIER";
    return "READY_TO_PLACE";
  }
  if (raw === "CONFIRMED" || raw === "IN_PRODUCTION") {
    return "PLACED_TO_SUPPLIER";
  }
  if (raw === "READY_TO_SHIP") {
    return input.trackingNumber ? "AWB_UPLOADED" : "AWB_PENDING";
  }

  if (raw.includes("OOS") || raw.includes("OUT_OF_STOCK")) return "ISSUE_OOS";
  if (raw.includes("DELAY")) return "ISSUE_DELAYED";

  return "UNKNOWN";
}

export function deriveOrderFulfillmentSummary(
  supplierOrders: SupplierOrderLike[]
): SupplierFulfillmentSummary {
  const byPhase = { ...EMPTY_PHASE_COUNTS };
  const supplierIds = new Set<string>();

  for (const order of supplierOrders) {
    if (order.supplierId) supplierIds.add(order.supplierId);
    const phase = normalizeSupplierFulfillmentPhase(order);
    byPhase[phase] += 1;
  }

  const total = supplierOrders.length;
  const shippedOrDelivered = byPhase.SHIPPED + byPhase.DELIVERED;
  const pendingPlacement =
    byPhase.READY_TO_PLACE +
    byPhase.PLACED_TO_SUPPLIER +
    byPhase.AWB_PENDING +
    byPhase.AWB_UPLOADED +
    byPhase.UNKNOWN;
  const issueCount = byPhase.ISSUE_OOS + byPhase.ISSUE_DELAYED;
  const terminalCount = byPhase.DELIVERED + byPhase.CANCELLED + byPhase.REFUNDED;
  const allCancelledOrRefunded = total > 0 && terminalCount === total && byPhase.DELIVERED === 0;
  const allTerminal = total > 0 && terminalCount === total;
  const hasDeliveredLines = byPhase.DELIVERED > 0;
  const hasActiveShipment = shippedOrDelivered > 0;
  const hasIssues = issueCount > 0;

  let dbOrderStatus: DerivedOrderDbStatus = "PROCESSING";
  let displayStatus: DerivedOrderFulfillmentDisplayStatus = "PROCESSING";

  if (total === 0) {
    dbOrderStatus = "PROCESSING";
    displayStatus = "PROCESSING";
  } else if (allCancelledOrRefunded) {
    dbOrderStatus = "CANCELLED";
    displayStatus = "CANCELLED";
  } else if (allTerminal && byPhase.DELIVERED > 0) {
    dbOrderStatus = "DELIVERED";
    displayStatus = "DELIVERED";
  } else if (hasActiveShipment) {
    dbOrderStatus = "SHIPPED";
    displayStatus = pendingPlacement > 0 || hasIssues ? "PARTIALLY_SHIPPED" : "SHIPPED";
  } else if (hasIssues) {
    dbOrderStatus = "PROCESSING";
    displayStatus = "ISSUE";
  } else {
    dbOrderStatus = "PROCESSING";
    displayStatus = "PROCESSING";
  }

  return {
    total,
    byPhase,
    hasMixedSuppliers: supplierIds.size > 1,
    supplierCount: supplierIds.size,
    hasIssues,
    hasPendingPlacement: pendingPlacement > 0,
    hasActiveShipment,
    hasDeliveredLines,
    allTerminal,
    allCancelledOrRefunded,
    dbOrderStatus,
    displayStatus,
  };
}

export function groupSupplierOrdersForOperations(
  supplierOrders: SupplierOrderLike[]
): SupplierShipmentTaskGroup[] {
  const groups = new Map<string, SupplierOrderLike[]>();

  for (const line of supplierOrders) {
    const key = line.supplierId || "unknown-supplier";
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(line);
  }

  return Array.from(groups.entries()).map(([key, lines]) => {
    const summary = deriveOrderFulfillmentSummary(lines);
    const supplierName =
      lines[0]?.supplier?.name ||
      lines[0]?.supplier?.companyName ||
      (key === "unknown-supplier" ? "Unknown supplier" : key);

    const trackingNumbers = Array.from(
      new Set(
        lines
          .map(line => line.trackingNumber?.trim())
          .filter((value): value is string => Boolean(value))
      )
    );

    return {
      key,
      supplierId: lines[0]?.supplierId ?? null,
      supplierName,
      lineCount: lines.length,
      totalQuantity: lines.reduce((sum, line) => sum + (line.quantity || 0), 0),
      displayStatus: summary.displayStatus,
      dbOrderStatus: summary.dbOrderStatus,
      phases: lines.map(line => normalizeSupplierFulfillmentPhase(line)),
      trackingNumbers,
      lines: lines.map(line => ({
        supplierOrderId: line.id,
        lineStatus: line.status,
        phase: normalizeSupplierFulfillmentPhase(line),
        productName: line.product?.name || null,
        productSku: line.product?.sku || null,
        quantity: line.quantity || 0,
        trackingNumber: line.trackingNumber || null,
      })),
    };
  });
}
