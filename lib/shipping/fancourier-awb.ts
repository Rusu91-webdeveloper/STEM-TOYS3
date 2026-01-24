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
    hasExtraKmOrRemoteLocality,
    FanCourierClientError,
    isFanCourierConfigured,
} from "@/lib/integrations/fancourier/client";
import {
    FanCourierAwbPayload,
    getFanCourierSenderConfig,
} from "@/lib/integrations/fancourier/types";

const COURIER_NAME = "FANCOURIER";

/**
 * Extract AWB number from various FAN Courier response formats
 */
const extractAwbNumber = (response: Record<string, unknown>): string | null => {
    return (
        (response.awbNumber as string) ||
        (response.awb_number as string) ||
        (response.awb as string) ||
        ((response.data as Record<string, unknown> | undefined)?.awbNumber as
            | string
            | undefined) ||
        ((response.data as Record<string, unknown> | undefined)?.awb_number as
            | string
            | undefined) ||
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
    };
    chargeableWeightKg: number;
}): FanCourierAwbPayload => {
    const isCodPayment =
        input.order.paymentMethod === "cash_on_delivery" ||
        input.order.paymentMethod === "cod";

    const senderConfig = getFanCourierSenderConfig();

    return {
        sender: {
            name: senderConfig.name,
            phone: senderConfig.phone,
            email: senderConfig.email,
            county: senderConfig.county,
            locality: senderConfig.locality,
            street: senderConfig.street,
            number: senderConfig.number,
            postalCode: senderConfig.postalCode,
        },
        recipient: {
            name: input.order.shippingAddress.fullName,
            phone: input.order.shippingAddress.phone,
            email: input.order.user?.email || undefined,
            county: input.order.shippingAddress.state,
            locality: input.order.shippingAddress.city,
            street: input.order.shippingAddress.addressLine1,
            number: undefined, // Included in street for Romanian addresses
            postalCode: input.order.shippingAddress.postalCode,
            companyName: input.order.shippingAddress.companyName || undefined,
            cui: input.order.shippingAddress.cui || undefined,
        },
        packages: [{ weight: input.chargeableWeightKg }],
        service: "Standard",
        content: "Jucării STEM",
        envelopes: 0,
        parcels: 1,
        weight: input.chargeableWeightKg,
        payment: "sender",
        reimbursement: isCodPayment
            ? (input.order.codAmount ?? input.order.total)
            : undefined,
        reimbursementType: isCodPayment ? "cash" : undefined,
        declaredValue: input.order.declaredValue ?? undefined,
        clientReference: input.order.orderNumber,
        observation: `Order ${input.order.orderNumber}`,
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
        select: { id: true, weight: true },
    });

    const totalWeight = products.reduce((sum, p) => sum + (p.weight || 0), 0);
    const chargeableWeightKg = Math.max(totalWeight, 1); // Minimum 1kg

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
        },
        chargeableWeightKg,
    });

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
