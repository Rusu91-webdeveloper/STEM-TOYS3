import type { DeliveryFaq } from "../data";

export function DeliveryFAQ({ faqs }: { faqs: DeliveryFaq[] }) {
  return (
    <section className="bg-slate-900/60 py-12 sm:py-16 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">Întrebări frecvente despre livrare</h2>
          <p className="mt-3 text-base text-slate-200 sm:text-lg">
            Răspunsuri rapide pentru tot ce ține de livrarea în maximum 7 zile lucrătoare.
          </p>
        </div>
        <div className="mt-10 grid gap-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-3xl border border-white/10 bg-white/5 p-6 shadow hover:border-sky-500/30 hover:shadow-sky-500/10"
            >
              <summary className="cursor-pointer list-none text-left text-lg font-semibold text-white transition group-open:text-sky-300">
                {faq.question}
              </summary>
              <p className="mt-3 text-sm text-slate-200">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}


