import { prisma } from "@/lib/prisma";

export interface InventoryManagementSettings {
  stockAlerts: {
    enabled: boolean;
    lowStockThreshold: number;
    outOfStockAlert: boolean;
    reorderPointAlert: boolean;
    emailNotifications: boolean;
    adminNotifications: boolean;
    supplierNotifications: boolean;
  };
  reorderManagement: {
    enabled: boolean;
    reorderPoint: number;
    reorderQuantity: number;
    autoReorder: boolean;
    requireApproval: boolean;
    supplierEmail: string;
    reorderFrequency: "daily" | "weekly" | "monthly";
  };
  inventoryTracking: {
    enabled: boolean;
    trackExpiryDates: boolean;
    trackBatchNumbers: boolean;
    trackSerialNumbers: boolean;
    barcodeScanning: boolean;
    qrCodeSupport: boolean;
    locationTracking: boolean;
    warehouseZones: string[];
  };
  stockAdjustments: {
    allowNegativeStock: boolean;
    backorderEnabled: boolean;
    reserveStockForOrders: boolean;
    reserveThreshold: number;
    autoAdjustStock: boolean;
    adjustmentReasonRequired: boolean;
  };
  inventoryReports: {
    dailyStockReport: boolean;
    weeklyInventoryReport: boolean;
    monthlyValueReport: boolean;
    lowStockReport: boolean;
    slowMovingItemsReport: boolean;
    expiryDateReport: boolean;
    reportRecipients: string[];
  };
  supplierManagement: {
    enabled: boolean;
    supplierDirectory: boolean;
    supplierPerformance: boolean;
    leadTimeTracking: boolean;
    costTracking: boolean;
    supplierNotifications: boolean;
  };
  automatedInventory: {
    enabled: boolean;
    autoUpdateStock: boolean;
    syncWithPOS: boolean;
    syncWithEcommerce: boolean;
    realTimeUpdates: boolean;
    inventoryAPI: boolean;
  };
}

/**
 * Get inventory management settings from the database
 */
export async function getInventoryManagementSettings(): Promise<InventoryManagementSettings | null> {
  try {
    const settings = await prisma.storeSettings.findFirst();

    if (!settings?.inventoryManagement) {
      return null;
    }

    return settings.inventoryManagement as InventoryManagementSettings;
  } catch (error) {
    console.error("Error fetching inventory management settings:", error);
    return null;
  }
}

/**
 * Check if stock alerts are enabled and should be triggered
 */
export async function shouldTriggerStockAlert(
  currentStock: number,
  alertType: "lowStock" | "outOfStock" | "reorderPoint"
): Promise<boolean> {
  try {
    const settings = await getInventoryManagementSettings();

    if (!settings || !settings.stockAlerts.enabled) {
      return false;
    }

    switch (alertType) {
      case "lowStock":
        return currentStock <= settings.stockAlerts.lowStockThreshold;
      case "outOfStock":
        return currentStock === 0 && settings.stockAlerts.outOfStockAlert;
      case "reorderPoint":
        return (
          currentStock <= settings.reorderManagement.reorderPoint &&
          settings.stockAlerts.reorderPointAlert
        );
      default:
        return false;
    }
  } catch (error) {
    console.error("Error checking stock alert:", error);
    return false;
  }
}

/**
 * Determine if auto-reorder should be triggered
 */
export async function shouldAutoReorder(
  currentStock: number
): Promise<boolean> {
  try {
    const settings = await getInventoryManagementSettings();

    if (
      !settings ||
      !settings.reorderManagement.enabled ||
      !settings.reorderManagement.autoReorder
    ) {
      return false;
    }

    return currentStock <= settings.reorderManagement.reorderPoint;
  } catch (error) {
    console.error("Error checking auto-reorder:", error);
    return false;
  }
}

/**
 * Get the recommended reorder quantity
 */
export async function getReorderQuantity(): Promise<number> {
  try {
    const settings = await getInventoryManagementSettings();
    return settings?.reorderManagement.reorderQuantity || 100;
  } catch (error) {
    console.error("Error getting reorder quantity:", error);
    return 100; // Default fallback
  }
}

/**
 * Check if reorder approval is required
 */
export async function isReorderApprovalRequired(): Promise<boolean> {
  try {
    const settings = await getInventoryManagementSettings();
    return settings?.reorderManagement.requireApproval || false;
  } catch (error) {
    console.error("Error checking reorder approval requirement:", error);
    return false;
  }
}

/**
 * Get supplier email for reorder notifications
 */
export async function getSupplierEmail(): Promise<string> {
  try {
    const settings = await getInventoryManagementSettings();
    return settings?.reorderManagement.supplierEmail || "";
  } catch (error) {
    console.error("Error getting supplier email:", error);
    return "";
  }
}

/**
 * Check if inventory tracking is enabled
 */
export async function isInventoryTrackingEnabled(): Promise<boolean> {
  try {
    const settings = await getInventoryManagementSettings();
    return settings?.inventoryTracking.enabled || false;
  } catch (error) {
    console.error("Error checking inventory tracking:", error);
    return false;
  }
}

/**
 * Check if specific tracking features are enabled
 */
export async function isTrackingFeatureEnabled(
  feature:
    | "expiryDates"
    | "batchNumbers"
    | "serialNumbers"
    | "location"
    | "barcode"
    | "qrCode"
): Promise<boolean> {
  try {
    const settings = await getInventoryManagementSettings();

    if (!settings?.inventoryTracking.enabled) {
      return false;
    }

    switch (feature) {
      case "expiryDates":
        return settings.inventoryTracking.trackExpiryDates;
      case "batchNumbers":
        return settings.inventoryTracking.trackBatchNumbers;
      case "serialNumbers":
        return settings.inventoryTracking.trackSerialNumbers;
      case "location":
        return settings.inventoryTracking.locationTracking;
      case "barcode":
        return settings.inventoryTracking.barcodeScanning;
      case "qrCode":
        return settings.inventoryTracking.qrCodeSupport;
      default:
        return false;
    }
  } catch (error) {
    console.error("Error checking tracking feature:", error);
    return false;
  }
}

/**
 * Get warehouse zones for location tracking
 */
export async function getWarehouseZones(): Promise<string[]> {
  try {
    const settings = await getInventoryManagementSettings();
    return settings?.inventoryTracking.warehouseZones || [];
  } catch (error) {
    console.error("Error getting warehouse zones:", error);
    return [];
  }
}

/**
 * Check if negative stock is allowed
 */
export async function isNegativeStockAllowed(): Promise<boolean> {
  try {
    const settings = await getInventoryManagementSettings();
    return settings?.stockAdjustments.allowNegativeStock || false;
  } catch (error) {
    console.error("Error checking negative stock allowance:", error);
    return false;
  }
}

/**
 * Check if backorders are enabled
 */
export async function isBackorderEnabled(): Promise<boolean> {
  try {
    const settings = await getInventoryManagementSettings();
    return settings?.stockAdjustments.backorderEnabled || false;
  } catch (error) {
    console.error("Error checking backorder status:", error);
    return false;
  }
}

/**
 * Check if stock should be reserved for orders
 */
export async function shouldReserveStockForOrders(): Promise<boolean> {
  try {
    const settings = await getInventoryManagementSettings();
    return settings?.stockAdjustments.reserveStockForOrders || false;
  } catch (error) {
    console.error("Error checking stock reservation:", error);
    return false;
  }
}

/**
 * Get the reserve threshold percentage
 */
export async function getReserveThreshold(): Promise<number> {
  try {
    const settings = await getInventoryManagementSettings();
    return settings?.stockAdjustments.reserveThreshold || 0;
  } catch (error) {
    console.error("Error getting reserve threshold:", error);
    return 0;
  }
}

/**
 * Check if auto stock adjustment is enabled
 */
export async function isAutoStockAdjustmentEnabled(): Promise<boolean> {
  try {
    const settings = await getInventoryManagementSettings();
    return settings?.stockAdjustments.autoAdjustStock || false;
  } catch (error) {
    console.error("Error checking auto stock adjustment:", error);
    return false;
  }
}

/**
 * Check if adjustment reason is required
 */
export async function isAdjustmentReasonRequired(): Promise<boolean> {
  try {
    const settings = await getInventoryManagementSettings();
    return settings?.stockAdjustments.adjustmentReasonRequired || false;
  } catch (error) {
    console.error("Error checking adjustment reason requirement:", error);
    return false;
  }
}

/**
 * Get inventory report settings
 */
export async function getInventoryReportSettings(): Promise<
  InventoryManagementSettings["inventoryReports"] | null
> {
  try {
    const settings = await getInventoryManagementSettings();
    return settings?.inventoryReports || null;
  } catch (error) {
    console.error("Error getting inventory report settings:", error);
    return null;
  }
}

/**
 * Check if specific report is enabled
 */
export async function isReportEnabled(
  reportType:
    | "dailyStock"
    | "weeklyInventory"
    | "monthlyValue"
    | "lowStock"
    | "slowMoving"
    | "expiryDate"
): Promise<boolean> {
  try {
    const settings = await getInventoryManagementSettings();

    if (!settings?.inventoryReports) {
      return false;
    }

    switch (reportType) {
      case "dailyStock":
        return settings.inventoryReports.dailyStockReport;
      case "weeklyInventory":
        return settings.inventoryReports.weeklyInventoryReport;
      case "monthlyValue":
        return settings.inventoryReports.monthlyValueReport;
      case "lowStock":
        return settings.inventoryReports.lowStockReport;
      case "slowMoving":
        return settings.inventoryReports.slowMovingItemsReport;
      case "expiryDate":
        return settings.inventoryReports.expiryDateReport;
      default:
        return false;
    }
  } catch (error) {
    console.error("Error checking report status:", error);
    return false;
  }
}

/**
 * Get report recipients
 */
export async function getReportRecipients(): Promise<string[]> {
  try {
    const settings = await getInventoryManagementSettings();
    return settings?.inventoryReports.reportRecipients || [];
  } catch (error) {
    console.error("Error getting report recipients:", error);
    return [];
  }
}

/**
 * Check if supplier management is enabled
 */
export async function isSupplierManagementEnabled(): Promise<boolean> {
  try {
    const settings = await getInventoryManagementSettings();
    return settings?.supplierManagement.enabled || false;
  } catch (error) {
    console.error("Error checking supplier management:", error);
    return false;
  }
}

/**
 * Check if specific supplier features are enabled
 */
export async function isSupplierFeatureEnabled(
  feature:
    | "directory"
    | "performance"
    | "leadTime"
    | "costTracking"
    | "notifications"
): Promise<boolean> {
  try {
    const settings = await getInventoryManagementSettings();

    if (!settings?.supplierManagement.enabled) {
      return false;
    }

    switch (feature) {
      case "directory":
        return settings.supplierManagement.supplierDirectory;
      case "performance":
        return settings.supplierManagement.supplierPerformance;
      case "leadTime":
        return settings.supplierManagement.leadTimeTracking;
      case "costTracking":
        return settings.supplierManagement.costTracking;
      case "notifications":
        return settings.supplierManagement.supplierNotifications;
      default:
        return false;
    }
  } catch (error) {
    console.error("Error checking supplier feature:", error);
    return false;
  }
}

/**
 * Check if automated inventory is enabled
 */
export async function isAutomatedInventoryEnabled(): Promise<boolean> {
  try {
    const settings = await getInventoryManagementSettings();
    return settings?.automatedInventory.enabled || false;
  } catch (error) {
    console.error("Error checking automated inventory:", error);
    return false;
  }
}

/**
 * Check if specific automation features are enabled
 */
export async function isAutomationFeatureEnabled(
  feature:
    | "autoUpdateStock"
    | "syncWithPOS"
    | "syncWithEcommerce"
    | "realTimeUpdates"
    | "inventoryAPI"
): Promise<boolean> {
  try {
    const settings = await getInventoryManagementSettings();

    if (!settings?.automatedInventory.enabled) {
      return false;
    }

    switch (feature) {
      case "autoUpdateStock":
        return settings.automatedInventory.autoUpdateStock;
      case "syncWithPOS":
        return settings.automatedInventory.syncWithPOS;
      case "syncWithEcommerce":
        return settings.automatedInventory.syncWithEcommerce;
      case "realTimeUpdates":
        return settings.automatedInventory.realTimeUpdates;
      case "inventoryAPI":
        return settings.automatedInventory.inventoryAPI;
      default:
        return false;
    }
  } catch (error) {
    console.error("Error checking automation feature:", error);
    return false;
  }
}

/**
 * Calculate available stock considering reservations
 */
export async function calculateAvailableStock(
  currentStock: number
): Promise<number> {
  try {
    const settings = await getInventoryManagementSettings();

    if (!settings?.stockAdjustments.reserveStockForOrders) {
      return currentStock;
    }

    const reserveThreshold = settings.stockAdjustments.reserveThreshold;
    const reservedAmount = Math.floor((currentStock * reserveThreshold) / 100);

    return Math.max(0, currentStock - reservedAmount);
  } catch (error) {
    console.error("Error calculating available stock:", error);
    return currentStock;
  }
}

/**
 * Check if stock adjustment is allowed
 */
export async function isStockAdjustmentAllowed(
  currentStock: number,
  adjustmentAmount: number
): Promise<boolean> {
  try {
    const settings = await getInventoryManagementSettings();

    if (settings?.stockAdjustments.allowNegativeStock) {
      return true;
    }

    const newStock = currentStock + adjustmentAmount;
    return newStock >= 0;
  } catch (error) {
    console.error("Error checking stock adjustment allowance:", error);
    return false;
  }
}

/**
 * Get notification settings for inventory alerts
 */
export async function getInventoryNotificationSettings(): Promise<{
  email: boolean;
  admin: boolean;
  supplier: boolean;
} | null> {
  try {
    const settings = await getInventoryManagementSettings();

    if (!settings?.stockAlerts.enabled) {
      return null;
    }

    return {
      email: settings.stockAlerts.emailNotifications,
      admin: settings.stockAlerts.adminNotifications,
      supplier: settings.stockAlerts.supplierNotifications,
    };
  } catch (error) {
    console.error("Error getting inventory notification settings:", error);
    return null;
  }
}
