"use client";

import React from "react";

import { useTranslation } from "@/lib/i18n";

export default function FAQPage() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">{t("faqH1")}</h1>
      <div className="space-y-8 text-muted-foreground">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            {t("faqWhatAreStemH2")}
          </h2>
          <p className="text-lg leading-relaxed">{t("faqWhatAreStemAnswer")}</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            {t("faqAgeAppropriateH2")}
          </h2>
          <p className="text-lg leading-relaxed">
            {t("faqAgeAppropriateAnswer")}
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            {t("faqSafetyH2")}
          </h2>
          <p className="text-lg leading-relaxed">{t("faqSafetyAnswer")}</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            {t("faqEducationalH2")}
          </h2>
          <p className="text-lg leading-relaxed">
            Jucăriile STEM dezvoltă gândirea critică, creativitatea și
            abilitățile de rezolvare a problemelor prin joc interactiv și
            explorare practică.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            {t("faqPurchaseH2")}
          </h2>
          <p className="text-lg leading-relaxed">
            {t("faqReturnPolicyAnswer")}
          </p>
        </section>
      </div>
    </div>
  );
}
