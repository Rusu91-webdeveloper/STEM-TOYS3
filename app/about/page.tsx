"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";

import { BookCarousel } from "@/components/ui/book-carousel";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

// Structured Data for About Page
const aboutStructuredData = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About TechTots România",
  description:
    "Descoperă povestea TechTots România - cum ajutăm familii să-și pregătească copiii pentru era AI transformând 'urăsc matematica' în 'când facem experimente?' cu jucăriile noastre STEM dovedite.",
  url: "https://www.techtots.ro/about",
  mainEntity: {
    "@type": "Organization",
    name: "TechTots România",
    url: "https://www.techtots.ro",
    logo: "https://www.techtots.ro/TechTots_LOGO.png",
    description: "Jucării STEM și resurse educaționale pentru copii români",
    foundingDate: "2025",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Strada Mehedinți 54-56",
      addressLocality: "Cluj-Napoca",
      addressRegion: "Cluj",
      postalCode: "400000",
      addressCountry: "RO",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+40-xxx-xxx-xxx",
      contactType: "customer service",
      availableLanguage: "Romanian",
    },
    sameAs: [
      "https://www.facebook.com/techtotsromania",
      "https://www.instagram.com/techtotsro",
      "https://www.linkedin.com/company/techtots-romania",
    ],
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Acasă",
        item: "https://www.techtots.ro",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Despre noi",
        item: "https://www.techtots.ro/about",
      },
    ],
  },
};

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

  // Collapsible state for Our Story section (mobile)
  const [storyExpanded, setStoryExpanded] = useState(false);

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
    setBookVersions(prev => ({
      ...prev,
      [bookKey]: prev[bookKey] === "english" ? "romanian" : "english",
    }));
  };

  // Handle image load error
  const _handleImageError = (book: string, language: string) => {
    setImageErrors(prev => ({
      ...prev,
      [`${book}_${language}`]: true,
    }));
    console.warn(`Failed to load image for ${book} in ${language}`);
  };

  // Get book image source based on selected language with fallback
  const _getBookImageSrc = (book: "book1" | "book2") => {
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
    }

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
  };

  // Get book title based on selected language
  const _getBookTitle = (book: "book1" | "book2") => {
    if (book === "book1") {
      return bookVersions.book1 === "english"
        ? t("book1TitleEn", "Born for the Future")
        : t("book1TitleRo", "Născut pentru viitor");
    }

    return bookVersions.book2 === "english"
      ? t("book2TitleEn", "STEM Play for Neurodiverse Minds")
      : t("book2TitleRo", "Jocuri STEM pentru minți neurodivergente");
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
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(aboutStructuredData),
        }}
      />
      <div className="flex flex-col">
        {/* Hormozi-Style Hero Section - Compact on Mobile */}
        <section className="relative bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>

          <div className="container relative z-10 px-3 sm:px-4 lg:px-8">
            <div className="max-w-5xl mx-auto text-center">
              {/* Social Proof Badge - Compact on Mobile */}
              <div className="mb-3 sm:mb-4 md:mb-6">
                <span className="inline-flex items-center px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 rounded-full bg-green-100 text-green-800 text-xs sm:text-sm font-medium">
                  <Image
                    src="/TechTots_LOGO.png"
                    alt="TechTots Logo"
                    width={20}
                    height={20}
                    className="mr-1.5 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"
                  />
                  {t("aboutHeroSocialProof")}
                </span>
              </div>

              {/* Hormozi-Style Headline - Compact on Mobile */}
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold mb-3 sm:mb-4 md:mb-6 text-gray-900 leading-tight">
                {t("aboutHeroHeadline")}{" "}
                <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  {t("aboutHeroHeadlineStruggling")}
                </span>{" "}
                {t("aboutHeroHeadlineInto")}{" "}
                <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  {t("aboutHeroHeadlineFuture")}
                </span>
              </h1>

              {/* Transformation-Focused Subheadline - Compact on Mobile */}
              <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl mb-4 sm:mb-6 md:mb-8 text-gray-700 max-w-4xl mx-auto leading-relaxed">
                {t("aboutHeroSubheadline")}
              </p>

              {/* Results Proof - Compact on Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-12">
                <div className="bg-white/80 backdrop-blur rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-lg">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600 mb-1 sm:mb-2">
                    87%
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    {t("aboutHeroMathImprovement")}
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-lg">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600 mb-1 sm:mb-2">
                    30
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    {t("aboutHeroTransformationDays")}
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-lg">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-600 mb-1 sm:mb-2">
                    99%
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    {t("aboutHeroSatisfiedParents")}
                  </div>
                </div>
              </div>

              {/* CTA Section - Compact on Mobile */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 text-sm sm:text-base md:text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <Link href="/contact">
                    {t("aboutHeroFreeConsultation")}
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 text-sm sm:text-base md:text-lg font-semibold"
                >
                  <Link href="/products">{t("aboutHeroSeeToys")}</Link>
                </Button>
              </div>

              {/* Guarantee - Compact on Mobile */}
              <div className="mt-4 sm:mt-6 md:mt-8 text-center">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
                  🛡️ Calitate Garantată și Suport Dedicat
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500">
                  Peste 10,000 de părinți au încredere în noi. Alătură-te și tu!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-6 sm:py-8 md:py-12 lg:py-16 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
          <div className="container px-3 sm:px-4 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-center">
              <div>
                <div className="flex items-center mb-3 sm:mb-4 md:mb-6">
                  <Image
                    src="/TechTots_LOGO.png"
                    alt="TechTots Logo"
                    width={60}
                    height={30}
                    className="mr-2 sm:mr-3 h-6 sm:h-8 md:h-10 w-auto"
                  />
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-indigo-900">
                    {t("whyChooseStemH2")}
                  </h2>
                </div>
                {/* Collapsible text for mobile */}
                <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm md:text-base lg:text-lg bg-white/80 rounded-lg shadow-md p-3 sm:p-4 md:p-6 border border-indigo-100 transition-all">
                  {/* Mobile: show only first paragraph unless expanded */}
                  <div className="block sm:hidden">
                    <p className="leading-relaxed text-gray-800 font-medium">
                      {t(
                        "ourStoryParagraph1",
                        'Established in 2025, TechTots was founded on a vision sparked by two pivotal books: "STEM Play for Neurodiverse Minds" by Casey Wrenly and "Born for the Future" by a dedicated educator and parent. These works highlighted the profound impact of STEM play on child development and the importance of future-ready skills, shaping our core mission.'
                      )}
                    </p>
                    {storyExpanded && (
                      <>
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
                      </>
                    )}
                    <div className="flex justify-center mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-indigo-400 text-indigo-700 hover:bg-indigo-50 px-4 py-1 text-xs font-semibold rounded-full shadow-sm"
                        onClick={() => setStoryExpanded(v => !v)}
                        aria-expanded={storyExpanded}
                      >
                        {storyExpanded
                          ? t("showLess", "Show less")
                          : t("readMore", "Read more")}
                      </Button>
                    </div>
                  </div>
                  {/* Desktop/tablet: always show all paragraphs */}
                  <div className="hidden sm:block">
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
        <section className="py-6 sm:py-8 md:py-12 lg:py-16 bg-white">
          <div className="container px-3 sm:px-4 lg:px-8">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 md:mb-8 text-center text-indigo-900">
              {t("ourStemCollectionH2")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-3 sm:p-4 md:p-6 rounded-lg shadow-sm hover:shadow-md transition-all border border-indigo-100 transform hover:-translate-y-1 duration-300">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-full flex items-center justify-center mb-3 sm:mb-4 mx-auto shadow-md">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white sm:w-5 sm:h-5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-bold mb-2 sm:mb-3 text-center text-indigo-900">
                  {t("qualitySafety")}
                </h3>
                <p className="text-center text-gray-700 leading-relaxed text-xs sm:text-sm">
                  {t("qualitySafetyDesc")}
                </p>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-3 sm:p-4 md:p-6 rounded-lg shadow-sm hover:shadow-md transition-all border border-indigo-100 transform hover:-translate-y-1 duration-300">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-full flex items-center justify-center mb-3 sm:mb-4 mx-auto shadow-md">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white sm:w-5 sm:h-5"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-bold mb-2 sm:mb-3 text-center text-indigo-900">
                  {t("educationalImpact")}
                </h3>
                <p className="text-center text-gray-700 leading-relaxed text-xs sm:text-sm">
                  {t("educationalImpactDesc")}
                </p>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-3 sm:p-4 md:p-6 rounded-lg shadow-sm hover:shadow-md transition-all border border-indigo-100 transform hover:-translate-y-1 duration-300 sm:col-span-2 lg:col-span-1 sm:max-w-md sm:mx-auto lg:max-w-none">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-full flex items-center justify-center mb-3 sm:mb-4 mx-auto shadow-md">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white sm:w-5 sm:h-5"
                  >
                    <path d="M7 3a4 4 0 0 1 8 0 5 5 0 0 1 4 5.5c0 3-2 4.5-4 5.5C13 16 12 18 12 20m-1-4v-2a4 4 0 0 0-4-4c-2 0-3 1-3 2a3 3 0 0 0 3 3c1 0 3 .5 3 2Z"></path>
                    <path d="M13 20a1 1 0 0 1-1-1v-1a1 1 0 1 1 2 0v1a1 1 0 0 1-1 1Z"></path>
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-bold mb-2 sm:mb-3 text-center text-indigo-900">
                  {t("sustainability")}
                </h3>
                <p className="text-center text-gray-700 leading-relaxed text-xs sm:text-sm">
                  {t("sustainabilityDesc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Team - Compact on Mobile */}
        <section className="py-4 sm:py-6 md:py-10 lg:py-12 xl:py-16 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
          <div className="container px-3 sm:px-4 lg:px-8">
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 lg:mb-8 text-center text-indigo-900">
              {t("ourTeam")}
            </h2>
            <div className="flex justify-center">
              {/* Rusu Emanuel Marius profile - Compact on Mobile */}
              <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all border border-indigo-200 transform hover:-translate-y-1 duration-300 max-w-sm sm:max-w-md md:max-w-lg w-full">
                <div className="relative h-32 sm:h-40 md:h-48 lg:h-56 xl:h-64 w-full group">
                  <Image
                    src="/images/category_banner_math_01.png"
                    alt="RUSU EMANUEL MARIUS"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 50vw"
                    style={{ objectFit: "cover" }}
                    className="transition-transform group-hover:scale-105 duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-2 sm:left-3 md:left-4 right-2 sm:right-3 md:right-4 text-white">
                    <p className="text-xs sm:text-sm md:text-base font-medium text-indigo-200 drop-shadow-md">
                      {"Fondator și Director Executiv"}
                    </p>
                  </div>
                </div>
                <div className="p-3 sm:p-4 md:p-6">
                  <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold mb-1.5 sm:mb-2 md:mb-3 text-indigo-900 border-b border-indigo-200 pb-1.5 sm:pb-2">
                    RUSU EMANUEL MARIUS
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-xs sm:text-sm md:text-base">
                    {t(
                      "founderDescription",
                      "Visionary entrepreneur with extensive expertise in development, design, and marketing. Passionate about creating educational technology that empowers children to explore, learn, and grow. Founded TechTots with the mission to revolutionize how children interact with STEM subjects through thoughtfully designed educational toys."
                    )}
                  </p>
                  <div className="mt-2 sm:mt-3 md:mt-4 flex gap-1.5 sm:gap-2 flex-wrap">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-xs h-7 sm:h-8 px-2 sm:px-3">
                      {t("contact", "Contact")}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 text-xs h-7 sm:h-8 px-2 sm:px-3"
                    >
                      {t("linkedin", "LinkedIn")}
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 text-xs h-7 sm:h-8 px-2 sm:px-3"
                    >
                      <Link href="/authors/techtots-editorial">
                        {t("viewProfile", "View author profile")}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA - Compact on Mobile */}
        <section className="py-6 sm:py-8 md:py-10 lg:py-12 xl:py-16 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white">
          <div className="container text-center px-3 sm:px-4 lg:px-8">
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold mb-2 sm:mb-3 md:mb-4 drop-shadow-md">
              {t("joinStemJourney")}
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg mb-3 sm:mb-4 md:mb-6 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
              {t("joinStemJourneyDesc") ||
                "Discover our carefully curated selection of educational toys and start inspiring curiosity today!"}
            </p>
            <Button
              asChild
              size="lg"
              className="bg-white hover:bg-white/90 text-indigo-700 border-none shadow-md transition-all hover:shadow-lg text-xs sm:text-sm md:text-base h-8 sm:h-9 md:h-10 px-4 sm:px-6"
            >
              <Link href="/products">{t("shopCollection")}</Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
