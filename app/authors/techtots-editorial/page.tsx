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
  },
  {
    title: "Comunitate de părinți",
    description:
      "Documentăm experiențele familiilor TechTots și cele mai eficiente moduri de a introduce STEM în rutina zilnică.",
    icon: Users,
  },
  {
    title: "Produse testate",
    description:
      "Fiecare produs recomandat pe platformă este analizat din perspectiva valorii educaționale înainte de a fi listat.",
    icon: PenLine,
  },
  {
    title: "Conținut actualizat",
    description:
      "Actualizăm ghidurile și articolele pe măsură ce apar produse noi sau cercetări relevante în educația STEM.",
    icon: Sparkles,
  },
];

const editorialSeries = [
  {
    label: "Ghiduri pe grupe de vârstă",
    summary:
      "Resurse structurate pentru fiecare etapă de dezvoltare — de la joaca senzorială la robotică avansată.",
  },
  {
    label: "Experimente acasă",
    summary:
      "Activități STEM simple, cu materiale accesibile, gândite pentru părinții ocupați.",
  },
  {
    label: "Alegeri informate",
    summary:
      "Comparații și analize ale categoriilor de jucării educative, pentru cumpărători care vor să înțeleagă ce cumpără.",
  },
];

export const metadata: Metadata = createMetadata({
  title: "TechTots Editorial | Ghiduri STEM și resurse pentru părinți",
  description:
    "Echipa TechTots Editorial creează ghiduri STEM practice, articole despre jucării educative și resurse pentru familiile din România care vor să susțină dezvoltarea copiilor prin joacă.",
  pathWithoutLocale: "/authors/techtots-editorial",
  translations: {
    ro: {
      title: "TechTots Editorial | Ghiduri STEM pentru părinți",
      description:
        "Ghiduri STEM, articole educative și resurse pentru părinții care vor să susțină dezvoltarea copiilor prin joacă structurată.",
    },
    en: {
      title: "TechTots Editorial | STEM Guides & Parenting Resources",
      description:
        "The TechTots Editorial team creates practical STEM guides, educational toy reviews and resources for Romanian families.",
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
      "Echipa editorială TechTots creează ghiduri STEM practice și articole despre jucării educative pentru familiile din România.",
  },
});

export default function TechTotsEditorialAuthorPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Ambient background glows */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(56,189,248,0.08),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(16,185,129,0.06),transparent_40%)]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-6xl space-y-12 px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-8">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl shadow-black/50 sm:p-12">
          <div className="relative overflow-hidden">
            <div
              className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"
              aria-hidden
            />
            <div className="relative z-10 max-w-3xl space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-300">
                TechTots Editorial
                <Sparkles className="h-3.5 w-3.5" />
              </span>

              <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
                Ghiduri STEM practice pentru familii din România
              </h1>

              <p className="text-base text-slate-300 sm:text-lg">
                Echipa editorială TechTots scrie ghiduri, articole și resurse
                despre jucării educative și educație STEM — conținut bazat pe
                experiențele reale ale familiilor și pe valoarea educațională a
                produselor pe care le comercializăm.
              </p>

              <div className="grid gap-4 pt-2 sm:grid-cols-3">
                {[
                  {
                    label: "Focus editorial",
                    value: "Curriculum STEM aplicat pentru părinți",
                  },
                  {
                    label: "Metodologie",
                    value: "Ghiduri practice, produse analizate, comunitate",
                  },
                  {
                    label: "Misiune",
                    value: "Joaca structurată ca motor de dezvoltare",
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {label}
                    </p>
                    <p className="mt-1 text-sm text-slate-200">{value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 via-sky-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
                >
                  Descoperă produsele recomandate
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Citește toate articolele
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Focus areas + Series ─────────────────────────────── */}
        <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          {/* Focus areas */}
          <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-xl shadow-black/40 sm:p-8">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              Ce acoperă conținutul nostru
            </h2>
            <p className="mt-2 text-sm text-slate-400 sm:text-base">
              Scriem pentru părinți și educatori care vor să înțeleagă cum să
              folosească jucăriile STEM ca unelte de dezvoltare, nu doar ca
              cadouri.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {editorialFocusAreas.map(area => {
                const Icon = area.icon;
                return (
                  <div
                    key={area.title}
                    className="rounded-2xl border border-white/10 bg-slate-800 p-5"
                  >
                    <Icon className="h-5 w-5 text-emerald-400" />
                    <h3 className="mt-3 text-base font-semibold text-white">
                      {area.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {area.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Editorial series */}
          <aside className="rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-xl shadow-black/40 sm:p-8">
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Serii de conținut
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Organizăm articolele în serii tematice pentru a fi ușor de urmărit
              pas cu pas.
            </p>

            <div className="mt-6 space-y-4">
              {editorialSeries.map(series => (
                <div
                  key={series.label}
                  className="rounded-2xl border border-white/10 bg-slate-800 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-sky-300">
                    {series.label}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">{series.summary}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              <p className="text-sm text-slate-300">
                Abonează-te la newsletter-ul TechTots pentru a primi noile ghiduri
                direct în inbox.
              </p>
            </div>
          </aside>
        </section>

        {/* ── Recommended articles ─────────────────────────────── */}
        <section className="rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-xl shadow-black/40 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                Articole recomandate
              </h2>
              <p className="mt-1 max-w-xl text-sm text-slate-400">
                Resurse de bază pentru familiile care abia încep să exploreze
                jucăriile STEM.
              </p>
            </div>
            <Link
              href="/blog"
              className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Toate articolele
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedArticles.map(article => (
              <Link
                key={article.href}
                href={article.href}
                className="group rounded-2xl border border-white/10 bg-slate-800 p-6 transition hover:-translate-y-1 hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-500/10"
              >
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-sky-300">
                  {article.category}
                </span>
                <h3 className="mt-3 text-base font-semibold text-white group-hover:text-sky-300 sm:text-lg">
                  {article.title}
                </h3>
                <p className="mt-2 text-sm text-slate-400">{article.description}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>{article.readingTime} de citire</span>
                  <span className="flex items-center gap-1 text-emerald-400 transition group-hover:text-emerald-300">
                    Citește
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
