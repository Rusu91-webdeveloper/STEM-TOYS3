"use client";

import { useState } from "react";
import { Mail, Sparkles } from "lucide-react";
import Image from "next/image";

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
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#f6fbff_0%,#eef7ff_48%,#f6f9ff_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.10),_transparent_55%)] opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(129,140,248,0.12),_transparent_60%)] opacity-80" />
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,_#0f172a_1px,_transparent_1px)] bg-[length:16px_16px]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          className={`${glassPanelClass} mx-auto relative flex max-w-4xl flex-col gap-6 overflow-hidden rounded-3xl border-slate-200/80 bg-white/95 px-6 py-10 shadow-[0_28px_70px_-40px_rgba(15,23,42,0.2)] backdrop-blur-xl sm:px-10 sm:py-12`}
        >
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute -right-8 -top-6 h-36 w-36 rounded-full bg-cyan-200/35 blur-3xl" />
            <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-emerald-200/30 blur-3xl" />
            <div className="absolute right-0 top-0 hidden h-full w-[38%] lg:block">
              <Image
                src="/Science.png"
                alt=""
                fill
                sizes="30vw"
                className="object-cover object-center opacity-10 blur-[2px]"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-white/90 via-white/80 to-transparent" />
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-sky-700 sm:text-xs">
              <Sparkles className="h-4 w-4 text-sky-600" aria-hidden="true" />
              {t("exclusiveInsights", "Inspirație STEM exclusivă")}
            </span>
            <h3 className="relative z-10 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
              {t("joinEducatorsParents")}
            </h3>
            <p className="relative z-10 mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              {t("newsletterSubtitle")}
            </p>
          </div>

          <form
            onSubmit={handleNewsletterSubmit}
            className="relative z-10 mx-auto flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_35px_-28px_rgba(15,23,42,0.18)] sm:flex-row sm:items-center sm:gap-4 sm:p-5"
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
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-400/25 sm:text-base"
                aria-label="Email address for newsletter"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubscribing}
              className={`${gradientButtonClass} relative w-full shrink-0 rounded-2xl px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-white shadow-[0_18px_36px_-18px_rgba(56,189,248,0.55)] ring-1 ring-white/20 transition hover:-translate-y-0.5 hover:shadow-[0_24px_45px_-18px_rgba(56,189,248,0.65)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[260px] sm:text-base`}
              aria-label="Subscribe to newsletter"
            >
              {isSubscribing ? t("subscribing") : t("getFreeResources")}
            </button>
          </form>

          <div className="relative z-10 flex flex-col items-center gap-3 text-center text-xs text-slate-600 sm:text-sm">
            <div className="flex flex-wrap items-center justify-center gap-2 font-medium text-slate-700">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.65rem] uppercase tracking-[0.25em] text-emerald-700">
                {t("noSpamGuarantee", "Zero spam")}
              </span>
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[0.65rem] uppercase tracking-[0.25em] text-indigo-700">
                {t("unsubscribeAnytime", "Te dezabonezi oricând")}
              </span>
            </div>
            <p className="max-w-2xl text-slate-600">
              {t(
                "newsletterValueBullet",
                "Primești săptămânal experimente STEM, ghiduri pentru părinți și oferte dedicate membrilor comunității TechTots."
              )}
            </p>
          </div>

          {subscriptionStatus === "success" && (
            <p
              className="mx-auto w-full max-w-md rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700 shadow-[0_12px_35px_-24px_rgba(16,185,129,0.2)] sm:text-base"
              role="status"
              aria-live="polite"
            >
              {t("subscriptionSuccessMessage")}
            </p>
          )}
          {subscriptionStatus === "error" && (
            <p
              className="mx-auto w-full max-w-md rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm font-medium text-rose-700 shadow-[0_12px_35px_-24px_rgba(244,63,94,0.2)] sm:text-base"
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
