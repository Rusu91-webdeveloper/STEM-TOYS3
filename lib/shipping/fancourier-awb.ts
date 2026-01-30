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
} from "@/lib/integrations/fancourier/client";
import type {
    FanCourierAwbPayload,
    FanCourierServiceType,
} from "@/lib/integrations/fancourier/types";
import { extractDimensionsCm } from "@/lib/shipping/shipping-pricing";
import { getShippingSettings } from "@/lib/utils/store-settings";
import { sendSupplierAwbLabelEmail } from "@/lib/email/supplier-awb";

const COURIER_NAME = "FANCOURIER";

/**
 * Extract AWB number from various FAN Courier response formats
 */
const extractAwbNumber = (response: Record<string, unknown>): string | null => {
    const data = response.data as Record<string, unknown> | undefined;
    const shipments = response.shipments as Array<Record<string, unknown>> | undefined;
    return (
        (response.awbNumber as string) ||
        (response.awb_number as string) ||
        (response.awb as string) ||
        (data?.awbNumber as
            | string
            | undefined) ||
        (data?.awb_number as
            | string
            | undefined) ||
        (data?.awb as string | undefined) ||
        (Array.isArray(data?.awbs) ? (data?.awbs[0] as string | undefined) : undefined) ||
        (shipments?.[0]?.awb as string | undefined) ||
        (shipments?.[0]?.awbNumber as string | undefined) ||
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
    if (lockerId) return lockerId;
    if (!snapshot || typeof snapshot !== "object") return null;
    const record = snapshot as Record<string, unknown>;
    const possible =
        (record.pickupLocation as string | undefined) ||
        (record.name as string | undefined) ||
        (record.title as string | undefined) ||
        (record.id as string | undefined);
    return possible || null;
};

const parseStreetData = (line1: string, line2?: string | null) => {
    const trimmed = line1.trim();
    const match = trimmed.match(/\b\d+[a-zA-Z]?\b/);

    if (!match) {
        return {
            street: trimmed,
            streetNo: line2?.trim() || undefined,
        };
    }

    const streetNo = line2?.trim() || match[0];
    const street = trimmed.replace(match[0], "").replace(/\s{2,}/g, " ").trim();

    return {
        street: street || trimmed,
        streetNo,
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

const resolveSupplierEmail = (supplier: SupplierPickupContact | null) => {
    if (!supplier) return process.env.SUPPLIER_EMAIL || null;
    return supplier.email || process.env.SUPPLIER_EMAIL || null;
};

const formatPickupDate = (offsetDays: number) => {
    const date = new Date();
    date.setDate(date.getDate() + Math.max(0, offsetDays));
    return date.toISOString().slice(0, 10);
};

const buildPickupOrderPayload = (input: {
    awbNumber?: string | null;
    weight: number;
    dimensions?: { width: number; height: number; depth: number } | null;
    pickupWindowStart: string;
    pickupWindowEnd: string;
    pickupDate: string;
    observations?: string | null;
}) => {
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
        },
    };
};

const buildAwbPayload = (input: {
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
}): FanCourierAwbPayload => {
    const isCodPayment =
        input.order.paymentMethod === "cash_on_delivery" ||
        input.order.paymentMethod === "cod";

    const pickupLocation = extractPickupLocation(
        input.order.lockerAddressSnapshot,
        input.order.lockerId
    );
    const service = resolveFanCourierService(
        input.order.shippingMethod,
        pickupLocation
    );
    const { street, streetNo } = parseStreetData(
        input.order.shippingAddress.addressLine1,
        input.order.shippingAddress.addressLine2
    );

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
                    cod: isCodPayment
                        ? (input.order.codAmount ?? input.order.total)
                        : 0,
                    declaredValue: input.order.declaredValue ?? 0,
                    payment: "sender",
                    refund: null,
                    returnPayment: null,
                    observation: `Order ${input.order.orderNumber}`,
                    content: `Comanda #${input.order.orderNumber}`,
                    dimensions: input.dimensions
                        ? {
                              length: input.dimensions.depth,
                              height: input.dimensions.height,
                              width: input.dimensions.width,
                          }
                        : undefined,
                    costCenter: null,
                    options: [],
                },
                recipient: {
                    name: input.order.shippingAddress.fullName,
                    phone: input.order.shippingAddress.phone,
                    email: input.order.user?.email || undefined,
                    address: {
                        county: input.order.shippingAddress.state,
                        locality: input.order.shippingAddress.city,
                        street,
                        streetNo,
                        zipCode: input.order.shippingAddress.postalCode,
                        pickupLocation:
                            service === "FANbox" ? pickupLocation ?? undefined : undefined,
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

    const hasPhysicalItems = order.items.some((item) => item.isDigital !== true);
    if (!hasPhysicalItems) {
        return { success: false, error: "Order has no shippable items" };
    }

    const isCodPayment =
        order.paymentMethod === "cash_on_delivery" ||
        order.paymentMethod === "cod";

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
    const productIds = order.items
        .filter((item) => item.isDigital !== true)
        .map((item) => item.productId)
        .filter(Boolean) as string[];

    const products = await db.product.findMany({
        where: { id: { in: productIds } },
        select: {
            id: true,
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

    const totalWeight = products.reduce((sum, p) => sum + (p.weight || 0), 0);
    const chargeableWeightKg = Math.max(totalWeight, 1); // Minimum 1kg

    let maxDimensions: { width: number; height: number; depth: number } | null =
        null;
    for (const product of products) {
        const dims = extractDimensionsCm(product.dimensions as Record<string, unknown>);
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

    const payload = buildAwbPayload({
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
    });

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
                      businessPostalCode:
                          product.supplier.businessPostalCode || null,
                      businessCountry: product.supplier.businessCountry || null,
                  }
                : null,
        }))
    );

    const primarySupplier =
        supplierContext.suppliers.length === 1
            ? supplierContext.suppliers[0]
            : null;

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

    if (supplierContext.suppliers.length > 1) {
        manualShippingReviewRequired = true;
        shippingReviewReason =
            "Order contains items from multiple suppliers; manual shipment split required.";
    } else if (supplierContext.missingSupplierCount > 0) {
        manualShippingReviewRequired = true;
        shippingReviewReason =
            "One or more products have no supplier assigned; manual shipment review required.";
    }

    try {
        response = await createFanCourierAwb(
            payload as unknown as Record<string, unknown>
        );
        awbNumber = extractAwbNumber(response);

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
            requestJson: JSON.parse(JSON.stringify(redactPayload(payload as unknown as Record<string, unknown>))) as Prisma.InputJsonValue,
            responseJson: response ? JSON.parse(JSON.stringify(response)) as Prisma.InputJsonValue : null,
        },
    });

    // Update shipment
    const updatedShipment = await db.shipment.update({
        where: { id: shipment.id },
        data: {
            awbNumber,
            status,
            payload: JSON.parse(JSON.stringify(
                response
                    ? { request: redactPayload(payload as unknown as Record<string, unknown>), response }
                    : payload
            )) as Prisma.InputJsonValue,
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
        };
    }

    if (!manualShippingReviewRequired && primarySupplier) {
        const supplierEmail = resolveSupplierEmail(primarySupplier);

        if (supplierEmail) {
            try {
                const labelResponse = await getFanCourierAwbLabel({
                    awbNumber,
                });
                const pdfBase64 = Buffer.from(labelResponse.buffer).toString(
                    "base64"
                );

                await sendSupplierAwbLabelEmail({
                    to: supplierEmail,
                    supplierName: primarySupplier.name,
                    orderNumber: order.orderNumber,
                    awbNumber,
                    pdfBase64,
                });
            } catch (labelError) {
                console.error(
                    `[FAN Courier] Failed to email AWB label for order ${order.orderNumber}:`,
                    labelError
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
                    pickupDate: formatPickupDate(
                        Number(pickupConfig.offsetDays || 0)
                    ),
                    observations: pickupConfig.observations || "",
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
