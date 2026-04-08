import type { OrderItemReturnStatus, ReturnStatus } from "@prisma/client";

import { mapReturnStatusToOrderItemStatus } from "@/lib/returns/status-machine";

export const ACTIVE_RETURN_STATUSES = [
  "PENDING",
  "APPROVED",
  "RECEIVED",
] as const satisfies readonly ReturnStatus[];

const ACTIVE_RETURN_STATUS_PRIORITY: Record<
  (typeof ACTIVE_RETURN_STATUSES)[number],
  number
> = {
  PENDING: 1,
  APPROVED: 2,
  RECEIVED: 3,
};

export type ActiveReturnStatus = (typeof ACTIVE_RETURN_STATUSES)[number];

export type DuplicateActiveReturnRecord = {
  id: string;
  orderItemId: string;
  orderId: string;
  userId: string;
  status: ActiveReturnStatus;
  createdAt: Date;
  updatedAt: Date;
  supplierAuthorizationStatus?: string | null;
  resolutionStatus?: string | null;
  resolutionNotes?: string | null;
};

export type DuplicateActiveReturnGroup = {
  orderItemId: string;
  activeReturns: DuplicateActiveReturnRecord[];
};

export function isActiveReturnStatus(
  status: ReturnStatus
): status is ActiveReturnStatus {
  return (ACTIVE_RETURN_STATUSES as readonly ReturnStatus[]).includes(status);
}

export function pickDuplicateActiveReturnKeeper(
  activeReturns: DuplicateActiveReturnRecord[]
): DuplicateActiveReturnRecord {
  if (activeReturns.length === 0) {
    throw new Error("Cannot pick a keeper from an empty active return set.");
  }

  return [...activeReturns].sort((left, right) => {
    const statusPriorityDiff =
      ACTIVE_RETURN_STATUS_PRIORITY[right.status] -
      ACTIVE_RETURN_STATUS_PRIORITY[left.status];
    if (statusPriorityDiff !== 0) {
      return statusPriorityDiff;
    }

    const updatedAtDiff = right.updatedAt.getTime() - left.updatedAt.getTime();
    if (updatedAtDiff !== 0) {
      return updatedAtDiff;
    }

    const createdAtDiff = right.createdAt.getTime() - left.createdAt.getTime();
    if (createdAtDiff !== 0) {
      return createdAtDiff;
    }

    return right.id.localeCompare(left.id);
  })[0];
}

export function getDuplicateActiveReturnLosers(
  activeReturns: DuplicateActiveReturnRecord[],
  keeperId: string
): DuplicateActiveReturnRecord[] {
  return activeReturns.filter(activeReturn => activeReturn.id !== keeperId);
}

export function mapKeeperToOrderItemReturnStatus(
  keeper: DuplicateActiveReturnRecord
): OrderItemReturnStatus {
  return mapReturnStatusToOrderItemStatus(keeper.status) as OrderItemReturnStatus;
}

export function buildDuplicateCleanupResolutionNote(input: {
  keeper: DuplicateActiveReturnRecord;
  duplicate: DuplicateActiveReturnRecord;
  executedAt: Date;
}): string {
  const executedAtIso = input.executedAt.toISOString();

  return [
    `Closed by duplicate active return cleanup on ${executedAtIso}.`,
    `Superseded by return ${input.keeper.id} (${input.keeper.status}).`,
    `This record had duplicate active status ${input.duplicate.status} for order item ${input.duplicate.orderItemId}.`,
  ].join(" ");
}

export function appendResolutionNote(
  existingNote: string | null | undefined,
  cleanupNote: string
): string {
  const normalizedExistingNote =
    typeof existingNote === "string" ? existingNote.trim() : "";

  if (!normalizedExistingNote) {
    return cleanupNote;
  }

  if (normalizedExistingNote.includes(cleanupNote)) {
    return normalizedExistingNote;
  }

  return `${normalizedExistingNote}\n\n${cleanupNote}`;
}
