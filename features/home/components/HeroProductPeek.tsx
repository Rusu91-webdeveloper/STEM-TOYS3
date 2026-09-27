"use client";

import Image from "next/image";
import Link from "next/link";

import { useCurrency } from "@/lib/currency";
import { productPublicPath } from "@/lib/products/public-slug";

export interface HeroPeekProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images?: string[];
}

/** Real catalog products inside the hero so mobile's first screen is not only text. */
export function HeroProductPeek({ products }: { products: HeroPeekProduct[] }) {
  const picks = products
    .slice(0, 3)
    .filter(product => Boolean(product.images?.[0]));
  if (picks.length === 0) return null;
  return <HeroProductPeekList products={picks} />;
}

function HeroProductPeekList({ products }: { products: HeroPeekProduct[] }) {
  const { formatPrice } = useCurrency();

  return (
    <ul
      aria-label="Produse din selecție"
      className="mt-5 flex gap-3 overflow-x-auto pb-1"
    >
      {products.map((product, index) => {
        const image = product.images?.[0];
        if (!image) return null;
        return (
          <li key={product.id} className="w-[7.25rem] shrink-0">
            <Link
              href={productPublicPath(product.slug)}
              className="block overflow-hidden rounded-2xl border border-[#173e31]/15 bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173e31]"
            >
              <span className="relative block aspect-square bg-[#f4f1ea]">
                <Image
                  src={image}
                  alt={product.name}
                  fill
                  priority={index === 0}
                  sizes="116px"
                  className="object-contain p-2"
                />
              </span>
              <span className="block px-2 py-2">
                <span className="line-clamp-2 min-h-8 text-[11px] font-semibold leading-4 text-[#152d26]">
                  {product.name}
                </span>
                <span className="mt-1 block text-xs font-bold text-[#173e31]">
                  {formatPrice(product.price)}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
