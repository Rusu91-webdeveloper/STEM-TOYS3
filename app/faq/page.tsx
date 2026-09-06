"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Shield,
  Star,
  Clock,
  AlertTriangle,
} from "lucide-react";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { useTranslation } from "@/lib/i18n";
import {
  RETURN_POLICY_COD_RTO_RO,
  RETURN_POLICY_CUSTOMER_PAYS_RO,
  RETURN_POLICY_SELLER_PAYS_RO,
  RETURN_WINDOW_LABEL_RO,
} from "@/lib/returns/policy";

const socialProofBadges = [
  { icon: Shield, label: "Branduri europene" },
  { icon: Clock, label: "Livrare 1–3 zile" },
  { icon: CheckCircle, label: "Retur 14 zile" },
];

const faqCards = [
  {
    icon: CheckCircle,
    gradient: "border border-slate-200/80 bg-white/90",
    titleKey: "faqWhatAreStemH2",
    bodyKey: "faqWhatAreStemAnswer",
    highlight: {
      border: "border-emerald-400/30 bg-emerald-500/10",
      title: "🎯 Cum ajută în practică:",
      body: "STEM transformă învățarea în joacă: experimente, proiecte și pași clari pe vârstă. Fără promisiuni de note — doar explorare ghidată.",
    },
  },
  {
    icon: Shield,
    gradient: "border border-slate-200/80 bg-white/90",
    titleKey: "faqAgeAppropriateH2",
    bodyKey: "faqAgeAppropriateAnswer",
    highlight: {
      border: "border-amber-400/30 bg-amber-500/10",
      title: "🛡️ Cum te ajutăm să alegi:",
      body: "Folosește filtrele pe vârstă, verifică indicațiile de pe cutia brandului și scrie-ne dacă ești între două grupe. Ai retur în 14 zile calendaristice conform politicii legale.",
    },
  },
  {
    icon: Shield,
    gradient: "border border-slate-200/80 bg-white/90",
    titleKey: "faqSafetyH2",
    bodyKey: "faqSafetyAnswer",
    certifications: [
      { title: "CE", subtitle: "Marcaj unde e cazul" },
      { title: "EN71", subtitle: "Siguranță jucării UE" },
      { title: "Vârstă pe cutie", subtitle: "Respectă indicațiile brandului" },
      { title: "FanCourier", subtitle: "Livrare în România" },
    ],
  },
  {
    icon: Star,
    gradient: "border border-slate-200/80 bg-white/90",
    titleKey: "faqEducationalH2",
    bodyKey: "faqEducationalAnswer",
    highlightStats: [
      { value: "STEM", label: "Prin joacă practică" },
      { value: "1–3z", label: "Livrare tipică RO" },
      { value: "14z", label: "Drept de retur" },
    ],
  },
  {
    icon: Clock,
    gradient: "border border-slate-200/80 bg-white/90",
    titleKey: "faqPurchaseH2",
    bodyKey: "faqReturnPolicyAnswer",
    commitments: [
      `${RETURN_WINDOW_LABEL_RO} pentru retur`,
      "Costul returului standard este suportat de client",
      "Produsele defecte au retur suportat de vânzător",
      "Asistență rapidă din partea echipei noastre",
    ],
  },
];

const codTransparencyHighlights = [
  "Refuzul la livrare sau nepreluarea coletului este tratat ca retur la expeditor (RTO).",
  RETURN_POLICY_COD_RTO_RO,
  `Dreptul de retragere în ${RETURN_WINDOW_LABEL_RO} se aplică după recepția produsului, nu la refuzul livrării.`,
  RETURN_POLICY_CUSTOMER_PAYS_RO,
  RETURN_POLICY_SELLER_PAYS_RO,
  "Dacă există diferențe peste garanția COD autorizată, acestea se gestionează prin fluxuri legale/contabile aplicabile în România.",
];

export default function FAQPage() {
  const { t } = useTranslation();

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Ajută jucăriile STEM dacă copilul nu place matematica?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Jucăriile STEM pot face învățarea mai atractivă prin experimente și proiecte practice. Nu garantăm note sau rezultate școlare. Alege după vârstă și interes; dacă produsul nu se potrivește, ai dreptul de retur în 14 zile calendaristice.",
        },
      },
      {
        "@type": "Question",
        name: "Cum aleg jucăria potrivită pentru vârstă?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Folosește filtrele pe vârstă de pe site și verifică întotdeauna intervalul de vârstă de pe ambalajul brandului. Dacă ești între două grupe, contactează-ne înainte de comandă.",
        },
      },
      {
        "@type": "Question",
        name: "Sunt sigure jucăriile STEM din magazin?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Selectăm branduri care declară respectarea standardelor de siguranță aplicabile (de exemplu CE / EN71, unde e cazul). Respectă indicațiile de vârstă și supravegherea de pe ambalaj. Nu publicăm statistici inventate despre incidente.",
        },
      },
      {
        "@type": "Question",
        name: "Cum știu că produsele ajută la învățare?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Produsele STEM sunt alese pentru a stimula curiozitatea, logica și învățarea prin joacă. Nu folosim procente sau studii inventate. Ghidurile noastre pe vârstă te ajută să alegi un start realist.",
        },
      },
      {
        "@type": "Question",
        name: "Ce se întâmplă dacă nu sunt mulțumit de achiziție?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Ai drept de retragere în ${RETURN_WINDOW_LABEL_RO} de la livrare. ${RETURN_POLICY_CUSTOMER_PAYS_RO} ${RETURN_POLICY_SELLER_PAYS_RO}`,
        },
      },
      {
        "@type": "Question",
        name: "Ce se întâmplă dacă refuz o comandă ramburs la livrare?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Refuzul la livrare sau nepreluarea coletului este tratat ca retur la expeditor (RTO). ${RETURN_POLICY_COD_RTO_RO} Dreptul de retragere în ${RETURN_WINDOW_LABEL_RO} se aplică după recepția produsului. ${RETURN_POLICY_CUSTOMER_PAYS_RO} ${RETURN_POLICY_SELLER_PAYS_RO}`,
        },
      },
    ],
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/70 text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(16,185,129,0.07),_transparent_60%)]" />

      <div className="relative z-10">
        <SeoJsonLd data={faqStructuredData} />

        <section className="container mx-auto max-w-5xl px-3 py-6 sm:px-6 sm:py-10 md:py-14">
          <div className="text-center">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-indigo-900/75 to-slate-950/90 p-8 shadow-xl shadow-black/40 backdrop-blur sm:p-10">
              <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
                {t("faqH1")}
              </h1>
              <p className="mt-4 text-sm text-slate-200 sm:text-base md:text-lg">
                {t("faqSubtitle")}
              </p>

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
                  <Link href="/contact">
                    {t("faqGetPersonalizedRecommendations")}
                  </Link>
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
              ({
                icon: Icon,
                gradient,
                titleKey,
                bodyKey,
                highlight,
                certifications,
                highlightStats,
                commitments,
              }) => (
                <section
                  key={titleKey}
                  className={`rounded-3xl ${gradient} p-5 shadow-lg shadow-black/30 backdrop-blur sm:p-6 md:p-8`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <Icon className="h-6 w-6 flex-shrink-0 text-emerald-500 sm:h-7 sm:w-7 md:h-8 md:w-8" />
                    <div className="space-y-3">
                      <h2 className="text-base font-bold text-slate-900 sm:text-lg md:text-2xl">
                        {t(titleKey)}
                      </h2>
                      <p className="text-xs leading-relaxed text-slate-700 sm:text-sm md:text-base lg:text-lg">
                        {t(bodyKey)}
                      </p>

                      {highlight && (
                        <div
                          className={`rounded-2xl border ${highlight.border} p-4 text-xs text-slate-900 shadow-inner sm:text-sm md:text-base`}
                        >
                          <p className="font-semibold">{highlight.title}</p>
                          <p className="mt-2 text-slate-700">
                            {highlight.body}
                          </p>
                        </div>
                      )}

                      {certifications && (
                        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                          <p className="text-xs font-semibold text-white sm:text-sm md:text-base">
                            🔒 Siguranță & livrare:
                          </p>
                          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-200 sm:text-sm md:grid-cols-4">
                            {certifications.map(cert => (
                              <div
                                key={cert.title}
                                className="rounded-xl border border-white/10 bg-white/5 p-3 text-center"
                              >
                                <div className="font-semibold text-white">
                                  {cert.title}
                                </div>
                                <div className="text-[10px] text-slate-300 sm:text-xs">
                                  {cert.subtitle}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {highlightStats && (
                        <div className="rounded-2xl border border-purple-300/40 bg-purple-500/10 p-4 text-xs text-slate-900 shadow-inner sm:text-sm md:text-base">
                          <p className="font-semibold">📈 Ce poți aștepta:</p>
                          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                            {highlightStats.map(stat => (
                              <div
                                key={stat.label}
                                className="rounded-xl border border-purple-200/60 bg-white/70 p-3"
                              >
                                <div className="text-lg font-bold text-purple-700 sm:text-xl md:text-2xl">
                                  {stat.value}
                                </div>
                                <div className="text-[10px] text-purple-700/80 sm:text-xs md:text-sm">
                                  {stat.label}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {commitments && (
                        <div className="rounded-2xl border border-rose-300/40 bg-rose-500/10 p-4 text-xs text-slate-900 shadow-inner sm:text-sm md:text-base">
                          <p className="font-semibold">
                            💯 Our Commitment to You:
                          </p>
                          <div className="mt-3 space-y-2 text-slate-700">
                            {commitments.map(item => (
                              <div
                                key={item}
                                className="flex items-center gap-2 text-xs sm:text-sm md:text-base"
                              >
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

          <section className="mt-8 rounded-3xl border border-amber-200/80 bg-amber-50/80 p-6 shadow-lg shadow-slate-900/10 sm:mt-10 sm:p-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-700" />
              <div>
                <h2 className="text-base font-bold text-slate-900 sm:text-lg md:text-2xl">
                  Clarificare COD: Refuz livrare și costuri RTO
                </h2>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-700 sm:text-sm md:text-base">
                  {codTransparencyHighlights.map(item => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-slate-700 sm:text-sm">
                  Detalii complete în{" "}
                  <Link
                    href="/shipping"
                    className="font-semibold text-sky-700 underline underline-offset-4 hover:text-sky-600"
                  >
                    Politica de Livrare
                  </Link>{" "}
                  și{" "}
                  <Link
                    href="/terms"
                    className="font-semibold text-sky-700 underline underline-offset-4 hover:text-sky-600"
                  >
                    Termeni și Condiții
                  </Link>
                  .
                </p>
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-3xl border border-sky-500/40 bg-gradient-to-br from-sky-500/20 via-indigo-900/50 to-slate-950/80 p-6 text-center text-slate-100 shadow-xl shadow-sky-500/30 sm:mt-12 sm:p-8 md:mt-16 md:p-12">
            <h2 className="text-base font-bold text-white sm:text-lg md:text-xl lg:text-2xl xl:text-3xl">
              Gata să alegi primul kit STEM?
            </h2>
            <p className="mt-3 text-xs text-slate-200 sm:text-sm md:text-base lg:text-lg xl:text-xl">
              Explorează colecția pe vârstă, cu livrare în România și retur clar
              în 14 zile. Scrie-ne dacă ai nevoie de o recomandare.
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
              Ai o întrebare despre vârstă sau produs? Contactează-ne — răspundem din România.
            </p>
          </section>
        </section>
      </div>
    </div>
  );
}
