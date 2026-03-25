"use client";

import { useState } from "react";

import { useTranslation } from "@/lib/i18n";

export default function NewsletterSignup() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubscribing(true);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSubscriptionStatus("success");
        setEmail("");
      } else {
        setSubscriptionStatus("error");
      }
    } catch {
      setSubscriptionStatus("error");
    } finally {
      setIsSubscribing(false);
      setTimeout(() => setSubscriptionStatus("idle"), 4000);
    }
  };

  return (
    <section className="bg-[#F1F5F9] py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl bg-white rounded-2xl shadow-[0_2px_24px_rgba(0,0,0,0.07)] px-6 py-10 sm:px-12 sm:py-12 text-center">

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-3">
            {t("joinEducatorsParents")}
          </h2>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-500 mb-7 max-w-md mx-auto leading-relaxed">
            {t("newsletterSubtitle")}
          </p>

          {/* Form */}
          <form
            onSubmit={handleNewsletterSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
            aria-label="Newsletter signup"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              {t("emailAddressPlaceholder")}
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t("emailAddressPlaceholder")}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20"
              required
            />
            <button
              type="submit"
              disabled={isSubscribing}
              className="shrink-0 rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubscribing ? t("subscribing") : t("getFreeResources")}
            </button>
          </form>

          {/* Disclaimer */}
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            {t("noSpamGuarantee", "Promitem să nu trimitem spam.")} {t("unsubscribeAnytime", "Te poți dezabona oricând.")}
          </p>

          {/* Status messages */}
          {subscriptionStatus === "success" && (
            <p
              className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
              role="status"
              aria-live="polite"
            >
              {t("subscriptionSuccessMessage")}
            </p>
          )}
          {subscriptionStatus === "error" && (
            <p
              className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
              role="alert"
              aria-live="polite"
            >
              {t("subscriptionErrorMessage")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
