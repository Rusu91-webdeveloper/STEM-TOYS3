import { NextRequest, NextResponse } from "next/server";

import {
  shouldTriggerStockAlert,
  shouldAutoReorder,
  getReorderQuantity,
  isReorderApprovalRequired,
  getSupplierEmail,
  isInventoryTrackingEnabled,
  isTrackingFeatureEnabled,
  getWarehouseZones,
  isNegativeStockAllowed,
  isBackorderEnabled,
  shouldReserveStockForOrders,
  getReserveThreshold,
  isAutoStockAdjustmentEnabled,
  isAdjustmentReasonRequired,
  isReportEnabled,
  getReportRecipients,
  isSupplierManagementEnabled,
  isSupplierFeatureEnabled,
  isAutomatedInventoryEnabled,
  isAutomationFeatureEnabled,
  calculateAvailableStock,
  isStockAdjustmentAllowed,
  getInventoryNotificationSettings,
} from "@/lib/utils/inventory-management";

/**
 * POST - Test inventory management functionality
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      currentStock,
      alertType,
      feature,
      reportType,
      supplierFeature,
      automationFeature,
    } = body;

    // Test all inventory management functions
    const results = {
      // Stock alerts
      lowStockAlert: await shouldTriggerStockAlert(
        currentStock || 5,
        "lowStock"
      ),
      outOfStockAlert: await shouldTriggerStockAlert(
        currentStock || 0,
        "outOfStock"
      ),
      reorderPointAlert: await shouldTriggerStockAlert(
        currentStock || 5,
        "reorderPoint"
      ),

      // Reorder management
      autoReorder: await shouldAutoReorder(currentStock || 5),
      reorderQuantity: await getReorderQuantity(),
      approvalRequired: await isReorderApprovalRequired(),
      supplierEmail: await getSupplierEmail(),

      // Inventory tracking
      trackingEnabled: await isInventoryTrackingEnabled(),
      expiryTracking: await isTrackingFeatureEnabled("expiryDates"),
      batchTracking: await isTrackingFeatureEnabled("batchNumbers"),
      serialTracking: await isTrackingFeatureEnabled("serialNumbers"),
      locationTracking: await isTrackingFeatureEnabled("location"),
      barcodeScanning: await isTrackingFeatureEnabled("barcode"),
      qrCodeSupport: await isTrackingFeatureEnabled("qrCode"),
      warehouseZones: await getWarehouseZones(),

      // Stock adjustments
      negativeStockAllowed: await isNegativeStockAllowed(),
      backorderEnabled: await isBackorderEnabled(),
      reserveStock: await shouldReserveStockForOrders(),
      reserveThreshold: await getReserveThreshold(),
      autoAdjustStock: await isAutoStockAdjustmentEnabled(),
      adjustmentReasonRequired: await isAdjustmentReasonRequired(),
      availableStock: await calculateAvailableStock(currentStock || 100),
      stockAdjustmentAllowed: await isStockAdjustmentAllowed(
        currentStock || 10,
        -5
      ),

      // Reports
      dailyReport: await isReportEnabled("dailyStock"),
      weeklyReport: await isReportEnabled("weeklyInventory"),
      monthlyReport: await isReportEnabled("monthlyValue"),
      lowStockReport: await isReportEnabled("lowStock"),
      slowMovingReport: await isReportEnabled("slowMoving"),
      expiryReport: await isReportEnabled("expiryDate"),
      reportRecipients: await getReportRecipients(),

      // Supplier management
      supplierManagement: await isSupplierManagementEnabled(),
      supplierDirectory: await isSupplierFeatureEnabled("directory"),
      supplierPerformance: await isSupplierFeatureEnabled("performance"),
      leadTimeTracking: await isSupplierFeatureEnabled("leadTime"),
      costTracking: await isSupplierFeatureEnabled("costTracking"),
      supplierNotifications: await isSupplierFeatureEnabled("notifications"),

      // Automated inventory
      automatedInventory: await isAutomatedInventoryEnabled(),
      autoUpdateStock: await isAutomationFeatureEnabled("autoUpdateStock"),
      syncWithPOS: await isAutomationFeatureEnabled("syncWithPOS"),
      syncWithEcommerce: await isAutomationFeatureEnabled("syncWithEcommerce"),
      realTimeUpdates: await isAutomationFeatureEnabled("realTimeUpdates"),
      inventoryAPI: await isAutomationFeatureEnabled("inventoryAPI"),

      // Notifications
      notificationSettings: await getInventoryNotificationSettings(),
    };

    return NextResponse.json({
      success: true,
      data: results,
      message: "Inventory management test completed successfully",
    });
  } catch (error) {
    console.error("Error testing inventory management:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test inventory management functionality",
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Get current inventory management settings
 */
export async function GET() {
  try {
    const { getInventoryManagementSettings } = await import(
      "@/lib/utils/inventory-management"
    );
    const settings = await getInventoryManagementSettings();

    return NextResponse.json({
      success: true,
      data: settings,
      message: "Inventory management settings retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting inventory management settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get inventory management settings",
      },
      { status: 500 }
    );
  }
}
