import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import type { OperationsOverview } from "@/lib/admin/api";
import type { DashboardData } from "@/lib/admin/dashboard-types";

import { DashboardError } from "./dashboard-status";

interface Props {
  data: DashboardData;
  operations: OperationsOverview | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function DashboardAttention({
  data,
  operations,
  loading,
  error,
  retry,
}: Props) {
  const tasks = [
    {
      title: "Retururi deschise",
      hint: "Cereri în așteptare, aprobate sau primite",
      count: data.attention.openReturns,
      href: "/admin/returns",
    },
    {
      title: "Expediere de verificat",
      hint: "Comenzi marcate pentru verificare manuală",
      count: data.attention.shippingReview,
      href: "/admin/orders",
    },
    {
      title: "Plăți în așteptare",
      hint: "Include rambursul încă neîncasat",
      count: data.attention.awaitingPayment,
      href: "/admin/orders",
    },
    {
      title: "Produse fără stoc",
      hint: "Stoc activ minus cantitatea rezervată",
      count: data.attention.outOfStock,
      href: "/admin/products",
    },
    ...(operations
      ? [
          {
            title: "Comenzi de plasat la furnizor",
            hint: "Poziții achitate care așteaptă procesarea",
            count: operations.summary.readyToPlaceCount,
            href: "/admin/ops-queue",
          },
          {
            title: "Expedieri de pregătit",
            hint: "Poziții care așteaptă AWB sau confirmarea expedierii",
            count: operations.summary.awbWorkCount,
            href: "/admin/ops-queue",
          },
          {
            title: "Probleme la furnizori",
            hint: `${operations.summary.overdueIssueCount} restante · ${operations.summary.unnotifiedIssueCount} fără notificare`,
            count: operations.summary.issueCount,
            href: "/admin/fulfillment-issues",
          },
          {
            title: "Rambursări manuale de urmărit",
            hint: "Cazuri din coada problemelor de stoc",
            count: operations.summary.manualRefundsPendingCount,
            href: "/admin/fulfillment-issues",
          },
        ]
      : []),
  ].filter(task => task.count > 0);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-5">
        <div>
          <h2 className="font-semibold text-slate-950">Necesită atenție</h2>
          <p className="mt-1 text-xs text-slate-500">
            Sarcini deschise acum, indiferent de perioada raportului.
          </p>
        </div>
        <Link
          href="/admin/ops-queue"
          className="text-xs font-medium text-violet-700 hover:underline"
        >
          Toate sarcinile →
        </Link>
      </div>
      <div className="p-5">
        {error ? (
          <DashboardError
            message="Situația operațională nu a putut fi actualizată."
            stale={Boolean(operations)}
            onRetry={retry}
          />
        ) : null}
        {loading && !operations ? (
          <p role="status" className="mb-3 text-sm text-slate-500">
            Se verifică sarcinile furnizorilor…
          </p>
        ) : null}
        <div className="divide-y divide-slate-100">
          {tasks.map(task => (
            <Link
              key={task.title}
              href={task.href}
              className="flex min-h-16 items-center gap-3 py-3 hover:text-violet-700"
            >
              <span className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 px-2 text-sm font-semibold text-amber-800">
                {task.count}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{task.title}</p>
                <p className="mt-1 text-xs text-slate-500">{task.hint}</p>
              </div>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-slate-400"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
        {tasks.length === 0 ? (
          <div className="py-6 text-center">
            <CheckCircle2
              className="mx-auto mb-3 h-7 w-7 text-emerald-600"
              aria-hidden="true"
            />
            <p className="text-sm text-slate-600">
              {operations && !error
                ? "Nu există sarcini în categoriile verificate."
                : "Nu există sarcini în datele magazinului încărcate. Situația furnizorilor nu este confirmată."}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
