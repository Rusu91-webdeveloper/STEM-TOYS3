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
      setTimeout(() => setSubscriptionStatus("idle"), 3000);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-700 via-fuchsia-600 to-purple-500 py-4 sm:py-6 md:py-8 lg:py-10">
      <div className="container mx-auto px-4 sm:px-4 md:px-6">
        <div className="text-center max-w-xl mx-auto">
          <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white mb-1 sm:mb-2 leading-tight">
            {t("joinEducatorsParents")}
          </h3>
          <p className="text-xs sm:text-sm md:text-base text-purple-100 mb-3 sm:mb-4 md:mb-6 leading-relaxed">
            {t("newsletterSubtitle")}
          </p>
          <form
            onSubmit={handleNewsletterSubmit}
            className="flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-md sm:max-w-lg mx-auto justify-center items-center"
            aria-label="Newsletter signup"
          >
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t("emailAddressPlaceholder")}
              className="flex-1 px-3 py-2 sm:py-3 rounded-lg text-gray-900 text-sm sm:text-base placeholder:text-gray-500 min-w-0 sm:min-w-[240px] md:min-w-[280px] w-full"
              aria-label="Email address for newsletter"
              required
            />
            <button
              type="submit"
              disabled={isSubscribing}
              className="bg-white text-purple-700 font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 text-xs sm:text-sm md:text-base whitespace-nowrap w-full sm:w-auto"
              aria-label="Subscribe to newsletter"
            >
              {isSubscribing ? t("subscribing") : t("getFreeResources")}
            </button>
          </form>
          {subscriptionStatus === "success" && (
            <p
              className="text-green-200 text-xs sm:text-sm mt-2"
              role="status"
              aria-live="polite"
            >
              {t("subscriptionSuccessMessage")}
            </p>
          )}
          {subscriptionStatus === "error" && (
            <p
              className="text-red-200 text-xs sm:text-sm mt-2"
              role="alert"
              aria-live="polite"
            >
              {t("subscriptionErrorMessage")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
