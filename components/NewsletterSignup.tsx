"use client";

import { useState } from "react";
import { Mail, Sparkles } from "lucide-react";

import {
  glassPanelClass,
  gradientButtonClass,
} from "@/features/home/components/homeTheme";
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
        headers: {
          "Content-Type": "application/json",
        },
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
    <section className="relative overflow-hidden py-14 sm:py-16 md:py-20">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/95 to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%)] opacity-70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(165,180,252,0.18),_transparent_60%)] opacity-80" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          className={`${glassPanelClass} mx-auto flex max-w-4xl flex-col gap-6 rounded-3xl border-white/15 bg-white/10 px-6 py-10 shadow-[0_20px_60px_rgba(15,23,42,0.55)] backdrop-blur-2xl sm:px-10 sm:py-12`}
        >
          <div className="flex flex-col items-center text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-sky-200 sm:text-xs">
              <Sparkles className="h-4 w-4 text-sky-300" aria-hidden="true" />
              {t("exclusiveInsights", "Inspirație STEM exclusivă")}
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
              {t("joinEducatorsParents")}
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-200/85 sm:text-base">
              {t("newsletterSubtitle")}
            </p>
          </div>

          <form
            onSubmit={handleNewsletterSubmit}
            className="mx-auto flex w-full flex-col gap-3 rounded-2xl bg-slate-950/40 p-4 shadow-inner shadow-black/30 sm:flex-row sm:items-center sm:gap-4 sm:p-5"
            aria-label="Newsletter signup"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              {t("emailAddressPlaceholder")}
            </label>
            <div className="relative w-full">
              <Mail
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300"
              />
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t("emailAddressPlaceholder")}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-12 py-3 text-sm text-white placeholder:text-slate-300 outline-none transition focus:border-sky-400 focus:bg-slate-900/60 focus:ring-2 focus:ring-sky-400/40 sm:text-base"
                aria-label="Email address for newsletter"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubscribing}
              className={`${gradientButtonClass} w-full shrink-0 rounded-2xl px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-[0_20px_45px_rgba(56,189,248,0.45)] transition hover:shadow-[0_25px_55px_rgba(56,189,248,0.55)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:text-base`}
              aria-label="Subscribe to newsletter"
            >
              {isSubscribing ? t("subscribing") : t("getFreeResources")}
            </button>
          </form>

          <div className="flex flex-col items-center gap-3 text-center text-xs text-slate-300/90 sm:text-sm">
            <div className="flex flex-wrap items-center justify-center gap-2 font-medium text-slate-200">
              <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.25em] text-emerald-200">
                {t("noSpamGuarantee", "Zero spam")}
              </span>
              <span className="rounded-full border border-indigo-300/30 bg-indigo-400/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.25em] text-indigo-100">
                {t("unsubscribeAnytime", "Te dezabonezi oricând")}
              </span>
            </div>
            <p className="max-w-2xl text-slate-300/80">
              {t(
                "newsletterValueBullet",
                "Primești săptămânal experimente STEM, ghiduri pentru părinți și oferte dedicate membrilor comunității TechTots."
              )}
            </p>
          </div>

          {subscriptionStatus === "success" && (
            <p
              className="mx-auto w-full max-w-md rounded-2xl border border-emerald-300/40 bg-emerald-500/15 px-4 py-3 text-center text-sm font-medium text-emerald-50 shadow-[0_12px_35px_rgba(16,185,129,0.25)] sm:text-base"
              role="status"
              aria-live="polite"
            >
              {t("subscriptionSuccessMessage")}
            </p>
          )}
          {subscriptionStatus === "error" && (
            <p
              className="mx-auto w-full max-w-md rounded-2xl border border-rose-300/40 bg-rose-600/10 px-4 py-3 text-center text-sm font-medium text-rose-100 shadow-[0_12px_35px_rgba(244,63,94,0.25)] sm:text-base"
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
