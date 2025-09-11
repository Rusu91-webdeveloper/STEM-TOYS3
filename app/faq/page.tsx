"use client";

import React from "react";

import { useTranslation } from "@/lib/i18n";

export default function FAQPage() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">{t("faqTitle")}</h1>
      <div className="space-y-6 text-muted-foreground">
        <div>
          <h2 className="text-xl font-semibold">{t("faqWhatAreStem")}</h2>
          <p>{t("faqWhatAreStemAnswer")}</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">{t("faqAgeAppropriate")}</h2>
          <p>{t("faqAgeAppropriateAnswer")}</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">{t("faqReturnPolicy")}</h2>
          <p>{t("faqReturnPolicyAnswer")}</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">{t("faqSafety")}</h2>
          <p>{t("faqSafetyAnswer")}</p>
        </div>
      </div>
    </div>
  );
}
