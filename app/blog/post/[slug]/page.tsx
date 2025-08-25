"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import ProfessionalBlogTemplate from "@/components/blog/ProfessionalBlogTemplate";

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">{t("loading")} ...</p>
        </div>
      </div>
    );
  }

  if (error || !blogPost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex justify-center items-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {error || t("blogPostNotFound", "Blog post not found")}
            </h2>
            <p className="text-gray-600 mb-6">
              The blog post you're looking for doesn't exist or has been moved.
            </p>
            <Link href="/blog">
              <Button className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("backToBlog", "Back to Blog")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <ProfessionalBlogTemplate post={blogPost} language={language} />;
}
