"use client";

import { Loader2, ArrowRight, ShoppingBag } from "lucide-react";
import React, { useEffect, useState } from "react";

import { useTranslation } from "@/lib/i18n";

interface CheckoutTransitionProps {
  destination: "checkout" | "login";
  onComplete: () => void;
}

export function CheckoutTransition({
  destination,
  onComplete,
}: CheckoutTransitionProps) {
  const [progress, setProgress] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    // Simulate progress to make animation smoother
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 2, 100));
    }, 50);

    // This will run our transition animation and then navigate
    // Use a longer timeout to ensure we don't see the login page flash
    const timer = setTimeout(() => {
      onComplete();
    }, 2500); // Animation time before completing transition

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center">
      <div className="flex flex-col items-center max-w-md px-6 text-center">
        {destination === "checkout" ? (
          <div className="h-20 w-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <ShoppingBag className="h-10 w-10 text-indigo-600" />
          </div>
        ) : (
          <div className="h-20 w-20 bg-purple-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <ArrowRight className="h-10 w-10 text-purple-600" />
          </div>
        )}

        <h2 className="text-2xl font-semibold text-indigo-900 mb-3">
          {destination === "checkout"
            ? t("preparingCheckout", "Preparing Your Checkout...")
            : t("takingToLogin", "Taking you to login...")}
        </h2>
        <p className="text-indigo-600 mb-6">
          {destination === "checkout"
            ? t(
                "gettingOrderReady",
                "Getting your order ready for checkout. Just a moment..."
              )
            : t(
                "pleaseLogIn",
                "Please log in to continue with checkout. Redirecting you now..."
              )}
        </p>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden">
          <div
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Spinner */}
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mt-2" />
      </div>
    </div>
  );
}
