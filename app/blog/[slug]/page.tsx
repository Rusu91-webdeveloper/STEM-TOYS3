import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import React from "react";

import BlogPostDetail from "@/features/blog/components/BlogPostDetail";
import { getBlogPost } from "@/lib/api/blog";

type BlogPostPageProps = {
  params: {
    slug: string;
  };
};



export default async function BlogPostPage({ params }: BlogPostPageProps) {
  try {
    // Get blog post data
    const blogPost = await getBlogPost(params.slug);

    if (!blogPost) {
      return notFound();
    }

    // Pass blog post data to client component
    return <BlogPostDetail post={blogPost} />;
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return notFound();
  }
}
