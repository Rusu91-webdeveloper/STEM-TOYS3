import { Metadata } from "next";
import { createMetadata } from "../metadata";

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
    product.stemCategory ||
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

  // Create structured data for the product
  const structuredData = seoData.structuredData || {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images?.[0] || "",
    sku: product.sku || product.id,
    mpn: product.id,
    brand: {
      "@type": "Brand",
      name: "TechTots",
    },
    offers: {
      "@type": "Offer",
      url: `https://techtots.com/products/${product.slug}`,
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
  if (product.rating) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount || 0,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Create translations for this product
  const translations = {
    ro: {
      title: seoData.metaTitle
        ? seoData.metaTitle
        : `${product.name} | TechTots - Jucării STEM`,
      description: seoData.metaDescription
        ? seoData.metaDescription
        : product.description.length > 160
          ? `${product.description.substring(0, 157)}...`
          : product.description,
    },
    en: {
      title: seoData.metaTitle
        ? seoData.metaTitle
        : `${product.name} | TechTots - STEM Toys`,
      description: seoData.metaDescription
        ? seoData.metaDescription
        : product.description.length > 160
          ? `${product.description.substring(0, 157)}...`
          : product.description,
    },
  };

  // Return metadata using the createMetadata utility
  return createMetadata({
    title: "metaTitle" as any,
    description: "metaDescription" as any,
    keywords: keywords,
    structuredData: structuredData,
    canonicalUrl:
      seoData.canonical || `https://techtots.com/products/${product.slug}`,
    ogImage: product.images?.[0] || "/opengraph-image.png",
    pathWithoutLocale: `/products/${product.slug}`,
    translations: translations,
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
    url: `https://techtots.com/categories/${category.slug}`,
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
        item: "https://techtots.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Categories",
        item: "https://techtots.com/categories",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: category.name,
        item: `https://techtots.com/categories/${category.slug}`,
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
      seoData.canonical || `https://techtots.com/categories/${category.slug}`,
    ogImage: category.image || "/opengraph-image.png",
    pathWithoutLocale: `/categories/${category.slug}`,
    translations: translations,
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
        url: "https://techtots.com/TechTots_LOGO.png",
      },
    },
    datePublished: blog.publishedAt || blog.createdAt,
    dateModified: blog.updatedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://techtots.com/blog/${blog.slug}`,
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
    keywords: keywords,
    structuredData: structuredData,
    canonicalUrl: seoData.canonical || `https://techtots.com/blog/${blog.slug}`,
    ogImage: blog.coverImage || "/opengraph-image.png",
    pathWithoutLocale: `/blog/${blog.slug}`,
    translations: translations,
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
      url: `https://techtots.com/books/${book.slug}`,
    },
  };

  // Create translations for this book
  const translations = {
    ro: {
      title: seoData.metaTitle
        ? seoData.metaTitle
        : `${book.name} | Carte de ${book.author} | TechTots`,
      description: seoData.metaDescription
        ? seoData.metaDescription
        : book.description.length > 160
          ? `${book.description.substring(0, 157)}...`
          : book.description,
    },
    en: {
      title: seoData.metaTitle
        ? seoData.metaTitle
        : `${book.name} | Book by ${book.author} | TechTots`,
      description: seoData.metaDescription
        ? seoData.metaDescription
        : book.description.length > 160
          ? `${book.description.substring(0, 157)}...`
          : book.description,
    },
  };

  // Return metadata using the createMetadata utility
  return createMetadata({
    title: "metaTitle" as any,
    description: "metaDescription" as any,
    keywords: keywords,
    structuredData: structuredData,
    canonicalUrl:
      seoData.canonical || `https://techtots.com/books/${book.slug}`,
    ogImage: book.coverImage || "/opengraph-image.png",
    pathWithoutLocale: `/books/${book.slug}`,
    translations: translations,
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
    canonicalUrl: storeSettings.storeUrl,
    ogImage: "/opengraph-image.png",
    pathWithoutLocale: "/",
    translations: translations,
  });
}
