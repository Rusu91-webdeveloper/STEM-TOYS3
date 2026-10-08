import {
  CreditCard,
  ShoppingBag,
  Users,
  Package,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

import { formatRon, percentageChange } from "@/lib/admin/dashboard-metrics";
import type { DashboardData } from "@/lib/admin/dashboard-types";

function Comparison({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  const value = percentageChange(current, previous);
  return (
    <p className="mt-3 text-xs text-slate-500">
      {value === null
        ? "Fără bază de comparație"
        : `${value > 0 ? "+" : ""}${value.toLocaleString("ro-RO", { maximumFractionDigits: 1 })}% față de perioada anterioară`}
    </p>
  );
}

export function DashboardMetricCards({ data }: { data: DashboardData }) {
  const metrics = [
    {
      title: "Valoare comenzi achitate",
      value: formatRon(data.summary.paidOrderValue),
      hint: `${data.summary.paidOrders} ${data.summary.paidOrders === 1 ? "comandă achitată" : "comenzi achitate"} în RON`,
      href: "/admin/analytics/sales",
      icon: CreditCard,
      current: data.summary.paidOrderValue,
      previous: data.previous.paidOrderValue,
    },
    {
      title: "Comenzi plasate",
      value: data.summary.orders.toLocaleString("ro-RO"),
      hint: `${data.summary.cancelledOrders} ${data.summary.cancelledOrders === 1 ? "anulată" : "anulate"} în această perioadă`,
      href: "/admin/orders",
      icon: ShoppingBag,
      current: data.summary.orders,
      previous: data.previous.orders,
    },
    {
      title: "Clienți cu comenzi",
      value: data.summary.customers.toLocaleString("ro-RO"),
      hint: "Include cumpărătorii fără cont activ",
      href: "/admin/customers",
      icon: Users,
      current: data.summary.customers,
      previous: data.previous.customers,
    },
    {
      title: "Produse active",
      value: data.catalog.activeProducts.toLocaleString("ro-RO"),
      hint: `${data.attention.outOfStock} fără stoc disponibil acum`,
      href: "/admin/products",
      icon: Package,
    },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(metric => {
        const Icon = metric.icon;
        return (
          <Link
            key={metric.title}
            href={metric.href}
            className="group rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-violet-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-500">
                {metric.title}
              </p>
              <Icon
                className="h-4 w-4 shrink-0 text-violet-600"
                aria-hidden="true"
              />
            </div>
            <p className="mt-3 break-words text-2xl font-semibold tracking-tight text-slate-950">
              {metric.value}
            </p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-xs text-slate-500">{metric.hint}</p>
              <ArrowUpRight
                className="h-3.5 w-3.5 shrink-0 text-slate-400"
                aria-hidden="true"
              />
            </div>
            {metric.current !== undefined && metric.previous !== undefined ? (
              <Comparison current={metric.current} previous={metric.previous} />
            ) : (
              <p className="mt-3 text-xs text-slate-400">
                Situația curentă a catalogului
              </p>
            )}
          </Link>
        );
      })}
    </div>
  );
}
