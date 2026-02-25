import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Package, Play, HelpCircle, Code, Bot } from "lucide-react";

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
  title: "Coding & Robotics | Jucării STEM pentru Programare",
  description:
    "Explorează lumea programării și roboticii cu seturile noastre educaționale. Bundle-uri speciale pentru începători și avansați!",
  keywords: [
    "jucării robotică",
    "programare copii",
    "coding toys",
    "STEM technology",
    "bundle-uri coding",
  ],
  alternates: {
    canonical: "https://www.techtots.ro/categories/coding-robotics",
  },
  openGraph: {
    title: "Coding & Robotics | TechTots",
    description:
      "Seturi de programare și robotică pentru copii - dezvoltă gândirea computațională",
    url: "https://www.techtots.ro/categories/coding-robotics",
    type: "website",
  },
};

const faqs = [
  {
    question: "De la ce vârstă pot copiii să înceapă programarea?",
    answer:
      "Seturile noastre de coding sunt potrivite pentru copii de la 5-6 ani, cu jocuri vizuale și blocuri de cod, până la 14+ ani cu programare text-based.",
  },
  {
    question: "Ce limbaje de programare învață copiii?",
    answer:
      "Majoritatea seturilor folosesc blocuri vizuale (Scratch-like) sau Python. Unele seturi suportă și JavaScript pentru copiii mai avansați.",
  },
  {
    question: "Sunt necesare cunoștințe tehnice pentru părinți?",
    answer:
      "Nu, toate seturile vin cu ghiduri pas cu pas și aplicații mobile intuitive. Părinții pot învăța alături de copii!",
  },
  {
    question: "Pot fi folosite în școală?",
    answer:
      "Da, multe seturi sunt perfecte pentru activități în clasă sau cluburi STEM. Oferim și resurse pentru educatori.",
  },
];

export default async function CodingRoboticsPage() {
  const allProducts = await getProducts();
  const codingProducts = allProducts.filter(
    product =>
      product.category?.slug === "coding-robotics" ||
      product.tags?.some(tag =>
        tag.toLowerCase().includes("coding") ||
        tag.toLowerCase().includes("robotics") ||
        tag.toLowerCase().includes("programming")
      ) ||
      product.stemDiscipline === "TECHNOLOGY"
  );

  const bundles = codingProducts.filter((p: any) => p.isBundle === true);
  const regularProducts = codingProducts.filter((p: any) => !p.isBundle);

  return (
    <div className={homeBackgroundClass}>
      <div className={homeOverlayTopClass} aria-hidden />
      <div className={homeOverlayBottomClass} aria-hidden />
      <div className={`${homeContentWrapperClass} pb-16`}>
        {/* Hero */}
        <section className="relative h-[200px] sm:h-[250px] md:h-[300px] lg:h-[360px] w-full overflow-hidden rounded-none sm:rounded-3xl border-b border-white/5 sm:border border-white/10 shadow-lg shadow-black/40">
          <Image
            src="/coding-robotic.png"
            alt="Coding & Robotics"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/85 via-cyan-950/75 to-slate-900/70" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,255,255,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(34,211,238,0.12),transparent_34%)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Code className="h-8 w-8 sm:h-10 sm:w-10 text-cyan-300" />
                <Bot className="h-8 w-8 sm:h-10 sm:w-10 text-cyan-300" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Coding & Robotics
              </h1>
              <p className="text-slate-200 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
                Programare și robotică pentru viitorul digital
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

        {/* Demo Video */}
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
              Toate Produsele Coding & Robotics
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
