"use client";

import React from "react";

import { useTranslation } from "@/lib/i18n";

export default function StemBenefitsPage() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">{t("benefitsH1")}</h1>
      <p className="text-xs text-muted-foreground mb-6">
        {t("guide2025Byline")} {new Date().toLocaleDateString("ro-RO")}
      </p>
      <p className="text-muted-foreground mb-8">{t("benefitsDescription")}</p>
      <div className="mb-8 rounded-md border bg-white p-4">
        <h2 className="text-lg font-semibold mb-2">
          {t("guide2025QuickSummary")}
        </h2>
        <ul className="list-disc ml-6 text-sm text-muted-foreground space-y-1">
          <li>{t("benefitsQuickSummary1")}</li>
          <li>{t("benefitsQuickSummary2")}</li>
          <li>{t("benefitsQuickSummary3")}</li>
          <li>{t("benefitsQuickSummary4")}</li>
          <li>{t("benefitsQuickSummary5")}</li>
        </ul>
      </div>

      <nav
        aria-label={t("benefitsTableOfContents")}
        className="mb-10 border rounded-md p-4"
      >
        <h2 className="font-semibold mb-3">{t("benefitsTableOfContents")}</h2>
        <ol className="list-decimal ml-5 space-y-2 text-sm">
          <li>
            <a className="underline" href="#gandire">
              {t("benefitsCriticalThinking")}
            </a>
          </li>
          <li>
            <a className="underline" href="#creativitate">
              {t("benefitsCreativity")}
            </a>
          </li>
          <li>
            <a className="underline" href="#colaborare">
              {t("benefitsCollaboration")}
            </a>
          </li>
          <li>
            <a className="underline" href="#autonomie">
              {t("benefitsAutonomy")}
            </a>
          </li>
          <li>
            <a className="underline" href="#transfer">
              {t("benefitsTransfer")}
            </a>
          </li>
        </ol>
      </nav>

      <section id="gandire" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">
          {t("benefitsCriticalThinkingH2")}
        </h2>
        <p className="text-muted-foreground">
          {t("benefitsCriticalThinkingContent1")}
        </p>
        <p className="text-muted-foreground">
          {t("benefitsCriticalThinkingContent2")}
        </p>
      </section>

      <section id="creativitate" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">{t("benefitsCreativityH2")}</h2>
        <p className="text-muted-foreground">
          {t("benefitsCreativityContent1")}
        </p>
        <p className="text-muted-foreground">
          {t("benefitsCreativityContent2")}
        </p>
      </section>

      <section id="colaborare" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">
          {t("benefitsCollaborationH2")}
        </h2>
        <p className="text-muted-foreground">
          {t("benefitsCollaborationContent1")}
        </p>
        <p className="text-muted-foreground">
          {t("benefitsCollaborationContent2")}
        </p>
      </section>

      <section id="autonomie" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">{t("benefitsAutonomy")}</h2>
        <p className="text-muted-foreground">{t("benefitsAutonomyContent1")}</p>
        <p className="text-muted-foreground">{t("benefitsAutonomyContent2")}</p>
      </section>

      <section id="transfer" className="space-y-3 mb-10">
        <h2 className="text-2xl font-semibold">{t("benefitsTransfer")}</h2>
        <p className="text-muted-foreground">{t("benefitsTransferContent1")}</p>
        <p className="text-muted-foreground">{t("benefitsTransferContent2")}</p>
        <p className="text-sm">
          {t("benefitsExploreCategories")}{" "}
          <a className="underline" href="/categories/science">
            {t("guide2025ScienceCategory")}
          </a>
          ,{" "}
          <a className="underline" href="/categories/technology">
            {t("guide2025TechnologyCategory")}
          </a>
          ,{" "}
          <a className="underline" href="/categories/engineering">
            {t("guide2025EngineeringCategory")}
          </a>
          ,{" "}
          <a className="underline" href="/categories/mathematics">
            {t("guide2025MathematicsCategory")}
          </a>
          .
        </p>
        <div className="mt-2">
          <a
            href="/products"
            className="inline-block px-5 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            {t("benefitsSeeProducts")}
          </a>
        </div>
      </section>
    </div>
  );
}
