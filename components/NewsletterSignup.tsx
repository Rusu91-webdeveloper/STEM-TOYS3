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
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-8 sm:py-12">
      <div className="container mx-auto px-3 sm:px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">
            {t("joinEducatorsParents")}
          </h3>
          <p className="text-sm sm:text-base text-blue-100 mb-4 sm:mb-6">
            {t("newsletterSubtitle")}
          </p>
          <form
            onSubmit={handleNewsletterSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto justify-center items-center"
            aria-label="Newsletter signup"
          >
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t("emailAddressPlaceholder")}
              className="flex-1 px-4 py-2 sm:py-3 rounded-lg text-gray-900 text-sm sm:text-base placeholder:text-gray-500 min-w-0 sm:min-w-[280px]"
              aria-label="Email address for newsletter"
              required
            />
            <button
              type="submit"
              disabled={isSubscribing}
              className="bg-white text-blue-600 font-semibold px-6 py-2 sm:py-3 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 text-sm sm:text-base whitespace-nowrap"
              aria-label="Subscribe to newsletter"
            >
              {isSubscribing ? t("subscribing") : t("getFreeResources")}
            </button>
          </form>
          {subscriptionStatus === "success" && (
            <p
              className="text-green-200 text-sm mt-2"
              role="status"
              aria-live="polite"
            >
              {t("subscriptionSuccessMessage")}
            </p>
          )}
          {subscriptionStatus === "error" && (
            <p
              className="text-red-200 text-sm mt-2"
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
