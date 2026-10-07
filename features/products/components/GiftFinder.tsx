"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import {
  GIFT_INTERESTS,
  selectGifts,
  type GiftInterest,
  type GiftProduct,
} from "@/lib/products/gift-finder";
import { productPublicPath } from "@/lib/products/public-slug";

const selectClass =
  "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900";
const money = (price: number) =>
  new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON" }).format(
    price
  );

export function GiftFinder({ products }: { products: GiftProduct[] }) {
  const [age, setAge] = useState(6);
  const [interest, setInterest] = useState<GiftInterest>("any");
  const [budget, setBudget] = useState(200);
  const [selection, setSelection] = useState<{
    age: number;
    interest: GiftInterest;
    budget: number;
  } | null>(null);
  const results = selection ? selectGifts(products, selection) : [];
  return (
    <div className="space-y-8">
      <form
        onSubmit={event => {
          event.preventDefault();
          setSelection({ age, interest, budget });
        }}
        className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"
      >
        <div className="grid gap-5 md:grid-cols-3">
          <label
            className="text-sm font-semibold text-slate-800"
            htmlFor="gift-age"
          >
            Vârsta copilului
            <select
              id="gift-age"
              value={age}
              onChange={event => setAge(Number(event.target.value))}
              className={selectClass}
            >
              {Array.from({ length: 16 }, (_, index) => index + 3).map(
                value => (
                  <option key={value} value={value}>
                    {value} ani
                  </option>
                )
              )}
            </select>
          </label>
          <label
            className="text-sm font-semibold text-slate-800"
            htmlFor="gift-interest"
          >
            Ce îi place?
            <select
              id="gift-interest"
              value={interest}
              onChange={event =>
                setInterest(event.target.value as GiftInterest)
              }
              className={selectClass}
            >
              {GIFT_INTERESTS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label
            className="text-sm font-semibold text-slate-800"
            htmlFor="gift-budget"
          >
            Buget pentru produs
            <select
              id="gift-budget"
              value={budget}
              onChange={event => setBudget(Number(event.target.value))}
              className={selectClass}
            >
              {[100, 150, 200, 300, 500, 1000].map(value => (
                <option key={value} value={value}>
                  Până la {value} lei
                </option>
              ))}
            </select>
          </label>
        </div>
        <p id="gift-guidance" className="mt-5 text-sm leading-6 text-slate-600">
          Folosim vârsta recomandată, interesul și prețul actual. Bugetul nu
          include livrarea. Verifică ajutorul necesar și instrucțiunile fiecărui
          set.
        </p>
        <button
          type="submit"
          aria-describedby="gift-guidance"
          className="mt-5 min-h-12 w-full rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white hover:bg-slate-800 sm:w-auto"
        >
          Găsește un cadou
        </button>
      </form>
      <section
        aria-live="polite"
        aria-atomic="false"
        aria-labelledby="gift-results-title"
      >
        <h2
          id="gift-results-title"
          className="text-xl font-bold text-slate-950"
        >
          {selection
            ? `${results.length} idei pentru alegerea ta`
            : "Un cadou pe care îl înțelegi înainte să-l alegi"}
        </h2>
        {!selection && (
          <p className="mt-3 leading-7 text-slate-600">
            Spune-ne vârsta, interesul și bugetul. Îți arătăm până la trei
            seturi disponibile, cu o explicație clară a activității și a
            pregătirii.
          </p>
        )}
        {selection && results.length === 0 && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
            <p className="leading-7 text-slate-700">
              Nu avem acum un set disponibil care să respecte toate alegerile.
              Încearcă alt interes sau un buget mai mare; vârsta minimă rămâne
              aceeași.
            </p>
            <Link
              href="/products"
              className="mt-3 inline-flex min-h-11 items-center font-semibold text-sky-800 underline"
            >
              Explorează colecția
            </Link>
          </div>
        )}
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {results.map(product => (
            <article
              key={product.id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5"
            >
              <Link
                href={productPublicPath(product.slug)}
                className="relative mb-4 block aspect-square rounded-xl bg-white"
              >
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 767px) 85vw, 30vw"
                  className="object-contain p-3"
                />
              </Link>
              <p className="text-sm font-semibold text-sky-800">
                Vârsta recomandată: {product.age}
              </p>
              <h3 className="mt-2 text-lg font-bold text-slate-950">
                {product.name}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                {product.summary}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                <strong>De pregătit:</strong> {product.preparation}
              </p>
              <p className="mt-4 text-lg font-bold text-slate-950">
                {money(product.price)}
              </p>
              <Link
                href={productPublicPath(product.slug)}
                className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white"
              >
                Vezi produsul
              </Link>
            </article>
          ))}
        </div>
      </section>
      <noscript>
        <p>
          Alegerea interactivă necesită JavaScript.{" "}
          <Link href="/products">Explorează catalogul</Link> sau{" "}
          <Link href="/contact">cere ajutor pentru alegerea unui cadou</Link>.
        </p>
      </noscript>
    </div>
  );
}
