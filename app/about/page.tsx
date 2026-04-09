"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

import { BookCarousel } from "@/components/ui/book-carousel";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

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

  const heroStats = [
    {
      value: "RO",
      label: "Magazin online pentru familii din Romania",
      accentClass: "text-emerald-300",
    },
    {
      value: "3-12+",
      label: "Selectie pentru varste si etape diferite",
      accentClass: "text-sky-300",
    },
    {
      value: "STEM",
      label: "Categorie, ghiduri si suport pentru alegere",
      accentClass: "text-indigo-300",
    },
  ];

  return (
    <>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/70 text-slate-900">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(99,102,241,0.08),_transparent_60%)]" />
        <div className="relative z-10">
          <section className="container mx-auto px-3 py-8 sm:px-6 sm:py-10 lg:py-16">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-indigo-900/80 to-slate-950/95 p-6 shadow-xl shadow-black/40 sm:p-10">
              <div className="absolute inset-y-[25%] right-0 hidden w-1/3 rounded-full bg-emerald-400/10 blur-3xl lg:block" />
              <div className="relative mx-auto max-w-4xl space-y-6 text-center">
                <div className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200">
                  <Image
                    src="/TechTots_LOGO.png"
                    alt="TechTots Logo"
                    width={28}
                    height={28}
                    className="h-7 w-auto"
                  />
                  <span className="text-white/80">Despre brand</span>
                </div>
                <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
                  Cine este TechTots si cum construim un magazin online pentru
                  jucarii{" "}
                  <span className="bg-gradient-to-r from-emerald-300 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                    STEM si educative
                  </span>
                </h1>
                <p className="mx-auto max-w-3xl text-sm text-slate-200 sm:text-base md:text-lg">
                  Pagina aceasta explica misiunea brandului, modul in care
                  gandim selectia de produse si unde poti merge mai departe daca
                  vrei sa alegi dupa varsta, categorie sau interes.
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  {heroStats.map(stat => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-inner shadow-black/20 backdrop-blur"
                    >
                      <div
                        className={`text-2xl font-bold sm:text-3xl ${stat.accentClass}`}
                      >
                        {stat.value}
                      </div>
                      <p className="mt-2 text-xs text-slate-200 sm:text-sm">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:via-sky-400 hover:to-indigo-400 sm:w-auto sm:text-base"
                  >
                    <Link href="/contact">
                      Contact si suport
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-full rounded-2xl border border-sky-400/60 bg-white/5 px-6 py-3 text-sm font-semibold text-sky-100 transition hover:border-sky-300 hover:bg-sky-500/20 hover:text-white sm:w-auto sm:text-base"
                  >
                    <Link href="/products">Vezi produsele</Link>
                  </Button>
                </div>
                <div className="mx-auto mt-4 inline-flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200 shadow-inner shadow-black/30 sm:flex-row sm:text-sm">
                  <span>
                    Informatii despre brand, suport si selectia produselor
                  </span>
                  <span className="hidden h-1 w-1 rounded-full bg-white/30 sm:inline-block" />
                  <span>
                    Fara promisiuni artificiale, cu pagini comerciale si ghiduri
                    clare
                  </span>
                </div>
              </div>
            </div>
          </section>

          <div className="container mx-auto px-3 pb-12 sm:px-6 lg:pb-20">
            <div className="mx-auto max-w-5xl space-y-8 sm:space-y-10 lg:space-y-12">
              <section className="rounded-3xl border border-slate-200/70 bg-white/85 p-5 shadow-lg shadow-slate-900/10 backdrop-blur sm:p-7 md:p-9">
                <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <Image
                        src="/TechTots_LOGO.png"
                        alt="TechTots Logo"
                        width={60}
                        height={30}
                        className="h-8 w-auto"
                      />
                      <h2 className="text-lg font-bold text-slate-900 sm:text-xl md:text-2xl">
                        {t("whyChooseStemH2")}
                      </h2>
                    </div>
                    <div className="mt-4 space-y-4 text-xs text-slate-700 sm:text-sm md:text-base">
                      <div className="block sm:hidden">
                        <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-inner shadow-slate-900/5">
                          <p className="leading-relaxed text-slate-800">
                            {t(
                              "ourStoryParagraph1",
                              'Established in 2025, TechTots was founded on a vision sparked by two pivotal books: "STEM Play for Neurodiverse Minds" by Casey Wrenly and "Born for the Future" by a dedicated educator and parent. These works highlighted the profound impact of STEM play on child development and the importance of future-ready skills, shaping our core mission.'
                            )}
                          </p>
                          {storyExpanded && (
                            <>
                              <p className="mt-3 leading-relaxed text-slate-700">
                                {t(
                                  "ourStoryParagraph2",
                                  'At TechTots, we believe STEM toys are essential catalysts for cognitive growth in all children, igniting natural curiosity and building foundations in computational thinking and scientific reasoning. We champion an approach where learning aligns with a child\'s natural interests and neurology. We are especially committed to neurodiverse children, including those with ADHD and autism. Drawing inspiration from "STEM Play for Neurodiverse Minds," we offer tools designed for sensory-rich experiences that enhance focus and cognitive skills, transforming their unique strengths into pathways for learning and confidence.'
                                )}
                              </p>
                              <p className="mt-3 border-l-4 border-sky-300/60 pl-4 text-sm italic text-slate-700">
                                {t(
                                  "ourStoryParagraph3",
                                  'Further shaped by "Born for the Future," which emphasizes preparing children with critical human skills for an AI-driven world, we understand that STEM integration builds crucial technical and creative problem-solving abilities. Our mission at TechTots is to be your trusted partner, providing enriching educational toys and parental guidance. We aim to show how these carefully selected tools foster development, nurture curiosity, and equip all children with essential skills for tomorrow—all through the power of joyful play.'
                                )}
                              </p>
                            </>
                          )}
                        </div>
                        <div className="mt-3 flex justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full border border-sky-300/70 bg-white px-4 py-1 text-xs font-semibold text-sky-700 transition hover:border-sky-400 hover:bg-sky-50 hover:text-sky-800"
                            onClick={() => setStoryExpanded(v => !v)}
                            aria-expanded={storyExpanded}
                          >
                            {storyExpanded
                              ? t("showLess", "Show less")
                              : t("readMore", "Read more")}
                          </Button>
                        </div>
                      </div>
                      <div className="hidden space-y-4 rounded-2xl border border-slate-200/70 bg-white/95 p-5 shadow-inner shadow-slate-900/5 sm:block">
                        <p className="text-sm font-medium text-slate-800 sm:text-base">
                          {t(
                            "ourStoryParagraph1",
                            'Established in 2025, TechTots was founded on a vision sparked by two pivotal books: "STEM Play for Neurodiverse Minds" by Casey Wrenly and "Born for the Future" by a dedicated educator and parent. These works highlighted the profound impact of STEM play on child development and the importance of future-ready skills, shaping our core mission.'
                          )}
                        </p>
                        <p className="text-sm leading-relaxed text-slate-700 sm:text-base">
                          {t(
                            "ourStoryParagraph2",
                            'At TechTots, we believe STEM toys are essential catalysts for cognitive growth in all children, igniting natural curiosity and building foundations in computational thinking and scientific reasoning. We champion an approach where learning aligns with a child\'s natural interests and neurology. We are especially committed to neurodiverse children, including those with ADHD and autism. Drawing inspiration from "STEM Play for Neurodiverse Minds," we offer tools designed for sensory-rich experiences that enhance focus and cognitive skills, transforming their unique strengths into pathways for learning and confidence.'
                          )}
                        </p>
                        <p className="border-l-4 border-sky-300/60 pl-4 text-sm italic text-slate-700 sm:text-base">
                          {t(
                            "ourStoryParagraph3",
                            'Further shaped by "Born for the Future," which emphasizes preparing children with critical human skills for an AI-driven world, we understand that STEM integration builds crucial technical and creative problem-solving abilities. Our mission at TechTots is to be your trusted partner, providing enriching educational toys and parental guidance. We aim to show how these carefully selected tools foster development, nurture curiosity, and equip all children with essential skills for tomorrow—all through the power of joyful play.'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-3 shadow-inner shadow-slate-900/5 sm:p-5">
                    <BookCarousel
                      books={books}
                      onLanguageToggle={toggleBookLanguage}
                      currentLanguages={[
                        bookVersions.book1,
                        bookVersions.book2,
                      ]}
                      showLanguageToggle={false}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200/70 bg-white/85 p-5 shadow-lg shadow-slate-900/10 backdrop-blur sm:p-7 md:p-9">
                <h2 className="text-center text-base font-semibold text-slate-900 sm:text-lg md:text-xl">
                  {t("ourStemCollectionH2")}
                </h2>
                <p className="mx-auto mt-3 max-w-3xl text-center text-xs text-slate-600 sm:text-sm">
                  {t(
                    "ourStemCollectionDescription",
                    "Selecția noastră de jucării STEM este curatoriată pentru a construi curiozitate, încredere și competențe pregătitoare pentru viitor."
                  )}
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 shadow-inner shadow-slate-900/5 transition hover:border-emerald-300/70 hover:shadow-emerald-500/10">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 via-sky-400 to-indigo-400 text-white shadow-lg">
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
                        className="h-5 w-5"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                    <h3 className="text-center text-sm font-semibold text-slate-900 sm:text-base">
                      {t("qualitySafety")}
                    </h3>
                    <p className="mt-2 text-center text-xs text-slate-600 sm:text-sm">
                      {t("qualitySafetyDesc")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 shadow-inner shadow-slate-900/5 transition hover:border-emerald-300/70 hover:shadow-emerald-500/10">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 via-sky-400 to-indigo-400 text-white shadow-lg">
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
                        className="h-5 w-5"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                    </div>
                    <h3 className="text-center text-sm font-semibold text-slate-900 sm:text-base">
                      {t("educationalImpact")}
                    </h3>
                    <p className="mt-2 text-center text-xs text-slate-600 sm:text-sm">
                      {t("educationalImpactDesc")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 shadow-inner shadow-slate-900/5 transition hover:border-emerald-300/70 hover:shadow-emerald-500/10">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 via-sky-400 to-indigo-400 text-white shadow-lg">
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
                        className="h-5 w-5"
                      >
                        <path d="M7 3a4 4 0 0 1 8 0 5 5 0 0 1 4 5.5c0 3-2 4.5-4 5.5C13 16 12 18 12 20m-1-4v-2a4 4 0 0 0-4-4c-2 0-3 1-3 2a3 3 0 0 0 3 3c1 0 3 .5 3 2Z"></path>
                        <path d="M13 20a1 1 0 0 1-1-1v-1a1 1 0 1 1 2 0v1a1 1 0 0 1-1 1Z"></path>
                      </svg>
                    </div>
                    <h3 className="text-center text-sm font-semibold text-slate-900 sm:text-base">
                      {t("sustainability")}
                    </h3>
                    <p className="mt-2 text-center text-xs text-slate-600 sm:text-sm">
                      {t("sustainabilityDesc")}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200/70 bg-white/85 p-5 shadow-lg shadow-slate-900/10 backdrop-blur sm:p-7 md:p-9">
                <h2 className="text-center text-base font-semibold text-slate-900 sm:text-lg md:text-xl">
                  {t("ourTeam")}
                </h2>
                <div className="mt-6 flex justify-center">
                  <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200/70 bg-white/95 shadow-xl shadow-slate-900/10 transition hover:border-emerald-300/70 hover:shadow-emerald-500/10">
                    <div className="relative h-40 w-full sm:h-48 md:h-56">
                      <Image
                        src="/images/category_banner_math_01.png"
                        alt={t(
                          "founderCardImageAlt",
                          "TechTots leadership and STEM learning banner"
                        )}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 50vw"
                        style={{ objectFit: "cover" }}
                        className="transition-transform duration-500 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 text-left text-slate-100">
                        <p className="text-xs font-medium uppercase tracking-[0.3em] text-emerald-200">
                          {t("founderRole", "Fondator & Director Executiv")}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4 px-5 py-6">
                      <h3 className="border-b border-slate-200/80 pb-3 text-lg font-semibold text-slate-900">
                        {t("founderCardHeading", "Leadership & vision")}
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-700">
                        {t(
                          "founderDescription",
                          "Visionary entrepreneur with extensive expertise in development, design, and marketing. Passionate about creating educational technology that empowers children to explore, learn, and grow. Founded TechTots with the mission to revolutionize how children interact with STEM subjects through thoughtfully designed educational toys."
                        )}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button className="h-9 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 px-4 text-xs font-semibold text-white hover:from-emerald-400 hover:to-sky-400">
                          {t("contact", "Contact")}
                        </Button>
                        <Button
                          variant="outline"
                          className="h-9 rounded-full border border-sky-300/70 bg-white px-4 text-xs font-semibold text-sky-700 transition hover:border-sky-400 hover:bg-sky-50 hover:text-sky-800"
                        >
                          {t("linkedin", "LinkedIn")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200/70 bg-white/85 p-5 shadow-lg shadow-slate-900/10 backdrop-blur sm:p-7 md:p-9">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-emerald-700 sm:text-sm">
                      {t("companyLegalTag", "Legal")}
                    </p>
                    <h2 className="mt-3 text-lg font-semibold text-slate-900 sm:text-xl md:text-2xl">
                      {t("companyLegalHeading", "Informații legale companie")}
                    </h2>
                    <p className="mt-3 text-xs text-slate-600 sm:text-sm">
                      {t(
                        "companyLegalDescription",
                        "Datele complete de identificare pentru procesatorii de plăți și autoritățile de reglementare."
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 shadow-inner shadow-slate-900/5">
                    <dl className="space-y-3 text-xs text-slate-700 sm:text-sm">
                      <div>
                        <dt className="text-emerald-700">
                          {t("companyLegalEntity", "Denumire")}
                        </dt>
                        <dd className="mt-1 text-slate-900">
                          {process.env.NEXT_PUBLIC_STORE_LEGAL_NAME ||
                            "WEBIRA REM S.R.L."}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-emerald-700">
                          {t("companyLegalAddress", "Sediu social")}
                        </dt>
                        <dd className="mt-1 leading-relaxed">
                          {process.env.NEXT_PUBLIC_STORE_LEGAL_ADDRESS ||
                            "Jud. Cluj, Municipiul Cluj-Napoca, Strada Mehedinți, Nr. 54-56, Bl. D5, Sc. 2"}
                        </dd>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <dt className="text-emerald-700">
                            {t(
                              "companyLegalCuiLabel",
                              "Cod de identificare fiscală"
                            )}
                          </dt>
                          <dd className="mt-1 text-slate-900">51813997</dd>
                        </div>
                        <div>
                          <dt className="text-emerald-700">
                            {t(
                              "companyLegalCuiDateLabel",
                              "Data înregistrării"
                            )}
                          </dt>
                          <dd className="mt-1 text-slate-900">20.05.2025</dd>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <dt className="text-emerald-700">
                            {t(
                              "companyLegalRegCommerce",
                              "Registrul Comerțului"
                            )}
                          </dt>
                          <dd className="mt-1 text-slate-900">
                            J2025035239005
                          </dd>
                        </div>
                        <div>
                          <dt className="text-emerald-700">
                            {t("companyLegalRegDate", "Data înscrierii")}
                          </dt>
                          <dd className="mt-1 text-slate-900">19.05.2025</dd>
                        </div>
                      </div>
                    </dl>
                  </div>
                </div>
              </section>

              <section className="overflow-hidden rounded-3xl border border-sky-500/40 bg-gradient-to-br from-sky-500/20 via-indigo-900/40 to-slate-950/80 p-5 text-slate-100 shadow-xl shadow-sky-500/30 sm:p-7 md:p-9">
                <h2 className="text-center text-base font-semibold text-white sm:text-lg md:text-xl">
                  {t("joinStemJourney")}
                </h2>
                <p className="mx-auto mt-3 max-w-3xl text-center text-xs text-slate-200 sm:text-sm md:text-base">
                  {t("joinStemJourneyDesc") ||
                    "Discover our carefully curated selection of educational toys and start inspiring curiosity today!"}
                </p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="w-full rounded-2xl bg-white/90 px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-white/20 transition hover:bg-white sm:w-auto sm:text-base"
                  >
                    <Link href="/products">{t("shopCollection")}</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-full rounded-2xl border border-white/40 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10 sm:w-auto sm:text-base"
                  >
                    <Link href="/contact">
                      {t("aboutHeroFreeConsultation")}
                    </Link>
                  </Button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
