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

    // Define article keywords based on categories and tags
    const keywords = [
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
        const lang = isRoSlug ? "ro" : isEnSlug ? "en" : "en";
        const ml = multilingual[lang] || {};
        localizedTitle = ml.title || localizedTitle;
        localizedExcerpt = ml.excerpt || localizedExcerpt;
      }
    } catch (_e) {}

    // Create structured data for article rich results
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: localizedTitle,
      description: localizedExcerpt,
      image: blogPost.coverImage || "",
      datePublished: blogPost.publishedAt,
      dateModified: blogPost.updatedAt || blogPost.publishedAt,
      author: {
        "@type": "Person",
        name: blogPost.author?.name || "TechTots Team",
      },
      publisher: {
        "@type": "Organization",
        name: "TechTots",
        logo: {
          "@type": "ImageObject",
          url: "https://techtots.com/TechTots_LOGO.png",
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": canonicalUrl,
      },
      keywords: keywords.join(", "),
    };

    return {
      title: `${localizedTitle} | TechTots Blog`,
      description: localizedExcerpt,
      keywords,
      openGraph: {
        title: localizedTitle,
        description: localizedExcerpt,
        type: "article",
        authors: blogPost.author?.name
          ? [blogPost.author.name]
          : ["TechTots Team"],
        publishedTime: blogPost.publishedAt
          ? new Date(blogPost.publishedAt).toISOString()
          : undefined,
        modifiedTime: blogPost.updatedAt
          ? new Date(blogPost.updatedAt).toISOString()
          : blogPost.publishedAt
            ? new Date(blogPost.publishedAt).toISOString()
            : undefined,
        section: blogPost.category?.name,
        tags: [
          blogPost.stemCategory,
          "STEM Education",
          blogPost.category?.name,
        ].filter(Boolean),
        images: blogPost.coverImage
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
        title: blogPost.title,
        description: blogPost.excerpt,
        images: blogPost.coverImage ? [blogPost.coverImage] : [],
      },
      alternates: {
        canonical: canonicalUrl,
        languages: {
          en: enUrl,
          ro: roUrl,
        },
      },
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
