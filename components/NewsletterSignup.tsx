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
    <section className="bg-[#f5f7fb] px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto grid max-w-6xl overflow-hidden rounded-[1.75rem] bg-[#0b1220] px-6 py-8 text-left shadow-[0_30px_80px_-42px_rgba(15,23,42,0.9)] sm:px-10 sm:py-10 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-16 lg:px-14 lg:py-12">
          <div
            className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-36 left-1/3 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl"
            aria-hidden
          />

          <div className="relative">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.24em] text-sky-300">
              Comunitatea TechTots
            </p>
            <h2 className="text-2xl font-bold tracking-[-0.035em] text-white sm:text-3xl lg:text-4xl">
              {t("joinEducatorsParents")}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
              {t("newsletterSubtitle")}
            </p>
          </div>

          <div className="relative mt-7 lg:mt-0">
            <form
              onSubmit={handleNewsletterSubmit}
              className="flex flex-col gap-3 sm:flex-row"
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
                className="min-h-12 flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-sky-400/70 focus:bg-white/15 focus:ring-4 focus:ring-sky-400/10"
                required
              />
              <button
                type="submit"
                disabled={isSubscribing}
                className="min-h-12 shrink-0 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-[0_14px_28px_-14px_rgba(37,99,235,0.9)] transition-all hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubscribing ? t("subscribing") : t("getFreeResources")}
              </button>
            </form>

            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {t("noSpamGuarantee", "Promitem să nu trimitem spam.")}{" "}
              {t("unsubscribeAnytime", "Te poți dezabona oricând.")}
            </p>

            {/* Status messages */}
            {subscriptionStatus === "success" && (
              <p
                className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-200"
                role="status"
                aria-live="polite"
              >
                {t("subscriptionSuccessMessage")}
              </p>
            )}
            {subscriptionStatus === "error" && (
              <p
                className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-medium text-rose-200"
                role="alert"
                aria-live="polite"
              >
                {t("subscriptionErrorMessage")}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
