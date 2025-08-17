"use client";

import { format } from "date-fns";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  stemCategory: string;
  tags: string[];
  publishedAt: string;
  readingTime: number | null;
  author: {
    name: string | null;
  };
  category: {
    name: string;
    slug: string;
  };
}

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const { language, t } = useTranslation();
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogPost = async () => {
      if (!params.slug) return;

      try {
        setIsLoading(true);
        const url = new URL(`/api/blog/${params.slug}`, window.location.origin);
        url.searchParams.append("language", language);

        const response = await fetch(url.toString());

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Blog post not found");
          }
          throw new Error("Failed to fetch blog post");
        }

        const data = await response.json();
        setBlogPost(data);
      } catch (err) {
        console.error("Error fetching blog post:", err);
        setError(`${err instanceof Error ? err.message : "An error occurred"}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogPost();
  }, [params.slug, language]);

  // Get default image based on STEM category
  const getDefaultImage = (category?: string) => {
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

  // Function to get color based on STEM category
  const getStemCategoryColor = (category?: string) => {
    switch (category) {
      case "SCIENCE":
        return "bg-blue-100 text-blue-800";
      case "TECHNOLOGY":
        return "bg-green-100 text-green-800";
      case "ENGINEERING":
        return "bg-yellow-100 text-yellow-800";
      case "MATHEMATICS":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8 sm:py-12 flex justify-center items-center min-h-[60vh]">
        <p className="text-base sm:text-lg">{t("loading")} ...</p>
      </div>
    );
  }

  if (error || !blogPost) {
    return (
      <div className="container py-8 sm:py-12 flex flex-col justify-center items-center min-h-[60vh]">
        <p className="text-base sm:text-lg text-red-500 mb-4">
          {error || t("blogPostNotFound")}
        </p>
        <Link href="/blog">
          <Button>
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
            {t("backToBlog")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Image */}
      <div className="relative h-[200px] sm:h-[300px] md:h-[400px] lg:h-[500px]">
        <Image
          src={blogPost.coverImage || getDefaultImage(blogPost.stemCategory)}
          alt={blogPost.title}
          fill
          sizes="100vw"
          style={{ objectFit: "cover" }}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Back button - desktop */}
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 hidden md:block">
          <Link href="/blog">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/80 backdrop-blur-sm hover:bg-white h-8 sm:h-9 text-xs sm:text-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              {t("backToBlog")}
            </Button>
          </Link>
        </div>

        {/* Language indicator - displayed on desktop */}
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 hidden md:flex items-center gap-1.5 sm:gap-2 bg-white/80 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full backdrop-blur-sm">
          {language === "ro" ? "🇷🇴" : "🇬🇧"}
          <span className="text-xs sm:text-sm font-medium text-gray-900">
            {language === "ro" ? "Română" : "English"}
          </span>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 md:p-10 bg-gradient-to-t from-black/80 to-transparent">
          <div className="container mx-auto">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-white/80 mb-1.5 sm:mb-3 text-xs sm:text-sm">
              <Link
                href={`/blog/category/${blogPost.category.slug}`}
                className="hover:text-white transition-colors"
              >
                {blogPost.category.name}
              </Link>
              <span className="hidden xs:inline">•</span>
              <span className="flex items-center">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden xs:inline">
                  {format(new Date(blogPost.publishedAt), "MMMM d, yyyy")}
                </span>
                <span className="xs:hidden">
                  {format(new Date(blogPost.publishedAt), "MM/dd/yyyy")}
                </span>
              </span>
              {blogPost.author?.name && (
                <>
                  <span className="hidden xs:inline">•</span>
                  <span className="flex items-center">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="truncate max-w-[80px] sm:max-w-none">
                      {blogPost.author.name}
                    </span>
                  </span>
                </>
              )}

              {/* Mobile language indicator */}
              <span className="md:hidden hidden xs:inline">•</span>
              <span className="flex items-center md:hidden">
                {language === "ro" ? "🇷🇴" : "🇬🇧"}
              </span>
            </div>
            <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-sm">
              {blogPost.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Back button - mobile */}
      <div className="container mx-auto md:hidden py-3 sm:py-4 px-3 sm:px-4">
        <Link href="/blog">
          <Button size="sm" className="h-8 text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            {t("backToBlog")}
          </Button>
        </Link>
      </div>

      <main className="container mx-auto max-w-4xl py-6 sm:py-8 md:py-10 px-3 sm:px-4">
        {/* Article content */}
        <article className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-sm">
          <div className="prose prose-sm sm:prose prose-indigo max-w-none">
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-4 sm:mb-6 font-medium leading-relaxed">
              {blogPost.excerpt}
            </p>
            <Separator className="my-4 sm:my-6 md:my-8" />
            <div className="whitespace-pre-line text-sm sm:text-base">
              <div dangerouslySetInnerHTML={{ __html: blogPost.content }} />
            </div>
          </div>

          {/* Tags */}
          {blogPost.tags && blogPost.tags.length > 0 && (
            <div className="mt-6 sm:mt-8 md:mt-10 pt-4 sm:pt-6 border-t">
              <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3 flex items-center">
                <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                {t("tags")}
              </h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {blogPost.tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-gray-100 text-xs sm:text-sm"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Back to blog link */}
        <div className="flex justify-center mt-6 sm:mt-8 md:mt-10">
          <Link href="/blog">
            <Button className="text-xs sm:text-sm h-8 sm:h-9">
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              {t("backToBlog")}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
