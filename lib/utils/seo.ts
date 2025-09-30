import { Metadata } from "next";

import { createMetadata } from "../metadata";
import { SITE_URL } from "@/lib/site";

type SeoMetadata = {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  structuredData?: Record<string, any>;
  canonical?: string;
};

// Default SEO keywords for STEM toys focused on Romanian market
const defaultStemKeywords = [
  // Romanian keywords
  "jucării STEM",
  "jucării educative România",
  "jucării știință București",
  "jucării tehnologie copii",
  "jucării inginerie",
  "jucării matematică",
  "jocuri educative",
  "jucării educaționale STEM",
  "jocuri STEM România",
  "materiale educative",
  // English keywords
  "STEM toys Romania",
  "educational toys",
  "science toys",
  "technology toys",
  "engineering toys",
  "mathematics toys",
];

/**
 * Generate slug from text
 * @param text Text to convert to slug
 * @returns SEO-friendly slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim();
}

/**
 * Generate product metadata
 * @param product Product data
 * @returns Next.js metadata object
 */
export function generateProductMetadata(product: any): Metadata {
  // Parse metadata from product or create default
  const seoData: SeoMetadata = product.metadata
    ? typeof product.metadata === "string"
      ? JSON.parse(product.metadata)
      : product.metadata
    : {};

  // Get category name safely
  const categoryName =
    product.stemDiscipline ||
    (typeof product.category === "object" && product.category
      ? product.category.name || "STEM Toy"
      : typeof product.category === "string"
        ? product.category
        : "STEM Toy");

  // Define age range for better SEO targeting
  const ageRange =
    product.ageRange ||
    (product.attributes?.age ? product.attributes.age : "8-12");

  // Define unique keywords for this product in both Romanian and English
  const keywords = [
    ...(seoData.keywords || []),
    // Romanian keywords
    `${product.name} jucărie educativă`,
    `${categoryName} pentru copii`,
    `jucării STEM ${ageRange} ani`,
    `jucării educaționale ${categoryName.toLowerCase()}`,
    `jocuri educative România`,
    `${categoryName} educativ`,
    `cadou educațional copii`,
    // English keywords
    product.name,
    `${categoryName} toy`,
    `STEM toys ${ageRange} years`,
    `educational ${categoryName.toLowerCase()} toys`,
  ];

  // Determine brand from supplier when available, fallback to site brand
  const brandName = product?.supplier?.companyName || "TechTots";

  // Map DB ratings fields
  const ratingValue = product.averageRating || product.rating;
  const reviewCount = product.reviewCount || 0;

  // Determine GTIN key from barcode length
  const barcode: string | undefined = product.barcode || undefined;
  const gtinKey =
    typeof barcode === "string"
      ? barcode.length === 8
        ? "gtin8"
        : barcode.length === 12
          ? "gtin12"
          : barcode.length === 13
            ? "gtin13"
            : barcode.length === 14
              ? "gtin14"
              : "gtin"
      : undefined;

  // Convert attributes/specs to additionalProperty array
  const additionalProperty: any[] = [];
  if (product.attributes && typeof product.attributes === "object") {
    for (const [key, value] of Object.entries(product.attributes)) {
      if (value == null) continue;
      additionalProperty.push({
        "@type": "PropertyValue",
        name: key,
        value: Array.isArray(value) ? value.join(", ") : String(value),
      });
    }
  }
  if (product.weight != null) {
    additionalProperty.push({
      "@type": "PropertyValue",
      name: "weight",
      value: String(product.weight),
    });
  }
  if (product.dimensions && typeof product.dimensions === "object") {
    additionalProperty.push({
      "@type": "PropertyValue",
      name: "dimensions",
      value: JSON.stringify(product.dimensions),
    });
  }

  // Create structured data for the product
  const productData: Record<string, any> = seoData.structuredData || {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images?.[0] || "",
    sku: product.sku || product.id,
    mpn: product.id,
    brand: { "@type": "Brand", name: brandName },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product.slug}`,
      priceCurrency: "RON",
      price: product.price,
      priceValidUntil: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      availability: product.isActive
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "TechTots",
      },
    },
    audience: {
      "@type": "PeopleAudience",
      suggestedMinAge: parseInt(ageRange.split("-")[0]),
      suggestedMaxAge: parseInt(ageRange.split("-")[1]),
    },
    category: categoryName,
  };

  // Add review information if available
  if (ratingValue) {
    (productData as any).aggregateRating = {
      "@type": "AggregateRating",
      ratingValue,
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Add GTIN when available
  if (gtinKey && barcode) {
    (productData as any)[gtinKey] = barcode;
  }

  // Attach additionalProperty if any
  if (additionalProperty.length > 0) {
    (productData as any).additionalProperty = additionalProperty;
  }

  // Add BreadcrumbList JSON-LD for product detail page
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: `${SITE_URL}/products`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${SITE_URL}/products/${product.slug}`,
      },
    ],
  };

  // Optional FAQ schema when metadata.seo.faq exists
  let faqData: Record<string, any> | undefined;
  const faq = (seoData as any)?.faq;
  if (Array.isArray(faq) && faq.length > 0) {
    faqData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq
        .filter((q: any) => q?.question && q?.answer)
        .map((q: any) => ({
          "@type": "Question",
          name: q.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: q.answer,
          },
        })),
    };
  }

  // Create translations for this product
  const safeDescription = product.description || "";
  const translations = {
    ro: {
      title: seoData.metaTitle
        ? seoData.metaTitle
        : `${product.name} | TechTots - Jucării STEM`,
      description: seoData.metaDescription
        ? seoData.metaDescription
        : safeDescription.length > 160
          ? `${safeDescription.substring(0, 157)}...`
          : safeDescription,
    },
    en: {
      title: seoData.metaTitle
        ? seoData.metaTitle
        : `${product.name} | TechTots - STEM Toys`,
      description: seoData.metaDescription
        ? seoData.metaDescription
        : safeDescription.length > 160
          ? `${safeDescription.substring(0, 157)}...`
          : safeDescription,
    },
  };

  // Return metadata using the createMetadata utility
  return createMetadata({
    title: "metaTitle" as any,
    description: "metaDescription" as any,
    keywords,
    structuredData: faqData
      ? [productData, breadcrumbData, faqData]
      : [productData, breadcrumbData],
    canonicalUrl: seoData.canonical || `${SITE_URL}/products/${product.slug}`,
    ogImage: product.images?.[0] || "/opengraph-image.png",
    pathWithoutLocale: `/products/${product.slug}`,
    translations,
  });
}

/**
 * Generate category metadata
 * @param category Category data
 * @returns Next.js metadata object
 */
export function generateCategoryMetadata(category: any): Metadata {
  // Parse metadata from category or create default
  const seoData: SeoMetadata = category.metadata
    ? typeof category.metadata === "string"
      ? JSON.parse(category.metadata)
      : category.metadata
    : {};

  // Define unique keywords for this category
  const keywords = [
    ...(seoData.keywords || []),
    // Romanian keywords
    `${category.name} jucării`,
    `jucării ${category.name} pentru copii`,
    `jucării educaționale ${category.name}`,
    `jocuri STEM ${category.name}`,
    `magazin ${category.name} România`,
    // English keywords
    `${category.name} toys`,
    `${category.name} for kids`,
    `educational ${category.name} toys`,
    `STEM ${category.name} toys`,
  ];

  // Create structured data for the category
  const structuredData = seoData.structuredData || {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description:
      category.description ||
      `Browse our ${category.name} STEM toys collection`,
    url: `${SITE_URL}/categories/${category.slug}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: [], // This would be populated dynamically with products
    },
  };

  // Create breadcrumb structured data
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${SITE_URL}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Categories",
        item: `${SITE_URL}/categories`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: category.name,
        item: `${SITE_URL}/categories/${category.slug}`,
      },
    ],
  };

  // Create translations for this category
  const translations = {
    ro: {
      title: seoData.metaTitle
        ? seoData.metaTitle
        : `${category.name} | Jucării STEM | TechTots`,
      description: seoData.metaDescription
        ? seoData.metaDescription
        : category.description ||
          `Descoperă colecția noastră de jucării STEM din categoria ${category.name} pentru copiii pasionați de știință, tehnologie, inginerie și matematică.`,
    },
    en: {
      title: seoData.metaTitle
        ? seoData.metaTitle
        : `${category.name} | STEM Toys | TechTots`,
      description: seoData.metaDescription
        ? seoData.metaDescription
        : category.description ||
          `Discover our collection of ${category.name} STEM toys for children passionate about science, technology, engineering, and mathematics.`,
    },
  };

  // Return metadata using the createMetadata utility
  return createMetadata({
    title: "metaTitle" as any,
    description: "metaDescription" as any,
    keywords: [...defaultStemKeywords, ...keywords],
    structuredData: [structuredData, breadcrumbData],
    canonicalUrl:
      seoData.canonical || `${SITE_URL}/categories/${category.slug}`,
    ogImage: category.image || "/opengraph-image.png",
    pathWithoutLocale: `/categories/${category.slug}`,
    translations,
  });
}

/**
 * Generate blog metadata
 * @param blog Blog data
 * @returns Next.js metadata object
 */
export function generateBlogMetadata(blog: any): Metadata {
  // Parse metadata from blog or create default
  const seoData: SeoMetadata = blog.metadata
    ? typeof blog.metadata === "string"
      ? JSON.parse(blog.metadata)
      : blog.metadata
    : {};

  const stemCategoryMap: Record<string, string> = {
    SCIENCE: "știință",
    TECHNOLOGY: "tehnologie",
    ENGINEERING: "inginerie",
    MATHEMATICS: "matematică",
    GENERAL: "educație",
  };

  // Get STEM category in Romanian
  const stemCategory =
    (blog.stemCategory && stemCategoryMap[blog.stemCategory as string]) ||
    "educație";

  // Define unique keywords for this blog
  const keywords = [
    ...(seoData.keywords || []),
    // Romanian keywords
    `articole despre ${stemCategory}`,
    `blog ${stemCategory} pentru copii`,
    `activități ${stemCategory} acasă`,
    `idei ${stemCategory} copii`,
    `învățare prin ${stemCategory}`,
    // English keywords
    `${stemCategory} articles`,
    `${stemCategory} blog for kids`,
    `${stemCategory} activities at home`,
    `${stemCategory} ideas for children`,
    `learning through ${stemCategory}`,
    ...blog.tags,
  ];

  // Create Article structured data
  const structuredData = seoData.structuredData || {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.excerpt,
    image: blog.coverImage || "",
    author: {
      "@type": "Person",
      name: blog.author?.name || "TechTots Team",
    },
    publisher: {
      "@type": "Organization",
      name: "TechTots",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/TechTots_LOGO.png`,
      },
    },
    datePublished: blog.publishedAt || blog.createdAt,
    dateModified: blog.updatedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${blog.slug}`,
    },
    keywords: blog.tags.join(", "),
  };

  // Create translations for this blog
  const translations = {
    ro: {
      title: seoData.metaTitle ? seoData.metaTitle : blog.title,
      description: seoData.metaDescription
        ? seoData.metaDescription
        : blog.excerpt,
    },
    en: {
      title: seoData.metaTitle ? seoData.metaTitle : blog.title,
      description: seoData.metaDescription
        ? seoData.metaDescription
        : blog.excerpt,
    },
  };

  // Return metadata using the createMetadata utility
  return createMetadata({
    title: "metaTitle" as any,
    description: "metaDescription" as any,
    keywords,
    structuredData,
    canonicalUrl: seoData.canonical || `${SITE_URL}/blog/${blog.slug}`,
    ogImage: blog.coverImage || "/opengraph-image.png",
    pathWithoutLocale: `/blog/${blog.slug}`,
    translations,
  });
}

/**
 * Generate book metadata
 * @param book Book data
 * @returns Next.js metadata object
 */
export function generateBookMetadata(book: any): Metadata {
  // Parse metadata from book or create default
  const seoData: SeoMetadata = book.metadata
    ? typeof book.metadata === "string"
      ? JSON.parse(book.metadata)
      : book.metadata
    : {};

  // Get available languages
  const languages = book.languages?.map((l: any) => l.name) || ["Romanian"];
  const languagesString = languages.join(", ");

  // Define unique keywords for this book
  const keywords = [
    ...(seoData.keywords || []),
    // Romanian keywords
    `carte ${book.name}`,
    `carte educațională`,
    `carte pentru copii`,
    `autor ${book.author}`,
    `cărți STEM`,
    `literatură educativă`,
    `cărți disponibile în ${languagesString}`,
    // English keywords
    `book ${book.name}`,
    `educational book`,
    `children's book`,
    `author ${book.author}`,
    `STEM books`,
    `educational literature`,
    `books available in ${languagesString}`,
  ];

  // Create Book structured data
  const structuredData = seoData.structuredData || {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.name,
    author: {
      "@type": "Person",
      name: book.author,
    },
    bookFormat: "Hardcover",
    datePublished: book.createdAt,
    image: book.coverImage || "",
    inLanguage: languages,
    publisher: {
      "@type": "Organization",
      name: "TechTots",
    },
    offers: {
      "@type": "Offer",
      availability: book.isActive
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      price: book.price,
      priceCurrency: "RON",
      url: `${SITE_URL}/books/${book.slug}`,
    },
  };

  // Create translations for this book
  const safeBookDescription = book.description || "";
  const translations = {
    ro: {
      title: seoData.metaTitle
        ? seoData.metaTitle
        : `${book.name} | Carte de ${book.author} | TechTots`,
      description: seoData.metaDescription
        ? seoData.metaDescription
        : safeBookDescription.length > 160
          ? `${safeBookDescription.substring(0, 157)}...`
          : safeBookDescription,
    },
    en: {
      title: seoData.metaTitle
        ? seoData.metaTitle
        : `${book.name} | Book by ${book.author} | TechTots`,
      description: seoData.metaDescription
        ? seoData.metaDescription
        : safeBookDescription.length > 160
          ? `${safeBookDescription.substring(0, 157)}...`
          : safeBookDescription,
    },
  };

  // Return metadata using the createMetadata utility
  return createMetadata({
    title: "metaTitle" as any,
    description: "metaDescription" as any,
    keywords,
    structuredData,
    canonicalUrl: seoData.canonical || `${SITE_URL}/books/${book.slug}`,
    ogImage: book.coverImage || "/opengraph-image.png",
    pathWithoutLocale: `/books/${book.slug}`,
    translations,
  });
}

/**
 * Generate homepage metadata from store settings
 * @param storeSettings Store settings data
 * @returns Next.js metadata object
 */
export function generateHomepageMetadata(storeSettings: any): Metadata {
  // Parse additional metadata if available
  const seoData: SeoMetadata = storeSettings.metadata
    ? typeof storeSettings.metadata === "string"
      ? JSON.parse(storeSettings.metadata)
      : storeSettings.metadata
    : {};

  // Define keywords for homepage
  const keywordsArray = storeSettings.metaKeywords
    ? storeSettings.metaKeywords.split(",").map((k: string) => k.trim())
    : defaultStemKeywords;

  // Create translations for homepage
  const translations = {
    ro: {
      title: "TechTots | Jucării STEM pentru Minți Curioase",
      description:
        "Descoperă cele mai bune jucării STEM pentru minți curioase la TechTots. Jucării educaționale care fac învățarea distractivă pentru copii de toate vârstele.",
    },
    en: {
      title:
        storeSettings.metaTitle || "TechTots | STEM Toys for Curious Minds",
      description:
        storeSettings.metaDescription ||
        "Discover the best STEM toys for curious minds at TechTots. Educational toys that make learning fun for children of all ages.",
    },
  };

  // Return metadata using the createMetadata utility
  return createMetadata({
    title: "metaTitle" as any,
    description: "metaDescription" as any,
    keywords: keywordsArray,
    structuredData: seoData.structuredData,
    canonicalUrl: storeSettings.storeUrl || SITE_URL,
    ogImage: "/opengraph-image.png",
    pathWithoutLocale: "/",
    translations,
  });
}

/**
 * Validate structured data schema
 * @param structuredData Array of structured data objects
 * @returns Validation result with errors and warnings
 */
export function validateStructuredData(structuredData: any[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  structuredData.forEach((data, index) => {
    // Check required @context
    if (!data["@context"]) {
      errors.push(`Schema ${index}: Missing @context`);
    }

    // Check required @type
    if (!data["@type"]) {
      errors.push(`Schema ${index}: Missing @type`);
    }

    // Type-specific validations
    switch (data["@type"]) {
      case "Article":
        if (!data.headline) warnings.push(`Article ${index}: Missing headline`);
        if (!data.description)
          warnings.push(`Article ${index}: Missing description`);
        if (!data.mainEntityOfPage)
          errors.push(`Article ${index}: Missing mainEntityOfPage`);
        if (!data.author) warnings.push(`Article ${index}: Missing author`);
        if (!data.publisher)
          warnings.push(`Article ${index}: Missing publisher`);
        break;

      case "BreadcrumbList":
        if (!data.itemListElement || !Array.isArray(data.itemListElement)) {
          errors.push(
            `BreadcrumbList ${index}: Missing or invalid itemListElement`
          );
        } else {
          data.itemListElement.forEach((item: any, itemIndex: number) => {
            if (!item.position)
              errors.push(
                `BreadcrumbList ${index}, item ${itemIndex}: Missing position`
              );
            if (!item.name)
              errors.push(
                `BreadcrumbList ${index}, item ${itemIndex}: Missing name`
              );
            if (!item.item)
              errors.push(
                `BreadcrumbList ${index}, item ${itemIndex}: Missing item URL`
              );
          });
        }
        break;

      case "Organization":
        if (!data.name) errors.push(`Organization ${index}: Missing name`);
        if (!data.url) errors.push(`Organization ${index}: Missing url`);
        break;

      case "FAQPage":
        if (!data.mainEntity || !Array.isArray(data.mainEntity)) {
          errors.push(`FAQPage ${index}: Missing or invalid mainEntity`);
        } else {
          data.mainEntity.forEach((faq: any, faqIndex: number) => {
            if (!faq.name)
              errors.push(
                `FAQPage ${index}, FAQ ${faqIndex}: Missing question name`
              );
            if (!faq.acceptedAnswer?.text)
              errors.push(
                `FAQPage ${index}, FAQ ${faqIndex}: Missing answer text`
              );
          });
        }
        break;

      case "ImageObject":
        if (!data.url) errors.push(`ImageObject ${index}: Missing url`);
        if (!data.caption && !data.description) {
          warnings.push(`ImageObject ${index}: Missing caption or description`);
        }
        break;
    }
  });

  const totalChecks = structuredData.length * 5; // Rough estimate of checks per schema
  const errorPenalty = errors.length * 20;
  const warningPenalty = warnings.length * 5;
  const score = Math.max(0, 100 - errorPenalty - warningPenalty);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score,
  };
}

/**
 * Generate SEO performance tracking data
 * @param blogPost Blog post data
 * @returns Performance tracking data
 */
export function generateSEOTrackingData(blogPost: any) {
  const aiMetadata = blogPost.metadata?.ai || {};
  const seoMetadata = blogPost.metadata?.seo || {};

  return {
    blogId: blogPost.id,
    slug: blogPost.slug,
    title: blogPost.title,
    category: blogPost.category?.name,
    stemCategory: blogPost.stemCategory,
    hasAIMetadata: !!blogPost.metadata?.ai,
    hasSEOMetadata: !!blogPost.metadata?.seo,
    hasSocialOptimization: !!aiMetadata.socialOptimization,
    hasContentAnalysis: !!aiMetadata.contentAnalysis,
    hasKeywordOptimization: !!aiMetadata.keywordOptimization,
    hasFAQContent: !!(aiMetadata.contentAnalysis?.questions?.length > 0),
    wordCount:
      aiMetadata.contentAnalysis?.wordCount || blogPost.content?.length / 5,
    readingTime:
      aiMetadata.contentAnalysis?.readingTime || blogPost.readingTime,
    seoScore: seoMetadata.seoScore || aiMetadata.seoScore,
    focusKeyword: seoMetadata.focusKeyword,
    metaTitleLength: (seoMetadata.metaTitle || blogPost.title).length,
    metaDescriptionLength: (seoMetadata.metaDescription || blogPost.excerpt)
      .length,
    hasOpenGraph: true, // Always true now
    hasTwitterCard: true, // Always true now
    hasArticleSchema: true, // Always true now
    hasBreadcrumbSchema: true, // Always true now
    hasImageSchema: !!(
      blogPost.coverImage || aiMetadata.socialOptimization?.facebook?.image
    ),
    hasFAQSchema: !!(aiMetadata.contentAnalysis?.questions?.length > 0),
    hasOrganizationSchema: true, // Added to layout
    publishedAt: blogPost.publishedAt,
    tagsCount: blogPost.tags?.length || 0,
    socialShares: blogPost.socialShares || 0,
    viralScore: blogPost.viralScore || 0,
  };
}
