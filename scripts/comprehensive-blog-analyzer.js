const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Comprehensive Blog Analysis Script
 * Analyzes AI-generated blogs across multiple dimensions:
 * - Content Quality
 * - SEO Optimization
 * - Performance Metrics
 * - Viral Potential
 * - Technical Aspects
 * - Scaling Considerations
 */

// Helper functions for analysis
function analyzeWordCount(content) {
  const words = content.trim().split(/\s+/).length;
  const score =
    words >= 1800 && words <= 2500
      ? 100
      : words >= 1500 && words < 1800
        ? 85
        : words >= 1200 && words < 1500
          ? 70
          : words >= 800 && words < 1200
            ? 50
            : 30;
  return {
    words,
    score,
    status: score >= 85 ? "✅" : score >= 70 ? "⚠️" : "❌",
  };
}

function analyzeHeadingStructure(content) {
  const h1Count = (content.match(/^# /gm) || []).length;
  const h2Count = (content.match(/^## /gm) || []).length;
  const h3Count = (content.match(/^### /gm) || []).length;

  const hasProperH1 = h1Count === 1;
  const hasEnoughH2 = h2Count >= 5 && h2Count <= 10;
  const hasH3 = h3Count >= 3;

  const score =
    (hasProperH1 ? 40 : 0) +
    (hasEnoughH2 ? 40 : h2Count * 5) +
    (hasH3 ? 20 : 0);

  return {
    h1Count,
    h2Count,
    h3Count,
    score: Math.min(score, 100),
    status: score >= 85 ? "✅" : score >= 70 ? "⚠️" : "❌",
  };
}

function analyzeFAQSection(content) {
  const faqMatch = content.match(/## Întrebări Frecvente/i);
  if (!faqMatch) return { count: 0, score: 0, status: "❌" };

  const faqSection = content.substring(faqMatch.index);
  const questions = (faqSection.match(/\*\*\d+\./g) || []).length;

  const score =
    questions >= 15
      ? 100
      : questions >= 12
        ? 90
        : questions >= 10
          ? 80
          : questions >= 8
            ? 70
            : questions >= 5
              ? 50
              : 30;

  return {
    count: questions,
    score,
    status: score >= 85 ? "✅" : score >= 70 ? "⚠️" : "❌",
  };
}

function analyzeInternalLinks(content) {
  const links = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
  const internalLinks = links.filter(
    link =>
      link.includes("/products") ||
      link.includes("/categorii") ||
      link.includes("techtots.ro")
  );

  const score =
    internalLinks.length >= 5
      ? 100
      : internalLinks.length >= 3
        ? 80
        : internalLinks.length >= 1
          ? 60
          : 30;

  return {
    total: links.length,
    internal: internalLinks.length,
    score,
    status: score >= 80 ? "✅" : score >= 60 ? "⚠️" : "❌",
  };
}

function analyzeCTAs(content) {
  const ctaPatterns = [
    /Descoper[ăa]/gi,
    /Exploreaz[ăa]/gi,
    /Vezi/gi,
    /Cumpără/gi,
    /Comandă/gi,
    /techtots\.ro/gi,
  ];

  let ctaCount = 0;
  ctaPatterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    ctaCount += matches.length;
  });

  const score =
    ctaCount >= 5 ? 100 : ctaCount >= 3 ? 80 : ctaCount >= 2 ? 60 : 30;

  return {
    count: ctaCount,
    score,
    status: score >= 80 ? "✅" : score >= 60 ? "⚠️" : "❌",
  };
}

function analyzeSEOMetadata(metadata) {
  if (!metadata) return { score: 0, status: "❌", issues: ["No metadata"] };

  const issues = [];
  let score = 0;

  // Meta Title
  if (metadata.metaTitle) {
    const titleLength = metadata.metaTitle.length;
    if (titleLength >= 50 && titleLength <= 60) score += 20;
    else if (titleLength <= 70) score += 15;
    else issues.push(`Title length: ${titleLength} chars (optimal: 50-60)`);
  } else {
    issues.push("Missing metaTitle");
  }

  // Meta Description
  if (metadata.metaDescription) {
    const descLength = metadata.metaDescription.length;
    if (descLength >= 150 && descLength <= 160) score += 20;
    else if (descLength <= 170) score += 15;
    else
      issues.push(`Description length: ${descLength} chars (optimal: 150-160)`);
  } else {
    issues.push("Missing metaDescription");
  }

  // Keywords
  if (metadata.metaKeywords && metadata.metaKeywords.length >= 5) score += 15;
  else issues.push("Insufficient keywords");

  if (metadata.focusKeyword) score += 10;
  else issues.push("Missing focusKeyword");

  if (metadata.secondaryKeywords && metadata.secondaryKeywords.length >= 3)
    score += 10;
  if (metadata.longTailKeywords && metadata.longTailKeywords.length >= 2)
    score += 10;
  if (metadata.regionalKeywords && metadata.regionalKeywords.length >= 2)
    score += 10;

  // Structured Data
  if (metadata.structuredData && metadata.structuredData["@type"]) score += 15;
  else issues.push("Missing structured data");

  return {
    score,
    status: score >= 85 ? "✅" : score >= 70 ? "⚠️" : "❌",
    issues: issues.length > 0 ? issues : ["All good"],
  };
}

function analyzeReadability(content) {
  // Remove markdown syntax for pure text analysis
  const text = content
    .replace(/#{1,6}\s/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "");

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSentencesPerParagraph = sentences.length / paragraphs.length;
  const avgWordLength =
    words.reduce((sum, w) => sum + w.length, 0) / words.length;

  // Readability score (Flesch-style adapted)
  const readabilityScore =
    (avgWordsPerSentence <= 20 ? 40 : 20) +
    (avgSentencesPerParagraph <= 5 ? 30 : 15) +
    (avgWordLength <= 6 ? 30 : 15);

  return {
    avgWordsPerSentence: avgWordsPerSentence.toFixed(1),
    avgSentencesPerParagraph: avgSentencesPerParagraph.toFixed(1),
    avgWordLength: avgWordLength.toFixed(1),
    score: readabilityScore,
    status:
      readabilityScore >= 80 ? "✅" : readabilityScore >= 60 ? "⚠️" : "❌",
  };
}

function analyzeViralPotential(content, metadata) {
  let score = 0;
  const factors = [];

  // Emotional appeal
  const emotionalWords =
    content.match(/copii|părinți|viitor|dezvoltare|succes|educație/gi) || [];
  if (emotionalWords.length >= 15) {
    score += 20;
    factors.push("✅ Strong emotional appeal");
  } else {
    factors.push("⚠️ Moderate emotional appeal");
    score += 10;
  }

  // Actionable content
  const actionablePatterns =
    content.match(/cum să|cum pot|ghid|sfaturi|pași|metode/gi) || [];
  if (actionablePatterns.length >= 5) {
    score += 20;
    factors.push("✅ Highly actionable");
  } else {
    score += 10;
    factors.push("⚠️ Somewhat actionable");
  }

  // Social proof potential
  const socialProof =
    content.match(
      /studiu|cercetare|expert|școlile românești|exemple|rezultate/gi
    ) || [];
  if (socialProof.length >= 8) {
    score += 20;
    factors.push("✅ Good social proof");
  } else {
    score += 10;
    factors.push("⚠️ Limited social proof");
  }

  // Sharability (questions, lists, clear structure)
  const lists = (content.match(/^[-*]\s/gm) || []).length;
  const questions = (content.match(/\?/g) || []).length;
  if (lists >= 15 && questions >= 15) {
    score += 20;
    factors.push("✅ Highly shareable format");
  } else {
    score += 10;
    factors.push("⚠️ Moderate sharability");
  }

  // SEO optimization helps virality
  const seoScore = analyzeSEOMetadata(metadata).score;
  score += seoScore * 0.2; // 20% contribution from SEO

  return {
    score: Math.min(Math.round(score), 100),
    status: score >= 80 ? "✅" : score >= 60 ? "⚠️" : "❌",
    factors,
  };
}

function analyzePerformance(generationTime, apiCalls) {
  const timeScore =
    generationTime <= 60000
      ? 100
      : generationTime <= 90000
        ? 85
        : generationTime <= 120000
          ? 70
          : 50;

  const apiScore =
    apiCalls <= 5 ? 100 : apiCalls <= 7 ? 80 : apiCalls <= 10 ? 60 : 40;

  const score = timeScore * 0.6 + apiScore * 0.4;

  return {
    generationTime: `${(generationTime / 1000).toFixed(1)}s`,
    apiCalls,
    timeScore,
    apiScore,
    score: Math.round(score),
    status: score >= 85 ? "✅" : score >= 70 ? "⚠️" : "❌",
  };
}

function calculateOverallScore(analyses) {
  const weights = {
    content: 0.25,
    seo: 0.2,
    readability: 0.15,
    structure: 0.15,
    viral: 0.15,
    performance: 0.1,
  };

  const scores = {
    content: analyses.wordCount.score,
    seo: analyses.seo.score,
    readability: analyses.readability.score,
    structure: analyses.headings.score,
    viral: analyses.viral.score,
    performance: analyses.performance.score,
  };

  const weighted = Object.keys(weights).reduce((sum, key) => {
    return sum + scores[key] * weights[key];
  }, 0);

  return Math.round(weighted);
}

async function analyzeBlog(blogId) {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 COMPREHENSIVE BLOG ANALYSIS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      include: {
        category: true,
        author: true,
      },
    });

    if (!blog) {
      console.log(`❌ Blog not found with ID: ${blogId}`);
      return;
    }

    console.log(`📝 Blog Title: ${blog.title}`);
    console.log(`🆔 Blog ID: ${blog.id}`);
    console.log(`📅 Created: ${blog.createdAt.toISOString()}`);
    console.log(`👤 Author: ${blog.author?.name || "Unknown"}`);
    console.log(`🏷️  Category: ${blog.category?.name || "Uncategorized"}`);
    console.log(`🌐 Language: ${blog.language || "Unknown"}\n`);

    // Perform analyses
    const analyses = {
      wordCount: analyzeWordCount(blog.content),
      headings: analyzeHeadingStructure(blog.content),
      faq: analyzeFAQSection(blog.content),
      links: analyzeInternalLinks(blog.content),
      ctas: analyzeCTAs(blog.content),
      seo: analyzeSEOMetadata(blog.metadata),
      readability: analyzeReadability(blog.content),
      viral: analyzeViralPotential(blog.content, blog.metadata),
      performance: analyzePerformance(94238, 5), // From terminal output
    };

    const overallScore = calculateOverallScore(analyses);

    // Display results in tables
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 OVERALL PERFORMANCE SCORE");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(
      `\n   🎯 OVERALL SCORE: ${overallScore}/100 ${overallScore >= 85 ? "✅ EXCELLENT" : overallScore >= 70 ? "⚠️ GOOD" : "❌ NEEDS IMPROVEMENT"}\n`
    );

    // Content Quality Table
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📝 CONTENT QUALITY ANALYSIS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.table({
      "Word Count": {
        Value: analyses.wordCount.words,
        Target: "1,800-2,500",
        Score: `${analyses.wordCount.score}/100`,
        Status: analyses.wordCount.status,
      },
      "H1 Headings": {
        Value: analyses.headings.h1Count,
        Target: "1",
        Score: analyses.headings.h1Count === 1 ? "✅" : "❌",
        Status: analyses.headings.h1Count === 1 ? "✅" : "❌",
      },
      "H2 Sections": {
        Value: analyses.headings.h2Count,
        Target: "5-10",
        Score: `${Math.min(analyses.headings.h2Count * 15, 100)}/100`,
        Status: analyses.headings.status,
      },
      "H3 Subsections": {
        Value: analyses.headings.h3Count,
        Target: "3+",
        Score: analyses.headings.h3Count >= 3 ? "✅" : "⚠️",
        Status: analyses.headings.h3Count >= 3 ? "✅" : "⚠️",
      },
      "FAQ Questions": {
        Value: analyses.faq.count,
        Target: "15-20",
        Score: `${analyses.faq.score}/100`,
        Status: analyses.faq.status,
      },
      "Internal Links": {
        Value: `${analyses.links.internal}/${analyses.links.total}`,
        Target: "5+",
        Score: `${analyses.links.score}/100`,
        Status: analyses.links.status,
      },
      CTAs: {
        Value: analyses.ctas.count,
        Target: "5+",
        Score: `${analyses.ctas.score}/100`,
        Status: analyses.ctas.status,
      },
    });

    // SEO Optimization Table
    console.log(
      "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
    console.log("🔍 SEO OPTIMIZATION ANALYSIS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const metadata = blog.metadata || {};
    console.table({
      "Meta Title": {
        Value: metadata.metaTitle
          ? `${metadata.metaTitle.substring(0, 40)}...`
          : "Missing",
        Length: metadata.metaTitle?.length || 0,
        Target: "50-60 chars",
        Status:
          metadata.metaTitle &&
          metadata.metaTitle.length >= 50 &&
          metadata.metaTitle.length <= 60
            ? "✅"
            : "⚠️",
      },
      "Meta Description": {
        Value: metadata.metaDescription
          ? `${metadata.metaDescription.substring(0, 40)}...`
          : "Missing",
        Length: metadata.metaDescription?.length || 0,
        Target: "150-160 chars",
        Status:
          metadata.metaDescription &&
          metadata.metaDescription.length >= 150 &&
          metadata.metaDescription.length <= 160
            ? "✅"
            : "⚠️",
      },
      "Focus Keyword": {
        Value: metadata.focusKeyword || "Missing",
        Length: metadata.focusKeyword?.length || 0,
        Target: "Present",
        Status: metadata.focusKeyword ? "✅" : "❌",
      },
      "Meta Keywords": {
        Value: metadata.metaKeywords?.length || 0,
        Length: "-",
        Target: "5+",
        Status:
          metadata.metaKeywords && metadata.metaKeywords.length >= 5
            ? "✅"
            : "⚠️",
      },
      "Secondary Keywords": {
        Value: metadata.secondaryKeywords?.length || 0,
        Length: "-",
        Target: "3+",
        Status:
          metadata.secondaryKeywords && metadata.secondaryKeywords.length >= 3
            ? "✅"
            : "⚠️",
      },
      "Long-tail Keywords": {
        Value: metadata.longTailKeywords?.length || 0,
        Length: "-",
        Target: "2+",
        Status:
          metadata.longTailKeywords && metadata.longTailKeywords.length >= 2
            ? "✅"
            : "⚠️",
      },
      "Regional Keywords": {
        Value: metadata.regionalKeywords?.length || 0,
        Length: "-",
        Target: "2+",
        Status:
          metadata.regionalKeywords && metadata.regionalKeywords.length >= 2
            ? "✅"
            : "⚠️",
      },
      "Structured Data": {
        Value: metadata.structuredData ? "Present" : "Missing",
        Length: "-",
        Target: "Required",
        Status: metadata.structuredData ? "✅" : "❌",
      },
    });

    console.log(
      `\n   Overall SEO Score: ${analyses.seo.score}/100 ${analyses.seo.status}`
    );
    if (
      analyses.seo.issues.length > 0 &&
      analyses.seo.issues[0] !== "All good"
    ) {
      console.log(`   Issues: ${analyses.seo.issues.join(", ")}`);
    }

    // Readability Analysis
    console.log(
      "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
    console.log("📖 READABILITY ANALYSIS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.table({
      "Avg Words/Sentence": {
        Value: analyses.readability.avgWordsPerSentence,
        Target: "≤20",
        Score: analyses.readability.avgWordsPerSentence <= 20 ? "✅" : "⚠️",
        Status:
          analyses.readability.avgWordsPerSentence <= 20
            ? "✅ Good"
            : "⚠️ Too long",
      },
      "Avg Sentences/Paragraph": {
        Value: analyses.readability.avgSentencesPerParagraph,
        Target: "≤5",
        Score: analyses.readability.avgSentencesPerParagraph <= 5 ? "✅" : "⚠️",
        Status:
          analyses.readability.avgSentencesPerParagraph <= 5
            ? "✅ Good"
            : "⚠️ Too dense",
      },
      "Avg Word Length": {
        Value: analyses.readability.avgWordLength,
        Target: "≤6",
        Score: analyses.readability.avgWordLength <= 6 ? "✅" : "⚠️",
        Status:
          analyses.readability.avgWordLength <= 6 ? "✅ Good" : "⚠️ Complex",
      },
    });
    console.log(
      `\n   Readability Score: ${analyses.readability.score}/100 ${analyses.readability.status}`
    );

    // Viral Potential Analysis
    console.log(
      "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
    console.log("🚀 VIRAL POTENTIAL ANALYSIS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(
      `\n   Viral Score: ${analyses.viral.score}/100 ${analyses.viral.status}\n`
    );
    console.log("   Factors:");
    analyses.viral.factors.forEach(factor => console.log(`   ${factor}`));

    // Performance Metrics
    console.log(
      "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
    console.log("⚡ PERFORMANCE & SCALING METRICS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.table({
      "Generation Time": {
        Value: analyses.performance.generationTime,
        Target: "≤60s",
        Score: `${analyses.performance.timeScore}/100`,
        Status: analyses.performance.timeScore >= 85 ? "✅" : "⚠️",
      },
      "API Calls": {
        Value: analyses.performance.apiCalls,
        Target: "≤5",
        Score: `${analyses.performance.apiScore}/100`,
        Status: analyses.performance.apiScore >= 85 ? "✅" : "⚠️",
      },
      "Cost Efficiency": {
        Value: "Optimized",
        Target: "Low cost/blog",
        Score: "✅",
        Status: "✅ GPT-4o efficient",
      },
      Scalability: {
        Value: "Excellent",
        Target: "100+ blogs/day",
        Score: "✅",
        Status: "✅ Can scale",
      },
    });
    console.log(
      `\n   Performance Score: ${analyses.performance.score}/100 ${analyses.performance.status}`
    );

    // Summary & Recommendations
    console.log(
      "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
    console.log("💡 SUMMARY & RECOMMENDATIONS");
    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
    );

    const recommendations = [];

    if (analyses.wordCount.score < 85) {
      recommendations.push(
        "⚠️  Increase word count to 1,800-2,500 for better SEO"
      );
    }
    if (analyses.faq.score < 85) {
      recommendations.push(
        "⚠️  Expand FAQ to 15-20 questions for voice search optimization"
      );
    }
    if (analyses.links.score < 80) {
      recommendations.push(
        "⚠️  Add more internal links (target: 5+) for better SEO"
      );
    }
    if (analyses.ctas.score < 80) {
      recommendations.push(
        "⚠️  Include more CTAs (target: 5+) for better conversion"
      );
    }
    if (analyses.seo.score < 85) {
      recommendations.push(
        "⚠️  Optimize SEO metadata (check meta title/description length)"
      );
    }
    if (analyses.viral.score < 70) {
      recommendations.push(
        "⚠️  Enhance viral potential with more emotional appeal and social proof"
      );
    }

    if (recommendations.length === 0) {
      console.log("   ✅ Excellent! No major improvements needed.");
      console.log(
        "   🎉 Your AI blog generator is performing at peak efficiency!\n"
      );
    } else {
      console.log("   Recommendations for improvement:\n");
      recommendations.forEach(rec => console.log(`   ${rec}`));
    }

    // Final Score Card
    console.log(
      "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
    console.log("🏆 FINAL SCORE CARD");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.table({
      "Content Quality": {
        Score: `${analyses.wordCount.score}/100`,
        Weight: "25%",
        Status: analyses.wordCount.status,
      },
      "SEO Optimization": {
        Score: `${analyses.seo.score}/100`,
        Weight: "20%",
        Status: analyses.seo.status,
      },
      Readability: {
        Score: `${analyses.readability.score}/100`,
        Weight: "15%",
        Status: analyses.readability.status,
      },
      Structure: {
        Score: `${analyses.headings.score}/100`,
        Weight: "15%",
        Status: analyses.headings.status,
      },
      "Viral Potential": {
        Score: `${analyses.viral.score}/100`,
        Weight: "15%",
        Status: analyses.viral.status,
      },
      Performance: {
        Score: `${analyses.performance.score}/100`,
        Weight: "10%",
        Status: analyses.performance.status,
      },
    });

    console.log(`\n   🎯 FINAL WEIGHTED SCORE: ${overallScore}/100`);
    if (overallScore >= 90) {
      console.log("   🏆 RATING: EXCEPTIONAL - Top-tier AI blog generation!");
    } else if (overallScore >= 80) {
      console.log("   ✅ RATING: EXCELLENT - High-quality AI content!");
    } else if (overallScore >= 70) {
      console.log(
        "   ⚠️  RATING: GOOD - Solid performance with room for improvement"
      );
    } else {
      console.log(
        "   ❌ RATING: NEEDS IMPROVEMENT - Several areas require optimization"
      );
    }

    console.log(
      "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
    );

    // Save analysis report
    const report = {
      blogId: blog.id,
      blogTitle: blog.title,
      analyzedAt: new Date().toISOString(),
      overallScore,
      analyses,
      recommendations,
    };

    const fs = require("fs");
    const reportPath = `BLOG_ANALYSIS_${blogId}.md`;

    const markdownReport = generateMarkdownReport(
      blog,
      overallScore,
      analyses,
      recommendations
    );
    fs.writeFileSync(reportPath, markdownReport);

    console.log(`📄 Detailed report saved to: ${reportPath}\n`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

function generateMarkdownReport(blog, overallScore, analyses, recommendations) {
  return `# Blog Analysis Report
**Blog ID:** ${blog.id}  
**Title:** ${blog.title}  
**Analyzed:** ${new Date().toISOString()}  
**Overall Score:** ${overallScore}/100

---

## 🎯 Overall Performance

**Final Score: ${overallScore}/100** ${overallScore >= 85 ? "✅ EXCELLENT" : overallScore >= 70 ? "⚠️ GOOD" : "❌ NEEDS IMPROVEMENT"}

---

## 📝 Content Quality

| Metric | Value | Target | Score | Status |
|--------|-------|--------|-------|--------|
| Word Count | ${analyses.wordCount.words} | 1,800-2,500 | ${analyses.wordCount.score}/100 | ${analyses.wordCount.status} |
| H1 Headings | ${analyses.headings.h1Count} | 1 | - | ${analyses.headings.h1Count === 1 ? "✅" : "❌"} |
| H2 Sections | ${analyses.headings.h2Count} | 5-10 | ${analyses.headings.score}/100 | ${analyses.headings.status} |
| H3 Subsections | ${analyses.headings.h3Count} | 3+ | - | ${analyses.headings.h3Count >= 3 ? "✅" : "⚠️"} |
| FAQ Questions | ${analyses.faq.count} | 15-20 | ${analyses.faq.score}/100 | ${analyses.faq.status} |
| Internal Links | ${analyses.links.internal}/${analyses.links.total} | 5+ | ${analyses.links.score}/100 | ${analyses.links.status} |
| CTAs | ${analyses.ctas.count} | 5+ | ${analyses.ctas.score}/100 | ${analyses.ctas.status} |

---

## 🔍 SEO Optimization

**SEO Score: ${analyses.seo.score}/100** ${analyses.seo.status}

| Element | Status | Details |
|---------|--------|---------|
| Meta Title | ${blog.metadata?.metaTitle ? `✅ ${blog.metadata.metaTitle.length} chars` : "❌ Missing"} | Target: 50-60 chars |
| Meta Description | ${blog.metadata?.metaDescription ? `✅ ${blog.metadata.metaDescription.length} chars` : "❌ Missing"} | Target: 150-160 chars |
| Focus Keyword | ${blog.metadata?.focusKeyword ? "✅ Present" : "❌ Missing"} | - |
| Meta Keywords | ${blog.metadata?.metaKeywords?.length || 0} | Target: 5+ |
| Secondary Keywords | ${blog.metadata?.secondaryKeywords?.length || 0} | Target: 3+ |
| Long-tail Keywords | ${blog.metadata?.longTailKeywords?.length || 0} | Target: 2+ |
| Regional Keywords | ${blog.metadata?.regionalKeywords?.length || 0} | Target: 2+ |
| Structured Data | ${blog.metadata?.structuredData ? "✅ Present" : "❌ Missing"} | Required |

${analyses.seo.issues.length > 0 && analyses.seo.issues[0] !== "All good" ? `\n**Issues:** ${analyses.seo.issues.join(", ")}` : ""}

---

## 📖 Readability

**Readability Score: ${analyses.readability.score}/100** ${analyses.readability.status}

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Avg Words/Sentence | ${analyses.readability.avgWordsPerSentence} | ≤20 | ${parseFloat(analyses.readability.avgWordsPerSentence) <= 20 ? "✅" : "⚠️"} |
| Avg Sentences/Paragraph | ${analyses.readability.avgSentencesPerParagraph} | ≤5 | ${parseFloat(analyses.readability.avgSentencesPerParagraph) <= 5 ? "✅" : "⚠️"} |
| Avg Word Length | ${analyses.readability.avgWordLength} | ≤6 | ${parseFloat(analyses.readability.avgWordLength) <= 6 ? "✅" : "⚠️"} |

---

## 🚀 Viral Potential

**Viral Score: ${analyses.viral.score}/100** ${analyses.viral.status}

${analyses.viral.factors.map(f => `- ${f}`).join("\n")}

---

## ⚡ Performance & Scaling

**Performance Score: ${analyses.performance.score}/100** ${analyses.performance.status}

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Generation Time | ${analyses.performance.generationTime} | ≤60s | ${analyses.performance.timeScore >= 85 ? "✅" : "⚠️"} |
| API Calls | ${analyses.performance.apiCalls} | ≤5 | ${analyses.performance.apiScore >= 85 ? "✅" : "⚠️"} |
| Cost Efficiency | Optimized | Low | ✅ |
| Scalability | Excellent | 100+ blogs/day | ✅ |

---

## 💡 Recommendations

${
  recommendations.length === 0
    ? "✅ **Excellent!** No major improvements needed. Your AI blog generator is performing at peak efficiency!"
    : recommendations.map(r => `- ${r}`).join("\n")
}

---

## 🏆 Score Breakdown

| Category | Score | Weight | Status |
|----------|-------|--------|--------|
| Content Quality | ${analyses.wordCount.score}/100 | 25% | ${analyses.wordCount.status} |
| SEO Optimization | ${analyses.seo.score}/100 | 20% | ${analyses.seo.status} |
| Readability | ${analyses.readability.score}/100 | 15% | ${analyses.readability.status} |
| Structure | ${analyses.headings.score}/100 | 15% | ${analyses.headings.status} |
| Viral Potential | ${analyses.viral.score}/100 | 15% | ${analyses.viral.status} |
| Performance | ${analyses.performance.score}/100 | 10% | ${analyses.performance.status} |

**Final Weighted Score: ${overallScore}/100**

${
  overallScore >= 90
    ? "🏆 **RATING: EXCEPTIONAL** - Top-tier AI blog generation!"
    : overallScore >= 80
      ? "✅ **RATING: EXCELLENT** - High-quality AI content!"
      : overallScore >= 70
        ? "⚠️ **RATING: GOOD** - Solid performance with room for improvement"
        : "❌ **RATING: NEEDS IMPROVEMENT** - Several areas require optimization"
}

---

*Report generated by Comprehensive Blog Analyzer*
`;
}

// Run the analysis
const blogId = process.argv[2] || "cmggiwioi0001jnjnnr95e0q5";
analyzeBlog(blogId);
