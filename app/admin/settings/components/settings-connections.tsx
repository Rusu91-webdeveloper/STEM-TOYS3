import Link from "next/link";

import type { SettingsView } from "@/lib/admin/settings-view";

export function SettingsConnections({ data }: { data: SettingsView }) {
  const statuses = [
    {
      title: "Plăți online · Stripe",
      value:
        data.integrations.stripe === "missing"
          ? "Chei neconfigurate"
          : data.integrations.stripe === "test"
            ? "Chei pentru testare"
            : "Chei pentru producție",
      configured: data.integrations.stripe !== "missing",
    },
    {
      title: "E-mail tranzacțional · SMTP",
      value: data.integrations.email
        ? "Credențiale configurate"
        : "Credențiale neconfigurate",
      configured: data.integrations.email,
    },
    {
      title: "Fan Courier",
      value: data.integrations.fanCourier
        ? "Credențiale configurate"
        : "Credențiale neconfigurate",
      configured: data.integrations.fanCourier,
    },
  ];
  const links = [
    {
      href: "/admin/ops-queue",
      title: "Operațiuni zilnice",
      description: "Comenzi de procesat, furnizori și probleme de livrare.",
    },
    {
      href: "/admin/suppliers/feeds",
      title: "Sincronizări furnizori",
      description: "Surse de produse, importuri și actualizarea stocului.",
    },
    {
      href: "/admin/email-automation",
      title: "Automatizări e-mail",
      description: "Gestionează fluxurile de comunicare cu clienții.",
    },
    {
      href: "/admin/analytics/pixel-config",
      title: "Măsurare și pixeli",
      description: "Configurează instrumentele de măsurare ale magazinului.",
    },
  ];
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        <h2 className="text-lg font-semibold">Acces și integrări</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Acest panou și setările sale sunt rezervate administratorilor.
          Sesiunile au o durată maximă de 30 de zile. Autentificarea în doi pași
          nu este disponibilă în acest panou.
        </p>
        <div className="mt-5 divide-y divide-slate-100">
          {statuses.map(status => (
            <div
              key={status.title}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <p className="text-sm font-medium text-slate-800">
                {status.title}
              </p>
              <span
                className={`rounded-full px-3 py-1 text-xs ${status.configured ? "bg-violet-50 text-violet-800" : "bg-amber-50 text-amber-800"}`}
              >
                {status.value}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          Starea arată existența credențialelor, fără a expune cheile.
          Confirmarea plăților, a trimiterii e-mailurilor și a AWB-urilor se
          urmărește în operațiunile respective.
        </p>
      </section>
      <div className="grid gap-4 sm:grid-cols-2">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-violet-300"
          >
            <h3 className="text-sm font-semibold text-slate-900">
              {link.title} →
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              {link.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
