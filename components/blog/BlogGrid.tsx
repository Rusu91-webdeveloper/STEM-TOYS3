"use client";

import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { blogGlassCardClass } from "@/features/blog/components/blogTheme";

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`${blogGlassCardClass} h-full animate-pulse rounded-2xl border border-white/5`}
          >
            <div className="h-40 w-full rounded-t-2xl bg-white/10" />
            <div className="space-y-3 px-4 py-6">
              <div className="h-3 w-3/4 rounded-full bg-white/10" />
              <div className="h-3 w-full rounded-full bg-white/10" />
              <div className="h-3 w-5/6 rounded-full bg-white/10" />
              <div className="flex items-center gap-3 pt-4">
                <div className="h-8 w-8 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/2 rounded-full bg-white/10" />
                  <div className="h-3 w-1/3 rounded-full bg-white/10" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`${blogGlassCardClass} border border-red-400/40 bg-red-500/10 px-6 py-10 text-center text-red-200`}
      >
        <h2 className="text-xl font-semibold">{error}</h2>
        <p className="mt-2 text-sm text-red-100/80">
          Please refresh the page or try again later.
        </p>
      </div>
    );
  }

  // Additional safety check for blogPosts
  if (!Array.isArray(blogPosts) || blogPosts.length === 0) {
    return (
      <div
        className={`${blogGlassCardClass} flex flex-col items-center justify-center border border-white/10 px-8 py-16 text-center text-white`}
      >
        <Image
          src="/images/empty-state.svg"
          alt="No blog posts"
          width={180}
          height={180}
          className="mb-6 opacity-90"
        />
        <h2 className="text-2xl font-semibold">No blog posts found</h2>
        <p className="mt-2 max-w-md text-sm text-white/80">
          Check back soon for new experiments, insights, and STEM learning
          strategies from our experts.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {blogPosts.map(post => (
        <Card
          key={post.id}
          className={`${blogGlassCardClass} group relative overflow-hidden border border-white/10 transition-all duration-300 hover:border-white/20 hover:shadow-2xl hover:shadow-indigo-900/40`}
        >
          {/* Image section - compact for 2-column layout */}
          <div className="relative h-40 w-full overflow-hidden">
            <Image
              src={post.coverImage || getDefaultImage(post.stemCategory)}
              alt={post.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />

            {/* Category badge - very compact */}
            <div className="absolute left-4 top-4">
              <Badge
                variant="secondary"
                className="bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow backdrop-blur-sm"
              >
                {post.category?.name || post.stemCategory}
              </Badge>
            </div>

            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent" />
          </div>

          {/* Content section - very compact */}
          <CardContent className="flex flex-1 flex-col gap-3 px-5 py-6">
            <Link href={`/blog/${post.slug}`} className="group space-y-2">
              <h3 className="text-base font-semibold leading-tight text-white transition-colors duration-200 group-hover:text-indigo-200 line-clamp-2">
                {post.title}
              </h3>
              <p className="text-sm leading-relaxed text-white/70 line-clamp-3">
                {post.excerpt}
              </p>
            </Link>

            {/* Author and date section - very compact */}
            <div className="mt-auto flex items-center gap-3 border-t border-white/10 pt-4">
              <Avatar className="h-9 w-9 border border-white/10">
                <AvatarImage
                  src={post.author?.avatarUrl || undefined}
                  alt={post.author?.name || "Author"}
                />
                <AvatarFallback className="text-sm font-semibold">
                  {post.author?.name?.[0] || "T"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <span className="block truncate text-sm font-medium text-white">
                  {post.author?.name || "TechTots Team"}
                </span>
                <span className="text-xs text-white/60">
                  {post.publishedAt
                    ? format(new Date(post.publishedAt), "MMM d")
                    : ""}
                </span>
              </div>

              {/* Read more arrow - very small */}
              <div className="flex-shrink-0 text-indigo-200 transition-transform duration-200 group-hover:translate-x-1">
                <svg
                  className="h-4 w-4"
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
