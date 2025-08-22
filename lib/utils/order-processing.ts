import { prisma } from "@/lib/prisma";

export interface OrderProcessingSettings {
  autoFulfillment: {
    enabled: boolean;
    threshold: number;
    excludeCategories: string[];
    requireInventoryCheck: boolean;
  };
  processingTimes: {
    standard: number;
    express: number;
    rush: number;
    weekendProcessing: boolean;
    holidayProcessing: boolean;
  };
  statusWorkflow: {
    autoConfirm: boolean;
    requirePaymentConfirmation: boolean;
    holdForReview: {
      enabled: boolean;
      threshold: number;
      keywords: string[];
    };
  };
  fulfillment: {
    warehouseLocation: string;
    packagingNotes: string;
    qualityCheckRequired: boolean;
    signatureRequired: {
      enabled: boolean;
      threshold: number;
    };
  };
  notifications: {
    orderConfirmation: boolean;
    processingUpdate: boolean;
    shippingNotification: boolean;
    deliveryConfirmation: boolean;
    adminAlerts: {
      highValueOrders: boolean;
      outOfStockItems: boolean;
      failedPayments: boolean;
    };
  };
}

/**
 * Get order processing settings from the database
 */
export async function getOrderProcessingSettings(): Promise<OrderProcessingSettings | null> {
  try {
    const settings = await prisma.storeSettings.findFirst();

    if (!settings?.orderProcessing) {
      return null;
    }

    return settings.orderProcessing as OrderProcessingSettings;
  } catch (error) {
    console.error("Error fetching order processing settings:", error);
    return null;
  }
}

/**
 * Determine if an order should be auto-fulfilled based on settings
 */
export async function shouldAutoFulfillOrder(
  orderTotal: number,
  orderItems: any[]
): Promise<boolean> {
  try {
    const settings = await getOrderProcessingSettings();

    if (!settings || !settings.autoFulfillment.enabled) {
      return false;
    }

    // Check order value threshold
    if (orderTotal < settings.autoFulfillment.threshold) {
      return false;
    }

    // Check if any items are in excluded categories
    if (settings.autoFulfillment.excludeCategories.length > 0) {
      const hasExcludedCategory = orderItems.some(
        item =>
          item.product?.category &&
          settings.autoFulfillment.excludeCategories.includes(
            item.product.category.id
          )
      );

      if (hasExcludedCategory) {
        return false;
      }
    }

    // Check inventory if required
    if (settings.autoFulfillment.requireInventoryCheck) {
      const hasOutOfStockItems = orderItems.some(
        item => item.product && item.product.stock < item.quantity
      );

      if (hasOutOfStockItems) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error checking auto-fulfillment:", error);
    return false;
  }
}

/**
 * Calculate processing time for an order based on shipping method and settings
 */
export async function calculateProcessingTime(
  shippingMethod: string
): Promise<number> {
  try {
    const settings = await getOrderProcessingSettings();

    if (!settings) {
      return 24; // Default 24 hours
    }

    let processingTime = settings.processingTimes.standard;

    // Adjust based on shipping method
    switch (shippingMethod.toLowerCase()) {
      case "express":
        processingTime = settings.processingTimes.express;
        break;
      case "rush":
        processingTime = settings.processingTimes.rush;
        break;
      default:
        processingTime = settings.processingTimes.standard;
    }

    // Check if it's weekend and weekend processing is disabled
    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6; // Sunday or Saturday

    if (isWeekend && !settings.processingTimes.weekendProcessing) {
      // Add weekend delay (48 hours for Saturday, 24 hours for Sunday)
      const weekendDelay = now.getDay() === 6 ? 48 : 24;
      processingTime += weekendDelay;
    }

    return processingTime;
  } catch (error) {
    console.error("Error calculating processing time:", error);
    return 24; // Default fallback
  }
}

/**
 * Determine if an order should be held for review
 */
export async function shouldHoldForReview(
  orderTotal: number,
  orderNotes?: string
): Promise<boolean> {
  try {
    const settings = await getOrderProcessingSettings();

    if (!settings || !settings.statusWorkflow.holdForReview.enabled) {
      return false;
    }

    // Check order value threshold
    if (orderTotal >= settings.statusWorkflow.holdForReview.threshold) {
      return true;
    }

    // Check for keywords in order notes
    if (
      orderNotes &&
      settings.statusWorkflow.holdForReview.keywords.length > 0
    ) {
      const lowerNotes = orderNotes.toLowerCase();
      const hasKeyword = settings.statusWorkflow.holdForReview.keywords.some(
        keyword => lowerNotes.includes(keyword.toLowerCase())
      );

      if (hasKeyword) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking hold for review:", error);
    return false;
  }
}

/**
 * Determine if signature is required for delivery
 */
export async function isSignatureRequired(
  orderTotal: number
): Promise<boolean> {
  try {
    const settings = await getOrderProcessingSettings();

    if (!settings || !settings.fulfillment.signatureRequired.enabled) {
      return false;
    }

    return orderTotal >= settings.fulfillment.signatureRequired.threshold;
  } catch (error) {
    console.error("Error checking signature requirement:", error);
    return false;
  }
}

/**
 * Get warehouse location for fulfillment
 */
export async function getWarehouseLocation(): Promise<string> {
  try {
    const settings = await getOrderProcessingSettings();
    return settings?.fulfillment.warehouseLocation || "Main Warehouse";
  } catch (error) {
    console.error("Error getting warehouse location:", error);
    return "Main Warehouse";
  }
}

/**
 * Get packaging notes for fulfillment
 */
export async function getPackagingNotes(): Promise<string> {
  try {
    const settings = await getOrderProcessingSettings();
    return settings?.fulfillment.packagingNotes || "";
  } catch (error) {
    console.error("Error getting packaging notes:", error);
    return "";
  }
}

/**
 * Check if quality check is required
 */
export async function isQualityCheckRequired(): Promise<boolean> {
  try {
    const settings = await getOrderProcessingSettings();
    return settings?.fulfillment.qualityCheckRequired || false;
  } catch (error) {
    console.error("Error checking quality check requirement:", error);
    return false;
  }
}

/**
 * Get notification settings for order processing
 */
export async function getNotificationSettings(): Promise<
  OrderProcessingSettings["notifications"] | null
> {
  try {
    const settings = await getOrderProcessingSettings();
    return settings?.notifications || null;
  } catch (error) {
    console.error("Error getting notification settings:", error);
    return null;
  }
}

/**
 * Check if admin should be alerted for high value orders
 */
export async function shouldAlertHighValueOrder(
  orderTotal: number
): Promise<boolean> {
  try {
    const settings = await getOrderProcessingSettings();
    return settings?.notifications.adminAlerts.highValueOrders || false;
  } catch (error) {
    console.error("Error checking high value alert:", error);
    return false;
  }
}

/**
 * Check if admin should be alerted for out of stock items
 */
export async function shouldAlertOutOfStock(): Promise<boolean> {
  try {
    const settings = await getOrderProcessingSettings();
    return settings?.notifications.adminAlerts.outOfStockItems || false;
  } catch (error) {
    console.error("Error checking out of stock alert:", error);
    return false;
  }
}

/**
 * Check if admin should be alerted for failed payments
 */
export async function shouldAlertFailedPayment(): Promise<boolean> {
  try {
    const settings = await getOrderProcessingSettings();
    return settings?.notifications.adminAlerts.failedPayments || false;
  } catch (error) {
    console.error("Error checking failed payment alert:", error);
    return false;
  }
}
