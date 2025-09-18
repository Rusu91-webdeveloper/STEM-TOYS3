/**
 * Advanced Schema Markup for Romanian STEM Toys E-commerce
 * Implements cutting-edge structured data for maximum Google visibility
 */

import { Product } from "@/types/product";

/**
 * Educational Product Schema - Custom schema for STEM educational products
 * This gives Google rich context about educational value
 */
export function generateEducationalProductSchema(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": ["Product", "EducationalOccupationalCredential"],
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: extractBrandFromName(product.name),
    },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "RON",
      availability: product.stockQuantity > 0 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "TechTots",
        url: "https://www.techtots.ro",
      },
      validFrom: new Date().toISOString(),
    },
    // Educational specific properties
    educationalAlignment: {
      "@type": "AlignmentObject",
      alignmentType: "educationalSubject",
      educationalFramework: "Curriculum Național Românesc",
      targetName: product.romanianSubjectAreas?.join(", ") || "STEM",
      targetDescription: `Aliniat cu curriculumul românesc pentru ${product.romanianEducationalLevel || 'toate nivelurile'}`,
    },
    audience: {
      "@type": "EducationalAudience",
      audienceType: "student",
      educationalRole: "student",
      educationalUse: "assignment",
    },
    // Learning outcomes as competencies
    teaches: product.learningOutcomes?.map(outcome => ({
      "@type": "DefinedTerm",
      name: outcome,
      inDefinedTermSet: "STEM Learning Outcomes",
    })) || [],
    // Age group targeting
    typicalAgeRange: getAgeRangeFromGroup(product.ageGroup),
    // Romanian educational compliance
    compliance: product.romanianMinistryApproval ? [
      {
        "@type": "Certification",
        name: "Aprobare Ministerul Educației României",
        certificationIdentification: "MECTS-APPROVED",
      }
    ] : [],
    // Category and classification
    category: product.category?.name,
    additionalType: `https://schema.org/${getSchemaProductType(product.productType)}`,
    // Reviews and ratings (if available)
    ...(product.averageRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.averageRating,
        reviewCount: product.reviewCount || 0,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };
}

/**
 * Romanian Educational Organization Schema
 * Establishes authority in Romanian education market
 */
export function generateEducationalOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "TechTots România",
    alternateName: "TechTots",
    description: "Cel mai mare magazin online de jucării educaționale STEM din România. Produse certificate și aliniate cu curriculumul românesc.",
    url: "https://www.techtots.ro",
    logo: "https://www.techtots.ro/logo.png",
    address: {
      "@type": "PostalAddress",
      addressCountry: "RO",
      addressRegion: "România",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["Romanian", "English"],
      email: "contact@techtots.ro",
    },
    // Educational focus
    educationalCredentialAwarded: "Certificare MECTS pentru produse educaționale",
    hasCredential: {
      "@type": "EducationalOccupationalCredential",
      name: "Specialist în educație STEM România",
      description: "Expertiza în selectarea și comercializarea produselor educaționale STEM pentru piața românească",
    },
    // Service area
    areaServed: {
      "@type": "Country",
      name: "România",
    },
    // Specialization
    knowsAbout: [
      "Educație STEM România",
      "Curriculum Național Românesc", 
      "Jucării educaționale certificate",
      "Dezvoltarea competențelor cheie",
      "Robotică educațională",
      "Experimente științifice pentru copii"
    ],
  };
}

/**
 * FAQ Schema for STEM Education - Targets long-tail keywords
 */
export function generateSTEMEducationFAQSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Ce sunt jucăriile STEM și de ce sunt importante pentru copii?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Jucăriile STEM (Știință, Tehnologie, Inginerie, Matematică) sunt instrumente educaționale care dezvoltă gândirea critică, creativitatea și abilitățile de rezolvare a problemelor la copii. Acestea sunt aliniate cu curriculumul românesc și ajută la dezvoltarea competențelor cheie necesare în secolul XXI."
        }
      },
      {
        "@type": "Question", 
        name: "Cum aleg jucăria STEM potrivită pentru vârsta copilului meu?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Alegerea jucăriei STEM depinde de vârsta și nivelul de dezvoltare al copilului. Pentru 3-5 ani recomandăm puzzle-uri simple și jocuri de construcție. Pentru 6-8 ani, kituri de experimente și robotică de bază. Pentru 9+ ani, kituri avansate de programare și robotică competițională."
        }
      },
      {
        "@type": "Question",
        name: "Jucăriile STEM de pe TechTots sunt certificate pentru piața românească?",
        acceptedAnswer: {
          "@type": "Answer", 
          text: "Da, toate produsele noastre sunt certificate și aliniate cu curriculumul românesc. Avem aprobare de la Ministerul Educației și respectăm standardele de siguranță CE pentru piața europeană."
        }
      },
      {
        "@type": "Question",
        name: "Cum pot integra jucăriile STEM în educația copilului acasă?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Jucăriile STEM pot fi integrate prin activități practice zilnice, proiecte de weekend, și sesiuni de învățare în familie. Oferim ghiduri pentru părinți și resurse educaționale pentru a maximiza beneficiile educaționale."
        }
      }
    ]
  };
}

/**
 * Local Business Schema for Romanian market
 */
export function generateLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "TechTots România - Magazin Online Jucării STEM",
    description: "Cel mai mare magazin online de jucării educaționale STEM din România",
    url: "https://www.techtots.ro",
    telephone: "+40-XXX-XXX-XXX", // Add your phone number
    email: "contact@techtots.ro",
    address: {
      "@type": "PostalAddress",
      addressCountry: "RO",
      addressRegion: "România",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 45.9432, // Bucharest coordinates - adjust for your location
      longitude: 24.9668,
    },
    openingHours: "Mo-Su 00:00-23:59", // Online store - always open
    currenciesAccepted: "RON",
    paymentAccepted: ["Credit Card", "Bank Transfer", "Cash on Delivery"],
    priceRange: "$$",
    servesCuisine: "Educational Products",
    serviceArea: {
      "@type": "Country",
      name: "România",
    },
  };
}

/**
 * How-to Schema for STEM activities - Captures educational search intent
 */
export function generateSTEMActivitySchema(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `Cum să folosești ${product.name} pentru educația STEM`,
    description: `Ghid complet pentru utilizarea ${product.name} în dezvoltarea abilităților STEM la copii`,
    image: product.images[0],
    totalTime: "PT30M", // 30 minutes typical activity
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "RON",
      value: product.price,
    },
    supply: [
      {
        "@type": "HowToSupply",
        name: product.name,
      }
    ],
    tool: product.learningOutcomes?.map(outcome => ({
      "@type": "HowToTool",
      name: `Dezvoltarea abilității: ${outcome}`,
    })) || [],
    step: generateEducationalSteps(product),
  };
}

// Helper functions
function extractBrandFromName(name: string): string {
  const brands = ["LEGO", "VEX", "Arduino", "Makeblock", "Snap Circuits", "Thames & Kosmos", "LittleBits", "Elenco"];
  const foundBrand = brands.find(brand => name.includes(brand));
  return foundBrand || "TechTots";
}

function getAgeRangeFromGroup(ageGroup?: string): string {
  const ageRanges = {
    "TODDLERS_1_3": "1-3",
    "PRESCHOOL_3_5": "3-5", 
    "ELEMENTARY_6_8": "6-8",
    "MIDDLE_SCHOOL_9_12": "9-12",
    "TEENS_13_PLUS": "13-18",
  };
  return ageRanges[ageGroup as keyof typeof ageRanges] || "6-18";
}

function getSchemaProductType(productType?: string): string {
  const typeMap = {
    "ROBOTICS": "Toy",
    "PUZZLES": "Game", 
    "CONSTRUCTION_SETS": "Toy",
    "EXPERIMENT_KITS": "Product",
    "BOARD_GAMES": "Game",
  };
  return typeMap[productType as keyof typeof typeMap] || "Product";
}

function generateEducationalSteps(product: Product) {
  return [
    {
      "@type": "HowToStep",
      name: "Pregătirea materialelor",
      text: `Despachetați ${product.name} și verificați că toate componentele sunt incluse conform listei.`,
    },
    {
      "@type": "HowToStep", 
      name: "Înțelegerea conceptelor STEM",
      text: `Citiți ghidul educațional pentru a înțelege obiectivele de învățare: ${product.learningOutcomes?.join(", ") || "dezvoltarea abilităților tehnice"}.`,
    },
    {
      "@type": "HowToStep",
      name: "Activitatea practică",
      text: `Începeți activitatea educațională urmând instrucțiunile pas cu pas, încurajând copilul să exploreze și să experimenteze.`,
    },
    {
      "@type": "HowToStep",
      name: "Evaluarea învățării", 
      text: `Discutați cu copilul despre ce a învățat și cum poate aplica aceste cunoștințe în alte contexte educaționale.`,
    }
  ];
}

/**
 * Course Schema for STEM Learning Path
 */
export function generateSTEMLearningPathSchema(products: Product[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Parcurs Complet Educație STEM pentru Copii - România",
    description: "Program educațional complet STEM folosind jucării certificate, aliniat cu curriculumul românesc",
    provider: {
      "@type": "EducationalOrganization",
      name: "TechTots România",
      url: "https://www.techtots.ro",
    },
    educationalLevel: "Primar și Gimnazial",
    teaches: [
      "Gândire critică și analitică",
      "Rezolvarea problemelor",
      "Creativitate și inovație", 
      "Abilități motorii fine",
      "Colaborare și comunicare",
      "Alfabetizare digitală"
    ],
    courseCode: "STEM-RO-2025",
    hasCourseInstance: products.map(product => ({
      "@type": "CourseInstance",
      name: `Lecția: ${product.name}`,
      description: product.description,
      instructor: {
        "@type": "Person",
        name: "Educator STEM Certificat",
      },
      courseMode: "hands-on",
      duration: "PT45M", // 45 minutes per lesson
    })),
    educationalCredentialAwarded: {
      "@type": "EducationalOccupationalCredential",
      name: "Competențe STEM Fundamentale",
      description: "Dezvoltarea abilităților STEM conform standardelor românești",
    },
    inLanguage: "ro",
    about: [
      {
        "@type": "Thing",
        name: "Educație STEM",
        sameAs: "https://en.wikipedia.org/wiki/Science,_technology,_engineering,_and_mathematics",
      },
      {
        "@type": "Thing", 
        name: "Curriculum Românesc",
        description: "Sistemul educațional național din România",
      }
    ],
  };
}

/**
 * Video Schema for product demonstrations (if you add videos)
 */
export function generateProductVideoSchema(product: Product, videoUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: `Demonstrație ${product.name} - Jucărie STEM Educațională`,
    description: `Ghid video complet pentru utilizarea ${product.name} în educația STEM. Ideal pentru părinți și educatori români.`,
    thumbnailUrl: product.images[0],
    uploadDate: new Date().toISOString(),
    duration: "PT5M", // 5 minutes typical demo
    contentUrl: videoUrl,
    embedUrl: videoUrl,
    inLanguage: "ro",
    about: {
      "@type": "Product",
      name: product.name,
    },
    // Educational context
    educationalUse: "instruction",
    learningResourceType: "demonstration",
    audience: {
      "@type": "EducationalAudience", 
      audienceType: "parent",
      educationalRole: "parent",
    },
  };
}

/**
 * Review Schema for social proof
 */
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

/**
 * Breadcrumb Schema with educational hierarchy
 */
export function generateEducationalBreadcrumbSchema(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Acasă",
        item: "https://www.techtots.ro",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Jucării STEM",
        item: "https://www.techtots.ro/products",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.category?.name || "Categorie",
        item: `https://www.techtots.ro/categories/${product.category?.slug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: `Vârsta ${getAgeRangeFromGroup(product.ageGroup)}`,
        item: `https://www.techtots.ro/jucarii-stem-dupa-varsta/${product.ageGroup?.toLowerCase()}`,
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

/**
 * Product Collection Schema for category pages
 */
export function generateProductCollectionSchema(categoryName: string, products: Product[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Jucării STEM ${categoryName} - România`,
    description: `Colecția completă de jucării educaționale ${categoryName} certificate pentru piața românească`,
    url: `https://www.techtots.ro/categories/${categoryName.toLowerCase()}`,
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
          image: product.images[0],
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: "RON",
          },
        },
      })),
    },
    // Educational context
    about: {
      "@type": "Thing",
      name: `Educație ${categoryName} România`,
      description: `Produse educaționale ${categoryName} aliniate cu curriculumul românesc`,
    },
  };
}

/**
 * Age-specific landing page schema
 */
export function generateAgeGroupSchema(ageGroup: string, products: Product[]) {
  const ageInfo = {
    "TODDLERS_1_3": { name: "1-3 ani", description: "Jucării STEM pentru dezvoltarea timpurie" },
    "PRESCHOOL_3_5": { name: "3-5 ani", description: "Jucării STEM pentru preșcolari" },
    "ELEMENTARY_6_8": { name: "6-8 ani", description: "Jucării STEM pentru școlarii mici" },
    "MIDDLE_SCHOOL_9_12": { name: "9-12 ani", description: "Jucării STEM pentru gimnaziu" },
    "TEENS_13_PLUS": { name: "13+ ani", description: "Jucării STEM pentru adolescenți" },
  };

  const info = ageInfo[ageGroup as keyof typeof ageInfo] || { name: "Toate vârstele", description: "Jucării STEM universale" };

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Jucării STEM pentru copii ${info.name} - România`,
    description: `${info.description} - Produse certificate și aliniate cu curriculumul românesc`,
    url: `https://www.techtots.ro/jucarii-stem-dupa-varsta/${ageGroup.toLowerCase()}`,
    mainEntity: {
      "@type": "ItemList",
      name: `Jucării STEM ${info.name}`,
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
    // Educational targeting
    audience: {
      "@type": "EducationalAudience",
      audienceType: "parent",
      educationalRole: "parent",
    },
    about: {
      "@type": "Thing",
      name: `Dezvoltarea STEM la vârsta ${info.name}`,
      description: `Importanța educației STEM pentru copiii de ${info.name} în contextul românesc`,
    },
  };
}

/**
 * Combine all schemas for a product page
 */
export function generateCompleteProductSchema(product: Product, reviews?: any[], videoUrl?: string) {
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
