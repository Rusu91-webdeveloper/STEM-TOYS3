"use client";

import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  Ban,
  AlertCircle,
  Save,
  RefreshCw,
  ShoppingCart,
  Plus,
  Edit,
  Mail,
  Copy,
  MessageSquareWarning,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useCurrency } from "@/lib/currency";

// Types
type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isDigital: boolean;
  returnStatus: string | null;
  isBook: boolean;
  sku?: string | null;
  supplierName?: string | null;
  supplierOrderStatus?: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    sku?: string | null;
  } | null;
  book: {
    id: string;
    name: string;
    author: string;
    slug: string;
    coverImage: string;
  } | null;
};

type ShipmentSummary = {
  id: string;
  courier: string;
  awbNumber: string | null;
  status: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type SupplierFulfillmentPhase =
  | "READY_TO_PLACE"
  | "PLACED_TO_SUPPLIER"
  | "AWB_PENDING"
  | "AWB_UPLOADED"
  | "SHIPPED"
  | "DELIVERED"
  | "ISSUE_OOS"
  | "ISSUE_DELAYED"
  | "CANCELLED"
  | "REFUNDED"
  | "UNKNOWN";

type SupplierShipmentTaskGroup = {
  key: string;
  supplierId: string | null;
  supplierName: string;
  lineCount: number;
  totalQuantity: number;
  displayStatus: string;
  dbOrderStatus: string;
  phases: SupplierFulfillmentPhase[];
  trackingNumbers: string[];
  lines: Array<{
    supplierOrderId?: string;
    lineStatus?: string | null;
    phase: SupplierFulfillmentPhase;
    productName: string | null;
    quantity: number;
    trackingNumber: string | null;
  }>;
};

type FulfillmentSummary = {
  displayStatus: string;
  dbOrderStatus: string;
  hasMixedSuppliers: boolean;
  supplierCount: number;
  hasIssues: boolean;
  counts: Record<string, number>;
  supplierShipmentGroups: SupplierShipmentTaskGroup[];
};

type OrderDetails = {
  id: string;
  orderNumber: string;
  customer: string;
  email: string;
  date: string;
  deliveredAt?: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingMethod?: string;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discountAmount: number;
  couponCode: string | null;
  total: number;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  items: OrderItem[];
  shipments?: ShipmentSummary[];
  supplierOrders?: SupplierOrder[];
  fulfillment?: FulfillmentSummary;
};

type SupplierOrder = {
  id: string;
  orderItemId?: string;
  supplierId: string;
  supplierName: string;
  productId: string;
  productName: string;
  sku?: string | null;
  quantity: number;
  unitCost: number;
  totalCost: number;
  status: string;
  phase?: SupplierFulfillmentPhase;
  trackingNumber?: string | null;
  supplierOrderId?: string | null;
  carrier?: string | null;
  shippedAt?: string | null;
  estimatedDelivery?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  notes?: string | null;
};

type OosNotificationChannel = "EMAIL" | "PHONE" | "WHATSAPP" | "SMS" | "OTHER";

type OosNoteEvent = {
  tag: string;
  timestamp?: Date;
  timestampText?: string;
  data: Record<string, string>;
  raw: string;
};

const OOS_NOTIFICATION_CHANNEL_OPTIONS: OosNotificationChannel[] = [
  "EMAIL",
  "PHONE",
  "WHATSAPP",
  "SMS",
  "OTHER",
];

const OOS_SLA_WARNING_HOURS = 24;

const formatOosEventLabel = (tag: string) =>
  tag
    .replace(/^OOS_/, "")
    .toLowerCase()
    .split("_")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const parseOosNoteEvents = (notes?: string | null): OosNoteEvent[] => {
  if (!notes) return [];

  return notes
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.startsWith("[OOS_"))
    .map(line => {
      const tagMatch = line.match(/^\[(OOS_[A-Z_]+)\]\s*(.*)$/);
      if (!tagMatch) {
        return {
          tag: "OOS_UNKNOWN",
          raw: line,
          data: {},
        } as OosNoteEvent;
      }

      const [, tag, restRaw] = tagMatch;
      const segments = restRaw
        .split(" ; ")
        .map(seg => seg.trim())
        .filter(Boolean);
      const timestampText = segments[0];
      const parsedTimestamp = timestampText
        ? new Date(timestampText)
        : undefined;
      const timestamp =
        parsedTimestamp && !Number.isNaN(parsedTimestamp.getTime())
          ? parsedTimestamp
          : undefined;

      const data: Record<string, string> = {};
      for (const segment of segments.slice(1)) {
        const idx = segment.indexOf("=");
        if (idx <= 0) continue;
        const key = segment.slice(0, idx).trim();
        const value = segment.slice(idx + 1).trim();
        if (key) data[key] = value;
      }

      return {
        tag,
        timestamp,
        timestampText,
        data,
        raw: line,
      };
    })
    .sort((a, b) => {
      const at = a.timestamp?.getTime() ?? 0;
      const bt = b.timestamp?.getTime() ?? 0;
      return bt - at;
    });
};

const getLatestOosEvent = (events: OosNoteEvent[], tags: string[]) =>
  events.find(event => tags.includes(event.tag));

const getOosOpsSnapshot = (supplierOrder: SupplierOrder) => {
  const events = parseOosNoteEvents(supplierOrder.notes);
  const latestDecision = getLatestOosEvent(events, ["OOS_DECISION"]);
  const latestNotification = getLatestOosEvent(events, [
    "OOS_CUSTOMER_NOTIFIED",
  ]);
  const latestResponse = getLatestOosEvent(events, ["OOS_CUSTOMER_RESPONSE"]);

  const issueDecisionAt = latestDecision?.timestamp
    ? latestDecision.timestamp
    : supplierOrder.createdAt
      ? new Date(supplierOrder.createdAt)
      : null;
  const lastActivityAt = supplierOrder.updatedAt
    ? new Date(supplierOrder.updatedAt)
    : supplierOrder.createdAt
      ? new Date(supplierOrder.createdAt)
      : null;

  const issueAgeHours =
    issueDecisionAt && !Number.isNaN(issueDecisionAt.getTime())
      ? (Date.now() - issueDecisionAt.getTime()) / (1000 * 60 * 60)
      : null;

  const inactivityHours =
    lastActivityAt && !Number.isNaN(lastActivityAt.getTime())
      ? (Date.now() - lastActivityAt.getTime()) / (1000 * 60 * 60)
      : null;

  const latestDecisionTs = latestDecision?.timestamp?.getTime() ?? 0;
  const latestNotificationTs = latestNotification?.timestamp?.getTime() ?? 0;

  const needsCustomerNotification =
    Boolean(latestDecision) &&
    (!latestNotification || latestNotificationTs < latestDecisionTs);

  const isSlaOverdue =
    typeof inactivityHours === "number" &&
    inactivityHours >= OOS_SLA_WARNING_HOURS;

  return {
    events,
    latestDecision,
    latestNotification,
    latestResponse,
    issueAgeHours,
    inactivityHours,
    needsCustomerNotification,
    isSlaOverdue,
  };
};

// Helper functions
const getStatusIcon = (status: string) => {
  switch (status.toUpperCase()) {
    case "COMPLETED":
    case "DELIVERED":
      return <CheckCircle2 className="h-4 w-4" />;
    case "PROCESSING":
      return <Clock className="h-4 w-4" />;
    case "SHIPPED":
      return <Truck className="h-4 w-4" />;
    case "CANCELLED":
      return <Ban className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case "COMPLETED":
    case "DELIVERED":
      return "bg-green-100 text-green-800";
    case "PROCESSING":
      return "bg-blue-100 text-blue-800";
    case "SHIPPED":
      return "bg-purple-100 text-purple-800";
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatStatus = (status: string): string =>
  status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

const SUPPLIER_WORKFLOW_STATUS_OPTIONS = [
  "PENDING",
  "CONFIRMED",
  "IN_PRODUCTION",
  "READY_TO_SHIP",
  "PLACED_TO_SUPPLIER",
  "AWB_PENDING",
  "AWB_UPLOADED",
  "SHIPPED",
  "DELIVERED",
  "ISSUE_OOS",
  "ISSUE_DELAYED",
  "CANCELLED",
  "REFUNDED",
] as const;

const QUICK_SUPPLIER_WORKFLOW_ACTIONS: Array<{
  status: string;
  label: string;
  description: string;
  requiresTracking?: boolean;
}> = [
  {
    status: "PLACED_TO_SUPPLIER",
    label: "Placed to Supplier",
    description: "Use after you place the order on the supplier website",
  },
  {
    status: "AWB_UPLOADED",
    label: "AWB Uploaded",
    description: "Use after you save supplier AWB / tracking",
    requiresTracking: true,
  },
  {
    status: "SHIPPED",
    label: "Shipped",
    description: "Use after supplier/courier confirms pickup",
    requiresTracking: true,
  },
  {
    status: "DELIVERED",
    label: "Delivered",
    description: "Use when delivery is confirmed",
  },
];

const getSupplierLineWorkflowHint = (supplierOrder: SupplierOrder) => {
  const phase = supplierOrder.phase || "UNKNOWN";
  const hasTracking = Boolean(supplierOrder.trackingNumber?.trim());

  if (phase === "ISSUE_OOS" || phase === "ISSUE_DELAYED") {
    return {
      title: "Resolve supplier issue",
      description:
        "Use the OOS/Delayed workflow below, contact the customer, then continue fulfillment.",
      tone: "warning" as const,
    };
  }

  if (phase === "DELIVERED" || supplierOrder.status === "DELIVERED") {
    return {
      title: "Done",
      description: "This supplier line is completed.",
      tone: "success" as const,
    };
  }

  if (phase === "SHIPPED" || supplierOrder.status === "SHIPPED") {
    return {
      title: "Next step",
      description: "Monitor the shipment and mark Delivered when courier confirms delivery.",
      tone: "info" as const,
    };
  }

  if (hasTracking && (phase === "AWB_UPLOADED" || phase === "AWB_PENDING")) {
    return {
      title: "Next step",
      description:
        "Tracking is saved. Mark Shipped after pickup/dispatch is confirmed.",
      tone: "info" as const,
    };
  }

  if (hasTracking) {
    return {
      title: "Next step",
      description:
        "Tracking exists. Click AWB Uploaded (or Shipped if already dispatched).",
      tone: "info" as const,
    };
  }

  if (
    phase === "PLACED_TO_SUPPLIER" ||
    supplierOrder.status === "PLACED_TO_SUPPLIER"
  ) {
    return {
      title: "Next step",
      description:
        "Wait for supplier AWB, then save tracking and click AWB Uploaded.",
      tone: "info" as const,
    };
  }

  return {
    title: "Next step",
    description:
      "Place the order on the supplier website, then click Placed to Supplier.",
    tone: "warning" as const,
  };
};

type OosResolutionAction =
  | "WAIT_RESTOCK"
  | "OFFER_REPLACEMENT"
  | "PARTIAL_REFUND_ITEM"
  | "REPLACEMENT_CONFIRMED";

const OOS_RESOLUTION_OPTIONS: Array<{
  value: OosResolutionAction;
  label: string;
  targetStatus: string;
  detailPlaceholder: string;
}> = [
  {
    value: "WAIT_RESTOCK",
    label: "Wait for Restock",
    targetStatus: "ISSUE_DELAYED",
    detailPlaceholder:
      "ETA from supplier (example: 3-5 days) or cutoff for customer reply",
  },
  {
    value: "OFFER_REPLACEMENT",
    label: "Offer Replacement",
    targetStatus: "ISSUE_OOS",
    detailPlaceholder: "Replacement options / SKUs / price difference",
  },
  {
    value: "PARTIAL_REFUND_ITEM",
    label: "Partial Refund (Item)",
    targetStatus: "CANCELLED",
    detailPlaceholder: "Refund timing / reference / who approved",
  },
  {
    value: "REPLACEMENT_CONFIRMED",
    label: "Replacement Confirmed",
    targetStatus: "READY_TO_PLACE",
    detailPlaceholder: "Approved replacement item + internal note",
  },
];

const OOS_ACTION_TO_TARGET_STATUS: Record<OosResolutionAction, string> =
  Object.fromEntries(
    OOS_RESOLUTION_OPTIONS.map(option => [option.value, option.targetStatus])
  ) as Record<OosResolutionAction, string>;

const formatWorkflowLabel = (value: string): string =>
  value
    .toLowerCase()
    .split("_")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getFulfillmentBadgeColor = (status: string) => {
  switch (status.toUpperCase()) {
    case "PARTIALLY_SHIPPED":
      return "bg-amber-100 text-amber-800";
    case "SHIPPED":
      return "bg-purple-100 text-purple-800";
    case "DELIVERED":
      return "bg-green-100 text-green-800";
    case "ISSUE":
      return "bg-red-100 text-red-800";
    case "PROCESSING":
      return "bg-blue-100 text-blue-800";
    case "CANCELLED":
      return "bg-gray-200 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getPhaseColor = (phase?: string) => {
  switch ((phase || "").toUpperCase()) {
    case "READY_TO_PLACE":
      return "bg-yellow-100 text-yellow-800";
    case "PLACED_TO_SUPPLIER":
      return "bg-blue-100 text-blue-800";
    case "AWB_PENDING":
      return "bg-orange-100 text-orange-800";
    case "AWB_UPLOADED":
      return "bg-cyan-100 text-cyan-800";
    case "SHIPPED":
      return "bg-purple-100 text-purple-800";
    case "DELIVERED":
      return "bg-green-100 text-green-800";
    case "ISSUE_OOS":
    case "ISSUE_DELAYED":
      return "bg-red-100 text-red-800";
    case "CANCELLED":
      return "bg-gray-200 text-gray-800";
    case "REFUNDED":
      return "bg-slate-200 text-slate-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function OrderDetailsPage() {
  const params = useParams();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [cancellationReason, setCancellationReason] = useState<string>("");
  const [creatingSupplierOrder, setCreatingSupplierOrder] = useState(false);
  const [editingTracking, setEditingTracking] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [creatingAwb, setCreatingAwb] = useState(false);
  const [resendingAwbEmail, setResendingAwbEmail] = useState(false);
  const [savingSupplierStatusId, setSavingSupplierStatusId] = useState<
    string | null
  >(null);
  const [supplierStatusDrafts, setSupplierStatusDrafts] = useState<
    Record<string, string>
  >({});
  const [savingOosResolutionId, setSavingOosResolutionId] = useState<
    string | null
  >(null);
  const [oosResolutionDrafts, setOosResolutionDrafts] = useState<
    Record<
      string,
      {
        action: OosResolutionAction;
        detail: string;
      }
    >
  >({});
  const [savingOosNotificationId, setSavingOosNotificationId] = useState<
    string | null
  >(null);
  const [sendingOosEmailId, setSendingOosEmailId] = useState<string | null>(
    null
  );
  const [oosNotificationDrafts, setOosNotificationDrafts] = useState<
    Record<
      string,
      {
        channel: OosNotificationChannel;
        summary: string;
        customerResponse: string;
      }
    >
  >({});

  const orderId = params.id as string;

  const getOosDraft = (supplierOrderId: string) =>
    oosResolutionDrafts[supplierOrderId] || {
      action: "WAIT_RESTOCK" as OosResolutionAction,
      detail: "",
    };

  const setOosDraft = (
    supplierOrderId: string,
    patch: Partial<{ action: OosResolutionAction; detail: string }>
  ) => {
    setOosResolutionDrafts(prev => ({
      ...prev,
      [supplierOrderId]: {
        ...getOosDraft(supplierOrderId),
        ...patch,
      },
    }));
  };

  const getOosNotificationDraft = (supplierOrderId: string) =>
    oosNotificationDrafts[supplierOrderId] || {
      channel: "EMAIL" as OosNotificationChannel,
      summary: "",
      customerResponse: "",
    };

  const setOosNotificationDraft = (
    supplierOrderId: string,
    patch: Partial<{
      channel: OosNotificationChannel;
      summary: string;
      customerResponse: string;
    }>
  ) => {
    setOosNotificationDrafts(prev => ({
      ...prev,
      [supplierOrderId]: {
        ...getOosNotificationDraft(supplierOrderId),
        ...patch,
      },
    }));
  };

  const buildOosCustomerMessage = (
    supplierOrder: SupplierOrder,
    action: OosResolutionAction,
    detail: string
  ) => {
    const productLabel = `${supplierOrder.productName} (${supplierOrder.quantity}x)`;
    const cleanDetail = detail.trim();

    switch (action) {
      case "WAIT_RESTOCK":
        return [
          `Hello ${order?.customer || "there"},`,
          "",
          `We have an update for your order #${order?.orderNumber}: the item ${productLabel} is temporarily unavailable from our supplier.`,
          `We can keep your order active and ship it as soon as it is restocked.${
            cleanDetail ? ` Estimated availability: ${cleanDetail}.` : ""
          }`,
          "",
          "If you prefer, we can also offer a replacement or a partial refund for this item.",
          "",
          "Please reply with your preferred option.",
        ].join("\n");
      case "OFFER_REPLACEMENT":
        return [
          `Hello ${order?.customer || "there"},`,
          "",
          `The item ${productLabel} from order #${order?.orderNumber} is currently unavailable from our supplier.`,
          "We can offer a replacement option instead so we can continue processing your order.",
          cleanDetail
            ? `Replacement options: ${cleanDetail}`
            : "We will send replacement options once you confirm.",
          "",
          "Please reply with your preferred replacement or let us know if you prefer a partial refund for this item.",
        ].join("\n");
      case "PARTIAL_REFUND_ITEM":
        return [
          `Hello ${order?.customer || "there"},`,
          "",
          `The item ${productLabel} from order #${order?.orderNumber} is unavailable and cannot be fulfilled.`,
          "We will proceed with a partial refund for this item and continue shipping any remaining available items.",
          cleanDetail ? `Refund note: ${cleanDetail}` : "",
          "",
          "We will confirm once the refund is processed.",
        ]
          .filter(Boolean)
          .join("\n");
      case "REPLACEMENT_CONFIRMED":
        return [
          `Hello ${order?.customer || "there"},`,
          "",
          `Your replacement for the unavailable item in order #${order?.orderNumber} has been confirmed.`,
          cleanDetail ? `Replacement details: ${cleanDetail}` : "",
          "We are proceeding with fulfillment now and will send tracking as soon as the parcel is dispatched.",
        ]
          .filter(Boolean)
          .join("\n");
      default:
        return "";
    }
  };

  // Fetch order details
  const fetchOrderDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }

      const data = await response.json();
      setOrder(data.order);
      setNewStatus(data.order.status);
      setSupplierStatusDrafts(
        Object.fromEntries(
          (data.order.supplierOrders || []).map((so: SupplierOrder) => [
            so.id,
            so.status,
          ])
        )
      );
      setOosResolutionDrafts(prev => {
        const next = { ...prev };
        for (const so of data.order.supplierOrders || []) {
          if (!next[so.id]) {
            next[so.id] = {
              action:
                so.phase === "ISSUE_DELAYED"
                  ? "WAIT_RESTOCK"
                  : ("WAIT_RESTOCK" as OosResolutionAction),
              detail: "",
            };
          }
        }
        return next;
      });
      setOosNotificationDrafts(prev => {
        const next = { ...prev };
        for (const so of data.order.supplierOrders || []) {
          if (!next[so.id]) {
            next[so.id] = {
              channel: "EMAIL",
              summary: "",
              customerResponse: "",
            };
          }
        }
        return next;
      });
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast({
        title: "Error",
        description: "Failed to load order details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [orderId, toast]);

  // Create supplier order
  const createSupplierOrder = async () => {
    if (!order) return;

    setCreatingSupplierOrder(true);
    try {
      const response = await fetch("/api/admin/orders/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId: order.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to create supplier order");
      }

      const data = await response.json();

      toast({
        title: "Success",
        description: `Created ${data.data.supplierOrdersCreated} supplier order(s)`,
      });

      // Refresh order details to show supplier orders
      await fetchOrderDetails();
    } catch (error) {
      console.error("Error creating supplier order:", error);
      toast({
        title: "Error",
        description: "Failed to create supplier order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingSupplierOrder(false);
    }
  };

  const copySupplierLineForOrdering = async (supplierOrder: SupplierOrder) => {
    const lines = [
      `Order: ${order?.orderNumber || "-"}`,
      `Supplier: ${supplierOrder.supplierName}`,
      `Product: ${supplierOrder.productName}`,
      `SKU: ${supplierOrder.sku || "-"}`,
      `Qty: ${supplierOrder.quantity}`,
      `Supplier Ref: ${supplierOrder.supplierOrderId || "-"}`,
      `Tracking: ${supplierOrder.trackingNumber || "-"}`,
    ];

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast({
        title: "Copied",
        description: "Supplier order line summary copied to clipboard.",
      });
    } catch (error) {
      console.error("Error copying supplier line summary:", error);
      toast({
        title: "Error",
        description: "Failed to copy supplier line summary.",
        variant: "destructive",
      });
    }
  };

  // Update tracking number
  const updateTrackingNumber = async (supplierOrder: SupplierOrder) => {
    const supplierOrderId = supplierOrder.id;
    const normalizedTracking = trackingInput.trim();
    const shouldAutoMarkAwbUploaded =
      normalizedTracking.length > 0 &&
      ![
        "AWB_UPLOADED",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "REFUNDED",
      ].includes((supplierOrder.status || "").toUpperCase());

    try {
      const response = await fetch(
        `/api/admin/supplier-orders/${supplierOrderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            trackingNumber: normalizedTracking,
            carrier: "FanCourier", // Default carrier, can be made configurable
            ...(shouldAutoMarkAwbUploaded ? { status: "AWB_UPLOADED" } : {}),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update tracking number");
      }

      toast({
        title: "Success",
        description: shouldAutoMarkAwbUploaded
          ? "Tracking saved and status set to AWB Uploaded"
          : "Tracking number updated",
      });

      setSupplierStatusDrafts(prev =>
        shouldAutoMarkAwbUploaded
          ? { ...prev, [supplierOrderId]: "AWB_UPLOADED" }
          : prev
      );
      setEditingTracking(null);
      setTrackingInput("");
      await fetchOrderDetails();
    } catch (error) {
      console.error("Error updating tracking:", error);
      toast({
        title: "Error",
        description: "Failed to update tracking number",
        variant: "destructive",
      });
    }
  };

  const updateSupplierOrderStatus = async (supplierOrderId: string) => {
    const nextStatus = supplierStatusDrafts[supplierOrderId];
    if (!nextStatus) return;
    await saveSupplierOrderStatus(supplierOrderId, nextStatus);
  };

  const saveSupplierOrderStatus = async (
    supplierOrderId: string,
    nextStatus: string
  ) => {
    setSavingSupplierStatusId(supplierOrderId);
    try {
      const response = await fetch(
        `/api/admin/supplier-orders/${supplierOrderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update supplier order status");
      }

      setSupplierStatusDrafts(prev => ({
        ...prev,
        [supplierOrderId]: nextStatus,
      }));

      toast({
        title: "Success",
        description: `Supplier line updated to ${formatWorkflowLabel(nextStatus)}`,
      });

      await fetchOrderDetails();
      return true;
    } catch (error) {
      console.error("Error updating supplier order status:", error);
      toast({
        title: "Error",
        description: "Failed to update supplier order status",
        variant: "destructive",
      });
      return false;
    } finally {
      setSavingSupplierStatusId(null);
    }
  };

  const applyQuickSupplierStatus = async (
    supplierOrder: SupplierOrder,
    nextStatus: string
  ) => {
    const needsTracking =
      nextStatus === "AWB_UPLOADED" || nextStatus === "SHIPPED";
    const hasTracking = Boolean(supplierOrder.trackingNumber?.trim());

    if (needsTracking && !hasTracking) {
      toast({
        title: "Tracking required first",
        description:
          "Save the supplier AWB / tracking number first, then click this quick action.",
        variant: "destructive",
      });
      setEditingTracking(supplierOrder.id);
      setTrackingInput(supplierOrder.trackingNumber || "");
      return;
    }

    setSupplierStatusDrafts(prev => ({
      ...prev,
      [supplierOrder.id]: nextStatus,
    }));

    await saveSupplierOrderStatus(supplierOrder.id, nextStatus);
  };

  const copyOosCustomerMessage = async (supplierOrder: SupplierOrder) => {
    const draft = getOosDraft(supplierOrder.id);
    const message = buildOosCustomerMessage(
      supplierOrder,
      draft.action,
      draft.detail
    );

    try {
      await navigator.clipboard.writeText(message);
      toast({
        title: "Copied",
        description: "Customer message template copied to clipboard.",
      });
    } catch (error) {
      console.error("Error copying OOS message:", error);
      toast({
        title: "Error",
        description: "Failed to copy customer message.",
        variant: "destructive",
      });
    }
  };

  const applyOosResolution = async (supplierOrder: SupplierOrder) => {
    const draft = getOosDraft(supplierOrder.id);
    const targetStatus = OOS_ACTION_TO_TARGET_STATUS[draft.action];

    setSavingOosResolutionId(supplierOrder.id);
    try {
      const response = await fetch(
        `/api/admin/supplier-orders/${supplierOrder.id}/oos-resolution`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: draft.action,
            detail: draft.detail,
          }),
        }
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          data?.error || data?.details || "Failed to apply OOS resolution"
        );
      }

      toast({
        title: "OOS Resolution Saved",
        description:
          draft.action === "PARTIAL_REFUND_ITEM" && data?.refund
            ? `${formatWorkflowLabel(draft.action)} applied. ${
                data.refund.message ||
                formatWorkflowLabel(data.refund.status || "updated")
              }`
            : `${formatWorkflowLabel(
                draft.action
              )} applied. Supplier line set to ${formatWorkflowLabel(
                targetStatus
              )}.`,
      });

      await fetchOrderDetails();
    } catch (error) {
      console.error("Error applying OOS resolution:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to apply OOS resolution.",
        variant: "destructive",
      });
    } finally {
      setSavingOosResolutionId(null);
    }
  };

  const sendOosCustomerEmail = async (supplierOrder: SupplierOrder) => {
    const message = buildOosCustomerMessage(
      supplierOrder,
      getOosDraft(supplierOrder.id).action,
      getOosDraft(supplierOrder.id).detail
    );
    const notificationDraft = getOosNotificationDraft(supplierOrder.id);
    const subject = `Update regarding your order #${order?.orderNumber || ""}`;

    setSendingOosEmailId(supplierOrder.id);
    try {
      const response = await fetch(
        `/api/admin/supplier-orders/${supplierOrder.id}/oos-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            subject,
            summary:
              notificationDraft.summary.trim() ||
              getOosDraft(supplierOrder.id).detail.trim(),
          }),
        }
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          data?.error || data?.details || "Failed to send customer email"
        );
      }

      toast({
        title: "OOS Email Sent",
        description: data?.email?.to
          ? `Customer update sent to ${data.email.to}.`
          : "Customer update email sent.",
      });

      setOosNotificationDraft(supplierOrder.id, {
        channel: "EMAIL",
      });

      await fetchOrderDetails();
    } catch (error) {
      console.error("Error sending OOS customer email:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to send customer email.",
        variant: "destructive",
      });
    } finally {
      setSendingOosEmailId(null);
    }
  };

  const logOosCustomerNotification = async (supplierOrder: SupplierOrder) => {
    const draft = getOosNotificationDraft(supplierOrder.id);

    setSavingOosNotificationId(supplierOrder.id);
    try {
      const response = await fetch(
        `/api/admin/supplier-orders/${supplierOrder.id}/oos-notification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channel: draft.channel,
            summary: draft.summary,
            customerResponse: draft.customerResponse,
          }),
        }
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          data?.error || data?.details || "Failed to log customer notification"
        );
      }

      toast({
        title: "Customer Contact Logged",
        description: `Saved OOS customer notification via ${draft.channel}.`,
      });

      setOosNotificationDraft(supplierOrder.id, {
        customerResponse: "",
      });

      await fetchOrderDetails();
    } catch (error) {
      console.error("Error logging OOS customer notification:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to log customer notification.",
        variant: "destructive",
      });
    } finally {
      setSavingOosNotificationId(null);
    }
  };

  const createAwb = async () => {
    if (!order) return;

    setCreatingAwb(true);
    try {
      const response = await fetch("/api/shipping/create-awb", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId: order.id }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const backendError =
          data?.error ||
          data?.message ||
          data?.details ||
          data?.reviewReason ||
          data?.warning ||
          "Failed to create AWB";
        throw new Error(backendError);
      }

      toast({
        title: "AWB created",
        description: data?.warning
          ? data?.awbNumber
            ? `AWB ${data.awbNumber} created. ${data.warning}`
            : data.warning
          : data?.awbNumber
            ? `AWB ${data.awbNumber} created successfully.`
            : "AWB created successfully.",
      });

      await fetchOrderDetails();
    } catch (error) {
      console.error("Error creating AWB:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create AWB. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingAwb(false);
    }
  };

  const resendAwbEmail = async () => {
    if (!order) return;

    setResendingAwbEmail(true);
    try {
      const response = await fetch(
        `/api/admin/orders/${order.id}/resend-awb-email`,
        {
          method: "POST",
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || data?.details || "Failed to resend AWB email"
        );
      }

      const withAttachment = Boolean(data?.attachmentIncluded);
      toast({
        title: "AWB email sent",
        description: withAttachment
          ? `AWB ${data?.awbNumber || ""} was resent to supplier successfully.`
          : `AWB ${data?.awbNumber || ""} was resent without PDF attachment.`,
      });
    } catch (error) {
      console.error("Error resending AWB email:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to resend AWB email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResendingAwbEmail(false);
    }
  };

  // Update order status
  const updateOrderStatus = async () => {
    if (!order || !newStatus || newStatus === order.status) return;

    setUpdating(true);
    try {
      const requestBody: any = {
        status: newStatus.toUpperCase(),
      };

      // Add cancellation reason if cancelling the order
      if (
        newStatus.toUpperCase() === "CANCELLED" &&
        cancellationReason &&
        cancellationReason.trim()
      ) {
        requestBody.cancellationReason = cancellationReason.trim();
      }

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      // Update local state
      setOrder(prev => (prev ? { ...prev, status: newStatus } : null));

      toast({
        title: "Success",
        description: `Order status updated to ${formatStatus(newStatus)}`,
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, fetchOrderDetails]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading order details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Order Not Found</h3>
              <p className="text-muted-foreground">
                The requested order could not be found.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const courierKey = order.shippingMethod?.includes(":")
    ? order.shippingMethod.split(":")[0]
    : order.shippingMethod;
  const courierName =
    courierKey?.toLowerCase() === "sameday"
      ? "SAMEDAY"
      : courierKey?.toLowerCase() === "fancourier"
        ? "FANCOURIER"
        : "FANCOURIER";
  const activeShipment = order.shipments?.find(
    shipment => shipment.courier === courierName
  );
  const hasPhysicalItems = order.items.some(item => item.isDigital !== true);
  const fulfillment = order.fulfillment;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
            <p className="text-muted-foreground">
              Placed on{" "}
              {order.date
                ? new Date(order.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "N/A"}
            </p>
            {fulfillment && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getFulfillmentBadgeColor(
                    fulfillment.displayStatus
                  )}`}
                >
                  Fulfillment: {formatWorkflowLabel(fulfillment.displayStatus)}
                </span>
                {fulfillment.hasMixedSuppliers && (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    Mixed Order ({fulfillment.supplierCount} suppliers)
                  </span>
                )}
                {fulfillment.hasIssues && (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                    Needs attention
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status Update Section */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}
            >
              {getStatusIcon(order.status)}
              {formatStatus(order.status)}
            </span>
          </div>
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Update status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="SHIPPED">Shipped</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={updateOrderStatus}
            disabled={updating || newStatus === order.status}
            size="sm"
          >
            {updating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Update
          </Button>
        </div>

        {/* Cancellation Reason Field - Only show when status is CANCELLED */}
        {newStatus === "CANCELLED" && (
          <div className="mt-4 p-4 border rounded-lg bg-red-50">
            <label
              htmlFor="cancellationReason"
              className="block text-sm font-medium text-red-800 mb-2"
            >
              Cancellation Reason{" "}
              <span className="text-red-600">(Optional)</span>
            </label>
            <Textarea
              id="cancellationReason"
              placeholder="Enter the reason for cancelling this order (will be included in the email to customer)..."
              value={cancellationReason}
              onChange={e => setCancellationReason(e.target.value)}
              className="min-h-[80px] border-red-200 focus:border-red-400"
            />
            <p className="text-xs text-red-600 mt-1">
              This reason will be sent to the customer in the cancellation
              email.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map(item => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      {item.isBook ? (
                        <Image
                          src={
                            item.book?.coverImage ??
                            "/images/book-placeholder.jpg"
                          }
                          alt={item.name}
                          width={64}
                          height={64}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <Image
                          src={
                            item.product?.images?.[0] ??
                            "/images/product-placeholder.jpg"
                          }
                          alt={item.name}
                          width={64}
                          height={64}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.isBook && item.book && (
                        <p className="text-sm text-muted-foreground">
                          by {item.book.author}
                        </p>
                      )}
                      {!item.isDigital && (
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                            Supplier: {item.supplierName || "Not assigned"}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                            SKU: {item.sku || item.product?.sku || "Missing"}
                          </span>
                          {item.supplierOrderStatus && (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                              Supplier Line: {item.supplierOrderStatus}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Qty: {item.quantity}</span>
                        <span>Price: {formatPrice(item.price)}</span>
                        <span>
                          Total: {formatPrice(item.price * item.quantity)}
                        </span>
                        {item.isDigital && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                            Digital
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{order.customer}</p>
                <p className="text-sm text-muted-foreground">{order.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && (
                  <p>{order.shippingAddress.addressLine2}</p>
                )}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && (
                  <p className="pt-2 text-muted-foreground">
                    Phone: {order.shippingAddress.phone}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Method:</span>
                <span className="text-sm font-medium">
                  {order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Status:</span>
                <span className="text-sm font-medium capitalize">
                  {order.paymentStatus}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Shipment */}
          {hasPhysicalItems && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  {courierName === "SAMEDAY" ? "Sameday" : "FanCourier"}{" "}
                  Shipment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>AWB:</span>
                  <span className="font-medium">
                    {activeShipment?.awbNumber || "Not created"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Status:</span>
                  <span className="font-medium">
                    {activeShipment?.status || "Pending"}
                  </span>
                </div>
                <div className="flex justify-end gap-2">
                  {activeShipment?.awbNumber &&
                    courierName === "FANCOURIER" && (
                      <Button
                        onClick={resendAwbEmail}
                        size="sm"
                        variant="outline"
                        disabled={resendingAwbEmail}
                      >
                        {resendingAwbEmail ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Mail className="h-4 w-4 mr-2" />
                        )}
                        Resend AWB Email
                      </Button>
                    )}
                  <Button
                    onClick={createAwb}
                    size="sm"
                    disabled={creatingAwb || Boolean(activeShipment?.awbNumber)}
                  >
                    {creatingAwb ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Package className="h-4 w-4 mr-2" />
                    )}
                    {activeShipment?.awbNumber ? "AWB Created" : "Create AWB"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping:</span>
                <span>{formatPrice(order.shippingCost)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
              )}
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>
                    Discount {order.couponCode && `(${order.couponCode})`}:
                  </span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Supplier Orders Section */}
          {order.paymentStatus === "PAID" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Supplier Orders
                  </CardTitle>
                  {(!order.supplierOrders ||
                    order.supplierOrders.length === 0) && (
                    <Button
                      onClick={createSupplierOrder}
                      disabled={creatingSupplierOrder}
                      size="sm"
                    >
                      {creatingSupplierOrder ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Create Supplier Order
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {order.supplierOrders && order.supplierOrders.length > 0 ? (
                  <div className="space-y-4">
                    {fulfillment && (
                      <div className="p-4 border rounded-lg bg-slate-50 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">
                              Supplier Fulfillment Overview
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Operational view grouped by supplier shipment task
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getFulfillmentBadgeColor(
                              fulfillment.displayStatus
                            )}`}
                          >
                            {formatWorkflowLabel(fulfillment.displayStatus)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div className="rounded border bg-white p-2">
                            <p className="text-xs text-muted-foreground">
                              Ready to place
                            </p>
                            <p className="text-sm font-semibold">
                              {(
                                (fulfillment.counts.READY_TO_PLACE || 0) +
                                (fulfillment.counts.PLACED_TO_SUPPLIER || 0)
                              ).toString()}
                            </p>
                          </div>
                          <div className="rounded border bg-white p-2">
                            <p className="text-xs text-muted-foreground">
                              AWB work
                            </p>
                            <p className="text-sm font-semibold">
                              {(
                                (fulfillment.counts.AWB_PENDING || 0) +
                                (fulfillment.counts.AWB_UPLOADED || 0)
                              ).toString()}
                            </p>
                          </div>
                          <div className="rounded border bg-white p-2">
                            <p className="text-xs text-muted-foreground">
                              Shipped/Delivered
                            </p>
                            <p className="text-sm font-semibold">
                              {(
                                (fulfillment.counts.SHIPPED || 0) +
                                (fulfillment.counts.DELIVERED || 0)
                              ).toString()}
                            </p>
                          </div>
                          <div className="rounded border bg-white p-2">
                            <p className="text-xs text-muted-foreground">
                              Issues
                            </p>
                            <p className="text-sm font-semibold">
                              {(
                                (fulfillment.counts.ISSUE_OOS || 0) +
                                (fulfillment.counts.ISSUE_DELAYED || 0)
                              ).toString()}
                            </p>
                          </div>
                        </div>

                        {fulfillment.supplierShipmentGroups?.length > 0 && (
                          <div className="space-y-3">
                            {fulfillment.supplierShipmentGroups.map(group => (
                              <div
                                key={group.key}
                                className="rounded-lg border bg-white p-3 space-y-3"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div>
                                    <p className="font-medium">
                                      {group.supplierName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {group.lineCount} line
                                      {group.lineCount === 1 ? "" : "s"} · Qty{" "}
                                      {group.totalQuantity}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getFulfillmentBadgeColor(
                                        group.displayStatus
                                      )}`}
                                    >
                                      {formatWorkflowLabel(group.displayStatus)}
                                    </span>
                                  </div>
                                </div>

                                {group.trackingNumbers.length > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    Tracking: {group.trackingNumbers.join(", ")}
                                  </div>
                                )}

                                <div className="space-y-2">
                                  {group.lines.map(line => (
                                    <div
                                      key={`${group.key}-${line.supplierOrderId || line.productName}`}
                                      className="flex flex-wrap items-center justify-between gap-2 rounded border p-2"
                                    >
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">
                                          {line.productName ||
                                            "Unknown product"}{" "}
                                          × {line.quantity}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          Raw status: {line.lineStatus || "N/A"}
                                        </p>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span
                                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getPhaseColor(
                                            line.phase
                                          )}`}
                                        >
                                          {formatWorkflowLabel(line.phase)}
                                        </span>
                                        {line.trackingNumber && (
                                          <span className="text-xs text-muted-foreground">
                                            {line.trackingNumber}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

	                    <div className="flex items-center justify-between">
	                      <p className="text-sm font-medium">
	                        Supplier Order Lines
	                      </p>
	                      <p className="text-xs text-muted-foreground">
	                        Use the quick steps below and only use manual status
	                        dropdown for special cases
	                      </p>
	                    </div>
	                    <div className="rounded-lg border bg-slate-50 p-4 space-y-2">
	                      <p className="text-sm font-medium">
	                        Supplier Fulfillment Playbook (per supplier line)
	                      </p>
	                      <ol className="list-decimal pl-4 space-y-1 text-xs text-muted-foreground">
	                        <li>
	                          Place the order on supplier website, then click{" "}
	                          <strong>Placed to Supplier</strong>.
	                        </li>
	                        <li>
	                          When supplier sends AWB, save the tracking number
	                          (AWB), then click <strong>AWB Uploaded</strong>.
	                        </li>
	                        <li>
	                          After courier pickup/dispatch is confirmed, click{" "}
	                          <strong>Shipped</strong>.
	                        </li>
	                        <li>
	                          When delivered, click <strong>Delivered</strong>.
	                        </li>
	                      </ol>
	                      <p className="text-xs text-slate-600">
	                        Parent order status updates automatically based on
	                        supplier line statuses.
	                      </p>
	                    </div>
	                    {order.supplierOrders.map(so => {
	                      const hasTracking = Boolean(so.trackingNumber?.trim());
	                      const workflowHint = getSupplierLineWorkflowHint(so);
	                      const hintToneClasses =
	                        workflowHint.tone === "success"
	                          ? "border-green-200 bg-green-50 text-green-900"
	                          : workflowHint.tone === "warning"
	                            ? "border-amber-200 bg-amber-50 text-amber-900"
	                            : "border-blue-200 bg-blue-50 text-blue-900";

	                      return (
	                      <div
	                        key={so.id}
	                        className="p-4 border rounded-lg space-y-3"
	                      >
	                        <div className="flex items-center justify-between">
	                          <div>
	                            <p className="font-medium">{so.supplierName}</p>
	                            <p className="text-sm text-muted-foreground">
	                              {so.productName} × {so.quantity}
	                            </p>
	                            <div className="mt-1 flex flex-wrap gap-2 text-xs">
	                              {so.sku && (
	                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
	                                  SKU: {so.sku}
	                                </span>
	                              )}
	                              {so.supplierOrderId && (
	                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
	                                  Supplier Ref: {so.supplierOrderId}
	                                </span>
	                              )}
	                            </div>
	                          </div>
	                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              so.status === "SHIPPED"
                                ? "bg-purple-100 text-purple-800"
                                : so.status === "DELIVERED"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {so.status}
	                          </span>
	                        </div>

	                        <div
	                          className={`rounded-md border p-3 ${hintToneClasses}`}
	                        >
	                          <p className="text-sm font-medium">
	                            {workflowHint.title}
	                          </p>
	                          <p className="mt-1 text-xs opacity-90">
	                            {workflowHint.description}
	                          </p>
	                        </div>

	                        {so.phase && (
	                          <div>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getPhaseColor(
                                so.phase
                              )}`}
                            >
                              Workflow phase: {formatWorkflowLabel(so.phase)}
                            </span>
	                          </div>
	                        )}

	                        <div className="rounded-md border bg-slate-50/70 p-3 space-y-3">
	                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
	                            <div>
	                            <p className="text-sm font-medium">
	                              Quick Workflow Actions
	                            </p>
	                            <p className="text-xs text-muted-foreground">
	                              Fast path for the common dropshipping flow.
	                            </p>
	                            </div>
	                            <Button
	                              type="button"
	                              size="sm"
	                              variant="outline"
	                              onClick={() => copySupplierLineForOrdering(so)}
	                            >
	                              <Copy className="mr-2 h-4 w-4" />
	                              Copy Supplier Line
	                            </Button>
	                          </div>
	                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
	                            {QUICK_SUPPLIER_WORKFLOW_ACTIONS.map(action => {
	                              const isCurrent = so.status === action.status;
	                              const isDisabled =
	                                savingSupplierStatusId === so.id ||
	                                Boolean(action.requiresTracking && !hasTracking);
	                              return (
	                                <Button
	                                  key={`${so.id}-${action.status}`}
	                                  type="button"
	                                  size="sm"
	                                  variant={isCurrent ? "default" : "outline"}
	                                  disabled={isDisabled}
	                                  onClick={() =>
	                                    applyQuickSupplierStatus(so, action.status)
	                                  }
	                                  className="justify-start h-auto py-2"
	                                  title={
	                                    action.requiresTracking && !hasTracking
	                                      ? "Save tracking number first"
	                                      : action.description
	                                  }
	                                >
	                                  <span className="text-left">
	                                    <span className="block text-xs font-medium">
	                                      {action.label}
	                                    </span>
	                                    <span className="block text-[10px] opacity-80 whitespace-normal leading-tight">
	                                      {action.description}
	                                    </span>
	                                  </span>
	                                </Button>
	                              );
	                            })}
	                          </div>
	                          {!hasTracking && (
	                            <p className="text-xs text-amber-700">
	                              Save AWB/tracking first to enable{" "}
	                              <strong>AWB Uploaded</strong> and{" "}
	                              <strong>Shipped</strong>.
	                            </p>
	                          )}
	                        </div>

	                        <div className="grid grid-cols-2 gap-4 text-sm">
	                          <div>
                            <span className="text-muted-foreground">Cost:</span>
                            <span className="ml-2 font-medium">
                              {formatPrice(so.totalCost)}
                            </span>
                          </div>
	                          <div>
	                            <span className="text-muted-foreground">
	                              Tracking:
	                            </span>
	                            <span className="ml-2 font-medium">
	                              {so.trackingNumber || "Not added yet"}
	                            </span>
	                          </div>
	                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Workflow / Supplier Status
                          </label>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Select
                              value={supplierStatusDrafts[so.id] || so.status}
                              onValueChange={value =>
                                setSupplierStatusDrafts(prev => ({
                                  ...prev,
                                  [so.id]: value,
                                }))
                              }
                            >
                              <SelectTrigger className="w-full sm:w-[260px]">
                                <SelectValue placeholder="Choose status" />
                              </SelectTrigger>
                              <SelectContent>
                                {SUPPLIER_WORKFLOW_STATUS_OPTIONS.map(
                                  statusOption => (
                                    <SelectItem
                                      key={statusOption}
                                      value={statusOption}
                                    >
                                      {formatWorkflowLabel(statusOption)}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={
                                savingSupplierStatusId === so.id ||
                                (supplierStatusDrafts[so.id] || so.status) ===
                                  so.status
                              }
                              onClick={() => updateSupplierOrderStatus(so.id)}
                            >
                              {savingSupplierStatusId === so.id ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4 mr-2" />
                              )}
                              Save Status
                            </Button>
                          </div>
                        </div>

                        {(so.phase === "ISSUE_OOS" ||
                          so.phase === "ISSUE_DELAYED") &&
                          (() => {
                            const oosOps = getOosOpsSnapshot(so);
                            const oosNotificationDraft =
                              getOosNotificationDraft(so.id);

                            return (
                              <div className="space-y-3 rounded-lg border border-red-200 bg-red-50/60 p-3">
                                <div className="flex items-center gap-2">
                                  <MessageSquareWarning className="h-4 w-4 text-red-700" />
                                  <p className="text-sm font-medium text-red-900">
                                    Out-of-Stock Resolution Workflow
                                  </p>
                                </div>
                                <p className="text-xs text-red-800">
                                  Choose a resolution path, save it to the
                                  supplier line, then copy the customer message
                                  template and send it.
                                </p>

                                <div className="flex flex-wrap gap-2">
                                  {typeof oosOps.issueAgeHours === "number" && (
                                    <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-700 border">
                                      Issue age:{" "}
                                      {Math.floor(oosOps.issueAgeHours)}h
                                    </span>
                                  )}
                                  {typeof oosOps.inactivityHours ===
                                    "number" && (
                                    <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-700 border">
                                      Last activity:{" "}
                                      {Math.floor(oosOps.inactivityHours)}h ago
                                    </span>
                                  )}
                                  {oosOps.needsCustomerNotification ? (
                                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 border border-red-200">
                                      Customer not notified yet
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 border border-green-200">
                                      Customer contact logged
                                    </span>
                                  )}
                                  {oosOps.isSlaOverdue && (
                                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 border border-amber-200">
                                      Follow-up overdue ({OOS_SLA_WARNING_HOURS}
                                      h+)
                                    </span>
                                  )}
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                      Resolution Action
                                    </label>
                                    <Select
                                      value={getOosDraft(so.id).action}
                                      onValueChange={value =>
                                        setOosDraft(so.id, {
                                          action: value as OosResolutionAction,
                                        })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Choose action" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {OOS_RESOLUTION_OPTIONS.map(option => (
                                          <SelectItem
                                            key={option.value}
                                            value={option.value}
                                          >
                                            {option.label} (
                                            {formatWorkflowLabel(
                                              option.targetStatus
                                            )}
                                            )
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                      Internal Details
                                    </label>
                                    <Textarea
                                      value={getOosDraft(so.id).detail}
                                      onChange={e =>
                                        setOosDraft(so.id, {
                                          detail: e.target.value,
                                        })
                                      }
                                      placeholder={
                                        OOS_RESOLUTION_OPTIONS.find(
                                          option =>
                                            option.value ===
                                            getOosDraft(so.id).action
                                        )?.detailPlaceholder ||
                                        "Add internal details"
                                      }
                                      className="min-h-[84px] bg-white"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-sm font-medium">
                                    Customer Message Template (Preview)
                                  </label>
                                  <Textarea
                                    value={buildOosCustomerMessage(
                                      so,
                                      getOosDraft(so.id).action,
                                      getOosDraft(so.id).detail
                                    )}
                                    readOnly
                                    className="min-h-[140px] bg-white text-xs"
                                  />
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyOosCustomerMessage(so)}
                                  >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy Customer Message
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => sendOosCustomerEmail(so)}
                                    disabled={
                                      sendingOosEmailId === so.id ||
                                      !order?.email ||
                                      order.email === "N/A"
                                    }
                                  >
                                    {sendingOosEmailId === so.id ? (
                                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Mail className="mr-2 h-4 w-4" />
                                    )}
                                    Send OOS Email
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => applyOosResolution(so)}
                                    disabled={savingOosResolutionId === so.id}
                                  >
                                    {savingOosResolutionId === so.id ? (
                                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Save className="mr-2 h-4 w-4" />
                                    )}
                                    Save OOS Resolution
                                  </Button>
                                </div>

                                <div className="space-y-3 rounded-md border bg-white/80 p-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <div>
                                      <p className="text-sm font-medium">
                                        Customer Contact Log
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Log when/how you contacted the customer
                                        and what they replied.
                                      </p>
                                    </div>
                                    {oosOps.latestNotification?.timestamp && (
                                      <span className="text-xs text-muted-foreground">
                                        Last contact:{" "}
                                        {oosOps.latestNotification.timestamp.toLocaleString()}
                                      </span>
                                    )}
                                  </div>

                                  {(!order?.email || order.email === "N/A") && (
                                    <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                                      Customer email is not available for this
                                      order. Use phone/WhatsApp contact and log
                                      it below.
                                    </div>
                                  )}

                                  <div className="grid gap-3 md:grid-cols-2">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">
                                        Channel
                                      </label>
                                      <Select
                                        value={oosNotificationDraft.channel}
                                        onValueChange={value =>
                                          setOosNotificationDraft(so.id, {
                                            channel:
                                              value as OosNotificationChannel,
                                          })
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {OOS_NOTIFICATION_CHANNEL_OPTIONS.map(
                                            channel => (
                                              <SelectItem
                                                key={channel}
                                                value={channel}
                                              >
                                                {channel}
                                              </SelectItem>
                                            )
                                          )}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">
                                        Contact Summary
                                      </label>
                                      <Textarea
                                        value={oosNotificationDraft.summary}
                                        onChange={e =>
                                          setOosNotificationDraft(so.id, {
                                            summary: e.target.value,
                                          })
                                        }
                                        placeholder="What did you tell the customer? (ETA, replacement options, refund offer)"
                                        className="min-h-[84px] bg-white"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                      Customer Response (Optional)
                                    </label>
                                    <Textarea
                                      value={
                                        oosNotificationDraft.customerResponse
                                      }
                                      onChange={e =>
                                        setOosNotificationDraft(so.id, {
                                          customerResponse: e.target.value,
                                        })
                                      }
                                      placeholder="Customer chose wait / replacement / refund, or asked for more time"
                                      className="min-h-[72px] bg-white"
                                    />
                                  </div>

                                  <div className="flex justify-end">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        logOosCustomerNotification(so)
                                      }
                                      disabled={
                                        savingOosNotificationId === so.id
                                      }
                                    >
                                      {savingOosNotificationId === so.id ? (
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                      )}
                                      Mark Customer Notified
                                    </Button>
                                  </div>
                                </div>

                                {oosOps.events.length > 0 && (
                                  <div className="space-y-2 rounded-md border bg-white/80 p-3">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium">
                                        OOS Timeline
                                      </p>
                                      <span className="text-xs text-muted-foreground">
                                        {oosOps.events.length} event
                                        {oosOps.events.length === 1 ? "" : "s"}
                                      </span>
                                    </div>
                                    <div className="space-y-2">
	                                      {oosOps.events
	                                        .slice(0, 8)
	                                        .map((event, idx) => (
                                          <div
                                            key={`${event.tag}-${event.timestampText || idx}-${idx}`}
                                            className="rounded border bg-white p-2 text-xs"
                                          >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                              <span className="font-medium">
                                                {formatOosEventLabel(event.tag)}
                                              </span>
                                              <span className="text-muted-foreground">
                                                {event.timestamp
                                                  ? event.timestamp.toLocaleString()
                                                  : event.timestampText ||
                                                    "Unknown time"}
                                              </span>
                                            </div>
                                            <div className="mt-1 text-muted-foreground space-y-1">
	                                              {Object.entries(event.data).map(
	                                                ([k, v]) => (
	                                                  <div key={k}>
                                                    <span className="font-medium text-foreground/80">
                                                      {k}:
                                                    </span>{" "}
                                                    <span>{v}</span>
	                                                  </div>
	                                                )
	                                              )}
	                                            </div>
	                                          </div>
	                                        ))}
	                                    </div>
	                                  </div>
	                                )}
                              </div>
                            );
                          })()}

                        {so.notes && (
                          <div className="space-y-1">
                            <label className="text-sm font-medium">
                              Supplier Line Notes
                            </label>
                            <div className="rounded-md border bg-muted/30 p-2 text-xs whitespace-pre-wrap text-muted-foreground">
                              {so.notes}
                            </div>
                          </div>
                        )}

                        {/* Tracking Number */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">
                              Tracking Number (AWB):
                            </label>
                            {editingTracking === so.id ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingTracking(null);
                                  setTrackingInput("");
                                }}
                              >
                                Cancel
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingTracking(so.id);
                                  setTrackingInput(so.trackingNumber || "");
                                }}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                {so.trackingNumber ? "Edit" : "Add"}
                              </Button>
                            )}
                          </div>
                          {editingTracking === so.id ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={trackingInput}
                                onChange={e => setTrackingInput(e.target.value)}
                                placeholder="Enter AWB/tracking number"
                                className="flex-1 px-3 py-2 border rounded-md text-sm"
                              />
	                              <Button
	                                size="sm"
	                                onClick={() => updateTrackingNumber(so)}
	                              >
	                                Save
	                              </Button>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {so.trackingNumber || "No tracking number"}
                            </p>
                          )}
                        </div>

                        {so.carrier && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">
                              Carrier:
                            </span>
                            <span className="ml-2">{so.carrier}</span>
                          </div>
                        )}

                        {so.shippedAt && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">
                              Shipped:
                            </span>
                            <span className="ml-2">
                              {new Date(so.shippedAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No supplier orders created yet</p>
                    <p className="text-xs mt-1">
                      Click "Create Supplier Order" to process this order
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
