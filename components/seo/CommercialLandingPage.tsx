import Link from "next/link";

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
  benefits: LandingBenefit[];
  quickFacts?: LandingFact[];
  guides?: LandingGuide[];
  checklistTitle?: string;
  checklistIntro?: string;
  checklistItems?: string[];
  clusters: LandingSectionLink[];
  faqs: LandingFaq[];
};

export default function CommercialLandingPage({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  proofPoints,
  benefits,
  quickFacts = [],
  guides = [],
  checklistTitle,
  checklistIntro,
  checklistItems = [],
  clusters,
  faqs,
}: CommercialLandingPageProps) {
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

        <section className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {benefits.map(benefit => (
              <article
                key={benefit.title}
                className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)]"
              >
                <h2 className="text-xl font-bold text-slate-900">
                  {benefit.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {benefit.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {quickFacts.length > 0 ? (
          <section className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] border border-slate-200/80 bg-white/92 px-6 py-8 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.35)] sm:px-8">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-indigo-700">
                  Rezumat Comercial
                </p>
                <h2 className="mt-3 text-3xl font-black text-slate-950">
                  Ce intentie acopera pagina si cum ar trebui folosita
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                  Sectiunea aceasta face pagina mai clara pentru parinti,
                  motoare de cautare si sisteme AI care cauta raspunsuri
                  directe, nu doar heading-uri generale.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {quickFacts.map(fact => (
                  <article
                    key={fact.label}
                    className="rounded-[1.35rem] border border-slate-200 bg-slate-50/90 p-5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                      {fact.label}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      {fact.value}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {guides.length > 0 ? (
          <section className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] border border-slate-200/80 bg-white/92 px-6 py-8 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.35)] sm:px-8">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  Ghid de Selectie
                </p>
                <h2 className="mt-3 text-3xl font-black text-slate-950">
                  Raspunsuri directe pentru cautarile care preced comanda
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                  Fiecare bloc de mai jos raspunde unei intrebari comerciale
                  frecvente din SERP: ce aleg, pentru ce varsta, pentru ce tip
                  de copil si cat de repede ajung la categoria corecta.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
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
                  Checklist de Cumparare
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

        <section className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 px-6 py-8 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.35)] sm:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
                Clustere Comerciale
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Intrari puternice pentru cautarile care aduc comenzi
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                Paginile de mai jos sunt construite pentru intentii diferite:
                comparatie, selectie, cadou, varsta si disciplina.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {clusters.map(cluster => (
                <Link
                  key={cluster.href}
                  href={cluster.href}
                  className="group rounded-[1.5rem] border border-slate-200 bg-slate-50/90 p-5 transition hover:border-sky-300 hover:bg-white hover:shadow-[0_20px_45px_-30px_rgba(14,116,144,0.45)]"
                >
                  <p className="text-lg font-bold text-slate-900 group-hover:text-sky-800">
                    {cluster.label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {cluster.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/92 px-6 py-8 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.35)] sm:px-8">
            <h2 className="text-3xl font-black text-slate-950">
              Intrebari frecvente
            </h2>
            <div className="mt-6 grid gap-4">
              {faqs.map(faq => (
                <article
                  key={faq.question}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50/90 p-5"
                >
                  <h3 className="text-lg font-bold text-slate-900">
                    {faq.question}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                    {faq.answer}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
