export const RETURN_STATUS_VALUES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "RECEIVED",
  "REFUNDED",
] as const;

export const ORDER_ITEM_RETURN_STATUS_BY_RETURN_STATUS = {
  PENDING: "REQUESTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  RECEIVED: "RECEIVED",
  REFUNDED: "REFUNDED",
} as const;

export const RETURN_STATUS_TRANSITIONS = {
  PENDING: ["APPROVED", "REJECTED"],
  APPROVED: ["RECEIVED", "REJECTED"],
  REJECTED: [],
  RECEIVED: ["REFUNDED"],
  REFUNDED: [],
} as const;

export type ReturnLifecycleStatus = (typeof RETURN_STATUS_VALUES)[number];
export type OrderItemReturnLifecycleStatus =
  (typeof ORDER_ITEM_RETURN_STATUS_BY_RETURN_STATUS)[ReturnLifecycleStatus];

export function isReturnLifecycleStatus(
  value: unknown
): value is ReturnLifecycleStatus {
  return (
    typeof value === "string" &&
    (RETURN_STATUS_VALUES as readonly string[]).includes(value)
  );
}

export function getAllowedNextReturnStatuses(
  currentStatus: ReturnLifecycleStatus
): ReturnLifecycleStatus[] {
  return [...(RETURN_STATUS_TRANSITIONS[currentStatus] as readonly ReturnLifecycleStatus[])];
}

export function canTransitionReturnStatus(
  currentStatus: ReturnLifecycleStatus,
  nextStatus: ReturnLifecycleStatus
): boolean {
  if (currentStatus === nextStatus) {
    return true;
  }

  return (
    RETURN_STATUS_TRANSITIONS[currentStatus] as readonly ReturnLifecycleStatus[]
  ).includes(nextStatus);
}

export function mapReturnStatusToOrderItemStatus(
  returnStatus: ReturnLifecycleStatus
): OrderItemReturnLifecycleStatus {
  return ORDER_ITEM_RETURN_STATUS_BY_RETURN_STATUS[returnStatus];
}
