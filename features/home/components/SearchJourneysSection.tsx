import {
  ArrowUpRight,
  Bot,
  Brain,
  GraduationCap,
  Layers3,
  MapPin,
  Microscope,
  Search,
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import {
  getRegionalStemLinks,
  nationalCommercialRoutes,
} from "@/lib/seo/regional-search";

const routeAccents = [
  {
    shell:
      "border-emerald-200/80 bg-[linear-gradient(180deg,rgba(236,253,245,0.95)_0%,rgba(255,255,255,0.98)_100%)]",
    badge: "bg-emerald-600 text-white",
    link: "text-emerald-700 group-hover:text-emerald-800",
  },
  {
    shell:
      "border-sky-200/80 bg-[linear-gradient(180deg,rgba(239,246,255,0.96)_0%,rgba(255,255,255,0.98)_100%)]",
    badge: "bg-sky-600 text-white",
    link: "text-sky-700 group-hover:text-sky-800",
  },
  {
    shell:
      "border-indigo-200/80 bg-[linear-gradient(180deg,rgba(238,242,255,0.96)_0%,rgba(255,255,255,0.98)_100%)]",
    badge: "bg-indigo-600 text-white",
    link: "text-indigo-700 group-hover:text-indigo-800",
  },
  {
    shell:
      "border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,251,235,0.96)_0%,rgba(255,255,255,0.98)_100%)]",
    badge: "bg-amber-500 text-slate-950",
    link: "text-amber-700 group-hover:text-amber-800",
  },
  {
    shell:
      "border-cyan-200/80 bg-[linear-gradient(180deg,rgba(236,254,255,0.96)_0%,rgba(255,255,255,0.98)_100%)]",
    badge: "bg-cyan-600 text-white",
    link: "text-cyan-700 group-hover:text-cyan-800",
  },
  {
    shell:
      "border-fuchsia-200/80 bg-[linear-gradient(180deg,rgba(253,244,255,0.96)_0%,rgba(255,255,255,0.98)_100%)]",
    badge: "bg-fuchsia-600 text-white",
    link: "text-fuchsia-700 group-hover:text-fuchsia-800",
  },
];

const routeMeta: Record<
  string,
  {
    title: string;
    subtitle: string;
    cta: string;
    icon: LucideIcon;
  }
> = {
  "/jucarii-stem": {
    title: "Unde încep?",
    subtitle:
      "Dacă vrei prima selecție STEM, pornește de aici.",
    cta: "Vezi selecția",
    icon: Layers3,
  },
  "/jucarii-educative": {
    title: "Cadouri cu rost",
    subtitle:
      "Când vrei învățare în joacă și cadouri care țin mai mult decât o zi, intră aici.",
    cta: "Descoperă oferta",
    icon: GraduationCap,
  },
  "/jucarii-inteligente": {
    title: "Minte activă",
    subtitle:
      "Dacă îți plac logica, puzzle-urile și jocurile care ridică nivelul de provocare, explorează categoria.",
    cta: "Vezi categoria",
    icon: Brain,
  },
  "/robotica-pentru-copii": {
    title: "Roboți și proiecte",
    subtitle:
      "Când copilul vrea să construiască, să programeze și să vadă cum „prinde viață” un kit, alege robotica.",
    cta: "Vezi roboții",
    icon: Bot,
  },
  "/jucarii-stem-dupa-varsta": {
    title: "Alegi pe vârstă",
    subtitle:
      "Dacă vrei să filtrezi rapid după etapa copilului (3–5, 6–8, 9–12 ani și mai mult), folosește ghidul.",
    cta: "Filtrează acum",
    icon: Layers3,
  },
  "/ghid-educatie-stem-romania": {
    title: "Citește înainte",
    subtitle:
      "Când vrei să compari, să înțelegi termenii și să citești recomandări înainte de comandă, deschide ghidul.",
    cta: "Deschide ghidul",
    icon: Microscope,
  },
};

export function SearchJourneysSection() {
  const regionalLinks = getRegionalStemLinks(5);

  return (
    <section className="px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,252,255,0.96)_100%)] px-4 py-6 shadow-[0_24px_60px_-46px_rgba(15,23,42,0.3)] sm:rounded-[2.25rem] sm:px-8 sm:py-10 lg:px-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(56,189,248,0.10),transparent_32%),radial-gradient(circle_at_85%_20%,rgba(16,185,129,0.08),transparent_28%),radial-gradient(circle_at_80%_85%,rgba(99,102,241,0.08),transparent_30%)]"
          />

          <div className="relative z-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-[56rem]">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-700 shadow-[0_12px_30px_-24px_rgba(16,185,129,0.55)]">
                  <Search className="h-3.5 w-3.5" />
                  Rute de Shopping
                </div>
                <h2 className="mt-3.5 max-w-5xl text-[1.65rem] font-black leading-[0.98] tracking-[-0.05em] text-slate-950 sm:mt-4 sm:text-[2.6rem] lg:text-[3.35rem]">
                  Incepe din colectia potrivita, nu dintr-un catalog prea mare
                </h2>
                <p className="mt-3 max-w-xl text-[13px] leading-5 text-slate-600 sm:mt-4 sm:text-base sm:leading-7 lg:text-[1.05rem]">
                  Alege ruta potrivita si ajungi mai repede la produsele
                  relevante.
                </p>
              </div>
              <Link
                href="/products"
                className="inline-flex h-10 items-center justify-center rounded-[1rem] border border-slate-200/90 bg-white/95 px-4 text-sm font-bold text-slate-800 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.35)] transition hover:border-slate-300 hover:text-slate-950 sm:h-12 sm:rounded-2xl sm:px-5"
              >
                Vezi tot catalogul
              </Link>
            </div>

            <div className="mt-7 grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
              {nationalCommercialRoutes.map((journey, index) => {
                const accent = routeAccents[index % routeAccents.length];
                const meta = routeMeta[journey.href];
                const Icon = meta?.icon || Layers3;
                const isFeatured = index === 0;

                return (
                  <Link
                    key={journey.href}
                    href={journey.href}
                    className={`group relative overflow-hidden rounded-[1.3rem] border p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_26px_55px_-42px_rgba(15,23,42,0.28)] sm:rounded-[1.7rem] sm:p-5 ${isFeatured ? `${accent.shell} border-white/80 shadow-[0_30px_70px_-48px_rgba(15,23,42,0.35)] md:col-span-2 xl:col-span-2 xl:grid xl:grid-cols-[minmax(0,1.12fr)_minmax(250px,0.72fr)] xl:gap-6 xl:p-6` : "border-slate-200/90 bg-white/88 backdrop-blur-sm hover:border-slate-300/90"}`}
                  >
                    <div
                      className={
                        isFeatured
                          ? "xl:flex xl:flex-col xl:justify-between"
                          : ""
                      }
                    >
                      <div className="mt-1 flex items-start justify-between gap-4">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <span
                            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] text-slate-900 sm:h-12 sm:w-12 sm:rounded-2xl ${isFeatured ? "border border-white/80 bg-white/85 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.28)]" : "border border-slate-200/80 bg-slate-50/90"}`}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[1.35rem] font-black tracking-[-0.04em] text-slate-950 sm:text-[1.8rem]">
                              {meta?.title || journey.label}
                            </p>
                            <p className="sr-only">{journey.label}</p>
                            <p className="mt-2 text-[13px] leading-5 text-slate-600 sm:text-sm sm:leading-6">
                              {meta?.subtitle || journey.description}
                            </p>
                          </div>
                        </div>
                        <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-slate-700" />
                      </div>

                      <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <span
                          className={
                            isFeatured
                              ? accent.link
                              : "text-slate-800 group-hover:text-slate-950"
                          }
                        >
                          {meta?.cta || "Vezi pagina"}
                        </span>
                      </div>
                    </div>

                    {isFeatured ? (
                      <div className="mt-5 rounded-[1.15rem] border border-white/80 bg-white/78 p-4 shadow-[0_20px_40px_-32px_rgba(15,23,42,0.22)] backdrop-blur-sm sm:rounded-[1.5rem] sm:p-5 xl:mt-0 xl:p-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 sm:text-[11px] sm:tracking-[0.22em]">
                          Start rapid
                        </p>
                        <h3 className="mt-3 text-[1.3rem] font-black leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-[1.65rem]">
                          De aici leagă tot ce ține de STEM în magazin
                        </h3>
                        <div className="mt-4 grid gap-2.5">
                          <div className="rounded-[1rem] border border-slate-200/80 bg-white/92 px-3 py-2.5 text-[13px] font-medium text-slate-700 sm:rounded-2xl sm:text-sm">
                            Jucării STEM, educative, inteligente și robotică
                          </div>
                          <div className="rounded-[1rem] border border-slate-200/80 bg-white/92 px-3 py-2.5 text-[13px] font-medium text-slate-700 sm:rounded-2xl sm:text-sm">
                            Cea mai bună intrare dacă e prima ta vizită
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 border-t border-slate-200/80 pt-6 sm:mt-11 sm:pt-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.26em] text-sky-700">
                    <MapPin className="h-3.5 w-3.5" />
                    Livrare rapidă în orașele tale
                  </div>
                  <h3 className="mt-3 text-[1.5rem] font-black leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-[1.9rem]">
                    Orasele mari raman la un click distanta
                  </h3>
                  <p className="mt-2 text-[13px] leading-5 text-slate-600 sm:text-sm sm:leading-6">
                    Paginile locale raman accesibile, intr-un format mai
                    discret.
                  </p>
                </div>
                <Link
                  href="/jucarii-stem"
                  className="inline-flex h-10 items-center justify-center rounded-[1rem] border border-slate-200/90 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950 sm:h-11 sm:rounded-2xl"
                >
                  Vezi hubul national STEM
                </Link>
              </div>

              <div className="mt-5 rounded-[1.3rem] border border-slate-200/80 bg-white/82 p-4 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.24)] backdrop-blur-sm sm:rounded-[1.65rem] sm:p-5">
                <div className="flex flex-wrap items-center gap-2.5">
                  {regionalLinks.map(link => (
                    <Link
                      key={`${link.href}-chip`}
                      href={link.href}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-slate-50/80 px-3 py-1.5 text-[13px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-950 sm:py-2 sm:text-sm"
                    >
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      {link.label.replace("Jucarii STEM ", "")}
                    </Link>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {regionalLinks.slice(0, 3).map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="group rounded-[1.15rem] border border-slate-200/80 bg-white/94 px-4 py-4 transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_38px_-34px_rgba(15,23,42,0.2)] sm:rounded-[1.35rem]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          <MapPin className="h-3.5 w-3.5" />
                          Local
                        </span>
                        <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-slate-700" />
                      </div>
                      <p className="mt-4 text-[1.25rem] font-black leading-[1.05] tracking-[-0.04em] text-slate-950 sm:text-[1.45rem]">
                        {link.label}
                      </p>
                      <p className="mt-2 text-[13px] leading-5 text-slate-600 sm:text-sm sm:leading-6">
                        Jucării STEM cu livrare rapidă în{" "}
                        {link.label.replace("Jucarii STEM ", "")}.
                      </p>
                      <div className="mt-4 flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                          Vezi pagina
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
