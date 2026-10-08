import Link from "next/link";

import {
  formatOrderAmount,
  orderStatusLabels,
  paymentStatusLabels,
} from "@/lib/admin/dashboard-metrics";
import type { RecentOrder } from "@/lib/admin/dashboard-types";

export function DashboardOrders({ orders }: { orders: RecentOrder[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
        <div>
          <h2 className="font-semibold text-slate-950">Ultimele comenzi</h2>
          <p className="mt-1 text-xs text-slate-500">
            Cele mai recente comenzi, din toate perioadele.
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="text-xs font-medium text-violet-700 hover:underline"
        >
          Vezi toate →
        </Link>
      </div>
      {orders.length === 0 ? (
        <p className="p-8 text-center text-sm text-slate-500">
          Nu există încă nicio comandă.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Ultimele comenzi și starea plății
            </caption>
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-500">
                <th scope="col" className="px-5 py-3 font-medium">
                  Comandă / client
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  Stare
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium">
                  Valoare
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map(order => (
                <tr key={order.id} className="align-top hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-semibold text-violet-700 hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                    <Link
                      href={`/admin/customers/${order.customerId}`}
                      className="mt-1 block text-xs text-slate-600 hover:underline"
                    >
                      {order.customer}
                    </Link>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {new Date(order.date).toLocaleDateString("ro-RO", {
                        timeZone: "Europe/Bucharest",
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </td>
                  <td className="px-3 py-4">
                    <span className="inline-block rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                      {orderStatusLabels[order.status] ?? order.status}
                    </span>
                    <p
                      className={`mt-2 text-[11px] ${["PAID", "COMPLETED"].includes(order.paymentStatus) ? "text-emerald-700" : "text-slate-500"}`}
                    >
                      {paymentStatusLabels[order.paymentStatus] ??
                        order.paymentStatus}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-slate-900">
                    {formatOrderAmount(order.amount, order.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
