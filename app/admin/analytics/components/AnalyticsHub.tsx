import {
  ArrowUpRight,
  BarChart3,
  Calculator,
  Package,
  Users,
  Building2,
  Search,
  Settings,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

interface ReportLink {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  note?: string;
}
const reports: ReportLink[] = [
  {
    title: "Vânzări și comenzi",
    description:
      "Valoarea comenzilor achitate, evoluția zilnică și produsele fizice de top.",
    href: "/admin/analytics/sales",
    icon: BarChart3,
  },
  {
    title: "Costuri și marje",
    description: "Analizează costurile produselor și marjele calculate.",
    href: "/admin/analytics/unit-economics",
    icon: Calculator,
    note: "Estimările depind de costurile completate. Nu reprezintă profitul contabil.",
  },
  {
    title: "Catalog și stoc",
    description: "Verifică produsele, prețurile și cantitățile disponibile.",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "Clienți",
    description: "Consultă clienții magazinului și istoricul comenzilor lor.",
    href: "/admin/customers",
    icon: Users,
  },
  {
    title: "Furnizori și facturi",
    description: "Urmărește facturile și situația furnizorilor.",
    href: "/admin/supplier-invoices",
    icon: Building2,
  },
];

export function AnalyticsHub() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600">
          TechTots · Rapoarte
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Înțelege evoluția magazinului
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Alege informația de care ai nevoie pentru următoarea decizie.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {reports.map(report => {
          const Icon = report.icon;
          return (
            <Link
              key={report.href}
              href={report.href}
              className="rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-violet-300"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-xl bg-violet-50 p-3">
                  <Icon
                    className="h-5 w-5 text-violet-700"
                    aria-hidden="true"
                  />
                </span>
                <ArrowUpRight
                  className="h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
              </div>
              <h2 className="mt-5 font-semibold text-slate-950">
                {report.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {report.description}
              </p>
              {report.note ? (
                <p className="mt-3 text-xs leading-relaxed text-amber-800">
                  {report.note}
                </p>
              ) : null}
            </Link>
          );
        })}
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold">Măsurarea traficului</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
          Datele de trafic și publicitate depind de conectarea serviciilor și de
          evenimentele colectate. Verifică integrarea înainte de a folosi aceste
          rapoarte.
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href="/admin/seo/google-search-console"
            className="inline-flex min-h-11 items-center gap-2 text-sm text-violet-700 hover:underline"
          >
            <Search className="h-4 w-4" />
            Google Search Console
          </Link>
          <Link
            href="/admin/analytics/pixel-config"
            className="inline-flex min-h-11 items-center gap-2 text-sm text-violet-700 hover:underline"
          >
            <Settings className="h-4 w-4" />
            Configurare pixeli
          </Link>
        </div>
      </section>
      <p className="max-w-3xl text-xs leading-relaxed text-slate-500">
        Rapoartele predictive, analiza concurenței și vechea analiză a
        comportamentului au fost retrase din navigare: conțin cifre
        demonstrative sau au surse incomplete. Vor putea fi reactivate când
        datele reale sunt conectate.
      </p>
    </div>
  );
}
