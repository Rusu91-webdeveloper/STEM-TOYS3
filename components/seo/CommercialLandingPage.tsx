import Link from "next/link";

import {
  CommercialLandingAgeTableSection,
  type CommercialAgeTable,
} from "@/components/seo/CommercialLandingAgeTableSection";
import { CommercialLandingClustersSection } from "@/components/seo/CommercialLandingClustersSection";
import { CommercialLandingFaqSection } from "@/components/seo/CommercialLandingFaqSection";
import { CommercialLandingQuickFactsSection } from "@/components/seo/CommercialLandingQuickFactsSection";

type LandingSectionLink = {
  href: string;
  label: string;
  description: string;
};

type LandingBenefit = {
  title: string;
  description: string;
};

type LandingFaq = {
  question: string;
  answer: string;
};

type LandingFact = {
  label: string;
  value: string;
};

type LandingGuide = {
  title: string;
  description: string;
};

type SectionHeadline = {
  kicker: string;
  title: string;
  intro?: string;
};

type CommercialLandingPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: {
    href: string;
    label: string;
  };
  secondaryCta?: {
    href: string;
    label: string;
  };
  proofPoints: string[];
  benefits?: LandingBenefit[];
  /** When set, wraps benefits in a card with this headline (e.g. „De ce TechTots?”). */
  benefitsHeadline?: SectionHeadline;
  quickFacts?: LandingFact[];
  /** Optional age-band table (e.g. robotics entry levels). */
  ageTable?: CommercialAgeTable;
  guides?: LandingGuide[];
  /** Overrides default „Ghid de selecție” block copy. */
  guidesHeadline?: SectionHeadline;
  checklistTitle?: string;
  checklistIntro?: string;
  checklistItems?: string[];
  /** Overrides default checklist kicker. */
  checklistKicker?: string;
  clusters: LandingSectionLink[];
  /** Titlu secțiune linkuri (implicit: Alte pagini utile / Unde poți merge mai departe). */
  clustersHeadline?: SectionHeadline;
  faqs: LandingFaq[];
};

export default function CommercialLandingPage({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  proofPoints,
  benefits = [],
  benefitsHeadline,
  quickFacts = [],
  ageTable,
  guides = [],
  guidesHeadline,
  checklistTitle,
  checklistIntro,
  checklistItems = [],
  checklistKicker,
  clusters,
  clustersHeadline,
  faqs,
}: CommercialLandingPageProps) {
  const benefitsGrid = (
    <div
      className={`grid gap-5 md:grid-cols-3${benefitsHeadline ? " mt-8" : ""}`}
    >
      {benefits.map(benefit => (
        <article
          key={benefit.title}
          className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)]"
        >
          <h2 className="text-xl font-bold text-slate-900">{benefit.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {benefit.description}
          </p>
        </article>
      ))}
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fcff_0%,#eef8ff_48%,#f7fbff_100%)] text-slate-900">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_transparent_55%),radial-gradient(circle_at_14%_16%,_rgba(16,185,129,0.06),_transparent_42%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(165,180,252,0.09),_transparent_60%),radial-gradient(circle_at_78%_88%,_rgba(251,191,36,0.04),_transparent_40%)]"
      />

      <div className="relative z-10 flex flex-col gap-10 pb-16">
        <section className="container mx-auto px-4 pt-16 sm:px-6 lg:px-8 lg:pt-20">
          <div className="rounded-[2rem] border border-white/70 bg-white/85 px-6 py-10 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.4)] backdrop-blur sm:px-10 sm:py-12">
            <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              {eyebrow}
            </span>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
              {description}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:via-sky-400 hover:to-indigo-400"
                href={primaryCta.href}
              >
                {primaryCta.label}
              </Link>
              {secondaryCta ? (
                <Link
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  href={secondaryCta.href}
                >
                  {secondaryCta.label}
                </Link>
              ) : null}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {proofPoints.map(point => (
                <div
                  key={point}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/90 px-4 py-4 text-sm font-medium text-slate-700"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>
        </section>

        {ageTable ? (
          <CommercialLandingAgeTableSection ageTable={ageTable} />
        ) : null}

        {benefits.length > 0 ? (
          <section className="container mx-auto px-4 sm:px-6 lg:px-8">
            {benefitsHeadline ? (
              <div className="rounded-[2rem] border border-slate-200/80 bg-white/92 px-6 py-8 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.35)] sm:px-8">
                <div className="max-w-3xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700">
                    {benefitsHeadline.kicker}
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-slate-950">
                    {benefitsHeadline.title}
                  </h2>
                  {benefitsHeadline.intro ? (
                    <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                      {benefitsHeadline.intro}
                    </p>
                  ) : null}
                </div>
                {benefitsGrid}
              </div>
            ) : (
              benefitsGrid
            )}
          </section>
        ) : null}

        <CommercialLandingQuickFactsSection quickFacts={quickFacts} />

        {guides.length > 0 ? (
          <section className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] border border-slate-200/80 bg-white/92 px-6 py-8 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.35)] sm:px-8">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  {guidesHeadline?.kicker ?? "Ghid de selecție"}
                </p>
                <h2 className="mt-3 text-3xl font-black text-slate-950">
                  {guidesHeadline?.title ?? "Întrebări frecvente înainte de comandă"}
                </h2>
                {guidesHeadline?.intro !== undefined &&
                guidesHeadline.intro === "" ? null : (
                  <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                    {guidesHeadline?.intro ??
                      "Răspunsuri scurte la ce întreabă mulți părinți: ce să aleagă, pentru ce vârstă și cum ajung mai repede la varianta potrivită."}
                  </p>
                )}
              </div>

              <div
                className={`mt-8 grid gap-4 ${
                  guides.length >= 4
                    ? "sm:grid-cols-2 xl:grid-cols-4"
                    : "md:grid-cols-3"
                }`}
              >
                {guides.map(guide => (
                  <article
                    key={guide.title}
                    className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.4)]"
                  >
                    <h3 className="text-lg font-bold text-slate-950">
                      {guide.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {guide.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {checklistItems.length > 0 ? (
          <section className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] border border-slate-200/80 bg-white/92 px-6 py-8 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.35)] sm:px-8">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
                  {checklistKicker ?? "Checklist de cumpărare"}
                </p>
                <h2 className="mt-3 text-3xl font-black text-slate-950">
                  {checklistTitle || "Cum alegi mai repede produsul potrivit"}
                </h2>
                {checklistIntro ? (
                  <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                    {checklistIntro}
                  </p>
                ) : null}
              </div>

              <div className="mt-6 grid gap-3">
                {checklistItems.map(item => (
                  <div
                    key={item}
                    className="rounded-[1.35rem] border border-slate-200 bg-slate-50/90 px-4 py-4 text-sm font-medium text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <CommercialLandingClustersSection
          clusters={clusters}
          clustersHeadline={clustersHeadline}
        />

        <CommercialLandingFaqSection faqs={faqs} />
      </div>
    </div>
  );
}
