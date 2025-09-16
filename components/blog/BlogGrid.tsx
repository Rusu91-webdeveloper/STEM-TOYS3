"use client";

import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SkeletonCard } from "@/components/ui/skeleton";

export interface BlogPost {
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

interface BlogGridProps {
  blogPosts: BlogPost[];
  isLoading: boolean;
  error: string | null;
  getDefaultImage: (category: string) => string;
}

export function BlogGrid({
  blogPosts,
  isLoading,
  error,
  getDefaultImage,
}: BlogGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-12 text-lg font-semibold">
        {error}
      </div>
    );
  }

  if (blogPosts.length === 0) {
    return (
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
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
      {blogPosts.map(post => (
        <Card
          key={post.id}
          className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group-hover:scale-[1.01] border border-gray-100 dark:border-gray-700"
        >
          {/* Image section - compact for 2-column layout */}
          <div className="relative w-full h-24 sm:h-28 lg:h-32 overflow-hidden">
            <Image
              src={post.coverImage || getDefaultImage(post.stemCategory)}
              alt={post.title}
              fill
              sizes="(max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Category badge - very compact */}
            <div className="absolute top-1 left-1">
              <Badge
                variant="secondary"
                className="bg-white/95 text-indigo-700 font-medium text-xs px-1.5 py-0.5 shadow backdrop-blur-sm"
              >
                {post.category?.name || post.stemCategory}
              </Badge>
            </div>
          </div>

          {/* Content section - very compact */}
          <CardContent className="p-2 sm:p-3 flex flex-col flex-1">
            <Link href={`/blog/${post.slug}`} className="flex-1 group">
              <h3 className="text-xs sm:text-sm font-bold mb-1 group-hover:text-indigo-700 transition-colors line-clamp-2 leading-tight">
                {post.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs mb-2 line-clamp-2 leading-relaxed">
                {post.excerpt}
              </p>
            </Link>

            {/* Author and date section - very compact */}
            <div className="flex items-center gap-1.5 mt-auto pt-1.5 border-t border-gray-100 dark:border-gray-700">
              <Avatar className="h-5 w-5 flex-shrink-0">
                <AvatarImage
                  src={post.author?.avatarUrl || undefined}
                  alt={post.author?.name || "Author"}
                />
                <AvatarFallback className="text-xs">
                  {post.author?.name?.[0] || "T"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate block">
                  {post.author?.name || "TechTots Team"}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {post.publishedAt
                    ? format(new Date(post.publishedAt), "MMM d")
                    : ""}
                </span>
              </div>

              {/* Read more arrow - very small */}
              <div className="flex-shrink-0 text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform duration-200">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
