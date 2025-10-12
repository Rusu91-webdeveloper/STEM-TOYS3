"use client";

import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  User,
  Tag,
  Clock,
  Share2,
  BookOpen,
  TrendingUp,
  Lightbulb,
  Zap,
  Target,
  Award,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";

import EnhancedMarkdownRenderer from "@/components/blog/EnhancedMarkdownRenderer";
import { BlogLanguageToggle } from "@/components/blog/BlogLanguageToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Share } from "@/components/ui/share";
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
  metadata?: {
    multilingual?: {
      en: {
        title: string;
        excerpt: string;
        content: string;
      };
      ro: {
        title: string;
        excerpt: string;
        content: string;
      };
    };
    language?: string;
    ai?: {
      socialOptimization?: {
        facebook?: { title?: string };
        instagram?: { title?: string };
        tiktok?: { hook?: string; description?: string };
      };
    };
  };
}

interface BlogPostTemplateProps {
  post: BlogPost;
  relatedPosts?: BlogPost[];
  language?: string;
}

export default function ProfessionalBlogTemplate({
  post,
  relatedPosts,
  language = "ro",
}: BlogPostTemplateProps) {
  const { t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<"en" | "ro">(
    language as "en" | "ro"
  );

  // Check if post has multilingual content
  const hasMultilingual =
    post.metadata?.multilingual && post.metadata?.language === "both";

  // Get current content based on selected language
  const getCurrentContent = () => {
    if (hasMultilingual && post.metadata?.multilingual) {
      const multilingualContent = post.metadata.multilingual;
      return {
        title: multilingualContent[currentLanguage]?.title || post.title,
        excerpt: multilingualContent[currentLanguage]?.excerpt || post.excerpt,
        content: multilingualContent[currentLanguage]?.content || post.content,
      };
    }
    return {
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
    };
  };

  const currentContent = getCurrentContent();

  const handleLanguageChange = (lang: "en" | "ro") => {
    setCurrentLanguage(lang);
  };

  if (!post) {
    return (
      <div className="container py-12 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Post not found
          </h2>
          <Link href="/blog">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
        return "bg-gradient-to-r from-blue-600 to-cyan-600";
      case "TECHNOLOGY":
        return "bg-gradient-to-r from-green-600 to-emerald-600";
      case "ENGINEERING":
        return "bg-gradient-to-r from-yellow-600 to-orange-600";
      case "MATHEMATICS":
        return "bg-gradient-to-r from-red-600 to-pink-600";
      default:
        return "bg-gradient-to-r from-indigo-600 to-purple-600";
    }
  };

  const getCategoryGradient = (category?: string) => {
    switch (category) {
      case "SCIENCE":
        return "from-blue-50 to-cyan-50 text-blue-800 border-blue-200";
      case "TECHNOLOGY":
        return "from-green-50 to-emerald-50 text-green-800 border-green-200";
      case "ENGINEERING":
        return "from-yellow-50 to-orange-50 text-yellow-800 border-yellow-200";
      case "MATHEMATICS":
        return "from-red-50 to-pink-50 text-red-800 border-red-200";
      default:
        return "from-purple-50 to-pink-50 text-purple-800 border-purple-200";
    }
  };

  const getStemIcon = (category?: string) => {
    switch (category) {
      case "SCIENCE":
        return <Lightbulb className="h-5 w-5" />;
      case "TECHNOLOGY":
        return <Zap className="h-5 w-5" />;
      case "ENGINEERING":
        return <Target className="h-5 w-5" />;
      case "MATHEMATICS":
        return <Award className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Hero Section with Cover Image - Optimized for Mobile */}
      <div className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] min-h-[280px] sm:min-h-[350px] md:min-h-[450px] overflow-hidden">
        <Image
          src={post.coverImage || getDefaultImage(post.stemCategory)}
          alt={post.title}
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>

        {/* Content Overlay - Compact for Mobile */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="container mx-auto px-3 sm:px-4 text-center text-white">
            {/* Category Badges - Smaller on Mobile */}
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 md:gap-3 mb-3 sm:mb-4 md:mb-6">
              {post.category && (
                <Link
                  href={`/blog?category=${post.category.slug}`}
                  className={`inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full text-[10px] sm:text-xs md:text-sm font-medium bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-300`}
                >
                  {post.category.name}
                </Link>
              )}
              <span
                className={`inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full text-[10px] sm:text-xs md:text-sm font-medium text-white ${getStemCategoryColor(post.stemCategory)} shadow-lg`}
              >
                <span className="hidden sm:inline">
                  {getStemIcon(post.stemCategory)}
                </span>
                <span className="sm:ml-2">{post.stemCategory}</span>
              </span>
            </div>

            {/* Title - More Compact on Mobile */}
            <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-6xl xl:text-7xl font-bold mb-2 sm:mb-3 md:mb-6 leading-tight text-white drop-shadow-2xl px-2">
              {currentContent.title}
            </h1>

            {/* Excerpt - Smaller and Hidden on Very Small Screens */}
            <p className="hidden xs:block text-sm sm:text-base md:text-xl lg:text-2xl text-white/90 mb-3 sm:mb-4 md:mb-8 leading-snug sm:leading-relaxed max-w-4xl mx-auto drop-shadow-lg px-2">
              {currentContent.excerpt}
            </p>

            {/* Meta Information - Compact Grid on Mobile */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-6 text-white/80 text-xs sm:text-sm">
              {/* Author - Simplified on Mobile */}
              {post.author && (
                <div className="flex items-center">
                  <div className="h-6 w-6 sm:h-8 sm:w-8 md:h-12 md:w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-1.5 sm:mr-2 md:mr-3 shadow-lg">
                    <span className="text-xs sm:text-sm md:text-lg font-bold text-white">
                      {post.author.name?.[0] || "A"}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-xs sm:text-sm font-medium text-white">
                      {post.author.name}
                    </span>
                    <div className="text-[10px] sm:text-xs text-white/70">
                      STEM Expert
                    </div>
                  </div>
                  <span className="sm:hidden text-xs font-medium">
                    {post.author.name}
                  </span>
                </div>
              )}

              {/* Date - Compact */}
              <div className="flex items-center text-[10px] sm:text-xs md:text-sm">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">
                  {post.publishedAt
                    ? format(new Date(post.publishedAt), "d MMMM yyyy")
                    : format(new Date(), "d MMMM yyyy")}
                </span>
                <span className="sm:hidden">
                  {post.publishedAt
                    ? format(new Date(post.publishedAt), "d MMM yy")
                    : format(new Date(), "d MMM yy")}
                </span>
              </div>

              {/* Reading Time - Compact */}
              <div className="flex items-center text-[10px] sm:text-xs md:text-sm">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                {post.readingTime || 5} min
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Compact for Mobile */}
      <article className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-12">
        {/* Breadcrumb - Smaller on Mobile */}
        <div className="mb-3 sm:mb-4 md:mb-8">
          <Link
            href="/blog"
            className="flex items-center text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group"
          >
            <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 group-hover:-translate-x-1 transition-transform duration-200" />
            {t("backToBlog", "Back to Blog")}
          </Link>
        </div>

        {/* Content Section - Compact Padding on Mobile */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-2xl p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 border border-gray-100">
            {/* Content Header - Simplified on Mobile */}
            <div className="mb-4 sm:mb-6 md:mb-12 pb-3 sm:pb-4 md:pb-8 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 md:gap-6">
                <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                  <div
                    className={`p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl ${getCategoryGradient(post.stemCategory)}`}
                  >
                    <div className="h-4 w-4 sm:h-5 sm:w-5">
                      {getStemIcon(post.stemCategory)}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-lg md:text-2xl font-bold text-gray-900">
                      Article Overview
                    </h2>
                    <p className="text-[10px] sm:text-xs md:text-base text-gray-600 hidden sm:block">
                      Deep dive into {post.stemCategory.toLowerCase()} concepts
                    </p>
                  </div>
                </div>

                {/* Language Toggle and Share Button - Compact */}
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                  {hasMultilingual && (
                    <BlogLanguageToggle
                      onLanguageChange={handleLanguageChange}
                      currentLanguage={currentLanguage}
                      className="text-xs sm:text-sm"
                    />
                  )}
                  {typeof window !== "undefined" && (
                    <Share
                      url={window.location.href}
                      title={currentContent.title}
                      text={currentContent.excerpt}
                      blogId={post.slug}
                      contentType="blog"
                      className="flex items-center gap-1 sm:gap-2 hover:bg-gray-50 text-xs sm:text-sm"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Main Content - Responsive Typography */}
            <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none">
              <EnhancedMarkdownRenderer
                content={currentContent.content}
                socialOptimization={post.metadata?.ai?.socialOptimization}
                blogTitle={currentContent.title}
              />
            </div>
          </div>
        </div>

        {/* Tags Section - Compact on Mobile */}
        {post.tags && post.tags.length > 0 && (
          <div className="max-w-4xl mx-auto mt-4 sm:mt-6 md:mt-8">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-6 md:p-8 border border-gray-100">
              <h3 className="text-sm sm:text-base md:text-xl font-semibold mb-3 sm:mb-4 md:mb-6 flex items-center">
                <Tag className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mr-2 sm:mr-3 text-blue-600" />
                Related Topics
              </h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-3">
                {post.tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 text-[10px] sm:text-xs md:text-sm font-medium"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Related Posts Section - Compact on Mobile */}
        {relatedPosts && relatedPosts.length > 0 && (
          <div className="max-w-6xl mx-auto mt-6 sm:mt-8 md:mt-12">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-2xl p-4 sm:p-6 md:p-8 lg:p-12 border border-gray-100">
              <div className="text-center mb-4 sm:mb-6 md:mb-8">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">
                  Articole Similare
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
                  Descoperă mai multe articole interesante din aceeași categorie
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {relatedPosts.map(relatedPost => (
                  <Link
                    key={relatedPost.id}
                    href={`/blog/${relatedPost.slug}`}
                    className="group block bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 hover:bg-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className="aspect-video rounded-lg sm:rounded-xl overflow-hidden mb-2 sm:mb-3 md:mb-4 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      {relatedPost.coverImage ? (
                        <Image
                          src={relatedPost.coverImage}
                          alt={relatedPost.title}
                          width={300}
                          height={200}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="text-4xl font-bold text-blue-600">
                          {relatedPost.title.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] sm:text-xs bg-white/80 border-blue-200 text-blue-800"
                        >
                          {relatedPost.stemCategory}
                        </Badge>
                        {relatedPost.category && (
                          <Badge
                            variant="outline"
                            className="text-[10px] sm:text-xs bg-white/80 border-green-200 text-green-800"
                          >
                            {relatedPost.category.name}
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2 leading-tight">
                        {relatedPost.title}
                      </h3>

                      <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 line-clamp-2 leading-relaxed hidden sm:block">
                        {relatedPost.excerpt}
                      </p>

                      <div className="flex items-center justify-between text-[9px] sm:text-[10px] md:text-xs text-gray-500">
                        <span>
                          {relatedPost.publishedAt
                            ? format(
                                new Date(relatedPost.publishedAt),
                                "d MMM yyyy"
                              )
                            : format(new Date(), "d MMM yyyy")}
                        </span>
                        {relatedPost.readingTime && (
                          <span>{relatedPost.readingTime} min</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="text-center mt-4 sm:mt-6 md:mt-8">
                <Link
                  href={
                    post.category
                      ? `/blog/category/${post.category.slug}`
                      : "/blog"
                  }
                  className="inline-flex items-center gap-1.5 sm:gap-2 bg-blue-600 text-white px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-full text-xs sm:text-sm md:text-base font-medium hover:bg-blue-700 transition-colors duration-200"
                >
                  <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">
                    Vezi toate articolele din{" "}
                    {post.category?.name || "categoria aceasta"}
                  </span>
                  <span className="sm:hidden">Vezi mai multe</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Call to Action - Compact on Mobile */}
        <div className="max-w-4xl mx-auto mt-6 sm:mt-8 md:mt-12">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex justify-center mb-3 sm:mb-4 md:mb-6">
                <div className="p-2 sm:p-3 md:p-4 bg-white/20 rounded-full backdrop-blur-sm">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white" />
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 md:mb-4">
                Explore Our STEM Collection
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto leading-snug sm:leading-relaxed">
                Discover educational toys that make learning fun and engaging
                for children of all ages. From science experiments to coding
                robots, we have everything to spark curiosity and creativity.
              </p>
              <Button
                asChild
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 text-sm sm:text-base md:text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Link href="/products">Shop STEM Toys</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Back to Blog - Compact on Mobile */}
        <div className="flex justify-center mt-8 sm:mt-12 md:mt-16">
          <Link href="/blog">
            <Button
              variant="outline"
              size="lg"
              className="flex items-center gap-2 sm:gap-3 hover:bg-gray-50 px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 text-sm sm:text-base md:text-lg font-medium rounded-full border-2 hover:border-gray-300 transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              {t("backToBlog", "Back to Blog")}
            </Button>
          </Link>
        </div>
      </article>
    </div>
  );
}
