"use client";

import Link from "next/link";
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Star, Shield, Clock, ArrowRight } from "lucide-react";
import { useABTest, useConversionTracking } from "@/hooks/useABTest";
import { trackEvent as gaTrackEvent } from "@/lib/analytics/ga4";

interface ProductsPageHeroProps {
  t: (key: string, defaultValue?: string) => string;
}

export function ProductsPageHero({ t }: ProductsPageHeroProps) {
  // A/B Testing for products page headline
  const { variant: headlineVariant, trackConversion: trackHeadlineConversion } =
    useABTest("products_hero_headline");

  // A/B Testing for CTA button
  const { variant: ctaVariant, trackConversion: trackCTAConversion } =
    useABTest("products_cta_button");

  // General conversion tracking
  const { trackEvent } = useConversionTracking();

  // GA4: products page hero impression
  useEffect(() => {
    gaTrackEvent("products_hero_impression", {
      section: "products_hero",
      variant: headlineVariant?.name || "control",
    });
  }, [headlineVariant]);

  // Get headline based on A/B test variant
  const getHeadline = () => {
    switch (headlineVariant?.id) {
      case "variant_a":
        return "Stop Luptelor cu Temele - Copilul Tău Va Iubi Matematica în 30 Zile";
      case "variant_b":
        return "De la 'Nu Pot Face Asta' la 'Vreau Să Învăț Mai Mult' - Garantat în 30 Zile";
      default:
        return t(
          "productsPageH1",
          "Transformă Copilul din 'Urăsc Matematica' în 'Vreau Să Experimentez!'"
        );
    }
  };

  // Get CTA text based on A/B test variant
  const getPrimaryCTAText = () => {
    switch (ctaVariant?.id) {
      case "variant_a":
        return "Consultare Gratuită Acum";
      case "variant_b":
        return "Începe Transformarea";
      default:
        return t(
          "getPersonalizedRecommendations",
          "Obține Recomandări Personalizate (Gratuit)"
        );
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 py-12 sm:py-16 md:py-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Main Headline - A/B Tested */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 leading-tight">
            {getHeadline()}
          </h1>

          {/* Subheadline - Transformation focused */}
          <p className="text-lg sm:text-xl md:text-2xl mb-8 text-gray-700 max-w-4xl mx-auto leading-relaxed">
            {t(
              "productsPageSubtitle",
              "Pe măsură ce AI și tehnologia transformă lumea, educația STEM este esențială. Produse de calitate garantată!"
            )}
          </p>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-8">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">Calitate Garantată</span>
            </div>

            <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">Livrare Rapidă</span>
            </div>

            <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm">
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">Produse Verificate</span>
            </div>
          </div>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {/* Primary CTA - Free Consultation */}
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={() => {
                trackCTAConversion("cta_click", "products_hero", {
                  element: "primary_button",
                  label: getPrimaryCTAText(),
                });
                trackEvent("products_hero_cta_click", "conversion", {
                  element: "primary_button",
                  variant: ctaVariant?.name,
                });
                gaTrackEvent("products_hero_cta_click", {
                  element: "primary_button",
                  label: getPrimaryCTAText(),
                  variant: ctaVariant?.name,
                });
              }}
            >
              <Link href="/contact" className="flex items-center">
                {getPrimaryCTAText()}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>

            {/* Secondary CTA - Success Stories */}
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-4 text-lg font-semibold shadow-sm hover:shadow-md transition-all"
              onClick={() => {
                gaTrackEvent("products_hero_secondary_click", {
                  element: "secondary_button",
                  label: t("seeSuccessStories", "Vezi Povești de Succes"),
                });
              }}
            >
              <Link href="/blog">
                {t("seeSuccessStories", "Vezi Povești de Succes")}
              </Link>
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
}
