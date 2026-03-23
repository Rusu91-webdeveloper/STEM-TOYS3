type LandingFact = {
  label: string;
  value: string;
};

type Props = {
  quickFacts: LandingFact[];
};

export function CommercialLandingQuickFactsSection({ quickFacts }: Props) {
  if (!quickFacts.length) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200/80 bg-white/92 px-6 py-8 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.35)] sm:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-indigo-700">
            Pe scurt
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-950">
            Ce găsești aici și cum te ajută
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            Câteva repere rapide ca să știi dacă ești în locul potrivit înainte
            să răsfoiești produsele.
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
  );
}
