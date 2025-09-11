"use client";

import React from "react";

import { useTranslation } from "@/lib/i18n";

export default function StemGuide2025Page() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">{t("guide2025Title")}</h1>
      <p className="text-xs text-muted-foreground mb-6">
        {t("guide2025Byline")} {new Date().toLocaleDateString("ro-RO")}
      </p>
      <p className="text-muted-foreground mb-8">{t("guide2025Description")}</p>

      <div className="mb-8 rounded-md border bg-white p-4">
        <h2 className="text-lg font-semibold mb-2">
          {t("guide2025QuickSummary")}
        </h2>
        <ul className="list-disc ml-6 text-sm text-muted-foreground space-y-1">
          <li>{t("guide2025QuickSummary1")}</li>
          <li>{t("guide2025QuickSummary2")}</li>
          <li>{t("guide2025QuickSummary3")}</li>
          <li>{t("guide2025QuickSummary4")}</li>
          <li>{t("guide2025QuickSummary5")}</li>
        </ul>
      </div>

      <nav
        aria-label={t("guide2025TableOfContents")}
        className="mb-10 border rounded-md p-4"
      >
        <h2 className="font-semibold mb-3">{t("guide2025TableOfContents")}</h2>
        <ol className="list-decimal ml-5 space-y-2 text-sm">
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

      <section id="ce-sunt-stem" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">{t("guide2025WhatAreStem")}</h2>
        <p className="text-muted-foreground">
          {t("guide2025WhatAreStemContent")}
        </p>
        <p className="text-muted-foreground">
          {t("guide2025WhatAreStemContent2")}
        </p>
      </section>

      <section id="categorii" className="space-y-6 mb-10">
        <h2 className="text-2xl font-semibold">{t("guide2025Categories")}</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold">
              {t("guide2025ScienceCategory")}
            </h3>
            <p className="text-muted-foreground">
              {t("guide2025ScienceContent")}{" "}
              <a className="underline" href="/categories/science">
                /categories/science
              </a>
              .
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold">
              {t("guide2025TechnologyCategory")}
            </h3>
            <p className="text-muted-foreground">
              {t("guide2025TechnologyContent")}{" "}
              <a className="underline" href="/categories/technology">
                /categories/technology
              </a>
              .
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold">
              {t("guide2025EngineeringCategory")}
            </h3>
            <p className="text-muted-foreground">
              {t("guide2025EngineeringContent")}{" "}
              <a className="underline" href="/categories/engineering">
                /categories/engineering
              </a>
              .
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold">
              {t("guide2025MathematicsCategory")}
            </h3>
            <p className="text-muted-foreground">
              {t("guide2025MathematicsContent")}{" "}
              <a className="underline" href="/categories/mathematics">
                /categories/mathematics
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <section id="varsta" className="space-y-6 mb-10">
        <h2 className="text-2xl font-semibold">
          {t("guide2025AgeRecommendations")}
        </h2>
        <ul className="list-disc ml-6 text-muted-foreground space-y-2">
          <li>{t("guide2025AgeRecommendationsContent")}</li>
          <li>{t("guide2025AgeRecommendationsContent2")}</li>
          <li>{t("guide2025AgeRecommendationsContent3")}</li>
          <li>{t("guide2025AgeRecommendationsContent4")}</li>
        </ul>
        <p className="text-sm">
          {t("guide2025SeeDedicatedPage")}{" "}
          <a className="underline" href="/jucarii-stem-dupa-varsta">
            {t("guide2025StemByAgeLink")}
          </a>
          .
        </p>
        <p className="text-muted-foreground">
          {t("guide2025PracticalSuggestion")}
        </p>
      </section>

      <section id="alegere" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">{t("guide2025HowToChoose")}</h2>
        <ol className="list-decimal ml-6 text-muted-foreground space-y-2">
          <li>{t("guide2025HowToChooseContent1")}</li>
          <li>{t("guide2025HowToChooseContent2")}</li>
          <li>{t("guide2025HowToChooseContent3")}</li>
          <li>{t("guide2025HowToChooseContent4")}</li>
        </ol>
        <p className="text-muted-foreground">
          {t("guide2025HowToChooseContent5")}
        </p>
      </section>

      <section id="top" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">
          {t("guide2025TopRecommendations")}
        </h2>
        <p className="text-muted-foreground">
          {t("guide2025TopRecommendationsContent")}{" "}
          <a className="underline" href="/products">
            /products
          </a>
          .
        </p>
      </section>

      <section id="faq" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">{t("guide2025Faq")}</h2>
        <p className="text-muted-foreground">
          {t("guide2025FaqContent")}{" "}
          <a className="underline" href="/faq">
            /faq
          </a>
          .
        </p>
      </section>

      <section className="space-y-3 mb-4">
        <div className="rounded-lg border bg-gradient-to-r from-indigo-50 to-purple-50 p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">
            {t("guide2025ReadyToChoose")}
          </h2>
          <p className="text-sm text-muted-foreground mb-3">
            {t("guide2025ReadyToChooseContent")}
          </p>
          <a
            href="/products"
            className="inline-block px-5 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            {t("guide2025SeeProducts")}
          </a>
        </div>
      </section>
    </div>
  );
}
