"use client";

import React from "react";

interface ValuePropositionSectionProps {
  t: (key: string, defaultValue?: string) => string;
}

// [REFAC] ValuePropositionSection: Mobile-first, stacked, accessible, and visually stunning
// - 1-col grid on mobile, 2-col on small tablets, 3-col on desktop
// - Blocks stack vertically on mobile with adequate spacing (gap-y-6, py-6)
// - Icons and text scale responsively
// - Subtle hover/focus animations for engagement
// - All interactive elements have ARIA labels and visible focus states
// - All styling via Tailwind utilities (no custom CSS)
// - No horizontal scrolling at any breakpoint
// - Comments explain all major changes and rationale

function ValuePropositionSection({ t }: ValuePropositionSectionProps) {
  return (
    <section className="py-8 sm:py-10 md:py-16 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 md:mb-12 text-center">
          {t("whyChooseTechTots")}
        </h2>
        {/* Responsive grid: 1-col mobile, 2-col sm, 3-col md+ */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4 sm:gap-x-6 md:gap-x-8 lg:gap-x-12">
          {/* Cognitive Development */}
          <div
            className="text-center bg-primary-foreground/10 rounded-lg p-5 xs:p-6 md:p-8 transition-transform hover:scale-105 focus-within:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/70 focus-visible:ring-offset-2 group"
            tabIndex={0}
            aria-label={t("cognitiveDevelopment")}
          >
            <div className="flex justify-center mb-4 xs:mb-5 md:mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-10 h-10 xs:w-12 xs:h-12 md:w-14 md:h-14 text-primary"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"
                />
              </svg>
            </div>
            <h3 className="text-lg xs:text-xl md:text-2xl font-bold mb-1 xs:mb-2 md:mb-3">
              {t("cognitiveDevelopment")}
            </h3>
            <p className="text-primary-foreground/90 text-xs xs:text-sm md:text-base">
              {t("cognitiveDevelopmentDesc")}
            </p>
          </div>

          {/* Quality & Safety */}
          <div
            className="text-center bg-primary-foreground/10 rounded-lg p-5 xs:p-6 md:p-8 transition-transform hover:scale-105 focus-within:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/70 focus-visible:ring-offset-2 group"
            tabIndex={0}
            aria-label={t("qualitySafety", "Quality & Safety")}
          >
            <div className="flex justify-center mb-4 xs:mb-5 md:mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-10 h-10 xs:w-12 xs:h-12 md:w-14 md:h-14 text-primary"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
                />
              </svg>
            </div>
            <h3 className="text-lg xs:text-xl md:text-2xl font-bold mb-1 xs:mb-2 md:mb-3">
              {t("qualitySafety", "Quality & Safety")}
            </h3>
            <p className="text-primary-foreground/90 text-xs xs:text-sm md:text-base">
              {t(
                "qualitySafetyDesc",
                "All our products meet or exceed safety standards and are built to last."
              )}
            </p>
          </div>

          {/* Future Ready */}
          <div
            className="text-center bg-primary-foreground/10 rounded-lg p-5 xs:p-6 md:p-8 transition-transform hover:scale-105 focus-within:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/70 focus-visible:ring-offset-2 group"
            tabIndex={0}
            aria-label={t("futureReady")}
          >
            <div className="flex justify-center mb-4 xs:mb-5 md:mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-10 h-10 xs:w-12 xs:h-12 md:w-14 md:h-14 text-primary"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
                />
              </svg>
            </div>
            <h3 className="text-lg xs:text-xl md:text-2xl font-bold mb-1 xs:mb-2 md:mb-3">
              {t("futureReady")}
            </h3>
            <p className="text-primary-foreground/90 text-xs xs:text-sm md:text-base">
              {t("futureReadyDesc")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ValuePropositionSection;
