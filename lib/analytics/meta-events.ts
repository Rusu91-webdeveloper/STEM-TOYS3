import { hasMarketingConsent, readCookieConsent } from "./consent";
import type { OrderAnalytics } from "./order-payload";

export interface MetaItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
}

type MetaEventName =
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase";
type PendingEvent = {
  name: MetaEventName;
  parameters: Record<string, unknown>;
  revision: string;
  eventId?: string;
};
const pending: PendingEvent[] = [];
const emittedPurchases = new Set<string>();
let ready = false;

function pixelId() {
  const id = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
  return id && /^\d+$/.test(id) && id !== "123456789012345" ? id : null;
}

function purchaseKey(event: PendingEvent) {
  return event.eventId ? `techtots:meta:${pixelId()}:${event.eventId}` : null;
}

function alreadySent(event: PendingEvent) {
  const key = purchaseKey(event);
  if (!key) return false;
  if (emittedPurchases.has(key)) return true;
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

/** Flush only activity collected under the current advertising choice. */
export function flushMetaEvents() {
  if (typeof window === "undefined") return;
  const choice = readCookieConsent();
  if (!choice?.marketing || !pixelId()) {
    pending.length = 0;
    return;
  }
  if (!ready || typeof window.fbq !== "function") return;
  for (const event of pending.splice(0)) {
    if (event.revision !== choice.revision || alreadySent(event)) continue;
    try {
      // Target the confirmed shop Pixel, even if another Meta Pixel is present.
      window.fbq(
        "trackSingle",
        pixelId(),
        event.name,
        event.parameters,
        event.eventId ? { eventID: event.eventId } : undefined
      );
      const key = purchaseKey(event);
      if (key) {
        emittedPurchases.add(key);
        try {
          sessionStorage.setItem(key, "1");
        } catch {}
      }
    } catch {
      // Tracking must never interrupt cart updates or payment confirmation.
    }
  }
}

/** Called after our Pixel's base code has initialized, not merely any fbq SDK. */
export function markMetaPixelReady() {
  ready = true;
  flushMetaEvents();
}

function track(
  name: MetaEventName,
  items: MetaItem[],
  value: number,
  eventId?: string
) {
  if (typeof window === "undefined" || !hasMarketingConsent() || !pixelId())
    return false;
  if (
    !Number.isFinite(value) ||
    value < 0 ||
    !items.length ||
    items.some(
      item =>
        !item.item_id ||
        !Number.isFinite(item.price) ||
        item.price < 0 ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
    )
  )
    return false;
  const event: PendingEvent = {
    name,
    revision: readCookieConsent()!.revision,
    eventId,
    parameters: {
      content_type: "product",
      content_ids: items.map(item => item.item_id),
      contents: items.map(item => ({
        id: item.item_id,
        quantity: item.quantity,
        item_price: item.price,
      })),
      currency: "RON",
      value: Math.round(value * 100) / 100,
      num_items: items.reduce((sum, item) => sum + item.quantity, 0),
      ...(items.length === 1 ? { content_name: items[0].item_name } : {}),
    },
  };
  flushMetaEvents();
  // Never retain events across withdrawal, expiry or a changed consent revision.
  const revision = event.revision;
  for (let i = pending.length - 1; i >= 0; i--) {
    if (pending[i].revision !== revision) pending.splice(i, 1);
  }
  if (
    alreadySent(event) ||
    (eventId && pending.some(item => item.eventId === eventId))
  )
    return true;
  if (pending.length >= 50) return false;
  pending.push(event);
  flushMetaEvents();
  return true;
}

export function trackMetaProductView(item: MetaItem) {
  return track("ViewContent", [item], item.price);
}

export function trackMetaAddToCart(item: MetaItem) {
  return track("AddToCart", [item], item.price * item.quantity);
}

export function trackMetaCheckout(items: MetaItem[]) {
  return track(
    "InitiateCheckout",
    items,
    items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
}

/** COD collection has no verified browser signal; accepted COD is never Purchase. */
export function trackMetaPurchase(payload: OrderAnalytics) {
  if (
    payload.test_mode ||
    payload.payment_method === "cod" ||
    payload.payment_status !== "PAID" ||
    !payload.transaction_id
  )
    return false;
  return track(
    "Purchase",
    payload.items,
    payload.value,
    `purchase:${payload.transaction_id}`
  );
}
