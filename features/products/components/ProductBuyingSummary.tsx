import type { ProductBuyingGuide } from "@/lib/products/product-buying-guides";

export function ProductBuyingSummary({ guide }: { guide: ProductBuyingGuide }) {
  return (
    <section
      aria-label="Pe scurt, înainte de cumpărare"
      className="space-y-3 rounded-xl border border-sky-100 bg-sky-50/60 p-4 text-sm text-slate-700"
    >
      <dl className="space-y-2">
        <div>
          <dt className="font-semibold text-slate-900">În cutie</dt>
          <dd>{guide.contents}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-900">De pregătit</dt>
          <dd>{guide.preparation}</dd>
        </div>
      </dl>
      <details className="border-t border-sky-100 pt-2">
        <summary className="min-h-11 cursor-pointer py-3 font-semibold text-slate-800">
          Siguranță și instrucțiuni
        </summary>
        <p className="pb-3 text-sm leading-relaxed text-slate-600">
          {guide.safety}
        </p>
        {guide.manualUrl && (
          <a
            href={guide.manualUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center font-semibold text-sky-800 underline underline-offset-4"
          >
            Instrucțiuni de la producător (PDF, filă nouă)
          </a>
        )}
      </details>
    </section>
  );
}
