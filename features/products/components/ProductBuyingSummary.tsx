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
      <p className="text-xs leading-relaxed text-slate-600">{guide.safety}</p>
    </section>
  );
}
