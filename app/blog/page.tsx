"use client";

import { SlidersHorizontal } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

import { BlogGrid, BlogPost } from "@/components/blog/BlogGrid";
import { Button } from "@/components/ui/button";
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
import { useTranslation } from "@/lib/i18n";

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
  const { t, language } = useTranslation();
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <section className="relative w-full min-h-[200px] sm:min-h-[280px] lg:min-h-[320px] flex items-center justify-center bg-black">
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
      <Container className="relative z-20 flex flex-col items-center justify-center py-8 sm:py-12 md:py-16 lg:py-24 text-center text-white">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight mb-2 sm:mb-4 drop-shadow-xl">
          {t("blogH1")}
        </h1>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl max-w-2xl mb-4 sm:mb-6 drop-shadow-md">
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
        <div className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm flex items-center px-4 py-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 w-full justify-center h-12 rounded-xl border-2 border-gray-200 hover:border-indigo-300 transition-colors"
                aria-label="Open filters"
              >
                <Icon icon={SlidersHorizontal} size="md" decorative />
                <span className="font-medium text-gray-700">
                  {t("Filters") || "Filters"}
                </span>
                {isFiltered && (
                  <span className="ml-2 px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                    {categories.filter(cat => cat.id === activeCategoryId)
                      .length > 0
                      ? categories.find(cat => cat.id === activeCategoryId)
                          ?.name
                      : "Filtered"}
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
          <Container className="py-3 flex gap-3 items-center overflow-x-auto scrollbar-thin scrollbar-thumb-indigo-200">
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
  const BlogGridSection = () => (
    <Container className="py-4 sm:py-6 lg:py-8">
      <BlogGrid
        blogPosts={blogPosts}
        isLoading={isLoading}
        error={error}
        getDefaultImage={getDefaultImage}
      />
    </Container>
  );

  // --- MAIN RENDER ---
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Hero />
      <CategoryBar />
      <BlogGridSection />
    </div>
  );
}
