"use client";

import { useState } from "react";
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
  const [heroImageSrc, setHeroImageSrc] = useState("/HeroImage.png");

  return (
    <section className="relative w-full flex items-center justify-center">
      <div className="absolute inset-0">
        <Image
          src={heroImageSrc}
          alt="STEM Toys Blog - Educational articles and insights"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          onError={() => {
            if (heroImageSrc !== "/HeroImageTechTechtots.png") {
              setHeroImageSrc("/HeroImageTechTechtots.png");
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/68 via-sky-50/62 to-white/72" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(255,255,255,0.28),transparent_35%),radial-gradient(circle_at_80%_18%,rgba(34,211,238,0.08),transparent_38%),radial-gradient(circle_at_50%_90%,rgba(251,191,36,0.08),transparent_40%)]" />
      </div>

      <Container className="relative z-10 flex flex-col items-center justify-center py-14 sm:py-16 md:py-20 lg:py-24 text-center text-slate-900">
        <div className="max-w-4xl space-y-4 sm:space-y-6">
          <span className="inline-flex items-center justify-center rounded-full border border-white/50 bg-white/60 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">
            {t("blogLabel") || "TechTots Blog"}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.05] text-slate-900 drop-shadow-[0_2px_10px_rgba(255,255,255,0.35)]">
            {t("blogH1")}
          </h1>
          <p className="mx-auto max-w-3xl text-sm sm:text-base md:text-lg lg:text-xl text-slate-700 leading-relaxed">
            {t("blogDescription")}
          </p>
        </div>

        <div className="mt-6 sm:mt-8">
          <div
            className={`${blogGlassPanelClass} flex items-center gap-2 rounded-full border-white/20 bg-white/15 px-3 py-2 shadow-xl`}
          >
            <button
              onClick={onLanguageToggle}
              className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/40 bg-white/60 transition-all duration-300 hover:border-white/70 hover:bg-white/80"
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
              <span className="text-[10px] font-medium uppercase tracking-[0.4em] text-slate-500">
                {t("language") || "Language"}
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {language === "ro" ? "Română" : "English"}
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
