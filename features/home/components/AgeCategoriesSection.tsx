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
    defaultDesc: "Dezvoltarea abilităților senzoriale și a coordonării mână-ochi.",
    icon: Smile,
    href: "/products?ageGroup=PRESCHOOL_3_5",
  },
  {
    age: "6-8 Ani",
    translationKey: "age6to8",
    translationKeyTitle: "age6to8Title",
    translationKeyDesc: "age6to8Desc",
    defaultTitle: "Gândire Logică",
    defaultDesc: "Introducere în bazele programării vizuale și rezolvarea problemelor.",
    icon: BrainCircuit,
    href: "/products?ageGroup=ELEMENTARY_6_8",
  },
  {
    age: "9-12 Ani",
    translationKey: "age9to12",
    translationKeyTitle: "age9to12Title",
    translationKeyDesc: "age9to12Desc",
    defaultTitle: "Logică & Proiecte",
    defaultDesc: "Proiecte STEM captivante și concepte științifice aplicate practic.",
    icon: Lightbulb,
    href: "/products?ageGroup=MIDDLE_SCHOOL_9_12",
  },
  {
    age: "13+ Ani",
    translationKey: "age13plus",
    translationKeyTitle: "age13plusTitle",
    translationKeyDesc: "age13plusDesc",
    defaultTitle: "Inginerie & Robotică",
    defaultDesc: "Construcții avansate, circuite și robotică aplicată pentru inventatori.",
    icon: Bot,
    href: "/products?ageGroup=TEENS_13_PLUS",
  },
];

const AgeCategoriesSectionComponent = ({ t }: AgeCategoriesSectionProps) => {
  return (
    <section className="py-12 sm:py-16 bg-[#FAFBFC]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1E293B] mb-4">
            {t("shopByAgeTitle", "Alege după Vârstă")}
          </h2>
          <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto">
            {t(
              "shopByAgeSubtitle",
              "Curatoriat special pentru fiecare etapă a dezvoltării cognitive a copilului tău."
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {AGE_CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.age}
                className="flex flex-col bg-white rounded-[1.25rem] p-6 lg:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
              >
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#E0E7FF] text-[#4F46E5]">
                  <Icon className="h-6 w-6" />
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {t(category.translationKey, category.age)}
                </h3>
                
                <p className="text-[13px] font-semibold text-slate-500 mb-3 uppercase tracking-wider">
                  {t(category.translationKeyTitle, category.defaultTitle)}
                </p>
                
                <p className="text-sm text-slate-500 flex-grow mb-6 leading-relaxed">
                  {t(category.translationKeyDesc, category.defaultDesc)}
                </p>
                
                <Link
                  href={category.href}
                  className="inline-flex items-center text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] transition-colors mt-auto group"
                >
                  {t("viewProducts", "Vezi Produsele")}
                  <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export const AgeCategoriesSection = React.memo(AgeCategoriesSectionComponent);
