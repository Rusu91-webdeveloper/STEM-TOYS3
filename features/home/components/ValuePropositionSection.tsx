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
    <section className="py-3 sm:py-10 md:py-16 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 max-w-7xl">
        <h2 className="text-sm xs:text-lg sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-4 md:mb-6 text-center">
          {t("whyChooseTechTots")}
        </h2>
        {/* Responsive grid: 1-col mobile, 2-col sm, 3-col md+ */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-y-2 sm:gap-y-6 gap-x-4 sm:gap-x-6 md:gap-x-8 lg:gap-x-12 justify-items-center">
          {/* Cognitive Development */}
          <div
            className="bg-primary-foreground/10 rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 min-h-[24px] sm:min-h-[44px] flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/70 focus-visible:ring-offset-2 group"
            tabIndex={0}
            aria-label={t("cognitiveDevelopment")}
          >
            {/* Icon section - similar to image in categories */}
            <div className="relative h-12 xs:h-16 sm:h-40 md:h-48 w-full flex items-center justify-center bg-primary-foreground/5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 xs:w-8 xs:h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 text-primary"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"
                />
              </svg>
            </div>
            <div className="p-1.5 xs:p-2 sm:p-5 md:p-6 flex flex-col flex-grow">
              <h3 className="text-xs xs:text-xs sm:text-lg md:text-xl font-bold mb-0.5 xs:mb-2 truncate">
                {t("cognitiveDevelopment")}
              </h3>
              <p
                className="text-primary-foreground/90 text-xs xs:text-xs md:text-base mb-1.5 sm:mb-3 md:mb-4 overflow-hidden"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {t("cognitiveDevelopmentDesc")}
              </p>
            </div>
          </div>

          {/* Quality & Safety */}
          <div
            className="bg-primary-foreground/10 rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 min-h-[24px] sm:min-h-[44px] flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/70 focus-visible:ring-offset-2 group"
            tabIndex={0}
            aria-label={t("qualitySafety", "Quality & Safety")}
          >
            {/* Icon section - similar to image in categories */}
            <div className="relative h-12 xs:h-16 sm:h-40 md:h-48 w-full flex items-center justify-center bg-primary-foreground/5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 xs:w-8 xs:h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 text-primary"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
                />
              </svg>
            </div>
            <div className="p-1.5 xs:p-2 sm:p-5 md:p-6 flex flex-col flex-grow">
              <h3 className="text-xs xs:text-xs sm:text-lg md:text-xl font-bold mb-0.5 xs:mb-2 truncate">
                {t("qualitySafety", "Quality & Safety")}
              </h3>
              <p
                className="text-primary-foreground/90 text-xs xs:text-xs md:text-base mb-1.5 sm:mb-3 md:mb-4 overflow-hidden"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {t(
                  "qualitySafetyDesc",
                  "All our products meet or exceed safety standards and are built to last."
                )}
              </p>
            </div>
          </div>

          {/* Future Ready */}
          <div
            className="bg-primary-foreground/10 rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 min-h-[24px] sm:min-h-[44px] flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/70 focus-visible:ring-offset-2 group"
            tabIndex={0}
            aria-label={t("futureReady")}
          >
            {/* Icon section - similar to image in categories */}
            <div className="relative h-12 xs:h-16 sm:h-40 md:h-48 w-full flex items-center justify-center bg-primary-foreground/5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 xs:w-8 xs:h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 text-primary"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
                />
              </svg>
            </div>
            <div className="p-1.5 xs:p-2 sm:p-5 md:p-6 flex flex-col flex-grow">
              <h3 className="text-xs xs:text-xs sm:text-lg md:text-xl font-bold mb-0.5 xs:mb-2 truncate">
                {t("futureReady")}
              </h3>
              <p
                className="text-primary-foreground/90 text-xs xs:text-xs md:text-base mb-1.5 sm:mb-3 md:mb-4 overflow-hidden"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {t("futureReadyDesc")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ValuePropositionSection;
