"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Ban, ArrowLeft, Loader2, CheckCircle } from "lucide-react";

export default function CheckoutCancelledPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<"idle" | "checking" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const tryRecoverPayment = async () => {
      const urlOrderId = searchParams.get("orderId");
      const storedOrderId =
        sessionStorage.getItem("pendingOrderId") ||
        sessionStorage.getItem("netopia_order_id");
      const orderId = urlOrderId || storedOrderId;

      if (!orderId) {
        setStatus("idle");
        setMessage("Plata a fost anulată sau nu există o comandă activă.");
        return;
      }

      setStatus("checking");
      setMessage("Verificăm statusul plății...");

      try {
        const forceParam = process.env.NODE_ENV === "development" ? "&force=1" : "";
        const res = await fetch(
          `/api/payments/netopia/status?orderId=${encodeURIComponent(orderId)}${forceParam}`,
          { cache: "no-store" }
        );
        const data = await res.json();

        if (data.status === "paid" || data.status === "refunded") {
          setStatus("success");
          setMessage("Plata a fost procesată. Te redirecționăm către confirmare...");

          sessionStorage.removeItem("netopia_order_id");
          sessionStorage.removeItem("netopia_payment_method");
          sessionStorage.removeItem("pendingOrderId");
          sessionStorage.removeItem("pendingPaymentMethod");
          sessionStorage.removeItem("pendingPaymentProvider");
          sessionStorage.setItem("orderCompleted", "true");
          sessionStorage.setItem("orderId", orderId);

          setTimeout(() => {
            router.push(`/checkout/confirmation?orderId=${orderId}`);
          }, 1500);
          return;
        }

        setStatus("idle");
        setMessage("Plata nu a fost confirmată. Poți reîncerca.");
      } catch (err) {
        console.error("[NETOPIA][CANCELLED] status check failed", err);
        setStatus("error");
        setMessage("Nu am putut verifica plata. Poți încerca din nou.");
      }
    };

    tryRecoverPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-6 px-6 py-16 text-center text-slate-100">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400 ring-2 ring-red-500/40">
        {status === "success" ? (
          <CheckCircle className="h-7 w-7 text-green-400" aria-hidden="true" />
        ) : status === "checking" ? (
          <Loader2 className="h-7 w-7 animate-spin text-blue-300" aria-hidden="true" />
        ) : (
          <Ban className="h-7 w-7" aria-hidden="true" />
        )}
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">
          {status === "success"
            ? "Plata a fost confirmată"
            : status === "checking"
              ? "Verificăm plata..."
              : "Plata a fost anulată"}
        </h1>
        {message && <p className="text-slate-300">{message}</p>}
        {!message && (
          <p className="text-slate-300">
            Ai anulat plata Netopia. Coșul tău este păstrat, poți încerca din nou oricând.
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/checkout"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-600"
        >
          Reia plata
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-slate-600 transition hover:bg-slate-800/60"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi la produse
        </Link>
      </div>
    </main>
  );
}
