"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Shield, Users, Star, Clock } from "lucide-react";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { useTranslation } from "@/lib/i18n";

const socialProofBadges = [
  { icon: Users, label: "Families Worldwide" },
  { icon: Star, label: "4.9/5 Stars Rating" },
  { icon: Shield, label: "Quality Guaranteed" },
];

const faqCards = [
  {
    icon: CheckCircle,
    gradient: "border border-white/10 bg-white/5",
    titleKey: "faqWhatAreStemH2",
    bodyKey: "faqWhatAreStemAnswer",
    highlight: {
      border: "border-emerald-400/30 bg-emerald-500/10",
      title: "🎯 Real Results:",
      body:
        '"My 8-year-old went from crying over math homework to asking for more experiments. The transformation happened in just 3 weeks!" - Sarah M., Parent',
    },
  },
  {
    icon: Shield,
    gradient: "border border-white/10 bg-white/5",
    titleKey: "faqAgeAppropriateH2",
    bodyKey: "faqAgeAppropriateAnswer",
    highlight: {
      border: "border-amber-400/30 bg-amber-500/10",
      title: "🛡️ Our Promise:",
      body:
        "If you're not 100% satisfied with your choice, we'll not only refund you but also personally help you find the perfect toy for your child's specific needs.",
    },
  },
  {
    icon: Shield,
    gradient: "border border-white/10 bg-white/5",
    titleKey: "faqSafetyH2",
    bodyKey: "faqSafetyAnswer",
    certifications: [
      { title: "CE Certified", subtitle: "European Standards" },
      { title: "ASTM F963", subtitle: "US Safety Standard" },
      { title: "EN71", subtitle: "EU Toy Safety" },
      { title: "0 Incidents", subtitle: "50,000+ Toys Sold" },
    ],
  },
  {
    icon: Star,
    gradient: "border border-white/10 bg-white/5",
    titleKey: "faqEducationalH2",
    bodyKey: "faqEducationalAnswer",
    highlightStats: [
      { value: "87%", label: "Improved Math Scores" },
      { value: "92%", label: "Increased Engagement" },
      { value: "10k+", label: "Happy Families" },
    ],
  },
  {
    icon: Clock,
    gradient: "border border-white/10 bg-white/5",
    titleKey: "faqPurchaseH2",
    bodyKey: "faqReturnPolicyAnswer",
    commitments: [
      "Easy returns process",
      "Friendly customer support team",
      "Personal consultation to find perfect fit",
      "No questions asked policy",
    ],
  },
];

export default function FAQPage() {
  const { t } = useTranslation();

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Cum transformă jucăriile STEM copiii în doar 30 de zile?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Studiile noastre arată că 87% din copii își îmbunătățesc performanțele la matematică în 30 de zile folosind jucăriile STEM TechTots. Metodologia noastră transformă 'urăsc matematica' în 'când facem experimente?' prin învățare practică și interactivă. Peste 10,000 de părinți au văzut deja această transformare.",
        },
      },
      {
        "@type": "Question",
        name: "Ce jucării STEM sunt potrivite pentru vârsta copilului meu?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oferim jucării STEM personalizate pentru fiecare vârstă: 3-5 ani (explorare senzorială), 6-8 ani (experimente simple), 9-12 ani (proiecte complexe), 13+ ani (robotică avansată). Fiecare produs include ghid de vârstă și activități recomandate. Dacă nu ești 100% mulțumit, îți oferim consultare gratuită pentru a găsi jucăria perfectă.",
        },
      },
      {
        "@type": "Question",
        name: "Sunt sigure jucăriile STEM pentru copii?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Toate jucăriile noastre sunt certificate CE, ASTM F963, și EN71 pentru siguranța maximă. Am vândut peste 50,000 de jucării cu 0 incidente de siguranță. Materialele sunt non-toxice, testate pentru durabilitate, și proiectate special pentru mâinile mici. Garanție de siguranță 100% sau îți returnăm banii.",
        },
      },
      {
        "@type": "Question",
        name: "Cum știu că jucăriile STEM chiar îmbunătățesc învățarea?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Rezultatele noastre dovedite: 87% îmbunătățire la matematică, 92% creșterea angajamentului în învățare, transformare medie în 30 de zile. Colaborăm cu educatori STEM și folosim metodologii validate științific. Fiecare jucărie vine cu ghid de învățare și activități structurate pentru rezultate măsurabile.",
        },
      },
      {
        "@type": "Question",
        name: "Ce se întâmplă dacă nu sunt mulțumit de achiziție?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Susținem calitatea produselor noastre. Dacă nu ești mulțumit de achiziție, te rugăm să contactezi echipa noastră de servicii pentru clienți și vom lucra cu tine pentru a găsi o soluție. Include consultare gratuită personalizată pentru a găsi alternativa perfectă. Satisfacția ta este prioritatea noastră.",
        },
      },
    ],
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(74,222,128,0.12),_transparent_60%)]" />

      <div className="relative z-10">
        <SeoJsonLd data={faqStructuredData} />

        <section className="container mx-auto max-w-5xl px-3 py-6 sm:px-6 sm:py-10 md:py-14">
          <div className="text-center">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/40 backdrop-blur sm:p-10">
              <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">{t("faqH1")}</h1>
              <p className="mt-4 text-sm text-slate-200 sm:text-base md:text-lg">{t("faqSubtitle")}</p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {socialProofBadges.map(({ icon: Icon, label }) => (
                  <Badge
                    key={label}
                    variant="secondary"
                    className="border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-slate-100 backdrop-blur"
                  >
                    <Icon className="mr-1 h-4 w-4 sm:mr-1.5 sm:h-4 sm:w-4 md:mr-2 md:h-4 md:w-4" />
                    {label}
                  </Badge>
                ))}
              </div>

              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <Button
                  asChild
                  size="lg"
                  className="rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-400 sm:text-base"
                >
                  <Link href="/contact">{t("faqGetPersonalizedRecommendations")}</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-slate-100 backdrop-blur transition hover:border-white/40 hover:text-white sm:text-base"
                >
                  <Link href="/products">{t("faqSeeSuccessStories")}</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-6 sm:space-y-8 md:space-y-12">
            {faqCards.map(
              ({ icon: Icon, gradient, titleKey, bodyKey, highlight, certifications, highlightStats, commitments }) => (
                <section key={titleKey} className={`rounded-3xl ${gradient} p-5 shadow-lg shadow-black/30 backdrop-blur sm:p-6 md:p-8`}>
                  <div className="flex items-start gap-3 sm:gap-4">
                    <Icon className="h-6 w-6 flex-shrink-0 text-emerald-300 sm:h-7 sm:w-7 md:h-8 md:w-8" />
                    <div className="space-y-3">
                      <h2 className="text-base font-bold text-white sm:text-lg md:text-2xl">{t(titleKey)}</h2>
                      <p className="text-xs leading-relaxed text-slate-200 sm:text-sm md:text-base lg:text-lg">{t(bodyKey)}</p>

                      {highlight && (
                        <div className={`rounded-2xl border ${highlight.border} p-4 text-xs text-emerald-100 shadow-inner sm:text-sm md:text-base`}>
                          <p className="font-semibold">{highlight.title}</p>
                          <p className="mt-2 text-slate-100">{highlight.body}</p>
                        </div>
                      )}

                      {certifications && (
                        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                          <p className="text-xs font-semibold text-white sm:text-sm md:text-base">🔒 Safety Certifications:</p>
                          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-200 sm:text-sm md:grid-cols-4">
                            {certifications.map(cert => (
                              <div key={cert.title} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                                <div className="font-semibold text-white">{cert.title}</div>
                                <div className="text-[10px] text-slate-300 sm:text-xs">{cert.subtitle}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {highlightStats && (
                        <div className="rounded-2xl border border-purple-400/30 bg-purple-500/10 p-4 text-xs text-purple-100 shadow-inner sm:text-sm md:text-base">
                          <p className="font-semibold">📈 Proven Results:</p>
                          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                            {highlightStats.map(stat => (
                              <div key={stat.label} className="rounded-xl border border-white/10 bg-white/10 p-3">
                                <div className="text-lg font-bold text-white sm:text-xl md:text-2xl">{stat.value}</div>
                                <div className="text-[10px] text-purple-100 sm:text-xs md:text-sm">{stat.label}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {commitments && (
                        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-xs text-rose-100 shadow-inner sm:text-sm md:text-base">
                          <p className="font-semibold">💯 Our Commitment to You:</p>
                          <div className="mt-3 space-y-2 text-slate-100">
                            {commitments.map(item => (
                              <div key={item} className="flex items-center gap-2 text-xs sm:text-sm md:text-base">
                                <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-300" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )
            )}
          </div>

          <section className="mt-8 rounded-3xl border border-sky-500/40 bg-gradient-to-br from-sky-500/20 via-indigo-900/50 to-slate-950/80 p-6 text-center text-slate-100 shadow-xl shadow-sky-500/30 sm:mt-12 sm:p-8 md:mt-16 md:p-12">
            <h2 className="text-base font-bold text-white sm:text-lg md:text-xl lg:text-2xl xl:text-3xl">
              Ready to Transform Your Child's Learning?
            </h2>
            <p className="mt-3 text-xs text-slate-200 sm:text-sm md:text-base lg:text-lg xl:text-xl">
              Families worldwide are discovering how STEM education prepares children for tomorrow's AI-driven world.
              Start today with quality guaranteed products.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-sky-600 transition hover:bg-sky-50 sm:text-base"
              >
                <Link href="/products">{t("faqStartTransformation")}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-slate-100 backdrop-blur transition hover:border-white/50 hover:text-white sm:text-base"
              >
                <Link href="/contact">{t("faqBookFreeConsultation")}</Link>
              </Button>
            </div>
            <p className="mt-4 text-[10px] text-slate-200 sm:text-xs md:text-sm">
              ⚡ Limited time: Free consultation worth €50 - Only 50 spots this month
            </p>
          </section>
        </section>
      </div>
    </div>
  );
}

