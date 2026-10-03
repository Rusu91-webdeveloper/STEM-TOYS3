import { readCookieConsent } from "./consent";
import { trackEvent } from "./ga4";
import { trackMetaPurchase } from "./meta-events";
import type { OrderAnalytics } from "./order-payload";

const PENDING_KEY = "techtots:pending-purchase:v1";
const emitted = new Set<string>();

function emitOnce(event: string, payload: OrderAnalytics) {
  const key = `techtots:analytics:${event}:${payload.transaction_id}`;
  if (emitted.has(key)) return;
  try {
    if (sessionStorage.getItem(key)) return;
  } catch {
    /* Storage restrictions must never block checkout. */
  }
  if (!trackEvent(event, { ...payload })) return;
  emitted.add(key);
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    /* In-memory deduplication remains available. */
  }
}

/** A successful create-order response is an accepted order, not proof of a card payment. */
export function trackAcceptedOrder(payload?: OrderAnalytics) {
  if (!payload || payload.test_mode || typeof window === "undefined") return;
  emitOnce("order_placed", payload);
  if (payload.payment_method !== "cod" && payload.payment_status === "PAID") {
    emitOnce("purchase", payload);
    trackMetaPurchase(payload);
  } else if (
    payload.payment_method === "netopia" &&
    payload.payment_status === "PENDING"
  ) {
    const consent = readCookieConsent();
    if (!consent?.analytics && !consent?.marketing) return;
    try {
      sessionStorage.setItem(
        PENDING_KEY,
        JSON.stringify({
          payload,
          analyticsRevision: consent.analytics ? consent.revision : undefined,
          marketingRevision: consent.marketing ? consent.revision : undefined,
        })
      );
    } catch {
      /* Best effort only. */
    }
  }
}

/** The callback URL itself is never proof of payment; require the database-backed status. */
export function trackConfirmedNetopiaPurchase(
  orderId: string,
  result: {
    status?: string;
    source?: string;
    amount?: number;
    currency?: string;
  }
) {
  if (
    typeof window === "undefined" ||
    result.status !== "paid" ||
    result.source !== "database"
  )
    return;
  try {
    const stored = sessionStorage.getItem(PENDING_KEY);
    if (!stored) return;
    const pending = JSON.parse(stored) as {
      payload: OrderAnalytics;
      analyticsRevision?: string;
      marketingRevision?: string;
    };
    const payload = pending.payload;
    if (
      !payload ||
      payload.transaction_id !== orderId ||
      payload.test_mode ||
      payload.payment_method !== "netopia" ||
      payload.order_total !== result.amount ||
      payload.currency !== result.currency
    )
      return;
    const consent = readCookieConsent();
    const paid = { ...payload, payment_status: "PAID" };
    if (consent?.analytics && pending.analyticsRevision === consent.revision) {
      emitOnce("purchase", paid);
    }
    if (consent?.marketing && pending.marketingRevision === consent.revision) {
      trackMetaPurchase(paid);
    }
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* Missing/restricted storage must never affect payment confirmation. */
  }
}
