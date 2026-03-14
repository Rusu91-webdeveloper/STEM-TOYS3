// import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import React from "react";

import BlogPostDetail from "@/features/blog/components/BlogPostDetail";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { getBlogPost, getRelatedPosts } from "@/lib/api/blog";
import {
  validateStructuredData,
  generateSEOTrackingData,
} from "@/lib/utils/seo";

export { generateMetadata } from "./metadata";

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

    // Get related posts for internal linking
    const relatedPosts = await getRelatedPosts(
      blogPost.id,
      blogPost.categoryId,
      blogPost.tags,
      blogPost.stemCategory
    );

    // Get AI metadata for enhanced schemas
    const aiMetadata = (blogPost as any).metadata?.ai || {};
    const seoMetadata = (blogPost as any).metadata?.seo || {};
    const socialOptimization = aiMetadata.socialOptimization || {};

    // Get FAQ schema if available from AI metadata
    const faqQuestions = aiMetadata.contentAnalysis?.questions || [];
    const faqSchema =
      faqQuestions.length > 0
        ? {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqQuestions.map((q: any) => ({
              "@type": "Question",
              name: q.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: q.answer,
              },
            })),
          }
        : null;

    // Prepare structured data array
    const structuredData = [
      // Breadcrumb schema
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `https://techtots.ro`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item: `https://techtots.ro/blog`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: blogPost.category?.name || "Articole",
            item: `https://techtots.ro/blog/category/${blogPost.category?.slug}`,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: blogPost.title,
            item: `https://techtots.ro/blog/${slug}`,
          },
        ],
      },
      // Article schema (enhanced)
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: blogPost.title,
        description: blogPost.excerpt,
        image: [
          blogPost.coverImage,
          socialOptimization.facebook?.image,
          socialOptimization.instagram?.image,
          socialOptimization.tiktok?.image,
        ].filter(Boolean),
        datePublished: blogPost.publishedAt,
        dateModified: blogPost.updatedAt || blogPost.publishedAt,
        author: {
          "@type": "Organization",
          name: "TechTots Editorial",
          url: "https://www.techtots.ro/authors/techtots-editorial",
          sameAs: [
            "https://www.techtots.ro/authors/techtots-editorial",
            "https://www.linkedin.com/company/techtots-romania/",
            "https://www.instagram.com/techtots_magazin/",
          ],
        },
        publisher: {
          "@type": "Organization",
          name: "TechTots România",
          url: "https://techtots.ro",
          logo: {
            "@type": "ImageObject",
            url: "https://techtots.ro/images/logo.png",
          },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `https://techtots.ro/blog/${slug}`,
        },
        articleSection: blogPost.category?.name || "Educație STEM",
        keywords: blogPost.tags?.join(", ") || "",
        wordCount:
          aiMetadata.contentAnalysis?.wordCount || blogPost.content?.length / 5,
        timeRequired: `PT${Math.ceil((aiMetadata.contentAnalysis?.wordCount || blogPost.content?.length / 5) / 200)}M`,
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: [".article-title", ".article-intro"],
        },
        about: seoMetadata.focusKeyword
          ? {
              "@type": "Thing",
              name: seoMetadata.focusKeyword,
            }
          : undefined,
      },
    ];

    // Add FAQ schema if available
    if (faqSchema) {
      structuredData.push(faqSchema);
    }

    // Add Image schema for hero image and AI-optimized images
    if (
      blogPost.coverImage ||
      socialOptimization.facebook?.image ||
      socialOptimization.instagram?.image
    ) {
      const imageUrls = [
        blogPost.coverImage,
        socialOptimization.facebook?.image,
        socialOptimization.instagram?.image,
      ].filter(Boolean);

      imageUrls.forEach((imageUrl, index) => {
        structuredData.push({
          "@context": "https://schema.org",
          "@type": "ImageObject",
          url: imageUrl,
          width: index === 0 ? 1200 : 800,
          height: index === 0 ? 630 : 600,
          caption: blogPost.title,
          description: blogPost.excerpt,
          author: "TechTots România",
          publisher: "TechTots România",
          representativeOfPage: index === 0 ? "true" : undefined,
        });
      });
    }

    // Validate structured data in development
    if (process.env.NODE_ENV === "development") {
      const validation = validateStructuredData(structuredData);
      if (!validation.isValid) {
        console.warn("SEO Schema Validation Errors:", validation.errors);
      }
      if (validation.warnings.length > 0) {
        console.warn("SEO Schema Validation Warnings:", validation.warnings);
      }
      console.log(`SEO Schema Validation Score: ${validation.score}/100`);
    }

    // Generate SEO tracking data (could be sent to analytics)
    const seoTrackingData = generateSEOTrackingData(blogPost);

    // Log SEO metrics in development
    if (process.env.NODE_ENV === "development") {
      console.log("SEO Tracking Data:", seoTrackingData);
    }

    // Pass blog post data to client component with enhanced structured data
    return (
      <>
        <SeoJsonLd data={structuredData} />
        <BlogPostDetail post={blogPost} relatedPosts={relatedPosts} />
      </>
    );
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return notFound();
  }
}
