import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import {
  Cpu,
  Code,
  Bot,
  Zap,
  Brain,
  Lightbulb,
  Rocket,
  Globe,
  Smartphone,
  Laptop,
  Wifi,
  Database,
  Cloud,
  CircuitBoard,
  Microchip,
  Gamepad2,
  BookOpen,
  Star,
  Clock,
  User,
  Quote,
  ArrowRight,
  Play,
  Target,
  TrendingUp,
  Shield,
  Sparkles,
  CheckCircle,
  ArrowUpRight,
  Users,
  Award,
  BookMarked,
  Eye,
  Heart,
  MessageCircle,
  Calendar,
  MapPin,
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

import { getTranslation } from "@/lib/i18n/server";
import { blogService } from "@/lib/services/blog-service";
import { getCategoryName } from "@/lib/services/categories-service";

// Enable ISR with 10 minutes revalidation
export const revalidate = 600;

const KNOWN_SLUGS = [
  "science",
  "technology",
  "engineering",
  "math",
  "educational-books",
] as const;
type KnownSlug = (typeof KNOWN_SLUGS)[number];

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
  const { slug } = await params;
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

// Technology-specific icons mapping
const getTechnologyIcons = () => ({
  hero: [Cpu, Code, Bot, Zap, Brain, Lightbulb],
  benefits: [Microchip, CircuitBoard, Database, Cloud, Wifi, Smartphone],
  skills: [Target, TrendingUp, Shield, Sparkles, CheckCircle, Rocket],
  testimonials: [User, Quote, Star, Award, Heart, MessageCircle],
  blogs: [BookOpen, Clock, Eye, ArrowUpRight, Calendar, BookMarked],
});

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

  const categoryIcons = getCategoryIcons(slug);
  const blogIcons = [BookOpen, Clock, Eye, ArrowUpRight, Calendar, BookMarked];

  if (!blogs || blogs.length === 0) {
    return (
      <section className="container mx-auto px-4 py-8 sm:py-12">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-6 h-6 text-primary" />
          <h3 className="text-xl sm:text-2xl font-bold">
            Articole recomandate
          </h3>
        </div>
        <div className="text-center py-12 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl border border-primary/10">
          <BookOpen className="w-16 h-16 text-primary/40 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            Nu există încă articole pentru această categorie.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <ArrowRight className="w-4 h-4" />
            Vezi toate articolele
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-primary" />
          <h3 className="text-xl sm:text-2xl font-bold">
            Articole recomandate pentru {getCategoryName(slug, "ro")}
          </h3>
        </div>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors group"
        >
          Vezi toate articolele
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogs.map((blog, index) => {
          const IconComponent = blogIcons[index % blogIcons.length];
          return (
            <Link
              key={blog.id}
              href={`/blog/${blog.slug}`}
              className="group rounded-xl border border-border/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-background hover:border-primary/20 hover:bg-gradient-to-br hover:from-primary/5 hover:to-secondary/5"
            >
              {blog.coverImage ? (
                <div className="relative w-full h-48 mb-4 overflow-hidden rounded-lg">
                  <Image
                    src={blog.coverImage}
                    alt={blog.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ) : (
                <div className="w-full h-48 mb-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                  <IconComponent className="w-12 h-12 text-primary/60" />
                </div>
              )}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{blog.author?.name ?? "TechTots Team"}</span>
                  {blog.readingTime && (
                    <>
                      <span>•</span>
                      <Clock className="w-3 h-3" />
                      <span>{blog.readingTime} min citire</span>
                    </>
                  )}
                </div>
                <h4 className="font-semibold text-base sm:text-lg line-clamp-2 group-hover:text-primary transition-colors">
                  {blog.title}
                </h4>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {blog.excerpt}
                </p>
                <div className="flex items-center gap-2 text-xs text-primary font-medium">
                  <span>Citește mai mult</span>
                  <ArrowUpRight className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function Testimonials({ slug }: { slug: KnownSlug | string }) {
  const testimonialsBySlug: Record<
    string,
    Array<{
      quote: string;
      author: string;
      role: string;
      language?: string;
      rating?: number;
    }>
  > = {
    science: [
      {
        quote:
          "Experimentele de știință i-au trezit curiozitatea și dorința de a înțelege lumea. Copilul meu își petrece ore întregi explorând concepte noi.",
        author: "Irina M.",
        role: "Părinte",
        language: "ro",
        rating: 5,
      },
      {
        quote:
          "Seturile de laborator sunt excelente pentru lecțiile noastre interactive. Elevii sunt mult mai implicați când pot experimenta practic.",
        author: "Prof. Andrei V.",
        role: "Profesor de științe",
        language: "ro",
        rating: 5,
      },
      {
        quote:
          "My daughter's science kit has sparked her interest in chemistry and physics. She now asks questions about how everything works!",
        author: "Sarah Johnson",
        role: "Parent",
        language: "en",
        rating: 5,
      },
      {
        quote:
          "The microscope set has been incredible for our homeschool curriculum. Kids learn so much more when they can see things up close.",
        author: "Michael Chen",
        role: "Homeschool Parent",
        language: "en",
        rating: 5,
      },
      {
        quote:
          "As a science teacher, I've seen how hands-on experiments transform abstract concepts into tangible learning experiences.",
        author: "Dr. Emily Rodriguez",
        role: "Science Educator",
        language: "en",
        rating: 5,
      },
    ],
    technology: [
      {
        quote:
          "Jucăriile de robotică au transformat joaca în programare creativă. Copilul meu învață logică fără să realizeze că studiază.",
        author: "Dana T.",
        role: "Mamă",
        language: "ro",
        rating: 5,
      },
      {
        quote:
          "Lego cu programare este perfect pentru clubul nostru de tech. Elevii sunt entuziaști să vină la activități.",
        author: "Mihai C.",
        role: "Coordonator club",
        language: "ro",
        rating: 5,
      },
      {
        quote:
          "Coding robots have made programming accessible and fun. My son learned basic algorithms through play!",
        author: "Jennifer Park",
        role: "Tech Parent",
        language: "en",
        rating: 5,
      },
      {
        quote:
          "The programmable toys have been fantastic for our after-school STEM program. Kids are excited to learn coding concepts.",
        author: "David Thompson",
        role: "STEM Coordinator",
        language: "en",
        rating: 5,
      },
      {
        quote:
          "As an IT professional, I'm amazed at how quickly kids grasp programming concepts when presented through interactive toys.",
        author: "Lisa Wang",
        role: "Software Engineer & Parent",
        language: "en",
        rating: 5,
      },
    ],
    engineering: [
      {
        quote:
          "Construcțiile dezvoltă perseverența și gândirea inginerească. Copilul meu nu renunță până nu rezolvă problema.",
        author: "Ruxandra P.",
        role: "Părinte",
        language: "ro",
        rating: 5,
      },
      {
        quote:
          "Structurile modulare sunt fantastice pentru proiecte practice. Elevii învață despre stabilitate și echilibru.",
        author: "Alex D.",
        role: "Educator STEM",
        language: "ro",
        rating: 5,
      },
      {
        quote:
          "Building sets have taught my daughter patience and problem-solving. She's learned that failure is part of the design process.",
        author: "Robert Martinez",
        role: "Parent",
        language: "en",
        rating: 5,
      },
      {
        quote:
          "The engineering kits in our classroom have improved students' spatial reasoning and critical thinking skills significantly.",
        author: "Amanda Foster",
        role: "Elementary Teacher",
        language: "en",
        rating: 5,
      },
      {
        quote:
          "As a civil engineer, I love seeing kids understand basic engineering principles through hands-on construction.",
        author: "James Wilson",
        role: "Civil Engineer & Parent",
        language: "en",
        rating: 5,
      },
    ],
    math: [
      {
        quote:
          "Puzzle-urile matematice au făcut logica distractivă. Copilul meu își petrece timpul liber rezolvând probleme.",
        author: "Oana S.",
        role: "Părinte",
        language: "ro",
        rating: 5,
      },
      {
        quote:
          "Jocurile de strategie întăresc gândirea critică. Elevii învață să planifice și să anticipeze consecințele.",
        author: "Ilie N.",
        role: "Profesor de matematică",
        language: "ro",
        rating: 5,
      },
      {
        quote:
          "Math games have completely changed my son's attitude toward numbers. He now sees math as a fun challenge!",
        author: "Maria Garcia",
        role: "Parent",
        language: "en",
        rating: 5,
      },
      {
        quote:
          "The mathematical puzzles in our curriculum have improved students' problem-solving abilities and confidence.",
        author: "Dr. Kevin O'Brien",
        role: "Math Teacher",
        language: "en",
        rating: 5,
      },
      {
        quote:
          "As a mathematician, I appreciate how these toys make abstract concepts concrete and engaging for young learners.",
        author: "Prof. Rachel Green",
        role: "Mathematics Professor",
        language: "en",
        rating: 5,
      },
    ],
    "educational-books": [
      {
        quote:
          "Cărțile au devenit punctul de pornire pentru discuții fascinante. Familia noastră își petrece seara citind împreună.",
        author: "Simona R.",
        role: "Părinte",
        language: "ro",
        rating: 5,
      },
      {
        quote:
          "Resurse grozave pentru activități integrate în clasă. Elevii sunt captivați de poveștile cu teme științifice.",
        author: "Elena B.",
        role: "Învățătoare",
        language: "ro",
        rating: 5,
      },
      {
        quote:
          "STEM books have become our bedtime favorites. My kids ask questions about science and technology every night.",
        author: "Thomas Anderson",
        role: "Parent",
        language: "en",
        rating: 5,
      },
      {
        quote:
          "The educational books in our library have increased students' reading comprehension and scientific literacy.",
        author: "Patricia Lewis",
        role: "Librarian",
        language: "en",
        rating: 5,
      },
      {
        quote:
          "As an author of children's science books, I see how stories can make complex concepts accessible and memorable.",
        author: "Dr. Susan Mitchell",
        role: "Children's Science Author",
        language: "en",
        rating: 5,
      },
    ],
  };

  const items = testimonialsBySlug[slug] ?? testimonialsBySlug["science"];
  const categoryIcons = getCategoryIcons(slug);
  const testimonialIcons = [User, Quote, Star, Award, Heart, MessageCircle];

  return (
    <section className="container mx-auto px-4 py-8 sm:py-12">
      <div className="flex items-center gap-3 mb-8">
        <Quote className="w-6 h-6 text-primary" />
        <h3 className="text-xl sm:text-2xl font-bold">
          Ce spun părinții și educatorii
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((t, idx) => {
          const IconComponent = testimonialIcons[idx % testimonialIcons.length];
          return (
            <blockquote
              key={idx}
              className="relative rounded-xl border border-border/50 p-6 bg-gradient-to-br from-primary/5 to-secondary/5 hover:from-primary/10 hover:to-secondary/10 transition-all duration-300 hover:shadow-lg group"
            >
              <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity">
                <IconComponent className="w-8 h-8 text-primary" />
              </div>
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < (t.rating || 5)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <p className="italic mb-4 text-foreground/80 leading-relaxed">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-foreground">
                    {t.author}
                  </div>
                  <div className="text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </blockquote>
          );
        })}
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
    Array<{ text: string; icon: any; progress: number }>
  > = {
    science: [
      {
        text: "Dezvoltă curiozitatea și spiritul de cercetare",
        icon: Beaker,
        progress: 95,
      },
      {
        text: "Învață principiile științei prin experimente practice",
        icon: Atom,
        progress: 90,
      },
      {
        text: "Stimulează gândirea critică și analitică",
        icon: Brain,
        progress: 85,
      },
      {
        text: "Introduce concepte de fizică, chimie și biologie",
        icon: Microscope,
        progress: 88,
      },
    ],
    technology: [
      {
        text: "Dezvoltă gândirea computațională și algoritmică",
        icon: Cpu,
        progress: 95,
      },
      { text: "Introduce programarea și robotică", icon: Code, progress: 92 },
      {
        text: "Pregătește pentru carierele viitorului",
        icon: Rocket,
        progress: 88,
      },
      {
        text: "Învață despre inteligența artificială și inovație",
        icon: Brain,
        progress: 90,
      },
    ],
    engineering: [
      {
        text: "Învață principiile mecanicii și structurilor",
        icon: Building2,
        progress: 92,
      },
      {
        text: "Dezvoltă abilități de rezolvare a problemelor",
        icon: Target,
        progress: 88,
      },
      {
        text: "Stimulează creativitatea inginerească",
        icon: Sparkles,
        progress: 85,
      },
      {
        text: "Învață procesul de proiectare și testare",
        icon: CheckCircle,
        progress: 90,
      },
    ],
    math: [
      {
        text: "Face matematica distractivă și accesibilă",
        icon: Calculator,
        progress: 90,
      },
      {
        text: "Dezvoltă gândirea logică și raționamentul",
        icon: Brain,
        progress: 88,
      },
      {
        text: "Învață concepte matematice prin joc",
        icon: Puzzle,
        progress: 85,
      },
      {
        text: "Construiește încrederea în rezolvarea problemelor",
        icon: Target,
        progress: 92,
      },
    ],
    "educational-books": [
      {
        text: "Inspiră dragostea pentru învățare",
        icon: BookOpen,
        progress: 95,
      },
      {
        text: "Dezvoltă vocabularul și abilitățile de citire",
        icon: GraduationCap,
        progress: 90,
      },
      {
        text: "Introduce concepte STEM prin povești",
        icon: Users,
        progress: 88,
      },
      {
        text: "Stimulează imaginația și creativitatea",
        icon: Sparkles,
        progress: 85,
      },
    ],
  };

  const benefits = benefitsBySlug[slug] || benefitsBySlug["science"];

  return (
    <section className="container mx-auto px-4 py-8 sm:py-12">
      <div className="flex items-center gap-3 mb-6">
        <Target className="w-6 h-6 text-primary" />
        <h2 className="text-2xl sm:text-3xl font-bold">{title}</h2>
      </div>
      <p className="text-muted-foreground max-w-3xl mb-8 text-lg leading-relaxed">
        {copy[slug] ??
          "Descoperiți resurse care stârnesc pasiunea pentru învățare în rândul copiilor."}
      </p>

      {/* Enhanced Educational Benefits Section */}
      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-primary/10 p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground/80">
            Beneficii Educaționale:
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div key={index} className="flex items-start gap-4 group">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                  <IconComponent className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                    {benefit.text}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary to-primary/70 h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${benefit.progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {benefit.progress}% eficiență
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enhanced Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border/50 p-6 bg-gradient-to-br from-primary/5 to-secondary/5 hover:from-primary/10 hover:to-secondary/10 transition-all duration-300 hover:shadow-lg group">
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">Beneficii</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Curiozitate, gândire critică, creativitate
          </p>
        </div>
        <div className="rounded-xl border border-border/50 p-6 bg-gradient-to-br from-primary/5 to-secondary/5 hover:from-primary/10 hover:to-secondary/10 transition-all duration-300 hover:shadow-lg group">
          <div className="flex items-center gap-3 mb-3">
            <Play className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">Activități</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Proiecte practice, jocuri logice, explorare ghidată
          </p>
        </div>
        <div className="rounded-xl border border-border/50 p-6 bg-gradient-to-br from-primary/5 to-secondary/5 hover:from-primary/10 hover:to-secondary/10 transition-all duration-300 hover:shadow-lg group">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">Recomandat pentru</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Părinți, educatori, cluburi STEM
          </p>
        </div>
        <div className="rounded-xl border border-border/50 p-6 bg-gradient-to-br from-primary/5 to-secondary/5 hover:from-primary/10 hover:to-secondary/10 transition-all duration-300 hover:shadow-lg group">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">Resurse</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Ghiduri, seturi tematice, cărți complementare
          </p>
        </div>
      </div>
    </section>
  );
}

function CategoryEducationalBenefits({ slug }: { slug: string }) {
  const benefitsBySlug: Record<
    string,
    Array<{ text: string; icon: any; description: string }>
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
    <section className="container mx-auto px-4 py-8 sm:py-12 bg-gradient-to-r from-primary/5 to-secondary/5">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8 text-center justify-center">
          <GraduationCap className="w-6 h-6 text-primary" />
          <h2 className="text-2xl sm:text-3xl font-bold">
            Beneficii Educaționale pentru {getCategoryName(slug, "ro")}
          </h2>
        </div>
        <div className="bg-background rounded-xl border border-primary/10 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h3 className="text-lg sm:text-xl font-semibold text-foreground/80">
              Ce învață copiii prin jucăriile{" "}
              {getCategoryName(slug, "ro").toLowerCase()}:
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-4 group hover:bg-primary/5 p-4 rounded-lg transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground mb-2 leading-relaxed">
                      {benefit.text}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
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
  const _t = getTranslation(locale);

  const headerImageBySlug: Record<string, string> = {
    science: "/images/category_banner_science_01.png",
    technology: "/images/category_banner_technology_01.png",
    engineering: "/images/category_banner_engineering_01.png",
    math: "/images/category_banner_math_01.png",
    "educational-books": "/images/category_banner_books_01.jpg",
  };

  const heroTitle = getCategoryName(slug, locale);
  const heroImg = headerImageBySlug[slug] ?? "/images/hero.jpg";
  const categoryIcons = getCategoryIcons(slug);

  return (
    <div className="flex flex-col">
      {/* Enhanced Hero Section */}
      <section className="relative h-[220px] sm:h-[320px] w-full overflow-hidden">
        <Image
          src={heroImg}
          alt={heroTitle}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

        {/* Floating Icons Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {categoryIcons.map((IconComponent, index) => (
            <div
              key={index}
              className="absolute animate-float opacity-20"
              style={{
                left: `${20 + index * 15}%`,
                top: `${30 + index * 10}%`,
                animationDelay: `${index * 0.5}s`,
                animationDuration: `${3 + index}s`,
              }}
            >
              <IconComponent className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
            </div>
          ))}
        </div>

        <div className="absolute inset-0 container mx-auto px-4 flex items-end pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              {(() => {
                const IconComponent = categoryIcons[0];
                return (
                  <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                );
              })()}
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-white drop-shadow-lg mb-2">
                {heroTitle}
              </h1>
              <p className="text-white/90 text-sm sm:text-base max-w-md drop-shadow">
                Descoperă lumea fascinantă a {heroTitle.toLowerCase()} prin
                jucării interactive și educaționale
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action Buttons */}
        <div className="absolute bottom-4 right-4 flex gap-3">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl text-sm"
          >
            <ArrowRight className="w-4 h-4" />
            Vezi produsele
          </Link>
        </div>
      </section>

      {/* Overview */}
      <Overview slug={slug} locale={locale} />

      {/* Category Educational Benefits */}
      <CategoryEducationalBenefits slug={slug} />

      {/* Testimonials */}
      <Testimonials slug={slug} />

      {/* Related Blogs */}
      <Suspense>
        {/* @ts-expect-error Async Server Component */}
        <RelatedBlogs slug={slug} />
      </Suspense>
    </div>
  );
}
