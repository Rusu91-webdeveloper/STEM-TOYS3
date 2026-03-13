import { Metadata, ResolvingMetadata } from "next";

import { getBlogPost } from "@/lib/api/blog";
import { SITE_URL } from "@/lib/site";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
  { params }: BlogPostPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    const { slug } = await params;
    // Get blog post data
    const blogPost = await getBlogPost(slug);

    if (!blogPost) {
      return {
        title: "Blog Post Not Found",
        description: "The requested blog post could not be found",
      };
    }

    // Get previous images for fallback
    const previousImages = (await parent).openGraph?.images || [];

    // Get AI-generated SEO metadata
    const aiMetadata = (blogPost as any).metadata?.ai || {};
    const seoMetadata = (blogPost as any).metadata?.seo || {};

    // Use AI-generated meta data with fallbacks
    const metaTitle = seoMetadata.metaTitle || aiMetadata.seo?.metaTitle;
    const metaDescription =
      seoMetadata.metaDescription || aiMetadata.seo?.metaDescription;
    const metaKeywords =
      seoMetadata.metaKeywords || aiMetadata.seo?.metaKeywords || [];

    // Define comprehensive keywords including AI-generated ones
    const keywords = [
      // AI-generated keywords first
      ...(metaKeywords || []),
      // Article-specific keywords
      blogPost.title,
      blogPost.stemCategory,
      "STEM education",
      "educational blog",
      blogPost.category?.name || "",
      "TechTots blog",
      "learning resources",
      "educational content",
      `${blogPost.stemCategory.toLowerCase()} for kids`,
    ].filter(Boolean);

    // Determine language and alternates
    const isRoSlug = slug.endsWith("-ro");
    const isEnSlug = slug.endsWith("-en");
    const baseSlug = isRoSlug || isEnSlug ? slug.slice(0, -3) : slug;
    const roUrl = `${SITE_URL}/blog/${baseSlug}-ro`;
    const enUrl = `${SITE_URL}/blog/${baseSlug}-en`;
    const canonicalUrl = isRoSlug
      ? roUrl
      : isEnSlug
        ? enUrl
        : `${SITE_URL}/blog/${slug}`;

    // Localize title/excerpt if multilingual metadata is present
    let localizedTitle = blogPost.title;
    let localizedExcerpt = blogPost.excerpt;
    try {
      const meta: any = (blogPost as any).metadata || {};
      const multilingual = meta?.multilingual;
      const supportsBoth = meta?.language === "both";
      if (multilingual && supportsBoth) {
        const lang = isRoSlug ? "ro" : isEnSlug ? "en" : "ro";
        const ml = multilingual[lang] || {};
        localizedTitle = ml.title || localizedTitle;
        localizedExcerpt = ml.excerpt || localizedExcerpt;
      }
    } catch (_e) {}

    // Get social optimization data from AI metadata
    const socialOptimization = aiMetadata.socialOptimization || {};

    // Create enhanced structured data for article rich results
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: localizedTitle,
      description: localizedExcerpt,
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
        name: "TechTots România",
        url: "https://techtots.ro",
        logo: {
          "@type": "ImageObject",
          url: "https://techtots.ro/images/logo.png",
        },
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
        "@id": canonicalUrl,
      },
      articleSection: blogPost.category?.name || "Educație STEM",
      keywords: keywords.join(", "),
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
    };

    const alternates =
      ((blogPost as any).metadata?.language === "both" ||
        Boolean((blogPost as any).metadata?.multilingual)) &&
      (isRoSlug || isEnSlug)
        ? {
            canonical: canonicalUrl,
            languages: {
              en: enUrl,
              ro: roUrl,
            },
          }
        : {
            canonical: canonicalUrl,
          };

    return {
      title: `${localizedTitle} | TechTots Blog`,
      description: localizedExcerpt,
      keywords,
      openGraph: {
        title: socialOptimization.facebook?.title || localizedTitle,
        description:
          socialOptimization.facebook?.description || localizedExcerpt,
        type: "article",
        authors: ["TechTots România"],
        publishedTime: blogPost.publishedAt
          ? new Date(blogPost.publishedAt).toISOString()
          : undefined,
        modifiedTime: blogPost.updatedAt
          ? new Date(blogPost.updatedAt).toISOString()
          : blogPost.publishedAt
            ? new Date(blogPost.publishedAt).toISOString()
            : undefined,
        section: blogPost.category?.name || "Educație STEM",
        tags: [
          blogPost.stemCategory,
          "STEM Education",
          blogPost.category?.name,
          ...(blogPost.tags || []),
        ].filter(Boolean),
        images: socialOptimization.facebook?.image
          ? [
              {
                url: socialOptimization.facebook.image,
                width: 1200,
                height: 630,
                alt: socialOptimization.facebook.title || blogPost.title,
              },
            ]
          : blogPost.coverImage
            ? [
                {
                  url: blogPost.coverImage,
                  width: 1200,
                  height: 630,
                  alt: blogPost.title,
                },
              ]
            : previousImages,
      },
      twitter: {
        card: "summary_large_image",
        site: "@techtotsro",
        creator: "@techtotsro",
        title:
          socialOptimization.tiktok?.hook ||
          socialOptimization.facebook?.title ||
          localizedTitle,
        description:
          socialOptimization.tiktok?.description ||
          socialOptimization.facebook?.description ||
          localizedExcerpt,
        images: socialOptimization.instagram?.image
          ? [socialOptimization.instagram.image]
          : blogPost.coverImage
            ? [blogPost.coverImage]
            : [],
      },
      alternates,
      other: {
        structuredData: JSON.stringify(structuredData),
      },
    };
  } catch (error) {
    console.error("Error generating blog post metadata:", error);
    return {
      title: "Blog | TechTots",
      description: "Educational articles and resources for STEM learning",
    };
  }
}
