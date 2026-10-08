import Link from "next/link";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  formatOrderAmount,
  orderStatusLabels,
  paymentStatusLabels,
} from "@/lib/admin/dashboard-metrics";

export interface AdminOrderNotification {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  currency: string;
  createdAt: string;
  manualShippingReviewRequired: boolean;
  shippingReviewReason?: string | null;
  customerName: string;
  customerEmail: string | null;
  supplierOrderCount: number;
  hasTracking: boolean;
  fulfillmentStatus: string;
  actionBucket: "needs_action" | "in_progress" | "done";
  actionLabel: string;
}

const actionLabels: Record<string, string> = {
  "Monitor fulfillment": "Urmărește livrarea",
  "Closed (cancelled)": "Comandă anulată",
  Completed: "Finalizată",
  "Manual shipping review required": "Verifică expedierea",
  "Create supplier lines": "Alocă produsele furnizorilor",
  "Resolve supplier issue": "Rezolvă problema furnizorului",
  "Set supplier line status after AWB upload": "Actualizează starea după AWB",
  "Mark supplier line as shipped": "Marchează expedierea",
  "Upload supplier AWB / tracking": "Adaugă AWB-ul furnizorului",
  "Place order to supplier": "Trimite comanda furnizorului",
  "In transit / awaiting delivery": "În tranzit",
  "Digital / no supplier action": "Produse digitale",
};

export function OrderNotificationItem({
  item,
  lastSeenAt,
  onSeen,
}: {
  item: AdminOrderNotification;
  lastSeenAt: string | null;
  onSeen: () => void;
}) {
  const isUnread =
    lastSeenAt !== null &&
    new Date(item.createdAt).getTime() > new Date(lastSeenAt).getTime();
  return (
    <DropdownMenuItem asChild className="p-0">
      <Link
        href={`/admin/orders/${item.id}`}
        onClick={onSeen}
        className="block cursor-pointer px-3 py-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">
                #{item.orderNumber}
              </span>
              {isUnread && (
                <span
                  className="h-2 w-2 shrink-0 rounded-full bg-red-500"
                  aria-label="Necitită"
                />
              )}
            </div>
            <p className="truncate text-xs text-slate-600">
              {item.customerName}
              {item.customerEmail ? ` • ${item.customerEmail}` : ""}
            </p>
            <p className="text-xs font-medium text-violet-700">
              {actionLabels[item.actionLabel] ?? item.actionLabel}
            </p>
            <p className="text-xs text-slate-500">
              {orderStatusLabels[item.status] ?? item.status} ·{" "}
              {paymentStatusLabels[item.paymentStatus] ?? item.paymentStatus}
            </p>
            <p className="text-xs text-slate-500">
              {formatOrderAmount(item.total, item.currency)}
              {item.hasTracking ? " · AWB adăugat" : ""}
              {item.supplierOrderCount > 0
                ? ` · ${item.supplierOrderCount} poziții la furnizori`
                : ""}
            </p>
            {item.manualShippingReviewRequired && item.shippingReviewReason && (
              <p className="line-clamp-2 text-[11px] text-amber-700">
                {item.shippingReviewReason}
              </p>
            )}
          </div>
          <time
            dateTime={item.createdAt}
            className="shrink-0 text-[11px] text-slate-500"
          >
            {new Date(item.createdAt).toLocaleString("ro-RO", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/Bucharest",
            })}
          </time>
        </div>
      </Link>
    </DropdownMenuItem>
  );
}
