"use client";

import { useEffect, useState } from "react";

import { BlogGrid, BlogPost } from "@/components/blog/BlogGrid";
import { BlogFilterBar } from "@/features/blog/components/BlogFilterBar";
import { BlogHeroSection } from "@/features/blog/components/BlogHeroSection";
import {
  blogBackgroundClass,
  blogContentWrapperClass,
  blogOverlayBottomClass,
  blogOverlayTopClass,
} from "@/features/blog/components/blogTheme";
import { Container } from "@/components/ui/container";
import { useTranslation } from "@/lib/i18n";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
}

export default function BlogPage() {
  const { t, language, setLanguage } = useTranslation();
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

        // Ensure we have a valid array of blogs
        if (!data || typeof data !== "object") {
          throw new Error("Invalid response format from server");
        }

        const blogs = Array.isArray(data.blogs) ? data.blogs : [];
        setBlogPosts(blogs);
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
        return "/Science.png";
      case "TECHNOLOGY":
        return "/Technology.png";
      case "ENGINEERING":
        return "/Engineering.png";
      case "MATHEMATICS":
        return "/Mathematic.png";
      default:
        return "/Science.png";
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setActiveCategory("all");
    setActiveCategoryId("all");
  };

  // Language switch handler
  const switchLanguage = (newLanguage: string) => {
    setLanguage(newLanguage);
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
    <div className={blogBackgroundClass}>
      <div className={blogOverlayTopClass} aria-hidden />
      <div className={blogOverlayBottomClass} aria-hidden />
      <div className={blogContentWrapperClass}>
        <BlogHeroSection
          t={t}
          language={language}
          onLanguageToggle={() => switchLanguage(language === "ro" ? "en" : "ro")}
        />
        <BlogFilterBar
          categories={categories}
          activeCategoryId={activeCategoryId}
          onCategorySelect={categoryId => setActiveCategoryId(categoryId)}
          onResetFilters={resetFilters}
          t={t}
        />
        <div className="relative z-10">
          <BlogGridSection />
        </div>
      </div>
    </div>
  );
}
