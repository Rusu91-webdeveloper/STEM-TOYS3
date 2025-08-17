"use client";

import Image from "next/image";
import React from "react";

interface EducationalBooksSectionProps {
  t: (key: string, defaultValue?: string) => string;
}

const EducationalBooksSectionComponent = ({
  t,
}: EducationalBooksSectionProps) => (
  <section className="py-10 bg-muted">
    <div className="container mx-auto px-4 max-w-7xl">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-center">
        {t("educationalBooks", "Educational Books")}
      </h2>
      <p className="text-center text-muted-foreground mb-8 max-w-3xl mx-auto px-2">
        {t(
          "educationalBooksDesc",
          "Discover our collection of educational books designed to inspire young minds"
        )}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Book 1: STEM Play for Neurodiverse Minds */}
        <div className="bg-background rounded-xl overflow-hidden shadow-lg border border-gray-200 flex flex-col md:flex-row">
          <div className="md:w-2/5 relative p-4">
            <div className="aspect-[3/4] relative shadow-lg rounded-md overflow-hidden book-cover-effect max-w-[120px] sm:max-w-[150px] md:max-w-none mx-auto md:mx-0">
              <Image
                src="/STEM_play_for_neurodiverse_minds.jpg"
                alt={t("stemPlayBook", "STEM Play for Neurodiverse Minds")}
                fill
                sizes="(max-width: 768px) 100vw, 150px"
                className="object-cover w-full h-full transition-transform hover:scale-105 duration-300"
              />
              <div className="absolute inset-0 border-4 border-opacity-10 border-black rounded-md"></div>
            </div>
          </div>
          <div className="p-6 md:w-3/5 flex flex-col">
            <h3 className="text-xl sm:text-2xl font-bold mb-2">
              {t("stemPlayBook", "STEM Play for Neurodiverse Minds")}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t(
                "stemPlayBookDesc",
                "A comprehensive guide to engaging neurodiverse children with STEM activities that promote learning through play."
              )}
            </p>
            <div className="mt-auto space-y-4">
              <div className="flex items-center">
                <div className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 mr-2">
                  {t("availableInTwoLanguages", "Available in 2 languages")}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="/products/stem-play-for-neurodiverse-minds"
                  aria-label={`Buy ${t("stemPlayBook", "STEM Play for Neurodiverse Minds")} in English`}
                  className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-800 px-1 text-xs sm:text-sm md:text-base h-auto py-2 sm:py-2.5 text-white rounded"
                >
                  <span className="mr-2">🇬🇧</span> {t("buyInEnglish", "Buy")}
                </a>
                <a
                  href="/products/stem-play-for-neurodiverse-minds"
                  aria-label={`Buy ${t("stemPlayBook", "STEM Play for Neurodiverse Minds")} in Romanian`}
                  className="flex items-center justify-center bg-gradient-to-r from-yellow-600 to-red-600 px-1 text-xs sm:text-sm md:text-base h-auto py-2 sm:py-2.5 text-white rounded"
                >
                  <span className="mr-2">🇷🇴</span> {t("buyInRomanian", "Buy")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <a
          href="/products?category=educational-books"
          className="inline-block border border-gray-400 text-base px-6 py-5 sm:px-8 sm:py-6 rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-105"
        >
          {t("viewAllBooks", "View All Educational Books")}
        </a>
      </div>
    </div>
  </section>
);

const EducationalBooksSection = React.memo(EducationalBooksSectionComponent);

export default EducationalBooksSection;
