"use client";

import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
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
const stemCategories = [
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

export default function BlogPage() {
  const { t, language, setLanguage } = useTranslation();
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle language switch
  const toggleLanguage = () => {
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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[250px] sm:h-[300px] md:h-[400px] flex items-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/category_banner_science_01.png"
            alt="STEM Toys Blog - Educational articles and insights"
            fill
            sizes="100vw"
            style={{ objectFit: "cover" }}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/70 via-purple-900/60 to-pink-900/70" />
        </div>
        <div className="container relative z-10 text-white px-3 sm:px-4 lg:px-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 drop-shadow-md">
            {t("blogTitle")}
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-3 sm:mb-6 max-w-2xl leading-relaxed drop-shadow-sm">
            {t("blogDescription")}
          </p>

          {/* Language switch button */}
          <div className="mb-4">
            <Button
              onClick={toggleLanguage}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30 shadow-md transition-all"
              size="sm">
              <span className="flex items-center gap-2">
                <span className="text-lg">
                  {language === "ro" ? "🇷🇴" : "🇬🇧"}
                </span>
                <span>
                  {language === "ro"
                    ? "Switch to English"
                    : "Schimbă în Română"}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-1">
                  <path d="m18 7-6 6-6-6" />
                </svg>
              </span>
            </Button>
          </div>

          <div className="mb-3 sm:mb-4">
            <h3 className="text-sm sm:text-lg font-semibold mb-1.5 sm:mb-2">
              STEM Categories
            </h3>
            <div className="flex flex-wrap gap-1.5 sm:gap-3">
              {stemCategories.map((category) => (
                <Button
                  key={category.key}
                  className={`bg-gradient-to-r ${category.color} hover:opacity-90 text-white border-none shadow-md transition-all text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3 py-0 ${
                    activeCategory === category.key ? "ring-2 ring-white" : ""
                  }`}
                  size="sm"
                  onClick={() => {
                    setActiveCategory(category.key);
                    if (category.key === "all") {
                      setActiveCategoryId("all"); // Reset category filter when selecting "All"
                    }
                  }}>
                  {category.label}
                </Button>
              ))}
            </div>
          </div>

          {categories.length > 0 && (
            <div>
              <h3 className="text-sm sm:text-lg font-semibold mb-1.5 sm:mb-2">
                Content Categories
              </h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-3">
                <Button
                  className={`bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:opacity-90 text-white border-none shadow-md transition-all text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3 py-0 ${
                    activeCategoryId === "all" ? "ring-2 ring-white" : ""
                  }`}
                  size="sm"
                  onClick={() => setActiveCategoryId("all")}>
                  All Categories
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    className={`bg-gradient-to-r from-purple-600 to-purple-700 hover:opacity-90 text-white border-none shadow-md transition-all text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3 py-0 ${
                      activeCategoryId === category.id
                        ? "ring-2 ring-white"
                        : ""
                    }`}
                    size="sm"
                    onClick={() => {
                      setActiveCategoryId(category.id);
                      if (activeCategory !== "all") {
                        setActiveCategory("all"); // Reset STEM filter when selecting a category
                      }
                    }}>
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {(activeCategory !== "all" || activeCategoryId !== "all") && (
            <div className="mt-3 sm:mt-4">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3 py-0"
                onClick={resetFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Featured Posts */}
      <section className="py-6 sm:py-8 md:py-12 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
        <div className="container px-3 sm:px-4 lg:px-8 mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 md:mb-8 text-indigo-900">
            {activeCategory !== "all"
              ? `${stemCategories.find((c) => c.key === activeCategory)?.label} Articles`
              : activeCategoryId !== "all"
                ? `${categories.find((c) => c.id === activeCategoryId)?.name || ""} Articles`
                : t("latestArticles")}
          </h2>

          {isLoading ? (
            <div className="text-center py-6 sm:py-10">
              Loading blog posts...
            </div>
          ) : error ? (
            <div className="text-center py-6 sm:py-10 text-red-500">
              {error}
            </div>
          ) : blogPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mx-auto max-w-7xl">
              {blogPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-lg overflow-hidden shadow-md border border-indigo-100 hover:shadow-xl hover:border-indigo-200 transition-all transform hover:-translate-y-1 duration-300">
                  <div className="relative h-40 sm:h-48 w-full">
                    <Image
                      src={
                        post.coverImage || getDefaultImage(post.stemCategory)
                      }
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      style={{ objectFit: "cover" }}
                      className="transition-transform hover:scale-105 duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3">
                      <span className="inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 font-medium shadow-sm border border-indigo-200/50">
                        {post.category?.name || post.stemCategory}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4">
                    <Link href={`/blog/post/${post.slug}`}>
                      <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-1 sm:mb-2 hover:text-indigo-700 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                    </Link>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex justify-between items-center text-[10px] sm:text-xs text-gray-500">
                      <span className="truncate max-w-[120px]">
                        {post.author?.name || "TechTots Team"}
                      </span>
                      <span>
                        {post.publishedAt
                          ? format(new Date(post.publishedAt), "MMM d, yyyy")
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-10 text-sm sm:text-base">
              No blog posts found in this category. Check back soon!
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
