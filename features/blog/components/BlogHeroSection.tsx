"use client";

import Image from "next/image";

import { Container } from "@/components/ui/container";

import { blogGlassPanelClass } from "./blogTheme";

type TranslateFn = (key: string) => string;

interface BlogHeroSectionProps {
  t: TranslateFn;
  language: string;
  onLanguageToggle: () => void;
}

export function BlogHeroSection({
  t,
  language,
  onLanguageToggle,
}: BlogHeroSectionProps) {
  return (
    <section className="relative w-full flex items-center justify-center">
      <div className="absolute inset-0">
        <Image
          src="/images/category_banner_science_01.png"
          alt="STEM Toys Blog - Educational articles and insights"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-indigo-950/70 to-slate-950/85" />
      </div>

      <Container className="relative z-10 flex flex-col items-center justify-center py-14 sm:py-16 md:py-20 lg:py-24 text-center text-white">
        <div className="max-w-4xl space-y-4 sm:space-y-6">
          <span className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
            {t("blogLabel") || "TechTots Blog"}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.05] drop-shadow-2xl">
            {t("blogH1")}
          </h1>
          <p className="mx-auto max-w-3xl text-sm sm:text-base md:text-lg lg:text-xl text-white/85 leading-relaxed drop-shadow-md">
            {t("blogDescription")}
          </p>
        </div>

        <div className="mt-6 sm:mt-8">
          <div
            className={`${blogGlassPanelClass} flex items-center gap-2 rounded-full border-white/20 bg-white/15 px-3 py-2 shadow-xl`}
          >
            <button
              onClick={onLanguageToggle}
              className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 transition-all duration-300 hover:border-white/40 hover:bg-white/20"
              aria-label={`Switch to ${language === "ro" ? "English" : "Română"}`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-r ${language === "ro" ? "from-blue-600/30 to-blue-700/30" : "from-red-600/30 to-red-700/30"} transition-all duration-500`}
              />
              <span className="relative z-10 text-2xl transition-transform duration-200 group-hover:scale-110">
                {language === "ro" ? "🇬🇧" : "🇷🇴"}
              </span>
            </button>
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-medium uppercase tracking-[0.4em] text-white/60">
                {t("language") || "Language"}
              </span>
              <span className="text-sm font-semibold text-white">
                {language === "ro" ? "Română" : "English"}
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

