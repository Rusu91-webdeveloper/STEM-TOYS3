// import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import React from "react";

import BlogPostDetail from "@/features/blog/components/BlogPostDetail";
import { getBlogPost } from "@/lib/api/blog";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  try {
    // Await params for Next.js 15
    const { slug } = await params;

    // Get blog post data
    const blogPost = await getBlogPost(slug);

    if (!blogPost) {
      return notFound();
    }

    // Pass blog post data to client component and render Breadcrumb JSON-LD
    return (
      <>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://www.techtots.ro/",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Blog",
                  item: "https://www.techtots.ro/blog",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: blogPost.title,
                  item: `https://www.techtots.ro/blog/${slug}`,
                },
              ],
            }),
          }}
        />
        <BlogPostDetail post={blogPost} />
      </>
    );
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return notFound();
  }
}
