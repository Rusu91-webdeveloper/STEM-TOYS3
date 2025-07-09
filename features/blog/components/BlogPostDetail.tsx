"use client";

import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";
import { Share } from "@/components/ui/share";
import { BlogPost } from "@/lib/api/blog";
import { useTranslation } from "@/lib/i18n";

interface BlogPostDetailProps {
  post: BlogPost;
}

export default function BlogPostDetail({ post }: BlogPostDetailProps) {
  const { t } = useTranslation();

  if (!post) {
    return <div className="container py-12">Post not found</div>;
  }

  const getStemCategoryColor = (category: string) => {
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

  return (
    <article className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/blog"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t("backToBlog", "Back to Blog")}
        </Link>
      </div>

      {/* Header */}
      <div className="mb-10">
        <div className="flex flex-wrap gap-3 mb-4">
          {post.category && (
            <Link
              href={`/blog?category=${post.category.slug}`}
              className="text-xs font-medium px-2.5 py-0.5 rounded bg-purple-100 text-purple-800 hover:bg-purple-200"
            >
              {post.category.name}
            </Link>
          )}
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded text-white ${getStemCategoryColor(
              post.stemCategory
            )}`}
          >
            {post.stemCategory}
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
          {post.title}
        </h1>

        <div className="flex items-center gap-4 text-muted-foreground">
          {post.author && (
            <div className="flex items-center">
              {false ? (
                <div className="h-8 w-8 rounded-full overflow-hidden mr-2">
                  <Image
                    src="/placeholder-avatar.jpg"
                    alt={post.author.name || "Author"}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mr-2">
                  <span className="text-xs font-medium">
                    {post.author.name?.[0] || "A"}
                  </span>
                </div>
              )}
              <span className="text-sm">{post.author.name}</span>
            </div>
          )}

          <div className="text-sm">
            {post.publishedAt
              ? format(new Date(post.publishedAt), "MMM d, yyyy")
              : format(new Date(post.createdAt), "MMM d, yyyy")}
          </div>

          {/* Share buttons */}
          <Share
            url={`https://techtots.com/blog/${post.slug}`}
            title={post.title}
            text={post.excerpt}
          />
        </div>
      </div>

      {/* Cover image */}
      {post.coverImage && (
        <div className="relative w-full aspect-[16/9] mb-10 rounded-lg overflow-hidden">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            priority
            className="object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="prose prose-lg max-w-none">
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>

      {/* Call to action */}
      <div className="mt-12 p-6 bg-muted rounded-lg">
        <h2 className="text-xl font-semibold mb-2">
          Explore our STEM toys collection
        </h2>
        <p className="mb-4">
          Discover educational toys that make learning fun and engaging for
          children of all ages.
        </p>
        <Button asChild>
          <Link href="/products">Shop STEM Toys</Link>
        </Button>
      </div>

      {/* Related posts would go here */}
    </article>
  );
}
