/**
 * Database-First Email Service
 *
 * This module provides a unified interface for sending emails that:
 * 1. First tries to use database templates (editable via admin UI)
 * 2. Falls back to hardcoded templates if database templates are not found
 *
 * Usage:
 * Instead of: sendWelcomeEmail({ to, name })
 * Use: sendDatabaseFirstEmail("welcome", to, { name })
 */

import { DatabaseTemplateService } from "./database-template-service";
import {
    sendWelcomeEmail as sendWelcomeEmailFallback,
    sendVerificationEmail as sendVerificationEmailFallback,
    sendPasswordResetEmail as sendPasswordResetEmailFallback,
} from "./auth-templates";
import {
    sendOrderConfirmationEmail as sendOrderConfirmationEmailFallback,
    sendShippingNotificationEmail as sendShippingNotificationEmailFallback,
} from "./order-templates";

export interface EmailResult {
    success: boolean;
    error?: string;
    messageId?: string;
    usedDatabaseTemplate: boolean;
}

/**
 * Send welcome email - database first, fallback to hardcoded
 */
export async function sendWelcomeEmailDatabaseFirst(
    to: string,
    name: string
): Promise<EmailResult> {
    try {
        // Try database template first
        const result = await DatabaseTemplateService.sendWelcomeEmail(to, name);

        if (result.success) {
            return { ...result, usedDatabaseTemplate: true };
        }

        // Fallback to hardcoded template
        console.log("📧 Database template failed, using fallback for welcome email");
        const fallbackResult = await sendWelcomeEmailFallback({ to, name });

        return {
            success: !!fallbackResult,
            messageId: fallbackResult?.messageId,
            usedDatabaseTemplate: false,
        };
    } catch (error) {
        console.error("❌ Welcome email failed:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            usedDatabaseTemplate: false,
        };
    }
}

/**
 * Send verification email - database first, fallback to hardcoded
 */
export async function sendVerificationEmailDatabaseFirst(
    to: string,
    name: string,
    verificationLink: string,
    expiresIn?: string
): Promise<EmailResult> {
    try {
        // Try database template first
        const result = await DatabaseTemplateService.sendVerificationEmail(
            to,
            name,
            verificationLink
        );

        if (result.success) {
            return { ...result, usedDatabaseTemplate: true };
        }

        // Fallback to hardcoded template
        console.log("📧 Database template failed, using fallback for verification email");
        const fallbackResult = await sendVerificationEmailFallback({
            to,
            name,
            verificationLink,
            expiresIn,
        });

        return {
            success: !!fallbackResult,
            messageId: fallbackResult?.messageId,
            usedDatabaseTemplate: false,
        };
    } catch (error) {
        console.error("❌ Verification email failed:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            usedDatabaseTemplate: false,
        };
    }
}

/**
 * Send password reset email - database first, fallback to hardcoded
 */
export async function sendPasswordResetEmailDatabaseFirst(
    to: string,
    resetLink: string,
    userName?: string
): Promise<EmailResult> {
    try {
        // Try database template first
        const result = await DatabaseTemplateService.sendPasswordResetEmail(
            to,
            resetLink,
            userName
        );

        if (result.success) {
            return { ...result, usedDatabaseTemplate: true };
        }

        // Fallback to hardcoded template
        console.log("📧 Database template failed, using fallback for password reset email");
        const fallbackResult = await sendPasswordResetEmailFallback({
            to,
            resetLink,
        });

        return {
            success: !!fallbackResult,
            messageId: fallbackResult?.messageId,
            usedDatabaseTemplate: false,
        };
    } catch (error) {
        console.error("❌ Password reset email failed:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            usedDatabaseTemplate: false,
        };
    }
}

/**
 * Send order confirmation email - database first, fallback to hardcoded
 */
export async function sendOrderConfirmationEmailDatabaseFirst(
    to: string,
    orderData: {
        customerName: string;
        orderNumber: string;
        orderTotal: number;
        items: Array<{
            name: string;
            quantity: number;
            price: number;
            image?: string;
        }>;
        shippingAddress: any;
        subtotal?: number;
        tax?: number;
        shippingCost?: number;
        discountAmount?: number;
        codFee?: number;
        paymentMethod?: string;
    }
): Promise<EmailResult> {
    try {
        // Try database template first
        const result = await DatabaseTemplateService.sendOrderConfirmationEmail(
            to,
            orderData
        );

        if (result.success) {
            return { ...result, usedDatabaseTemplate: true };
        }

        // Fallback to hardcoded template
        console.log("📧 Database template failed, using fallback for order confirmation email");
        const fallbackResult = await sendOrderConfirmationEmailFallback({
            to,
            customerName: orderData.customerName,
            orderId: orderData.orderNumber,
            orderTotal: orderData.orderTotal,
            items: orderData.items,
            shippingAddress: orderData.shippingAddress,
            paymentMethod: orderData.paymentMethod || "Card",
        });

        return {
            success: !!fallbackResult,
            messageId: fallbackResult?.messageId,
            usedDatabaseTemplate: false,
        };
    } catch (error) {
        console.error("❌ Order confirmation email failed:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            usedDatabaseTemplate: false,
        };
    }
}

/**
 * Send shipping notification email - database first (with FanCourier), fallback to hardcoded
 */
export async function sendShippingNotificationEmailDatabaseFirst(
    to: string,
    shippingData: {
        customerName: string;
        orderId: string;
        trackingNumber: string;
        estimatedDelivery: string;
        courierName?: string;
    }
): Promise<EmailResult> {
    try {
        // Try database template first (FanCourier by default)
        const result = await DatabaseTemplateService.sendShippingNotificationEmail(
            to,
            {
                customerName: shippingData.customerName,
                orderNumber: shippingData.orderId,
                trackingNumber: shippingData.trackingNumber,
                estimatedDelivery: shippingData.estimatedDelivery,
                courierName: shippingData.courierName || "FanCourier",
            }
        );

        if (result.success) {
            return { ...result, usedDatabaseTemplate: true };
        }

        // Fallback to hardcoded template
        console.log("📧 Database template failed, using fallback for shipping notification email");
        const fallbackResult = await sendShippingNotificationEmailFallback({
            to,
            customerName: shippingData.customerName,
            orderId: shippingData.orderId,
            trackingNumber: shippingData.trackingNumber,
            estimatedDelivery: shippingData.estimatedDelivery,
            courierName: shippingData.courierName || "FanCourier",
        });

        return {
            success: !!fallbackResult,
            messageId: fallbackResult?.messageId,
            usedDatabaseTemplate: false,
        };
    } catch (error) {
        console.error("❌ Shipping notification email failed:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            usedDatabaseTemplate: false,
        };
    }
}

/**
 * Send order cancelled email - database only (no legacy fallback needed)
 */
export async function sendOrderCancelledEmailDatabaseFirst(
    to: string,
    orderData: {
        customerName: string;
        orderNumber: string;
        cancellationReason?: string;
        refundInfo?: string;
    }
): Promise<EmailResult> {
    const result = await DatabaseTemplateService.sendOrderCancelledEmail(to, orderData);
    return { ...result, usedDatabaseTemplate: result.success };
}

/**
 * Send order delivered email - database only
 */
export async function sendOrderDeliveredEmailDatabaseFirst(
    to: string,
    orderData: {
        customerName: string;
        orderNumber: string;
        deliveryDate: string;
    }
): Promise<EmailResult> {
    const result = await DatabaseTemplateService.sendOrderDeliveredEmail(to, orderData);
    return { ...result, usedDatabaseTemplate: result.success };
}

/**
 * Send newsletter welcome email - database only
 */
export async function sendNewsletterWelcomeEmailDatabaseFirst(
    to: string,
    data?: { firstName?: string }
): Promise<EmailResult> {
    const result = await DatabaseTemplateService.sendNewsletterWelcomeEmail(to, data);
    return { ...result, usedDatabaseTemplate: result.success };
}

/**
 * Send return confirmation to customer - database only
 */
export async function sendReturnConfirmationEmailDatabaseFirst(
    to: string,
    returnData: {
        customerName: string;
        orderNumber: string;
        returnId: string;
        productName: string;
        reason: string;
    }
): Promise<EmailResult> {
    const result = await DatabaseTemplateService.sendReturnConfirmationToCustomer(to, returnData);
    return { ...result, usedDatabaseTemplate: result.success };
}

// Re-export for convenience
export { DatabaseTemplateService };
