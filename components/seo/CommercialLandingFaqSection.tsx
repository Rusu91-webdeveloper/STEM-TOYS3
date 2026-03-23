type LandingFaq = {
  question: string;
  answer: string;
};

type Props = {
  faqs: LandingFaq[];
};

export function CommercialLandingFaqSection({ faqs }: Props) {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200/80 bg-white/92 px-6 py-8 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.35)] sm:px-8">
        <h2 className="text-3xl font-black text-slate-950">
          Întrebări frecvente
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
  );
}
