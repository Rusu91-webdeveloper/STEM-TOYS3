import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Package, Play, HelpCircle } from "lucide-react";

import { getProducts } from "@/lib/api/products";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  glassCardClass,
  glassPanelClass,
  gradientButtonClass,
  homeBackgroundClass,
  homeContentWrapperClass,
  homeOverlayBottomClass,
  homeOverlayTopClass,
} from "@/features/home/components/homeTheme";

export const metadata: Metadata = {
  title: "Constructii magnetice pentru copii | Inginerie si creativitate TechTots",
  description:
    "Descopera constructii magnetice pentru copii si seturi orientate spre inginerie, spatialitate si proiecte creative pentru joaca practica.",
  keywords: [
    "constructii magnetice copii",
    "jucarii magnetice",
    "jucarii inginerie copii",
    "seturi constructii copii",
    "constructii STEM copii",
  ],
  alternates: {
    canonical: "https://www.techtots.ro/categories/magnetic-building",
  },
  openGraph: {
    title: "Constructii magnetice pentru copii | TechTots",
    description:
      "Seturi de constructii magnetice si inginerie pentru copii care invata prin asamblare, spatialitate si proiecte creative.",
    url: "https://www.techtots.ro/categories/magnetic-building",
    type: "website",
  },
};

// FAQs for Magnetic Building category
const faqs = [
  {
    question: "Ce vârstă este recomandată pentru jucăriile magnetice?",
    answer:
      "Seturile noastre de construcții magnetice sunt potrivite pentru copii de la 3-4 ani până la 12 ani. Fiecare produs indică vârsta recomandată în descriere.",
  },
  {
    question: "Sunt piese magnetice sigure pentru copii mici?",
    answer:
      "Da, toate produsele noastre respectă standardele de siguranță CE și EN71. Piesele magnetice sunt de dimensiuni mari pentru a preveni riscul de înghițire.",
  },
  {
    question: "Ce beneficii educaționale oferă construcțiile magnetice?",
    answer:
      "Dezvoltă gândirea spațială, creativitatea, perseverența și înțelegerea principiilor de bază ale fizicii și ingineriei.",
  },
  {
    question: "Pot combina piese din seturi diferite?",
    answer:
      "Da, majoritatea seturilor noastre sunt compatibile între ele, permițând construcții și mai complexe și creative.",
  },
];

export default async function MagneticBuildingPage() {
  // Fetch products in Magnetic Building category
  const allProducts = await getProducts();
  const magneticProducts = allProducts.filter(
    product =>
      product.category?.slug === "magnetic-building" ||
      product.tags?.some(tag =>
        tag.toLowerCase().includes("magnetic") || tag.toLowerCase().includes("building")
      )
  );

  // Get bundles (products with isBundle = true)
  const bundles = magneticProducts.filter((p: any) => p.isBundle === true);

  // Get regular products (non-bundles)
  const regularProducts = magneticProducts.filter((p: any) => !p.isBundle);

  return (
    <div className={homeBackgroundClass}>
      <div className={homeOverlayTopClass} aria-hidden />
      <div className={homeOverlayBottomClass} aria-hidden />
      <div className={`${homeContentWrapperClass} pb-16`}>
        {/* Hero Section */}
        <section className="relative h-[200px] sm:h-[250px] md:h-[300px] lg:h-[360px] w-full overflow-hidden rounded-none sm:rounded-3xl border-b border-white/5 sm:border border-white/10 shadow-lg shadow-black/40">
          <Image
            src="/Engineering.png"
            alt="Magnetic Building"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/85 via-purple-950/75 to-slate-900/70" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.14),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(129,140,248,0.14),transparent_36%)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Constructii magnetice pentru copii
              </h1>
              <p className="text-slate-200 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
                Seturi de inginerie si constructii pentru spatialitate, creativitate si rezolvare de probleme
              </p>
            </div>
          </div>
        </section>

        {/* Featured Bundles Section */}
        {bundles.length > 0 && (
          <section className="container mx-auto px-4 sm:px-6 lg:px-10 pt-8 sm:pt-12">
            <div
              className={`${glassPanelClass} rounded-3xl border-white/15 bg-slate-900/60 px-5 py-6 shadow-xl shadow-black/30 sm:px-8 sm:py-8 lg:px-10 lg:py-10`}
            >
              <div className="flex items-center gap-3 mb-6">
                <Package className="h-6 w-6 text-emerald-300" />
                <h2 className="text-2xl font-bold text-white">
                  Bundle-uri Recomandate
                </h2>
              </div>
              <p className="text-slate-200/80 mb-6">
                Economisește când cumperi împreună! Bundle-urile noastre oferă reduceri
                speciale.
              </p>
              <Suspense fallback={<div>Loading bundles...</div>}>
                <ProductGrid
                  products={bundles.slice(0, 6)}
                  defaultLayout="grid"
                  showLayoutToggle={false}
                  showSortOptions={false}
                />
              </Suspense>
            </div>
          </section>
        )}

        {/* Buying guide section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-10 pt-8 sm:pt-12">
          <div
            className={`${glassPanelClass} rounded-3xl border-white/15 bg-slate-900/60 px-5 py-6 shadow-xl shadow-black/30 sm:px-8 sm:py-8 lg:px-10 lg:py-10`}
          >
            <div className="flex items-center gap-3 mb-6">
              <Play className="h-6 w-6 text-sky-300" />
              <h2 className="text-2xl font-bold text-white">
                Cum alegi setul de constructii potrivit
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <h3 className="text-lg font-semibold text-white">
                  Ce cauta parintii aici
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-200/80">
                  Constructii magnetice, jucarii de inginerie si produse care
                  dezvolta spatialitatea, rabdarea si proiectarea pas cu pas.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <h3 className="text-lg font-semibold text-white">
                  Cand continui spre alte huburi
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-200/80">
                  Daca vrei selectie STEM mai larga, foloseste
                  {" "}
                  <Link href="/jucarii-stem" className="text-indigo-300 underline underline-offset-4">
                    pagina principala STEM
                  </Link>
                  . Daca vrei logica si provocari, compara si cu
                  {" "}
                  <Link href="/jucarii-inteligente" className="text-indigo-300 underline underline-offset-4">
                    jucariile inteligente
                  </Link>
                  .
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <h3 className="text-lg font-semibold text-white">
                  Cum alegi mai repede
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-200/80">
                  Verifica varsta, numarul de piese, nivelul de dificultate si
                  daca produsul se potriveste mai bine pentru joaca libera sau
                  proiecte ghidate.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* All Products */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-10 pt-8 sm:pt-12">
          <div
            className={`${glassPanelClass} rounded-3xl border-white/15 bg-slate-900/60 px-5 py-6 shadow-xl shadow-black/30 sm:px-8 sm:py-8 lg:px-10 lg:py-10`}
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              Toate Produsele Magnetic Building
            </h2>
            <Suspense fallback={<div>Loading products...</div>}>
              <ProductGrid
                products={regularProducts}
                defaultLayout="grid"
                showLayoutToggle={true}
                showSortOptions={true}
              />
            </Suspense>
          </div>
        </section>

        {/* FAQs Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-10 pt-8 sm:pt-12">
          <div
            className={`${glassPanelClass} rounded-3xl border-white/15 bg-slate-900/60 px-5 py-6 shadow-xl shadow-black/30 sm:px-8 sm:py-8 lg:px-10 lg:py-10`}
          >
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="h-6 w-6 text-amber-300" />
              <h2 className="text-2xl font-bold text-white">
                Întrebări Frecvente
              </h2>
            </div>
            <Accordion type="single" collapsible className="w-full space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className={`${glassCardClass} rounded-2xl border-white/10 bg-slate-900/70 px-4 py-2`}
                >
                  <AccordionTrigger className="text-left font-semibold text-white hover:text-sky-300">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-200/80 pt-2">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </div>
    </div>
  );
}
