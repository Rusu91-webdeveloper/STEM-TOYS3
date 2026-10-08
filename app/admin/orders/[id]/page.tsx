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
import React, { useState, useEffect, useCallback, useRef } from "react";

import {
  CodRejectionDialog,
  type CodRejectionInput,
} from "@/app/admin/components/cod-rejection-dialog";
import { DashboardError } from "@/app/admin/components/dashboard-status";
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
import { CodHoldSettlementNotice } from "@/features/returns/components/CodHoldSettlementNotice";
import { useCsrfToken } from "@/hooks/useCsrfToken";
import {
  formatOrderAmount,
  paymentStatusLabels,
  orderStatusLabels,
} from "@/lib/admin/dashboard-metrics";
import { adminOrderLabel } from "@/lib/admin/order-labels";
import { parseCodGuaranteeEvidence } from "@/lib/checkout/cod-guarantee";

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
  supplierNames?: string[];
  supplierOrderStatus?: string | null;
  supplierSkus?: string[];
  supplierLineCount?: number;
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
    productSku?: string | null;
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
  currency: string;
  paymentMethod: string;
  shippingMethod?: string;
  manualShippingReviewRequired?: boolean;
  shippingReviewReason?: string | null;
  notes?: string | null;
  tags?: string[];
  codFeeEstimate?: number | null;
  codAmount?: number | null;
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

type CodConsentInfo = {
  accepted: boolean;
  acceptedAt: string | null;
  version: string | null;
  termsSnapshot: string | null;
  source: "notes" | "tags" | "none";
};

const getCodConsentInfo = (order: OrderDetails): CodConsentInfo => {
  const tags = Array.isArray(order.tags) ? order.tags : [];
  const codVersionTag = tags.find(tag => tag.startsWith("COD_CONSENT_V"));
  const versionFromTag = codVersionTag
    ? codVersionTag.replace("COD_CONSENT_V", "").replace(/_/g, "-")
    : null;

  const noteSegments = (order.notes || "")
    .split("|")
    .map(segment => segment.trim())
    .filter(Boolean);

  const acceptedSegment = noteSegments.find(segment =>
    segment.startsWith("COD Consent accepted at ")
  );
  const snapshotSegment = noteSegments.find(segment =>
    segment.startsWith("COD Consent terms snapshot:")
  );

  let acceptedAt: string | null = null;
  let versionFromNotes: string | null = null;

  if (acceptedSegment) {
    const acceptedMatch = acceptedSegment.match(
      /^COD Consent accepted at (.+) \(version (.+)\)$/
    );
    if (acceptedMatch) {
      acceptedAt = acceptedMatch[1]?.trim() || null;
      versionFromNotes = acceptedMatch[2]?.trim() || null;
    }
  }

  return {
    accepted: Boolean(acceptedSegment || versionFromTag),
    acceptedAt,
    version: versionFromNotes || versionFromTag,
    termsSnapshot: snapshotSegment
      ? snapshotSegment.replace("COD Consent terms snapshot:", "").trim()
      : null,
    source: acceptedSegment ? "notes" : versionFromTag ? "tags" : "none",
  };
};

const formatAdminDateTime = (rawValue?: string | null): string => {
  if (!rawValue) return "—";
  const parsed = new Date(rawValue);
  if (Number.isNaN(parsed.getTime())) {
    return rawValue;
  }
  return parsed.toLocaleString("ro-RO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
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
  orderStatusLabels[status] ?? status;

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
    label: "Plasată la furnizor",
    description: "Folosește după plasarea comenzii pe site-ul furnizorului",
  },
  {
    status: "AWB_UPLOADED",
    label: "AWB înregistrat",
    description: "Folosește după salvarea AWB-ului furnizorului",
    requiresTracking: true,
  },
  {
    status: "SHIPPED",
    label: "Expediată",
    description:
      "Folosește după confirmarea preluării de către furnizor sau curier",
    requiresTracking: true,
  },
  {
    status: "DELIVERED",
    label: "Livrată",
    description: "Folosește după confirmarea livrării",
  },
];

const getSupplierLineWorkflowHint = (supplierOrder: SupplierOrder) => {
  const phase = supplierOrder.phase || "UNKNOWN";
  const hasTracking = Boolean(supplierOrder.trackingNumber?.trim());

  if (phase === "ISSUE_OOS" || phase === "ISSUE_DELAYED") {
    return {
      title: "Rezolvă problema furnizorului",
      description:
        "Folosește opțiunile de stoc indisponibil sau întârziere, contactează clientul și continuă procesarea.",
      tone: "warning" as const,
    };
  }

  if (phase === "DELIVERED" || supplierOrder.status === "DELIVERED") {
    return {
      title: "Rezolvate",
      description: "Această poziție la furnizor este finalizată.",
      tone: "success" as const,
    };
  }

  if (phase === "SHIPPED" || supplierOrder.status === "SHIPPED") {
    return {
      title: "Pasul următor",
      description:
        "Urmărește expedierea și marchează Livrată după confirmarea curierului.",
      tone: "info" as const,
    };
  }

  if (hasTracking && (phase === "AWB_UPLOADED" || phase === "AWB_PENDING")) {
    return {
      title: "Pasul următor",
      description:
        "AWB-ul este salvat. Marchează Expediată după confirmarea preluării.",
      tone: "info" as const,
    };
  }

  if (hasTracking) {
    return {
      title: "Pasul următor",
      description:
        "AWB-ul există. Marchează AWB înregistrat sau Expediată dacă a fost deja preluată.",
      tone: "info" as const,
    };
  }

  if (
    phase === "PLACED_TO_SUPPLIER" ||
    supplierOrder.status === "PLACED_TO_SUPPLIER"
  ) {
    return {
      title: "Pasul următor",
      description:
        "Așteaptă AWB-ul furnizorului, salvează-l și marchează AWB înregistrat.",
      tone: "info" as const,
    };
  }

  return {
    title: "Pasul următor",
    description:
      "Plasează comanda pe site-ul furnizorului, apoi marchează Plasată la furnizor.",
    tone: "warning" as const,
  };
};

const getSupplierLineChecklistSteps = (supplierOrder: SupplierOrder) => {
  const status = String(supplierOrder.status || "").toUpperCase();
  const phase = String(supplierOrder.phase || "").toUpperCase();
  const hasTracking = Boolean(supplierOrder.trackingNumber?.trim());

  const delivered = status === "DELIVERED" || phase === "DELIVERED";
  const shipped = delivered || status === "SHIPPED" || phase === "SHIPPED";
  const awbMarked =
    shipped || status === "AWB_UPLOADED" || phase === "AWB_UPLOADED";
  const placedMarked =
    awbMarked ||
    hasTracking ||
    [
      "PLACED_TO_SUPPLIER",
      "AWB_PENDING",
      "ISSUE_OOS",
      "ISSUE_DELAYED",
    ].includes(status) ||
    [
      "PLACED_TO_SUPPLIER",
      "AWB_PENDING",
      "ISSUE_OOS",
      "ISSUE_DELAYED",
    ].includes(phase);
  const awbSaved = hasTracking || awbMarked;

  const completedStepCount = delivered
    ? 5
    : shipped
      ? 4
      : awbMarked
        ? 3
        : awbSaved
          ? 2
          : placedMarked
            ? 1
            : 0;

  const steps = [
    {
      index: 1,
      title: "Plasează comanda la furnizor",
      detail:
        "Plasează comanda pe site-ul furnizorului, apoi marchează Plasată la furnizor.",
    },
    {
      index: 2,
      title: "Salvează AWB-ul",
      detail: "Introdu AWB-ul furnizorului în câmpul de mai jos și salvează-l.",
    },
    {
      index: 3,
      title: "Marchează AWB înregistrat",
      detail: "Confirmă starea poziției după salvarea AWB-ului.",
    },
    {
      index: 4,
      title: "Marchează Expediată",
      detail: "Folosește doar după confirmarea preluării de către curier.",
    },
    {
      index: 5,
      title: "Marchează Livrată",
      detail: "Folosește după confirmarea livrării către client.",
    },
  ] as const;

  return steps.map(step => ({
    ...step,
    state:
      completedStepCount >= step.index
        ? ("done" as const)
        : completedStepCount + 1 === step.index
          ? ("current" as const)
          : ("next" as const),
  }));
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
    label: "Așteaptă reaprovizionarea",
    targetStatus: "ISSUE_DELAYED",
    detailPlaceholder:
      "Termenul furnizorului (de exemplu 3–5 zile) sau termenul de răspuns al clientului",
  },
  {
    value: "OFFER_REPLACEMENT",
    label: "Oferă un produs înlocuitor",
    targetStatus: "ISSUE_OOS",
    detailPlaceholder: "Produse înlocuitoare, SKU-uri și diferența de preț",
  },
  {
    value: "PARTIAL_REFUND_ITEM",
    label: "Rambursare parțială pentru produs",
    targetStatus: "CANCELLED",
    detailPlaceholder:
      "Termenul rambursării, referința și persoana care a aprobat",
  },
  {
    value: "REPLACEMENT_CONFIRMED",
    label: "Produs înlocuitor confirmat",
    targetStatus: "READY_TO_PLACE",
    detailPlaceholder: "Produsul înlocuitor aprobat și o notă internă",
  },
];

const OOS_ACTION_TO_TARGET_STATUS: Record<OosResolutionAction, string> =
  Object.fromEntries(
    OOS_RESOLUTION_OPTIONS.map(option => [option.value, option.targetStatus])
  ) as Record<OosResolutionAction, string>;

const formatWorkflowLabel = adminOrderLabel;

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
  const csrf = useCsrfToken();
  const params = useParams();
  const { toast } = useToast();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const formatPrice = (amount: number) =>
    formatOrderAmount(amount, order?.currency || "RON");
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestController = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [cancellationReason, setCancellationReason] = useState<string>("");
  const [creatingSupplierOrder, setCreatingSupplierOrder] = useState(false);
  const [editingTracking, setEditingTracking] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [creatingAwb, setCreatingAwb] = useState(false);
  const [resendingAwbEmail, setResendingAwbEmail] = useState(false);
  const [rejectingCOD, setRejectingCOD] = useState(false);
  const [codDialogOpen, setCodDialogOpen] = useState(false);
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
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        signal: controller.signal,
        cache: "no-store",
      });
      if (response.status === 404) {
        setOrder(null);
        return;
      }
      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }

      const data = await response.json();
      if (controller.signal.aborted) return;
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
      if (controller.signal.aborted) return;
      console.error("Error fetching order details:", error);
      setLoadError(
        "Detaliile comenzii nu au putut fi încărcate. Încearcă din nou."
      );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [orderId]);

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
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const reason =
          data?.reviewReason ||
          data?.details?.join?.(" | ") ||
          data?.error ||
          "Failed to create supplier order";
        throw new Error(reason);
      }

      toast({
        title: data?.data?.manualReviewRequired
          ? "Needs manual review"
          : "Salvat",
        description: data?.data?.manualReviewRequired
          ? (data.data.reviewReason ??
            `Created ${data.data.supplierOrdersCreated} supplier order(s), but this order still needs manual review.`)
          : `Created ${data.data.supplierOrdersCreated} supplier order(s)`,
        variant: data?.data?.manualReviewRequired ? "destructive" : "default",
      });

      // Refresh order details to show supplier orders
      await fetchOrderDetails();
    } catch (error) {
      console.error("Error creating supplier order:", error);
      toast({
        title: "Eroare",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create supplier order. Please try again.",
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
        title: "Copiat",
        description: "Rezumatul poziției a fost copiat.",
      });
    } catch (error) {
      console.error("Error copying supplier line summary:", error);
      toast({
        title: "Eroare",
        description: "Rezumatul nu a putut fi copiat.",
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
        throw new Error("AWB-ul nu a putut fi actualizat.");
      }

      toast({
        title: "Salvat",
        description: shouldAutoMarkAwbUploaded
          ? "AWB salvat și stare actualizată la AWB înregistrat."
          : "AWB actualizat.",
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
        title: "Eroare",
        description: "AWB-ul nu a putut fi actualizat.",
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
        throw new Error(
          "Starea comenzii la furnizor nu a putut fi actualizată."
        );
      }

      setSupplierStatusDrafts(prev => ({
        ...prev,
        [supplierOrderId]: nextStatus,
      }));

      toast({
        title: "Salvat",
        description: `Starea poziției a fost actualizată: ${formatWorkflowLabel(nextStatus)}`,
      });

      await fetchOrderDetails();
      return true;
    } catch (error) {
      console.error("Error updating supplier order status:", error);
      toast({
        title: "Eroare",
        description: "Starea comenzii la furnizor nu a putut fi actualizată.",
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
        title: "Salvează mai întâi AWB-ul",
        description:
          "Salvează AWB-ul furnizorului, apoi folosește această acțiune.",
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
        title: "Copiat",
        description: "Modelul de mesaj către client a fost copiat.",
      });
    } catch (error) {
      console.error("Error copying OOS message:", error);
      toast({
        title: "Eroare",
        description: "Mesajul către client nu a putut fi copiat.",
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
        title: "Soluția pentru stoc indisponibil a fost salvată",
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
        title: "Eroare",
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
        title: "E-mail pentru stoc indisponibil",
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
        title: "Eroare",
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
        title: "Contactarea clientului a fost înregistrată",
        description: `Saved OOS customer notification via ${draft.channel}.`,
      });

      setOosNotificationDraft(supplierOrder.id, {
        customerResponse: "",
      });

      await fetchOrderDetails();
    } catch (error) {
      console.error("Error logging OOS customer notification:", error);
      toast({
        title: "Eroare",
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
        title: "AWB creat",
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
        title: "Eroare",
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
        title: "E-mail cu AWB trimis",
        description: withAttachment
          ? `AWB ${data?.awbNumber || ""} was resent to supplier successfully.`
          : `AWB ${data?.awbNumber || ""} was resent without PDF attachment.`,
      });
    } catch (error) {
      console.error("Error resending AWB email:", error);
      toast({
        title: "Eroare",
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

  const markCODRejected = async ({
    reason,
    notes,
  }: CodRejectionInput): Promise<boolean> => {
    if (!order || rejectingCOD || !reason.trim()) return false;

    setRejectingCOD(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/cod-reject`, {
        method: "POST",
        headers: csrf.addToHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          reason: reason.trim(),
          notes: notes?.trim() || undefined,
          captureGuarantee: false,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.details ||
            "Refuzul coletului nu s-a înregistrat."
        );
      }

      toast({
        title: "Refuzul coletului cu ramburs a fost înregistrat",
        description: data?.guaranteeCaptured
          ? `Garanție încasată: ${formatPrice(Number(data?.guaranteeCaptureAmount || 0))}`
          : "Refuzul a fost înregistrat fără încasarea garanției. Verifică declarațiile de retragere și eventualele erori de livrare; o retragere legală nu se penalizează.",
      });

      await fetchOrderDetails();
      return true;
    } catch (error) {
      console.error("Error rejecting COD order:", error);
      toast({
        title: "Eroare",
        description:
          error instanceof Error
            ? error.message
            : "Refuzul coletului nu s-a înregistrat.",
        variant: "destructive",
      });
      return false;
    } finally {
      setRejectingCOD(false);
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
        title: "Salvat",
        description: `Order status updated to ${formatStatus(newStatus)}`,
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Eroare",
        description:
          "Starea comenzii nu a putut fi actualizată. Încearcă din nou.",
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

  useEffect(() => () => requestController.current?.abort(), []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Se încarcă detaliile comenzii…</span>
          </div>
        </div>
      </div>
    );
  }

  if (loadError)
    return (
      <DashboardError
        message={loadError}
        onRetry={() => void fetchOrderDetails()}
      />
    );
  if (!order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Înapoi la comenzi
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">
                Comanda nu a fost găsită
              </h3>
              <p className="text-muted-foreground">
                Comanda solicitată nu a fost găsită.
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
  const isCODOrder = ["cash_on_delivery", "cod"].includes(
    String(order.paymentMethod || "").toLowerCase()
  );
  const codConsentInfo = isCODOrder ? getCodConsentInfo(order) : null;
  const codGuaranteeEvidence = isCODOrder
    ? parseCodGuaranteeEvidence(order.notes)
    : null;
  const canShowSupplierOrdersSection =
    order.paymentStatus === "PAID" || isCODOrder;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-3">
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm" className="mt-0.5">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Comenzi
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-10 mt-0.5" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Comanda #{order.orderNumber}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Plasată la{" "}
                {order.date
                  ? new Date(order.date).toLocaleDateString("ro-RO", {
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
                    Procesare: {formatWorkflowLabel(fulfillment.displayStatus)}
                  </span>
                  {fulfillment.hasMixedSuppliers && (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      Mixtă ({fulfillment.supplierCount} furnizori)
                    </span>
                  )}
                  {fulfillment.hasIssues && (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                      Necesită atenție
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Status Update Section */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}
            >
              {getStatusIcon(order.status)}
              {formatStatus(order.status)}
            </span>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="w-38">
                <SelectValue placeholder="Update status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROCESSING">În procesare</SelectItem>
                <SelectItem value="SHIPPED">Expediată</SelectItem>
                <SelectItem value="DELIVERED">Livrată</SelectItem>
                <SelectItem value="COMPLETED">Finalizată</SelectItem>
                <SelectItem value="CANCELLED">Anulată</SelectItem>
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
              Actualizează
            </Button>
          </div>
        </div>

        {order.manualShippingReviewRequired && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <MessageSquareWarning className="mt-0.5 h-5 w-5 text-amber-700" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Este necesară verificarea expedierii
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  {order.shippingReviewReason ||
                    "This order needs manual supplier/shipping work before fulfillment can continue."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Reason Field - full width below header row */}
        {newStatus === "CANCELLED" && (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <label
              htmlFor="cancellationReason"
              className="block text-sm font-medium text-red-800 mb-2"
            >
              Motivul anulării{" "}
              <span className="font-normal text-red-600">(Opțional)</span>
            </label>
            <Textarea
              id="cancellationReason"
              placeholder="Scrie motivul anulării. Acesta va fi inclus în e-mailul către client."
              value={cancellationReason}
              onChange={e => setCancellationReason(e.target.value)}
              className="min-h-[80px] border-red-200 focus:border-red-400 bg-white"
            />
            <p className="text-xs text-red-600 mt-1">
              Motivul se trimite clientului în e-mailul de anulare.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                Produsele comenzii
                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                  {order.items.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {order.items.map(item => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-5 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      {item.isBook ? (
                        <Image
                          src={
                            item.book?.coverImage ??
                            "/images/book-placeholder.jpg"
                          }
                          alt={item.name}
                          width={80}
                          height={80}
                          className="w-20 h-20 object-cover rounded-lg border shadow-sm"
                        />
                      ) : (
                        <Image
                          src={
                            item.product?.images?.[0] ??
                            "/images/placeholder.jpg"
                          }
                          alt={item.name}
                          width={80}
                          height={80}
                          className="w-20 h-20 object-cover rounded-lg border shadow-sm"
                        />
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm leading-snug">
                            {item.isBook && item.book ? (
                              <Link
                                href={`/books/${item.book.slug}`}
                                className="hover:underline"
                                target="_blank"
                              >
                                {item.name}
                              </Link>
                            ) : item.product ? (
                              <Link
                                href={`/products/${item.product.slug}`}
                                className="hover:underline"
                                target="_blank"
                              >
                                {item.name}
                              </Link>
                            ) : (
                              item.name
                            )}
                          </h4>
                          {item.isBook && item.book && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              de {item.book.author}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-sm">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.quantity} × {formatPrice(item.price)}
                          </p>
                        </div>
                      </div>
                      {!item.isDigital && (
                        <>
                          <div className="mt-2.5 flex flex-wrap gap-1.5 text-xs">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-600 font-medium">
                              {item.supplierName || "Nealocat la furnizor"}
                            </span>
                            <span
                              className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-600 font-mono"
                              title={
                                item.supplierSkus &&
                                item.supplierSkus.length > 0
                                  ? item.supplierSkus.join(", ")
                                  : undefined
                              }
                            >
                              {item.sku ||
                                item.product?.sku ||
                                (item.supplierSkus &&
                                item.supplierSkus.length > 1
                                  ? `${item.supplierSkus.length} SKUs`
                                  : "SKU necompletat")}
                            </span>
                            {Boolean((item.supplierLineCount || 0) > 1) && (
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-600 font-medium">
                                {item.supplierLineCount} poziții la furnizori
                              </span>
                            )}
                            {item.supplierOrderStatus && (
                              <span className="rounded-md bg-blue-50 border border-blue-100 px-2 py-0.5 text-blue-700 font-medium">
                                {item.supplierOrderStatus}
                              </span>
                            )}
                          </div>
                          {item.supplierSkus &&
                            item.supplierSkus.length > 1 && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Coduri componente:{" "}
                                {item.supplierSkus.join(", ")}
                              </p>
                            )}
                        </>
                      )}
                      {item.isDigital && (
                        <div className="mt-2 flex gap-1.5">
                          <span className="rounded-md bg-violet-50 border border-violet-100 px-2 py-0.5 text-xs text-violet-700 font-medium">
                            Digital
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Supplier Orders Section */}
          {canShowSupplierOrdersSection && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Comenzi la furnizori
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
                      Adaugă o comandă la furnizor
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
                              Situația comenzilor la furnizori
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Produse grupate după expedierea de pregătit la
                              fiecare furnizor
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
                              De plasat la furnizor
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
                              AWB de pregătit
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
                              Expediate / livrate
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
                              Probleme
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
                                      {group.lineCount} poziție
                                      {group.lineCount === 1 ? "" : "s"} ·
                                      Cantitate {group.totalQuantity}
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
                                    Urmărire: {group.trackingNumbers.join(", ")}
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
                                            "Produs fără denumire"}{" "}
                                          × {line.quantity}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          Stare înregistrată:{" "}
                                          {line.lineStatus || "N/A"}
                                        </p>
                                        {line.productSku && (
                                          <p className="text-xs text-muted-foreground font-mono">
                                            SKU: {line.productSku}
                                          </p>
                                        )}
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
                        Poziții la furnizori
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Urmează pașii de mai jos. Modifică manual starea numai
                        pentru cazurile speciale.
                      </p>
                    </div>
                    <div className="rounded-lg border bg-slate-50 p-4 space-y-2">
                      <p className="text-sm font-medium">
                        Pași de procesare pentru fiecare produs
                      </p>
                      <ol className="list-decimal pl-4 space-y-1 text-xs text-muted-foreground">
                        <li>
                          Plasează comanda pe site-ul furnizorului, apoi apasă{" "}
                          <strong>Plasată la furnizor</strong>.
                        </li>
                        <li>
                          Când furnizorul trimite AWB-ul, salvează numărul de
                          urmărire, apoi apasă <strong>AWB înregistrat</strong>.
                        </li>
                        <li>
                          După confirmarea preluării de către curier, apasă{" "}
                          <strong>Expediată</strong>.
                        </li>
                        <li>
                          După livrare, apasă <strong>Livrată</strong>.
                        </li>
                      </ol>
                      <p className="text-xs text-slate-600">
                        Starea comenzii clientului se actualizează automat din
                        stările produselor la furnizori.
                      </p>
                      <p className="text-xs text-slate-600">
                        Urmează pașii fiecărui furnizor pentru comenzile
                        dropshipping. Starea de sus arată situația întregii
                        comenzi.
                      </p>
                    </div>
                    {order.supplierOrders.map(so => {
                      const hasTracking = Boolean(so.trackingNumber?.trim());
                      const workflowHint = getSupplierLineWorkflowHint(so);
                      const checklistSteps = getSupplierLineChecklistSteps(so);
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
                                    Referință furnizor: {so.supplierOrderId}
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
                              Următoarea acțiune: {workflowHint.title}
                            </p>
                            <p className="mt-1 text-xs opacity-90">
                              {workflowHint.description}
                            </p>
                          </div>

                          <div className="rounded-md border bg-white p-3 space-y-2">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-sm font-medium">
                                Lista pașilor
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Rezolvă pasul curent, apoi continuă în ordine.
                              </p>
                            </div>
                            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
                              {checklistSteps.map(step => {
                                const stateClasses =
                                  step.state === "done"
                                    ? "border-green-200 bg-green-50"
                                    : step.state === "current"
                                      ? "border-blue-300 bg-blue-50 ring-1 ring-blue-200"
                                      : "border-slate-200 bg-slate-50";
                                const badgeClasses =
                                  step.state === "done"
                                    ? "bg-green-600 text-white"
                                    : step.state === "current"
                                      ? "bg-blue-600 text-white"
                                      : "bg-slate-200 text-slate-700";
                                return (
                                  <div
                                    key={`${so.id}-step-${step.index}`}
                                    className={`rounded-md border p-2 space-y-1 ${stateClasses}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold ${badgeClasses}`}
                                      >
                                        {step.index}
                                      </span>
                                      <span className="text-xs font-medium leading-tight">
                                        {step.title}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-tight">
                                      {step.detail}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {so.phase && (
                            <div>
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getPhaseColor(
                                  so.phase
                                )}`}
                              >
                                Etapa de procesare:{" "}
                                {formatWorkflowLabel(so.phase)}
                              </span>
                            </div>
                          )}

                          <div className="rounded-md border bg-slate-50/70 p-3 space-y-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm font-medium">
                                  Pașii 1, 3, 4 și 5
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Confirmă fiecare pas după ce l-ai finalizat.
                                  Pentru pasul 2, salvează AWB-ul în formularul
                                  de mai jos.
                                </p>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => copySupplierLineForOrdering(so)}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Copiază poziția furnizorului
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
                              {QUICK_SUPPLIER_WORKFLOW_ACTIONS.map(action => {
                                const isCurrent = so.status === action.status;
                                const isDisabled =
                                  savingSupplierStatusId === so.id ||
                                  Boolean(
                                    action.requiresTracking && !hasTracking
                                  );
                                return (
                                  <Button
                                    key={`${so.id}-${action.status}`}
                                    type="button"
                                    size="sm"
                                    variant={isCurrent ? "default" : "outline"}
                                    disabled={isDisabled}
                                    onClick={() =>
                                      applyQuickSupplierStatus(
                                        so,
                                        action.status
                                      )
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
                                Mai întâi pasul 2: salvează AWB-ul pentru a
                                activa <strong>AWB înregistrat</strong> și{" "}
                                <strong>Expediată</strong>.
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Cost:
                              </span>
                              <span className="ml-2 font-medium">
                                {formatOrderAmount(so.totalCost, "RON")}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Urmărire:
                              </span>
                              <span className="ml-2 font-medium">
                                {so.trackingNumber || "Not added yet"}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2 rounded-md border bg-white p-3">
                            <label
                              htmlFor={`admin-order-field-1-${so.id}`}
                              className="text-sm font-medium"
                            >
                              Stare manuală la furnizor · cazuri speciale
                            </label>
                            <p className="text-xs text-muted-foreground">
                              Folosește pașii de mai sus pentru procesarea
                              obișnuită. Acest selector este rezervat cazurilor
                              speciale.
                            </p>
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
                                <SelectTrigger
                                  id={`admin-order-field-1-${so.id}`}
                                  className="w-full sm:w-[260px]"
                                >
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
                                Salvează starea
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
                                      Rezolvarea lipsei de stoc
                                    </p>
                                  </div>
                                  <p className="text-xs text-red-800">
                                    Alege soluția, salveaz-o la poziția
                                    furnizorului și verifică mesajul înainte de
                                    a-l trimite clientului.
                                  </p>

                                  <div className="flex flex-wrap gap-2">
                                    {typeof oosOps.issueAgeHours ===
                                      "number" && (
                                      <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-700 border">
                                        Problema a apărut acum:{" "}
                                        {Math.floor(oosOps.issueAgeHours)}h
                                      </span>
                                    )}
                                    {typeof oosOps.inactivityHours ===
                                      "number" && (
                                      <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-700 border">
                                        Ultima activitate:{" "}
                                        {Math.floor(oosOps.inactivityHours)}ore
                                        în urmă
                                      </span>
                                    )}
                                    {oosOps.needsCustomerNotification ? (
                                      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 border border-red-200">
                                        Clientul nu a fost informat
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 border border-green-200">
                                        Contactul cu clientul este înregistrat
                                      </span>
                                    )}
                                    {oosOps.isSlaOverdue && (
                                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 border border-amber-200">
                                        Termen de revenire depășit (
                                        {OOS_SLA_WARNING_HOURS}
                                        ore)
                                      </span>
                                    )}
                                  </div>

                                  <div className="grid gap-3 md:grid-cols-2">
                                    <div className="space-y-2">
                                      <label
                                        htmlFor={`admin-order-field-2-${so.id}`}
                                        className="text-sm font-medium"
                                      >
                                        Soluție
                                      </label>
                                      <Select
                                        value={getOosDraft(so.id).action}
                                        onValueChange={value =>
                                          setOosDraft(so.id, {
                                            action:
                                              value as OosResolutionAction,
                                          })
                                        }
                                      >
                                        <SelectTrigger
                                          id={`admin-order-field-2-${so.id}`}
                                        >
                                          <SelectValue placeholder="Choose action" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {OOS_RESOLUTION_OPTIONS.map(
                                            option => (
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
                                            )
                                          )}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <label
                                        htmlFor={`admin-order-field-3-${so.id}`}
                                        className="text-sm font-medium"
                                      >
                                        Detalii interne
                                      </label>
                                      <Textarea
                                        id={`admin-order-field-3-${so.id}`}
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
                                    <label
                                      htmlFor={`admin-order-field-4-${so.id}`}
                                      className="text-sm font-medium"
                                    >
                                      Mesaj pentru client · previzualizare
                                    </label>
                                    <Textarea
                                      id={`admin-order-field-4-${so.id}`}
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
                                      Copiază mesajul pentru client
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
                                      Trimite e-mail privind lipsa de stoc
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
                                      Salvează soluția
                                    </Button>
                                  </div>

                                  <div className="space-y-3 rounded-md border bg-white/80 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                      <div>
                                        <p className="text-sm font-medium">
                                          Istoricul contactului cu clientul
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          Înregistrează când și cum ai contactat
                                          clientul și ce a răspuns.
                                        </p>
                                      </div>
                                      {oosOps.latestNotification?.timestamp && (
                                        <span className="text-xs text-muted-foreground">
                                          Ultimul contact:{" "}
                                          {oosOps.latestNotification.timestamp.toLocaleString()}
                                        </span>
                                      )}
                                    </div>

                                    {(!order?.email ||
                                      order.email === "N/A") && (
                                      <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                                        Comanda nu are e-mail de contact.
                                        Contactează clientul prin telefon sau
                                        WhatsApp și înregistrează rezultatul.
                                      </div>
                                    )}

                                    <div className="grid gap-3 md:grid-cols-2">
                                      <div className="space-y-2">
                                        <label
                                          htmlFor={`admin-order-field-5-${so.id}`}
                                          className="text-sm font-medium"
                                        >
                                          Canal
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
                                          <SelectTrigger
                                            id={`admin-order-field-5-${so.id}`}
                                          >
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
                                        <label
                                          htmlFor={`admin-order-field-6-${so.id}`}
                                          className="text-sm font-medium"
                                        >
                                          Rezumatul contactului
                                        </label>
                                        <Textarea
                                          id={`admin-order-field-6-${so.id}`}
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
                                      <label
                                        htmlFor={`admin-order-field-7-${so.id}`}
                                        className="text-sm font-medium"
                                      >
                                        Răspunsul clientului · opțional
                                      </label>
                                      <Textarea
                                        id={`admin-order-field-7-${so.id}`}
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
                                        Marchează clientul ca informat
                                      </Button>
                                    </div>
                                  </div>

                                  {oosOps.events.length > 0 && (
                                    <div className="space-y-2 rounded-md border bg-white/80 p-3">
                                      <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">
                                          Istoricul problemei de stoc
                                        </p>
                                        <span className="text-xs text-muted-foreground">
                                          {oosOps.events.length} eveniment
                                          {oosOps.events.length === 1
                                            ? ""
                                            : "s"}
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
                                                  {formatOosEventLabel(
                                                    event.tag
                                                  )}
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
                              <span className="text-sm font-medium">
                                Note pentru poziția furnizorului
                              </span>
                              <div className="rounded-md border bg-muted/30 p-2 text-xs whitespace-pre-wrap text-muted-foreground">
                                {so.notes}
                              </div>
                            </div>
                          )}

                          {/* Tracking Number */}
                          <div className="space-y-2 rounded-md border bg-slate-50/70 p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                Pasul 2 · Înregistrează AWB-ul furnizorului
                              </span>
                              {editingTracking === so.id ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingTracking(null);
                                    setTrackingInput("");
                                  }}
                                >
                                  Renunță
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
                                  {so.trackingNumber ? "Editează" : "Add"}
                                </Button>
                              )}
                            </div>
                            {editingTracking === so.id ? (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={trackingInput}
                                  onChange={e =>
                                    setTrackingInput(e.target.value)
                                  }
                                  placeholder="Enter AWB/tracking number"
                                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => updateTrackingNumber(so)}
                                >
                                  Salvează
                                </Button>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                {so.trackingNumber || "No tracking number"}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Salvarea AWB-ului poate actualiza starea la{" "}
                              <strong>AWB înregistrat</strong> când sunt
                              îndeplinite condițiile.
                            </p>
                          </div>

                          {so.carrier && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">
                                Curier:
                              </span>
                              <span className="ml-2">{so.carrier}</span>
                            </div>
                          )}

                          {so.shippedAt && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">
                                Expediat la:
                              </span>
                              <span className="ml-2">
                                {new Date(so.shippedAt).toLocaleDateString(
                                  "ro-RO"
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>Nu există încă o comandă plasată la furnizor</p>
                    <p className="text-xs mt-1">
                      Apasă „Adaugă o comandă la furnizor” pentru a începe
                      procesarea.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <User className="h-4 w-4" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div>
                <p className="font-semibold">{order.customer}</p>
                {order.email && order.email !== "N/A" ? (
                  <a
                    href={`mailto:${order.email}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {order.email}
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    E-mail indisponibil
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Adresa de livrare
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-0.5 text-sm">
                <p className="font-semibold">
                  {order.shippingAddress.fullName}
                </p>
                <p className="text-muted-foreground">
                  {order.shippingAddress.addressLine1}
                </p>
                {order.shippingAddress.addressLine2 && (
                  <p className="text-muted-foreground">
                    {order.shippingAddress.addressLine2}
                  </p>
                )}
                <p className="text-muted-foreground">
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.postalCode}
                </p>
                <p className="text-muted-foreground">
                  {order.shippingAddress.country}
                </p>
                {order.shippingAddress.phone && (
                  <p className="pt-2 font-medium">
                    {order.shippingAddress.phone}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                Plată
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Metodă</span>
                <span className="text-sm font-medium">
                  {order.paymentMethod === "card"
                    ? "Card"
                    : order.paymentMethod === "cod"
                      ? "Ramburs"
                      : order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Stare</span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                    order.paymentStatus?.toLowerCase() === "paid"
                      ? "bg-green-100 text-green-800"
                      : order.paymentStatus?.toLowerCase() === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {paymentStatusLabels[order.paymentStatus] ??
                    order.paymentStatus}
                </span>
              </div>
              {isCODOrder && codConsentInfo && (
                <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-amber-950">
                      Acceptarea condițiilor ramburs
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        codConsentInfo.accepted
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {codConsentInfo.accepted ? "Accepted" : "Not recorded"}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1.5 text-xs text-amber-950">
                    <div className="flex justify-between gap-3">
                      <span className="text-amber-800/80">Acceptată la</span>
                      <span className="font-medium">
                        {formatAdminDateTime(codConsentInfo.acceptedAt)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-amber-800/80">Versiune</span>
                      <span className="font-medium">
                        {codConsentInfo.version || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-amber-800/80">Sursa dovezii</span>
                      <span className="font-medium uppercase">
                        {codConsentInfo.source}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-amber-800/80">
                        Garanție autorizată
                      </span>
                      <span className="font-medium">
                        {codGuaranteeEvidence?.authorizedAt
                          ? formatAdminDateTime(
                              codGuaranteeEvidence.authorizedAt
                            )
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-amber-800/80">
                        Valoarea garanției
                      </span>
                      <span className="font-medium">
                        {typeof codGuaranteeEvidence?.authorizedAmount ===
                        "number"
                          ? formatPrice(codGuaranteeEvidence.authorizedAmount)
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-amber-800/80">
                        Identificatorul plății garanției
                      </span>
                      <span className="font-mono text-[11px]">
                        {codGuaranteeEvidence?.authorizedPaymentIntentId || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-amber-800/80">
                        Istoricul încasării garanției
                      </span>
                      <span className="font-medium">
                        {codGuaranteeEvidence?.capturedAt
                          ? `${formatPrice(codGuaranteeEvidence.capturedAmount || 0)} at ${formatAdminDateTime(
                              codGuaranteeEvidence.capturedAt
                            )}`
                          : "None recorded"}
                      </span>
                    </div>
                  </div>
                  <CodHoldSettlementNotice notes={order.notes} />
                  {codConsentInfo.termsSnapshot && (
                    <p className="mt-2 text-xs text-amber-900/90">
                      <span className="font-medium">
                        Situație înregistrată:
                      </span>{" "}
                      {codConsentInfo.termsSnapshot}
                    </p>
                  )}
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setCodDialogOpen(true)}
                      disabled={
                        rejectingCOD ||
                        order.status === "CANCELLED" ||
                        order.paymentStatus === "PAID"
                      }
                    >
                      {rejectingCOD ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Se procesează…
                        </>
                      ) : (
                        "Înregistrează refuzul coletului"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipment */}
          {hasPhysicalItems && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <Truck className="h-4 w-4" />
                  {courierName === "SAMEDAY" ? "Sameday" : "FanCourier"}{" "}
                  Expediere
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">AWB</span>
                  <span className="text-sm font-mono font-medium">
                    {activeShipment?.awbNumber || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Stare</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {formatWorkflowLabel(activeShipment?.status || "PENDING")}
                  </span>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  {activeShipment?.awbNumber &&
                    courierName === "FANCOURIER" && (
                      <Button
                        onClick={resendAwbEmail}
                        size="sm"
                        variant="outline"
                        disabled={resendingAwbEmail}
                        className="w-full"
                      >
                        {resendingAwbEmail ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Mail className="h-4 w-4 mr-2" />
                        )}
                        Retrimite e-mailul cu AWB
                      </Button>
                    )}
                  <Button
                    onClick={createAwb}
                    size="sm"
                    disabled={creatingAwb || Boolean(activeShipment?.awbNumber)}
                    className="w-full"
                    variant={activeShipment?.awbNumber ? "outline" : "default"}
                  >
                    {creatingAwb ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Package className="h-4 w-4 mr-2" />
                    )}
                    {activeShipment?.awbNumber ? "AWB creat" : "Creează AWB"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Totalul comenzii
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Livrare</span>
                <span>{formatPrice(order.shippingCost)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">TVA</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
              )}
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-700">
                  <span>
                    Reducere {order.couponCode && `(${order.couponCode})`}
                  </span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <Separator className="my-1" />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {codDialogOpen && (
        <CodRejectionDialog
          busy={rejectingCOD}
          onClose={() => setCodDialogOpen(false)}
          onConfirm={markCODRejected}
        />
      )}
    </div>
  );
}
