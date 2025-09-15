"use client";

import React from "react";

import { useTranslation } from "@/lib/i18n";

export default function StemByAgePage() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">{t("stemByAgeH2")}</h1>
      <p className="text-xs text-muted-foreground mb-6">
        {t("guide2025Byline")} {new Date().toLocaleDateString("ro-RO")}
      </p>
      <p className="text-muted-foreground mb-8">{t("byAgeDescription")}</p>
      <div className="mb-8 rounded-md border bg-white p-4">
        <h2 className="text-lg font-semibold mb-2">
          {t("guide2025QuickSummary")}
        </h2>
        <ul className="list-disc ml-6 text-sm text-muted-foreground space-y-1">
          <li>{t("byAgeQuickSummary1")}</li>
          <li>{t("byAgeQuickSummary2")}</li>
          <li>{t("byAgeQuickSummary3")}</li>
          <li>{t("byAgeQuickSummary4")}</li>
          <li>{t("byAgeQuickSummary5")}</li>
        </ul>
      </div>

      <nav
        aria-label={t("byAgeTableOfContents")}
        className="mb-10 border rounded-md p-4"
      >
        <h2 className="font-semibold mb-3">{t("byAgeTableOfContents")}</h2>
        <ol className="list-decimal ml-5 space-y-2 text-sm">
          <li>
            <a className="underline" href="#3-5">
              {t("byAge3to5")}
            </a>
          </li>
          <li>
            <a className="underline" href="#6-8">
              {t("byAge6to8")}
            </a>
          </li>
          <li>
            <a className="underline" href="#9-12">
              {t("byAge9to12")}
            </a>
          </li>
          <li>
            <a className="underline" href="#13plus">
              {t("byAge13plus")}
            </a>
          </li>
          <li>
            <a className="underline" href="#sfaturi">
              {t("byAgeSelectionTips")}
            </a>
          </li>
        </ol>
      </nav>

      <section id="3-5" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">{t("age3to5H2")}</h2>
        <ul className="list-disc ml-6 text-muted-foreground space-y-1">
          <li>{t("byAge3to5Content1")}</li>
          <li>{t("byAge3to5Content2")}</li>
          <li>{t("byAge3to5Content3")}</li>
        </ul>
        <p className="text-sm">
          {t("byAge3to5Explore")}{" "}
          <a className="underline" href="/categories/mathematics">
            {t("guide2025MathematicsCategory")}
          </a>{" "}
          și{" "}
          <a className="underline" href="/categories/engineering">
            {t("guide2025EngineeringCategory")}
          </a>
          .
        </p>
        <p className="text-muted-foreground">{t("byAge3to5Content4")}</p>
      </section>

      <section id="6-8" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">{t("age6to8H2")}</h2>
        <ul className="list-disc ml-6 text-muted-foreground space-y-1">
          <li>{t("byAge6to8Content1")}</li>
          <li>{t("byAge6to8Content2")}</li>
          <li>{t("byAge6to8Content3")}</li>
        </ul>
        <p className="text-sm">
          {t("byAge6to8See")}{" "}
          <a className="underline" href="/categories/technology">
            {t("guide2025TechnologyCategory")}
          </a>{" "}
          și{" "}
          <a className="underline" href="/categories/science">
            {t("guide2025ScienceCategory")}
          </a>
          .
        </p>
        <p className="text-muted-foreground">{t("byAge6to8Content4")}</p>
      </section>

      <section id="9-12" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">{t("age9to12H2")}</h2>
        <ul className="list-disc ml-6 text-muted-foreground space-y-1">
          <li>{t("byAge9to12Content1")}</li>
          <li>{t("byAge9to12Content2")}</li>
          <li>{t("byAge9to12Content3")}</li>
        </ul>
        <p className="text-sm">
          {t("byAge9to12Recommend")}{" "}
          <a className="underline" href="/categories/engineering">
            {t("guide2025EngineeringCategory")}
          </a>{" "}
          și{" "}
          <a className="underline" href="/categories/mathematics">
            {t("guide2025MathematicsCategory")}
          </a>
          .
        </p>
        <p className="text-muted-foreground">{t("byAge9to12Content4")}</p>
      </section>

      <section id="13plus" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">{t("age13plusH2")}</h2>
        <ul className="list-disc ml-6 text-muted-foreground space-y-1">
          <li>{t("byAge13plusContent1")}</li>
          <li>{t("byAge13plusContent2")}</li>
          <li>{t("byAge13plusContent3")}</li>
        </ul>
        <p className="text-sm">
          {t("byAge13plusDiscover")}{" "}
          <a className="underline" href="/categories/technology">
            {t("guide2025TechnologyCategory")}
          </a>{" "}
          și{" "}
          <a className="underline" href="/categories/engineering">
            {t("guide2025EngineeringCategory")}
          </a>
          .
        </p>
        <p className="text-muted-foreground">{t("byAge13plusContent4")}</p>
      </section>

      <section id="sfaturi" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">{t("byAgeSelectionTips")}</h2>
        <ol className="list-decimal ml-6 text-muted-foreground space-y-2">
          <li>{t("byAgeSelectionTipsContent1")}</li>
          <li>{t("byAgeSelectionTipsContent2")}</li>
          <li>{t("byAgeSelectionTipsContent3")}</li>
          <li>{t("byAgeSelectionTipsContent4")}</li>
        </ol>
        <p className="text-muted-foreground">
          {t("byAgeSelectionTipsContent5")}
        </p>
        <div className="mt-2">
          <a
            href="/products"
            className="inline-block px-5 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            {t("byAgeExploreProducts")}
          </a>
        </div>
      </section>
    </div>
  );
}
