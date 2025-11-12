"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  // glassCardClass,
  gradientButtonClass,
} from "@/features/home/components/homeTheme";

interface MobileConversionOptimizerProps {
  t: (key: string, defaultValue?: string) => string;
}

// Hormozi Style Mobile Conversion Optimizer
// Adds sticky CTAs, mobile-specific optimizations, and conversion tracking
function MobileConversionOptimizer({ t }: MobileConversionOptimizerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Restore dismissed state
    const dismissed = localStorage.getItem("home-sticky-cta-dismissed");
    if (dismissed === "true") {
      setIsVisible(false);
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);

      // Show sticky CTA after user scrolls past hero section (400px)
      if (localStorage.getItem("home-sticky-cta-dismissed") === "true") {
        setIsVisible(false);
      } else {
        setIsVisible(currentScrollY > 400);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const trackConversion = (action: string, element: string) => {
    // Track conversion events for mobile optimization
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "conversion", {
        event_category: "mobile_cta",
        event_label: `${action}_${element}`,
        value: 1,
      });
    }
  };

  return (
    <>
      {/* Mobile Sticky CTA Bar - Only visible on mobile after scroll */}
      {isVisible && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
          <div className="border-t border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur">
            <div className="mx-auto flex max-w-sm items-center justify-between gap-3">
              <Link
                href="/products"
                onClick={() => trackConversion("sticky_primary", "mobile_bar")}
                className={`${gradientButtonClass} flex-1 px-4 py-3 text-sm font-semibold`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>🚀</span>
                  <span>Începe Acum</span>
                </div>
              </Link>

              <Link
                href="/contact"
                onClick={() =>
                  trackConversion("sticky_secondary", "mobile_bar")
                }
                className="flex-1 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-center text-sm font-semibold text-white/90 transition hover:border-white/30 hover:bg-white/15"
              >
                <div className="flex items-center justify-center gap-2">
                  <span>📞</span>
                  <span>Consultare</span>
                </div>
              </Link>

              <button
                onClick={() => {
                  setIsVisible(false);
                  try {
                    localStorage.setItem("home-sticky-cta-dismissed", "true");
                  } catch {}
                }}
                className="rounded-full p-2 text-white/60 transition hover:text-white"
                aria-label="Închide"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mt-2 text-center text-xs text-slate-200/80">
              <span className="inline-flex items-center gap-1">
                <svg
                  className="h-3 w-3 text-emerald-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Calitate garantată
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-First Trust Indicators */}
      <div className="block md:hidden">
        <div className="border-t border-white/10 bg-slate-950/70 py-4 backdrop-blur">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-6 text-center text-white/85">
              <div className="flex flex-col items-center">
                <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/40 via-sky-400/40 to-indigo-400/40 text-white">
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-xs font-medium">Garanție</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-400/40 via-indigo-400/40 to-fuchsia-400/40 text-white">
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-medium">Calitate</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400/40 via-fuchsia-400/40 to-purple-400/40 text-white">
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-xs font-medium">Suport</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/40 via-orange-400/40 to-rose-400/40 text-white">
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-xs font-medium">Rapid</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Scroll Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 z-40 md:hidden">
        <div
          className="h-1 bg-gradient-to-r from-green-600 to-emerald-600 transition-all duration-300 ease-out"
          style={{
            width:
              typeof window !== "undefined" &&
              document?.documentElement?.scrollHeight
                ? `${Math.min((scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100, 100)}%`
                : "0%",
          }}
        />
      </div>

      {/* Mobile-Only Urgency Banner */}
      <div className="block md:hidden bg-gradient-to-r from-rose-500/80 via-orange-500/80 to-amber-500/80 py-2 text-white shadow-lg shadow-rose-500/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <span className="animate-pulse">🔥</span>
            <span>Locuri limitate pentru consultarea gratuită luna aceasta!</span>
            <span className="animate-pulse">🔥</span>
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Button for Emergency Contact */}
      <div className="fixed bottom-20 right-4 z-40 md:hidden">
        <Link
          href="/contact"
          onClick={() => trackConversion("floating_contact", "mobile_fab")}
          className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 animate-pulse"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </Link>
      </div>
    </>
  );
}

export default React.memo(MobileConversionOptimizer);
