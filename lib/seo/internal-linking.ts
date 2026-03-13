/**
 * Advanced Internal Linking System
 * Creates semantic relationships between content for maximum SEO impact
 */

import { Product } from "@/types/product";

export interface InternalLink {
  url: string;
  anchor: string;
  context: string;
  relevanceScore: number;
  linkType: "product" | "category" | "educational" | "blog";
}

/**
 * Generate contextual internal links for product pages
 */
export function generateProductInternalLinks(product: Product): InternalLink[] {
  const links: InternalLink[] = [];

  // Age-specific landing page
  if (product.ageGroup) {
    links.push({
      url: getAgeGroupLandingPageUrl(product.ageGroup),
      anchor: `jucării STEM pentru ${getAgeGroupDisplayName(product.ageGroup)}`,
      context: `Descoperă toate jucăriile STEM potrivite pentru vârsta ${getAgeGroupDisplayName(product.ageGroup)}`,
      relevanceScore: 0.9,
      linkType: "educational",
    });
  }

  // Category page
  if (product.category) {
    links.push({
      url: `/categories/${product.category.slug}`,
      anchor: `jucării ${product.category.name}`,
      context: `Explorează întreaga noastră colecție de ${product.category.name.toLowerCase()}`,
      relevanceScore: 0.8,
      linkType: "category",
    });
  }

  // STEM discipline page
  if (product.stemDiscipline) {
    links.push({
      url: getStemDisciplineLandingPageUrl(product.stemDiscipline),
      anchor: `educație ${getStemDisciplineDisplayName(product.stemDiscipline)}`,
      context: `Află mai multe despre beneficiile educației ${getStemDisciplineDisplayName(product.stemDiscipline).toLowerCase()}`,
      relevanceScore: 0.7,
      linkType: "educational",
    });
  }

  // Educational guide
  links.push({
    url: "/ghid-educatie-stem-romania",
    anchor: "ghidul complet pentru educația STEM în România",
    context:
      "Citește ghidul nostru complet pentru a înțelege cum să integrezi educația STEM în dezvoltarea copilului",
    relevanceScore: 0.6,
    linkType: "educational",
  });

  // Learning outcomes related content
  if (product.learningOutcomes && product.learningOutcomes.length > 0) {
    const primaryOutcome = product.learningOutcomes[0];
    links.push({
      url: "/beneficiile-jucariilor-stem",
      anchor: `dezvoltarea abilității de ${getLearningOutcomeDisplayName(primaryOutcome)}`,
      context: `Învață cum să dezvolți ${getLearningOutcomeDisplayName(primaryOutcome).toLowerCase()} la copilul tău`,
      relevanceScore: 0.7,
      linkType: "educational",
    });
  }

  // Romanian ministry approval content
  if (product.romanianMinistryApproval) {
    links.push({
      url: "/ghid-educatie-stem-romania",
      anchor: "certificarea MECTS pentru jucării educaționale",
      context:
        "Află de ce certificarea MECTS este importantă pentru siguranța și calitatea educațională",
      relevanceScore: 0.5,
      linkType: "educational",
    });
  }

  return links.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Generate related products based on multiple criteria
 */
export function generateRelatedProductLinks(
  product: Product,
  allProducts: Product[]
): InternalLink[] {
  const links: InternalLink[] = [];

  // Same age group products
  const sameAgeProducts = allProducts
    .filter(p => p.id !== product.id && p.ageGroup === product.ageGroup)
    .slice(0, 3);

  sameAgeProducts.forEach(p => {
    links.push({
      url: `/products/${p.slug}`,
      anchor: p.name,
      context: `O altă jucărie STEM excelentă pentru ${getAgeGroupDisplayName(product.ageGroup)}`,
      relevanceScore: 0.8,
      linkType: "product",
    });
  });

  // Same STEM discipline
  const sameDisciplineProducts = allProducts
    .filter(
      p => p.id !== product.id && p.stemDiscipline === product.stemDiscipline
    )
    .slice(0, 2);

  sameDisciplineProducts.forEach(p => {
    links.push({
      url: `/products/${p.slug}`,
      anchor: p.name,
      context: `Continuă explorarea ${getStemDisciplineDisplayName(product.stemDiscipline)} cu`,
      relevanceScore: 0.7,
      linkType: "product",
    });
  });

  // Complementary products (different disciplines, same age)
  const complementaryProducts = allProducts
    .filter(
      p =>
        p.id !== product.id &&
        p.ageGroup === product.ageGroup &&
        p.stemDiscipline !== product.stemDiscipline
    )
    .slice(0, 2);

  complementaryProducts.forEach(p => {
    links.push({
      url: `/products/${p.slug}`,
      anchor: p.name,
      context: `Completează educația STEM cu`,
      relevanceScore: 0.6,
      linkType: "product",
    });
  });

  return links.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Generate topic cluster links for blog posts
 */
export function generateTopicClusterLinks(
  currentTopic: string
): InternalLink[] {
  const topicClusters = {
    "educatie-stem": [
      {
        url: "/blog/beneficiile-educatiei-stem-pentru-copiii-romani",
        anchor: "beneficiile educației STEM pentru copiii români",
        context: "Descoperă toate beneficiile dovedite științific",
        relevanceScore: 0.9,
      },
      {
        url: "/blog/cum-sa-implementezi-stem-acasa",
        anchor: "implementarea educației STEM acasă",
        context: "Ghid practic pentru părinții români",
        relevanceScore: 0.8,
      },
      {
        url: "/blog/curriculum-stem-romania-2025",
        anchor: "curriculumul STEM din România pentru 2025",
        context: "Află despre noile schimbări în educația românească",
        relevanceScore: 0.8,
      },
    ],
    "dezvoltare-copii": [
      {
        url: "/blog/dezvoltarea-gandirii-critice-copii",
        anchor: "dezvoltarea gândirii critice la copii",
        context: "Strategii dovedite pentru stimularea gândirii critice",
        relevanceScore: 0.9,
      },
      {
        url: "/blog/creativitatea-si-inovatia-copii-stem",
        anchor: "creativitatea și inovația prin educația STEM",
        context: "Cum STEM stimulează creativitatea copiilor",
        relevanceScore: 0.8,
      },
    ],
  };

  return (
    topicClusters[currentTopic as keyof typeof topicClusters]?.map(link => ({
      ...link,
      linkType: "blog" as const,
    })) || []
  );
}

/**
 * Generate contextual anchor text variations
 */
export function generateAnchorTextVariations(
  baseAnchor: string,
  product?: Product
): string[] {
  const variations = [baseAnchor];

  if (product) {
    // Add brand variations
    const brand = extractBrandFromName(product.name);
    if (brand !== "TechTots") {
      variations.push(`${brand} ${baseAnchor}`);
      variations.push(`jucăria ${brand} pentru educația STEM`);
    }

    // Add age-specific variations
    if (product.ageGroup) {
      const ageDisplay = getAgeGroupDisplayName(product.ageGroup);
      variations.push(`${baseAnchor} pentru ${ageDisplay}`);
      variations.push(`${baseAnchor} potrivit pentru copii de ${ageDisplay}`);
    }

    // Add educational variations
    if (product.romanianMinistryApproval) {
      variations.push(`${baseAnchor} certificat MECTS`);
      variations.push(`${baseAnchor} aprobat de Ministerul Educației`);
    }
  }

  return variations;
}

// Helper functions
function getAgeGroupLandingPageUrl(ageGroup: string): string {
  const urlMap = {
    TODDLERS_1_3: "/jucarii-stem-dupa-varsta",
    PRESCHOOL_3_5: "/jucarii-stem-dupa-varsta",
    ELEMENTARY_6_8: "/jucarii-stem-copii-6-8-ani",
    MIDDLE_SCHOOL_9_12: "/jucarii-stem-dupa-varsta",
    TEENS_13_PLUS: "/jucarii-stem-dupa-varsta",
  };
  return urlMap[ageGroup as keyof typeof urlMap] || "/products";
}

function getStemDisciplineLandingPageUrl(discipline: string): string {
  const disciplineMap = {
    SCIENCE: "/categories/science-experiments",
    TECHNOLOGY: "/robotica-pentru-copii",
    ENGINEERING: "/categories/magnetic-building",
    MATHEMATICS: "/jucarii-inteligente",
    GENERAL: "/jucarii-stem",
  };

  return (
    disciplineMap[discipline as keyof typeof disciplineMap] || "/jucarii-stem"
  );
}

function getAgeGroupDisplayName(ageGroup: string): string {
  const displayMap = {
    TODDLERS_1_3: "1-3 ani",
    PRESCHOOL_3_5: "3-5 ani",
    ELEMENTARY_6_8: "6-8 ani",
    MIDDLE_SCHOOL_9_12: "9-12 ani",
    TEENS_13_PLUS: "adolescenți (13+ ani)",
  };
  return displayMap[ageGroup as keyof typeof displayMap] || "toate vârstele";
}

function getStemDisciplineDisplayName(discipline: string): string {
  const disciplineMap = {
    SCIENCE: "Știință",
    TECHNOLOGY: "Tehnologie",
    ENGINEERING: "Inginerie",
    MATHEMATICS: "Matematică",
    GENERAL: "STEM General",
  };
  return disciplineMap[discipline as keyof typeof disciplineMap] || "STEM";
}

function getLearningOutcomeDisplayName(outcome: string): string {
  const outcomeMap = {
    PROBLEM_SOLVING: "rezolvarea problemelor",
    CREATIVITY: "creativitate",
    CRITICAL_THINKING: "gândirea critică",
    MOTOR_SKILLS: "abilități motorii",
    LOGIC: "gândirea logică",
    ANALYTICAL_THINKING: "gândirea analitică",
    COLLABORATION: "colaborarea",
    COMMUNICATION: "comunicarea",
    DIGITAL_LITERACY: "alfabetizarea digitală",
    CODING_THINKING: "gândirea computațională",
  };
  return (
    outcomeMap[outcome as keyof typeof outcomeMap] || outcome.toLowerCase()
  );
}

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

/**
 * Generate internal link HTML with proper SEO attributes
 */
export function renderInternalLink(
  link: InternalLink,
  className?: string
): string {
  return `<a href="${link.url}" 
             class="${className || "text-blue-600 hover:text-blue-800 underline"}"
             title="${link.context}"
             rel="related">
             ${link.anchor}
           </a>`;
}

/**
 * Generate related content section for any page
 */
export function generateRelatedContentSection(links: InternalLink[]): string {
  if (links.length === 0) return "";

  const groupedLinks = links.reduce(
    (acc, link) => {
      if (!acc[link.linkType]) acc[link.linkType] = [];
      acc[link.linkType].push(link);
      return acc;
    },
    {} as Record<string, InternalLink[]>
  );

  let html = '<section class="mt-12 p-6 bg-gray-50 rounded-lg">';
  html += '<h3 class="text-2xl font-bold mb-6">Conținut Relacionat</h3>';

  Object.entries(groupedLinks).forEach(([type, typeLinks]) => {
    const typeTitle =
      {
        product: "Produse Similare",
        category: "Categorii Relacionate",
        educational: "Resurse Educaționale",
        blog: "Articole Utile",
      }[type] || "Legături Utile";

    html += `<div class="mb-6">`;
    html += `<h4 class="text-lg font-semibold mb-3 text-gray-800">${typeTitle}</h4>`;
    html += `<ul class="space-y-2">`;

    typeLinks.slice(0, 5).forEach(link => {
      html += `<li class="flex items-start">`;
      html += `<span class="text-blue-500 mr-2">→</span>`;
      html += `<div>`;
      html += renderInternalLink(link);
      html += `<p class="text-sm text-gray-600 mt-1">${link.context}</p>`;
      html += `</div>`;
      html += `</li>`;
    });

    html += `</ul></div>`;
  });

  html += "</section>";
  return html;
}
