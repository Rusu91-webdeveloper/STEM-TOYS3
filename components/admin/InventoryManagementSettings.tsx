"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface InventoryManagement {
  // Stock alerts and notifications
  stockAlerts: {
    enabled: boolean;
    lowStockThreshold: number; // Minimum stock level before alert
    outOfStockAlert: boolean;
    reorderPointAlert: boolean;
    emailNotifications: boolean;
    adminNotifications: boolean;
    supplierNotifications: boolean;
  };

  // Reorder management
  reorderManagement: {
    enabled: boolean;
    reorderPoint: number; // Stock level to trigger reorder
    reorderQuantity: number; // Default quantity to reorder
    autoReorder: boolean;
    requireApproval: boolean;
    supplierEmail: string;
    reorderFrequency: "daily" | "weekly" | "monthly";
  };

  // Inventory tracking
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

  // Stock adjustments
  stockAdjustments: {
    allowNegativeStock: boolean;
    backorderEnabled: boolean;
    reserveStockForOrders: boolean;
    reserveThreshold: number; // Percentage of stock to reserve
    autoAdjustStock: boolean;
    adjustmentReasonRequired: boolean;
  };

  // Inventory reports
  inventoryReports: {
    dailyStockReport: boolean;
    weeklyInventoryReport: boolean;
    monthlyValueReport: boolean;
    lowStockReport: boolean;
    slowMovingItemsReport: boolean;
    expiryDateReport: boolean;
    reportRecipients: string[];
  };

  // Supplier management
  supplierManagement: {
    enabled: boolean;
    supplierDirectory: boolean;
    supplierPerformance: boolean;
    leadTimeTracking: boolean;
    costTracking: boolean;
    supplierNotifications: boolean;
  };

  // Automated inventory
  automatedInventory: {
    enabled: boolean;
    autoUpdateStock: boolean;
    syncWithPOS: boolean;
    syncWithEcommerce: boolean;
    realTimeUpdates: boolean;
    inventoryAPI: boolean;
  };
}

interface InventoryManagementSettingsProps {
  inventoryManagement: InventoryManagement;
  onSave: (inventoryManagement: InventoryManagement) => void;
  isSaving: boolean;
}

export default function InventoryManagementSettings({
  inventoryManagement,
  onSave,
  isSaving,
}: InventoryManagementSettingsProps) {
  const [localInventoryManagement, setLocalInventoryManagement] =
    React.useState<InventoryManagement>(inventoryManagement);

  const updateField = (path: string, value: any) => {
    setLocalInventoryManagement(prev => {
      const newState = { ...prev };
      const keys = path.split(".");
      let current: any = newState;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newState;
    });
  };

  const handleSave = () => {
    onSave(localInventoryManagement);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory & Stock Management</CardTitle>
        <CardDescription>
          Configure inventory tracking, stock alerts, reorder management, and
          automated inventory systems
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stock Alerts and Notifications */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Stock Alerts & Notifications
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stock-alerts-enabled">Enable Stock Alerts</Label>
              <Switch
                checked={localInventoryManagement.stockAlerts.enabled}
                onCheckedChange={checked =>
                  updateField("stockAlerts.enabled", checked)
                }
                id="stock-alerts-enabled"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="low-stock-threshold">Low Stock Threshold</Label>
              <Input
                id="low-stock-threshold"
                value={localInventoryManagement.stockAlerts.lowStockThreshold}
                onChange={e =>
                  updateField(
                    "stockAlerts.lowStockThreshold",
                    parseInt(e.target.value) || 0
                  )
                }
                type="number"
                min="0"
                placeholder="5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="out-of-stock-alert">Out of Stock Alert</Label>
              <Switch
                checked={localInventoryManagement.stockAlerts.outOfStockAlert}
                onCheckedChange={checked =>
                  updateField("stockAlerts.outOfStockAlert", checked)
                }
                id="out-of-stock-alert"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorder-point-alert">Reorder Point Alert</Label>
              <Switch
                checked={localInventoryManagement.stockAlerts.reorderPointAlert}
                onCheckedChange={checked =>
                  updateField("stockAlerts.reorderPointAlert", checked)
                }
                id="reorder-point-alert"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <Switch
                checked={
                  localInventoryManagement.stockAlerts.emailNotifications
                }
                onCheckedChange={checked =>
                  updateField("stockAlerts.emailNotifications", checked)
                }
                id="email-notifications"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="admin-notifications">Admin Notifications</Label>
              <Switch
                checked={
                  localInventoryManagement.stockAlerts.adminNotifications
                }
                onCheckedChange={checked =>
                  updateField("stockAlerts.adminNotifications", checked)
                }
                id="admin-notifications"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-notifications">
                Supplier Notifications
              </Label>
              <Switch
                checked={
                  localInventoryManagement.stockAlerts.supplierNotifications
                }
                onCheckedChange={checked =>
                  updateField("stockAlerts.supplierNotifications", checked)
                }
                id="supplier-notifications"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Reorder Management */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Reorder Management</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reorder-management-enabled">
                Enable Reorder Management
              </Label>
              <Switch
                checked={localInventoryManagement.reorderManagement.enabled}
                onCheckedChange={checked =>
                  updateField("reorderManagement.enabled", checked)
                }
                id="reorder-management-enabled"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auto-reorder">Auto Reorder</Label>
              <Switch
                checked={localInventoryManagement.reorderManagement.autoReorder}
                onCheckedChange={checked =>
                  updateField("reorderManagement.autoReorder", checked)
                }
                id="auto-reorder"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="reorder-point">Reorder Point</Label>
              <Input
                id="reorder-point"
                value={localInventoryManagement.reorderManagement.reorderPoint}
                onChange={e =>
                  updateField(
                    "reorderManagement.reorderPoint",
                    parseInt(e.target.value) || 0
                  )
                }
                type="number"
                min="0"
                placeholder="10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorder-quantity">Reorder Quantity</Label>
              <Input
                id="reorder-quantity"
                value={
                  localInventoryManagement.reorderManagement.reorderQuantity
                }
                onChange={e =>
                  updateField(
                    "reorderManagement.reorderQuantity",
                    parseInt(e.target.value) || 0
                  )
                }
                type="number"
                min="0"
                placeholder="50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorder-frequency">Reorder Frequency</Label>
              <Select
                value={
                  localInventoryManagement.reorderManagement.reorderFrequency
                }
                onValueChange={value =>
                  updateField("reorderManagement.reorderFrequency", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="require-approval">Require Approval</Label>
              <Switch
                checked={
                  localInventoryManagement.reorderManagement.requireApproval
                }
                onCheckedChange={checked =>
                  updateField("reorderManagement.requireApproval", checked)
                }
                id="require-approval"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-email">Supplier Email</Label>
              <Input
                id="supplier-email"
                value={localInventoryManagement.reorderManagement.supplierEmail}
                onChange={e =>
                  updateField("reorderManagement.supplierEmail", e.target.value)
                }
                type="email"
                placeholder="supplier@example.com"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Inventory Tracking */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Inventory Tracking</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="inventory-tracking-enabled">
                Enable Inventory Tracking
              </Label>
              <Switch
                checked={localInventoryManagement.inventoryTracking.enabled}
                onCheckedChange={checked =>
                  updateField("inventoryTracking.enabled", checked)
                }
                id="inventory-tracking-enabled"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location-tracking">Location Tracking</Label>
              <Switch
                checked={
                  localInventoryManagement.inventoryTracking.locationTracking
                }
                onCheckedChange={checked =>
                  updateField("inventoryTracking.locationTracking", checked)
                }
                id="location-tracking"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="track-expiry-dates">Track Expiry Dates</Label>
              <Switch
                checked={
                  localInventoryManagement.inventoryTracking.trackExpiryDates
                }
                onCheckedChange={checked =>
                  updateField("inventoryTracking.trackExpiryDates", checked)
                }
                id="track-expiry-dates"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="track-batch-numbers">Track Batch Numbers</Label>
              <Switch
                checked={
                  localInventoryManagement.inventoryTracking.trackBatchNumbers
                }
                onCheckedChange={checked =>
                  updateField("inventoryTracking.trackBatchNumbers", checked)
                }
                id="track-batch-numbers"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="track-serial-numbers">Track Serial Numbers</Label>
              <Switch
                checked={
                  localInventoryManagement.inventoryTracking.trackSerialNumbers
                }
                onCheckedChange={checked =>
                  updateField("inventoryTracking.trackSerialNumbers", checked)
                }
                id="track-serial-numbers"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="barcode-scanning">Barcode Scanning</Label>
              <Switch
                checked={
                  localInventoryManagement.inventoryTracking.barcodeScanning
                }
                onCheckedChange={checked =>
                  updateField("inventoryTracking.barcodeScanning", checked)
                }
                id="barcode-scanning"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qr-code-support">QR Code Support</Label>
              <Switch
                checked={
                  localInventoryManagement.inventoryTracking.qrCodeSupport
                }
                onCheckedChange={checked =>
                  updateField("inventoryTracking.qrCodeSupport", checked)
                }
                id="qr-code-support"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="warehouse-zones">
              Warehouse Zones (comma-separated)
            </Label>
            <Input
              id="warehouse-zones"
              value={localInventoryManagement.inventoryTracking.warehouseZones.join(
                ", "
              )}
              onChange={e =>
                updateField(
                  "inventoryTracking.warehouseZones",
                  e.target.value
                    .split(",")
                    .map(zone => zone.trim())
                    .filter(zone => zone)
                )
              }
              type="text"
              placeholder="Zone A, Zone B, Zone C"
            />
          </div>
        </div>

        <Separator />

        {/* Stock Adjustments */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Stock Adjustments</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="allow-negative-stock">Allow Negative Stock</Label>
              <Switch
                checked={
                  localInventoryManagement.stockAdjustments.allowNegativeStock
                }
                onCheckedChange={checked =>
                  updateField("stockAdjustments.allowNegativeStock", checked)
                }
                id="allow-negative-stock"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="backorder-enabled">Enable Backorders</Label>
              <Switch
                checked={
                  localInventoryManagement.stockAdjustments.backorderEnabled
                }
                onCheckedChange={checked =>
                  updateField("stockAdjustments.backorderEnabled", checked)
                }
                id="backorder-enabled"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="reserve-stock">Reserve Stock for Orders</Label>
              <Switch
                checked={
                  localInventoryManagement.stockAdjustments
                    .reserveStockForOrders
                }
                onCheckedChange={checked =>
                  updateField("stockAdjustments.reserveStockForOrders", checked)
                }
                id="reserve-stock"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auto-adjust-stock">Auto Adjust Stock</Label>
              <Switch
                checked={
                  localInventoryManagement.stockAdjustments.autoAdjustStock
                }
                onCheckedChange={checked =>
                  updateField("stockAdjustments.autoAdjustStock", checked)
                }
                id="auto-adjust-stock"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjustment-reason-required">
                Require Adjustment Reason
              </Label>
              <Switch
                checked={
                  localInventoryManagement.stockAdjustments
                    .adjustmentReasonRequired
                }
                onCheckedChange={checked =>
                  updateField(
                    "stockAdjustments.adjustmentReasonRequired",
                    checked
                  )
                }
                id="adjustment-reason-required"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reserve-threshold">Reserve Threshold (%)</Label>
            <Input
              id="reserve-threshold"
              value={localInventoryManagement.stockAdjustments.reserveThreshold}
              onChange={e =>
                updateField(
                  "stockAdjustments.reserveThreshold",
                  parseInt(e.target.value) || 0
                )
              }
              type="number"
              min="0"
              max="100"
              placeholder="10"
            />
          </div>
        </div>

        <Separator />

        {/* Inventory Reports */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Inventory Reports</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="daily-stock-report">Daily Stock Report</Label>
              <Switch
                checked={
                  localInventoryManagement.inventoryReports.dailyStockReport
                }
                onCheckedChange={checked =>
                  updateField("inventoryReports.dailyStockReport", checked)
                }
                id="daily-stock-report"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekly-inventory-report">
                Weekly Inventory Report
              </Label>
              <Switch
                checked={
                  localInventoryManagement.inventoryReports
                    .weeklyInventoryReport
                }
                onCheckedChange={checked =>
                  updateField("inventoryReports.weeklyInventoryReport", checked)
                }
                id="weekly-inventory-report"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly-value-report">Monthly Value Report</Label>
              <Switch
                checked={
                  localInventoryManagement.inventoryReports.monthlyValueReport
                }
                onCheckedChange={checked =>
                  updateField("inventoryReports.monthlyValueReport", checked)
                }
                id="monthly-value-report"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="low-stock-report">Low Stock Report</Label>
              <Switch
                checked={
                  localInventoryManagement.inventoryReports.lowStockReport
                }
                onCheckedChange={checked =>
                  updateField("inventoryReports.lowStockReport", checked)
                }
                id="low-stock-report"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slow-moving-items-report">
                Slow Moving Items Report
              </Label>
              <Switch
                checked={
                  localInventoryManagement.inventoryReports
                    .slowMovingItemsReport
                }
                onCheckedChange={checked =>
                  updateField("inventoryReports.slowMovingItemsReport", checked)
                }
                id="slow-moving-items-report"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry-date-report">Expiry Date Report</Label>
              <Switch
                checked={
                  localInventoryManagement.inventoryReports.expiryDateReport
                }
                onCheckedChange={checked =>
                  updateField("inventoryReports.expiryDateReport", checked)
                }
                id="expiry-date-report"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-recipients">
              Report Recipients (comma-separated emails)
            </Label>
            <Input
              id="report-recipients"
              value={localInventoryManagement.inventoryReports.reportRecipients.join(
                ", "
              )}
              onChange={e =>
                updateField(
                  "inventoryReports.reportRecipients",
                  e.target.value
                    .split(",")
                    .map(email => email.trim())
                    .filter(email => email)
                )
              }
              type="text"
              placeholder="admin@techtots.com, manager@techtots.com"
            />
          </div>
        </div>

        <Separator />

        {/* Supplier Management */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Supplier Management</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="supplier-management-enabled">
                Enable Supplier Management
              </Label>
              <Switch
                checked={localInventoryManagement.supplierManagement.enabled}
                onCheckedChange={checked =>
                  updateField("supplierManagement.enabled", checked)
                }
                id="supplier-management-enabled"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-directory">Supplier Directory</Label>
              <Switch
                checked={
                  localInventoryManagement.supplierManagement.supplierDirectory
                }
                onCheckedChange={checked =>
                  updateField("supplierManagement.supplierDirectory", checked)
                }
                id="supplier-directory"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-performance">Supplier Performance</Label>
              <Switch
                checked={
                  localInventoryManagement.supplierManagement
                    .supplierPerformance
                }
                onCheckedChange={checked =>
                  updateField("supplierManagement.supplierPerformance", checked)
                }
                id="supplier-performance"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-time-tracking">Lead Time Tracking</Label>
              <Switch
                checked={
                  localInventoryManagement.supplierManagement.leadTimeTracking
                }
                onCheckedChange={checked =>
                  updateField("supplierManagement.leadTimeTracking", checked)
                }
                id="lead-time-tracking"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost-tracking">Cost Tracking</Label>
              <Switch
                checked={
                  localInventoryManagement.supplierManagement.costTracking
                }
                onCheckedChange={checked =>
                  updateField("supplierManagement.costTracking", checked)
                }
                id="cost-tracking"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-notifications">
                Supplier Notifications
              </Label>
              <Switch
                checked={
                  localInventoryManagement.supplierManagement
                    .supplierNotifications
                }
                onCheckedChange={checked =>
                  updateField(
                    "supplierManagement.supplierNotifications",
                    checked
                  )
                }
                id="supplier-notifications"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Automated Inventory */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Automated Inventory</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="automated-inventory-enabled">
                Enable Automated Inventory
              </Label>
              <Switch
                checked={localInventoryManagement.automatedInventory.enabled}
                onCheckedChange={checked =>
                  updateField("automatedInventory.enabled", checked)
                }
                id="automated-inventory-enabled"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auto-update-stock">Auto Update Stock</Label>
              <Switch
                checked={
                  localInventoryManagement.automatedInventory.autoUpdateStock
                }
                onCheckedChange={checked =>
                  updateField("automatedInventory.autoUpdateStock", checked)
                }
                id="auto-update-stock"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sync-with-pos">Sync with POS</Label>
              <Switch
                checked={
                  localInventoryManagement.automatedInventory.syncWithPOS
                }
                onCheckedChange={checked =>
                  updateField("automatedInventory.syncWithPOS", checked)
                }
                id="sync-with-pos"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sync-with-ecommerce">Sync with E-commerce</Label>
              <Switch
                checked={
                  localInventoryManagement.automatedInventory.syncWithEcommerce
                }
                onCheckedChange={checked =>
                  updateField("automatedInventory.syncWithEcommerce", checked)
                }
                id="sync-with-ecommerce"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="real-time-updates">Real-time Updates</Label>
              <Switch
                checked={
                  localInventoryManagement.automatedInventory.realTimeUpdates
                }
                onCheckedChange={checked =>
                  updateField("automatedInventory.realTimeUpdates", checked)
                }
                id="real-time-updates"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inventory-api">Inventory API</Label>
              <Switch
                checked={
                  localInventoryManagement.automatedInventory.inventoryAPI
                }
                onCheckedChange={checked =>
                  updateField("automatedInventory.inventoryAPI", checked)
                }
                id="inventory-api"
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  );
}
