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
import {
  RETURN_POLICY_CUSTOMER_PAYS_RO,
  RETURN_POLICY_EVIDENCE_RO,
  RETURN_POLICY_SELLER_PAYS_RO,
  RETURN_WINDOW_LABEL_RO,
} from "@/lib/returns/policy";

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
  photos: string[];
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
    label: "În așteptare",
    classes: "border-amber-400/40 bg-amber-500/20 text-amber-100",
  },
  APPROVED: {
    label: "Aprobat",
    classes: "border-sky-400/40 bg-sky-500/20 text-sky-100",
  },
  REJECTED: {
    label: "Respins",
    classes: "border-rose-400/40 bg-rose-500/20 text-rose-100",
  },
  RECEIVED: {
    label: "Primit",
    classes: "border-purple-400/40 bg-purple-500/20 text-purple-100",
  },
  REFUNDED: {
    label: "Rambursat",
    classes: "border-emerald-400/40 bg-emerald-500/20 text-emerald-100",
  },
};

const REASON_LABELS: Record<ReturnReason, string> = {
  DOES_NOT_MEET_EXPECTATIONS: "Nu corespunde așteptărilor",
  DAMAGED_OR_DEFECTIVE: "Deteriorat sau defect",
  WRONG_ITEM_SHIPPED: "Produs greșit livrat",
  CHANGED_MIND: "M-am răzgândit",
  ORDERED_WRONG_PRODUCT: "Am comandat produsul greșit",
  OTHER: "Alt motiv",
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
        <h3 className="text-lg font-semibold">Nu ai returnări</h3>
        <p className="text-slate-300">
          Nu ai inițiat încă nicio returnare. Verifică comenzile pentru a iniția o returnare.
        </p>
        <Button
          asChild
          className={cn(
            "mx-auto inline-flex min-w-[200px] justify-center transition hover:scale-[1.02]",
            gradientButtonClass
          )}
        >
          <Link href={emptyStateHref}>{isAuthenticated ? "Vezi comenzile tale" : "Autentifică-te"}</Link>
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
        <h1 className="text-2xl font-bold tracking-tight">Returnările Tale</h1>
        <p className="text-sm text-slate-300">
          Urmărește statusul fiecărui produs pe care l-ai solicitat pentru returnare.
        </p>
        <div className="mt-3 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-xs text-sky-100">
          <p>
            Dreptul de retur se aplică în primele <strong>{RETURN_WINDOW_LABEL_RO}</strong> de la livrare.
          </p>
          <p className="mt-1">{RETURN_POLICY_CUSTOMER_PAYS_RO}</p>
          <p className="mt-1">{RETURN_POLICY_SELLER_PAYS_RO}</p>
          <p className="mt-1">{RETURN_POLICY_EVIDENCE_RO}</p>
        </div>
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
                      Comanda #{returnItem.order.orderNumber} •
                      {" "}
                      {formatDistance(
                        new Date(returnItem.createdAt),
                        new Date(),
                        { addSuffix: true }
                      )}
                    </div>
                    <div className="text-sm">
                      <span className="text-slate-400">Motiv:</span>{" "}
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

              {returnItem.photos?.length > 0 && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-300">
                    Dovezi încărcate
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    {returnItem.photos.length} fotografii salvate împreună cu această cerere.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {returnItem.photos.map((photo, index) => (
                      <a
                        key={`${returnItem.id}-${index}`}
                        href={photo}
                        target="_blank"
                        rel="noreferrer"
                        className="relative block h-20 w-20 overflow-hidden rounded-xl border border-white/10 bg-white/10"
                      >
                        <Image
                          src={photo}
                          alt={`Dovadă retur ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {returnItem.status === "PENDING" && (
                <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/15 p-4 text-sm text-amber-100">
                  Cererea ta de returnare este în așteptare. Vei primi un email când va fi procesată.
                </div>
              )}
              
              {returnItem.status === "APPROVED" && (
                <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/15 p-4 text-sm text-emerald-100">
                  Returnarea ta a fost aprobată. Verifică emailul pentru instrucțiunile de retur.
                </div>
              )}
              
              {returnItem.status === "REJECTED" && (
                <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/15 p-4 text-sm text-rose-100">
                  Cererea de returnare a fost respinsă. Contactează-ne pentru detalii.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
