require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const BLOG_ID = "cmgj3arlf0001jo04s9setdgp";

async function analyzeBlogPerformance() {
  try {
    console.log(`\n${"=".repeat(80)}`);
    console.log("🔍 COMPREHENSIVE BLOG PERFORMANCE ANALYSIS");
    console.log(`${"=".repeat(80)}\n`);

    // 1. Fetch the blog data
    console.log("📊 Fetching blog data...\n");
    const blog = await prisma.blog.findUnique({
      where: { id: BLOG_ID },
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
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!blog) {
      console.error(`❌ Blog with ID "${BLOG_ID}" not found!`);
      return;
    }

    console.log("✅ Blog found!\n");
    console.log(`${"─".repeat(80)}`);
    console.log("📝 BASIC INFORMATION");
    console.log(`${"─".repeat(80)}`);
    console.log(`Title: ${blog.title}`);
    console.log(`Slug: ${blog.slug}`);
    console.log(`Author: ${blog.author?.name || "Unknown"}`);
    console.log(`Category: ${blog.category?.name || "Unknown"}`);
    console.log(`STEM Category: ${blog.stemCategory}`);
    console.log(`Published: ${blog.isPublished ? "Yes" : "No"}`);
    console.log(`Published At: ${blog.publishedAt || "Not published yet"}`);
    console.log(`Created At: ${blog.createdAt}`);
    console.log(`Reading Time: ${blog.readingTime || "N/A"} minutes`);
    console.log(`Social Shares: ${blog.socialShares || 0}`);
    console.log(`Tags: ${blog.tags.join(", ") || "None"}`);

    // 2. SEO ANALYSIS
    console.log(`\n${"─".repeat(80)}`);
    console.log("🔎 SEO PERFORMANCE ANALYSIS");
    console.log(`${"─".repeat(80)}`);

    const seoScore = calculateSEOScore(blog);
    console.log(`\n📈 Overall SEO Score: ${seoScore.total}/100`);
    console.log(`\nBreakdown:`);
    console.log(
      `  ✓ Title Optimization: ${seoScore.titleScore}/20 ${getSEOEmoji(seoScore.titleScore, 20)}`
    );
    console.log(
      `    - Length: ${blog.title.length} characters ${blog.title.length >= 30 && blog.title.length <= 60 ? "✅" : "⚠️"} (Optimal: 30-60)`
    );
    console.log(
      `  ✓ Excerpt/Meta Description: ${seoScore.excerptScore}/20 ${getSEOEmoji(seoScore.excerptScore, 20)}`
    );
    console.log(
      `    - Length: ${blog.excerpt.length} characters ${blog.excerpt.length >= 120 && blog.excerpt.length <= 160 ? "✅" : "⚠️"} (Optimal: 120-160)`
    );
    console.log(
      `  ✓ Content Length: ${seoScore.contentScore}/20 ${getSEOEmoji(seoScore.contentScore, 20)}`
    );
    console.log(
      `    - Word Count: ~${Math.floor(blog.content.length / 5)} words ${blog.content.length > 8000 ? "✅" : "⚠️"} (Optimal: >1600 words)`
    );
    console.log(
      `  ✓ Slug Structure: ${seoScore.slugScore}/15 ${getSEOEmoji(seoScore.slugScore, 15)}`
    );
    console.log(
      `    - Slug: ${blog.slug} ${blog.slug.length <= 70 ? "✅" : "⚠️"}`
    );
    console.log(
      `  ✓ Tags/Keywords: ${seoScore.tagsScore}/15 ${getSEOEmoji(seoScore.tagsScore, 15)}`
    );
    console.log(
      `    - Tags Count: ${blog.tags.length} ${blog.tags.length >= 3 && blog.tags.length <= 10 ? "✅" : "⚠️"} (Optimal: 3-10)`
    );
    console.log(
      `  ✓ Publishing Status: ${seoScore.publishScore}/10 ${getSEOEmoji(seoScore.publishScore, 10)}`
    );
    console.log(`    - Published: ${blog.isPublished ? "Yes ✅" : "No ⚠️"}`);

    // Check for SEO Analytics data
    const seoAnalytics = await prisma.sEOAnalytics.findMany({
      where: {
        OR: [
          { url: { contains: blog.slug } },
          { targetPage: { contains: blog.slug } },
        ],
      },
      orderBy: { dateRecorded: "desc" },
      take: 10,
    });

    if (seoAnalytics.length > 0) {
      console.log(`\n  📊 Search Console Data (Last 10 entries):`);
      seoAnalytics.forEach((entry, index) => {
        console.log(`    ${index + 1}. Keyword: "${entry.keyword}"`);
        console.log(
          `       Position: ${entry.position} | Clicks: ${entry.clicks} | Impressions: ${entry.impressions} | CTR: ${(entry.ctr * 100).toFixed(2)}%`
        );
      });
    } else {
      console.log(`\n  ⚠️ No Search Console data found for this blog`);
    }

    // 3. CONTENT QUALITY ANALYSIS
    console.log(`\n${"─".repeat(80)}`);
    console.log("📚 CONTENT QUALITY ANALYSIS");
    console.log(`${"─".repeat(80)}`);

    const contentQuality = calculateContentQuality(blog);
    console.log(
      `\n📊 Overall Content Quality Score: ${contentQuality.total}/100`
    );
    console.log(`\nBreakdown:`);
    console.log(
      `  ✓ Readability: ${contentQuality.readabilityScore}/25 ${getSEOEmoji(contentQuality.readabilityScore, 25)}`
    );
    console.log(
      `    - Reading Time: ${blog.readingTime || "N/A"} minutes ${blog.readingTime && blog.readingTime >= 3 ? "✅" : "⚠️"}`
    );
    console.log(
      `  ✓ Structure: ${contentQuality.structureScore}/25 ${getSEOEmoji(contentQuality.structureScore, 25)}`
    );
    console.log(`    - Has Excerpt: ${blog.excerpt ? "Yes ✅" : "No ⚠️"}`);
    console.log(
      `  ✓ Relevance: ${contentQuality.relevanceScore}/25 ${getSEOEmoji(contentQuality.relevanceScore, 25)}`
    );
    console.log(`    - STEM Category: ${blog.stemCategory} ✅`);
    console.log(`    - Category: ${blog.category?.name || "None"}`);
    console.log(
      `  ✓ Freshness: ${contentQuality.freshnessScore}/25 ${getSEOEmoji(contentQuality.freshnessScore, 25)}`
    );
    console.log(`    - Created: ${blog.createdAt.toLocaleDateString()}`);
    console.log(`    - Last Updated: ${blog.updatedAt.toLocaleDateString()}`);
    console.log(
      `    - Age: ${Math.floor((Date.now() - blog.createdAt.getTime()) / (1000 * 60 * 60 * 24))} days`
    );

    // 4. SCALABILITY ANALYSIS
    console.log(`\n${"─".repeat(80)}`);
    console.log("⚙️ SCALABILITY ANALYSIS");
    console.log(`${"─".repeat(80)}`);

    const scalability = calculateScalability(blog);
    console.log(`\n📊 Overall Scalability Score: ${scalability.total}/100`);
    console.log(`\nBreakdown:`);
    console.log(
      `  ✓ Content Reusability: ${scalability.reusabilityScore}/30 ${getSEOEmoji(scalability.reusabilityScore, 30)}`
    );
    console.log(
      `    - Metadata Available: ${blog.metadata ? "Yes ✅" : "No ⚠️"}`
    );
    console.log(`    - Tags: ${blog.tags.length} tags`);
    console.log(
      `  ✓ Technical Structure: ${scalability.technicalScore}/30 ${getSEOEmoji(scalability.technicalScore, 30)}`
    );
    console.log(`    - Proper ID: ${blog.id ? "Yes ✅" : "No ⚠️"}`);
    console.log(`    - Unique Slug: ${blog.slug ? "Yes ✅" : "No ⚠️"}`);
    console.log(
      `  ✓ Content Management: ${scalability.managementScore}/20 ${getSEOEmoji(scalability.managementScore, 20)}`
    );
    console.log(`    - Author Assigned: ${blog.authorId ? "Yes ✅" : "No ⚠️"}`);
    console.log(
      `    - Category Assigned: ${blog.categoryId ? "Yes ✅" : "No ⚠️"}`
    );
    console.log(
      `  ✓ Automation Ready: ${scalability.automationScore}/20 ${getSEOEmoji(scalability.automationScore, 20)}`
    );
    console.log(
      `    - Published Status: ${blog.isPublished ? "Yes ✅" : "No ⚠️"}`
    );
    console.log(`    - Timestamps: Yes ✅`);

    // 5. VIRALITY ANALYSIS
    console.log(`\n${"─".repeat(80)}`);
    console.log("🚀 VIRALITY ANALYSIS");
    console.log(`${"─".repeat(80)}`);

    const viralContent = await prisma.romanianViralContent.findFirst({
      where: { blogId: BLOG_ID },
    });

    if (viralContent) {
      console.log(`\n✅ Viral metrics found!`);
      console.log(`\nSocial Media Performance:`);
      console.log(`  📱 Facebook Shares: ${viralContent.facebookShares}`);
      console.log(`  📸 Instagram Shares: ${viralContent.instagramShares}`);
      console.log(`  🎵 TikTok Shares: ${viralContent.tiktokShares}`);
      console.log(`  📊 Total Shares: ${viralContent.shares}`);
      console.log(`\nEngagement Metrics:`);
      console.log(`  👥 Reach: ${viralContent.reach}`);
      console.log(`  💬 Engagement: ${viralContent.engagement}`);
      console.log(`  ⏱️ Time Spent: ${viralContent.timeSpent} seconds`);
      console.log(
        `  🇷🇴 Romanian Engagement: ${viralContent.romanianEngagement}`
      );
      console.log(`\nViral Performance:`);
      console.log(
        `  🔥 Viral Coefficient: ${viralContent.viralCoefficient.toFixed(2)} ${getViralEmoji(viralContent.viralCoefficient)}`
      );
      console.log(
        `  📅 Last Calculated: ${viralContent.lastCalculatedAt.toLocaleDateString()}`
      );
    } else {
      console.log(`\n⚠️ No viral content data found for this blog`);
      console.log(`\nBasic Social Metrics:`);
      console.log(`  📊 Social Shares (from blog): ${blog.socialShares || 0}`);
    }

    const viralityScore = calculateViralityScore(blog, viralContent);
    console.log(
      `\n📊 Overall Virality Score: ${viralityScore.total}/100 ${getViralEmoji(viralityScore.total / 10)}`
    );
    console.log(`\nBreakdown:`);
    console.log(
      `  ✓ Share Potential: ${viralityScore.shareScore}/40 ${getSEOEmoji(viralityScore.shareScore, 40)}`
    );
    console.log(
      `  ✓ Engagement Rate: ${viralityScore.engagementScore}/30 ${getSEOEmoji(viralityScore.engagementScore, 30)}`
    );
    console.log(
      `  ✓ Platform Diversity: ${viralityScore.platformScore}/30 ${getSEOEmoji(viralityScore.platformScore, 30)}`
    );

    // 6. PERFORMANCE ANALYSIS
    console.log(`\n${"─".repeat(80)}`);
    console.log("⚡ PERFORMANCE ANALYSIS");
    console.log(`${"─".repeat(80)}`);

    const performanceMetrics = await prisma.performanceMetric.findMany({
      where: {
        url: { contains: blog.slug },
      },
      orderBy: { timestamp: "desc" },
      take: 10,
    });

    if (performanceMetrics.length > 0) {
      console.log(`\n✅ Performance metrics found (Last 10 entries):`);

      const avgMetrics = {
        cls:
          performanceMetrics.reduce((sum, m) => sum + m.cls, 0) /
          performanceMetrics.length,
        fid:
          performanceMetrics.reduce((sum, m) => sum + m.fid, 0) /
          performanceMetrics.length,
        fcp:
          performanceMetrics.reduce((sum, m) => sum + m.fcp, 0) /
          performanceMetrics.length,
        lcp:
          performanceMetrics.reduce((sum, m) => sum + m.lcp, 0) /
          performanceMetrics.length,
        ttfb:
          performanceMetrics.reduce((sum, m) => sum + m.ttfb, 0) /
          performanceMetrics.length,
      };

      console.log(`\nAverage Core Web Vitals:`);
      console.log(
        `  📊 CLS (Cumulative Layout Shift): ${avgMetrics.cls.toFixed(3)} ${getCLSEmoji(avgMetrics.cls)}`
      );
      console.log(`     ${getCLSRating(avgMetrics.cls)}`);
      console.log(
        `  ⚡ FID (First Input Delay): ${avgMetrics.fid.toFixed(0)}ms ${getFIDEmoji(avgMetrics.fid)}`
      );
      console.log(`     ${getFIDRating(avgMetrics.fid)}`);
      console.log(
        `  🎨 FCP (First Contentful Paint): ${avgMetrics.fcp.toFixed(0)}ms ${getFCPEmoji(avgMetrics.fcp)}`
      );
      console.log(`     ${getFCPRating(avgMetrics.fcp)}`);
      console.log(
        `  🖼️ LCP (Largest Contentful Paint): ${avgMetrics.lcp.toFixed(0)}ms ${getLCPEmoji(avgMetrics.lcp)}`
      );
      console.log(`     ${getLCPRating(avgMetrics.lcp)}`);
      console.log(
        `  🌐 TTFB (Time to First Byte): ${avgMetrics.ttfb.toFixed(0)}ms ${getTTFBEmoji(avgMetrics.ttfb)}`
      );
      console.log(`     ${getTTFBRating(avgMetrics.ttfb)}`);
    } else {
      console.log(`\n⚠️ No performance metrics found for this blog`);
    }

    const performanceScore = calculatePerformanceScore(performanceMetrics);
    console.log(
      `\n📊 Overall Performance Score: ${performanceScore}/100 ${getPerformanceEmoji(performanceScore)}`
    );

    // 7. FINAL SUMMARY
    console.log(`\n${"=".repeat(80)}`);
    console.log("📋 FINAL SUMMARY & RECOMMENDATIONS");
    console.log(`${"=".repeat(80)}`);

    const overallScore = Math.round(
      (seoScore.total +
        contentQuality.total +
        scalability.total +
        viralityScore.total +
        performanceScore) /
        5
    );

    console.log(
      `\n🎯 OVERALL BLOG PERFORMANCE: ${overallScore}/100 ${getOverallEmoji(overallScore)}\n`
    );
    console.log(`Individual Scores:`);
    console.log(
      `  SEO:          ${seoScore.total}/100 ${getBarChart(seoScore.total)}`
    );
    console.log(
      `  Content:      ${contentQuality.total}/100 ${getBarChart(contentQuality.total)}`
    );
    console.log(
      `  Scalability:  ${scalability.total}/100 ${getBarChart(scalability.total)}`
    );
    console.log(
      `  Virality:     ${viralityScore.total}/100 ${getBarChart(viralityScore.total)}`
    );
    console.log(
      `  Performance:  ${performanceScore}/100 ${getBarChart(performanceScore)}`
    );

    console.log(`\n💡 RECOMMENDATIONS:\n`);
    const recommendations = generateRecommendations(
      seoScore,
      contentQuality,
      scalability,
      viralityScore,
      performanceScore,
      blog,
      viralContent
    );
    recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });

    console.log(`\n${"=".repeat(80)}\n`);
  } catch (error) {
    console.error("❌ Error analyzing blog:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper functions for scoring
function calculateSEOScore(blog) {
  let titleScore = 0;
  let excerptScore = 0;
  let contentScore = 0;
  let slugScore = 0;
  let tagsScore = 0;
  let publishScore = 0;

  // Title (20 points)
  if (blog.title.length >= 30 && blog.title.length <= 60) titleScore = 20;
  else if (blog.title.length >= 20 && blog.title.length <= 70) titleScore = 15;
  else if (blog.title.length >= 10) titleScore = 10;
  else titleScore = 5;

  // Excerpt (20 points)
  if (blog.excerpt.length >= 120 && blog.excerpt.length <= 160)
    excerptScore = 20;
  else if (blog.excerpt.length >= 100 && blog.excerpt.length <= 180)
    excerptScore = 15;
  else if (blog.excerpt.length >= 50) excerptScore = 10;
  else excerptScore = 5;

  // Content (20 points)
  const wordCount = blog.content.length / 5;
  if (wordCount >= 1600) contentScore = 20;
  else if (wordCount >= 1000) contentScore = 15;
  else if (wordCount >= 500) contentScore = 10;
  else contentScore = 5;

  // Slug (15 points)
  if (blog.slug.length <= 70 && blog.slug.includes("-")) slugScore = 15;
  else if (blog.slug.length <= 100) slugScore = 10;
  else slugScore = 5;

  // Tags (15 points)
  if (blog.tags.length >= 3 && blog.tags.length <= 10) tagsScore = 15;
  else if (blog.tags.length >= 1) tagsScore = 10;
  else tagsScore = 0;

  // Publishing (10 points)
  if (blog.isPublished) publishScore = 10;
  else publishScore = 0;

  return {
    titleScore,
    excerptScore,
    contentScore,
    slugScore,
    tagsScore,
    publishScore,
    total:
      titleScore +
      excerptScore +
      contentScore +
      slugScore +
      tagsScore +
      publishScore,
  };
}

function calculateContentQuality(blog) {
  let readabilityScore = 0;
  let structureScore = 0;
  let relevanceScore = 0;
  let freshnessScore = 0;

  // Readability (25 points)
  if (blog.readingTime >= 3 && blog.readingTime <= 10) readabilityScore = 25;
  else if (blog.readingTime >= 2) readabilityScore = 18;
  else if (blog.readingTime >= 1) readabilityScore = 12;
  else readabilityScore = 5;

  // Structure (25 points)
  structureScore = blog.excerpt ? 25 : 10;

  // Relevance (25 points)
  relevanceScore = (blog.stemCategory ? 15 : 0) + (blog.categoryId ? 10 : 0);

  // Freshness (25 points)
  const ageInDays =
    (Date.now() - blog.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (ageInDays <= 30) freshnessScore = 25;
  else if (ageInDays <= 90) freshnessScore = 20;
  else if (ageInDays <= 180) freshnessScore = 15;
  else if (ageInDays <= 365) freshnessScore = 10;
  else freshnessScore = 5;

  return {
    readabilityScore,
    structureScore,
    relevanceScore,
    freshnessScore,
    total: readabilityScore + structureScore + relevanceScore + freshnessScore,
  };
}

function calculateScalability(blog) {
  let reusabilityScore = 0;
  let technicalScore = 0;
  let managementScore = 0;
  let automationScore = 0;

  // Reusability (30 points)
  reusabilityScore =
    (blog.metadata ? 15 : 0) +
    (blog.tags.length >= 3 ? 15 : blog.tags.length * 5);

  // Technical Structure (30 points)
  technicalScore = (blog.id ? 15 : 0) + (blog.slug ? 15 : 0);

  // Content Management (20 points)
  managementScore = (blog.authorId ? 10 : 0) + (blog.categoryId ? 10 : 0);

  // Automation Ready (20 points)
  automationScore =
    (blog.isPublished ? 10 : 0) + (blog.createdAt && blog.updatedAt ? 10 : 0);

  return {
    reusabilityScore,
    technicalScore,
    managementScore,
    automationScore,
    total:
      reusabilityScore + technicalScore + managementScore + automationScore,
  };
}

function calculateViralityScore(blog, viralContent) {
  let shareScore = 0;
  let engagementScore = 0;
  let platformScore = 0;

  if (viralContent) {
    // Share Potential (40 points)
    if (viralContent.shares >= 1000) shareScore = 40;
    else if (viralContent.shares >= 500) shareScore = 30;
    else if (viralContent.shares >= 100) shareScore = 20;
    else if (viralContent.shares >= 50) shareScore = 10;
    else shareScore = Math.min(viralContent.shares / 5, 10);

    // Engagement Rate (30 points)
    if (viralContent.engagement >= 5000) engagementScore = 30;
    else if (viralContent.engagement >= 1000) engagementScore = 20;
    else if (viralContent.engagement >= 500) engagementScore = 15;
    else if (viralContent.engagement >= 100) engagementScore = 10;
    else engagementScore = Math.min(viralContent.engagement / 10, 10);

    // Platform Diversity (30 points)
    const platforms = [
      viralContent.facebookShares > 0,
      viralContent.instagramShares > 0,
      viralContent.tiktokShares > 0,
    ].filter(Boolean).length;
    platformScore = platforms * 10;
  } else {
    // Fallback to basic social shares
    const shares = blog.socialShares || 0;
    if (shares >= 100) shareScore = 30;
    else if (shares >= 50) shareScore = 20;
    else if (shares >= 10) shareScore = 10;
    else shareScore = shares;

    engagementScore = 0;
    platformScore = 0;
  }

  return {
    shareScore,
    engagementScore,
    platformScore,
    total: shareScore + engagementScore + platformScore,
  };
}

function calculatePerformanceScore(metrics) {
  if (!metrics || metrics.length === 0) return 50; // Default score

  const avgMetrics = {
    cls: metrics.reduce((sum, m) => sum + m.cls, 0) / metrics.length,
    fid: metrics.reduce((sum, m) => sum + m.fid, 0) / metrics.length,
    lcp: metrics.reduce((sum, m) => sum + m.lcp, 0) / metrics.length,
  };

  let score = 0;

  // CLS (30 points)
  if (avgMetrics.cls <= 0.1) score += 30;
  else if (avgMetrics.cls <= 0.25) score += 20;
  else score += 10;

  // FID (30 points)
  if (avgMetrics.fid <= 100) score += 30;
  else if (avgMetrics.fid <= 300) score += 20;
  else score += 10;

  // LCP (40 points)
  if (avgMetrics.lcp <= 2500) score += 40;
  else if (avgMetrics.lcp <= 4000) score += 25;
  else score += 10;

  return score;
}

function generateRecommendations(
  seo,
  content,
  scalability,
  virality,
  performance,
  blog,
  viralContent
) {
  const recommendations = [];

  if (seo.total < 70) {
    if (seo.titleScore < 15)
      recommendations.push("📝 Optimize title length (30-60 characters)");
    if (seo.excerptScore < 15)
      recommendations.push(
        "📝 Improve meta description length (120-160 characters)"
      );
    if (seo.contentScore < 15)
      recommendations.push("📝 Increase content length (aim for 1600+ words)");
    if (seo.tagsScore < 10)
      recommendations.push("🏷️ Add 3-10 relevant tags for better SEO");
    if (seo.publishScore === 0)
      recommendations.push("🚀 Publish the blog to make it visible");
  }

  if (content.total < 70) {
    if (content.readabilityScore < 18)
      recommendations.push(
        "📚 Improve readability (aim for 3-10 minute read time)"
      );
    if (content.structureScore < 20)
      recommendations.push("📋 Add a compelling excerpt");
    if (content.freshnessScore < 15)
      recommendations.push("🔄 Update content regularly to maintain freshness");
  }

  if (scalability.total < 70) {
    if (scalability.reusabilityScore < 20)
      recommendations.push("🔧 Add metadata for better content reusability");
    if (scalability.managementScore < 15)
      recommendations.push("👤 Ensure proper author and category assignment");
  }

  if (virality.total < 50) {
    recommendations.push("📱 Implement social sharing buttons prominently");
    recommendations.push(
      "🎯 Create more shareable content (infographics, quotes, statistics)"
    );
    if (!viralContent)
      recommendations.push("📊 Set up viral tracking for this blog");
  }

  if (performance < 70) {
    recommendations.push("⚡ Optimize images and lazy load content");
    recommendations.push("🚀 Improve page load speed (target LCP < 2.5s)");
    recommendations.push("📊 Monitor and fix Core Web Vitals issues");
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "🎉 Excellent! This blog is performing well across all metrics!"
    );
    recommendations.push(
      "🔄 Continue monitoring and updating content regularly"
    );
    recommendations.push(
      "📈 Consider A/B testing different headlines and content structures"
    );
  }

  return recommendations;
}

// Emoji helpers
function getSEOEmoji(score, max) {
  const percentage = (score / max) * 100;
  if (percentage >= 80) return "🟢";
  if (percentage >= 60) return "🟡";
  return "🔴";
}

function getViralEmoji(coefficient) {
  if (coefficient >= 2) return "🔥🔥🔥";
  if (coefficient >= 1) return "🔥🔥";
  if (coefficient >= 0.5) return "🔥";
  return "📊";
}

function getOverallEmoji(score) {
  if (score >= 90) return "🌟 EXCELLENT!";
  if (score >= 80) return "✨ GREAT!";
  if (score >= 70) return "👍 GOOD";
  if (score >= 60) return "😐 AVERAGE";
  return "⚠️ NEEDS IMPROVEMENT";
}

function getPerformanceEmoji(score) {
  if (score >= 80) return "🚀";
  if (score >= 60) return "⚡";
  return "🐌";
}

function getCLSEmoji(cls) {
  if (cls <= 0.1) return "🟢";
  if (cls <= 0.25) return "🟡";
  return "🔴";
}

function getFIDEmoji(fid) {
  if (fid <= 100) return "🟢";
  if (fid <= 300) return "🟡";
  return "🔴";
}

function getFCPEmoji(fcp) {
  if (fcp <= 1800) return "🟢";
  if (fcp <= 3000) return "🟡";
  return "🔴";
}

function getLCPEmoji(lcp) {
  if (lcp <= 2500) return "🟢";
  if (lcp <= 4000) return "🟡";
  return "🔴";
}

function getTTFBEmoji(ttfb) {
  if (ttfb <= 600) return "🟢";
  if (ttfb <= 1000) return "🟡";
  return "🔴";
}

function getCLSRating(cls) {
  if (cls <= 0.1) return "Good - Layout is stable";
  if (cls <= 0.25) return "Needs Improvement - Some layout shifts";
  return "Poor - Significant layout shifts";
}

function getFIDRating(fid) {
  if (fid <= 100) return "Good - Very responsive";
  if (fid <= 300) return "Needs Improvement - Moderately responsive";
  return "Poor - Slow to respond";
}

function getFCPRating(fcp) {
  if (fcp <= 1800) return "Good - Fast initial paint";
  if (fcp <= 3000) return "Needs Improvement - Moderate paint time";
  return "Poor - Slow initial paint";
}

function getLCPRating(lcp) {
  if (lcp <= 2500) return "Good - Fast content load";
  if (lcp <= 4000) return "Needs Improvement - Moderate content load";
  return "Poor - Slow content load";
}

function getTTFBRating(ttfb) {
  if (ttfb <= 600) return "Good - Fast server response";
  if (ttfb <= 1000) return "Needs Improvement - Moderate server response";
  return "Poor - Slow server response";
}

function getBarChart(score) {
  const filled = Math.floor(score / 10);
  const empty = 10 - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

// Run the analysis
analyzeBlogPerformance();
