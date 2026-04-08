type ManualRefundSyncReturn = {
  id: string;
  orderItemId: string;
  status: string;
  refundStatus?: string | null;
};

type ManualRefundSyncPlanInput = {
  orderReturns: ManualRefundSyncReturn[];
  orderTotal: number;
  refundedAmount: number;
  requestedReturnIds?: string[];
};

type ManualRefundSyncPlan =
  | {
      ok: true;
      targetReturns: ManualRefundSyncReturn[];
      alreadyRefundedReturnIds: string[];
      manualReviewRequired: boolean;
      manualReviewReason: string | null;
      source: "request" | "inferred";
    }
  | {
      ok: false;
      error: string;
    };

export function normalizeManualRefundReturnIds(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return [...new Set(
    input
      .filter((value): value is string => typeof value === "string")
      .map(value => value.trim())
      .filter(Boolean)
  )];
}

export function buildManualRefundRequestNote(input: {
  refundRequestId: string;
  refundAmount: number;
  reason?: string | null;
  requestedAt: Date;
  requestedBy?: string | null;
  returnIds?: string[];
}): string {
  const baseParts = [
    `${input.refundRequestId}`,
    `Amount: ${input.refundAmount.toFixed(2)} RON`,
    input.reason || "No reason provided",
    input.requestedAt.toISOString(),
    `Requested by: ${input.requestedBy || "unknown"}`,
  ];

  if (input.returnIds && input.returnIds.length > 0) {
    baseParts.push(`returnIds=${input.returnIds.join(",")}`);
  }

  return `[REFUND_REQUESTED: ${baseParts.join(" - ")}]`;
}

export function buildManualRefundCompletedNote(input: {
  refundId?: string | null;
  refundedAmount: number;
  completedAt: Date;
  completedBy?: string | null;
  syncedReturnIds?: string[];
}): string {
  const baseParts = [
    `${input.refundId || "Manual"}`,
    `Amount: ${input.refundedAmount.toFixed(2)} RON`,
    input.completedAt.toISOString(),
    `Completed by: ${input.completedBy || "unknown"}`,
  ];

  if (input.syncedReturnIds && input.syncedReturnIds.length > 0) {
    baseParts.push(`returnIds=${input.syncedReturnIds.join(",")}`);
  }

  return `[REFUNDED: ${baseParts.join(" - ")}]`;
}

export function extractLatestManualRefundRequestedReturnIds(
  notes?: string | null
): string[] {
  if (!notes) {
    return [];
  }

  const matches = [...notes.matchAll(/\[REFUND_REQUESTED: ([^\]]+)\]/g)];
  const latestMatch = matches.at(-1)?.[1];

  if (!latestMatch) {
    return [];
  }

  const returnIdsMatch = latestMatch.match(/(?:^| - )returnIds=([A-Za-z0-9_,\-]+)/);
  if (!returnIdsMatch?.[1]) {
    return [];
  }

  return normalizeManualRefundReturnIds(returnIdsMatch[1].split(","));
}

export function appendManualRefundResolutionNote(
  existingNote: string | null | undefined,
  nextNote: string
): string {
  const normalizedExistingNote =
    typeof existingNote === "string" ? existingNote.trim() : "";

  if (!normalizedExistingNote) {
    return nextNote;
  }

  if (normalizedExistingNote.includes(nextNote)) {
    return normalizedExistingNote;
  }

  return `${normalizedExistingNote}\n\n${nextNote}`;
}

export function buildManualRefundResolutionNote(input: {
  completedAt: Date;
  refundId?: string | null;
  refundedAmount: number;
}): string {
  return `Manual refund confirmed on ${input.completedAt.toISOString()} (${input.refundId || "Manual"}, ${input.refundedAmount.toFixed(2)} RON).`;
}

export function planManualRefundReturnSync(
  input: ManualRefundSyncPlanInput
): ManualRefundSyncPlan {
  const requestedReturnIds = input.requestedReturnIds || [];
  const source = requestedReturnIds.length > 0 ? "request" : "inferred";

  if (requestedReturnIds.length > 0) {
    const requestedReturns = requestedReturnIds.map(returnId =>
      input.orderReturns.find(returnRecord => returnRecord.id === returnId)
    );

    if (requestedReturns.some(returnRecord => !returnRecord)) {
      return {
        ok: false,
        error:
          "Unele retururi selectate pentru rambursare nu au fost găsite pe această comandă.",
      };
    }

    const nonRefundableReturns = requestedReturns.filter(
      (returnRecord): returnRecord is ManualRefundSyncReturn =>
        Boolean(returnRecord) &&
        !["RECEIVED", "REFUNDED"].includes(returnRecord.status)
    );

    if (nonRefundableReturns.length > 0) {
      return {
        ok: false,
        error:
          "Doar retururile primite pot fi marcate automat ca refundate după confirmarea refundului manual.",
      };
    }

    const materializedReturns = requestedReturns.filter(
      (returnRecord): returnRecord is ManualRefundSyncReturn => Boolean(returnRecord)
    );

    return {
      ok: true,
      targetReturns: materializedReturns.filter(
        returnRecord =>
          returnRecord.status !== "REFUNDED" &&
          returnRecord.refundStatus !== "SUCCESS"
      ),
      alreadyRefundedReturnIds: materializedReturns
        .filter(
          returnRecord =>
            returnRecord.status === "REFUNDED" ||
            returnRecord.refundStatus === "SUCCESS"
        )
        .map(returnRecord => returnRecord.id),
      manualReviewRequired: false,
      manualReviewReason: null,
      source,
    };
  }

  const refundableReturns = input.orderReturns.filter(
    returnRecord =>
      returnRecord.status === "RECEIVED" &&
      returnRecord.refundStatus !== "SUCCESS"
  );

  if (refundableReturns.length === 0) {
    return {
      ok: true,
      targetReturns: [],
      alreadyRefundedReturnIds: input.orderReturns
        .filter(
          returnRecord =>
            returnRecord.status === "REFUNDED" ||
            returnRecord.refundStatus === "SUCCESS"
        )
        .map(returnRecord => returnRecord.id),
      manualReviewRequired: false,
      manualReviewReason: null,
      source,
    };
  }

  if (refundableReturns.length === 1) {
    return {
      ok: true,
      targetReturns: refundableReturns,
      alreadyRefundedReturnIds: [],
      manualReviewRequired: false,
      manualReviewReason: null,
      source,
    };
  }

  if (input.refundedAmount >= input.orderTotal) {
    return {
      ok: true,
      targetReturns: refundableReturns,
      alreadyRefundedReturnIds: [],
      manualReviewRequired: false,
      manualReviewReason: null,
      source,
    };
  }

  return {
    ok: true,
    targetReturns: [],
    alreadyRefundedReturnIds: [],
    manualReviewRequired: true,
    manualReviewReason:
      "Refundul manual este parțial și există mai multe retururi eligibile pe comandă. Retrimite cererea cu returnIds pentru a sincroniza automat retururile corecte.",
    source,
  };
}
