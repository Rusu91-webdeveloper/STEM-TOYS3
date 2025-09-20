/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables from .env.local if present, otherwise .env
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function toPlain(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
}

function summarizeSEO(product) {
  const metadata = (product && product.metadata) || {};
  const seo = metadata.seo || {};
  const attrs = product.attributes || {};
  const hasLegacySEOInAttributes = Boolean(
    attrs.metaTitle || attrs.metaDescription || attrs.metaKeywords
  );

  return {
    metaTitle: seo.metaTitle || metadata.metaTitle || null,
    metaDescription: seo.metaDescription || metadata.metaDescription || null,
    metaKeywords: Array.isArray(seo.metaKeywords)
      ? seo.metaKeywords
      : metadata.metaKeywords || [],
    ogImage: seo.ogImage || metadata.ogImage || null,
    legacySEOInAttributes: hasLegacySEOInAttributes,
  };
}

function computeRichnessScore(p) {
  const seo = summarizeSEO(p);
  let score = 0;
  if (seo.metaTitle && seo.metaTitle.length >= 30 && seo.metaTitle.length <= 70)
    score += 2;
  if (
    seo.metaDescription &&
    seo.metaDescription.length >= 90 &&
    seo.metaDescription.length <= 160
  )
    score += 2;
  if (Array.isArray(seo.metaKeywords) && seo.metaKeywords.length >= 3)
    score += 1;
  if (Array.isArray(p.images) && p.images.length >= 3) score += 1;
  if (Array.isArray(p.tags) && p.tags.length >= 5) score += 1;
  if (Array.isArray(p.learningOutcomes) && p.learningOutcomes.length >= 2)
    score += 1;
  if (p.ageGroup) score += 1;
  if (p.stemDiscipline && p.stemDiscipline !== "GENERAL") score += 1;
  if (p.productType) score += 1;
  if (Array.isArray(p.specialCategories) && p.specialCategories.length > 0)
    score += 0.5;
  if (p.categoryId) score += 0.5;
  return { score, seo };
}

async function main() {
  const names = process.argv.slice(2);
  if (names.length === 0) {
    console.error(
      "Usage: node scripts/inspect-products.js <name1> [name2 ...]"
    );
    process.exit(1);
  }

  const products = [];
  for (const name of names) {
    const product = await prisma.product.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
      },
      include: {
        category: true,
      },
    });
    products.push(product ? toPlain(product) : null);
  }

  // Fetch baseline recent products for comparison (excluding the found ones)
  const excludeIds = products.filter(Boolean).map(p => p.id);
  const baseline = await prisma.product.findMany({
    where: {
      isActive: true,
      status: "APPROVED",
      NOT: excludeIds.length ? { id: { in: excludeIds } } : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { category: true },
  });

  const baselinePlain = baseline.map(toPlain);

  const analyzed = products.map(p => {
    if (!p) return { found: false };
    const { score, seo } = computeRichnessScore(p);
    return {
      found: true,
      id: p.id,
      name: p.name,
      slug: p.slug,
      status: p.status,
      isActive: p.isActive,
      category: p.category
        ? { id: p.category.id, name: p.category.name, slug: p.category.slug }
        : null,
      price: p.price,
      priceCurrency: p.priceCurrency,
      imagesCount: Array.isArray(p.images) ? p.images.length : 0,
      tagsCount: Array.isArray(p.tags) ? p.tags.length : 0,
      attributesKeys: p.attributes ? Object.keys(p.attributes) : [],
      categorization: {
        ageGroup: p.ageGroup || null,
        stemDiscipline: p.stemDiscipline || null,
        productType: p.productType || null,
        learningOutcomes: p.learningOutcomes || [],
        specialCategories: p.specialCategories || [],
      },
      romanian: {
        educationalLevel: p.romanianEducationalLevel || null,
        ministryApproval: p.romanianMinistryApproval || false,
        competencies: (p.romanianCompetencies || []).length,
      },
      seo,
      richnessScore: score,
    };
  });

  // Baseline statistics
  const baselineScores = baselinePlain.map(p => computeRichnessScore(p).score);
  const avgBaselineScore = baselineScores.length
    ? baselineScores.reduce((a, b) => a + b, 0) / baselineScores.length
    : 0;

  const output = {
    inspectedNames: names,
    analyzed,
    baseline: {
      count: baselinePlain.length,
      avgRichnessScore: Number(avgBaselineScore.toFixed(2)),
    },
  };

  console.log(JSON.stringify(output, null, 2));
}

main()
  .catch(err => {
    console.error("Error inspecting products:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
