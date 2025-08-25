import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

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

  if (!blogs || blogs.length === 0) {
    return (
      <section className="container mx-auto px-4 py-8 sm:py-12">
        <h3 className="text-xl sm:text-2xl font-bold mb-6">
          Articole recomandate
        </h3>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Nu există încă articole pentru această categorie.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Vezi toate articolele
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl sm:text-2xl font-bold">
          Articole recomandate pentru {getCategoryName(slug, "ro")}
        </h3>
        <Link
          href="/blog"
          className="text-sm text-primary hover:underline transition-colors"
        >
          Vezi toate articolele →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogs.map(blog => (
          <Link
            key={blog.id}
            href={`/blog/${blog.slug}`}
            className="group rounded-lg border p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-background"
          >
            {blog.coverImage ? (
              <div className="relative w-full h-40 mb-3 overflow-hidden rounded-md">
                <Image
                  src={blog.coverImage}
                  alt={blog.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ) : (
              <div className="w-full h-40 mb-3 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-md flex items-center justify-center">
                <span className="text-primary/60 text-2xl">📝</span>
              </div>
            )}
            <div className="space-y-2">
              <h4 className="font-semibold text-base sm:text-lg line-clamp-2 group-hover:text-primary transition-colors">
                {blog.title}
              </h4>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {blog.excerpt}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{blog.author?.name ?? "TechTots Team"}</span>
                {blog.readingTime && <span>{blog.readingTime} min citire</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Testimonials({ slug }: { slug: KnownSlug | string }) {
  const testimonialsBySlug: Record<
    string,
    Array<{ quote: string; author: string; role: string; language?: string }>
  > = {
    science: [
      {
        quote:
          "Experimentele de știință i-au trezit curiozitatea și dorința de a înțelege lumea. Copilul meu își petrece ore întregi explorând concepte noi.",
        author: "Irina M.",
        role: "Părinte",
        language: "ro",
      },
      {
        quote:
          "Seturile de laborator sunt excelente pentru lecțiile noastre interactive. Elevii sunt mult mai implicați când pot experimenta practic.",
        author: "Prof. Andrei V.",
        role: "Profesor de științe",
        language: "ro",
      },
      {
        quote:
          "My daughter's science kit has sparked her interest in chemistry and physics. She now asks questions about how everything works!",
        author: "Sarah Johnson",
        role: "Parent",
        language: "en",
      },
      {
        quote:
          "The microscope set has been incredible for our homeschool curriculum. Kids learn so much more when they can see things up close.",
        author: "Michael Chen",
        role: "Homeschool Parent",
        language: "en",
      },
      {
        quote:
          "As a science teacher, I've seen how hands-on experiments transform abstract concepts into tangible learning experiences.",
        author: "Dr. Emily Rodriguez",
        role: "Science Educator",
        language: "en",
      },
    ],
    technology: [
      {
        quote:
          "Jucăriile de robotică au transformat joaca în programare creativă. Copilul meu învață logică fără să realizeze că studiază.",
        author: "Dana T.",
        role: "Mamă",
        language: "ro",
      },
      {
        quote:
          "Lego cu programare este perfect pentru clubul nostru de tech. Elevii sunt entuziaști să vină la activități.",
        author: "Mihai C.",
        role: "Coordonator club",
        language: "ro",
      },
      {
        quote:
          "Coding robots have made programming accessible and fun. My son learned basic algorithms through play!",
        author: "Jennifer Park",
        role: "Tech Parent",
        language: "en",
      },
      {
        quote:
          "The programmable toys have been fantastic for our after-school STEM program. Kids are excited to learn coding concepts.",
        author: "David Thompson",
        role: "STEM Coordinator",
        language: "en",
      },
      {
        quote:
          "As an IT professional, I'm amazed at how quickly kids grasp programming concepts when presented through interactive toys.",
        author: "Lisa Wang",
        role: "Software Engineer & Parent",
        language: "en",
      },
    ],
    engineering: [
      {
        quote:
          "Construcțiile dezvoltă perseverența și gândirea inginerească. Copilul meu nu renunță până nu rezolvă problema.",
        author: "Ruxandra P.",
        role: "Părinte",
        language: "ro",
      },
      {
        quote:
          "Structurile modulare sunt fantastice pentru proiecte practice. Elevii învață despre stabilitate și echilibru.",
        author: "Alex D.",
        role: "Educator STEM",
        language: "ro",
      },
      {
        quote:
          "Building sets have taught my daughter patience and problem-solving. She's learned that failure is part of the design process.",
        author: "Robert Martinez",
        role: "Parent",
        language: "en",
      },
      {
        quote:
          "The engineering kits in our classroom have improved students' spatial reasoning and critical thinking skills significantly.",
        author: "Amanda Foster",
        role: "Elementary Teacher",
        language: "en",
      },
      {
        quote:
          "As a civil engineer, I love seeing kids understand basic engineering principles through hands-on construction.",
        author: "James Wilson",
        role: "Civil Engineer & Parent",
        language: "en",
      },
    ],
    math: [
      {
        quote:
          "Puzzle-urile matematice au făcut logica distractivă. Copilul meu își petrece timpul liber rezolvând probleme.",
        author: "Oana S.",
        role: "Părinte",
        language: "ro",
      },
      {
        quote:
          "Jocurile de strategie întăresc gândirea critică. Elevii învață să planifice și să anticipeze consecințele.",
        author: "Ilie N.",
        role: "Profesor de matematică",
        language: "ro",
      },
      {
        quote:
          "Math games have completely changed my son's attitude toward numbers. He now sees math as a fun challenge!",
        author: "Maria Garcia",
        role: "Parent",
        language: "en",
      },
      {
        quote:
          "The mathematical puzzles in our curriculum have improved students' problem-solving abilities and confidence.",
        author: "Dr. Kevin O'Brien",
        role: "Math Teacher",
        language: "en",
      },
      {
        quote:
          "As a mathematician, I appreciate how these toys make abstract concepts concrete and engaging for young learners.",
        author: "Prof. Rachel Green",
        role: "Mathematics Professor",
        language: "en",
      },
    ],
    "educational-books": [
      {
        quote:
          "Cărțile au devenit punctul de pornire pentru discuții fascinante. Familia noastră își petrece seara citind împreună.",
        author: "Simona R.",
        role: "Părinte",
        language: "ro",
      },
      {
        quote:
          "Resurse grozave pentru activități integrate în clasă. Elevii sunt captivați de poveștile cu teme științifice.",
        author: "Elena B.",
        role: "Învățătoare",
        language: "ro",
      },
      {
        quote:
          "STEM books have become our bedtime favorites. My kids ask questions about science and technology every night.",
        author: "Thomas Anderson",
        role: "Parent",
        language: "en",
      },
      {
        quote:
          "The educational books in our library have increased students' reading comprehension and scientific literacy.",
        author: "Patricia Lewis",
        role: "Librarian",
        language: "en",
      },
      {
        quote:
          "As an author of children's science books, I see how stories can make complex concepts accessible and memorable.",
        author: "Dr. Susan Mitchell",
        role: "Children's Science Author",
        language: "en",
      },
    ],
  };

  const items = testimonialsBySlug[slug] ?? testimonialsBySlug["science"];

  return (
    <section className="container mx-auto px-4 py-8 sm:py-12">
      <h3 className="text-xl sm:text-2xl font-bold mb-6">
        Ce spun părinții și educatorii
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((t, idx) => (
          <blockquote key={idx} className="rounded-lg border p-6 bg-primary/5">
            <p className="italic mb-3">“{t.quote}”</p>
            <div className="text-sm text-muted-foreground">
              {t.author} • {t.role}
            </div>
          </blockquote>
        ))}
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

  const benefitsBySlug: Record<string, string[]> = {
    science: [
      "Dezvoltă curiozitatea și spiritul de cercetare",
      "Învață principiile științei prin experimente practice",
      "Stimulează gândirea critică și analitică",
      "Introduce concepte de fizică, chimie și biologie",
    ],
    technology: [
      "Dezvoltă gândirea computațională și algoritmică",
      "Introduce programarea și robotică",
      "Pregătește pentru carierele viitorului",
      "Învață despre inteligența artificială și inovație",
    ],
    engineering: [
      "Învață principiile mecanicii și structurilor",
      "Dezvoltă abilități de rezolvare a problemelor",
      "Stimulează creativitatea inginerească",
      "Învață procesul de proiectare și testare",
    ],
    math: [
      "Face matematica distractivă și accesibilă",
      "Dezvoltă gândirea logică și raționamentul",
      "Învață concepte matematice prin joc",
      "Construiește încrederea în rezolvarea problemelor",
    ],
    "educational-books": [
      "Inspiră dragostea pentru învățare",
      "Dezvoltă vocabularul și abilitățile de citire",
      "Introduce concepte STEM prin povești",
      "Stimulează imaginația și creativitatea",
    ],
  };

  return (
    <section className="container mx-auto px-4 py-8 sm:py-12">
      <h2 className="text-2xl sm:text-3xl font-bold mb-4">{title}</h2>
      <p className="text-muted-foreground max-w-3xl mb-8">
        {copy[slug] ??
          "Descoperiți resurse care stârnesc pasiunea pentru învățare în rândul copiilor."}
      </p>

      {/* Educational Benefits Section */}
      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-primary/10 p-6 mb-8">
        <h3 className="text-lg font-semibold text-foreground/80 mb-4">
          Beneficii Educaționale:
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(benefitsBySlug[slug] || benefitsBySlug["science"]).map(
            (benefit, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-primary mt-1">•</span>
                <span className="text-sm text-muted-foreground">{benefit}</span>
              </li>
            )
          )}
        </ul>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div className="rounded-md border p-4 bg-background">
          <h4 className="font-semibold mb-2">Beneficii</h4>
          <p className="text-muted-foreground">
            Curiozitate, gândire critică, creativitate
          </p>
        </div>
        <div className="rounded-md border p-4 bg-background">
          <h4 className="font-semibold mb-2">Activități</h4>
          <p className="text-muted-foreground">
            Proiecte practice, jocuri logice, explorare ghidată
          </p>
        </div>
        <div className="rounded-md border p-4 bg-background">
          <h4 className="font-semibold mb-2">Recomandat pentru</h4>
          <p className="text-muted-foreground">
            Părinți, educatori, cluburi STEM
          </p>
        </div>
        <div className="rounded-md border p-4 bg-background">
          <h4 className="font-semibold mb-2">Resurse</h4>
          <p className="text-muted-foreground">
            Ghiduri, seturi tematice, cărți complementare
          </p>
        </div>
      </div>
    </section>
  );
}

function CategoryEducationalBenefits({ slug }: { slug: string }) {
  const benefitsBySlug: Record<string, string[]> = {
    science: [
      "Dezvoltă curiozitatea și spiritul de cercetare",
      "Învață principiile științei prin experimente practice",
      "Stimulează gândirea critică și analitică",
      "Introduce concepte de fizică, chimie și biologie",
    ],
    technology: [
      "Dezvoltă gândirea computațională și algoritmică",
      "Introduce programarea și robotică",
      "Pregătește pentru carierele viitorului",
      "Învață despre inteligența artificială și inovație",
    ],
    engineering: [
      "Învață principiile mecanicii și structurilor",
      "Dezvoltă abilități de rezolvare a problemelor",
      "Stimulează creativitatea inginerească",
      "Învață procesul de proiectare și testare",
    ],
    math: [
      "Face matematica distractivă și accesibilă",
      "Dezvoltă gândirea logică și raționamentul",
      "Învață concepte matematice prin joc",
      "Construiește încrederea în rezolvarea problemelor",
    ],
    "educational-books": [
      "Inspiră dragostea pentru învățare",
      "Dezvoltă vocabularul și abilitățile de citire",
      "Introduce concepte STEM prin povești",
      "Stimulează imaginația și creativitatea",
    ],
  };

  const benefits = benefitsBySlug[slug] ?? benefitsBySlug["science"];

  return (
    <section className="container mx-auto px-4 py-8 sm:py-12 bg-gradient-to-r from-primary/5 to-secondary/5">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
          Beneficii Educaționale pentru {getCategoryName(slug, "ro")}
        </h2>
        <div className="bg-background rounded-lg border border-primary/10 p-6 sm:p-8 shadow-sm">
          <h3 className="text-lg sm:text-xl font-semibold text-foreground/80 mb-4 sm:mb-6">
            Ce învață copiii prin jucăriile{" "}
            {getCategoryName(slug, "ro").toLowerCase()}:
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="text-primary mt-1 text-lg">•</span>
                <span className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {benefit}
                </span>
              </li>
            ))}
          </ul>
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

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative h-[220px] sm:h-[320px] w-full">
        <Image
          src={heroImg}
          alt={heroTitle}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
        <div className="absolute inset-0 container mx-auto px-4 flex items-end pb-6">
          <h1 className="text-2xl sm:text-4xl font-bold text-white drop-shadow">
            {heroTitle}
          </h1>
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
