/**
 * FAN Courier AWB Creation
 *
 * Creates AWB (Air Way Bill) for orders using FAN Courier API.
 * Mirrors the architecture of sameday-awb.ts for consistency.
 */

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import {
  createFanCourierAwb,
  createFanCourierPickupOrder,
  hasExtraKmOrRemoteLocality,
  getFanCourierAwbLabel,
  getFanCourierClientId,
  isFanCourierConfigured,
  normalizeFanCourierCountyName,
} from "@/lib/integrations/fancourier/client";
import type {
  FanCourierAwbPayload,
  FanCourierServiceType,
} from "@/lib/integrations/fancourier/types";
import type { FanCourierSenderConfig } from "@/lib/integrations/fancourier/types";
import { getFanCourierSenderConfig } from "@/lib/integrations/fancourier/types";
import { extractDimensionsCm } from "@/lib/shipping/shipping-pricing";
import { getShippingSettings } from "@/lib/utils/store-settings";
import { sendSupplierAwbLabelEmail } from "@/lib/email/supplier-awb";

const COURIER_NAME = "FANCOURIER";
const isSupplierAwbEmailDisabled = () =>
  process.env.DISABLE_SUPPLIER_AWB_EMAIL === "true";

/**
 * Extract AWB number from various FAN Courier response formats
 */
const toAwbString = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  return null;
};

const extractAwbNumber = (response: Record<string, unknown>): string | null => {
  const data = response.data as Record<string, unknown> | undefined;
  const shipments = response.shipments as
    | Array<Record<string, unknown>>
    | undefined;
  const responseEntries = Array.isArray(response.response)
    ? (response.response as Array<Record<string, unknown>>)
    : undefined;
  const dataResponseEntries = Array.isArray(data?.response)
    ? (data?.response as Array<Record<string, unknown>>)
    : undefined;

  return (
    toAwbString(response.awbNumber) ||
    toAwbString(response.awb_number) ||
    toAwbString(response.awb) ||
    toAwbString(data?.awbNumber) ||
    toAwbString(data?.awb_number) ||
    toAwbString(data?.awb) ||
    toAwbString(Array.isArray(data?.awbs) ? data?.awbs[0] : undefined) ||
    toAwbString(shipments?.[0]?.awb) ||
    toAwbString(shipments?.[0]?.awbNumber) ||
    toAwbString(responseEntries?.[0]?.awbNumber) ||
    toAwbString(responseEntries?.[0]?.awb) ||
    toAwbString(dataResponseEntries?.[0]?.awbNumber) ||
    toAwbString(dataResponseEntries?.[0]?.awb) ||
    null
  );
};

/**
 * Redact sensitive data from payload for logging
 */
const redactPayload = (
  payload: Record<string, unknown>
): Record<string, unknown> => {
  const redacted = { ...payload };
  if ("password" in redacted) redacted.password = "***";
  if ("token" in redacted) redacted.token = "***";
  if ("access_token" in redacted) redacted.access_token = "***";
  return redacted;
};

/**
 * Build AWB payload for FAN Courier API
 */
const resolveFanCourierService = (
  methodId?: string | null,
  pickupLocation?: string | null
): FanCourierServiceType => {
  const normalized = methodId?.includes(":")
    ? methodId.split(":")[1]?.toLowerCase().trim()
    : methodId?.toLowerCase().trim();
  const wantsFanbox =
    normalized === "easybox" ||
    normalized === "fanbox" ||
    normalized === "fan_box";

  if (wantsFanbox && pickupLocation) {
    return "FANbox";
  }

  return "Standard";
};

const extractPickupLocation = (snapshot: unknown, lockerId?: string | null) => {
  if (snapshot && typeof snapshot === "object") {
    const record = snapshot as Record<string, unknown>;
    const fromSnapshot =
      (record.pickupLocation as string | undefined) ||
      (record.name as string | undefined) ||
      (record.title as string | undefined);
    if (fromSnapshot?.trim()) return fromSnapshot.trim();

    const snapshotId = record.id as string | undefined;
    if (snapshotId?.trim()) return snapshotId.trim();
  }

  if (lockerId?.trim()) return lockerId.trim();
  return null;
};

const extractPickupLocationCandidates = (
  snapshot: unknown,
  lockerId?: string | null
): string[] => {
  const candidates: string[] = [];
  const pushCandidate = (value: unknown) => {
    if (typeof value !== "string") return;
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!candidates.includes(trimmed)) {
      candidates.push(trimmed);
    }
  };

  if (snapshot && typeof snapshot === "object") {
    const record = snapshot as Record<string, unknown>;
    pushCandidate(record.pickupLocation);
    pushCandidate(record.name);
    pushCandidate(record.title);
    pushCandidate(record.id);
    pushCandidate(record.lockerId);
  }

  pushCandidate(lockerId);
  return candidates;
};

const hasPickupLocationValidationError = (
  response: Record<string, unknown> | null
): boolean => {
  if (!response) return false;

  const data = response.data as Record<string, unknown> | undefined;
  const responseEntries = Array.isArray(response.response)
    ? (response.response as Array<Record<string, unknown>>)
    : [];
  const dataResponseEntries = Array.isArray(data?.response)
    ? (data.response as Array<Record<string, unknown>>)
    : [];
  const allEntries = [...responseEntries, ...dataResponseEntries];

  const containsPickupLocationToken = (value: unknown): boolean => {
    if (typeof value === "string") {
      const normalized = value.toLowerCase();
      return (
        normalized.includes("pickuplocation") ||
        normalized.includes("fanboxisinvalid")
      );
    }
    if (Array.isArray(value)) {
      return value.some(containsPickupLocationToken);
    }
    if (value && typeof value === "object") {
      return Object.entries(value).some(([key, inner]) => {
        if (key.toLowerCase().includes("pickuplocation")) return true;
        return containsPickupLocationToken(inner);
      });
    }
    return false;
  };

  return allEntries.some(entry => containsPickupLocationToken(entry.errors));
};

/**
 * Parse street address into street name and number.
 * Handles Romanian formats: "Str. X Nr. 54-56", "Strada X 54", "B-dul Unirii nr. 10", etc.
 * When parsing is ambiguous, keeps full address as street (FanCourier accepts optional streetNo).
 */
const parseStreetData = (line1: string, line2?: string | null) => {
  const trimmed = line1.trim();
  if (!trimmed) {
    return { street: line2?.trim() || "", streetNo: undefined };
  }

  if (line2?.trim()) {
    return {
      street: trimmed,
      streetNo: line2.trim(),
    };
  }

  // Pattern 1: "Nr. 54-56" or "nr. 54" or "Nr 54A" – number after Nr/nr (Romanian)
  const nrMatch = trimmed.match(
    /\s+(?:Nr\.?|nr\.?|numar\.?|număr\.?)\s*[:\s]*(\d+[a-zA-Z]?(?:\s*-\s*\d+[a-zA-Z]?)?)\s*(?:,|$|\.|bl\.|sc\.|et\.|ap\.)/i
  );
  if (nrMatch) {
    const streetNo = nrMatch[1].replace(/\s+/g, "");
    const street = trimmed
      .replace(nrMatch[0], " ")
      .replace(/\s{2,}/g, " ")
      .replace(/[,\s]+$/, "")
      .trim();
    if (street && streetNo) {
      return { street, streetNo };
    }
  }

  // Pattern 2: "Nr. 54-56" or "nr 54" at end (no trailing comma/etc)
  const nrEndMatch = trimmed.match(
    /\s+(?:Nr\.?|nr\.?)\s*(\d+[a-zA-Z]?(?:\s*-\s*\d+[a-zA-Z]?)?)\s*$/i
  );
  if (nrEndMatch) {
    const streetNo = nrEndMatch[1].replace(/\s+/g, "");
    const street = trimmed
      .slice(0, nrEndMatch.index)
      .replace(/\s+(?:Nr\.?|nr\.?)\s*$/i, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (street && streetNo) {
      return { street, streetNo };
    }
  }

  // Pattern 3: Number or number-range at end: "Strada X 54-56" or "Bulevardul Unirii 10"
  const endNumMatch = trimmed.match(
    /\s+(\d+[a-zA-Z]?(?:\s*-\s*\d+[a-zA-Z]?)?)\s*$/
  );
  if (endNumMatch) {
    const streetNo = endNumMatch[1].replace(/\s+/g, "");
    const street = trimmed
      .slice(0, endNumMatch.index)
      .replace(/\s{2,}/g, " ")
      .trim();
    if (street && street.length >= 2) {
      return { street, streetNo };
    }
  }

  // Pattern 4: Single number somewhere (last resort) – only if clearly separated
  const anyNumMatch = trimmed.match(
    /^(.+?)\s+(\d+[a-zA-Z]?(?:\s*-\s*\d+[a-zA-Z]?)?)\s*$/
  );
  if (anyNumMatch) {
    const street = anyNumMatch[1].replace(/\s{2,}/g, " ").trim();
    const streetNo = anyNumMatch[2].replace(/\s+/g, "");
    if (street.length >= 2 && !/^\d+$/.test(street)) {
      return { street, streetNo };
    }
  }

  // Fallback: full address as street, no number (safe; FanCourier streetNo is optional)
  return { street: trimmed, streetNo: undefined };
};

const normalizeAddressToken = (value: string): string =>
  value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();

const extractAddressDetailToken = (
  source: string,
  pattern: RegExp
): string | undefined => {
  const match = source.match(pattern);
  const value = match?.[1]?.trim();
  return value || undefined;
};

const extractRecipientAddressParts = (input: {
  addressLine1: string;
  addressLine2?: string | null;
  locality: string;
}): {
  street: string;
  streetNo?: string;
  building?: string;
  entrance?: string;
  floor?: string;
  apartment?: string;
} => {
  const line1Parts = input.addressLine1
    .split(",")
    .map(part => part.trim())
    .filter(Boolean);
  const line2Parts = (input.addressLine2 || "")
    .split(",")
    .map(part => part.trim())
    .filter(Boolean);

  const localityNormalized = normalizeAddressToken(input.locality);
  const line1WithoutLocality = line1Parts.filter(
    part => normalizeAddressToken(part) !== localityNormalized
  );
  const baseStreetLine =
    line1WithoutLocality[0] || line1Parts[0] || input.addressLine1.trim();
  const extraLine1Parts = line1WithoutLocality.slice(1);

  const rawLine2 = (input.addressLine2 || "").trim();
  const isLine2StreetNumberOnly = /^\d+[a-zA-Z]?(?:\s*-\s*\d+[a-zA-Z]?)?$/.test(
    rawLine2
  );

  const parsedStreet = parseStreetData(baseStreetLine);
  let streetNo = parsedStreet.streetNo;
  if (!streetNo && isLine2StreetNumberOnly) {
    streetNo = rawLine2.replace(/\s+/g, "");
  }

  const detailsSource = [...extraLine1Parts, ...line2Parts]
    .filter(part => !isLine2StreetNumberOnly || part !== rawLine2)
    .join(", ");

  return {
    street: parsedStreet.street || baseStreetLine || input.addressLine1.trim(),
    streetNo,
    building: extractAddressDetailToken(
      detailsSource,
      /\b(?:bl(?:oc)?\.?)\s*([a-zA-Z0-9\-\/]+)/i
    ),
    entrance: extractAddressDetailToken(
      detailsSource,
      /\b(?:sc(?:ara)?\.?|entr(?:are)?\.?)\s*([a-zA-Z0-9\-\/]+)/i
    ),
    floor: extractAddressDetailToken(
      detailsSource,
      /\b(?:et(?:aj)?\.?|floor)\s*([a-zA-Z0-9\-\/]+)/i
    ),
    apartment: extractAddressDetailToken(
      detailsSource,
      /\b(?:ap(?:t|artament)?\.?)\s*([a-zA-Z0-9\-\/]+)/i
    ),
  };
};

type SupplierPickupContact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  businessAddress: string | null;
  businessCity: string | null;
  businessState: string | null;
  businessPostalCode: string | null;
  businessCountry: string | null;
};

const collectSupplierContacts = (
  products: Array<{
    supplier?: SupplierPickupContact | null;
  }>
): { suppliers: SupplierPickupContact[]; missingSupplierCount: number } => {
  const supplierMap = new Map<string, SupplierPickupContact>();
  let missingSupplierCount = 0;

  for (const product of products) {
    if (!product.supplier?.id) {
      missingSupplierCount += 1;
      continue;
    }
    if (!supplierMap.has(product.supplier.id)) {
      supplierMap.set(product.supplier.id, product.supplier);
    }
  }

  return {
    suppliers: Array.from(supplierMap.values()),
    missingSupplierCount,
  };
};

/**
 * Build sender config from supplier address for FanCourier pickup.
 * Used only when FANCOURIER_USE_SUPPLIER_ADDRESS=true and supplier has complete address.
 * Returns null to fallback to env-based sender on any validation failure.
 */
const resolveSenderFromSupplier = (
  supplier: SupplierPickupContact | null
): FanCourierSenderConfig | null => {
  const useSupplier = process.env.FANCOURIER_USE_SUPPLIER_ADDRESS === "true";
  if (!useSupplier || !supplier) return null;

  const addr = (supplier.businessAddress ?? "").trim();
  const city = (supplier.businessCity ?? "").trim();
  const county = (supplier.businessState ?? "").trim();
  const phone = (supplier.phone ?? "").trim();

  if (!addr || !city || !county || !phone) return null;

  const { street, streetNo } = parseStreetData(addr, "");
  const finalStreet = street?.trim() || addr;
  if (!finalStreet) return null;

  const envFallback = getFanCourierSenderConfig();
  return {
    name: (supplier.name && supplier.name.trim()) || envFallback.name,
    phone,
    email: supplier.email ?? undefined,
    county,
    locality: city,
    street: finalStreet,
    number: streetNo ?? "",
    postalCode: (supplier.businessPostalCode ?? "").trim() || undefined,
    contactPerson: undefined,
  };
};

const resolveSupplierEmail = (supplier: SupplierPickupContact | null) => {
  if (!supplier) return process.env.SUPPLIER_EMAIL || null;
  const normalizedSupplierName = supplier.name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_");
  const supplierSpecificEmail =
    process.env[`${normalizedSupplierName}_SUPPLIER_EMAIL`];
  return (
    supplier.email ||
    supplierSpecificEmail ||
    process.env.SUPPLIER_EMAIL ||
    null
  );
};

const formatPickupDate = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + Math.max(0, offsetDays));
  return date.toISOString().slice(0, 10);
};

/**
 * FAN support may require a billing account label in pickup order "info.payment"
 * (distinct from AWB "info.payment", which is the payer party enum sender/recipient).
 * Keep this optional to avoid changing existing working behavior.
 */
const getFanCourierPickupPaymentLabel = (): string | undefined => {
  const candidates = [
    process.env.FANCOURIER_PICKUP_PAYMENT_LABEL,
    process.env.FANCOURIER_PAYMENT_LABEL,
    process.env.FANCOURIER_PAYMENT,
  ];

  for (const raw of candidates) {
    const value = raw?.trim();
    if (value) return value;
  }

  return undefined;
};

const buildPickupOrderPayload = (input: {
  awbNumber?: string | null;
  weight: number;
  dimensions?: { width: number; height: number; depth: number } | null;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  pickupDate: string;
  observations?: string | null;
  sender: FanCourierSenderConfig;
}) => {
  const pickupPaymentLabel = getFanCourierPickupPaymentLabel();

  return {
    clientId: getFanCourierClientId(),
    info: {
      awbnumber: input.awbNumber ?? null,
      packages: {
        parcel: 1,
        envelope: 0,
      },
      weight: input.weight,
      dimensions: input.dimensions
        ? {
            width: input.dimensions.width,
            length: input.dimensions.depth,
            height: input.dimensions.height,
          }
        : undefined,
      orderType: "Standard",
      pickupDate: input.pickupDate,
      pickupHours: {
        first: input.pickupWindowStart,
        second: input.pickupWindowEnd,
      },
      observations: input.observations || "",
      ...(pickupPaymentLabel ? { payment: pickupPaymentLabel } : {}),
    },
    sender: {
      name: input.sender.name,
      contactperson: input.sender.contactPerson,
      email: input.sender.email,
      phone: input.sender.phone,
      address: {
        county: normalizeFanCourierCountyName(input.sender.county),
        locality: input.sender.locality,
        street: input.sender.street,
        streetNo: input.sender.number,
        zipCode: input.sender.postalCode,
      },
    },
  };
};

const parseAwbOptionCodes = (raw?: string | null): string[] => {
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(/[,\s;|]+/)
        .map(code => code.trim().toUpperCase())
        .filter(Boolean)
    )
  );
};

const resolveAwbOptionCodes = (service: FanCourierServiceType): string[] => {
  const globalOptions = parseAwbOptionCodes(process.env.FANCOURIER_AWB_OPTIONS);
  const standardOptions = parseAwbOptionCodes(
    process.env.FANCOURIER_AWB_OPTIONS_STANDARD
  );
  const fanboxOptions = parseAwbOptionCodes(
    process.env.FANCOURIER_AWB_OPTIONS_FANBOX
  );

  const resolved = new Set<string>(globalOptions);
  const serviceSpecific =
    service === "FANbox" ? fanboxOptions : standardOptions;
  for (const code of serviceSpecific) {
    resolved.add(code);
  }

  // FanCourier docs indicate FANbox locker pickup should use option "V".
  if (service === "FANbox") {
    resolved.add("V");
  } else {
    resolved.delete("V");
  }

  return Array.from(resolved);
};

const resolveCodReturnPayment = (): string => {
  const raw = (process.env.FANCOURIER_RETURN_PAYMENT || "").trim();
  if (!raw) return "sender";
  return raw;
};

const parsePositiveDimensionCm = (raw: string | undefined): number | null => {
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.max(1, Math.round(parsed));
};

const getFanCourierDefaultDimensions = (): {
  length: number;
  width: number;
  height: number;
} => {
  const length = parsePositiveDimensionCm(
    process.env.FANCOURIER_DEFAULT_LENGTH_CM
  );
  const width = parsePositiveDimensionCm(process.env.FANCOURIER_DEFAULT_WIDTH_CM);
  const height = parsePositiveDimensionCm(
    process.env.FANCOURIER_DEFAULT_HEIGHT_CM
  );

  return {
    length: length ?? 20,
    width: width ?? 20,
    height: height ?? 20,
  };
};

const resolveShipmentDimensions = (
  service: FanCourierServiceType,
  dimensions?: { width: number; height: number; depth: number } | null
): { length: number; width: number; height: number } | null => {
  if (
    dimensions &&
    Number.isFinite(dimensions.depth) &&
    Number.isFinite(dimensions.width) &&
    Number.isFinite(dimensions.height) &&
    dimensions.depth > 0 &&
    dimensions.width > 0 &&
    dimensions.height > 0
  ) {
    return {
      length: Math.max(1, Math.round(dimensions.depth)),
      width: Math.max(1, Math.round(dimensions.width)),
      height: Math.max(1, Math.round(dimensions.height)),
    };
  }

  if (service === "FANbox") {
    return getFanCourierDefaultDimensions();
  }

  return null;
};

const buildAwbPayload = (
  input: {
    order: {
      id: string;
      orderNumber: string;
      total: number;
      paymentMethod: string;
      codAmount?: number | null;
      declaredValue?: number | null;
      shippingAddress: {
        fullName: string;
        addressLine1: string;
        addressLine2?: string | null;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        phone: string;
        companyName?: string | null;
        cui?: string | null;
      };
      user?: { email?: string | null } | null;
      shippingMethod?: string | null;
      lockerId?: string | null;
      lockerAddressSnapshot?: unknown | null;
    };
    chargeableWeightKg: number;
    dimensions?: { width: number; height: number; depth: number } | null;
  },
  senderConfig?: FanCourierSenderConfig,
  pickupLocationOverride?: string | null
): FanCourierAwbPayload => {
  const isCodPayment =
    input.order.paymentMethod === "cash_on_delivery" ||
    input.order.paymentMethod === "cod";

  const pickupLocation =
    pickupLocationOverride ??
    extractPickupLocation(input.order.lockerAddressSnapshot, input.order.lockerId);
  const service = resolveFanCourierService(
    input.order.shippingMethod,
    pickupLocation
  );
  const recipientAddress = extractRecipientAddressParts({
    addressLine1: input.order.shippingAddress.addressLine1,
    addressLine2: input.order.shippingAddress.addressLine2,
    locality: input.order.shippingAddress.city,
  });
  const sender = senderConfig ?? getFanCourierSenderConfig();
  const awbOptions = resolveAwbOptionCodes(service);
  const shipmentDimensions = resolveShipmentDimensions(service, input.dimensions);
  const codValue = isCodPayment
    ? (input.order.codAmount ?? input.order.total)
    : 0;
  const returnPayment = codValue > 0 ? resolveCodReturnPayment() : null;

  return {
    clientId: getFanCourierClientId(),
    shipments: [
      {
        info: {
          service,
          bank: "",
          bankAccount: "",
          packages: {
            parcel: 1,
            envelope: 0,
          },
          weight: input.chargeableWeightKg,
          cod: codValue,
          declaredValue: input.order.declaredValue ?? 0,
          payment: "sender",
          refund: null,
          returnPayment,
          observation: `Order ${input.order.orderNumber}`,
          content: `Comanda #${input.order.orderNumber}`,
          length: shipmentDimensions?.length,
          width: shipmentDimensions?.width,
          height: shipmentDimensions?.height,
          dimensions: shipmentDimensions
            ? {
                length: shipmentDimensions.length,
                height: shipmentDimensions.height,
                width: shipmentDimensions.width,
              }
            : undefined,
          costCenter: null,
          options: awbOptions,
        },
        recipient: {
          name: input.order.shippingAddress.fullName,
          phone: input.order.shippingAddress.phone,
          email: input.order.user?.email || undefined,
          address: {
            county: normalizeFanCourierCountyName(input.order.shippingAddress.state),
            locality: input.order.shippingAddress.city,
            street: recipientAddress.street,
            streetNo: recipientAddress.streetNo,
            building: recipientAddress.building,
            entrance: recipientAddress.entrance,
            floor: recipientAddress.floor,
            apartment: recipientAddress.apartment,
            zipCode: input.order.shippingAddress.postalCode,
            pickupLocation:
              service === "FANbox" ? (pickupLocation ?? undefined) : undefined,
          },
        },
        sender: {
          name: sender.name,
          contactperson: sender.contactPerson,
          email: sender.email,
          phone: sender.phone,
          address: {
            county: normalizeFanCourierCountyName(sender.county),
            locality: sender.locality,
            street: sender.street,
            streetNo: sender.number,
            zipCode: sender.postalCode,
          },
        },
      },
    ],
  };
};

export interface FanAwbResult {
  success: boolean;
  error?: string;
  shipment?: {
    id: string;
    orderId: string;
    courier: string;
    awbNumber: string | null;
    status: string | null;
    declaredValue: number | null;
  };
  awbNumber?: string | null;
  alreadyExists?: boolean;
  response?: Record<string, unknown> | null;
  manualReviewRequired?: boolean;
  reviewReason?: string | null;
  senderDebug?: {
    useSupplierAddressFlag: boolean;
    senderSource: "supplier" | "env_fallback";
    supplierId?: string | null;
    supplierName?: string | null;
    missingSupplierFields?: string[];
    sender: {
      name: string;
      phone: string;
      county: string;
      locality: string;
      street: string;
      number: string;
    };
  };
}

/**
 * Create AWB for an order using FAN Courier
 */
export const createFanAwbForOrder = async (
  orderId: string
): Promise<FanAwbResult> => {
  // Check if FAN Courier is configured
  if (!isFanCourierConfigured()) {
    return {
      success: false,
      error: "FAN Courier is not configured. Please add API credentials.",
    };
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      user: true,
      shippingAddress: true,
    },
  });

  if (!order) {
    return { success: false, error: "Order not found" };
  }

  if (!order.shippingAddress) {
    return { success: false, error: "Shipping address missing" };
  }

  const hasPhysicalItems = order.items.some(item => item.isDigital !== true);
  if (!hasPhysicalItems) {
    return { success: false, error: "Order has no shippable items" };
  }
  const physicalItems = order.items.filter(item => item.isDigital !== true);
  const missingProductLinks = physicalItems.filter(item => !item.productId);
  if (missingProductLinks.length > 0) {
    const reason =
      "Order contains physical items without linked product records. Manual fulfillment review required: fix the product links, then create supplier lines and the AWB/shipping label manually in Admin.";
    await db.order.update({
      where: { id: order.id },
      data: {
        manualShippingReviewRequired: true,
        shippingReviewReason: reason,
      },
    });
    const { AdminNotificationService } = await import(
      "@/lib/email/admin-notification-service"
    );
    AdminNotificationService.sendOrderIssueNotification(
      order.id,
      "MANUAL_SHIPPING_REVIEW_REQUIRED",
      reason,
      "HIGH"
    ).catch(err => {
      console.error(
        `[FAN Courier] Failed to send manual shipping review notification for order ${order.orderNumber}:`,
        err
      );
    });
    return {
      success: false,
      error: reason,
      manualReviewRequired: true,
      reviewReason: reason,
    };
  }

  const isCodPayment =
    order.paymentMethod === "cash_on_delivery" || order.paymentMethod === "cod";

  if (order.paymentStatus !== "PAID" && !isCodPayment) {
    return { success: false, error: "Order payment is not confirmed" };
  }

  // Check for existing shipment
  const existingShipment = await db.shipment.findFirst({
    where: { orderId, courier: COURIER_NAME },
  });

  if (existingShipment?.awbNumber) {
    return {
      success: true,
      shipment: existingShipment,
      awbNumber: existingShipment.awbNumber,
      alreadyExists: true,
    };
  }

  // Calculate chargeable weight
  const productIds = Array.from(
    new Set(
      physicalItems.map(item => item.productId).filter(Boolean) as string[]
    )
  );

  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      sku: true,
      barcode: true,
      images: true,
      weight: true,
      dimensions: true,
      supplier: {
        select: {
          id: true,
          companyName: true,
          contactPersonName: true,
          contactPersonEmail: true,
          email: true,
          phone: true,
          businessAddress: true,
          businessCity: true,
          businessState: true,
          businessPostalCode: true,
          businessCountry: true,
        },
      },
    },
  });
  if (products.length !== productIds.length) {
    const reason =
      "One or more ordered products are missing from catalog. Manual fulfillment review required: fix the missing products, then create supplier lines and the AWB/shipping label manually in Admin.";
    await db.order.update({
      where: { id: order.id },
      data: {
        manualShippingReviewRequired: true,
        shippingReviewReason: reason,
      },
    });
    const { AdminNotificationService } = await import(
      "@/lib/email/admin-notification-service"
    );
    AdminNotificationService.sendOrderIssueNotification(
      order.id,
      "MANUAL_SHIPPING_REVIEW_REQUIRED",
      reason,
      "HIGH"
    ).catch(err => {
      console.error(
        `[FAN Courier] Failed to send manual shipping review notification for order ${order.orderNumber}:`,
        err
      );
    });
    return {
      success: false,
      error: reason,
      manualReviewRequired: true,
      reviewReason: reason,
    };
  }

  const totalWeight = products.reduce((sum, p) => sum + (p.weight || 0), 0);
  const chargeableWeightKg = Math.max(totalWeight, 1); // Minimum 1kg

  let maxDimensions: { width: number; height: number; depth: number } | null =
    null;
  for (const product of products) {
    const dims = extractDimensionsCm(
      product.dimensions as Record<string, unknown>
    );
    if (!dims) continue;
    if (!maxDimensions) {
      maxDimensions = { ...dims };
      continue;
    }
    maxDimensions = {
      width: Math.max(maxDimensions.width, dims.width),
      height: Math.max(maxDimensions.height, dims.height),
      depth: Math.max(maxDimensions.depth, dims.depth),
    };
  }

  const supplierContext = collectSupplierContacts(
    products.map(product => ({
      supplier: product.supplier
        ? {
            id: product.supplier.id,
            name:
              product.supplier.companyName ||
              product.supplier.contactPersonName ||
              "Supplier",
            email:
              product.supplier.contactPersonEmail ||
              product.supplier.email ||
              null,
            phone: product.supplier.phone || null,
            businessAddress: product.supplier.businessAddress || null,
            businessCity: product.supplier.businessCity || null,
            businessState: product.supplier.businessState || null,
            businessPostalCode: product.supplier.businessPostalCode || null,
            businessCountry: product.supplier.businessCountry || null,
          }
        : null,
    }))
  );

  const primarySupplier =
    supplierContext.suppliers.length === 1
      ? supplierContext.suppliers[0]
      : null;
  if (
    supplierContext.suppliers.length > 1 ||
    supplierContext.missingSupplierCount > 0
  ) {
    const reason =
      supplierContext.suppliers.length > 1
        ? "Order contains items from multiple suppliers; split shipments manually per supplier, then create supplier lines and the AWB/shipping label for each shipment in Admin."
        : "One or more products have no assigned supplier; manual shipment review required: assign suppliers, then create supplier lines and the AWB/shipping label manually in Admin.";
    await db.order.update({
      where: { id: order.id },
      data: {
        manualShippingReviewRequired: true,
        shippingReviewReason: reason,
      },
    });
    const { AdminNotificationService } = await import(
      "@/lib/email/admin-notification-service"
    );
    AdminNotificationService.sendOrderIssueNotification(
      order.id,
      "MANUAL_SHIPPING_REVIEW_REQUIRED",
      reason,
      "HIGH"
    ).catch(err => {
      console.error(
        `[FAN Courier] Failed to send manual shipping review notification for order ${order.orderNumber}:`,
        err
      );
    });
    return {
      success: false,
      error: reason,
      manualReviewRequired: true,
      reviewReason: reason,
    };
  }

  const useSupplierAddressFlag =
    process.env.FANCOURIER_USE_SUPPLIER_ADDRESS === "true";
  const missingSupplierFields: string[] = [];
  if (primarySupplier) {
    if (!(primarySupplier.businessAddress || "").trim()) {
      missingSupplierFields.push("businessAddress");
    }
    if (!(primarySupplier.businessCity || "").trim()) {
      missingSupplierFields.push("businessCity");
    }
    if (!(primarySupplier.businessState || "").trim()) {
      missingSupplierFields.push("businessState");
    }
    if (!(primarySupplier.phone || "").trim()) {
      missingSupplierFields.push("phone");
    }
  }

  const supplierSenderConfig = resolveSenderFromSupplier(primarySupplier);
  const senderConfig = supplierSenderConfig ?? getFanCourierSenderConfig();
  const senderSource: "supplier" | "env_fallback" = supplierSenderConfig
    ? "supplier"
    : "env_fallback";
  const senderDebug = {
    useSupplierAddressFlag,
    senderSource,
    supplierId: primarySupplier?.id ?? null,
    supplierName: primarySupplier?.name ?? null,
    missingSupplierFields,
    sender: {
      name: senderConfig.name,
      phone: senderConfig.phone,
      county: senderConfig.county,
      locality: senderConfig.locality,
      street: senderConfig.street,
      number: senderConfig.number,
    },
  };

  if (useSupplierAddressFlag && !supplierSenderConfig) {
    console.warn(
      `[FAN Courier] Order ${order.orderNumber} falling back to env sender config.`,
      senderDebug
    );
  }

  const awbInput = {
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      paymentMethod: order.paymentMethod,
      codAmount: order.codAmount,
      declaredValue: order.declaredValue,
      shippingAddress: order.shippingAddress,
      user: order.user,
      shippingMethod: order.shippingMethod,
      lockerId: order.lockerId,
      lockerAddressSnapshot: order.lockerAddressSnapshot,
    },
    chargeableWeightKg,
    dimensions: maxDimensions,
  };
  const pickupLocationCandidates = extractPickupLocationCandidates(
    order.lockerAddressSnapshot,
    order.lockerId
  );
  let payload = buildAwbPayload(
    awbInput,
    senderConfig,
    pickupLocationCandidates[0] ?? null
  );

  // Create shipment record
  const shipment = await db.shipment.create({
    data: {
      orderId: order.id,
      courier: COURIER_NAME,
      status: "PENDING",
      declaredValue: order.declaredValue,
      payload: JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue,
    },
  });

  let response: Record<string, unknown> | null = null;
  let awbNumber: string | null = null;
  let status = "FAILED";
  let courierErrorMessage: string | null = null;
  let manualShippingReviewRequired = false;
  let shippingReviewReason: string | null = null;

  try {
    response = await createFanCourierAwb(
      payload as unknown as Record<string, unknown>
    );
    awbNumber = extractAwbNumber(response);

    const currentService = payload.shipments[0]?.info?.service;
    const currentPickupLocation =
      payload.shipments[0]?.recipient?.address?.pickupLocation || null;
    if (
      !awbNumber &&
      currentService === "FANbox" &&
      hasPickupLocationValidationError(response)
    ) {
      const fallbackPickupLocation = pickupLocationCandidates.find(
        candidate => candidate !== currentPickupLocation
      );
      if (fallbackPickupLocation) {
        console.warn(
          `[FAN Courier] Retrying FANbox AWB for order ${order.orderNumber} with fallback pickup location.`,
          {
            initialPickupLocation: currentPickupLocation,
            fallbackPickupLocation,
          }
        );
        payload = buildAwbPayload(awbInput, senderConfig, fallbackPickupLocation);
        response = await createFanCourierAwb(
          payload as unknown as Record<string, unknown>
        );
        awbNumber = extractAwbNumber(response);
      }
    }

    // Check for extra km / remote locality - CRITICAL SAFETY MECHANISM
    const { hasExtraKm, reason } = hasExtraKmOrRemoteLocality(response);
    if (hasExtraKm) {
      manualShippingReviewRequired = true;
      shippingReviewReason = reason;
      console.warn(
        `[FAN Courier] Order ${order.orderNumber} flagged for manual review: ${reason}`
      );
    }

    status = awbNumber ? "CREATED" : "FAILED";
  } catch (error) {
    courierErrorMessage =
      error instanceof Error ? error.message : "Unknown error";
    response = { error: courierErrorMessage };

    // Set manual review required on courier error
    manualShippingReviewRequired = true;
    shippingReviewReason = `Courier API error: ${courierErrorMessage}`;

    console.error(
      `[FAN Courier] AWB creation failed for order ${order.orderNumber}:`,
      error
    );
  }

  // Log AWB event
  await db.awbEvent.create({
    data: {
      shipmentId: shipment.id,
      eventType: "CREATE_AWB",
      requestJson: JSON.parse(
        JSON.stringify(
          redactPayload(payload as unknown as Record<string, unknown>)
        )
      ) as Prisma.InputJsonValue,
      responseJson: response
        ? (JSON.parse(JSON.stringify(response)) as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    },
  });

  // Update shipment
  const updatedShipment = await db.shipment.update({
    where: { id: shipment.id },
    data: {
      awbNumber,
      status,
      payload: JSON.parse(
        JSON.stringify(
          response
            ? {
                request: redactPayload(
                  payload as unknown as Record<string, unknown>
                ),
                response,
              }
            : payload
        )
      ) as Prisma.InputJsonValue,
    },
  });

  // Update order with review flags if needed
  if (manualShippingReviewRequired || courierErrorMessage) {
    await db.order.update({
      where: { id: order.id },
      data: {
        manualShippingReviewRequired,
        shippingReviewReason,
        courierErrorMessage,
      },
    });
  }

  if (!awbNumber) {
    return {
      success: false,
      error: courierErrorMessage || "AWB creation failed",
      shipment: updatedShipment,
      response,
      manualReviewRequired: manualShippingReviewRequired,
      reviewReason: shippingReviewReason,
      senderDebug,
    };
  }

  // Propagate AWB to order so customer tracking and other flows use Order.trackingNumber/carrier
  await db.order.update({
    where: { id: order.id },
    data: {
      trackingNumber: awbNumber,
      carrier: COURIER_NAME,
    },
  });

  // Propagate same tracking to SupplierOrders for this order so admin/supplier views stay in sync
  await db.supplierOrder.updateMany({
    where: { orderId: order.id },
    data: {
      trackingNumber: awbNumber,
      carrier: COURIER_NAME,
    },
  });

  if (!manualShippingReviewRequired && primarySupplier) {
    const supplierEmail = resolveSupplierEmail(primarySupplier);
    const productDataById = new Map(
      products.map(product => [
        product.id,
        {
          sku: product.sku ?? null,
          barcode: product.barcode ?? null,
          imageUrl: product.images?.[0] ?? null,
        },
      ])
    );
    const orderItemsForEmail = physicalItems.map(item => {
      const productData = item.productId
        ? productDataById.get(item.productId)
        : null;
      return {
        name: item.name || "Produs",
        sku: productData?.sku || null,
        barcode: productData?.barcode || null,
        imageUrl: productData?.imageUrl || null,
        quantity: item.quantity,
      };
    });

    if (!supplierEmail) {
      console.warn(
        `[FAN Courier] Missing supplier email for order ${order.orderNumber}; skipping AWB email notification.`
      );
    } else {
      let pdfBase64: string | undefined;
      try {
        const labelResponse = await getFanCourierAwbLabel({
          awbNumber,
        });
        pdfBase64 = Buffer.from(labelResponse.buffer).toString("base64");
      } catch (labelError) {
        console.error(
          `[FAN Courier] Failed to download AWB label PDF for order ${order.orderNumber}; sending email without attachment.`,
          labelError
        );
      }

      try {
        if (isSupplierAwbEmailDisabled()) {
          console.info(
            `[FAN Courier] Supplier AWB email disabled by DISABLE_SUPPLIER_AWB_EMAIL=true. Skipping email for order ${order.orderNumber}.`
          );
        } else {
          await sendSupplierAwbLabelEmail({
            to: supplierEmail,
            supplierName: primarySupplier.name,
            orderNumber: order.orderNumber,
            awbNumber,
            pdfBase64,
            orderItems: orderItemsForEmail,
          });
        }
      } catch (emailError) {
        console.error(
          `[FAN Courier] Failed to email AWB details for order ${order.orderNumber}:`,
          emailError
        );
      }
    }

    try {
      const shippingSettings = await getShippingSettings();
      const pickupConfig = (shippingSettings as any)?.fanCourierPickup;
      if (pickupConfig?.enabled) {
        const pickupPayload = buildPickupOrderPayload({
          awbNumber,
          weight: chargeableWeightKg,
          dimensions: maxDimensions,
          pickupWindowStart: pickupConfig.windowStart || "09:00",
          pickupWindowEnd: pickupConfig.windowEnd || "16:00",
          pickupDate: formatPickupDate(Number(pickupConfig.offsetDays || 0)),
          observations: pickupConfig.observations || "",
          sender: senderConfig,
        });

        await createFanCourierPickupOrder(pickupPayload);
      }
    } catch (pickupError) {
      console.error(
        `[FAN Courier] Pickup order failed for order ${order.orderNumber}:`,
        pickupError
      );
    }
  }

  return {
    success: true,
    shipment: updatedShipment,
    awbNumber,
    manualReviewRequired: manualShippingReviewRequired,
    reviewReason: shippingReviewReason,
    senderDebug,
  };
};

/**
 * Check if an order already has a FAN Courier shipment
 */
export const hasFanCourierShipment = async (
  orderId: string
): Promise<boolean> => {
  const shipment = await db.shipment.findFirst({
    where: { orderId, courier: COURIER_NAME },
  });
  return !!shipment?.awbNumber;
};
