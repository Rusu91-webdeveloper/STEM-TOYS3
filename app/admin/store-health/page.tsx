import Link from "next/link";

import { auth } from "@/lib/auth";
import { getStoreHealthReport } from "@/lib/monitoring/store-health";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Starea magazinului | TechTots Admin",
  robots: { index: false, follow: false },
};
const labels = {
  ok: "Fără incidente înregistrate",
  attention: "Necesită verificare",
  unavailable: "Date indisponibile",
  manual: "Confirmare manuală",
};

export default async function StoreHealthPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN")
    return (
      <p className="p-6">
        Accesul la starea operațională este rezervat administratorilor.
      </p>
    );
  const report = await getStoreHealthReport();
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-5 sm:p-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">
          Starea magazinului
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          O privire asupra incidentelor înregistrate și a comenzilor care pot
          necesita intervenție. Verificat la{" "}
          {new Date(report.checkedAt).toLocaleString("ro-RO", {
            timeZone: "Europe/Bucharest",
          })}
          .
        </p>
        <a
          href="/admin/store-health"
          className="mt-3 inline-flex min-h-11 items-center font-semibold text-sky-800 underline"
        >
          Actualizează starea
        </a>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {report.checks.map(check => (
          <section
            key={check.id}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <h2 className="font-bold text-slate-950">{check.label}</h2>
            <p
              className={`mt-3 font-semibold ${check.status === "attention" ? "text-red-800" : "text-slate-700"}`}
            >
              {labels[check.status]}
              {check.count !== null ? ` · ${check.count}` : ""}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {check.detail}
            </p>
            <Link
              href={check.href}
              className="mt-3 inline-flex min-h-11 items-center font-semibold text-sky-800 underline"
            >
              Vezi detaliile
            </Link>
          </section>
        ))}
      </div>
    </div>
  );
}
