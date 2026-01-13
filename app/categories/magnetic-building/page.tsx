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
  title: "Magnetic Building | Jucării STEM pentru Construcții Creative",
  description:
    "Descoperă seturile noastre de construcții magnetice - perfecte pentru dezvoltarea gândirii inginerești și creativității. Bundle-uri cu reduceri speciale!",
  keywords: [
    "jucării magnetice",
    "construcții magnetice",
    "STEM engineering",
    "jucării educaționale",
    "bundle-uri magnetic building",
  ],
  alternates: {
    canonical: "https://www.techtots.ro/categories/magnetic-building",
  },
  openGraph: {
    title: "Magnetic Building | TechTots",
    description:
      "Seturi de construcții magnetice pentru copii - dezvoltă creativitatea și gândirea inginerească",
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
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/90 via-purple-950/80 to-slate-900/70" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Magnetic Building
              </h1>
              <p className="text-slate-200 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
                Construcții magnetice creative pentru dezvoltarea gândirii inginerești
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

        {/* Demo Video Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-10 pt-8 sm:pt-12">
          <div
            className={`${glassPanelClass} rounded-3xl border-white/15 bg-slate-900/60 px-5 py-6 shadow-xl shadow-black/30 sm:px-8 sm:py-8 lg:px-10 lg:py-10`}
          >
            <div className="flex items-center gap-3 mb-6">
              <Play className="h-6 w-6 text-sky-300" />
              <h2 className="text-2xl font-bold text-white">
                Demo Video - Cum Funcționează
              </h2>
            </div>
            <div className="aspect-video rounded-2xl overflow-hidden bg-slate-800/50 border border-white/10">
              {/* Video embed slot - replace with actual YouTube/Vimeo embed */}
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-slate-400 text-sm">
                  [Video embed slot - adaugă codul de embed YouTube/Vimeo aici]
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
