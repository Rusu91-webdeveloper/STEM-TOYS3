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
      {/* Hero Section with Cover Image */}
      <div className="relative w-full h-[70vh] min-h-[500px] overflow-hidden">
        <Image
          src={post.coverImage || getDefaultImage(post.stemCategory)}
          alt={post.title}
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="container mx-auto px-4 text-center text-white">
            {/* Category Badges */}
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {post.category && (
                <Link
                  href={`/blog?category=${post.category.slug}`}
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-300`}
                >
                  {post.category.name}
                </Link>
              )}
              <span
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium text-white ${getStemCategoryColor(post.stemCategory)} shadow-lg`}
              >
                {getStemIcon(post.stemCategory)}
                <span className="ml-2">{post.stemCategory}</span>
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white drop-shadow-2xl">
              {currentContent.title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed max-w-4xl mx-auto drop-shadow-lg">
              {currentContent.excerpt}
            </p>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-white/80">
              {/* Author */}
              {post.author && (
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-3 shadow-lg">
                    <span className="text-lg font-bold text-white">
                      {post.author.name?.[0] || "A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white">
                      {post.author.name}
                    </span>
                    <div className="text-xs text-white/70">STEM Expert</div>
                  </div>
                </div>
              )}

              {/* Date */}
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 mr-2" />
                {post.publishedAt
                  ? format(new Date(post.publishedAt), "d MMMM yyyy")
                  : format(new Date(), "d MMMM yyyy")}
              </div>

              {/* Reading Time */}
              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 mr-2" />
                {post.readingTime || 5} min read
              </div>

              {/* Language Toggle */}
              {hasMultilingual && (
                <BlogLanguageToggle
                  onLanguageChange={handleLanguageChange}
                  currentLanguage={currentLanguage}
                  className="bg-white/20 backdrop-blur-sm border border-white/30"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <article className="container mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/blog"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
            {t("backToBlog", "Back to Blog")}
          </Link>
        </div>

        {/* Content Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 lg:p-16 border border-gray-100">
            {/* Content Header */}
            <div className="mb-12 pb-8 border-b border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div
                    className={`p-3 rounded-xl ${getCategoryGradient(post.stemCategory)}`}
                  >
                    {getStemIcon(post.stemCategory)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Article Overview
                    </h2>
                    <p className="text-gray-600">
                      Deep dive into {post.stemCategory.toLowerCase()} concepts
                    </p>
                  </div>
                </div>

                {/* Language Toggle and Share Button */}
                <div className="flex items-center gap-3">
                  {hasMultilingual && (
                    <BlogLanguageToggle
                      onLanguageChange={handleLanguageChange}
                      currentLanguage={currentLanguage}
                    />
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 hover:bg-gray-50"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: currentContent.title,
                          text: currentContent.excerpt,
                          url: window.location.href,
                        });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                      }
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="prose prose-lg max-w-none">
              <EnhancedMarkdownRenderer
                content={currentContent.content}
                socialOptimization={post.metadata?.ai?.socialOptimization}
                blogTitle={currentContent.title}
              />
            </div>
          </div>
        </div>

        {/* Tags Section */}
        {post.tags && post.tags.length > 0 && (
          <div className="max-w-4xl mx-auto mt-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h3 className="text-xl font-semibold mb-6 flex items-center">
                <Tag className="h-6 w-6 mr-3 text-blue-600" />
                Related Topics
              </h3>
              <div className="flex flex-wrap gap-3">
                {post.tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 px-4 py-2 text-sm font-medium"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Related Posts Section */}
        {relatedPosts && relatedPosts.length > 0 && (
          <div className="max-w-6xl mx-auto mt-12">
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Articole Similare
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Descoperă mai multe articole interesante din aceeași categorie
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedPosts.map(relatedPost => (
                  <Link
                    key={relatedPost.id}
                    href={`/blog/${relatedPost.slug}`}
                    className="group block bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className="aspect-video rounded-xl overflow-hidden mb-4 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
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

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-xs bg-white/80 border-blue-200 text-blue-800"
                        >
                          {relatedPost.stemCategory}
                        </Badge>
                        {relatedPost.category && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-white/80 border-green-200 text-green-800"
                          >
                            {relatedPost.category.name}
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2 leading-tight">
                        {relatedPost.title}
                      </h3>

                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {relatedPost.excerpt}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {relatedPost.publishedAt
                            ? format(
                                new Date(relatedPost.publishedAt),
                                "d MMM yyyy"
                              )
                            : format(new Date(), "d MMM yyyy")}
                        </span>
                        {relatedPost.readingTime && (
                          <span>{relatedPost.readingTime} min read</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="text-center mt-8">
                <Link
                  href={
                    post.category
                      ? `/blog/category/${post.category.slug}`
                      : "/blog"
                  }
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition-colors duration-200"
                >
                  <BookOpen className="h-4 w-4" />
                  Vezi toate articolele din{" "}
                  {post.category?.name || "categoria aceasta"}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Explore Our STEM Collection
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
                Discover educational toys that make learning fun and engaging
                for children of all ages. From science experiments to coding
                robots, we have everything to spark curiosity and creativity.
              </p>
              <Button
                asChild
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Link href="/products">Shop STEM Toys</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Back to Blog */}
        <div className="flex justify-center mt-16">
          <Link href="/blog">
            <Button
              variant="outline"
              size="lg"
              className="flex items-center gap-3 hover:bg-gray-50 px-8 py-4 text-lg font-medium rounded-full border-2 hover:border-gray-300 transition-all duration-300"
            >
              <ArrowLeft className="h-5 w-5" />
              {t("backToBlog", "Back to Blog")}
            </Button>
          </Link>
        </div>
      </article>
    </div>
  );
}
