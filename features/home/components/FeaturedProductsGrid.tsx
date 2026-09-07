"use client";

import Image from "next/image";
import Link from "next/link";

import { useCurrency } from "@/lib/currency";
import type { Product } from "@/types/product";

import { HOVER_RACER_SLUG, PRODUCT_AGE_LABELS } from "../merchandising";

export function FeaturedProductsGrid({
  products,
}: {
  products: Product[];
  t?: (key: string, fallback?: string) => string;
  isLoading?: boolean;
}) {
  const { formatPrice } = useCurrency();
  const unique = Array.from(
    new Map(products.map(product => [product.id, product])).values()
  );
  const showcase = unique
    .sort(
      (a, b) =>
        Number(b.slug === HOVER_RACER_SLUG) -
        Number(a.slug === HOVER_RACER_SLUG)
    )
    .slice(0, 4);
  return (
    <section
      aria-labelledby="home-products"
      className="border-y border-slate-200 bg-white py-7 sm:py-9"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-700">
              Selecția TechTots
            </p>
            <h2
              id="home-products"
              className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl"
            >
              Produse recomandate
            </h2>
          </div>
          <Link
            href="/products"
            className="shrink-0 py-3 text-sm font-semibold text-blue-700 underline underline-offset-4"
          >
            Vezi colecția
          </Link>
        </div>
        {showcase.length ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-5">
            {showcase.map(product => {
              const hover = product.slug === HOVER_RACER_SLUG;
              const age = hover
                ? "8+ ani"
                : product.ageRange ||
                  (product.ageGroup
                    ? PRODUCT_AGE_LABELS[product.ageGroup]
                    : null);
              return (
                <article
                  key={product.id}
                  className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <Link
                    href={`/products/${product.slug}`}
                    aria-label={product.name}
                    className="relative block aspect-square bg-slate-50"
                  >
                    <Image
                      src={
                        hover
                          ? "/images/home/hover-racer.webp"
                          : product.images?.[0] || "/placeholder-product.png"
                      }
                      alt={product.name}
                      fill
                      sizes="(max-width: 1023px) 50vw, 25vw"
                      className="object-contain p-3 sm:p-5"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col p-3 sm:p-4">
                    <p className="mb-2 min-h-8 text-[10px] font-semibold leading-4 text-emerald-800">
                      {hover
                        ? "Recomandarea săptămânii"
                        : "Selectat de TechTots"}
                    </p>
                    <h3 className="mb-2 line-clamp-3 min-h-[3.75rem] text-sm font-bold leading-5 text-slate-950">
                      <Link href={`/products/${product.slug}`}>
                        {hover
                          ? "Hover Racer 4M · Kit de construit aeroglisor"
                          : product.name}
                      </Link>
                    </h3>
                    <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                      {age && <span>{age}</span>}
                      <span
                        className={
                          product.stockQuantity > 0
                            ? "text-emerald-800"
                            : "text-slate-600"
                        }
                      >
                        {product.stockQuantity > 0 ? "În stoc" : "Stoc epuizat"}
                      </span>
                    </div>
                    <p className="mb-3 mt-auto text-lg font-bold text-[#0b1b32]">
                      {formatPrice(product.price)}
                    </p>
                    <Link
                      href={`/products/${product.slug}`}
                      className="flex min-h-11 items-center justify-center rounded-lg bg-[#0b1b32] px-2 py-3 text-xs font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      Vezi produsul
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="py-6 text-sm text-slate-600">
            Selecția se actualizează.{" "}
            <Link
              href="/products"
              className="font-semibold text-blue-700 underline"
            >
              Descoperă produsele din catalog.
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
