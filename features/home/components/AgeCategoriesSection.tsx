"use client";

import { ArrowRight, Bot, BrainCircuit, Lightbulb, Smile } from "lucide-react";
import Link from "next/link";
import React from "react";

interface AgeCategoriesSectionProps {
  t: (key: string, defaultValue?: string) => string;
}

const AGE_CATEGORIES = [
  {
    age: "3-5 Ani",
    translationKey: "age3to5",
    translationKeyTitle: "age3to5Title",
    translationKeyDesc: "age3to5Desc",
    defaultTitle: "Explorare Timpurie",
    defaultDesc:
      "Dezvoltarea abilităților senzoriale și a coordonării mână-ochi.",
    icon: Smile,
    href: "/products?ageGroup=PRESCHOOL_3_5",
    accent: {
      iconWrap: "bg-violet-100 text-violet-700",
      chip: "bg-violet-50 text-violet-700 border-violet-200",
      cta: "text-violet-700 hover:text-violet-800",
    },
  },
  {
    age: "6-8 Ani",
    translationKey: "age6to8",
    translationKeyTitle: "age6to8Title",
    translationKeyDesc: "age6to8Desc",
    defaultTitle: "Gândire Logică",
    defaultDesc:
      "Introducere în bazele programării vizuale și rezolvarea problemelor.",
    icon: BrainCircuit,
    href: "/products?ageGroup=ELEMENTARY_6_8",
    accent: {
      iconWrap: "bg-sky-100 text-sky-700",
      chip: "bg-sky-50 text-sky-700 border-sky-200",
      cta: "text-sky-700 hover:text-sky-800",
    },
  },
  {
    age: "9-12 Ani",
    translationKey: "age9to12",
    translationKeyTitle: "age9to12Title",
    translationKeyDesc: "age9to12Desc",
    defaultTitle: "Logică & Proiecte",
    defaultDesc:
      "Proiecte STEM captivante și concepte științifice aplicate practic.",
    icon: Lightbulb,
    href: "/products?ageGroup=MIDDLE_SCHOOL_9_12",
    accent: {
      iconWrap: "bg-amber-100 text-amber-700",
      chip: "bg-amber-50 text-amber-700 border-amber-200",
      cta: "text-amber-700 hover:text-amber-800",
    },
  },
  {
    age: "13+ Ani",
    translationKey: "age13plus",
    translationKeyTitle: "age13plusTitle",
    translationKeyDesc: "age13plusDesc",
    defaultTitle: "Inginerie & Robotică",
    defaultDesc:
      "Construcții avansate, circuite și robotică aplicată pentru inventatori.",
    icon: Bot,
    href: "/products?ageGroup=TEENS_13_PLUS",
    accent: {
      iconWrap: "bg-emerald-100 text-emerald-700",
      chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
      cta: "text-emerald-700 hover:text-emerald-800",
    },
  },
];

const AgeCategoriesSectionComponent = ({ t }: AgeCategoriesSectionProps) => (
  <section className="py-16 sm:py-20 lg:py-24">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
      <div className="mb-9 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.24em] text-blue-600">
            Găsește mai repede
          </p>
          <h2 className="text-[2rem] font-bold leading-tight tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-5xl">
            {t("shopByAgeTitle", "Alege după Vârstă")}
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
          {t(
            "shopByAgeSubtitle",
            "Curatoriat special pentru fiecare etapă a dezvoltării cognitive a copilului tău."
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:gap-8">
        {AGE_CATEGORIES.map((category, index) => (
          <Link
            key={category.age}
            href={category.href}
            className="group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.28)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_26px_60px_-38px_rgba(37,99,235,0.25)] sm:p-6 lg:p-7"
          >
            <span
              className="absolute right-4 top-3 text-5xl font-bold tracking-[-0.08em] text-slate-100 sm:right-5 sm:top-4"
              aria-hidden
            >
              0{index + 1}
            </span>
            <div className="flex items-start justify-between gap-3">
              <div
                className={`relative inline-flex h-11 w-11 items-center justify-center rounded-xl ${category.accent.iconWrap} sm:h-12 sm:w-12`}
              >
                <category.icon className="h-5 w-5 sm:h-5 sm:w-5" />
              </div>
              <span
                className={`hidden rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] sm:inline-flex ${category.accent.chip}`}
              >
                {t(category.translationKeyTitle, category.defaultTitle)}
              </span>
            </div>

            <div className="relative mt-8 space-y-2 sm:mt-10 sm:space-y-3">
              <h3 className="text-xl font-bold tracking-[-0.025em] text-slate-950 sm:text-2xl">
                {t(category.translationKey, category.age)}
              </h3>

              <p
                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] sm:hidden ${category.accent.chip}`}
              >
                {t(category.translationKeyTitle, category.defaultTitle)}
              </p>

              <p className="line-clamp-3 text-sm leading-6 text-slate-500 sm:line-clamp-none">
                {t(category.translationKeyDesc, category.defaultDesc)}
              </p>
            </div>

            <div className="relative mt-auto flex items-center justify-between pt-6">
              <span
                className={`inline-flex items-center text-sm font-bold transition-colors ${category.accent.cta}`}
              >
                <span className="sm:hidden">
                  {t("viewProductsShort", "Vezi")}
                </span>
                <span className="hidden sm:inline">
                  {t("viewProducts", "Vezi Produsele")}
                </span>
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export const AgeCategoriesSection = React.memo(AgeCategoriesSectionComponent);
