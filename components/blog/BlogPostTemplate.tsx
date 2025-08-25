"use client";

import { format } from "date-fns";
import { ArrowLeft, Calendar, User, Tag, Clock, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n";
import MarkdownRenderer from "@/components/blog/MarkdownRenderer";

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

export default function BlogPostTemplate({ post, language = "ro" }: BlogPostTemplateProps) {
  const { t } = useTranslation();

  if (!post) {
    return (
      <div className="container py-12 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Post not found</h2>
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
        return "bg-blue-600";
      case "TECHNOLOGY":
        return "bg-green-600";
      case "ENGINEERING":
        return "bg-yellow-600";
      case "MATHEMATICS":
        return "bg-red-600";
      default:
        return "bg-indigo-600";
    }
  };

  const getCategoryGradient = (category?: string) => {
    switch (category) {
      case "SCIENCE":
        return "from-blue-100 to-cyan-100 text-blue-800 hover:from-blue-200 hover:to-cyan-200";
      case "TECHNOLOGY":
        return "from-green-100 to-emerald-100 text-green-800 hover:from-green-200 hover:to-emerald-200";
      case "ENGINEERING":
        return "from-yellow-100 to-orange-100 text-yellow-800 hover:from-yellow-200 hover:to-orange-200";
      case "MATHEMATICS":
        return "from-red-100 to-pink-100 text-red-800 hover:from-red-200 hover:to-pink-200";
      default:
        return "from-purple-100 to-pink-100 text-purple-800 hover:from-purple-200 hover:to-pink-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <article className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/blog"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
            {t("backToBlog", "Back to Blog")}
          </Link>
        </div>

        {/* Header Section */}
        <div className="mb-12">
          {/* Category and STEM Badges */}
          <div className="flex flex-wrap gap-3 mb-6">
            {post.category && (
              <Link
                href={`/blog?category=${post.category.slug}`}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getCategoryGradient(
                  post.stemCategory
                )} transition-all duration-200 shadow-sm hover:shadow-md`}
              >
                {post.category.name}
              </Link>
            )}
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white shadow-sm ${getStemCategoryColor(
                post.stemCategory
              )}`}
            >
              {post.stemCategory}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            {post.title}
          </h1>

          {/* Excerpt */}
          <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl">
            {post.excerpt}
          </p>

          {/* Meta Information */}
          <div className="flex items-center gap-6 text-gray-600 border-t border-gray-200 pt-6">
            {/* Author */}
            {post.author && (
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-3 shadow-sm">
                  <span className="text-sm font-bold text-white">
                    {post.author.name?.[0] || "A"}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {post.author.name}
                  </span>
                  <div className="text-xs text-gray-500">Autor STEM</div>
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
              {post.readingTime || 5} min citire
            </div>

            {/* Language Indicator */}
            <div className="flex items-center text-sm">
              <span className="mr-2">{language === "ro" ? "🇷🇴" : "🇬🇧"}</span>
              <span className="text-xs font-medium">
                {language === "ro" ? "Română" : "English"}
              </span>
            </div>

            {/* Share Button */}
            <div className="ml-auto">
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
        </div>

        {/* Cover Image */}
        <div className="relative w-full aspect-[21/9] mb-12 rounded-2xl overflow-hidden shadow-2xl">
          <Image
            src={post.coverImage || getDefaultImage(post.stemCategory)}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        {/* Content Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 lg:p-12">
            <MarkdownRenderer content={post.content} />
          </div>
        </div>

        {/* Tags Section */}
        {post.tags && post.tags.length > 0 && (
          <div className="max-w-4xl mx-auto mt-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Tag className="h-5 w-5 mr-2" />
                {t("tags", "Tags")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 text-center border border-blue-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Explore our STEM toys collection
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Discover educational toys that make learning fun and engaging for
              children of all ages. From science experiments to coding robots,
              we have everything to spark curiosity and creativity.
            </p>
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Link href="/products">Shop STEM Toys</Link>
            </Button>
          </div>
        </div>

        {/* Back to Blog */}
        <div className="flex justify-center mt-12">
          <Link href="/blog">
            <Button variant="outline" size="lg" className="flex items-center gap-2 hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4" />
              {t("backToBlog", "Back to Blog")}
            </Button>
          </Link>
        </div>
      </article>
    </div>
  );
}
