import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env.local") });

const db = new PrismaClient();

async function analyzeSEOQuality(productId: string) {
  try {
    const product = await db.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });

    if (!product) {
      console.log("Product not found");
      return;
    }

    console.log("\n" + "=".repeat(80));
    console.log("📊 SEO QUALITY ANALYSIS");
    console.log("=".repeat(80));
    console.log(`\nProduct: ${product.name}`);
    console.log(`ID: ${product.id}`);
    console.log(`Category: ${product.category?.name}\n`);

    // Description Analysis
    console.log("📝 DESCRIPTION ANALYSIS:");
    console.log("─".repeat(80));
    const descLength = product.description?.length || 0;
    const descWords = product.description?.split(/\s+/).length || 0;
    console.log(`Length: ${descLength} characters`);
    console.log(`Word Count: ${descWords} words`);
    console.log(
      `Quality: ${descWords >= 300 ? "✅ EXCELLENT (300+ words)" : descWords >= 150 ? "⚠️  GOOD (150+ words)" : "❌ TOO SHORT (< 150 words)"}`
    );
    console.log(`\nPreview:\n${product.description?.substring(0, 400)}...\n`);

    // Tags Analysis
    console.log("🏷️  TAGS ANALYSIS:");
    console.log("─".repeat(80));
    console.log(`Count: ${product.tags.length} tags`);
    console.log(
      `Quality: ${product.tags.length >= 15 ? "✅ EXCELLENT (15+ tags)" : product.tags.length >= 10 ? "⚠️  GOOD (10+ tags)" : "❌ NEEDS MORE (< 10 tags)"}`
    );
    console.log(`Tags: ${product.tags.join(", ")}\n`);

    // Categorization
    console.log("🎯 CATEGORIZATION:");
    console.log("─".repeat(80));
    console.log(`Age Group: ${product.ageGroup || "❌ MISSING"}`);
    console.log(`STEM Discipline: ${product.stemDiscipline || "❌ MISSING"}\n`);

    // Metadata Analysis
    const meta = product.metadata
      ? typeof product.metadata === "string"
        ? JSON.parse(product.metadata)
        : product.metadata
      : null;

    if (meta?.seo) {
      console.log("🔍 SEO METADATA ANALYSIS:");
      console.log("─".repeat(80));

      const titleLength = meta.seo.metaTitle?.length || 0;
      const metaDescLength = meta.seo.metaDescription?.length || 0;
      const keywordsCount = meta.seo.metaKeywords?.length || 0;

      console.log(`\n📌 Meta Title:`);
      console.log(`  Length: ${titleLength} chars`);
      console.log(
        `  Quality: ${titleLength >= 50 && titleLength <= 60 ? "✅ PERFECT (50-60 chars)" : titleLength >= 40 ? "⚠️  OK (40+ chars)" : "❌ TOO SHORT (< 40 chars)"}`
      );
      console.log(`  Content: "${meta.seo.metaTitle}"`);

      console.log(`\n📝 Meta Description:`);
      console.log(`  Length: ${metaDescLength} chars`);
      console.log(
        `  Quality: ${metaDescLength >= 150 && metaDescLength <= 160 ? "✅ PERFECT (150-160 chars)" : metaDescLength >= 120 ? "⚠️  OK (120+ chars)" : "❌ TOO SHORT (< 120 chars)"}`
      );
      console.log(`  Content: "${meta.seo.metaDescription}"`);

      console.log(`\n🔑 Meta Keywords:`);
      console.log(`  Count: ${keywordsCount} keywords`);
      console.log(
        `  Quality: ${keywordsCount >= 20 ? "✅ EXCELLENT (20+ keywords)" : keywordsCount >= 10 ? "⚠️  GOOD (10+ keywords)" : "❌ NEEDS MORE (< 10 keywords)"}`
      );
      console.log(
        `  Keywords: ${meta.seo.metaKeywords?.slice(0, 15).join(", ")}...`
      );
    } else {
      console.log("\n❌ NO SEO METADATA FOUND!");
    }

    console.log("\n📚 EDUCATIONAL METADATA:");
    console.log("─".repeat(80));
    console.log(`Product Type: ${meta?.productType || "❌ MISSING"}`);
    console.log(
      `Learning Outcomes: ${meta?.learningOutcomes?.length || 0} items`
    );
    if (meta?.learningOutcomes?.length > 0) {
      console.log(`  → ${meta.learningOutcomes.join(", ")}`);
    }
    console.log(
      `Romanian Competencies: ${meta?.romanianCompetencies?.length || 0} items`
    );
    if (meta?.romanianCompetencies?.length > 0) {
      meta.romanianCompetencies.forEach((comp: string, i: number) => {
        console.log(`  ${i + 1}. ${comp}`);
      });
    }
    console.log(
      `Curriculum Alignment: ${meta?.romanianCurriculumAlignment?.length || 0} items`
    );
    if (meta?.romanianCurriculumAlignment?.length > 0) {
      meta.romanianCurriculumAlignment.forEach((curr: string, i: number) => {
        console.log(`  ${i + 1}. ${curr}`);
      });
    }
    console.log(
      `Subject Areas: ${meta?.romanianSubjectAreas?.join(", ") || "❌ MISSING"}`
    );
    console.log(
      `Educational Level: ${meta?.romanianEducationalLevel || "❌ MISSING"}`
    );

    // Attributes Analysis
    const attrs = product.attributes
      ? typeof product.attributes === "string"
        ? JSON.parse(product.attributes)
        : product.attributes
      : null;

    console.log("\n⚙️  PRODUCT SPECIFICATIONS:");
    console.log("─".repeat(80));
    if (attrs?.specs) {
      const specsCount = Object.keys(attrs.specs).length;
      console.log(`Count: ${specsCount} specifications`);
      console.log(
        `Quality: ${specsCount >= 12 ? "✅ EXCELLENT (12+ specs)" : specsCount >= 8 ? "⚠️  GOOD (8+ specs)" : "❌ NEEDS MORE (< 8 specs)"}`
      );
      console.log(`\nSpecifications:`);
      Object.entries(attrs.specs).forEach(([key, value]) => {
        console.log(`  - ${key}: ${value}`);
      });
    } else {
      console.log("❌ NO SPECS FOUND!");
    }

    // Overall Score
    console.log("\n" + "=".repeat(80));
    console.log("📊 OVERALL SEO SCORE");
    console.log("=".repeat(80));

    let score = 0;

    // Description (20 points)
    if (descWords >= 300) score += 20;
    else if (descWords >= 150) score += 10;

    // Tags (15 points)
    if (product.tags.length >= 15) score += 15;
    else if (product.tags.length >= 10) score += 10;
    else if (product.tags.length >= 5) score += 5;

    // Categorization (10 points)
    if (product.ageGroup) score += 5;
    if (product.stemDiscipline) score += 5;

    // SEO Metadata (30 points)
    if (meta?.seo) {
      const titleLen = meta.seo.metaTitle?.length || 0;
      const metaDescLen = meta.seo.metaDescription?.length || 0;
      const keyCount = meta.seo.metaKeywords?.length || 0;

      if (titleLen >= 50 && titleLen <= 60) score += 10;
      else if (titleLen >= 40) score += 5;

      if (metaDescLen >= 150 && metaDescLen <= 160) score += 10;
      else if (metaDescLen >= 120) score += 5;

      if (keyCount >= 20) score += 10;
      else if (keyCount >= 10) score += 5;
    }

    // Educational Metadata (15 points)
    if (meta?.learningOutcomes?.length >= 3) score += 5;
    if (meta?.romanianCompetencies?.length >= 3) score += 5;
    if (meta?.romanianCurriculumAlignment?.length >= 3) score += 5;

    // Product Specs (10 points)
    if (attrs?.specs) {
      const specsCount = Object.keys(attrs.specs).length;
      if (specsCount >= 10) score += 10;
      else if (specsCount >= 5) score += 5;
    }

    console.log(`\nFinal Score: ${score}/100`);
    console.log(
      `Grade: ${score >= 90 ? "🏆 A+ (Exceptional)" : score >= 80 ? "✅ A (Excellent)" : score >= 70 ? "⚠️  B (Good)" : score >= 60 ? "⚠️  C (Fair)" : "❌ D (Poor)"}`
    );
    console.log(
      `\nRanking Potential: ${score >= 85 ? "🚀 Top 3 Rankings Expected" : score >= 70 ? "📈 Top 10 Possible" : score >= 50 ? "📊 Will Rank But Low" : "❌ Needs Major Improvement"}`
    );

    console.log("\n" + "=".repeat(80));
    console.log("💡 RECOMMENDATIONS FOR IMPROVEMENT");
    console.log("=".repeat(80) + "\n");

    const recommendations = [];

    if (descWords < 300)
      recommendations.push({
        priority: "HIGH",
        issue: "Description too short",
        current: `${descWords} words`,
        target: "400-600 words",
        impact: "Low content score, poor rankings",
      });

    if (product.tags.length < 15)
      recommendations.push({
        priority: "HIGH",
        issue: "Not enough tags",
        current: `${product.tags.length} tags`,
        target: "15-20 bilingual tags",
        impact: "Poor discoverability",
      });

    if (!meta?.seo?.metaTitle || meta.seo.metaTitle.length < 50)
      recommendations.push({
        priority: "CRITICAL",
        issue: "Meta title too short",
        current: `${meta?.seo?.metaTitle?.length || 0} chars`,
        target: "50-60 chars",
        impact: "Low click-through rate",
      });

    if (!meta?.seo?.metaDescription || meta.seo.metaDescription.length < 150)
      recommendations.push({
        priority: "CRITICAL",
        issue: "Meta description too short",
        current: `${meta?.seo?.metaDescription?.length || 0} chars`,
        target: "150-160 chars",
        impact: "Low click-through rate, poor rankings",
      });

    if (!meta?.seo?.metaKeywords || meta.seo.metaKeywords.length < 20)
      recommendations.push({
        priority: "HIGH",
        issue: "Not enough keywords",
        current: `${meta?.seo?.metaKeywords?.length || 0} keywords`,
        target: "25-35 keywords",
        impact: "Limited search coverage",
      });

    if (!meta?.learningOutcomes || meta.learningOutcomes.length < 3)
      recommendations.push({
        priority: "MEDIUM",
        issue: "Missing learning outcomes",
        current: `${meta?.learningOutcomes?.length || 0} outcomes`,
        target: "3-5 outcomes",
        impact: "Low educational credibility",
      });

    if (!meta?.romanianCompetencies || meta.romanianCompetencies.length < 3)
      recommendations.push({
        priority: "MEDIUM",
        issue: "Missing Romanian competencies",
        current: `${meta?.romanianCompetencies?.length || 0} items`,
        target: "3-5 specific competencies",
        impact: "No curriculum alignment",
      });

    if (!attrs?.specs || Object.keys(attrs.specs).length < 10)
      recommendations.push({
        priority: "MEDIUM",
        issue: "Insufficient product specs",
        current: `${Object.keys(attrs?.specs || {}).length} specs`,
        target: "12-15 detailed specs",
        impact: "Incomplete product information",
      });

    if (recommendations.length === 0) {
      console.log("🎉 PERFECT! No improvements needed!");
    } else {
      recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. [${rec.priority}] ${rec.issue}`);
        console.log(`   Current: ${rec.current}`);
        console.log(`   Target: ${rec.target}`);
        console.log(`   Impact: ${rec.impact}\n`);
      });
    }

    console.log("=".repeat(80) + "\n");

    await db.$disconnect();
  } catch (error) {
    console.error("Error:", error);
    await db.$disconnect();
    process.exit(1);
  }
}

// Get product ID from command line or use default
const productId = process.argv[2] || "cmgjacepg0003jnuy5gt1qeqq";

analyzeSEOQuality(productId);
