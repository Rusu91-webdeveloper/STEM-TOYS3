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
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n";
import EnhancedMarkdownRenderer from "@/components/blog/EnhancedMarkdownRenderer";

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

interface BlogPostTemplateProps {
  post: BlogPost;
  language?: string;
}

export default function ProfessionalBlogTemplate({
  post,
  language = "ro",
}: BlogPostTemplateProps) {
  const { t } = useTranslation();

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
              {post.title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed max-w-4xl mx-auto drop-shadow-lg">
              {post.excerpt}
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

              {/* Language Indicator */}
              <div className="flex items-center text-sm">
                <span className="mr-2">{language === "ro" ? "🇷🇴" : "🇬🇧"}</span>
                <span className="text-xs font-medium">
                  {language === "ro" ? "Română" : "English"}
                </span>
              </div>
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

                {/* Share Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-gray-50"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: post.title,
                        text: post.excerpt,
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

            {/* Main Content */}
            <div className="prose prose-lg max-w-none">
              <EnhancedMarkdownRenderer content={post.content} />
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
