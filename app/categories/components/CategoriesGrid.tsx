"use client";

import Image from "next/image";

import { useTranslation, TranslationKey } from "@/lib/i18n";

export interface CategoryData {
  id: string;
  name: string;
  nameKey: string;
  description: string;
  slug: string;
  image: string;
  productCount: number;
  isActive: boolean;
}

interface CategoriesGridProps {
  categories: CategoryData[];
}

export function CategoriesGrid({ categories }: CategoriesGridProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-12 sm:space-y-16 md:space-y-24">
      {categories.map((category, index) => (
        <div
          key={category.slug}
          className={`relative flex flex-col sm:flex-row ${
            index % 2 !== 0 ? "sm:flex-row-reverse" : ""
          } gap-0 sm:gap-8 md:gap-12 items-stretch transition-all duration-500 hover:scale-[1.02] shadow-lg hover:shadow-xl rounded-xl sm:rounded-2xl overflow-hidden
            w-full mx-2 sm:mx-0 md:w-full
            bg-background
            p-0 sm:px-8 sm:py-10 md:px-12 md:py-14
          `}
          style={{ maxWidth: "100vw", minHeight: "min(340px, 60vw)" }}
        >
          {/* Image section */}
          <div className="relative w-full sm:w-2/5 h-[160px] sm:h-auto flex-shrink-0 flex-grow-0">
            <div className="relative h-full w-full min-h-[120px] sm:min-h-0 overflow-hidden rounded-t-xl sm:rounded-t-none sm:rounded-l-2xl shadow-lg">
              <Image
                src={category.image}
                alt={`${category.name} category of STEM toys`}
                fill
                priority
                sizes="(max-width: 640px) 100vw, 40vw"
                style={{ objectFit: "cover" }}
                className="transition-transform hover:scale-105 duration-700"
              />
            </div>
          </div>

          {/* Text/content section */}
          <div className="w-full sm:w-3/5 flex flex-col justify-center space-y-3 sm:space-y-4 md:space-y-6 p-4 sm:p-8 md:p-10">
            <div className="inline-flex items-center px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium rounded-full bg-primary/10 text-primary">
              {t("categoryProducts").replace(
                "{0}",
                category.productCount.toString()
              )}
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground/90">
              {category.name}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed">
              {t(category.description as TranslationKey)}
            </p>

            {/* Educational benefits section */}
            <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-primary/10">
              <h3 className="text-sm sm:text-base font-semibold text-foreground/80 mb-2 sm:mb-3">
                Beneficii Educaționale:
              </h3>
              <ul className="text-xs sm:text-sm text-muted-foreground space-y-1 sm:space-y-2">
                {category.slug === "science" && (
                  <>
                    <li>• Dezvoltă curiozitatea și spiritul de cercetare</li>
                    <li>
                      • Învață principiile științei prin experimente practice
                    </li>
                    <li>• Stimulează gândirea critică și analitică</li>
                    <li>• Introduce concepte de fizică, chimie și biologie</li>
                  </>
                )}
                {category.slug === "technology" && (
                  <>
                    <li>• Dezvoltă gândirea computațională și algoritmică</li>
                    <li>• Introduce programarea și robotică</li>
                    <li>• Pregătește pentru carierele viitorului</li>
                    <li>• Învață despre inteligența artificială și inovație</li>
                  </>
                )}
                {category.slug === "engineering" && (
                  <>
                    <li>• Învață principiile mecanicii și structurilor</li>
                    <li>• Dezvoltă abilități de rezolvare a problemelor</li>
                    <li>• Stimulează creativitatea inginerească</li>
                    <li>• Învață procesul de proiectare și testare</li>
                  </>
                )}
                {category.slug === "math" && (
                  <>
                    <li>• Face matematica distractivă și accesibilă</li>
                    <li>• Dezvoltă gândirea logică și raționamentul</li>
                    <li>• Învață concepte matematice prin joc</li>
                    <li>• Construiește încrederea în rezolvarea problemelor</li>
                  </>
                )}
                {category.slug === "educational-books" && (
                  <>
                    <li>• Inspiră dragostea pentru învățare</li>
                    <li>• Dezvoltă vocabularul și abilitățile de citire</li>
                    <li>• Introduce concepte STEM prin povești</li>
                    <li>• Stimulează imaginația și creativitatea</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
