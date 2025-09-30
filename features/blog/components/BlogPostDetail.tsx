"use client";

import React from "react";

import { BlogPost } from "@/lib/api/blog";
import ProfessionalBlogTemplate from "@/components/blog/ProfessionalBlogTemplate";

interface BlogPostDetailProps {
  post: BlogPost;
  relatedPosts?: BlogPost[];
}

export default function BlogPostDetail({
  post,
  relatedPosts,
}: BlogPostDetailProps) {
  if (!post) {
    return <div className="container py-12">Post not found</div>;
  }

  return <ProfessionalBlogTemplate post={post} relatedPosts={relatedPosts} />;
}
