"use client";

import { format } from "date-fns";
import { SlidersHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// import { toast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Icon, STEMIcons } from "@/components/ui/icon-system";
import { SkeletonCard } from "@/components/ui/skeleton";
import { useTranslation } from "@/lib/i18n";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  stemCategory: string;
  publishedAt: string;
  author: {
    name: string | null;
    avatarUrl?: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
}

// Define STEM categories
const _stemCategories = [
  {
    key: "all",
    label: "All",
    color: "from-indigo-600 via-indigo-700 to-purple-700",
  },
  { key: "SCIENCE", label: "Science (S)", color: "from-blue-600 to-blue-700" },
  {
    key: "TECHNOLOGY",
    label: "Technology (T)",
    color: "from-green-600 to-green-700",
  },
  {
    key: "ENGINEERING",
    label: "Engineering (E)",
    color: "from-yellow-600 to-yellow-700",
  },
  {
    key: "MATHEMATICS",
    label: "Mathematics (M)",
    color: "from-red-600 to-red-700",
  },
];

// STEM category icon mapping
const stemCategoryIconMap: Record<string, keyof typeof STEMIcons> = {
  SCIENCE: "Science",
  TECHNOLOGY: "Technology",
  ENGINEERING: "Engineering",
  MATHEMATICS: "Math",
};

// Helper to get icon for a category name
const getCategoryIcon = (name: string) => {
  const upper = name.trim().toUpperCase();
  if (stemCategoryIconMap[upper]) {
    return STEMIcons[stemCategoryIconMap[upper]];
  }
  // Default icon for non-STEM categories
  return STEMIcons.Logic;
};

export default function BlogPage() {
  const { t, language, setLanguage } = useTranslation();
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle language switch
  const _toggleLanguage = () => {
    setLanguage(language === "ro" ? "en" : "ro");
  };

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }

        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch blog posts
  useEffect(() => {
    const fetchBlogPosts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Add language parameter to the API request
        const url = new URL("/api/blog", window.location.origin);
        url.searchParams.append("language", language);

        if (activeCategoryId !== "all") {
          url.searchParams.append("categoryId", activeCategoryId);
        }

        if (activeCategory !== "all") {
          url.searchParams.append("stemCategory", activeCategory);
        }

        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error("Failed to fetch blog posts");
        }

        const data = await response.json();
        setBlogPosts(data);
      } catch (err) {
        console.error("Error fetching blog posts:", err);
        setError(`${err instanceof Error ? err.message : "An error occurred"}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogPosts();
  }, [activeCategoryId, activeCategory, language]); // Add language as dependency

  // Get default image based on STEM category
  const getDefaultImage = (category: string) => {
    switch (category) {
      case "SCIENCE":
        return "/images/category_banner_science_01.png";
      case "TECHNOLOGY":
        return "/images/category_banner_technology_01.png";
      case "ENGINEERING":
        return "/images/category_banner_engineering_01.png";
      case "MATHEMATICS":
        return "/images/category_banner_math_01.png";
      default:
        return "/images/category_banner_science_01.png";
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setActiveCategory("all");
    setActiveCategoryId("all");
  };

  // --- HERO SECTION ---
  const Hero = () => (
    <section className="relative w-full min-h-[320px] flex items-center justify-center bg-black">
      <Image
        src="/images/category_banner_science_01.png"
        alt="STEM Toys Blog - Educational articles and insights"
        fill
        sizes="100vw"
        style={{ objectFit: "cover" }}
        priority
        className="z-0"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-indigo-900/80 z-10" />
      <Container className="relative z-20 flex flex-col items-center justify-center py-16 md:py-24 text-center text-white">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 drop-shadow-xl">
          {t("blogTitle")}
        </h1>
        <p className="text-base sm:text-lg md:text-2xl max-w-2xl mb-6 drop-shadow-md">
          {t("blogDescription")}
        </p>
      </Container>
    </section>
  );

  // --- CATEGORY BAR ---
  // Responsive CategoryBar with only fetched categories and icons
  const CategoryBar = () => {
    // Determine if any filter is active (not 'all')
    const isFiltered = activeCategoryId !== "all";

    // --- MOBILE: Filter Button + Modal ---
    return (
      <>
        {/* Mobile: Filter Button (sticky) */}
        <div className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm flex items-center px-4 py-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 w-full justify-center"
                aria-label="Open filters"
              >
                <Icon icon={SlidersHorizontal} size="md" decorative />
                <span className="font-medium">{t("Filters") || "Filters"}</span>
                {isFiltered && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold animate-pulse">
                    ●
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md w-full rounded-t-2xl sm:rounded-lg p-0 overflow-hidden">
              <DialogHeader className="p-4 border-b">
                <DialogTitle>
                  {t("Filter by Category") || "Filter by Category"}
                </DialogTitle>
              </DialogHeader>
              <div className="p-4 space-y-4">
                {/* 'All' Button */}
                <div className="flex flex-wrap gap-2 mb-2">
                  <Button
                    key="all"
                    variant={activeCategoryId === "all" ? "default" : "outline"}
                    className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium transition-all border ${activeCategoryId === "all" ? "border-indigo-700 bg-indigo-700 text-white shadow" : "border-gray-200 bg-white text-indigo-700 hover:bg-indigo-50"}`}
                    onClick={() => {
                      setActiveCategoryId("all");
                    }}
                    aria-pressed={activeCategoryId === "all"}
                  >
                    <Icon icon={STEMIcons.Logic} size="sm" decorative />
                    {t("All") || "All"}
                  </Button>
                </div>
                {/* Fetched Categories with icons */}
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <Button
                      key={category.id}
                      variant={
                        activeCategoryId === category.id ? "default" : "outline"
                      }
                      className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium transition-all border ${activeCategoryId === category.id ? "border-purple-700 bg-purple-700 text-white shadow" : "border-gray-200 bg-white text-purple-700 hover:bg-purple-50"}`}
                      onClick={() => {
                        setActiveCategoryId(category.id);
                      }}
                      aria-pressed={activeCategoryId === category.id}
                    >
                      <Icon
                        icon={getCategoryIcon(category.name)}
                        size="sm"
                        decorative
                      />
                      {category.name}
                    </Button>
                  ))}
                </div>
                {/* Reset Filters Button */}
                {isFiltered && (
                  <Button
                    variant="secondary"
                    className="w-full mt-4"
                    onClick={resetFilters}
                  >
                    {t("Reset Filters") || "Reset Filters"}
                  </Button>
                )}
              </div>
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  className="w-full border-t rounded-none"
                >
                  {t("Close") || "Close"}
                </Button>
              </DialogClose>
            </DialogContent>
          </Dialog>
        </div>

        {/* Desktop: Horizontal Filter Bar */}
        <nav className="hidden md:block sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
          <Container className="py-2 flex gap-2 items-center overflow-x-auto scrollbar-thin scrollbar-thumb-indigo-200">
            {/* 'All' Button */}
            <Button
              key="all"
              variant={activeCategoryId === "all" ? "default" : "outline"}
              className={`flex items-center gap-2 rounded-full px-4 py-1 text-sm font-medium transition-all border ${activeCategoryId === "all" ? "border-indigo-700 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-lg" : "border-gray-200 bg-white text-indigo-700 hover:bg-indigo-50"}`}
              onClick={() => {
                setActiveCategoryId("all");
              }}
              aria-pressed={activeCategoryId === "all"}
              tabIndex={0}
            >
              <Icon icon={STEMIcons.Logic} size="sm" decorative />
              {t("All") || "All"}
            </Button>
            {/* Divider */}
            {categories.length > 0 && (
              <span className="mx-2 text-gray-400">|</span>
            )}
            {/* Fetched Categories with icons */}
            {categories.map(category => (
              <Button
                key={category.id}
                variant={
                  activeCategoryId === category.id ? "default" : "outline"
                }
                className={`flex items-center gap-2 rounded-full px-4 py-1 text-sm font-medium transition-all border ${activeCategoryId === category.id ? "border-purple-700 bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg" : "border-gray-200 bg-white text-purple-700 hover:bg-purple-50"}`}
                onClick={() => {
                  setActiveCategoryId(category.id);
                }}
                aria-pressed={activeCategoryId === category.id}
                tabIndex={0}
              >
                <Icon
                  icon={getCategoryIcon(category.name)}
                  size="sm"
                  decorative
                />
                {category.name}
              </Button>
            ))}
            {/* Reset Filters Button */}
            {isFiltered && (
              <Button
                variant="secondary"
                className="ml-4"
                onClick={resetFilters}
              >
                {t("Reset Filters") || "Reset Filters"}
              </Button>
            )}
          </Container>
        </nav>
      </>
    );
  };

  // --- BLOG GRID ---
  const BlogGrid = () => (
    <Container className="py-10">
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-12 text-lg font-semibold">
          {error}
        </div>
      ) : blogPosts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {blogPosts.map(post => (
            <Card
              key={post.id}
              className="flex flex-col h-full group transition-shadow hover:shadow-xl"
            >
              <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                <Image
                  src={post.coverImage || getDefaultImage(post.stemCategory)}
                  alt={post.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <Badge
                    variant="secondary"
                    className="bg-white/80 text-indigo-700 font-bold shadow"
                  >
                    {post.category?.name || post.stemCategory}
                  </Badge>
                </div>
              </div>
              <CardContent className="flex flex-col flex-1 p-5">
                <Link href={`/blog/post/${post.slug}`} className="flex-1 group">
                  <h3 className="text-lg font-bold mb-2 group-hover:text-indigo-700 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                </Link>
                <div className="flex items-center gap-3 mt-auto pt-2 border-t border-gray-100">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={post.author?.avatarUrl || undefined}
                      alt={post.author?.name || "Author"}
                    />
                    <AvatarFallback>
                      {post.author?.name?.[0] || "T"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-700 font-medium truncate max-w-[100px]">
                    {post.author?.name || "TechTots Team"}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">
                    {post.publishedAt
                      ? format(new Date(post.publishedAt), "MMM d, yyyy")
                      : ""}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24">
          <Image
            src="/images/empty-state.svg"
            alt="No blog posts"
            width={180}
            height={180}
            className="mb-6"
          />
          <h2 className="text-2xl font-bold mb-2">No blog posts found</h2>
          <p className="text-gray-500 mb-4">
            Check back soon for new articles and insights!
          </p>
        </div>
      )}
    </Container>
  );

  // --- MAIN RENDER ---
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Hero />
      <CategoryBar />
      <BlogGrid />
    </div>
  );
}
