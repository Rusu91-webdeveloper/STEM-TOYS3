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

interface OrderProcessing {
  // Auto-fulfillment settings
  autoFulfillment: {
    enabled: boolean;
    threshold: number; // Order value threshold for auto-fulfillment
    excludeCategories: string[]; // Categories that require manual review
    requireInventoryCheck: boolean;
  };

  // Processing times
  processingTimes: {
    standard: number; // Hours
    express: number; // Hours
    rush: number; // Hours
    weekendProcessing: boolean;
    holidayProcessing: boolean;
  };

  // Order status workflow
  statusWorkflow: {
    autoConfirm: boolean;
    requirePaymentConfirmation: boolean;
    holdForReview: {
      enabled: boolean;
      threshold: number; // Order value threshold for manual review
      keywords: string[]; // Keywords that trigger review
    };
  };

  // Fulfillment settings
  fulfillment: {
    warehouseLocation: string;
    packagingNotes: string;
    qualityCheckRequired: boolean;
    signatureRequired: {
      enabled: boolean;
      threshold: number; // Order value threshold for signature
    };
  };

  // Notification settings
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

interface OrderProcessingSettingsProps {
  orderProcessing: OrderProcessing;
  onSave: (orderProcessing: OrderProcessing) => void;
  isSaving: boolean;
}

export default function OrderProcessingSettings({
  orderProcessing,
  onSave,
  isSaving,
}: OrderProcessingSettingsProps) {
  const [localOrderProcessing, setLocalOrderProcessing] =
    React.useState<OrderProcessing>(orderProcessing);

  const updateField = (path: string, value: any) => {
    setLocalOrderProcessing(prev => {
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
    onSave(localOrderProcessing);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Processing & Fulfillment</CardTitle>
        <CardDescription>
          Configure order processing workflows, auto-fulfillment rules, and
          fulfillment settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto-fulfillment Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Auto-Fulfillment Settings</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="auto-fulfillment-enabled">
                Enable Auto-Fulfillment
              </Label>
              <Switch
                checked={localOrderProcessing.autoFulfillment.enabled}
                onCheckedChange={checked =>
                  updateField("autoFulfillment.enabled", checked)
                }
                id="auto-fulfillment-enabled"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auto-fulfillment-threshold">
                Order Value Threshold (LEI)
              </Label>
              <Input
                id="auto-fulfillment-threshold"
                value={localOrderProcessing.autoFulfillment.threshold}
                onChange={e =>
                  updateField(
                    "autoFulfillment.threshold",
                    parseFloat(e.target.value) || 0
                  )
                }
                type="number"
                min="0"
                step="0.01"
                placeholder="100.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="require-inventory-check">
                Require Inventory Check
              </Label>
              <Switch
                checked={
                  localOrderProcessing.autoFulfillment.requireInventoryCheck
                }
                onCheckedChange={checked =>
                  updateField("autoFulfillment.requireInventoryCheck", checked)
                }
                id="require-inventory-check"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Processing Times */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Processing Times (Hours)</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="standard-processing">Standard Orders</Label>
              <Input
                id="standard-processing"
                value={localOrderProcessing.processingTimes.standard}
                onChange={e =>
                  updateField(
                    "processingTimes.standard",
                    parseInt(e.target.value) || 0
                  )
                }
                type="number"
                min="0"
                placeholder="24"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="express-processing">Express Orders</Label>
              <Input
                id="express-processing"
                value={localOrderProcessing.processingTimes.express}
                onChange={e =>
                  updateField(
                    "processingTimes.express",
                    parseInt(e.target.value) || 0
                  )
                }
                type="number"
                min="0"
                placeholder="4"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rush-processing">Rush Orders</Label>
              <Input
                id="rush-processing"
                value={localOrderProcessing.processingTimes.rush}
                onChange={e =>
                  updateField(
                    "processingTimes.rush",
                    parseInt(e.target.value) || 0
                  )
                }
                type="number"
                min="0"
                placeholder="2"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="weekend-processing">Weekend Processing</Label>
              <Switch
                checked={localOrderProcessing.processingTimes.weekendProcessing}
                onCheckedChange={checked =>
                  updateField("processingTimes.weekendProcessing", checked)
                }
                id="weekend-processing"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="holiday-processing">Holiday Processing</Label>
              <Switch
                checked={localOrderProcessing.processingTimes.holidayProcessing}
                onCheckedChange={checked =>
                  updateField("processingTimes.holidayProcessing", checked)
                }
                id="holiday-processing"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Order Status Workflow */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Order Status Workflow</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="auto-confirm">Auto-Confirm Orders</Label>
              <Switch
                checked={localOrderProcessing.statusWorkflow.autoConfirm}
                onCheckedChange={checked =>
                  updateField("statusWorkflow.autoConfirm", checked)
                }
                id="auto-confirm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="require-payment-confirmation">
                Require Payment Confirmation
              </Label>
              <Switch
                checked={
                  localOrderProcessing.statusWorkflow.requirePaymentConfirmation
                }
                onCheckedChange={checked =>
                  updateField(
                    "statusWorkflow.requirePaymentConfirmation",
                    checked
                  )
                }
                id="require-payment-confirmation"
              />
            </div>
          </div>

          {/* Hold for Review Settings */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hold-for-review-enabled">
                Hold Orders for Review
              </Label>
              <Switch
                checked={
                  localOrderProcessing.statusWorkflow.holdForReview.enabled
                }
                onCheckedChange={checked =>
                  updateField("statusWorkflow.holdForReview.enabled", checked)
                }
                id="hold-for-review-enabled"
              />
            </div>
            {localOrderProcessing.statusWorkflow.holdForReview.enabled && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="review-threshold">
                    Review Threshold (LEI)
                  </Label>
                  <Input
                    id="review-threshold"
                    value={
                      localOrderProcessing.statusWorkflow.holdForReview
                        .threshold
                    }
                    onChange={e =>
                      updateField(
                        "statusWorkflow.holdForReview.threshold",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="500.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="review-keywords">
                    Review Keywords (comma-separated)
                  </Label>
                  <Input
                    id="review-keywords"
                    value={localOrderProcessing.statusWorkflow.holdForReview.keywords.join(
                      ", "
                    )}
                    onChange={e =>
                      updateField(
                        "statusWorkflow.holdForReview.keywords",
                        e.target.value
                          .split(",")
                          .map(k => k.trim())
                          .filter(k => k)
                      )
                    }
                    type="text"
                    placeholder="bulk, wholesale, reseller"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Fulfillment Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Fulfillment Settings</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="warehouse-location">Warehouse Location</Label>
              <Input
                id="warehouse-location"
                value={localOrderProcessing.fulfillment.warehouseLocation}
                onChange={e =>
                  updateField("fulfillment.warehouseLocation", e.target.value)
                }
                type="text"
                placeholder="Bucharest, Romania"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quality-check-required">
                Require Quality Check
              </Label>
              <Switch
                checked={localOrderProcessing.fulfillment.qualityCheckRequired}
                onCheckedChange={checked =>
                  updateField("fulfillment.qualityCheckRequired", checked)
                }
                id="quality-check-required"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="packaging-notes">Packaging Notes</Label>
            <Textarea
              id="packaging-notes"
              value={localOrderProcessing.fulfillment.packagingNotes}
              onChange={e =>
                updateField("fulfillment.packagingNotes", e.target.value)
              }
              placeholder="Special packaging instructions..."
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signature-required-enabled">
                Require Signature Delivery
              </Label>
              <Switch
                checked={
                  localOrderProcessing.fulfillment.signatureRequired.enabled
                }
                onCheckedChange={checked =>
                  updateField("fulfillment.signatureRequired.enabled", checked)
                }
                id="signature-required-enabled"
              />
            </div>
            {localOrderProcessing.fulfillment.signatureRequired.enabled && (
              <div className="space-y-2">
                <Label htmlFor="signature-threshold">
                  Signature Threshold (LEI)
                </Label>
                <Input
                  id="signature-threshold"
                  value={
                    localOrderProcessing.fulfillment.signatureRequired.threshold
                  }
                  onChange={e =>
                    updateField(
                      "fulfillment.signatureRequired.threshold",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="200.00"
                />
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Notification Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Notification Settings</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="order-confirmation">Order Confirmation</Label>
              <Switch
                checked={localOrderProcessing.notifications.orderConfirmation}
                onCheckedChange={checked =>
                  updateField("notifications.orderConfirmation", checked)
                }
                id="order-confirmation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="processing-update">Processing Updates</Label>
              <Switch
                checked={localOrderProcessing.notifications.processingUpdate}
                onCheckedChange={checked =>
                  updateField("notifications.processingUpdate", checked)
                }
                id="processing-update"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping-notification">
                Shipping Notifications
              </Label>
              <Switch
                checked={
                  localOrderProcessing.notifications.shippingNotification
                }
                onCheckedChange={checked =>
                  updateField("notifications.shippingNotification", checked)
                }
                id="shipping-notification"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery-confirmation">
                Delivery Confirmation
              </Label>
              <Switch
                checked={
                  localOrderProcessing.notifications.deliveryConfirmation
                }
                onCheckedChange={checked =>
                  updateField("notifications.deliveryConfirmation", checked)
                }
                id="delivery-confirmation"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-md font-medium">Admin Alerts</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="high-value-alerts">High Value Orders</Label>
                <Switch
                  checked={
                    localOrderProcessing.notifications.adminAlerts
                      .highValueOrders
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "notifications.adminAlerts.highValueOrders",
                      checked
                    )
                  }
                  id="high-value-alerts"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="out-of-stock-alerts">Out of Stock Items</Label>
                <Switch
                  checked={
                    localOrderProcessing.notifications.adminAlerts
                      .outOfStockItems
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "notifications.adminAlerts.outOfStockItems",
                      checked
                    )
                  }
                  id="out-of-stock-alerts"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="failed-payment-alerts">Failed Payments</Label>
                <Switch
                  checked={
                    localOrderProcessing.notifications.adminAlerts
                      .failedPayments
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "notifications.adminAlerts.failedPayments",
                      checked
                    )
                  }
                  id="failed-payment-alerts"
                />
              </div>
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
