import type { LucideIcon } from "lucide-react";
import {
  Cpu,
  Code,
  Bot,
  Zap,
  Brain,
  Lightbulb,
  Rocket,
  Globe,
  Smartphone as _Smartphone,
  Laptop as _Laptop,
  Wifi as _Wifi,
  Database as _Database,
  Cloud as _Cloud,
  CircuitBoard,
  Microchip as _Microchip,
  Gamepad2 as _Gamepad2,
  BookOpen,
  Clock,
  ArrowRight,
  Play,
  Target,
  TrendingUp,
  Shield as _Shield,
  Sparkles,
  CheckCircle,
  ArrowUpRight,
  Users,
  BookMarked,
  Eye,
  Heart,
  Calendar,
  MapPin as _MapPin,
  Building2,
  GraduationCap,
  Puzzle,
  Beaker,
  Calculator,
  Atom,
  Microscope,
  Dna,
  Wrench,
  Cog,
  Hammer,
  Ruler,
} from "lucide-react";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import SeoJsonLd from "@/components/seo/SeoJsonLd";
import {
  glassCardClass,
  glassPanelClass,
  gradientButtonClass,
  homeBackgroundClass,
  homeContentWrapperClass,
  homeOverlayBottomClass,
  homeOverlayTopClass,
} from "@/features/home/components/homeTheme";
import { getTranslation } from "@/lib/i18n/server";
import { blogService } from "@/lib/services/blog-service";
import { getCategoryName } from "@/lib/services/categories-service";
import { isRemovedCategoryPageSlug } from "@/lib/utils/category-page-links";

// Enable ISR with 10 minutes revalidation
export const revalidate = 600;
export const dynamicParams = false;

const KNOWN_SLUGS = [
  "science",
  "technology",
  "engineering",
  "math",
  "educational-books",
] as const;
type KnownSlug = (typeof KNOWN_SLUGS)[number];

function isKnownSlug(slug: string): slug is KnownSlug {
  return KNOWN_SLUGS.includes(slug as KnownSlug);
}

function slugToStemCategory(
  slug: string
): "SCIENCE" | "TECHNOLOGY" | "ENGINEERING" | "MATHEMATICS" | undefined {
  const map: Record<
    string,
    "SCIENCE" | "TECHNOLOGY" | "ENGINEERING" | "MATHEMATICS"
  > = {
    science: "SCIENCE",
    technology: "TECHNOLOGY",
    engineering: "ENGINEERING",
    math: "MATHEMATICS",
  };
  return map[slug];
}

export function generateStaticParams() {
  return KNOWN_SLUGS.map(slug => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: slugParam } = await params;
  const slug = slugParam.toLowerCase();
  if (isRemovedCategoryPageSlug(slug) || !isKnownSlug(slug)) {
    notFound();
  }
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value ?? "ro";
  const title = `${getCategoryName(slug, locale)} | STEM Categories`;
  const description = `Explorați categoria ${getCategoryName(slug, locale)}: beneficii educaționale, recomandări și articole relevante despre jucării STEM.`;
  return {
    title,
    description,
    alternates: { canonical: `/categories/${slug}` },
    openGraph: { title, description },
  };
}

/*
const getTechnologyIcons = () => ({
  hero: [Cpu, Code, Bot, Zap, Brain, Lightbulb],
  benefits: [Microchip, CircuitBoard, Database, Cloud, Wifi, Smartphone],
  skills: [Target, TrendingUp, Shield, Sparkles, CheckCircle, Rocket],
  testimonials: [User, Quote, Star, Award, Heart, MessageCircle],
  blogs: [BookOpen, Clock, Eye, ArrowUpRight, Calendar, BookMarked],
});
*/

// Category-specific icons mapping
const getCategoryIcons = (slug: string) => {
  const icons = {
    science: [Beaker, Atom, Microscope, Dna, Rocket, Globe],
    technology: [Cpu, Code, Bot, Zap, Brain, Lightbulb],
    engineering: [Building2, CircuitBoard, Wrench, Cog, Hammer, Ruler],
    math: [Calculator, Puzzle, Target, TrendingUp, Brain, Zap],
    "educational-books": [
      BookOpen,
      BookMarked,
      GraduationCap,
      Users,
      Eye,
      Heart,
    ],
  };
  return icons[slug as keyof typeof icons] || icons.technology;
};

async function RelatedBlogs({ slug }: { slug: string }) {
  const stemCategory = slugToStemCategory(slug);

  // Get category ID by slug for additional filtering
  const categories = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/categories`
  ).then(res => res.json());
  const category = categories.find(
    (cat: { slug: string; id: string }) => cat.slug === slug
  );
  const categoryId = category?.id;

  // Try to get blogs by stemCategory first, then by categoryId if no results
  let { blogs } = await blogService.getAllBlogs({ stemCategory, take: 6 });

  // If no blogs found by stemCategory and we have a categoryId, try filtering by categoryId
  if ((!blogs || blogs.length === 0) && categoryId) {
    const result = await blogService.getAllBlogs({ categoryId, take: 6 });
    blogs = result.blogs;
  }

  // const categoryIcons = getCategoryIcons(slug);
  const blogIcons = [BookOpen, Clock, Eye, ArrowUpRight, Calendar, BookMarked];

  if (!blogs || blogs.length === 0) {
    return (
      <section className="container mx-auto w-full px-4 pt-8 sm:px-6 sm:pt-12 lg:px-10 lg:pt-14">
        <div
          className={`${glassPanelClass} mx-auto max-w-5xl rounded-3xl border-slate-200/70 bg-white/85 px-5 py-6 shadow-xl shadow-slate-900/10 sm:px-8 sm:py-8 lg:px-10 lg:py-10`}
        >
          <div className="mb-6 flex items-center gap-2 text-sky-700 sm:gap-3">
            <BookOpen className="h-5 w-5 text-sky-300 sm:h-6 sm:w-6" />
            <h3 className="text-lg font-semibold text-slate-900 sm:text-xl md:text-2xl">
              Articole recomandate
            </h3>
          </div>
          <div
            className={`${glassCardClass} flex flex-col items-center justify-center gap-4 rounded-2xl border-slate-200/70 bg-white/95 px-6 py-10 text-center shadow-inner shadow-slate-900/5 sm:px-8 sm:py-12`}
          >
            <BookOpen className="h-12 w-12 text-sky-300/70 sm:h-14 sm:w-14" />
            <p className="text-sm text-slate-600 sm:text-base">
              Nu există încă articole pentru această categorie.
            </p>
            <Link
              href="/blog"
              className={`${gradientButtonClass} inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all duration-300 hover:scale-105`}
            >
              <ArrowRight className="h-4 w-4" />
              Vezi toate articolele
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto w-full px-4 pt-8 sm:px-6 sm:pt-12 lg:px-10 lg:pt-14">
      <div
        className={`${glassPanelClass} rounded-3xl border-slate-200/70 bg-white/85 px-5 py-6 shadow-xl shadow-slate-900/10 sm:px-8 sm:py-8 lg:px-10 lg:py-10`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sky-700 sm:gap-3">
            <BookOpen className="h-5 w-5 text-sky-300 sm:h-6 sm:w-6" />
            <h3 className="text-lg font-semibold text-slate-900 sm:text-xl md:text-2xl">
              Articole recomandate pentru {getCategoryName(slug, "ro")}
            </h3>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-700 transition-colors hover:text-indigo-900 sm:text-sm"
          >
            Vezi toate articolele
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {blogs.map((blog, index) => {
            const IconComponent = blogIcons[index % blogIcons.length];
            return (
              <Link
                key={blog.id}
                href={`/blog/${blog.slug}`}
                className={`${glassCardClass} group flex h-full flex-col overflow-hidden rounded-2xl border-slate-200/70 bg-white/95 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300/80 hover:shadow-xl`}
              >
                {blog.coverImage ? (
                  <div className="relative h-40 w-full overflow-hidden">
                    <Image
                      src={blog.coverImage}
                      alt={blog.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/30 to-transparent" />
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center bg-gradient-to-br from-sky-400/10 via-indigo-400/10 to-emerald-400/10">
                    <IconComponent className="h-12 w-12 text-sky-300/70" />
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-3 px-5 py-6">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-indigo-600/80">
                    <Calendar className="h-3 w-3" />
                    <span>{blog.author?.name ?? "TechTots Team"}</span>
                    {blog.readingTime && (
                      <>
                        <span className="text-indigo-400/60">•</span>
                        <Clock className="h-3 w-3" />
                        <span>{blog.readingTime} min citire</span>
                      </>
                    )}
                  </div>
                  <h4 className="text-base font-semibold leading-snug text-slate-900 transition-colors group-hover:text-sky-700">
                    {blog.title}
                  </h4>
                  <p className="text-sm text-slate-600 line-clamp-3">
                    {blog.excerpt}
                  </p>
                  <div className="mt-auto inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-700">
                    <span>Citește mai mult</span>
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}


function Overview({ slug, locale }: { slug: string; locale: string }) {
  const _t = getTranslation(locale);
  const title = getCategoryName(slug, locale);
  const copy: Record<string, string> = {
    science:
      "Explorați știința prin experimente practice care transformă curiozitatea în înțelegere. Jucăriile de știință dezvoltă gândirea critică, abilitățile de observare și metodologia cercetării.",
    technology:
      "Tehnologia deschide drumul către programare, robotică și gândirea computațională. Seturile tech încurajează creativitatea și rezolvarea problemelor din lumea reală.",
    engineering:
      "Ingineria înseamnă construcție, testare și îmbunătățire. Copiii învață despre mecanică, structuri și proiectare iterativă prin joc.",
    math: "Matematica devine accesibilă și distractivă cu puzzle-uri, jocuri și provocări logice care antrenează mintea.",
    "educational-books":
      "Cărțile educaționale aduc conceptele STEM la viață, oferind contexte, povești și activități care extind învățarea.",
  };

  const benefitsBySlug: Record<
    string,
    Array<{ text: string; icon: LucideIcon }>
  > = {
    science: [
      {
        text: "Dezvoltă curiozitatea și spiritul de cercetare",
        icon: Beaker,
      },
      {
        text: "Învață principiile științei prin experimente practice",
        icon: Atom,
      },
      {
        text: "Stimulează gândirea critică și analitică",
        icon: Brain,
      },
      {
        text: "Introduce concepte de fizică, chimie și biologie",
        icon: Microscope,
      },
    ],
    technology: [
      {
        text: "Dezvoltă gândirea computațională și algoritmică",
        icon: Cpu,
      },
      { text: "Introduce programarea și robotică", icon: Code },
      {
        text: "Pregătește pentru carierele viitorului",
        icon: Rocket,
      },
      {
        text: "Învață despre inteligența artificială și inovație",
        icon: Brain,
      },
    ],
    engineering: [
      {
        text: "Învață principiile mecanicii și structurilor",
        icon: Building2,
      },
      {
        text: "Dezvoltă abilități de rezolvare a problemelor",
        icon: Target,
      },
      {
        text: "Stimulează creativitatea inginerească",
        icon: Sparkles,
      },
      {
        text: "Învață procesul de proiectare și testare",
        icon: CheckCircle,
      },
    ],
    math: [
      {
        text: "Face matematica distractivă și accesibilă",
        icon: Calculator,
      },
      {
        text: "Dezvoltă gândirea logică și raționamentul",
        icon: Brain,
      },
      {
        text: "Învață concepte matematice prin joc",
        icon: Puzzle,
      },
      {
        text: "Construiește încrederea în rezolvarea problemelor",
        icon: Target,
      },
    ],
    "educational-books": [
      {
        text: "Inspiră dragostea pentru învățare",
        icon: BookOpen,
      },
      {
        text: "Dezvoltă vocabularul și abilitățile de citire",
        icon: GraduationCap,
      },
      {
        text: "Introduce concepte STEM prin povești",
        icon: Users,
      },
      {
        text: "Stimulează imaginația și creativitatea",
        icon: Sparkles,
      },
    ],
  };

  const benefits = benefitsBySlug[slug] || benefitsBySlug["science"];
  const overviewCards = [
    {
      icon: Target,
      title: "Beneficii",
      copy: "Curiozitate, gândire critică, creativitate",
    },
    {
      icon: Play,
      title: "Activități",
      copy: "Proiecte practice, jocuri logice, explorare ghidată",
    },
    {
      icon: Users,
      title: "Recomandat pentru",
      copy: "Părinți, educatori, cluburi STEM",
    },
    {
      icon: BookOpen,
      title: "Resurse",
      copy: "Ghiduri, seturi tematice, cărți complementare",
    },
  ];

  return (
    <section className="container mx-auto w-full px-4 pt-6 sm:px-6 sm:pt-10 lg:px-10 lg:pt-12">
      <div
        className={`${glassPanelClass} rounded-3xl border-slate-200/70 bg-white/85 px-5 py-6 shadow-xl shadow-slate-900/10 sm:px-8 sm:py-8 lg:px-10 lg:py-10`}
      >
        <div className="mb-4 flex items-center gap-2 sm:gap-3 md:mb-6">
          <Target className="h-5 w-5 text-sky-300 sm:h-6 sm:w-6" />
          <h2 className="text-lg font-bold text-slate-900 sm:text-2xl md:text-3xl">
            {title}
          </h2>
        </div>
        <p className="max-w-3xl text-xs leading-relaxed text-slate-700 sm:text-sm md:text-base lg:text-lg">
          {copy[slug] ??
            "Descoperiți resurse care stârnesc pasiunea pentru învățare în rândul copiilor."}
        </p>

        <div className="mt-5 space-y-4 sm:mt-6 sm:space-y-6 md:mt-8">
          <div className="rounded-2xl border border-slate-200/70 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 sm:py-6 md:px-7 md:py-7">
            <div className="mb-4 flex items-center gap-2 sm:gap-3 md:mb-6">
              <Sparkles className="h-4 w-4 text-violet-300 sm:h-5 sm:w-5" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-700 sm:text-base">
                Beneficii educaționale
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-6">
              {benefits.map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <div
                    key={index}
                    className={`${glassCardClass} flex items-start gap-3 rounded-2xl border-slate-200/70 bg-white px-4 py-4 transition-all duration-300 hover:border-slate-300/80 hover:shadow-lg sm:gap-4 sm:px-5 sm:py-5`}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 sm:h-11 sm:w-11">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs leading-relaxed text-slate-700 sm:text-sm">
                        {benefit.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
            {overviewCards.map(
              ({ icon: IconComponent, title: cardTitle, copy: cardCopy }) => (
                <div
                  key={cardTitle}
                  className={`${glassCardClass} group rounded-2xl border-slate-200/70 bg-white/95 px-4 py-4 transition-all duration-300 hover:border-slate-300/80 hover:shadow-lg sm:px-5 sm:py-5`}
                >
                  <div className="mb-2 flex items-center gap-2 text-indigo-700 sm:mb-3">
                    <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
                    <h4 className="text-sm font-semibold text-slate-900 sm:text-base">
                      {cardTitle}
                    </h4>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                    {cardCopy}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryEducationalBenefits({ slug }: { slug: string }) {
  const benefitsBySlug: Record<
    string,
    Array<{ text: string; icon: LucideIcon; description: string }>
  > = {
    science: [
      {
        text: "Dezvoltă curiozitatea și spiritul de cercetare",
        icon: Beaker,
        description:
          "Copiii învață să pună întrebări și să exploreze lumea din jurul lor",
      },
      {
        text: "Învață principiile științei prin experimente practice",
        icon: Atom,
        description: "Experimentele hands-on fac conceptele abstracte concrete",
      },
      {
        text: "Stimulează gândirea critică și analitică",
        icon: Brain,
        description:
          "Dezvoltă abilități de analiză și evaluare a informațiilor",
      },
      {
        text: "Introduce concepte de fizică, chimie și biologie",
        icon: Microscope,
        description:
          "Oferă o introducere la disciplinele științifice fundamentale",
      },
    ],
    technology: [
      {
        text: "Dezvoltă gândirea computațională și algoritmică",
        icon: Cpu,
        description: "Învață să rezolve probleme pas cu pas, ca un programator",
      },
      {
        text: "Introduce programarea și robotică",
        icon: Code,
        description: "Dezvoltă abilități de programare prin jocuri interactive",
      },
      {
        text: "Pregătește pentru carierele viitorului",
        icon: Rocket,
        description: "Oferă competențe esențiale pentru economia digitală",
      },
      {
        text: "Învață despre inteligența artificială și inovație",
        icon: Brain,
        description: "Introduce concepte moderne de tehnologie și inovație",
      },
    ],
    engineering: [
      {
        text: "Învață principiile mecanicii și structurilor",
        icon: Building2,
        description: "Dezvoltă înțelegerea principiilor fizice de bază",
      },
      {
        text: "Dezvoltă abilități de rezolvare a problemelor",
        icon: Target,
        description: "Învață să identifice și să rezolve probleme complexe",
      },
      {
        text: "Stimulează creativitatea inginerească",
        icon: Sparkles,
        description: "Dezvoltă imaginația și inovația în proiectare",
      },
      {
        text: "Învață procesul de proiectare și testare",
        icon: CheckCircle,
        description: "Înțelege ciclul de dezvoltare și îmbunătățire",
      },
    ],
    math: [
      {
        text: "Face matematica distractivă și accesibilă",
        icon: Calculator,
        description: "Transformă conceptele matematice în jocuri captivante",
      },
      {
        text: "Dezvoltă gândirea logică și raționamentul",
        icon: Brain,
        description: "Învață să gândească logic și să facă conexiuni",
      },
      {
        text: "Învață concepte matematice prin joc",
        icon: Puzzle,
        description: "Dezvoltă înțelegerea matematică prin activități practice",
      },
      {
        text: "Construiește încrederea în rezolvarea problemelor",
        icon: Target,
        description: "Dezvoltă încrederea în abilitățile matematice",
      },
    ],
    "educational-books": [
      {
        text: "Inspiră dragostea pentru învățare",
        icon: BookOpen,
        description: "Dezvoltă pasiunea pentru descoperire și învățare",
      },
      {
        text: "Dezvoltă vocabularul și abilitățile de citire",
        icon: GraduationCap,
        description: "Îmbunătățește competențele lingvistice și de comunicare",
      },
      {
        text: "Introduce concepte STEM prin povești",
        icon: Users,
        description: "Face conceptele științifice accesibile prin narativă",
      },
      {
        text: "Stimulează imaginația și creativitatea",
        icon: Sparkles,
        description: "Dezvoltă creativitatea și gândirea laterală",
      },
    ],
  };

  const benefits = benefitsBySlug[slug] ?? benefitsBySlug["science"];

  return (
    <section className="container mx-auto w-full px-4 pt-8 sm:px-6 sm:pt-12 lg:px-10 lg:pt-14">
      <div
        className={`${glassPanelClass} mx-auto max-w-6xl rounded-3xl border-slate-200/70 bg-white/85 px-5 py-6 shadow-xl shadow-slate-900/10 sm:px-8 sm:py-8 lg:px-12 lg:py-10`}
      >
        <div className="mb-6 flex items-center justify-center gap-3 text-center sm:mb-8">
          <GraduationCap className="h-6 w-6 text-sky-300" />
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Beneficii Educaționale pentru {getCategoryName(slug, "ro")}
          </h2>
        </div>
        <div
          className={`${glassCardClass} border-slate-200/70 bg-white/95 px-4 py-5 shadow-inner shadow-slate-900/5 sm:px-6 sm:py-7 lg:px-8 lg:py-8`}
        >
          <div className="mb-4 flex items-center gap-3 sm:mb-6">
            <Lightbulb className="h-5 w-5 text-amber-300" />
            <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
              Ce învață copiii prin jucăriile{" "}
              {getCategoryName(slug, "ro").toLowerCase()}:
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div
                  key={index}
                  className={`${glassCardClass} flex items-start gap-4 rounded-2xl border-slate-200/70 bg-white px-4 py-4 transition-all duration-300 hover:border-slate-300/80 hover:shadow-lg sm:px-5 sm:py-5`}
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="mb-2 font-semibold leading-relaxed text-slate-900">
                      {benefit.text}
                    </h4>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: slugParam } = await params;
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value ?? "ro";
  const slug = slugParam.toLowerCase();
  if (isRemovedCategoryPageSlug(slug) || !isKnownSlug(slug)) {
    notFound();
  }
  const _t = getTranslation(locale);

  const headerImageBySlug: Record<string, string> = {
    science: "/Science.png",
    technology: "/Technology.png",
    engineering: "/Engineering.png",
    math: "/Mathematic.png",
    "educational-books": "/images/category_banner_books_01.jpg",
  };

  const heroTitle = getCategoryName(slug, locale);
  const heroImg = headerImageBySlug[slug] ?? "/HeroImageTechTechtots.png";
  const categoryIcons = getCategoryIcons(slug);

  return (
    <div className={homeBackgroundClass}>
      <SeoJsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "/" },
            {
              "@type": "ListItem",
              position: 2,
              name: "Categories",
              item: "/categories",
            },
            {
              "@type": "ListItem",
              position: 3,
              name: heroTitle,
              item: `/categories/${slug}`,
            },
          ],
        }}
      />
      <div className={homeOverlayTopClass} aria-hidden />
      <div className={homeOverlayBottomClass} aria-hidden />
      <div className={`${homeContentWrapperClass} pb-16`}>
        <section className="relative h-[160px] sm:h-[220px] md:h-[300px] lg:h-[360px] w-full overflow-hidden rounded-none sm:rounded-3xl border-b border-white/5 sm:border border-white/10 shadow-lg shadow-black/40">
          <Image
            src={heroImg}
            alt={heroTitle}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-indigo-950/70 to-slate-900/60" />

          <div className="absolute inset-0 pointer-events-none hidden sm:block">
            {categoryIcons.map((IconComponent, index) => (
              <div
                key={index}
                className="absolute animate-float opacity-20 sm:opacity-30"
                style={{
                  left: `${18 + index * 14}%`,
                  top: `${28 + index * 9}%`,
                  animationDelay: `${index * 0.45}s`,
                  animationDuration: `${3.4 + index * 0.35}s`,
                }}
              >
                <IconComponent className="w-9 h-9 sm:w-12 sm:h-12 text-white/80" />
              </div>
            ))}
          </div>

          <div className="absolute inset-0">
            <div className="container mx-auto flex h-full items-end px-4 pb-4 sm:px-6 sm:pb-6 lg:px-10">
              <div
                className={`${glassPanelClass} flex items-center gap-3 sm:gap-4 md:gap-5 bg-slate-900/60 px-4 py-3 sm:px-6 sm:py-5 lg:px-8 lg:py-6`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 sm:h-14 sm:w-14 md:h-16 md:w-16 lg:h-20 lg:w-20">
                  {(() => {
                    const IconComponent = categoryIcons[0];
                    return (
                      <IconComponent className="h-6 w-6 text-white sm:h-7 sm:w-7 md:h-9 md:w-9 lg:h-10 lg:w-10" />
                    );
                  })()}
                </div>
                <div>
                  <h1 className="text-xl font-bold leading-tight text-white sm:text-2xl md:text-3xl lg:text-4xl">
                    {heroTitle}
                  </h1>
                  <p className="hidden max-w-xl text-xs text-slate-100/90 sm:block sm:text-sm md:text-base">
                    Descoperă lumea fascinantă a {heroTitle.toLowerCase()} prin
                    jucării interactive și educaționale
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 md:bottom-6 md:right-6">
            <Link
              href="/products"
              className={`${gradientButtonClass} inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold sm:px-4 sm:py-2 sm:text-sm md:px-5 md:py-2.5`}
              data-conversion="cta"
              data-conversion-type="click"
              data-conversion-category="category"
              data-conversion-action="category_hero_cta"
              data-conversion-element={`cat_${slug}_hero_cta`}
            >
              <ArrowRight className="h-4 w-4" />
              Vezi produsele
            </Link>
          </div>
        </section>

        <Overview slug={slug} locale={locale} />

        <section className="container mx-auto w-full px-4 sm:px-6 lg:px-10">
          <div
            className={`${glassPanelClass} mx-auto mt-4 flex w-full max-w-5xl flex-col gap-4 rounded-3xl px-5 py-5 sm:mt-6 sm:px-7 sm:py-6 md:mt-8 md:px-10 md:py-8`}
          >
            <div>
              <h2 className="text-lg font-semibold text-slate-900 sm:text-xl md:text-2xl">
                Resurse utile
              </h2>
              <p className="mt-1 text-xs text-slate-600 sm:text-sm md:text-base">
                Nu ești sigur ce să alegi? Consultă ghidurile noastre:
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-700 sm:gap-2.5 sm:text-sm">
              <Link
                href="/ghid-jucarii-stem-2026"
                className="transition-colors hover:text-indigo-900"
                data-conversion="cta"
                data-conversion-type="click"
                data-conversion-category="category"
                data-conversion-action="category_resources_click"
                data-conversion-element={`cat_${slug}_ghid_2026`}
              >
                Ghid 2026
              </Link>
              <span className="text-slate-400">·</span>
              <Link
                href="/jucarii-stem-dupa-varsta"
                className="transition-colors hover:text-indigo-900"
                data-conversion="cta"
                data-conversion-type="click"
                data-conversion-category="category"
                data-conversion-action="category_resources_click"
                data-conversion-element={`cat_${slug}_dupa_varsta`}
              >
                După vârstă
              </Link>
              <span className="text-slate-400">·</span>
              <Link
                href="/beneficiile-jucariilor-stem"
                className="transition-colors hover:text-indigo-900"
                data-conversion="cta"
                data-conversion-type="click"
                data-conversion-category="category"
                data-conversion-action="category_resources_click"
                data-conversion-element={`cat_${slug}_beneficii`}
              >
                Beneficii STEM
              </Link>
              <span className="text-slate-400">·</span>
              <Link
                href="/faq"
                className="transition-colors hover:text-indigo-900"
                data-conversion="cta"
                data-conversion-type="click"
                data-conversion-category="category"
                data-conversion-action="category_resources_click"
                data-conversion-element={`cat_${slug}_faq`}
              >
                FAQ
              </Link>
            </div>
          </div>
        </section>

        <CategoryEducationalBenefits slug={slug} />


        <Suspense>
          <RelatedBlogs slug={slug} />
        </Suspense>
      </div>
    </div>
  );
}
