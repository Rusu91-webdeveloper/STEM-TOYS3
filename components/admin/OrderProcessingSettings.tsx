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
              <div className="flex items-center gap-1">
                <Label htmlFor="auto-fulfillment-enabled">
                  Enable Auto-Fulfillment
                </Label>
                <HelpTooltip
                  content={
                    <div className="space-y-2">
                      <p className="font-medium">Auto-Fulfillment</p>
                      <p>
                        When enabled, orders that meet your criteria will be
                        automatically processed and marked as "fulfilled"
                        without manual intervention.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Example:</strong> A customer orders a €50 STEM
                        toy. If auto-fulfillment is enabled and the order meets
                        your threshold, it will automatically move to
                        "processing" status and then "fulfilled" without you
                        having to manually approve it.
                      </p>
                    </div>
                  }
                />
              </div>
              <Switch
                checked={localOrderProcessing.autoFulfillment.enabled}
                onCheckedChange={checked =>
                  updateField("autoFulfillment.enabled", checked)
                }
                id="auto-fulfillment-enabled"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="auto-fulfillment-threshold">
                  Order Value Threshold (LEI)
                </Label>
                <HelpTooltip
                  content={
                    <div className="space-y-2">
                      <p className="font-medium">Order Value Threshold</p>
                      <p>
                        Only orders above this value will be automatically
                        fulfilled. Orders below this amount will require manual
                        review.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Example:</strong> If set to 500 LEI, only orders
                        worth €100+ (500 LEI) will be auto-fulfilled. A €30
                        order (150 LEI) would require manual approval to prevent
                        fraud or ensure quality control.
                      </p>
                    </div>
                  }
                />
              </div>
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
              <div className="flex items-center gap-1">
                <Label htmlFor="require-inventory-check">
                  Require Inventory Check
                </Label>
                <HelpTooltip
                  content={
                    <div className="space-y-2">
                      <p className="font-medium">Inventory Check Requirement</p>
                      <p>
                        Before auto-fulfilling an order, the system will verify
                        that all items are in stock. If any item is out of
                        stock, the order will be held for manual review.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Example:</strong> A customer orders 3 robotics
                        kits. If inventory check is enabled and only 2 kits are
                        in stock, the order won't be auto-fulfilled and will
                        wait for you to either restock or contact the customer.
                      </p>
                    </div>
                  }
                />
              </div>
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
              <div className="flex items-center gap-1">
                <Label htmlFor="standard-processing">Standard Orders</Label>
                <HelpTooltip
                  content={
                    <div className="space-y-2">
                      <p className="font-medium">Standard Processing Time</p>
                      <p>
                        The number of hours it takes to process standard orders
                        from "confirmed" to "processing" status.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Example:</strong> If set to 24 hours, a standard
                        order placed at 2 PM will start processing at 2 PM the
                        next day. This gives you time to review the order and
                        prepare it for fulfillment.
                      </p>
                    </div>
                  }
                />
              </div>
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
              <div className="flex items-center gap-1">
                <Label htmlFor="express-processing">Express Orders</Label>
                <HelpTooltip
                  content={
                    <div className="space-y-2">
                      <p className="font-medium">Express Processing Time</p>
                      <p>
                        The number of hours it takes to process express orders
                        from "confirmed" to "processing" status. Express orders
                        are prioritized for faster handling.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Example:</strong> If set to 4 hours, an express
                        order placed at 10 AM will start processing at 2 PM the
                        same day. This is ideal for customers who paid extra for
                        faster service.
                      </p>
                    </div>
                  }
                />
              </div>
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
              <div className="flex items-center gap-1">
                <Label htmlFor="rush-processing">Rush Orders</Label>
                <HelpTooltip
                  content={
                    <div className="space-y-2">
                      <p className="font-medium">Rush Processing Time</p>
                      <p>
                        The number of hours it takes to process rush orders from
                        "confirmed" to "processing" status. Rush orders get the
                        highest priority.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Example:</strong> If set to 2 hours, a rush
                        order placed at 1 PM will start processing at 3 PM the
                        same day. Perfect for urgent orders or VIP customers.
                      </p>
                    </div>
                  }
                />
              </div>
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
              <div className="flex items-center gap-1">
                <Label htmlFor="weekend-processing">Weekend Processing</Label>
                <HelpTooltip
                  content={
                    <div className="space-y-2">
                      <p className="font-medium">Weekend Processing</p>
                      <p>
                        When enabled, orders will continue to be processed
                        during weekends (Saturday and Sunday). When disabled,
                        weekend orders will wait until Monday.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Example:</strong> If enabled, an order placed on
                        Friday at 5 PM will start processing on Saturday. If
                        disabled, it will wait until Monday morning to start
                        processing.
                      </p>
                    </div>
                  }
                />
              </div>
              <Switch
                checked={localOrderProcessing.processingTimes.weekendProcessing}
                onCheckedChange={checked =>
                  updateField("processingTimes.weekendProcessing", checked)
                }
                id="weekend-processing"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="holiday-processing">Holiday Processing</Label>
                <HelpTooltip
                  content={
                    <div className="space-y-2">
                      <p className="font-medium">Holiday Processing</p>
                      <p>
                        When enabled, orders will continue to be processed
                        during public holidays. When disabled, holiday orders
                        will wait until the next business day.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Example:</strong> If enabled, an order placed on
                        Christmas Eve will start processing on Christmas Day. If
                        disabled, it will wait until December 26th to start
                        processing.
                      </p>
                    </div>
                  }
                />
              </div>
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
              <div className="flex items-center gap-1">
                <Label htmlFor="auto-confirm">Auto-Confirm Orders</Label>
                <HelpTooltip
                  content={
                    <div className="space-y-2">
                      <p className="font-medium">Auto-Confirm Orders</p>
                      <p>
                        When enabled, orders will automatically move from
                        "pending" to "confirmed" status without manual approval.
                        When disabled, all orders require manual confirmation.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Example:</strong> If enabled, a customer's order
                        will automatically become "confirmed" after payment. If
                        disabled, you'll need to manually review and confirm
                        each order before it can be processed.
                      </p>
                    </div>
                  }
                />
              </div>
              <Switch
                checked={localOrderProcessing.statusWorkflow.autoConfirm}
                onCheckedChange={checked =>
                  updateField("statusWorkflow.autoConfirm", checked)
                }
                id="auto-confirm"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="require-payment-confirmation">
                  Require Payment Confirmation
                </Label>
                <HelpTooltip
                  content={
                    <div className="space-y-2">
                      <p className="font-medium">
                        Payment Confirmation Requirement
                      </p>
                      <p>
                        When enabled, orders will only be confirmed after
                        payment is successfully processed. When disabled, orders
                        can be confirmed even if payment is pending.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Example:</strong> If enabled, an order will only
                        move to "confirmed" status after Stripe/PayPal confirms
                        the payment. If disabled, the order might be confirmed
                        before payment is fully processed.
                      </p>
                    </div>
                  }
                />
              </div>
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
              <div className="flex items-center gap-1">
                <Label htmlFor="hold-for-review-enabled">
                  Hold Orders for Review
                </Label>
                <HelpTooltip
                  content={
                    <div className="space-y-2">
                      <p className="font-medium">Hold Orders for Review</p>
                      <p>
                        When enabled, orders meeting certain criteria will be
                        held in "pending review" status instead of being
                        automatically processed. This helps prevent fraud and
                        ensures quality control.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Example:</strong> If enabled, orders above a
                        certain value or containing specific keywords will be
                        flagged for manual review before processing. This is
                        useful for catching suspicious orders or bulk purchases.
                      </p>
                    </div>
                  }
                />
              </div>
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
                  <div className="flex items-center gap-1">
                    <Label htmlFor="review-threshold">
                      Review Threshold (LEI)
                    </Label>
                    <HelpTooltip
                      content={
                        <div className="space-y-2">
                          <p className="font-medium">Review Threshold</p>
                          <p>
                            Orders above this value will be automatically held
                            for manual review instead of being processed
                            automatically.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Example:</strong> If set to 2500 LEI (€500),
                            any order worth more than €500 will be flagged for
                            review. This helps catch high-value orders that
                            might need special attention or verification.
                          </p>
                        </div>
                      }
                    />
                  </div>
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
                  <div className="flex items-center gap-1">
                    <Label htmlFor="review-keywords">
                      Review Keywords (comma-separated)
                    </Label>
                    <HelpTooltip
                      content={
                        <div className="space-y-2">
                          <p className="font-medium">Review Keywords</p>
                          <p>
                            Orders containing any of these keywords in customer
                            notes, shipping address, or other fields will be
                            automatically held for review.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Example:</strong> If you add "bulk,
                            wholesale, reseller", any order with these words in
                            the customer's notes will be flagged for review.
                            This helps identify business customers or potential
                            resellers.
                          </p>
                        </div>
                      }
                    />
                  </div>
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
              <div className="flex items-center gap-1">
                <Label htmlFor="warehouse-location">Warehouse Location</Label>
                <HelpTooltip
                  content={
                    <div className="space-y-2">
                      <p className="font-medium">Warehouse Location</p>
                      <p>
                        The primary location where orders are fulfilled from.
                        This information is used for shipping calculations and
                        customer communication.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Example:</strong> "Bucharest, Romania" - This
                        helps calculate shipping costs and delivery times.
                        Customers will see this as the origin point for their
                        orders.
                      </p>
                    </div>
                  }
                />
              </div>
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
              <div className="flex items-center gap-1">
                <Label htmlFor="quality-check-required">
                  Require Quality Check
                </Label>
                <HelpTooltip
                  content={
                    <div className="space-y-2">
                      <p className="font-medium">Quality Check Requirement</p>
                      <p>
                        When enabled, all orders must pass a quality check
                        before being shipped. This ensures products meet your
                        standards before reaching customers.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Example:</strong> If enabled, staff will inspect
                        each STEM toy for defects, proper packaging, and
                        completeness before shipping. This reduces returns and
                        improves customer satisfaction.
                      </p>
                    </div>
                  }
                />
              </div>
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
            <div className="flex items-center gap-1">
              <Label htmlFor="packaging-notes">Packaging Notes</Label>
              <HelpTooltip
                content={
                  <div className="space-y-2">
                    <p className="font-medium">Packaging Notes</p>
                    <p>
                      Special instructions for packaging orders. These notes
                      will be visible to fulfillment staff when preparing orders
                      for shipment.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Example:</strong> "Pack carefully, use bubble wrap
                      for electronics, include instruction manuals" - This helps
                      ensure consistent, high-quality packaging for all orders.
                    </p>
                  </div>
                }
              />
            </div>
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
              <div className="flex items-center gap-1">
                <Label htmlFor="signature-required-enabled">
                  Require Signature Delivery
                </Label>
                <HelpTooltip
                  content={
                    <div className="space-y-2">
                      <p className="font-medium">Signature Required Delivery</p>
                      <p>
                        When enabled, orders above the specified threshold will
                        require a signature upon delivery. This provides extra
                        security for high-value orders.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Example:</strong> If enabled with a 500 LEI
                        threshold, any order worth €100+ will require the
                        customer to sign for delivery. This prevents package
                        theft and ensures delivery confirmation.
                      </p>
                    </div>
                  }
                />
              </div>
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
                <div className="flex items-center gap-1">
                  <Label htmlFor="signature-threshold">
                    Signature Threshold (LEI)
                  </Label>
                  <HelpTooltip
                    content={
                      <div className="space-y-2">
                        <p className="font-medium">Signature Threshold</p>
                        <p>
                          Orders above this value will require a signature upon
                          delivery. This helps protect high-value shipments from
                          theft or misdelivery.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Example:</strong> If set to 500 LEI (€100),
                          any order worth €100 or more will require signature
                          delivery. Orders below this amount can be left at the
                          door or with neighbors.
                        </p>
                      </div>
                    }
                  />
                </div>
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
              <div className="flex items-center gap-1">
                <Label htmlFor="order-confirmation">Order Confirmation</Label>
                <HelpTooltip
                  content={
                    <div className="space-y-2">
                      <p className="font-medium">Order Confirmation Email</p>
                      <p>
                        When enabled, customers will receive an email
                        confirmation immediately after placing an order. This
                        provides reassurance and order details.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Example:</strong> Customer places an order for a
                        robotics kit. They'll receive an email with order
                        number, items purchased, total amount, and estimated
                        delivery date.
                      </p>
                    </div>
                  }
                />
              </div>
              <Switch
                checked={localOrderProcessing.notifications.orderConfirmation}
                onCheckedChange={checked =>
                  updateField("notifications.orderConfirmation", checked)
                }
                id="order-confirmation"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="processing-update">Processing Updates</Label>
                <HelpTooltip
                  content={
                    <div className="space-y-2">
                      <p className="font-medium">Processing Update Emails</p>
                      <p>
                        When enabled, customers will receive email updates when
                        their order status changes to "processing" or other
                        intermediate statuses.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Example:</strong> Customer receives an email
                        when their order moves from "confirmed" to "processing",
                        letting them know their STEM toy is being prepared for
                        shipment.
                      </p>
                    </div>
                  }
                />
              </div>
              <Switch
                checked={localOrderProcessing.notifications.processingUpdate}
                onCheckedChange={checked =>
                  updateField("notifications.processingUpdate", checked)
                }
                id="processing-update"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="shipping-notification">
                  Shipping Notifications
                </Label>
                <HelpTooltip
                  content={
                    <div className="space-y-2">
                      <p className="font-medium">
                        Shipping Notification Emails
                      </p>
                      <p>
                        When enabled, customers will receive an email when their
                        order is shipped, including tracking information and
                        estimated delivery date.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Example:</strong> Customer receives an email
                        with tracking number and courier information when their
                        robotics kit is dispatched from the warehouse.
                      </p>
                    </div>
                  }
                />
              </div>
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
              <div className="flex items-center gap-1">
                <Label htmlFor="delivery-confirmation">
                  Delivery Confirmation
                </Label>
                <HelpTooltip
                  content={
                    <div className="space-y-2">
                      <p className="font-medium">Delivery Confirmation Email</p>
                      <p>
                        When enabled, customers will receive an email
                        confirmation when their order is successfully delivered,
                        including delivery details and satisfaction survey.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Example:</strong> Customer receives an email
                        confirming their STEM toy was delivered, along with a
                        link to leave a review and instructions for returns if
                        needed.
                      </p>
                    </div>
                  }
                />
              </div>
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
                <div className="flex items-center gap-1">
                  <Label htmlFor="high-value-alerts">High Value Orders</Label>
                  <HelpTooltip
                    content={
                      <div className="space-y-2">
                        <p className="font-medium">High Value Order Alerts</p>
                        <p>
                          When enabled, you'll receive email notifications when
                          orders above a certain value are placed, allowing you
                          to provide special attention to high-value customers.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Example:</strong> You receive an email alert
                          when someone places a €500+ order for multiple STEM
                          toys, allowing you to personally oversee the
                          fulfillment process.
                        </p>
                      </div>
                    }
                  />
                </div>
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
                <div className="flex items-center gap-1">
                  <Label htmlFor="out-of-stock-alerts">
                    Out of Stock Items
                  </Label>
                  <HelpTooltip
                    content={
                      <div className="space-y-2">
                        <p className="font-medium">Out of Stock Alerts</p>
                        <p>
                          When enabled, you'll receive email notifications when
                          products go out of stock, allowing you to quickly
                          restock popular items and avoid lost sales.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Example:</strong> You receive an email alert
                          when the last robotics kit is sold, prompting you to
                          reorder from your supplier before customers start
                          seeing "out of stock" messages.
                        </p>
                      </div>
                    }
                  />
                </div>
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
                <div className="flex items-center gap-1">
                  <Label htmlFor="failed-payment-alerts">Failed Payments</Label>
                  <HelpTooltip
                    content={
                      <div className="space-y-2">
                        <p className="font-medium">Failed Payment Alerts</p>
                        <p>
                          When enabled, you'll receive email notifications when
                          customer payments fail, allowing you to quickly
                          contact customers and resolve payment issues.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Example:</strong> You receive an email alert
                          when a customer's credit card is declined, allowing
                          you to contact them to update their payment
                          information before they abandon their cart.
                        </p>
                      </div>
                    }
                  />
                </div>
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
