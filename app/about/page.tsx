"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { BookCarousel } from "@/components/ui/book-carousel";

type BookLanguage = "english" | "romanian";

export default function AboutPage() {
  const { t } = useTranslation();
  const [bookVersions, setBookVersions] = useState<{
    book1: BookLanguage;
    book2: BookLanguage;
  }>({
    book1: "romanian",
    book2: "romanian",
  });

  // Image error handling state
  const [imageErrors, setImageErrors] = useState({
    book1_ro: false,
    book2_ro: false,
    book1_en: false,
    book2_en: false,
  });

  // Preload images for smoother switching
  useEffect(() => {
    const preloadImage = (src: string) => {
      const img = new globalThis.Image();
      img.src = src;
    };

    // Preload all book images
    preloadImage("/born_for_the_future.png");
    preloadImage("/born_for_the_future_ro.png");
    preloadImage("/STEM_play_for_neurodiverse_minds.jpg");
    preloadImage("/STEM_play_for_neurodiverse_minds_ro.jpg");
  }, []);

  // Toggle language for specific book
  const toggleBookLanguage = (index: number) => {
    const bookKey = index === 0 ? "book1" : "book2";
    setBookVersions((prev) => ({
      ...prev,
      [bookKey]: prev[bookKey] === "english" ? "romanian" : "english",
    }));
  };

  // Handle image load error
  const handleImageError = (book: string, language: string) => {
    setImageErrors((prev) => ({
      ...prev,
      [`${book}_${language}`]: true,
    }));
    console.log(`Failed to load image for ${book} in ${language}`);
  };

  // Get book image source based on selected language with fallback
  const getBookImageSrc = (book: "book1" | "book2") => {
    if (book === "book1") {
      // Check if Romanian image failed and fallback to English if needed
      if (bookVersions.book1 === "romanian" && imageErrors.book1_ro) {
        return "/born_for_the_future.png";
      }
      // Check if English image failed and fallback to Romanian if needed
      if (bookVersions.book1 === "english" && imageErrors.book1_en) {
        return "/born_for_the_future_ro.png";
      }

      return bookVersions.book1 === "english"
        ? "/born_for_the_future.png"
        : "/born_for_the_future_ro.png";
    } else {
      // Check if Romanian image failed and fallback to English if needed
      if (bookVersions.book2 === "romanian" && imageErrors.book2_ro) {
        return "/STEM_play_for_neurodiverse_minds.jpg";
      }
      // Check if English image failed and fallback to Romanian if needed
      if (bookVersions.book2 === "english" && imageErrors.book2_en) {
        return "/STEM_play_for_neurodiverse_minds_ro.jpg";
      }

      return bookVersions.book2 === "english"
        ? "/STEM_play_for_neurodiverse_minds.jpg"
        : "/STEM_play_for_neurodiverse_minds_ro.jpg";
    }
  };

  // Get book title based on selected language
  const getBookTitle = (book: "book1" | "book2") => {
    if (book === "book1") {
      return bookVersions.book1 === "english"
        ? t("book1TitleEn", "Born for the Future")
        : t("book1TitleRo", "Născut pentru viitor");
    } else {
      return bookVersions.book2 === "english"
        ? t("book2TitleEn", "STEM Play for Neurodiverse Minds")
        : t("book2TitleRo", "Jocuri STEM pentru minți neurodivergente");
    }
  };

  // Book data for carousel
  const books = [
    {
      english: {
        src: "/born_for_the_future.png",
        alt: "Born for the Future",
        language: "english" as const,
      },
      romanian: {
        src: "/born_for_the_future_ro.png",
        alt: "Născut pentru viitor",
        language: "romanian" as const,
      },
    },
    {
      english: {
        src: "/STEM_play_for_neurodiverse_minds.jpg",
        alt: "STEM Play for Neurodiverse Minds",
        language: "english" as const,
      },
      romanian: {
        src: "/STEM_play_for_neurodiverse_minds_ro.jpg",
        alt: "Jocuri STEM pentru minți neurodivergente",
        language: "romanian" as const,
      },
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[250px] sm:h-[300px] md:h-[400px] flex items-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/category_banner_science_01.png"
            alt="About us banner showing children engaging with STEM toys"
            fill
            sizes="100vw"
            style={{ objectFit: "cover" }}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/70 via-purple-900/60 to-pink-900/70" />
        </div>
        <div className="container relative z-10 text-white px-3 sm:px-4 lg:px-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 drop-shadow-md">
            {t("aboutTitle")}
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-4 sm:mb-6 max-w-2xl leading-relaxed drop-shadow-sm">
            {t("aboutDescription")}
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-8 sm:py-10 md:py-16 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
        <div className="container px-3 sm:px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            <div>
              <div className="flex items-center mb-4 sm:mb-6">
                <Image
                  src="/TechTots_LOGO.png"
                  alt="TechTots Logo"
                  width={80}
                  height={40}
                  className="mr-3 sm:mr-4 h-8 sm:h-10 w-auto"
                />
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-indigo-900">
                  {t("ourStory")}
                </h2>
              </div>
              <div className="space-y-4 sm:space-y-5 text-sm sm:text-base md:text-lg">
                <p className="leading-relaxed text-gray-800 font-medium">
                  {t(
                    "ourStoryParagraph1",
                    'Established in 2025, TechTots was founded on a vision sparked by two pivotal books: "STEM Play for Neurodiverse Minds" by Casey Wrenly and "Born for the Future" by a dedicated educator and parent. These works highlighted the profound impact of STEM play on child development and the importance of future-ready skills, shaping our core mission.'
                  )}
                </p>
                <p className="leading-relaxed text-gray-700">
                  {t(
                    "ourStoryParagraph2",
                    'At TechTots, we believe STEM toys are essential catalysts for cognitive growth in all children, igniting natural curiosity and building foundations in computational thinking and scientific reasoning. We champion an approach where learning aligns with a child\'s natural interests and neurology. We are especially committed to neurodiverse children, including those with ADHD and autism. Drawing inspiration from "STEM Play for Neurodiverse Minds," we offer tools designed for sensory-rich experiences that enhance focus and cognitive skills, transforming their unique strengths into pathways for learning and confidence.'
                  )}
                </p>
                <p className="leading-relaxed text-gray-700 italic border-l-4 border-indigo-300 pl-4">
                  {t(
                    "ourStoryParagraph3",
                    'Further shaped by "Born for the Future," which emphasizes preparing children with critical human skills for an AI-driven world, we understand that STEM integration builds crucial technical and creative problem-solving abilities. Our mission at TechTots is to be your trusted partner, providing enriching educational toys and parental guidance. We aim to show how these carefully selected tools foster development, nurture curiosity, and equip all children with essential skills for tomorrow—all through the power of joyful play.'
                  )}
                </p>
              </div>
            </div>
            <div className="mt-6 lg:mt-0">
              <BookCarousel
                books={books}
                onLanguageToggle={toggleBookLanguage}
                currentLanguages={[bookVersions.book1, bookVersions.book2]}
                showLanguageToggle={false}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-8 sm:py-10 md:py-16 bg-white">
        <div className="container px-3 sm:px-4 lg:px-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 md:mb-12 text-center text-indigo-900">
            {t("ourValues")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 sm:p-6 md:p-8 rounded-lg shadow-md hover:shadow-lg transition-all border border-indigo-100 transform hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-full flex items-center justify-center mb-4 sm:mb-6 mx-auto shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white sm:w-6 sm:h-6">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                  />
                  <line
                    x1="12"
                    y1="8"
                    x2="12"
                    y2="12"
                  />
                  <line
                    x1="12"
                    y1="16"
                    x2="12.01"
                    y2="16"
                  />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3 md:mb-4 text-center text-indigo-900">
                {t("qualitySafety")}
              </h3>
              <p className="text-center text-gray-700 leading-relaxed text-xs sm:text-sm md:text-base">
                {t("qualitySafetyDesc")}
              </p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 sm:p-6 md:p-8 rounded-lg shadow-md hover:shadow-lg transition-all border border-indigo-100 transform hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-full flex items-center justify-center mb-4 sm:mb-6 mx-auto shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white sm:w-6 sm:h-6">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3 md:mb-4 text-center text-indigo-900">
                {t("educationalImpact")}
              </h3>
              <p className="text-center text-gray-700 leading-relaxed text-xs sm:text-sm md:text-base">
                {t("educationalImpactDesc")}
              </p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 sm:p-6 md:p-8 rounded-lg shadow-md hover:shadow-lg transition-all border border-indigo-100 transform hover:-translate-y-1 duration-300 sm:col-span-2 md:col-span-1 sm:max-w-md sm:mx-auto md:max-w-none">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-full flex items-center justify-center mb-4 sm:mb-6 mx-auto shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white sm:w-6 sm:h-6">
                  <path d="M7 3a4 4 0 0 1 8 0 5 5 0 0 1 4 5.5c0 3-2 4.5-4 5.5C13 16 12 18 12 20m-1-4v-2a4 4 0 0 0-4-4c-2 0-3 1-3 2a3 3 0 0 0 3 3c1 0 3 .5 3 2Z"></path>
                  <path d="M13 20a1 1 0 0 1-1-1v-1a1 1 0 1 1 2 0v1a1 1 0 0 1-1 1Z"></path>
                </svg>
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3 md:mb-4 text-center text-indigo-900">
                {t("sustainability")}
              </h3>
              <p className="text-center text-gray-700 leading-relaxed text-xs sm:text-sm md:text-base">
                {t("sustainabilityDesc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="py-8 sm:py-10 md:py-16 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
        <div className="container px-3 sm:px-4 lg:px-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 md:mb-12 text-center text-indigo-900">
            {t("ourTeam")}
          </h2>
          <div className="flex justify-center">
            {/* Rusu Emanuel Marius profile */}
            <div className="bg-white rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all border-2 border-indigo-200 transform hover:-translate-y-2 duration-300 max-w-md sm:max-w-lg md:max-w-2xl w-full">
              <div className="relative h-60 sm:h-70 md:h-80 w-full group">
                <Image
                  src="/images/category_banner_math_01.png"
                  alt="RUSU EMANUEL MARIUS"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 50vw"
                  style={{ objectFit: "cover" }}
                  className="transition-transform group-hover:scale-105 duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 text-white">
                  <p className="text-base sm:text-lg font-medium text-indigo-200 drop-shadow-md">
                    {"Fondator și Director Executiv"}
                  </p>
                </div>
              </div>
              <div className="p-4 sm:p-6 md:p-8">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-indigo-900 border-b-2 border-indigo-200 pb-2">
                  RUSU EMANUEL MARIUS
                </h3>
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg">
                  {t(
                    "founderDescription",
                    "Visionary entrepreneur with extensive expertise in development, design, and marketing. Passionate about creating educational technology that empowers children to explore, learn, and grow. Founded TechTots with the mission to revolutionize how children interact with STEM subjects through thoughtfully designed educational toys."
                  )}
                </p>
                <div className="mt-4 sm:mt-6 flex gap-2 sm:gap-4 flex-wrap">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-xs sm:text-sm h-8 sm:h-9">
                    {t("contact", "Contact")}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 text-xs sm:text-sm h-8 sm:h-9">
                    {t("linkedin", "LinkedIn")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-8 sm:py-10 md:py-16 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white">
        <div className="container text-center px-3 sm:px-4 lg:px-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 drop-shadow-md">
            {t("joinStemJourney")}
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
            {t("joinStemJourneyDesc") ||
              "Discover our carefully curated selection of educational toys and start inspiring curiosity today!"}
          </p>
          <Button
            asChild
            size="lg"
            className="bg-white hover:bg-white/90 text-indigo-700 border-none shadow-md transition-all hover:shadow-lg text-xs sm:text-sm md:text-base h-9 sm:h-10 md:h-12">
            <Link href="/products">{t("shopCollection")}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
