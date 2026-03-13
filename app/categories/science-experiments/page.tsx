import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Package, Play, HelpCircle, Beaker, Atom } from "lucide-react";

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
  homeBackgroundClass,
  homeContentWrapperClass,
  homeOverlayBottomClass,
  homeOverlayTopClass,
} from "@/features/home/components/homeTheme";

export const metadata: Metadata = {
  title: "Experimente stiintifice pentru copii | Kituri de stiinta TechTots",
  description:
    "Exploreaza kituri si experimente stiintifice pentru copii: seturi de chimie, fizica si observatie practica pentru joaca orientata spre stiinta.",
  keywords: [
    "experimente stiintifice copii",
    "kituri stiinta copii",
    "jucarii stiinta copii",
    "experimente copii acasa",
    "kituri experimente copii",
  ],
  alternates: {
    canonical: "https://www.techtots.ro/categories/science-experiments",
  },
  openGraph: {
    title: "Experimente stiintifice pentru copii | TechTots",
    description:
      "KIturi de stiinta si experimente pentru copii care invata prin observatie, testare si joaca practica.",
    url: "https://www.techtots.ro/categories/science-experiments",
    type: "website",
  },
};

const faqs = [
  {
    question: "Sunt experimentele sigure pentru copii?",
    answer:
      "Da, toate kit-urile noastre respectă standardele de siguranță și includ instrucțiuni clare. Recomandăm supervizarea unui adult pentru experimentele cu substanțe chimice.",
  },
  {
    question: "Ce tipuri de experimente sunt incluse?",
    answer:
      "Oferim kit-uri de chimie (reacții, cristalizare), fizică (electricitate, magnetism), și biologie (microscopie, disecție virtuală).",
  },
  {
    question: "Ce vârstă este recomandată?",
    answer:
      "Kit-urile noastre sunt potrivite pentru copii de la 6-8 ani (experimente simple) până la 12+ ani (experimente avansate). Fiecare produs indică vârsta recomandată.",
  },
  {
    question: "Ce materiale sunt incluse în kit-uri?",
    answer:
      "Fiecare kit include toate materialele necesare, instrucțiuni pas cu pas, și uneori și ghiduri video. Verifică descrierea fiecărui produs pentru lista completă.",
  },
];

export default async function ScienceExperimentsPage() {
  const allProducts = await getProducts();
  const scienceProducts = allProducts.filter(
    product =>
      product.category?.slug === "science-experiments" ||
      product.tags?.some(tag =>
        tag.toLowerCase().includes("science") ||
        tag.toLowerCase().includes("experiment") ||
        tag.toLowerCase().includes("lab")
      ) ||
      product.stemDiscipline === "SCIENCE"
  );

  const bundles = scienceProducts.filter((p: any) => p.isBundle === true);
  const regularProducts = scienceProducts.filter((p: any) => !p.isBundle);

  return (
    <div className={homeBackgroundClass}>
      <div className={homeOverlayTopClass} aria-hidden />
      <div className={homeOverlayBottomClass} aria-hidden />
      <div className={`${homeContentWrapperClass} pb-16`}>
        {/* Hero */}
        <section className="relative h-[200px] sm:h-[250px] md:h-[300px] lg:h-[360px] w-full overflow-hidden rounded-none sm:rounded-3xl border-b border-white/5 sm:border border-white/10 shadow-lg shadow-black/40">
          <Image
            src="/Science.png"
            alt="Science & Experiments"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/85 via-teal-950/75 to-slate-900/70" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.12),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.10),transparent_35%)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Beaker className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-300" />
                <Atom className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-300" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Experimente stiintifice pentru copii
              </h1>
              <p className="text-slate-200 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
                Kituri de stiinta pentru copii curiosi care invata prin testare si observatie
              </p>
            </div>
          </div>
        </section>

        {/* Featured Bundles */}
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

        {/* Buying guide */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-10 pt-8 sm:pt-12">
          <div
            className={`${glassPanelClass} rounded-3xl border-white/15 bg-slate-900/60 px-5 py-6 shadow-xl shadow-black/30 sm:px-8 sm:py-8 lg:px-10 lg:py-10`}
          >
            <div className="flex items-center gap-3 mb-6">
              <Play className="h-6 w-6 text-sky-300" />
              <h2 className="text-2xl font-bold text-white">
                Cum alegi un kit de stiinta potrivit
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <h3 className="text-lg font-semibold text-white">
                  Cand alegi experimentele
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-200/80">
                  Atunci cand copilul raspunde bine la observatie, testare,
                  rezultate vizibile si curiozitate despre cum functioneaza lumea.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <h3 className="text-lg font-semibold text-white">
                  Cum continui selectia
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-200/80">
                  Daca vrei comparatie mai larga, mergi in
                  {" "}
                  <Link href="/jucarii-stem" className="text-emerald-300 underline underline-offset-4">
                    hubul STEM
                  </Link>
                  {" "}sau in
                  {" "}
                  <Link href="/jucarii-stem-dupa-varsta" className="text-emerald-300 underline underline-offset-4">
                    selectia dupa varsta
                  </Link>
                  .
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <h3 className="text-lg font-semibold text-white">
                  Ce cautari acopera
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-200/80">
                  experimente stiintifice copii, kituri stiinta copii si jucarii
                  de stiinta pentru acasa sau cadou.
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
              Toate Produsele Science & Experiments
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

        {/* FAQs */}
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
