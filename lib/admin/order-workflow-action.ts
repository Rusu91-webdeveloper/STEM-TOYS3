import {
  deriveOrderFulfillmentSummary,
  normalizeSupplierFulfillmentPhase,
} from "@/lib/utils/supplier-fulfillment";

export type AdminOrderActionBucket = "needs_action" | "in_progress" | "done";

export type AdminOrderWorkflowInput = {
  status: string;
  trackingNumber?: string | null;
  manualShippingReviewRequired?: boolean | null;
  items: Array<{
    isDigital?: boolean | null;
  }>;
  shipments?: Array<{
    awbNumber?: string | null;
  }>;
  supplierOrders: Array<{
    id?: string;
    status?: string | null;
    trackingNumber?: string | null;
    supplierOrderId?: string | null;
    supplierId?: string | null;
    shippedAt?: Date | string | null;
  }>;
};

export type AdminOrderWorkflowSummary = {
  actionBucket: AdminOrderActionBucket;
  actionLabel: string;
  hasPhysicalItems: boolean;
  hasTracking: boolean;
  fulfillmentStatus: string;
  supplierOrderCount: number;
};

export function deriveAdminOrderWorkflowSummary(
  order: AdminOrderWorkflowInput
): AdminOrderWorkflowSummary {
  const hasPhysicalItems = order.items.some(item => item.isDigital !== true);
  const phases = order.supplierOrders.map(so => normalizeSupplierFulfillmentPhase(so));
  const fulfillmentSummary =
    order.supplierOrders.length > 0
      ? deriveOrderFulfillmentSummary(order.supplierOrders)
      : null;

  const hasTrackingOnSupplierLines = order.supplierOrders.some(so =>
    Boolean(so.trackingNumber?.trim())
  );
  const hasAwbShipment = (order.shipments?.length || 0) > 0;
  const hasAnyTracking =
    Boolean(order.trackingNumber) || hasAwbShipment || hasTrackingOnSupplierLines;
  const hasTerminalStatus = ["DELIVERED", "COMPLETED", "CANCELLED"].includes(
    order.status
  );
  const hasIssuePhase = phases.some(
    phase => phase === "ISSUE_OOS" || phase === "ISSUE_DELAYED"
  );
  const hasPlacementPhase = phases.some(
    phase => phase === "READY_TO_PLACE" || phase === "PLACED_TO_SUPPLIER"
  );
  const hasAwbPendingPhase = phases.includes("AWB_PENDING");
  const hasAwbUploadedPhase = phases.includes("AWB_UPLOADED");
  const hasShippedPhase = phases.includes("SHIPPED");

  let actionBucket: AdminOrderActionBucket = "in_progress";
  let actionLabel = "Monitor fulfillment";

  if (hasTerminalStatus) {
    actionBucket = "done";
    actionLabel =
      order.status === "CANCELLED" ? "Closed (cancelled)" : "Completed";
  } else if (order.manualShippingReviewRequired) {
    actionBucket = "needs_action";
    actionLabel = "Manual shipping review required";
  } else if (hasPhysicalItems && order.supplierOrders.length === 0) {
    actionBucket = "needs_action";
    actionLabel = "Create supplier lines";
  } else if (hasIssuePhase) {
    actionBucket = "needs_action";
    actionLabel = "Resolve supplier issue";
  } else if (hasTrackingOnSupplierLines && !hasShippedPhase) {
    actionBucket = "needs_action";
    actionLabel = "Set supplier line status after AWB upload";
  } else if (hasAwbUploadedPhase) {
    actionBucket = "needs_action";
    actionLabel = "Mark supplier line as shipped";
  } else if (hasAwbPendingPhase) {
    actionBucket = "needs_action";
    actionLabel = "Upload supplier AWB / tracking";
  } else if (hasPlacementPhase) {
    actionBucket = "needs_action";
    actionLabel = "Place order to supplier";
  } else if (hasShippedPhase || hasAnyTracking) {
    actionBucket = "in_progress";
    actionLabel = "In transit / awaiting delivery";
  } else if (!hasPhysicalItems) {
    actionBucket = "done";
    actionLabel = "Digital / no supplier action";
  }

  return {
    actionBucket,
    actionLabel,
    hasPhysicalItems,
    hasTracking: hasAnyTracking,
    fulfillmentStatus: fulfillmentSummary?.displayStatus || order.status,
    supplierOrderCount: order.supplierOrders.length,
  };
}
