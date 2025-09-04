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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { HelpTooltip } from "@/components/ui/tooltip";

interface InventoryManagement {
  // Stock alerts and notifications (Dropshipping-focused)
  stockAlerts: {
    enabled: boolean;
    lowStockThreshold: number; // Minimum stock level before alert
    outOfStockAlert: boolean;
    emailNotifications: boolean;
    adminNotifications: boolean;
    supplierNotifications: boolean;
    priceChangeAlerts: boolean; // New: Alert when suppliers change prices
  };

  // Supplier stock synchronization (Dropshipping-specific)
  supplierStockSync: {
    enabled: boolean;
    syncFrequency: "realtime" | "hourly" | "daily";
    autoUpdateProductAvailability: boolean;
    syncPriceChanges: boolean;
    fallbackSuppliers: boolean; // Enable alternative suppliers for out-of-stock items
    stockBuffer: number; // Buffer stock to account for sync delays
  };

  // Lead time management (Critical for dropshipping)
  leadTimeManagement: {
    enabled: boolean;
    defaultLeadTime: number; // Default days for processing + shipping
    dynamicLeadTimes: boolean; // Calculate based on supplier location
    weekendProcessing: boolean;
    holidayProcessing: boolean;
    expressShippingAvailable: boolean;
    leadTimeBuffer: number; // Extra days buffer for safety
  };

  // Supplier performance tracking (Dropshipping-focused)
  supplierPerformance: {
    enabled: boolean;
    trackDeliveryTimes: boolean;
    trackStockAccuracy: boolean;
    trackPriceStability: boolean;
    performanceThreshold: number; // Minimum performance score
    autoDisablePoorPerformers: boolean;
    performanceReportFrequency: "weekly" | "monthly";
  };

  // Inventory reports (Simplified for dropshipping)
  inventoryReports: {
    lowStockReport: boolean;
    supplierPerformanceReport: boolean;
    priceChangeReport: boolean;
    leadTimeReport: boolean;
    reportRecipients: string[];
  };

  // Automated inventory (Dropshipping-optimized)
  automatedInventory: {
    enabled: boolean;
    realTimeUpdates: boolean;
    inventoryAPI: boolean;
    webhookSupport: boolean; // For supplier webhooks
    autoHideOutOfStock: boolean; // Hide products when suppliers are out of stock
    stockSyncRetryAttempts: number; // Retry failed syncs
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
        <CardTitle>Dropshipping Inventory Management</CardTitle>
        <CardDescription>
          Configure supplier stock synchronization, lead time management, and
          automated inventory systems optimized for dropshipping
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
              <div className="flex items-center gap-1">
                <Label htmlFor="stock-alerts-enabled">
                  Enable Stock Alerts
                </Label>
                <HelpTooltip content="Master switch for all stock-related notifications. When enabled, you'll receive alerts when suppliers are running low on inventory or out of stock." />
              </div>
              <Switch
                checked={localInventoryManagement.stockAlerts.enabled}
                onCheckedChange={checked =>
                  updateField("stockAlerts.enabled", checked)
                }
                id="stock-alerts-enabled"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="low-stock-threshold">Low Stock Threshold</Label>
                <HelpTooltip content="Number of units remaining before triggering a low stock alert. For example, if set to 5, you'll get notified when a supplier has only 5 units left of a product." />
              </div>
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
              <div className="flex items-center gap-1">
                <Label htmlFor="out-of-stock-alert">Out of Stock Alert</Label>
                <HelpTooltip content="Get notified immediately when a supplier runs out of stock for any product. This helps you quickly hide products or find alternative suppliers." />
              </div>
              <Switch
                checked={localInventoryManagement.stockAlerts.outOfStockAlert}
                onCheckedChange={checked =>
                  updateField("stockAlerts.outOfStockAlert", checked)
                }
                id="out-of-stock-alert"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="price-change-alerts">Price Change Alerts</Label>
                <HelpTooltip content="Receive notifications when suppliers change their prices. This helps you adjust your margins and stay competitive in the market." />
              </div>
              <Switch
                checked={localInventoryManagement.stockAlerts.priceChangeAlerts}
                onCheckedChange={checked =>
                  updateField("stockAlerts.priceChangeAlerts", checked)
                }
                id="price-change-alerts"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <HelpTooltip content="Send stock alerts via email to keep you informed even when you're not actively monitoring the admin panel." />
              </div>
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
              <div className="flex items-center gap-1">
                <Label htmlFor="admin-notifications">Admin Notifications</Label>
                <HelpTooltip content="Show stock alerts in the admin dashboard and notification center. Keep this enabled to stay informed about inventory issues." />
              </div>
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
              <div className="flex items-center gap-1">
                <Label htmlFor="supplier-notifications">
                  Supplier Notifications
                </Label>
                <HelpTooltip content="Automatically notify suppliers when their products are running low or out of stock. This helps them restock faster." />
              </div>
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

        {/* Supplier Stock Synchronization */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Supplier Stock Synchronization
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="supplier-stock-sync-enabled">
                  Enable Stock Sync
                </Label>
                <HelpTooltip content="Automatically sync inventory levels with your suppliers' systems. This ensures your website always shows accurate stock availability to customers." />
              </div>
              <Switch
                checked={localInventoryManagement.supplierStockSync.enabled}
                onCheckedChange={checked =>
                  updateField("supplierStockSync.enabled", checked)
                }
                id="supplier-stock-sync-enabled"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="sync-frequency">Sync Frequency</Label>
                <HelpTooltip content="How often to check and update stock levels. Real-time is most accurate but uses more resources. Hourly is a good balance for most businesses." />
              </div>
              <Select
                value={localInventoryManagement.supplierStockSync.syncFrequency}
                onValueChange={value =>
                  updateField("supplierStockSync.syncFrequency", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="auto-update-availability">
                  Auto Update Availability
                </Label>
                <HelpTooltip content="Automatically show/hide products on your website based on supplier stock levels. When a supplier runs out, the product is hidden from customers." />
              </div>
              <Switch
                checked={
                  localInventoryManagement.supplierStockSync
                    .autoUpdateProductAvailability
                }
                onCheckedChange={checked =>
                  updateField(
                    "supplierStockSync.autoUpdateProductAvailability",
                    checked
                  )
                }
                id="auto-update-availability"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="sync-price-changes">Sync Price Changes</Label>
                <HelpTooltip content="Automatically update your product prices when suppliers change their wholesale prices. This helps maintain consistent profit margins." />
              </div>
              <Switch
                checked={
                  localInventoryManagement.supplierStockSync.syncPriceChanges
                }
                onCheckedChange={checked =>
                  updateField("supplierStockSync.syncPriceChanges", checked)
                }
                id="sync-price-changes"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="fallback-suppliers">Fallback Suppliers</Label>
                <HelpTooltip content="When a primary supplier is out of stock, automatically switch to alternative suppliers for the same product. This reduces stockouts and improves customer experience." />
              </div>
              <Switch
                checked={
                  localInventoryManagement.supplierStockSync.fallbackSuppliers
                }
                onCheckedChange={checked =>
                  updateField("supplierStockSync.fallbackSuppliers", checked)
                }
                id="fallback-suppliers"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="stock-buffer">Stock Buffer (units)</Label>
              <HelpTooltip content="Extra units to subtract from supplier stock to account for sync delays and prevent overselling. For example, if set to 2, when a supplier has 10 units, your site shows 8 available." />
            </div>
            <Input
              id="stock-buffer"
              value={localInventoryManagement.supplierStockSync.stockBuffer}
              onChange={e =>
                updateField(
                  "supplierStockSync.stockBuffer",
                  parseInt(e.target.value) || 0
                )
              }
              type="number"
              min="0"
              placeholder="2"
            />
            <p className="text-xs text-muted-foreground">
              Extra stock buffer to account for sync delays
            </p>
          </div>
        </div>

        <Separator />

        {/* Lead Time Management */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Lead Time Management</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="lead-time-enabled">
                  Enable Lead Time Management
                </Label>
                <HelpTooltip content="Manage and display accurate shipping times to customers. This helps set proper expectations and reduces customer complaints about delivery delays." />
              </div>
              <Switch
                checked={localInventoryManagement.leadTimeManagement.enabled}
                onCheckedChange={checked =>
                  updateField("leadTimeManagement.enabled", checked)
                }
                id="lead-time-enabled"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="default-lead-time">
                  Default Lead Time (days)
                </Label>
                <HelpTooltip content="Standard processing and shipping time for most products. This includes supplier processing time plus shipping time to customers." />
              </div>
              <Input
                id="default-lead-time"
                value={
                  localInventoryManagement.leadTimeManagement.defaultLeadTime
                }
                onChange={e =>
                  updateField(
                    "leadTimeManagement.defaultLeadTime",
                    parseInt(e.target.value) || 0
                  )
                }
                type="number"
                min="0"
                placeholder="7"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="dynamic-lead-times">Dynamic Lead Times</Label>
                <HelpTooltip content="Automatically calculate lead times based on supplier location and shipping zones. This provides more accurate delivery estimates to customers." />
              </div>
              <Switch
                checked={
                  localInventoryManagement.leadTimeManagement.dynamicLeadTimes
                }
                onCheckedChange={checked =>
                  updateField("leadTimeManagement.dynamicLeadTimes", checked)
                }
                id="dynamic-lead-times"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="weekend-processing">Weekend Processing</Label>
                <HelpTooltip content="Allow suppliers to process and ship orders on weekends. This can reduce lead times but may increase costs." />
              </div>
              <Switch
                checked={
                  localInventoryManagement.leadTimeManagement.weekendProcessing
                }
                onCheckedChange={checked =>
                  updateField("leadTimeManagement.weekendProcessing", checked)
                }
                id="weekend-processing"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="express-shipping">
                  Express Shipping Available
                </Label>
                <HelpTooltip content="Offer express shipping options to customers for faster delivery. This typically costs more but provides better customer experience." />
              </div>
              <Switch
                checked={
                  localInventoryManagement.leadTimeManagement
                    .expressShippingAvailable
                }
                onCheckedChange={checked =>
                  updateField(
                    "leadTimeManagement.expressShippingAvailable",
                    checked
                  )
                }
                id="express-shipping"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="lead-time-buffer">Lead Time Buffer (days)</Label>
              <HelpTooltip content="Extra days added to lead times as a safety margin. This helps account for unexpected delays and ensures customers receive their orders on time or earlier than expected." />
            </div>
            <Input
              id="lead-time-buffer"
              value={localInventoryManagement.leadTimeManagement.leadTimeBuffer}
              onChange={e =>
                updateField(
                  "leadTimeManagement.leadTimeBuffer",
                  parseInt(e.target.value) || 0
                )
              }
              type="number"
              min="0"
              placeholder="2"
            />
            <p className="text-xs text-muted-foreground">
              Extra days buffer for safety margin
            </p>
          </div>
        </div>

        <Separator />

        {/* Supplier Performance Tracking */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Supplier Performance Tracking
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="supplier-performance-enabled">
                  Enable Performance Tracking
                </Label>
                <HelpTooltip content="Track supplier reliability metrics like delivery times, stock accuracy, and price stability. This helps you identify the best performing suppliers." />
              </div>
              <Switch
                checked={localInventoryManagement.supplierPerformance.enabled}
                onCheckedChange={checked =>
                  updateField("supplierPerformance.enabled", checked)
                }
                id="supplier-performance-enabled"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="performance-threshold">
                  Performance Threshold (%)
                </Label>
                <HelpTooltip content="Minimum performance score (0-100%) that suppliers must maintain. Suppliers below this threshold may be flagged for review or automatically disabled." />
              </div>
              <Input
                id="performance-threshold"
                value={
                  localInventoryManagement.supplierPerformance
                    .performanceThreshold
                }
                onChange={e =>
                  updateField(
                    "supplierPerformance.performanceThreshold",
                    parseInt(e.target.value) || 0
                  )
                }
                type="number"
                min="0"
                max="100"
                placeholder="80"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="track-delivery-times">
                  Track Delivery Times
                </Label>
                <HelpTooltip content="Monitor how long it takes suppliers to fulfill and ship orders. This helps identify suppliers who consistently meet or exceed delivery promises." />
              </div>
              <Switch
                checked={
                  localInventoryManagement.supplierPerformance
                    .trackDeliveryTimes
                }
                onCheckedChange={checked =>
                  updateField("supplierPerformance.trackDeliveryTimes", checked)
                }
                id="track-delivery-times"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="track-stock-accuracy">
                  Track Stock Accuracy
                </Label>
                <HelpTooltip content="Monitor how accurate supplier stock levels are compared to what they report. This helps identify suppliers with reliable inventory data." />
              </div>
              <Switch
                checked={
                  localInventoryManagement.supplierPerformance
                    .trackStockAccuracy
                }
                onCheckedChange={checked =>
                  updateField("supplierPerformance.trackStockAccuracy", checked)
                }
                id="track-stock-accuracy"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="track-price-stability">
                  Track Price Stability
                </Label>
                <HelpTooltip content="Monitor how often suppliers change their prices. Stable pricing helps you maintain consistent profit margins and pricing strategies." />
              </div>
              <Switch
                checked={
                  localInventoryManagement.supplierPerformance
                    .trackPriceStability
                }
                onCheckedChange={checked =>
                  updateField(
                    "supplierPerformance.trackPriceStability",
                    checked
                  )
                }
                id="track-price-stability"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="auto-disable-poor-performers">
                  Auto Disable Poor Performers
                </Label>
                <HelpTooltip content="Automatically disable suppliers who consistently perform below the threshold. This prevents poor-performing suppliers from affecting your business." />
              </div>
              <Switch
                checked={
                  localInventoryManagement.supplierPerformance
                    .autoDisablePoorPerformers
                }
                onCheckedChange={checked =>
                  updateField(
                    "supplierPerformance.autoDisablePoorPerformers",
                    checked
                  )
                }
                id="auto-disable-poor-performers"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="performance-report-frequency">
                  Report Frequency
                </Label>
                <HelpTooltip content="How often to generate supplier performance reports. Weekly reports help you stay on top of issues, while monthly reports provide broader insights." />
              </div>
              <Select
                value={
                  localInventoryManagement.supplierPerformance
                    .performanceReportFrequency
                }
                onValueChange={value =>
                  updateField(
                    "supplierPerformance.performanceReportFrequency",
                    value
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Inventory Reports */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Inventory Reports</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="low-stock-report">Low Stock Report</Label>
                <HelpTooltip content="Generate regular reports showing products that are running low on stock. This helps you proactively manage inventory and avoid stockouts." />
              </div>
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
              <div className="flex items-center gap-1">
                <Label htmlFor="supplier-performance-report">
                  Supplier Performance Report
                </Label>
                <HelpTooltip content="Generate detailed reports on supplier performance metrics including delivery times, stock accuracy, and price stability. Use this to make informed decisions about supplier relationships." />
              </div>
              <Switch
                checked={
                  localInventoryManagement.inventoryReports
                    .supplierPerformanceReport
                }
                onCheckedChange={checked =>
                  updateField(
                    "inventoryReports.supplierPerformanceReport",
                    checked
                  )
                }
                id="supplier-performance-report"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="price-change-report">Price Change Report</Label>
                <HelpTooltip content="Track and report on price changes from suppliers. This helps you monitor cost fluctuations and adjust your pricing strategy accordingly." />
              </div>
              <Switch
                checked={
                  localInventoryManagement.inventoryReports.priceChangeReport
                }
                onCheckedChange={checked =>
                  updateField("inventoryReports.priceChangeReport", checked)
                }
                id="price-change-report"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="lead-time-report">Lead Time Report</Label>
                <HelpTooltip content="Generate reports on actual vs. expected lead times. This helps you identify suppliers with consistent delivery performance and adjust customer expectations." />
              </div>
              <Switch
                checked={
                  localInventoryManagement.inventoryReports.leadTimeReport
                }
                onCheckedChange={checked =>
                  updateField("inventoryReports.leadTimeReport", checked)
                }
                id="lead-time-report"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="report-recipients">
                Report Recipients (comma-separated emails)
              </Label>
              <HelpTooltip content="Email addresses that will receive automated inventory reports. Separate multiple emails with commas. These reports help keep your team informed about inventory status and supplier performance." />
            </div>
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

        {/* Automated Inventory */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Automated Inventory</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="automated-inventory-enabled">
                  Enable Automated Inventory
                </Label>
                <HelpTooltip content="Master switch for all automated inventory features. When enabled, the system will automatically manage stock levels, product availability, and supplier synchronization without manual intervention." />
              </div>
              <Switch
                checked={localInventoryManagement.automatedInventory.enabled}
                onCheckedChange={checked =>
                  updateField("automatedInventory.enabled", checked)
                }
                id="automated-inventory-enabled"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="real-time-updates">Real-time Updates</Label>
                <HelpTooltip content="Update inventory levels and product availability in real-time as changes occur. This provides the most accurate information to customers but may use more system resources." />
              </div>
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
              <div className="flex items-center gap-1">
                <Label htmlFor="inventory-api">Inventory API</Label>
                <HelpTooltip content="Enable API access for inventory management. This allows external systems and suppliers to directly update inventory levels and product information through API calls." />
              </div>
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
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="webhook-support">Webhook Support</Label>
                <HelpTooltip content="Enable webhook notifications for inventory changes. This allows you to receive instant notifications when stock levels change, products become unavailable, or other inventory events occur." />
              </div>
              <Switch
                checked={
                  localInventoryManagement.automatedInventory.webhookSupport
                }
                onCheckedChange={checked =>
                  updateField("automatedInventory.webhookSupport", checked)
                }
                id="webhook-support"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="auto-hide-out-of-stock">
                  Auto Hide Out of Stock
                </Label>
                <HelpTooltip content="Automatically hide products from your website when they go out of stock. This prevents customers from ordering unavailable items and improves the shopping experience." />
              </div>
              <Switch
                checked={
                  localInventoryManagement.automatedInventory.autoHideOutOfStock
                }
                onCheckedChange={checked =>
                  updateField("automatedInventory.autoHideOutOfStock", checked)
                }
                id="auto-hide-out-of-stock"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="stock-sync-retry-attempts">
                  Sync Retry Attempts
                </Label>
                <HelpTooltip content="Number of times to retry failed inventory synchronization attempts. Higher values improve reliability but may slow down the system if suppliers are consistently unavailable." />
              </div>
              <Input
                id="stock-sync-retry-attempts"
                value={
                  localInventoryManagement.automatedInventory
                    .stockSyncRetryAttempts
                }
                onChange={e =>
                  updateField(
                    "automatedInventory.stockSyncRetryAttempts",
                    parseInt(e.target.value) || 0
                  )
                }
                type="number"
                min="0"
                max="10"
                placeholder="3"
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
