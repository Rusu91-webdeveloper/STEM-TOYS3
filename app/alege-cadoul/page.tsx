import type { Metadata } from "next";
import Link from "next/link";

import { GiftFinder } from "@/features/products/components/GiftFinder";
import { toGiftProduct, type GiftProduct } from "@/lib/products/gift-finder";
import { getStorefrontCatalog } from "@/lib/products/storefront-catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Alege un cadou STEM după vârstă, interes și buget | TechTots",
  description:
    "Găsește până la trei idei de cadouri STEM disponibile, potrivite vârstei copilului și bugetului tău. Vezi activitatea, conținutul și pregătirea necesară.",
  alternates: { canonical: "https://www.techtots.ro/alege-cadoul" },
};

export default async function GiftFinderPage() {
  let products: GiftProduct[] = [];
  let unavailable = false;
  try {
    products = (await getStorefrontCatalog())
      .map(toGiftProduct)
      .filter((product): product is GiftProduct => product !== null);
  } catch (error) {
    console.error("Gift catalog unavailable", error);
    unavailable = true;
  }
  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <p className="text-xs font-bold uppercase tracking-widest text-sky-800">
        Cadouri pentru minți curioase
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        Alege următoarea descoperire
      </h1>
      <p className="mb-8 mt-4 max-w-2xl text-base leading-7 text-slate-600">
        Trei alegeri simple: vârsta, ce îi place și cât vrei să cheltuiești.
        Fiecare recomandare pornește de la un produs real din colecție.
      </p>
      {unavailable ? (
        <div
          role="status"
          className="rounded-2xl border border-slate-200 bg-white p-6"
        >
          <p>
            Nu putem încărca selecția acum. Încearcă din nou sau cere-ne ajutor
            pentru alegere.
          </p>
          <Link
            href="/contact"
            className="mt-3 inline-flex min-h-11 items-center font-semibold text-sky-800 underline"
          >
            Contactează TechTots
          </Link>
        </div>
      ) : (
        <GiftFinder products={products} />
      )}
    </div>
  );
}
