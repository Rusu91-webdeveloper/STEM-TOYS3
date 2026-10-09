import Image from "next/image";
import Link from "next/link";

import { db } from "@/lib/db";
import { ROCKET_SLUG } from "@/lib/products/merchandising";

export async function WeeklyWinnerBanner() {
  const product = await db.product.findUnique({
    where: {
      slug: ROCKET_SLUG,
      isActive: true,
      status: "APPROVED",
    },
    select: {
      slug: true,
      name: true,
      price: true,
      images: true,
      stockQuantity: true,
      attributes: true,
    },
  });

  if (!product || product.stockQuantity < 1 || !product.images?.[0]) {
    return null;
  }

  const manufacturerAge =
    (product.attributes as any)?.manufacturerRecommendedAge ||
    (product.attributes as any)?.originalAgeText ||
    null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "RON",
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <section
      aria-labelledby="weekly-winner"
      className="mb-6 overflow-hidden rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-white shadow-[0_20px_50px_-30px_rgba(190,24,93,0.35)]"
    >
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="relative min-h-64 bg-rose-50/50 lg:min-h-80">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 42vw, 100vw"
            className="object-contain p-8"
          />
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-8">
          <p className="inline-flex w-fit items-center rounded-full border border-rose-300 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-rose-700 shadow-sm">
            Recomandarea săptămânii
          </p>
          <h2
            id="weekly-winner"
            className="mt-4 text-2xl font-black leading-tight sm:text-3xl"
          >
            {product.name}
          </h2>
          <p className="mt-3 text-lg font-bold text-slate-700">
            {formatPrice(product.price)}
            {manufacturerAge ? ` · ${manufacturerAge}` : ""}
          </p>
          <p className="mt-4 max-w-xl leading-7 text-slate-700">
            Experiment în aer liber cu propulsie pe apă și presiunea aerului.
            Rachetă completă cu pompă și suport de lansare.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/products/${ROCKET_SLUG}`}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-rose-600 px-6 font-black text-white shadow-lg transition hover:bg-rose-500"
            >
              Vezi produsul →
            </Link>
            <Link
              href="/cadouri-stem-6-8-ani"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-rose-200 bg-white px-6 font-bold text-rose-700 transition hover:bg-rose-50"
            >
              Cadouri STEM 6–8 ani
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
