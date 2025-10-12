"use client";

import React from "react";

import { useTranslation } from "@/lib/i18n";

export default function StemGuide2025Page() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto max-w-3xl px-3 sm:px-4 py-4 sm:py-6 md:py-10">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6">{t("guide2025H1")}</h1>
      <p className="text-[10px] sm:text-xs text-muted-foreground mb-3 sm:mb-4 md:mb-6">
        {t("guide2025Byline")} {new Date().toLocaleDateString("ro-RO")}
      </p>
      <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-4 sm:mb-6 md:mb-8">{t("guide2025Description")}</p>

      <div className="mb-4 sm:mb-6 md:mb-8 rounded-md border bg-white p-3 sm:p-4">
        <h2 className="text-sm sm:text-base md:text-lg font-semibold mb-1.5 sm:mb-2">
          {t("guide2025QuickSummary")}
        </h2>
        <ul className="list-disc ml-4 sm:ml-5 md:ml-6 text-xs sm:text-sm text-muted-foreground space-y-0.5 sm:space-y-1">
          <li>{t("guide2025QuickSummary1")}</li>
          <li>{t("guide2025QuickSummary2")}</li>
          <li>{t("guide2025QuickSummary3")}</li>
          <li>{t("guide2025QuickSummary4")}</li>
          <li>{t("guide2025QuickSummary5")}</li>
        </ul>
      </div>

      <nav
        aria-label={t("guide2025TableOfContents")}
        className="mb-4 sm:mb-6 md:mb-10 border rounded-md p-3 sm:p-4"
      >
        <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3">{t("guide2025TableOfContents")}</h2>
        <ol className="list-decimal ml-4 sm:ml-5 space-y-1 sm:space-y-2 text-xs sm:text-sm">
          <li>
            <a className="underline" href="#ce-sunt-stem">
              {t("guide2025WhatAreStem")}
            </a>
          </li>
          <li>
            <a className="underline" href="#categorii">
              {t("guide2025Categories")}
            </a>
          </li>
          <li>
            <a className="underline" href="#varsta">
              {t("guide2025AgeRecommendations")}
            </a>
          </li>
          <li>
            <a className="underline" href="#alegere">
              {t("guide2025HowToChoose")}
            </a>
          </li>
          <li>
            <a className="underline" href="#top">
              {t("guide2025TopRecommendations")}
            </a>
          </li>
          <li>
            <a className="underline" href="#faq">
              {t("guide2025Faq")}
            </a>
          </li>
        </ol>
      </nav>

      <section id="ce-sunt-stem" className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 md:mb-10">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">
          {t("guide2025WhatAreStemH2")}
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
          {t("guide2025WhatAreStemContent")}
        </p>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
          {t("guide2025WhatAreStemContent2")}
        </p>
      </section>

      <section id="categorii" className="space-y-4 sm:space-y-6 mb-6 sm:mb-8 md:mb-10">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">{t("guide2025CategoriesH2")}</h2>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <h3 className="text-base sm:text-lg md:text-xl font-semibold">
              {t("guide2025ScienceCategory")}
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
              {t("guide2025ScienceContent")}{" "}
              <a className="underline" href="/categories/science">
                /categories/science
              </a>
              .
            </p>
          </div>
          <div>
            <h3 className="text-base sm:text-lg md:text-xl font-semibold">
              {t("guide2025TechnologyCategory")}
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
              {t("guide2025TechnologyContent")}{" "}
              <a className="underline" href="/categories/technology">
                /categories/technology
              </a>
              .
            </p>
          </div>
          <div>
            <h3 className="text-base sm:text-lg md:text-xl font-semibold">
              {t("guide2025EngineeringCategory")}
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
              {t("guide2025EngineeringContent")}{" "}
              <a className="underline" href="/categories/engineering">
                /categories/engineering
              </a>
              .
            </p>
          </div>
          <div>
            <h3 className="text-base sm:text-lg md:text-xl font-semibold">
              {t("guide2025MathematicsCategory")}
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
              {t("guide2025MathematicsContent")}{" "}
              <a className="underline" href="/categories/mathematics">
                /categories/mathematics
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <section id="varsta" className="space-y-4 sm:space-y-6 mb-6 sm:mb-8 md:mb-10">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">
          {t("guide2025AgeRecommendationsH2")}
        </h2>
        <ul className="list-disc ml-4 sm:ml-5 md:ml-6 text-xs sm:text-sm md:text-base text-muted-foreground space-y-1 sm:space-y-2">
          <li>{t("guide2025AgeRecommendationsContent")}</li>
          <li>{t("guide2025AgeRecommendationsContent2")}</li>
          <li>{t("guide2025AgeRecommendationsContent3")}</li>
          <li>{t("guide2025AgeRecommendationsContent4")}</li>
        </ul>
        <p className="text-xs sm:text-sm">
          {t("guide2025SeeDedicatedPage")}{" "}
          <a className="underline" href="/jucarii-stem-dupa-varsta">
            {t("guide2025StemByAgeLink")}
          </a>
          .
        </p>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
          {t("guide2025PracticalSuggestion")}
        </p>
      </section>

      <section id="alegere" className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 md:mb-10">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">
          {t("guide2025HowToChooseH2")}
        </h2>
        <ol className="list-decimal ml-4 sm:ml-5 md:ml-6 text-xs sm:text-sm md:text-base text-muted-foreground space-y-1 sm:space-y-2">
          <li>{t("guide2025HowToChooseContent1")}</li>
          <li>{t("guide2025HowToChooseContent2")}</li>
          <li>{t("guide2025HowToChooseContent3")}</li>
          <li>{t("guide2025HowToChooseContent4")}</li>
        </ol>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
          {t("guide2025HowToChooseContent5")}
        </p>
      </section>

      <section id="top" className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 md:mb-10">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">
          {t("guide2025TopRecommendationsH2")}
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
          {t("guide2025TopRecommendationsContent")}{" "}
          <a className="underline" href="/products">
            /products
          </a>
          .
        </p>
      </section>

      <section id="faq" className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 md:mb-10">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">{t("guide2025Faq")}</h2>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
          {t("guide2025FaqContent")}{" "}
          <a className="underline" href="/faq">
            /faq
          </a>
          .
        </p>
      </section>

      <section className="space-y-2 sm:space-y-3 mb-4">
        <div className="rounded-lg border bg-gradient-to-r from-indigo-50 to-purple-50 p-4 sm:p-5 md:p-6 text-center">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-1.5 sm:mb-2">
            {t("guide2025ReadyToChoose")}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
            {t("guide2025ReadyToChooseContent")}
          </p>
          <a
            href="/products"
            className="inline-block px-4 py-1.5 sm:px-5 sm:py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition text-sm sm:text-base"
          >
            {t("guide2025SeeProducts")}
          </a>
        </div>
      </section>
    </div>
  );
}
