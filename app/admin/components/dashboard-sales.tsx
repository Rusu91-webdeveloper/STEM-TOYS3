import Link from "next/link";
import { useId } from "react";

import { formatRon } from "@/lib/admin/dashboard-metrics";
import type { DashboardData } from "@/lib/admin/dashboard-types";

export function DashboardSales({ data }: { data: DashboardData }) {
  const gradientId = useId();
  const days = data.salesByDay;
  const maximum = Math.max(1, ...days.map(day => day.value));
  const points = days
    .map(
      (day, index) =>
        `${days.length > 1 ? (index / (days.length - 1)) * 600 : 300},${170 - (day.value / maximum) * 150}`
    )
    .join(" ");
  const area = `0,180 ${points} 600,180`;
  const dateLabel = (date: string) =>
    new Date(`${date}T12:00:00Z`).toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "short",
      timeZone: "Europe/Bucharest",
    });
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-950">
            Evoluția comenzilor achitate
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            RON · după data plasării comenzii
          </p>
        </div>
        <Link
          href="/admin/analytics/sales"
          className="text-xs font-medium text-violet-700 hover:underline"
        >
          Raport de vânzări →
        </Link>
      </div>
      {data.summary.paidOrders === 0 ? (
        <div className="flex h-48 items-center justify-center text-center text-sm text-slate-500">
          Nu există comenzi achitate în RON în perioada selectată.
        </div>
      ) : (
        <div className="mt-5">
          <p className="mb-2 text-right text-[11px] text-slate-400">
            {formatRon(maximum)}
          </p>
          <svg
            viewBox="0 0 600 180"
            className="h-44 w-full"
            preserveAspectRatio="none"
            role="img"
            aria-label={`Evoluție zilnică: ${formatRon(data.summary.paidOrderValue)} în perioada selectată. Valorile sunt disponibile în tabelul de mai jos.`}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[30, 100, 170].map(y => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="600"
                y2={y}
                stroke="#f1f5f9"
                strokeDasharray="4 4"
              />
            ))}
            <polygon points={area} fill={`url(#${gradientId})`} />
            {days.length === 1 && (
              <circle
                cx="300"
                cy={170 - (days[0].value / maximum) * 150}
                r="5"
                fill="#7c3aed"
              />
            )}
            <polyline
              points={points}
              fill="none"
              stroke="#7c3aed"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
            />
          </svg>
          <div className="mt-2 flex justify-between text-[11px] text-slate-400">
            <span>{dateLabel(days[0].date)}</span>
            <span>{dateLabel(days[days.length - 1].date)}</span>
          </div>
        </div>
      )}
      <details className="mt-3 border-t border-slate-100 pt-3">
        <summary className="cursor-pointer text-xs font-medium text-slate-500">
          Vezi valorile zilnice
        </summary>
        <div className="mt-3 max-h-52 overflow-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Valoarea zilnică a comenzilor achitate în RON
            </caption>
            <thead>
              <tr>
                <th scope="col" className="py-2 text-left">
                  Data
                </th>
                <th scope="col" className="py-2 text-right">
                  Valoare
                </th>
              </tr>
            </thead>
            <tbody>
              {days.map(day => (
                <tr key={day.date} className="border-t border-slate-100">
                  <td className="py-2">{dateLabel(day.date)}</td>
                  <td className="py-2 text-right">{formatRon(day.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

export function DashboardTopProducts({
  products,
}: {
  products: DashboardData["topProducts"];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-slate-950">Produse fizice de top</h2>
      <p className="mt-1 text-xs text-slate-500">
        După unitățile din comenzile achitate în RON.
      </p>
      {products.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          Nicio vânzare de produse fizice în această perioadă.
        </p>
      ) : (
        <ol className="mt-4 divide-y divide-slate-100">
          {products.map((product, index) => (
            <li key={product.id} className="flex items-center gap-3 py-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-medium text-violet-700">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/products/${product.id}`}
                  className="line-clamp-2 text-sm font-medium text-slate-800 hover:text-violet-700"
                >
                  {product.name}
                </Link>
                <p className="mt-1 text-xs text-slate-500">
                  {product.sales} {product.sales === 1 ? "unitate" : "unități"}
                </p>
              </div>
              <span className="whitespace-nowrap text-xs font-medium text-slate-700">
                {formatRon(product.revenue)}
              </span>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-400">
        Valoarea produselor este brută, înainte de reducerile la nivel de
        comandă și retururi. Cărțile digitale au administrare separată.
      </p>
    </section>
  );
}
