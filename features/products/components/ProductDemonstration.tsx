import { PlayCircle } from "lucide-react";

import { getProductDemonstration } from "@/lib/products/product-demonstrations";

export function ProductDemonstration({ slug }: { slug: string }) {
  const demonstration = getProductDemonstration(slug);
  if (!demonstration) return null;
  return (
    <section
      aria-label="Demonstrația produsului"
      className="mt-4 rounded-xl border border-slate-200 bg-white p-4"
    >
      <h2 className="font-semibold text-slate-950">Vezi cum funcționează</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Demonstrație pentru acest model, publicată de producătorul Gigo.
        Respectă instrucțiunile și avertismentele setului.
      </p>
      <a
        href={demonstration.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex min-h-12 items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
      >
        <PlayCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
        Urmărește pe YouTube (filă nouă)
      </a>
    </section>
  );
}
