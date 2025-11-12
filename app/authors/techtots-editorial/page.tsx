import type { Metadata } from "next";
import Link from "next/link";
import React from "react";
import {
  ArrowRight,
  GraduationCap,
  PenLine,
  Sparkles,
  Users,
} from "lucide-react";

import {
  glassCardClass,
  glassPanelClass,
  gradientButtonClass,
  homeBackgroundClass,
  homeContentWrapperClass,
  homeOverlayBottomClass,
  homeOverlayTopClass,
} from "@/features/home/components/homeTheme";
import { createMetadata } from "@/lib/metadata";

const recommendedArticles = [
  {
    title: "Ghidul Complet al Jucăriilor STEM 2025",
    description:
      "Un framework practic pentru a alege jucăriile STEM potrivite vârstei și obiectivelor educaționale.",
    href: "/ghid-jucarii-stem-2025",
    category: "Ghid strategic",
    readingTime: "11 min",
  },
  {
    title: "Jucării STEM după vârstă",
    description:
      "Roadmap vizual și recomandări concrete pentru fiecare etapă de dezvoltare, de la 3 la 12 ani.",
    href: "/jucarii-stem-dupa-varsta",
    category: "Framework pe vârste",
    readingTime: "8 min",
  },
  {
    title: "Beneficiile jucăriilor STEM",
    description:
      "Cum transformă joaca în progres măsurabil la matematică, logică, creativitate și autonomie.",
    href: "/beneficiile-jucariilor-stem",
    category: "Analiză de impact",
    readingTime: "6 min",
  },
];

const editorialFocusAreas = [
  {
    title: "Curriculum STEM aplicat",
    description:
      "Convertim metodologia STEM în ghiduri ușor de implementat pentru părinți și educatori.",
    icon: GraduationCap,
    stat: "45+ ghiduri structurate",
  },
  {
    title: "Povești din comunitate",
    description:
      "Documentăm transformările familiilor TechTots și cele mai eficiente ritualuri de învățare.",
    icon: Users,
    stat: "10k+ familii intervievate",
  },
  {
    title: "Experimente verificate",
    description:
      "Testăm fiecare kit STEM înainte de recomandare și documentăm pașii, dificultatea și rezultatele.",
    icon: PenLine,
    stat: "320+ experimente validate",
  },
  {
    title: "Trenduri & inovație",
    description:
      "Scanăm noutățile din educație și tehnologie pentru a aduce primele recomandări în România.",
    icon: Sparkles,
    stat: "24 rapoarte anuale",
  },
];

const editorialSeries = [
  {
    label: "STEM Transformation Playbook",
    summary:
      "Seria premium cu planuri de 30-60 zile pentru a transforma complet obiceiurile de învățare.",
  },
  {
    label: "Micro Experimente Săptămânale",
    summary:
      "Experimente rapide (15-20 min) care mențin curiozitatea vie fără pregătire complexă.",
  },
  {
    label: "STEM & AI Parenting Lab",
    summary:
      "Strategii pentru a integra AI și tehnologia într-un mod sigur, creativ și controlat.",
  },
];

export const metadata: Metadata = createMetadata({
  title: "TechTots Editorial | STEM Insights & Parenting Playbooks",
  description:
    "Descoperă echipa TechTots Editorial: specialiști în curriculum STEM, ghiduri premium și transformarea experiențelor părinților în playbook-uri aplicate.",
  pathWithoutLocale: "/authors/techtots-editorial",
  translations: {
    ro: {
      title: "TechTots Editorial | Playbook-uri STEM pentru părinți",
      description:
        "Echipa TechTots Editorial documentează transformările familiilor și dezvoltă ghiduri STEM premium pentru părinți și educatori.",
    },
    en: {
      title: "TechTots Editorial | STEM Insights & Parenting Playbooks",
      description:
        "Meet the TechTots Editorial team: specialists turning real family transformations into actionable STEM learning playbooks.",
    },
  },
  structuredData: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TechTots Editorial",
    url: "https://www.techtots.ro/authors/techtots-editorial",
    sameAs: [
      "https://www.linkedin.com/company/techtots-romania/",
      "https://www.instagram.com/techtots_magazin/",
    ],
    description:
      "Echipa editorială TechTots creează ghiduri STEM ultra-practice, bazate pe cercetare și experiențe reale ale părinților.",
  },
});

export default function TechTotsEditorialAuthorPage() {
  return (
    <div className={homeBackgroundClass}>
      <div className={homeOverlayTopClass} aria-hidden />
      <div className={homeOverlayBottomClass} aria-hidden />

      <div
        className={`${homeContentWrapperClass} pt-24 pb-16 sm:pt-28 md:pt-32`}
      >
        <section className="relative container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div
            className={`${glassPanelClass} relative overflow-hidden border-white/10 bg-slate-950/70 px-5 py-10 text-slate-100 shadow-2xl shadow-black/40 sm:px-8 sm:py-12`}
          >
            <div
              className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-sky-500/15 to-indigo-500/25 opacity-80"
              aria-hidden
            />
            <div
              className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl"
              aria-hidden
            />
            <div className="relative z-10 flex flex-col gap-6 sm:gap-8">
              <div className="max-w-2xl space-y-3 sm:space-y-4">
                <span className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200">
                  TechTots Editorial
                  <Sparkles className="h-3.5 w-3.5 text-emerald-200" />
                </span>
                <h1 className="text-3xl font-extrabold leading-tight text-white drop-shadow-[0_25px_56px_rgba(15,23,42,0.65)] sm:text-4xl md:text-5xl">
                  Playbook-urile STEM care transformă copiii în inventatori
                </h1>
                <p className="text-sm text-slate-200 sm:text-base">
                  Echipa editorială TechTots face curatoria tuturor ghidurilor,
                  experimentelor și rapoartelor noastre. Documentăm transformări
                  reale ale familiilor și le convertim în strategii simplu de
                  implementat, cu rezultate măsurabile în 30-60 de zile.
                </p>
              </div>

              <div className="grid gap-4 text-xs text-slate-200 sm:grid-cols-3 sm:text-sm">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-inner shadow-black/30">
                  <p className="font-semibold text-white">Focus editorial</p>
                  <p className="text-slate-300">
                    Curriculum STEM aplicat + transformarea obiceiurilor de
                    învățare.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-inner shadow-black/30">
                  <p className="font-semibold text-white">Metodologie</p>
                  <p className="text-slate-300">
                    Observăm familii reale, testăm kituri în laborator și
                    sintetizăm playbook-uri.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-inner shadow-black/30">
                  <p className="font-semibold text-white">Misiune</p>
                  <p className="text-slate-300">
                    Transformăm “Nu-mi place matematica” în “Ce experiment facem
                    azi?”
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="text-sm text-slate-200 sm:text-base">
                  Pregătim lunar peste{" "}
                  <span className="font-semibold text-white">40 de articole</span>
                  , experimentăm cu peste{" "}
                  <span className="font-semibold text-white">25 de kituri STEM</span>{" "}
                  și construim playbook-uri folosite de
                  <span className="font-semibold text-white"> 10,000+</span>{" "}
                  familii.
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                  <Link
                    href="/products"
                    className={`${gradientButtonClass} flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold shadow-lg transition hover:scale-[1.02] sm:text-base`}
                  >
                    Descoperă kiturile recomandate
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/blog"
                    className="flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/30 transition hover:border-white/30 hover:bg-white/15"
                  >
                    Citește toate articolele
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto mt-12 max-w-6xl px-4 sm:mt-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:gap-8">
            <div
              className={`${glassPanelClass} border-white/10 bg-slate-950/70 p-6 text-slate-100 shadow-2xl shadow-black/40 sm:p-8`}
            >
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                Ce documentăm și livrăm în fiecare playbook
              </h2>
              <p className="mt-3 text-sm text-slate-300 sm:text-base">
                Echipa editorială lucrează în sprinturi săptămânale alături de
                specialiști STEM, psihologi educaționali și părinți din
                comunitate pentru a crea materiale ultra-practice.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {editorialFocusAreas.map(area => {
                  const Icon = area.icon;
                  return (
                    <div
                      key={area.title}
                      className={`${glassCardClass} relative overflow-hidden border-white/10 bg-slate-900/70 p-5 shadow-lg shadow-black/30`}
                    >
                      <div
                        className="absolute inset-x-0 -top-20 h-28 rounded-full bg-emerald-400/10 blur-3xl"
                        aria-hidden
                      />
                      <div className="relative z-10 flex flex-col gap-3">
                        <Icon className="h-6 w-6 text-emerald-200" />
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {area.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-300">
                            {area.description}
                          </p>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
                          {area.stat}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <aside
              className={`${glassPanelClass} border-white/10 bg-slate-950/70 p-6 text-slate-100 shadow-2xl shadow-black/40 sm:p-8`}
            >
              <h2 className="text-xl font-semibold text-white sm:text-2xl">
                Serii editoriale recurente
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Primești documentație completă, resurse printabile și planuri
                gata de implementat.
              </p>

              <div className="mt-6 space-y-4">
                {editorialSeries.map(series => (
                  <div
                    key={series.label}
                    className={`${glassCardClass} border-white/10 bg-slate-900/65 p-4 shadow-inner shadow-black/30`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
                      {series.label}
                    </p>
                    <p className="mt-2 text-sm text-slate-200">
                      {series.summary}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200 sm:text-sm">
                <Sparkles className="h-5 w-5 text-emerald-200" />
                <span>
                  Abonează-te la newsletter-ul TechTots pentru acces anticipat
                  la serii noi și playbook-uri pilot.
                </span>
              </div>
            </aside>
          </div>
        </section>

        <section className="container mx-auto mt-12 max-w-6xl px-4 sm:mt-16 sm:px-6 lg:px-8">
          <div
            className={`${glassPanelClass} border-white/10 bg-slate-950/70 p-6 text-slate-100 shadow-2xl shadow-black/40 sm:p-8`}
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                  Articole recomandate de echipa editorială
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
                  Începe cu cele mai citite resurse – fiecare articol include
                  check-list-uri descărcabile și pași acționabili pentru acasă.
                </p>
              </div>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:border-white/30 hover:bg-white/15"
              >
                Explorează biblioteca completă
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {recommendedArticles.map(article => (
                <article
                  key={article.href}
                  className={`${glassCardClass} group relative overflow-hidden border-white/10 bg-slate-900/70 p-6 shadow-lg shadow-black/35 transition hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_25px_60px_-15px_rgba(56,189,248,0.45)]`}
                >
                  <div
                    className="absolute inset-x-0 -top-28 h-32 rounded-full bg-sky-400/15 blur-3xl transition group-hover:bg-emerald-400/20"
                    aria-hidden
                  />
                  <div className="relative z-10 flex flex-col gap-3">
                    <span className="inline-flex w-fit items-center justify-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-sky-200">
                      {article.category}
                    </span>
                    <h3 className="text-lg font-semibold text-white sm:text-xl">
                      {article.title}
                    </h3>
                    <p className="text-sm text-slate-200">
                      {article.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>{article.readingTime} de citire</span>
                      <Link
                        href={article.href}
                        className="inline-flex items-center gap-1 text-emerald-200 transition hover:text-emerald-100"
                      >
                        Citește articolul
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
