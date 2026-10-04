import Link from "next/link";

import { SeoJsonLd } from "@/components/seo/SeoJsonLd";
import { getCODSettings } from "@/lib/utils/store-settings";

import { buildFAQItems, faqStructuredData } from "./content";

export default async function FAQPage() {
  const items = buildFAQItems(await getCODSettings());
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-sky-50">
      <SeoJsonLd data={faqStructuredData(items)} />

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">
            Ghid pentru părinți
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Întrebări și răspunsuri despre jucăriile STEM
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Informații clare despre alegerea produselor, siguranță, livrare,
            plata ramburs și retururi.
          </p>
        </div>

        <div className="mt-12 space-y-4">
          {items.map(({ question, answer }) => (
            <article
              key={question}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-slate-900">
                {question}
              </h2>
              <p className="mt-3 leading-7 text-slate-600">{answer}</p>
            </article>
          ))}
        </div>

        <aside className="mt-10 rounded-2xl border border-sky-200 bg-sky-50 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-slate-900">
            Ai nevoie de detalii înainte de comandă?
          </h2>
          <p className="mt-3 leading-7 text-slate-600">
            Consultă paginile despre{" "}
            <Link
              href="/shipping"
              className="font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4"
            >
              livrare
            </Link>{" "}
            și{" "}
            <Link
              href="/returns"
              className="font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4"
            >
              retururi
            </Link>
            , unde găsești condițiile complete.
          </p>
        </aside>
      </section>
    </main>
  );
}
