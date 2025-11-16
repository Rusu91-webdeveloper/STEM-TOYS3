"use client";

import { formatDistance } from "date-fns";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  glassCardClass,
  glassPanelClass,
  gradientButtonClass,
} from "@/features/home/components/homeTheme";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useOptimizedSession } from "@/lib/auth/SessionContext";

// Define return types
type ReturnReason =
  | "DOES_NOT_MEET_EXPECTATIONS"
  | "DAMAGED_OR_DEFECTIVE"
  | "WRONG_ITEM_SHIPPED"
  | "CHANGED_MIND"
  | "ORDERED_WRONG_PRODUCT"
  | "OTHER";

type ReturnStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "RECEIVED"
  | "REFUNDED";

interface ReturnItem {
  id: string;
  reason: ReturnReason;
  details: string | null;
  status: ReturnStatus;
  createdAt: string;
  order: {
    orderNumber: string;
    createdAt: string;
  };
  orderItem: {
    name: string;
    price: number;
    quantity: number;
    product: {
      id: string;
      name: string;
      slug: string;
      images: string[];
      sku: string;
    };
  };
}

const STATUS_BADGES: Record<ReturnStatus, { label: string; classes: string }> = {
  PENDING: {
    label: "Pending",
    classes: "border-amber-400/40 bg-amber-500/20 text-amber-100",
  },
  APPROVED: {
    label: "Approved",
    classes: "border-sky-400/40 bg-sky-500/20 text-sky-100",
  },
  REJECTED: {
    label: "Rejected",
    classes: "border-rose-400/40 bg-rose-500/20 text-rose-100",
  },
  RECEIVED: {
    label: "Received",
    classes: "border-purple-400/40 bg-purple-500/20 text-purple-100",
  },
  REFUNDED: {
    label: "Refunded",
    classes: "border-emerald-400/40 bg-emerald-500/20 text-emerald-100",
  },
};

const REASON_LABELS: Record<ReturnReason, string> = {
  DOES_NOT_MEET_EXPECTATIONS: "Does not meet expectations",
  DAMAGED_OR_DEFECTIVE: "Damaged or defective",
  WRONG_ITEM_SHIPPED: "Wrong item shipped",
  CHANGED_MIND: "Changed my mind",
  ORDERED_WRONG_PRODUCT: "Ordered wrong product",
  OTHER: "Other reason",
};

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { data: session, status } = useOptimizedSession();
  const isAuthenticated = status === "authenticated" && Boolean(session?.user);
  const emptyStateHref = isAuthenticated ? "/account/orders" : "/auth/login";
  const emptyStateCtaLabel = isAuthenticated
    ? "View your orders"
    : "Log in to view orders";

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/returns/user");

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setReturns(data.returns || []);
      } catch (error) {
        console.error("Error fetching returns:", error);
        toast({
          title: "Error",
          description: "Failed to load your returns. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReturns();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-slate-100">
        <Loader2 className="h-10 w-10 animate-spin text-sky-300" />
      </div>
    );
  }

  if (returns.length === 0) {
    return (
      <div
        className={cn(
          glassPanelClass,
          "mt-6 space-y-4 rounded-3xl border-white/10 bg-slate-900/70 p-10 text-center text-slate-100 shadow-xl shadow-black/30"
        )}
      >
        <h3 className="text-lg font-semibold">No returns found</h3>
        <p className="text-slate-300">
          You haven't initiated any returns yet. Explore your orders to start a return.
        </p>
        <Button
          asChild
          className={cn(
            "mx-auto inline-flex min-w-[200px] justify-center transition hover:scale-[1.02]",
            gradientButtonClass
          )}
        >
          <Link href={emptyStateHref}>{emptyStateCtaLabel}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-100">
      <div
        className={cn(
          glassPanelClass,
          "flex flex-col gap-1 border-white/10 bg-slate-900/70 px-5 py-4 shadow-xl shadow-black/30"
        )}
      >
        <h1 className="text-2xl font-bold tracking-tight">Your Returns</h1>
        <p className="text-sm text-slate-300">
          Track the status of every item you've requested to send back.
        </p>
      </div>

      <div className="space-y-4">
        {returns.map(returnItem => {
          const badge = STATUS_BADGES[returnItem.status];

          return (
            <div
              key={returnItem.id}
              className={cn(
                glassCardClass,
                "border-white/10 bg-slate-900/60 p-6 text-slate-100 shadow-lg shadow-black/30"
              )}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                  {returnItem.orderItem.product.images?.[0] && (
                    <div className="relative mx-auto h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:mx-0">
                      <Image
                        src={returnItem.orderItem.product.images[0]}
                        alt={returnItem.orderItem.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="min-w-0 space-y-1">
                    <h3 className="text-base font-semibold">
                      {returnItem.orderItem.name}
                    </h3>
                    <div className="text-sm text-slate-300">
                      Order #{returnItem.order.orderNumber} •
                      {" "}
                      {formatDistance(
                        new Date(returnItem.createdAt),
                        new Date(),
                        { addSuffix: true }
                      )}
                    </div>
                    <div className="text-sm">
                      <span className="text-slate-400">Reason:</span>{" "}
                      <span className="font-medium text-slate-100">
                        {REASON_LABELS[returnItem.reason]}
                      </span>
                      {returnItem.details && (
                        <p className="mt-1 text-sm italic text-slate-300">
                          {returnItem.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Badge
                  className={cn(
                    "w-fit border px-3 py-1 text-xs uppercase tracking-wide",
                    badge.classes
                  )}
                >
                  {badge.label}
                </Badge>
              </div>

              {returnItem.status === "APPROVED" && (
                <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/15 p-4 text-sm text-emerald-100">
                  Your return has been approved. Check your email for the return shipping label.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
