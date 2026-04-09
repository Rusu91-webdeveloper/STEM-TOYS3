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
  <section className="bg-[#FAFBFC] py-10 sm:py-16">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
      <div className="mb-7 text-center sm:mb-14">
        <h2 className="mb-3 text-[2rem] font-extrabold leading-tight text-[#1E293B] sm:mb-4 sm:text-4xl">
          {t("shopByAgeTitle", "Alege după Vârstă")}
        </h2>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
          {t(
            "shopByAgeSubtitle",
            "Curatoriat special pentru fiecare etapă a dezvoltării cognitive a copilului tău."
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:gap-8">
        {AGE_CATEGORIES.map(category => (
          <Link
            key={category.age}
            href={category.href}
            className="group flex h-full flex-col rounded-[1.4rem] border border-slate-200/80 bg-white p-4 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.28)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_40px_-24px_rgba(15,23,42,0.3)] sm:rounded-[1.6rem] sm:p-6 lg:p-7"
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${category.accent.iconWrap} shadow-sm sm:h-12 sm:w-12`}
              >
                <category.icon className="h-5 w-5 sm:h-5 sm:w-5" />
              </div>
              <span
                className={`hidden rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] sm:inline-flex ${category.accent.chip}`}
              >
                {t(category.translationKeyTitle, category.defaultTitle)}
              </span>
            </div>

            <div className="mt-5 space-y-2 sm:mt-6 sm:space-y-3">
              <h3 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
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

            <div className="mt-5 flex items-center justify-between sm:mt-6">
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
