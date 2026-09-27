import { Mail, Phone } from "lucide-react";

import { appConfig } from "@/lib/config/app-config";

/**
 * Public supplier introduction. No marketplace stats, quotes, or performance claims.
 */
export function SupplierLanding() {
  const email = appConfig.contactEmail;
  const phone = appConfig.storePhone;

  return (
    <section className="container mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
          TechTots
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
          Devino furnizor TechTots
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-700">
          Lucrăm cu furnizori din România de jucării educaționale și STEM. Dacă
          vrei să colaborezi cu noi, scrie-ne sau sună-ne.
        </p>
        <div className="mt-8 space-y-3 text-sm text-slate-800">
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-sky-300 hover:text-sky-800"
          >
            <Mail className="h-4 w-4 text-sky-600" aria-hidden />
            <span>{email}</span>
          </a>
          <a
            href={`tel:${phone.replace(/[^\d+]/g, "")}`}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-sky-300 hover:text-sky-800"
          >
            <Phone className="h-4 w-4 text-sky-600" aria-hidden />
            <span>{phone}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
