"use client";

import Link from "next/link";
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Shield,
  Users,
  Clock,
  ArrowRight,
  Beaker,
  Cpu,
  Wrench,
  Calculator,
} from "lucide-react";
import { useABTest, useConversionTracking } from "@/hooks/useABTest";
import { trackEvent as gaTrackEvent } from "@/lib/analytics/ga4";

interface CategoryHeroHormoziProps {
  slug: string;
  t: (key: string, defaultValue?: string) => string;
}

const categoryConfig = {
  science: {
    icon: Beaker,
    color: "from-green-600 to-emerald-600",
    bgColor: "from-green-50 via-emerald-50 to-teal-50",
    titleKey: "scienceCategoryH1",
    subtitleKey: "scienceCategorySubtitle",
    defaultTitle: "Transformă Copilul Într-un Viitor Om de Știință",
    defaultSubtitle:
      "De la 'Știința e plictisitoare' la 'Vreau să fiu astronaut!' în doar 30 de zile cu jucăriile noastre științifice.",
    testimonial:
      "Fiul meu de 7 ani a trecut de la teama de experimente la a-mi cere să facem chimie în fiecare zi. Transformarea a fost incredibilă!",
    parentName: "Maria P., București",
  },
  technology: {
    icon: Cpu,
    color: "from-blue-600 to-indigo-600",
    bgColor: "from-blue-50 via-indigo-50 to-purple-50",
    titleKey: "technologyCategoryH1",
    subtitleKey: "technologyCategorySubtitle",
    defaultTitle: "Transformă Copilul Într-un Geniu Tehnologic",
    defaultSubtitle:
      "Oprește dependența de ecran, începe să construiești viitorul cu jucăriile noastre tehnologice.",
    testimonial:
      "În loc să stea pe tabletă, acum fiica mea programează roboți. A învățat mai multă tehnologie în 2 săptămâni decât în 2 ani de școală!",
    parentName: "Andrei M., Cluj-Napoca",
  },
  engineering: {
    icon: Wrench,
    color: "from-orange-600 to-red-600",
    bgColor: "from-orange-50 via-red-50 to-pink-50",
    titleKey: "engineeringCategoryH1",
    subtitleKey: "engineeringCategorySubtitle",
    defaultTitle: "Construiește Viitorul Copilului Tău",
    defaultSubtitle:
      "De la 'Nu pot face matematica' la 'Am construit acest robot!' cu jucăriile noastre de inginerie.",
    testimonial:
      "Copilul meu construiește acum mașini și poduri complexe. Profesoara a spus că s-a transformat complet la matematică!",
    parentName: "Elena R., Timișoara",
  },
  math: {
    icon: Calculator,
    color: "from-purple-600 to-pink-600",
    bgColor: "from-purple-50 via-pink-50 to-rose-50",
    titleKey: "mathCategoryH1",
    subtitleKey: "mathCategorySubtitle",
    defaultTitle: "Fă Matematica Subiectul Preferat al Copilului",
    defaultSubtitle:
      "De la lacrimi la triumf în 30 de zile cu jucăriile noastre matematice.",
    testimonial:
      "Matematica era un coșmar. Acum fiica mea rezolvă probleme complexe și spune că 'matematica e distractivă'!",
    parentName: "Cristian T., Iași",
  },
};

export function CategoryHeroHormozi({ slug, t }: CategoryHeroHormoziProps) {
  const config = categoryConfig[slug as keyof typeof categoryConfig];

  // Fallback if category not found
  if (!config) {
    return null;
  }

  const IconComponent = config.icon;

  // A/B Testing for category headline
  const { variant: headlineVariant, trackConversion: trackHeadlineConversion } =
    useABTest(`category_${slug}_headline`);

  // General conversion tracking
  const { trackEvent } = useConversionTracking();

  // GA4: category hero impression
  useEffect(() => {
    gaTrackEvent("category_hero_impression", {
      section: "category_hero",
      category: slug,
      variant: headlineVariant?.name || "control",
    });
  }, [slug, headlineVariant]);

  // Get headline based on category and A/B test
  const getHeadline = () => {
    const baseTitle = t(config.titleKey, config.defaultTitle);

    switch (headlineVariant?.id) {
      case "variant_a":
        return `${baseTitle} - Rezultate Garantate în 30 Zile`;
      case "variant_b":
        return `Stop Luptelor cu ${slug === "math" ? "Matematica" : "Învățarea"} - ${baseTitle}`;
      default:
        return baseTitle;
    }
  };

  return (
    <section
      className={`relative bg-gradient-to-br ${config.bgColor} py-16 sm:py-20 md:py-24`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div>
              {/* Category Badge */}
              <div className="mb-6">
                <Badge
                  variant="secondary"
                  className="px-4 py-2 text-sm bg-white/80 backdrop-blur border-0 shadow-sm"
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {slug.charAt(0).toUpperCase() + slug.slice(1)} STEM
                </Badge>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-gray-900 leading-tight">
                {getHeadline()}
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl mb-8 text-gray-700 leading-relaxed">
                {t(config.subtitleKey, config.defaultSubtitle)}
              </p>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">4.9/5 Stele</span>
                </div>

                <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    2,500+ Copii Transformați
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">
                    Calitate Garantată
                  </span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  asChild
                  size="lg"
                  className={`bg-gradient-to-r ${config.color} hover:opacity-90 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all`}
                  onClick={() => {
                    trackEvent("category_hero_cta_click", "conversion", {
                      element: "primary_button",
                      category: slug,
                    });
                    gaTrackEvent("category_hero_cta_click", {
                      element: "primary_button",
                      category: slug,
                    });
                  }}
                >
                  <Link
                    href={`/products?category=${slug}`}
                    className="flex items-center"
                  >
                    Vezi Jucăriile{" "}
                    {slug.charAt(0).toUpperCase() + slug.slice(1)}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-2 border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white px-8 py-4 text-lg font-semibold"
                >
                  <Link href="/contact">Consultare Gratuită</Link>
                </Button>
              </div>

              {/* Urgency Element */}
              <div className="bg-white/60 backdrop-blur rounded-lg p-4 border border-white/20">
                <div className="flex items-center gap-2 text-orange-700 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Ofertă Limitată</span>
                </div>
                <p className="text-sm text-gray-600">
                  Primii 50 de părinți primesc consultare gratuită + ghid
                  personalizat pentru {slug}.
                  <span className="font-semibold text-gray-900">
                    {" "}
                    Doar 12 locuri rămase!
                  </span>
                </p>
              </div>
            </div>

            {/* Right Column - Social Proof */}
            <div className="lg:pl-8">
              {/* Results Card */}
              <div className="bg-white/80 backdrop-blur rounded-2xl p-6 sm:p-8 shadow-xl border border-white/20 mb-8">
                <h3 className="text-xl font-bold mb-6 text-gray-900">
                  Rezultate Reale -{" "}
                  {slug.charAt(0).toUpperCase() + slug.slice(1)}:
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      89%
                    </div>
                    <div className="text-xs text-gray-600">
                      Îmbunătățire Notă
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      95%
                    </div>
                    <div className="text-xs text-gray-600">Copii Pasionați</div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-1">
                      21
                    </div>
                    <div className="text-xs text-gray-600">Zile Medie</div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-1">
                      100%
                    </div>
                    <div className="text-xs text-gray-600">
                      Părinți Mulțumiți
                    </div>
                  </div>
                </div>

                {/* Testimonial */}
                <div className="border-t pt-6">
                  <blockquote className="text-sm text-gray-700 mb-3 italic">
                    "{config.testimonial}"
                  </blockquote>
                  <cite className="text-xs text-gray-500 font-medium">
                    - {config.parentName}
                  </cite>
                </div>
              </div>

              {/* Age Quick Links */}
              <div className="bg-white/60 backdrop-blur rounded-xl p-6 border border-white/20">
                <h4 className="font-semibold mb-4 text-gray-900">
                  Găsește pentru Vârsta Copilului:
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {["3-5 ani", "6-8 ani", "9-12 ani", "13+ ani"].map(age => (
                    <Link
                      key={age}
                      href={`/products?category=${slug}&age=${age}`}
                      className="text-center py-2 px-3 bg-white/80 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:shadow-md transition-all"
                    >
                      {age}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
