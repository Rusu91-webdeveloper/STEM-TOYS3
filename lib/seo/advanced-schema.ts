/**
 * Structured data helpers for STEM-focused ecommerce pages.
 * Keep claims factual and tied to visible page content.
 */

import type { Product } from "@/types/product";
import { appConfig } from "@/lib/config/app-config";

function extractBrandFromName(name: string): string {
  const brands = [
    "LEGO",
    "VEX",
    "Arduino",
    "Makeblock",
    "Snap Circuits",
    "Thames & Kosmos",
    "LittleBits",
    "Elenco",
  ];

  const foundBrand = brands.find(brand => name.includes(brand));
  return foundBrand || "TechTots";
}

function getAgeRangeFromGroup(ageGroup?: string): string {
  const ageRanges = {
    TODDLERS_1_3: "1-3",
    PRESCHOOL_3_5: "3-5",
    ELEMENTARY_6_8: "6-8",
    MIDDLE_SCHOOL_9_12: "9-12",
    TEENS_13_PLUS: "13-18",
  };

  return ageRanges[ageGroup as keyof typeof ageRanges] || "3-12";
}

function getAgeLandingUrl(ageGroup?: string): string {
  const ageRoutes = {
    TODDLERS_1_3: "https://www.techtots.ro/jucarii-stem-dupa-varsta",
    PRESCHOOL_3_5: "https://www.techtots.ro/jucarii-stem-dupa-varsta",
    ELEMENTARY_6_8: "https://www.techtots.ro/jucarii-stem-copii-6-8-ani",
    MIDDLE_SCHOOL_9_12: "https://www.techtots.ro/jucarii-stem-dupa-varsta",
    TEENS_13_PLUS: "https://www.techtots.ro/jucarii-stem-dupa-varsta",
  };

  return (
    ageRoutes[ageGroup as keyof typeof ageRoutes] ||
    "https://www.techtots.ro/jucarii-stem-dupa-varsta"
  );
}

function buildAdditionalProperty(product: Product) {
  const properties: Array<Record<string, string>> = [];

  if (product.ageGroup) {
    properties.push({
      "@type": "PropertyValue",
      name: "Grupa de varsta",
      value: getAgeRangeFromGroup(product.ageGroup),
    });
  }

  if (product.stemDiscipline) {
    properties.push({
      "@type": "PropertyValue",
      name: "Disciplina STEM",
      value: product.stemDiscipline,
    });
  }

  if (Array.isArray(product.tags) && product.tags.length > 0) {
    properties.push({
      "@type": "PropertyValue",
      name: "Taguri",
      value: product.tags.join(", "),
    });
  }

  if (properties.length === 0) {
    return undefined;
  }

  return properties;
}

function buildOffer(product: Product) {
  return {
    "@type": "Offer",
    url: `https://www.techtots.ro/products/${product.slug}`,
    priceCurrency: "RON",
    price: product.price,
    availability:
      product.stockQuantity > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    seller: {
      "@type": "Organization",
      name: "TechTots",
      url: "https://www.techtots.ro",
    },
  };
}

export function generateEducationalProductSchema(product: Product) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `https://www.techtots.ro/products/${product.slug}#product`,
    name: product.name,
    description: product.description || product.name,
    image: product.images || [],
    sku: product.sku || product.id,
    category: product.category?.name || product.stemDiscipline || "Jucarii STEM",
    brand: {
      "@type": "Brand",
      name: extractBrandFromName(product.name),
    },
    offers: buildOffer(product),
    additionalProperty: buildAdditionalProperty(product),
  };

  if (product.ageGroup) {
    schema.audience = {
      "@type": "PeopleAudience",
      suggestedMinAge: Number(getAgeRangeFromGroup(product.ageGroup).split("-")[0]),
      suggestedMaxAge: Number(getAgeRangeFromGroup(product.ageGroup).split("-")[1]),
    };
  }

  if (
    typeof product.averageRating === "number" &&
    product.averageRating > 0 &&
    typeof product.reviewCount === "number" &&
    product.reviewCount > 0
  ) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.averageRating,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

export function generateEducationalOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://www.techtots.ro/#organization",
    name: "TechTots",
    url: "https://www.techtots.ro",
    logo: "https://www.techtots.ro/TechTots_LOGO.png",
    description:
      "Magazin online din Romania cu jucarii STEM, jucarii educative, robotica pentru copii si experimente stiintifice.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: appConfig.contactEmail,
      telephone: appConfig.storePhone,
      availableLanguage: ["ro", "en"],
      areaServed: "RO",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: appConfig.streetAddress,
      addressLocality: appConfig.city,
      addressRegion: appConfig.state,
      postalCode: appConfig.postalCode,
      addressCountry: "RO",
    },
  };
}

export function generateSTEMEducationFAQSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Ce inseamna jucarii STEM pentru copii?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Jucariile STEM combina stiinta, tehnologia, ingineria si matematica in activitati practice care sustin logica, experimentul si rezolvarea de probleme.",
        },
      },
      {
        "@type": "Question",
        name: "Cum aleg jucaria STEM potrivita pentru varsta copilului?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Porneste de la varsta, nivelul de autonomie si interesul principal al copilului: constructii, robotica, experimente sau jocuri de logica. Apoi compara produsele din categoria relevanta.",
        },
      },
      {
        "@type": "Question",
        name: "Care este diferenta dintre jucarii educative si jucarii STEM?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Jucariile educative reprezinta categoria mai larga, iar jucariile STEM sunt o subcategorie orientata spre invatare aplicata, logica, experiment si tehnologie.",
        },
      },
      {
        "@type": "Question",
        name: "Ce tipuri de activitati STEM pot face copiii acasa?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Copiii pot face experimente stiintifice simple, activitati de constructie, provocari de logica si proiecte introductive de robotica sau coding, in functie de produsul ales.",
        },
      },
    ],
  };
}

export function generateLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": "https://www.techtots.ro/#store",
    name: "TechTots",
    url: "https://www.techtots.ro",
    currenciesAccepted: "RON",
    availableLanguage: ["ro", "en"],
    email: appConfig.contactEmail,
    telephone: appConfig.storePhone,
    areaServed: {
      "@type": "Country",
      name: "Romania",
    },
  };
}

export function generateSTEMActivitySchema(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `Cum poti folosi ${product.name} in joaca STEM`,
    description: `Exemplu de folosire practica pentru ${product.name} in activitati de invatare prin joaca.`,
    image: product.images?.[0],
    supply: [
      {
        "@type": "HowToSupply",
        name: product.name,
      },
    ],
    step: [
      {
        "@type": "HowToStep",
        name: "Pregateste activitatea",
        text: "Verifica piesele si instructiunile produsului inainte de a incepe joaca.",
      },
      {
        "@type": "HowToStep",
        name: "Construieste sau experimenteaza",
        text: "Parcurge activitatea pas cu pas si lasa copilul sa observe ce functioneaza si ce poate fi imbunatatit.",
      },
      {
        "@type": "HowToStep",
        name: "Discuta ce a invatat",
        text: "La final, vorbeste cu copilul despre logica, mecanismul sau rezultatul experimentului.",
      },
    ],
  };
}

export function generateSTEMLearningPathSchema(products: Product[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Parcurs STEM pentru acasa",
    description:
      "Selectie de produse si resurse TechTots care pot sustine invatarea STEM acasa sau la scoala.",
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product.name,
        url: `https://www.techtots.ro/products/${product.slug}`,
      },
    })),
  };
}

export function generateProductVideoSchema(product: Product, videoUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: `Video ${product.name}`,
    description: `Material video despre ${product.name}.`,
    thumbnailUrl: product.images?.[0],
    contentUrl: videoUrl,
    embedUrl: videoUrl,
    inLanguage: "ro",
    about: {
      "@type": "Product",
      name: product.name,
    },
  };
}

export function generateReviewSchema(product: Product, reviews: any[]) {
  return reviews.map(review => ({
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "Product",
      name: product.name,
    },
    author: {
      "@type": "Person",
      name: review.authorName,
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: review.comment,
    datePublished: review.createdAt,
    inLanguage: "ro",
  }));
}

export function generateEducationalBreadcrumbSchema(product: Product) {
  const categoryName = product.category?.name || "Produse";
  const categoryUrl = product.category?.slug
    ? `https://www.techtots.ro/categories/${product.category.slug}`
    : "https://www.techtots.ro/products";

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Acasa",
        item: "https://www.techtots.ro/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Produse",
        item: "https://www.techtots.ro/products",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: categoryName,
        item: categoryUrl,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: `Jucarii STEM ${getAgeRangeFromGroup(product.ageGroup)} ani`,
        item: getAgeLandingUrl(product.ageGroup),
      },
      {
        "@type": "ListItem",
        position: 5,
        name: product.name,
        item: `https://www.techtots.ro/products/${product.slug}`,
      },
    ],
  };
}

export function generateProductCollectionSchema(
  categoryName: string,
  products: Product[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: categoryName,
    description: `Selectie de produse pentru categoria ${categoryName}.`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: product.name,
          url: `https://www.techtots.ro/products/${product.slug}`,
          image: product.images?.[0],
        },
      })),
    },
  };
}

export function generateAgeGroupSchema(ageGroup: string, products: Product[]) {
  const labels = {
    TODDLERS_1_3: "1-3 ani",
    PRESCHOOL_3_5: "3-5 ani",
    ELEMENTARY_6_8: "6-8 ani",
    MIDDLE_SCHOOL_9_12: "9-12 ani",
    TEENS_13_PLUS: "13+ ani",
  };

  const label = labels[ageGroup as keyof typeof labels] || "copii";

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Jucarii STEM pentru ${label}`,
    description: `Selectie de jucarii STEM pentru ${label}.`,
    url: getAgeLandingUrl(ageGroup),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: product.name,
          url: `https://www.techtots.ro/products/${product.slug}`,
        },
      })),
    },
  };
}

export function generateCompleteProductSchema(
  product: Product,
  reviews?: any[],
  videoUrl?: string
) {
  const schemas = [
    generateEducationalProductSchema(product),
    generateEducationalBreadcrumbSchema(product),
  ];

  if (reviews && reviews.length > 0) {
    schemas.push(...generateReviewSchema(product, reviews));
  }

  if (videoUrl) {
    schemas.push(generateProductVideoSchema(product, videoUrl));
  }

  return schemas;
}
