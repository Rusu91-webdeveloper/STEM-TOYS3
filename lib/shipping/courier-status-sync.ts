import type { OrderStatus, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { getFanCourierAwbTracking } from "@/lib/integrations/fancourier/client";
import { samedayRequest } from "@/lib/integrations/sameday/client";
import {
  applyDerivedOrderUpdate,
  syncParentOrderFromSupplierOrders,
} from "@/lib/order-fulfillment-sync";

type NormalizedCourierStatus =
  | "LABEL_CREATED"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "EXCEPTION"
  | "UNKNOWN";

type CourierSyncCandidate = {
  id: string;
  orderId: string;
  courier: string;
  awbNumber: string | null;
  status: string | null;
  payload: Prisma.JsonValue | null;
  order: {
    id: string;
    status: OrderStatus;
    trackingNumber: string | null;
    carrier: string | null;
    shippedAt: Date | null;
    deliveredAt: Date | null;
    paymentMethod: string | null;
    paymentStatus: string | null;
    notes: string | null;
  };
  supplierOrders: Array<{
    id: string;
    status: string;
    trackingNumber: string | null;
    carrier: string | null;
    shippedAt: Date | null;
  }>;
};

type TrackingEvent = {
  code: string | null;
  label: string | null;
  occurredAt: string | null;
  location: string | null;
  raw: Record<string, unknown>;
};

export type CourierTrackingSnapshot = {
  awbNumber: string;
  courier: string;
  normalizedStatus: NormalizedCourierStatus;
  externalStatus: string | null;
  externalCode: string | null;
  latestEvent: TrackingEvent | null;
  delivered: boolean;
  activeTransit: boolean;
  raw: Record<string, unknown>;
};

export type CourierStatusSyncResult = {
  scanned: number;
  changed: number;
  skipped: number;
  errors: Array<{ shipmentId: string; awbNumber: string | null; error: string }>;
  updates: Array<{
    shipmentId: string;
    orderId: string;
    awbNumber: string;
    courier: string;
    fromStatus: string | null;
    toStatus: NormalizedCourierStatus;
    externalStatus: string | null;
  }>;
};

const TERMINAL_ORDER_STATUSES = new Set<OrderStatus>(["DELIVERED", "COMPLETED", "CANCELLED"]);
const TERMINAL_SUPPLIER_STATUSES = new Set(["DELIVERED", "REFUNDED", "CANCELLED"]);

function toUpper(value?: string | null) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

export function normalizeCourierName(value?: string | null): "FANCOURIER" | "SAMEDAY" | "UNKNOWN" {
  const normalized = toUpper(value);
  if (normalized === "FANCOURIER" || normalized === "FAN COURIER") return "FANCOURIER";
  if (normalized === "SAMEDAY" || normalized === "SAME DAY") return "SAMEDAY";
  return "UNKNOWN";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function normalizeIsoDate(value: unknown): string | null {
  const text = toStringOrNull(value);
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function getStatusTextParts(event: TrackingEvent | null): string[] {
  if (!event) return [];
  return [event.label, event.code].filter((part): part is string => Boolean(part));
}

export function normalizeTrackingStatus(input: {
  statusText?: string | null;
  statusCode?: string | null;
}): NormalizedCourierStatus {
  const text = toUpper(input.statusText);
  const code = toUpper(input.statusCode);
  const haystack = `${text} ${code}`.trim();

  if (!haystack) return "UNKNOWN";

  if (
    [
      "DELIVERED",
      "LIVRAT",
      "PREDAT DESTINATAR",
      "PREDAT CĂTRE DESTINATAR",
      "COMPLETED DELIVERY",
    ].some(keyword => haystack.includes(keyword))
  ) {
    return "DELIVERED";
  }

  if (
    [
      "OUT FOR DELIVERY",
      "IN LIVRARE",
      "COURIER ROUTE",
      "S1",
      "C1",
    ].some(keyword => haystack.includes(keyword))
  ) {
    return "OUT_FOR_DELIVERY";
  }

  if (
    [
      "REFUZ",
      "RETURN",
      "RETUR",
      "RTO",
      "CANCEL",
      "ANULAT",
      "FAILED DELIVERY",
      "NEPRELUAT",
      "EXCEPTION",
      "INCORRECT",
    ].some(keyword => haystack.includes(keyword))
  ) {
    return "EXCEPTION";
  }

  if (
    [
      "IN TRANSIT",
      "IN_TRANSIT",
      "TRANZIT",
      "PRELUAT",
      "PICKED UP",
      "RIDICAT",
      "DEPOSIT",
      "HUB",
      "SORTAT",
      "SCANAT",
      "EXPEDIAT",
      "PREDAT",
      "PREDAT CURIERULUI",
      "DISPATCHED",
    ].some(keyword => haystack.includes(keyword))
  ) {
    return "IN_TRANSIT";
  }

  if (
    [
      "CREATED",
      "AWB",
      "EMIS",
      "GENERATED",
      "PREGATIT",
      "PREGĂTIT",
      "LABEL",
    ].some(keyword => haystack.includes(keyword))
  ) {
    return "LABEL_CREATED";
  }

  return "UNKNOWN";
}

function extractEvents(entry: Record<string, unknown>): TrackingEvent[] {
  const eventArrays = [
    ...asArray(entry.events),
    ...asArray(entry.history),
    ...asArray(entry.tracking),
    ...asArray(entry.statuses),
    ...asArray(entry.awbTracking),
    ...asArray(entry.awbTrackingHistory),
  ];

  if (eventArrays.length === 0) return [];

  return eventArrays
    .map(asRecord)
    .filter((event): event is Record<string, unknown> => Boolean(event))
    .map(event => ({
      code:
        toStringOrNull(event.code) ||
        toStringOrNull(event.statusCode) ||
        toStringOrNull(event.eventCode) ||
        toStringOrNull(event.tip),
      label:
        toStringOrNull(event.status) ||
        toStringOrNull(event.name) ||
        toStringOrNull(event.description) ||
        toStringOrNull(event.event) ||
        toStringOrNull(event.eveniment),
      occurredAt:
        normalizeIsoDate(event.date) ||
        normalizeIsoDate(event.timestamp) ||
        normalizeIsoDate(event.createdAt) ||
        normalizeIsoDate(event.eventDate),
      location:
        toStringOrNull(event.location) ||
        toStringOrNull(event.locality) ||
        toStringOrNull(event.depot) ||
        toStringOrNull(event.hub),
      raw: event,
    }))
    .sort((a, b) => {
      if (!a.occurredAt || !b.occurredAt) return 0;
      return a.occurredAt.localeCompare(b.occurredAt);
    });
}

function extractPrimaryTrackingEntry(response: Record<string, unknown>): Record<string, unknown> {
  const nestedData = asRecord(response.data);
  const candidates = [
    ...asArray(response.shipments),
    ...asArray(response.results),
    ...asArray(response.awbs),
    ...asArray(response.data),
    ...asArray(nestedData?.shipments),
    ...asArray(nestedData?.results),
    ...asArray(nestedData?.awbs),
  ]
    .map(asRecord)
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));

  return candidates[0] || response;
}

function parseTrackingSnapshot(params: {
  awbNumber: string;
  courier: "FANCOURIER" | "SAMEDAY";
  response: Record<string, unknown>;
}): CourierTrackingSnapshot {
  const entry = extractPrimaryTrackingEntry(params.response);
  const events = extractEvents(entry);
  const latestEvent = events.at(-1) || null;
  const externalStatus =
    toStringOrNull(entry.status) ||
    toStringOrNull(entry.currentStatus) ||
    toStringOrNull(entry.statusText) ||
    latestEvent?.label ||
    null;
  const externalCode =
    toStringOrNull(entry.statusCode) ||
    toStringOrNull(entry.code) ||
    latestEvent?.code ||
    null;
  const normalizedStatus = normalizeTrackingStatus({
    statusText: externalStatus || getStatusTextParts(latestEvent).join(" "),
    statusCode: externalCode,
  });

  return {
    awbNumber: params.awbNumber,
    courier: params.courier,
    normalizedStatus,
    externalStatus,
    externalCode,
    latestEvent,
    delivered: normalizedStatus === "DELIVERED",
    activeTransit:
      normalizedStatus === "IN_TRANSIT" ||
      normalizedStatus === "OUT_FOR_DELIVERY" ||
      normalizedStatus === "DELIVERED",
    raw: params.response,
  };
}

async function fetchFanCourierSnapshot(awbNumber: string) {
  const response = await getFanCourierAwbTracking({ awbNumber, language: "ro" });
  return parseTrackingSnapshot({
    awbNumber,
    courier: "FANCOURIER",
    response,
  });
}

function resolveSamedayTrackingPath(awbNumber: string) {
  const template =
    process.env.SAMEDAY_TRACKING_PATH || process.env.SAMEDAY_AWB_STATUS_PATH;

  if (!template) {
    return null;
  }

  return template
    .replaceAll("{awbNumber}", encodeURIComponent(awbNumber))
    .replaceAll(":awbNumber", encodeURIComponent(awbNumber));
}

async function fetchSamedaySnapshot(awbNumber: string) {
  const path = resolveSamedayTrackingPath(awbNumber);
  if (!path) {
    return null;
  }

  const response = await samedayRequest(path, { method: "GET" });
  return parseTrackingSnapshot({
    awbNumber,
    courier: "SAMEDAY",
    response,
  });
}

async function fetchCourierSnapshot(candidate: CourierSyncCandidate) {
  const awbNumber = candidate.awbNumber?.trim();
  if (!awbNumber) return null;

  const courier = normalizeCourierName(candidate.courier);
  if (courier === "FANCOURIER") {
    return fetchFanCourierSnapshot(awbNumber);
  }
  if (courier === "SAMEDAY") {
    return fetchSamedaySnapshot(awbNumber);
  }
  return null;
}

function deriveNextSupplierStatus(snapshot: CourierTrackingSnapshot): string | null {
  if (snapshot.normalizedStatus === "DELIVERED") return "DELIVERED";
  if (
    snapshot.normalizedStatus === "IN_TRANSIT" ||
    snapshot.normalizedStatus === "OUT_FOR_DELIVERY"
  ) {
    return "SHIPPED";
  }
  return null;
}

function deriveNextOrderStatus(snapshot: CourierTrackingSnapshot): OrderStatus | null {
  if (snapshot.normalizedStatus === "DELIVERED") return "DELIVERED";
  if (
    snapshot.normalizedStatus === "IN_TRANSIT" ||
    snapshot.normalizedStatus === "OUT_FOR_DELIVERY"
  ) {
    return "SHIPPED";
  }
  return null;
}

function jsonClone(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

async function syncSupplierOrdersForShipment(
  candidate: CourierSyncCandidate,
  snapshot: CourierTrackingSnapshot
) {
  const nextStatus = deriveNextSupplierStatus(snapshot);
  if (!nextStatus) return;

  const relevantSupplierOrders = candidate.supplierOrders.filter(order => {
    if (TERMINAL_SUPPLIER_STATUSES.has(toUpper(order.status))) {
      return false;
    }
    if (order.trackingNumber?.trim() === snapshot.awbNumber) {
      return true;
    }
    return false;
  });

  if (relevantSupplierOrders.length === 0) {
    return;
  }

  const targetIds = relevantSupplierOrders
    .filter(order => {
      const currentStatus = toUpper(order.status);
      if (nextStatus === "SHIPPED") {
        return !["SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(
          currentStatus
        );
      }
      return currentStatus !== "DELIVERED";
    })
    .map(order => order.id);

  if (targetIds.length === 0) {
    return;
  }

  await db.supplierOrder.updateMany({
    where: { id: { in: targetIds } },
    data: {
      status: nextStatus,
      carrier: snapshot.courier,
      ...(nextStatus === "SHIPPED" ? { shippedAt: new Date() } : {}),
    },
  });

  await syncParentOrderFromSupplierOrders(candidate.orderId, "courier-status-sync");
}

async function syncOrderWithoutSupplierOrders(
  candidate: CourierSyncCandidate,
  snapshot: CourierTrackingSnapshot
) {
  if (candidate.supplierOrders.length > 0) return;
  const nextStatus = deriveNextOrderStatus(snapshot);
  if (!nextStatus) return;
  if (TERMINAL_ORDER_STATUSES.has(candidate.order.status)) return;

  await applyDerivedOrderUpdate({
    order: candidate.order,
    nextStatus,
    reason: "Status updated from courier tracking sync",
    notes: `Courier=${snapshot.courier}; awb=${snapshot.awbNumber}; externalStatus=${snapshot.externalStatus || "n/a"}`,
    trackingNumber: snapshot.awbNumber,
    carrier: snapshot.courier,
  });
}

async function persistShipmentSnapshot(
  candidate: CourierSyncCandidate,
  snapshot: CourierTrackingSnapshot
) {
  const previousStatus = candidate.status;
  const normalizedStatusChanged = toUpper(previousStatus) !== snapshot.normalizedStatus;

  if (!normalizedStatusChanged) {
    return false;
  }

  const payload = {
    previous: candidate.payload,
    latestTrackingSync: {
      synchronizedAt: new Date().toISOString(),
      normalizedStatus: snapshot.normalizedStatus,
      externalStatus: snapshot.externalStatus,
      externalCode: snapshot.externalCode,
      latestEvent: snapshot.latestEvent,
      courier: snapshot.courier,
    },
  };

  await db.shipment.update({
    where: { id: candidate.id },
    data: {
      status: snapshot.normalizedStatus,
      payload: jsonClone(payload),
    },
  });

  await db.awbEvent.create({
    data: {
      shipmentId: candidate.id,
      eventType: "SYNC_TRACKING_STATUS",
      requestJson: jsonClone({
        courier: snapshot.courier,
        awbNumber: snapshot.awbNumber,
      }),
      responseJson: jsonClone({
        normalizedStatus: snapshot.normalizedStatus,
        externalStatus: snapshot.externalStatus,
        externalCode: snapshot.externalCode,
        latestEvent: snapshot.latestEvent,
        raw: snapshot.raw,
      }),
    },
  });

  await syncSupplierOrdersForShipment(candidate, snapshot);
  await syncOrderWithoutSupplierOrders(candidate, snapshot);

  return true;
}

export async function syncCourierTrackingStatuses(input?: {
  orderId?: string;
  limit?: number;
}): Promise<CourierStatusSyncResult> {
  const limit = Math.min(Math.max(input?.limit ?? 25, 1), 100);
  const candidates = await db.shipment.findMany({
    where: {
      awbNumber: { not: null },
      order: {
        ...(input?.orderId ? { id: input.orderId } : {}),
        status: {
          notIn: ["DELIVERED", "COMPLETED", "CANCELLED"],
        },
      },
    },
    take: limit,
    orderBy: { updatedAt: "asc" },
    include: {
      order: {
        select: {
          id: true,
          status: true,
          trackingNumber: true,
          carrier: true,
          shippedAt: true,
          deliveredAt: true,
          paymentMethod: true,
          paymentStatus: true,
          notes: true,
        },
      },
    },
  });

  const orderIds = Array.from(new Set(candidates.map(candidate => candidate.orderId)));
  const supplierOrders = orderIds.length
    ? await db.supplierOrder.findMany({
        where: { orderId: { in: orderIds } },
        select: {
          id: true,
          orderId: true,
          status: true,
          trackingNumber: true,
          carrier: true,
          shippedAt: true,
        },
      })
    : [];
  const supplierOrdersByOrderId = new Map<string, typeof supplierOrders>();

  for (const supplierOrder of supplierOrders) {
    const bucket = supplierOrdersByOrderId.get(supplierOrder.orderId) ?? [];
    bucket.push(supplierOrder);
    supplierOrdersByOrderId.set(supplierOrder.orderId, bucket);
  }

  const result: CourierStatusSyncResult = {
    scanned: candidates.length,
    changed: 0,
    skipped: 0,
    errors: [],
    updates: [],
  };

  for (const candidate of candidates) {
    const enrichedCandidate: CourierSyncCandidate = {
      ...candidate,
      supplierOrders: supplierOrdersByOrderId.get(candidate.orderId) || [],
    };

    try {
      const snapshot = await fetchCourierSnapshot(enrichedCandidate);
      if (!snapshot) {
        result.skipped += 1;
        continue;
      }

      const changed = await persistShipmentSnapshot(enrichedCandidate, snapshot);
      if (!changed) {
        result.skipped += 1;
        continue;
      }

      result.changed += 1;
      result.updates.push({
        shipmentId: candidate.id,
        orderId: candidate.orderId,
        awbNumber: snapshot.awbNumber,
        courier: snapshot.courier,
        fromStatus: candidate.status,
        toStatus: snapshot.normalizedStatus,
        externalStatus: snapshot.externalStatus,
      });
    } catch (error) {
      result.errors.push({
        shipmentId: candidate.id,
        awbNumber: candidate.awbNumber,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return result;
}
