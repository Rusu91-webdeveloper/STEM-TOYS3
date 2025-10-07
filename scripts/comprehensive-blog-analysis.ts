import { db } from "../lib/db";

interface BlogAnalysis {
  blogId: string;
  title: string;
  slug: string;

  // Content Quality Analysis
  contentQuality: {
    wordCount: number;
    readingTime: number;
    paragraphCount: number;
    headingStructure: {
      h1: number;
      h2: number;
      h3: number;
      h4: number;
    };
    hasImages: boolean;
    hasInternalLinks: boolean;
    hasExternalLinks: boolean;
    hasCTA: boolean;
    contentCompleteness: string;
    score: number;
    issues: string[];
  };

  // SEO Analysis
  seo: {
    metaTitle: string | null;
    metaTitleLength: number;
    metaDescription: string | null;
    metaDescriptionLength: number;
    focusKeyword: string | null;
    keywordInTitle: boolean;
    keywordInMetaDescription: boolean;
    keywordInContent: boolean;
    keywordDensity: number;
    hasStructuredData: boolean;
    hasOpenGraph: boolean;
    internalLinksCount: number;
    externalLinksCount: number;
    score: number;
    issues: string[];
  };

  // Performance Analysis
  performance: {
    contentSize: number;
    hasLargeImages: boolean;
    excessiveHTML: boolean;
    loadTimeEstimate: string;
    score: number;
    issues: string[];
  };

  // Scalability Analysis
  scalability: {
    isPublished: boolean;
    hasAuthor: boolean;
    hasCategory: boolean;
    hasTags: boolean;
    hasMetadata: boolean;
    isIndexable: boolean;
    score: number;
    issues: string[];
  };

  // Search Ranking Potential
  searchRanking: {
    targetKeyword: string;
    competitionLevel: string;
    rankingPotential: string;
    keyFactors: string[];
    improvementSuggestions: string[];
    score: number;
  };

  // Overall Score
  overallScore: number;
  overallGrade: string;
  criticalIssues: string[];
  recommendations: string[];
}

async function analyzeBlog() {
  const blogId = "cmgged3bv0001jnfgzm51jbv2";

  try {
    const blog = await db.blog.findUnique({
      where: { id: blogId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
      },
    });

    if (!blog) {
      console.log("❌ Blog post not found");
      process.exit(1);
    }

    const analysis: BlogAnalysis = {
      blogId: blog.id,
      title: blog.title,
      slug: blog.slug,
      contentQuality: analyzeContentQuality(blog),
      seo: analyzeSEO(blog),
      performance: analyzePerformance(blog),
      scalability: analyzeScalability(blog),
      searchRanking: analyzeSearchRanking(blog),
      overallScore: 0,
      overallGrade: "",
      criticalIssues: [],
      recommendations: [],
    };

    // Calculate overall score
    analysis.overallScore = Math.round(
      analysis.contentQuality.score * 0.3 +
        analysis.seo.score * 0.3 +
        analysis.performance.score * 0.2 +
        analysis.scalability.score * 0.1 +
        analysis.searchRanking.score * 0.1
    );

    // Determine grade
    if (analysis.overallScore >= 90) analysis.overallGrade = "A+";
    else if (analysis.overallScore >= 80) analysis.overallGrade = "A";
    else if (analysis.overallScore >= 70) analysis.overallGrade = "B";
    else if (analysis.overallScore >= 60) analysis.overallGrade = "C";
    else if (analysis.overallScore >= 50) analysis.overallGrade = "D";
    else analysis.overallGrade = "F";

    // Collect critical issues
    analysis.criticalIssues = [
      ...analysis.contentQuality.issues.filter(i => i.includes("CRITICAL")),
      ...analysis.seo.issues.filter(i => i.includes("CRITICAL")),
      ...analysis.performance.issues.filter(i => i.includes("CRITICAL")),
      ...analysis.scalability.issues.filter(i => i.includes("CRITICAL")),
    ];

    // Generate recommendations
    analysis.recommendations = generateRecommendations(analysis);

    // Print beautiful report
    printAnalysisReport(analysis);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

function analyzeContentQuality(blog: any) {
  const issues: string[] = [];
  let score = 100;

  // Word count
  const wordCount = blog.content.split(/\s+/).length;

  // Reading time
  const readingTime = blog.readingTime || Math.ceil(wordCount / 200);

  // Paragraph count
  const paragraphCount = blog.content
    .split(/\n\n+/)
    .filter((p: string) => p.trim()).length;

  // Heading structure
  const h1Count = (blog.content.match(/^# /gm) || []).length;
  const h2Count = (blog.content.match(/^## /gm) || []).length;
  const h3Count = (blog.content.match(/^### /gm) || []).length;
  const h4Count = (blog.content.match(/^#### /gm) || []).length;

  // Links
  const hasInternalLinks =
    blog.content.includes("](/") || blog.content.includes("(#");
  const hasExternalLinks = blog.content.includes("](http");

  // Images
  const hasImages = blog.coverImage !== null || blog.content.includes("![");

  // CTA
  const hasCTA = blog.content.includes("**[") && blog.content.includes("](#)");

  // Evaluate issues
  if (wordCount < 300) {
    issues.push(
      "CRITICAL: Content too short (< 300 words). Current: " + wordCount
    );
    score -= 30;
  } else if (wordCount < 800) {
    issues.push(
      "⚠️ Content could be longer for better SEO (< 800 words). Current: " +
        wordCount
    );
    score -= 15;
  }

  if (h2Count < 2) {
    issues.push("CRITICAL: Not enough H2 headings for proper structure");
    score -= 20;
  }

  if (!hasImages) {
    issues.push("CRITICAL: No images found - hurts engagement");
    score -= 15;
  }

  if (!hasInternalLinks) {
    issues.push("⚠️ No internal links found - missing SEO opportunity");
    score -= 10;
  }

  if (!hasCTA) {
    issues.push("⚠️ No clear Call-to-Action found");
    score -= 10;
  }

  if (blog.content.includes("](#)")) {
    issues.push("CRITICAL: Placeholder links found (](#)) - needs real URLs");
    score -= 25;
  }

  if (blog.excerpt === blog.title) {
    issues.push("⚠️ Excerpt is identical to title - should be unique");
    score -= 5;
  }

  const contentCompleteness = blog.content.includes("Încorporarea apelurilor")
    ? "INCOMPLETE - Content appears cut off"
    : "COMPLETE";

  if (contentCompleteness === "INCOMPLETE") {
    issues.push("CRITICAL: Content is incomplete/truncated");
    score -= 30;
  }

  return {
    wordCount,
    readingTime,
    paragraphCount,
    headingStructure: {
      h1: h1Count,
      h2: h2Count,
      h3: h3Count,
      h4: h4Count,
    },
    hasImages,
    hasInternalLinks,
    hasExternalLinks,
    hasCTA,
    contentCompleteness,
    score: Math.max(0, score),
    issues,
  };
}

function analyzeSEO(blog: any) {
  const issues: string[] = [];
  let score = 100;

  const metadata = blog.metadata || {};
  const seoData = metadata.seo || {};

  const metaTitle = seoData.metaTitle || null;
  const metaTitleLength = metaTitle ? metaTitle.length : 0;

  const metaDescription = seoData.metaDescription || null;
  const metaDescriptionLength = metaDescription ? metaDescription.length : 0;

  const focusKeyword = seoData.focusKeyword || null;

  // Keyword analysis
  const keywordInTitle =
    focusKeyword &&
    blog.title.toLowerCase().includes(focusKeyword.toLowerCase());
  const keywordInMetaDescription =
    focusKeyword &&
    metaDescription &&
    metaDescription.toLowerCase().includes(focusKeyword.toLowerCase());
  const keywordInContent =
    focusKeyword &&
    blog.content.toLowerCase().includes(focusKeyword.toLowerCase());

  // Keyword density
  let keywordDensity = 0;
  if (focusKeyword) {
    const keywordOccurrences = (
      blog.content
        .toLowerCase()
        .match(new RegExp(focusKeyword.toLowerCase(), "g")) || []
    ).length;
    const totalWords = blog.content.split(/\s+/).length;
    keywordDensity = (keywordOccurrences / totalWords) * 100;
  }

  const hasStructuredData = !!seoData.structuredData;
  const hasOpenGraph = !!seoData.openGraph;

  // Count links
  const internalLinksCount = (blog.content.match(/\]\(\//g) || []).length;
  const externalLinksCount = (blog.content.match(/\]\(http/g) || []).length;

  // Evaluate issues
  if (!metaTitle) {
    issues.push("CRITICAL: No meta title found");
    score -= 20;
  } else if (metaTitleLength < 30 || metaTitleLength > 60) {
    issues.push(
      `⚠️ Meta title length not optimal: ${metaTitleLength} chars (should be 30-60)`
    );
    score -= 10;
  }

  if (!metaDescription) {
    issues.push("CRITICAL: No meta description found");
    score -= 20;
  } else if (metaDescriptionLength < 120 || metaDescriptionLength > 160) {
    issues.push(
      `⚠️ Meta description length not optimal: ${metaDescriptionLength} chars (should be 120-160)`
    );
    score -= 10;
  }

  if (!focusKeyword) {
    issues.push("CRITICAL: No focus keyword defined");
    score -= 15;
  } else {
    if (!keywordInTitle) {
      issues.push("⚠️ Focus keyword not in title");
      score -= 10;
    }
    if (!keywordInMetaDescription) {
      issues.push("⚠️ Focus keyword not in meta description");
      score -= 5;
    }
    if (!keywordInContent) {
      issues.push("CRITICAL: Focus keyword not found in content");
      score -= 15;
    }
    if (keywordDensity < 0.5) {
      issues.push("⚠️ Keyword density too low (< 0.5%)");
      score -= 5;
    } else if (keywordDensity > 3) {
      issues.push(
        "⚠️ Keyword density too high (> 3%) - risk of keyword stuffing"
      );
      score -= 10;
    }
  }

  if (!hasStructuredData) {
    issues.push("⚠️ No structured data (Schema.org) found");
    score -= 10;
  }

  if (!hasOpenGraph) {
    issues.push("⚠️ No Open Graph tags found");
    score -= 5;
  }

  if (internalLinksCount < 3) {
    issues.push("⚠️ Too few internal links (< 3) - should have 3-5");
    score -= 10;
  }

  if (blog.slug.length > 60) {
    issues.push("⚠️ URL slug too long (> 60 chars)");
    score -= 5;
  }

  return {
    metaTitle,
    metaTitleLength,
    metaDescription,
    metaDescriptionLength,
    focusKeyword,
    keywordInTitle,
    keywordInMetaDescription,
    keywordInContent,
    keywordDensity,
    hasStructuredData,
    hasOpenGraph,
    internalLinksCount,
    externalLinksCount,
    score: Math.max(0, score),
    issues,
  };
}

function analyzePerformance(blog: any) {
  const issues: string[] = [];
  let score = 100;

  const contentSize = new Blob([blog.content]).size;
  const contentSizeKB = contentSize / 1024;

  const hasLargeImages = false; // We'd need to check actual image sizes
  const excessiveHTML = blog.content.length > 50000;

  // Estimate load time (very rough)
  let loadTimeEstimate = "< 1s";
  if (contentSizeKB > 100) {
    loadTimeEstimate = "1-2s";
    issues.push("⚠️ Content size is large (> 100KB)");
    score -= 10;
  }
  if (contentSizeKB > 500) {
    loadTimeEstimate = "> 2s";
    issues.push("CRITICAL: Content size is very large (> 500KB)");
    score -= 20;
  }

  if (!blog.coverImage) {
    issues.push("⚠️ No cover image - affects social sharing and engagement");
    score -= 10;
  }

  if (excessiveHTML) {
    issues.push(
      "⚠️ Excessive HTML content - consider splitting or lazy loading"
    );
    score -= 10;
  }

  return {
    contentSize: Math.round(contentSizeKB * 100) / 100,
    hasLargeImages,
    excessiveHTML,
    loadTimeEstimate,
    score: Math.max(0, score),
    issues,
  };
}

function analyzeScalability(blog: any) {
  const issues: string[] = [];
  let score = 100;

  const isPublished = blog.isPublished;
  const hasAuthor = !!blog.author;
  const hasCategory = !!blog.category;
  const hasTags = blog.tags && blog.tags.length > 0;
  const hasMetadata = !!blog.metadata;

  // Indexable if published and has proper metadata
  const isIndexable = isPublished && hasMetadata && blog.metadata.seo;

  if (!isPublished) {
    issues.push("⚠️ Blog not published - won't appear in search results");
    score -= 20;
  }

  if (!hasAuthor) {
    issues.push("CRITICAL: No author assigned");
    score -= 15;
  }

  if (!hasCategory) {
    issues.push("CRITICAL: No category assigned");
    score -= 15;
  }

  if (!hasTags || blog.tags.length < 3) {
    issues.push("⚠️ Insufficient tags (< 3) - limits discoverability");
    score -= 10;
  }

  if (!hasMetadata) {
    issues.push("CRITICAL: No metadata found");
    score -= 30;
  }

  if (!isIndexable) {
    issues.push("CRITICAL: Blog not indexable by search engines");
    score -= 20;
  }

  return {
    isPublished,
    hasAuthor,
    hasCategory,
    hasTags,
    hasMetadata,
    isIndexable,
    score: Math.max(0, score),
    issues,
  };
}

function analyzeSearchRanking(blog: any) {
  const targetKeyword = "STEM toys" || "jucării STEM";
  const competitionLevel = "HIGH"; // STEM toys is a competitive keyword

  // Calculate ranking potential based on various factors
  let score = 50; // Start at medium
  const keyFactors: string[] = [];
  const improvementSuggestions: string[] = [];

  // Content length factor
  const wordCount = blog.content.split(/\s+/).length;
  if (wordCount >= 1500) {
    score += 15;
    keyFactors.push("✅ Adequate content length");
  } else if (wordCount >= 800) {
    score += 5;
    keyFactors.push("⚠️ Moderate content length");
    improvementSuggestions.push(
      "Expand content to 1500+ words for better ranking"
    );
  } else {
    keyFactors.push("❌ Content too short");
    improvementSuggestions.push(
      "CRITICAL: Increase content to at least 1500 words"
    );
  }

  // Keyword optimization
  const metadata = blog.metadata || {};
  const seoData = metadata.seo || {};

  if (seoData.focusKeyword) {
    score += 10;
    keyFactors.push("✅ Focus keyword defined");
  } else {
    keyFactors.push("❌ No focus keyword");
    improvementSuggestions.push("Define a clear focus keyword");
  }

  // Backlinks potential (we can't check actual backlinks)
  keyFactors.push("⚠️ Unknown backlink profile");
  improvementSuggestions.push(
    "Build high-quality backlinks from authoritative sites"
  );

  // Domain authority (assuming this is new/moderate)
  keyFactors.push("⚠️ Domain authority - needs verification");
  improvementSuggestions.push(
    "Increase domain authority through quality content and backlinks"
  );

  // Technical SEO
  if (seoData.structuredData) {
    score += 10;
    keyFactors.push("✅ Structured data present");
  } else {
    keyFactors.push("❌ No structured data");
    improvementSuggestions.push("Add Schema.org markup");
  }

  // Mobile optimization (assumed good with Next.js)
  score += 10;
  keyFactors.push("✅ Mobile-friendly framework");

  // Content quality issues
  if (blog.content.includes("](#)")) {
    score -= 20;
    keyFactors.push("❌ Incomplete links hurt credibility");
    improvementSuggestions.push(
      "CRITICAL: Replace all placeholder links with actual URLs"
    );
  }

  if (blog.content.includes("Încorporarea apelurilor")) {
    score -= 15;
    keyFactors.push("❌ Content appears truncated");
    improvementSuggestions.push("CRITICAL: Complete the blog content");
  }

  // Publishing status
  if (!blog.isPublished) {
    score -= 30;
    keyFactors.push("❌ Not published");
    improvementSuggestions.push("CRITICAL: Publish the blog to start ranking");
  }

  // Local SEO for Romanian market
  if (blog.content.includes("România") || blog.content.includes("București")) {
    score += 10;
    keyFactors.push("✅ Local/regional targeting");
  } else {
    improvementSuggestions.push(
      "Add more location-specific content for Romanian market"
    );
  }

  let rankingPotential = "LOW";
  if (score >= 80) rankingPotential = "HIGH - Likely first page";
  else if (score >= 60)
    rankingPotential = "MEDIUM - May reach first page with optimization";
  else if (score >= 40)
    rankingPotential = "LOW-MEDIUM - Needs significant improvement";
  else rankingPotential = "LOW - Unlikely to rank well";

  return {
    targetKeyword,
    competitionLevel,
    rankingPotential,
    keyFactors,
    improvementSuggestions,
    score: Math.max(0, Math.min(100, score)),
  };
}

function generateRecommendations(analysis: BlogAnalysis): string[] {
  const recommendations: string[] = [];

  // Critical fixes first
  if (analysis.criticalIssues.length > 0) {
    recommendations.push("🚨 CRITICAL FIXES REQUIRED:");
    analysis.criticalIssues.forEach(issue => {
      recommendations.push(`   - ${issue}`);
    });
  }

  // Content recommendations
  if (analysis.contentQuality.score < 70) {
    recommendations.push("\n📝 CONTENT IMPROVEMENTS:");
    if (analysis.contentQuality.wordCount < 800) {
      recommendations.push(
        "   - Expand content to at least 1500 words for better SEO"
      );
    }
    if (!analysis.contentQuality.hasImages) {
      recommendations.push(
        "   - Add relevant images (at least 3-4 high-quality images)"
      );
    }
    if (analysis.contentQuality.contentCompleteness === "INCOMPLETE") {
      recommendations.push(
        "   - Complete the blog content (currently truncated)"
      );
    }
  }

  // SEO recommendations
  if (analysis.seo.score < 70) {
    recommendations.push("\n🔍 SEO IMPROVEMENTS:");
    if (!analysis.seo.focusKeyword) {
      recommendations.push("   - Define a clear focus keyword");
    }
    if (analysis.seo.internalLinksCount < 3) {
      recommendations.push("   - Add more internal links (at least 3-5)");
    }
    if (!analysis.seo.hasStructuredData) {
      recommendations.push("   - Add Schema.org structured data");
    }
  }

  // Search ranking recommendations
  if (analysis.searchRanking.score < 60) {
    recommendations.push("\n🎯 RANKING IMPROVEMENTS:");
    analysis.searchRanking.improvementSuggestions
      .slice(0, 5)
      .forEach(suggestion => {
        recommendations.push(`   - ${suggestion}`);
      });
  }

  // Quick wins
  recommendations.push("\n⚡ QUICK WINS:");
  if (!analysis.scalability.isPublished) {
    recommendations.push(
      "   - Publish the blog immediately after fixing critical issues"
    );
  }
  if (analysis.contentQuality.score >= 70 && analysis.seo.score >= 70) {
    recommendations.push(
      "   - This blog is in good shape! Focus on promotion and backlinks"
    );
  }
  recommendations.push(
    "   - Replace all placeholder links (](#)) with real URLs"
  );
  recommendations.push("   - Add a compelling call-to-action");
  recommendations.push("   - Promote on social media to build engagement");

  return recommendations;
}

function printAnalysisReport(analysis: BlogAnalysis) {
  console.log("\n" + "=".repeat(80));
  console.log("📊 COMPREHENSIVE BLOG ANALYSIS REPORT");
  console.log("=".repeat(80));

  console.log(`\n📝 Blog: ${analysis.title}`);
  console.log(`🆔 ID: ${analysis.blogId}`);
  console.log(`🔗 Slug: ${analysis.slug}`);

  console.log(`\n${"=".repeat(80)}`);
  console.log(
    `🎯 OVERALL SCORE: ${analysis.overallScore}/100 - Grade: ${analysis.overallGrade}`
  );
  console.log("=".repeat(80));

  // Content Quality
  console.log(
    "\n📄 CONTENT QUALITY SCORE: " + analysis.contentQuality.score + "/100"
  );
  console.log("-".repeat(80));
  console.log(`   Word Count: ${analysis.contentQuality.wordCount} words`);
  console.log(`   Reading Time: ${analysis.contentQuality.readingTime} min`);
  console.log(`   Paragraphs: ${analysis.contentQuality.paragraphCount}`);
  console.log(
    `   Heading Structure: H1(${analysis.contentQuality.headingStructure.h1}) H2(${analysis.contentQuality.headingStructure.h2}) H3(${analysis.contentQuality.headingStructure.h3})`
  );
  console.log(
    `   Has Images: ${analysis.contentQuality.hasImages ? "✅" : "❌"}`
  );
  console.log(
    `   Internal Links: ${analysis.contentQuality.hasInternalLinks ? "✅" : "❌"}`
  );
  console.log(`   Has CTA: ${analysis.contentQuality.hasCTA ? "✅" : "❌"}`);
  console.log(
    `   Completeness: ${analysis.contentQuality.contentCompleteness}`
  );
  if (analysis.contentQuality.issues.length > 0) {
    console.log(`   Issues Found:`);
    analysis.contentQuality.issues.forEach(issue =>
      console.log(`      - ${issue}`)
    );
  }

  // SEO
  console.log("\n🔍 SEO SCORE: " + analysis.seo.score + "/100");
  console.log("-".repeat(80));
  console.log(
    `   Meta Title: ${analysis.seo.metaTitle || "❌ MISSING"} (${analysis.seo.metaTitleLength} chars)`
  );
  console.log(
    `   Meta Description: ${analysis.seo.metaDescription ? `✅ ${analysis.seo.metaDescriptionLength} chars` : "❌ MISSING"}`
  );
  console.log(`   Focus Keyword: ${analysis.seo.focusKeyword || "❌ MISSING"}`);
  console.log(
    `   Keyword in Title: ${analysis.seo.keywordInTitle ? "✅" : "❌"}`
  );
  console.log(
    `   Keyword in Meta Desc: ${analysis.seo.keywordInMetaDescription ? "✅" : "❌"}`
  );
  console.log(
    `   Keyword in Content: ${analysis.seo.keywordInContent ? "✅" : "❌"}`
  );
  console.log(`   Keyword Density: ${analysis.seo.keywordDensity.toFixed(2)}%`);
  console.log(
    `   Structured Data: ${analysis.seo.hasStructuredData ? "✅" : "❌"}`
  );
  console.log(`   Open Graph: ${analysis.seo.hasOpenGraph ? "✅" : "❌"}`);
  console.log(`   Internal Links: ${analysis.seo.internalLinksCount}`);
  console.log(`   External Links: ${analysis.seo.externalLinksCount}`);
  if (analysis.seo.issues.length > 0) {
    console.log(`   Issues Found:`);
    analysis.seo.issues.forEach(issue => console.log(`      - ${issue}`));
  }

  // Performance
  console.log("\n⚡ PERFORMANCE SCORE: " + analysis.performance.score + "/100");
  console.log("-".repeat(80));
  console.log(`   Content Size: ${analysis.performance.contentSize} KB`);
  console.log(
    `   Load Time Estimate: ${analysis.performance.loadTimeEstimate}`
  );
  if (analysis.performance.issues.length > 0) {
    console.log(`   Issues Found:`);
    analysis.performance.issues.forEach(issue =>
      console.log(`      - ${issue}`)
    );
  }

  // Scalability
  console.log("\n📈 SCALABILITY SCORE: " + analysis.scalability.score + "/100");
  console.log("-".repeat(80));
  console.log(
    `   Published: ${analysis.scalability.isPublished ? "✅" : "❌"}`
  );
  console.log(`   Has Author: ${analysis.scalability.hasAuthor ? "✅" : "❌"}`);
  console.log(
    `   Has Category: ${analysis.scalability.hasCategory ? "✅" : "❌"}`
  );
  console.log(`   Has Tags: ${analysis.scalability.hasTags ? "✅" : "❌"}`);
  console.log(
    `   Has Metadata: ${analysis.scalability.hasMetadata ? "✅" : "❌"}`
  );
  console.log(
    `   Indexable: ${analysis.scalability.isIndexable ? "✅" : "❌"}`
  );
  if (analysis.scalability.issues.length > 0) {
    console.log(`   Issues Found:`);
    analysis.scalability.issues.forEach(issue =>
      console.log(`      - ${issue}`)
    );
  }

  // Search Ranking Potential
  console.log(
    "\n🎯 SEARCH RANKING POTENTIAL: " + analysis.searchRanking.score + "/100"
  );
  console.log("-".repeat(80));
  console.log(`   Target Keyword: "${analysis.searchRanking.targetKeyword}"`);
  console.log(
    `   Competition Level: ${analysis.searchRanking.competitionLevel}`
  );
  console.log(
    `   Ranking Potential: ${analysis.searchRanking.rankingPotential}`
  );
  console.log(`   Key Factors:`);
  analysis.searchRanking.keyFactors.forEach(factor =>
    console.log(`      ${factor}`)
  );

  if (analysis.searchRanking.improvementSuggestions.length > 0) {
    console.log(`   Improvement Suggestions:`);
    analysis.searchRanking.improvementSuggestions.forEach(suggestion =>
      console.log(`      - ${suggestion}`)
    );
  }

  // Recommendations
  console.log("\n" + "=".repeat(80));
  console.log("💡 RECOMMENDATIONS");
  console.log("=".repeat(80));
  analysis.recommendations.forEach(rec => console.log(rec));

  // Final verdict
  console.log("\n" + "=".repeat(80));
  console.log("📋 FINAL VERDICT");
  console.log("=".repeat(80));

  if (analysis.overallScore >= 80) {
    console.log("✅ This blog is in EXCELLENT shape!");
    console.log(
      "   With minor improvements, it has strong potential to rank on first page."
    );
  } else if (analysis.overallScore >= 60) {
    console.log("⚠️ This blog needs MODERATE improvements");
    console.log("   Address the critical issues and it can rank well.");
  } else {
    console.log("❌ This blog needs SIGNIFICANT improvements");
    console.log(
      "   Major work required before it can compete in search rankings."
    );
  }

  console.log("\n" + "=".repeat(80));
  console.log("📊 WILL IT RANK FOR 'STEM TOYS' ON PAGE 1?");
  console.log("=".repeat(80));

  if (analysis.searchRanking.score >= 70 && analysis.overallScore >= 75) {
    console.log(
      "🟢 LIKELY - With optimization and promotion, first page is achievable"
    );
  } else if (
    analysis.searchRanking.score >= 50 &&
    analysis.overallScore >= 60
  ) {
    console.log("🟡 POSSIBLE - Needs improvements but has potential");
  } else {
    console.log(
      "🔴 UNLIKELY - Significant work needed to compete for first page"
    );
  }

  console.log("\n" + "=".repeat(80) + "\n");
}

analyzeBlog();
