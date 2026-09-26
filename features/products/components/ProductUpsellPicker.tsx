"use client";

import { Check, Plus, ArrowUpRight, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { useShoppingCart } from "@/features/cart/hooks/useShoppingCart";
import { productPublicPath } from "@/lib/products/public-slug";

export interface ProductUpsell {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  stockQuantity: number;
}

const money = (price: number) =>
  new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    maximumFractionDigits: 2,
  }).format(price);

export default function ProductUpsellPicker({
  products,
}: {
  products: ProductUpsell[];
}) {
  const { items, addItem } = useShoppingCart();
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  if (!products.length) return null;
  const visible = expanded ? products : products.slice(0, 3);

  async function addProduct(product: ProductUpsell) {
    if (pending || items.some(item => item.productId === product.id)) return;
    setPending(product.id);
    setMessage("");
    try {
      const response = await fetch("/api/products/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ productId: product.id }] }),
      });
      if (!response.ok) throw new Error("stock");
      const stocks = await response.json();
      if (!(stocks[product.id] > 0)) {
        setMessage(
          "Acest accesoriu nu mai este disponibil. Alege un alt produs."
        );
        return;
      }
      addItem(
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0],
          slug: product.slug,
          stockQuantity: stocks[product.id],
          quantity: 1,
        },
        1
      );
      setMessage(`${product.name} a fost adăugat în coș.`);
    } catch {
      setMessage("Nu am putut verifica disponibilitatea. Încearcă din nou.");
    } finally {
      setPending(null);
    }
  }

  return (
    <section
      aria-label="Completează experiența"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-4 sm:px-5">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600">
          Mai multe posibilități de joacă
        </p>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          Completează experiența
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Produse compatibile, alese pentru acest set. Adaugă doar ce îți place.
        </p>
      </div>
      <ul className="divide-y divide-slate-100 px-4 sm:px-5">
        {visible.map(product => {
          const inCart = items.some(item => item.productId === product.id);
          const busy = pending === product.id;
          return (
            <li key={product.id} className="flex items-center gap-3 py-4">
              <Link
                href={productPublicPath(product.slug)}
                tabIndex={-1}
                aria-hidden="true"
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-white"
              >
                <Image
                  src={product.images[0]}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-contain p-1.5"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={productPublicPath(product.slug)}
                  className="group inline-flex gap-1 text-xs font-medium leading-5 text-slate-800 hover:text-indigo-700 focus-visible:outline-indigo-600"
                >
                  <span className="line-clamp-2">{product.name}</span>
                  <ArrowUpRight
                    aria-hidden
                    className="mt-1 h-3 w-3 shrink-0 text-slate-400"
                  />
                </Link>
                <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
                  {money(product.price)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => addProduct(product)}
                disabled={inCart || pending !== null}
                aria-label={
                  inCart
                    ? `${product.name} este în coș`
                    : `Adaugă ${product.name} în coș`
                }
                className={`flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-default ${inCart ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-800 hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-60"}`}
              >
                {busy ? (
                  <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                ) : inCart ? (
                  <Check aria-hidden className="h-4 w-4" />
                ) : (
                  <Plus aria-hidden className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {inCart ? "În coș" : "Adaugă"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {products.length > 3 && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
          className="w-full border-t border-slate-100 py-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-indigo-600"
        >
          {expanded
            ? "Arată mai puține"
            : `Vezi toate cele ${products.length} opțiuni`}
        </button>
      )}
      <p
        role="status"
        className={
          message
            ? "border-t border-slate-100 px-4 py-3 text-xs text-slate-600"
            : "sr-only"
        }
      >
        {message}
      </p>
    </section>
  );
}
