import { Metadata, ResolvingMetadata } from "next";

import { getBlogPost } from "@/lib/api/blog";

type BlogPostPageProps = {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
  { params }: BlogPostPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    // Get blog post data
    const blogPost = await getBlogPost(params.slug);

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
      `${blogPost.stemCategory.toLowerCase()  } for kids`,
    ].filter(Boolean);

    // Create structured data for article rich results
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: blogPost.title,
      description: blogPost.excerpt,
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
        "@id": `https://techtots.com/blog/${params.slug}`,
      },
      keywords: keywords.join(", "),
    };

    return {
      title: `${blogPost.title} | TechTots Blog`,
      description: blogPost.excerpt,
      keywords,
      openGraph: {
        title: blogPost.title,
        description: blogPost.excerpt,
        type: "article",
        authors: blogPost.author?.name
          ? [blogPost.author.name]
          : ["TechTots Team"],
        publishedTime: blogPost.publishedAt,
        modifiedTime: blogPost.updatedAt || blogPost.publishedAt,
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
        canonical: `https://techtots.com/blog/${params.slug}`,
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