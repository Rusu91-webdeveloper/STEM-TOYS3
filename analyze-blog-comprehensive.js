const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Blog ID to analyze
const BLOG_ID = "cmggm6urg0005jni1gim67kgs";

// Helper function to count words
function countWords(text) {
  return text.trim().split(/\s+/).length;
}

// Helper function to count characters
function countCharacters(text) {
  return text.length;
}

// Helper function to extract headings
function extractHeadings(content) {
  const h1 = content.match(/^# .+$/gm) || [];
  const h2 = content.match(/^## .+$/gm) || [];
  const h3 = content.match(/^### .+$/gm) || [];
  return { h1, h2, h3 };
}

// Helper function to extract links
function extractLinks(content) {
  const internalLinks = content.match(/\[([^\]]+)\]\(\/[^\)]+\)/g) || [];
  const externalLinks =
    content.match(/\[([^\]]+)\]\(https?:\/\/[^\)]+\)/g) || [];
  return { internalLinks, externalLinks };
}

// Helper function to extract FAQ questions
function extractFAQs(content) {
  const faqSection = content.match(/## Întrebări Frecvente[\s\S]*?(?=##|$)/);
  if (!faqSection) return [];

  const questions = faqSection[0].match(/\*\*\d+\.\s*(.+?)\?\*\*/g) || [];
  return questions;
}

// Helper function to calculate readability score (simplified Flesch Reading Ease for Romanian)
function calculateReadability(content) {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = content.trim().split(/\s+/);
  const syllables = words.reduce((acc, word) => {
    // Simplified syllable count for Romanian
    const vowels = word.match(/[aăâeéiîoóuú]/gi) || [];
    return acc + Math.max(1, vowels.length);
  }, 0);

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Modified Flesch Reading Ease formula
  const score =
    206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  return {
    score: Math.max(0, Math.min(100, score)),
    avgWordsPerSentence,
    avgSyllablesPerWord,
    interpretation:
      score > 60
        ? "Easy to read"
        : score > 30
          ? "Moderate difficulty"
          : "Difficult to read",
  };
}

// Helper function to check SEO optimization
function analyzeSEO(blog) {
  const issues = [];
  const recommendations = [];
  let score = 100;

  // ✅ FIX: Access metadata from blog.metadata.seo (JSON field in database)
  const seo = blog.metadata?.seo || {};

  // Meta Title
  if (!seo.metaTitle || seo.metaTitle.length === 0) {
    issues.push("❌ Missing meta title");
    score -= 15;
  } else if (seo.metaTitle.length > 60) {
    issues.push(
      `⚠️  Meta title too long (${seo.metaTitle.length} chars, max 60)`
    );
    score -= 5;
  } else if (seo.metaTitle.length < 30) {
    issues.push(
      `⚠️  Meta title too short (${seo.metaTitle.length} chars, min 30)`
    );
    score -= 5;
  } else {
    recommendations.push(
      `✅ Meta title optimal (${seo.metaTitle.length} chars)`
    );
  }

  // Meta Description
  if (!seo.metaDescription || seo.metaDescription.length === 0) {
    issues.push("❌ Missing meta description");
    score -= 15;
  } else if (seo.metaDescription.length > 160) {
    issues.push(
      `⚠️  Meta description too long (${seo.metaDescription.length} chars, max 160)`
    );
    score -= 5;
  } else if (seo.metaDescription.length < 120) {
    issues.push(
      `⚠️  Meta description too short (${seo.metaDescription.length} chars, min 120)`
    );
    score -= 5;
  } else {
    recommendations.push(
      `✅ Meta description optimal (${seo.metaDescription.length} chars)`
    );
  }

  // Focus Keyword
  if (!seo.focusKeyword) {
    issues.push("❌ Missing focus keyword");
    score -= 10;
  } else {
    const focusKeywordInTitle = blog.title
      .toLowerCase()
      .includes(seo.focusKeyword.toLowerCase());
    const focusKeywordInMeta = seo.metaDescription
      ?.toLowerCase()
      .includes(seo.focusKeyword.toLowerCase());

    if (!focusKeywordInTitle) {
      issues.push(`⚠️  Focus keyword "${seo.focusKeyword}" not in title`);
      score -= 5;
    }
    if (!focusKeywordInMeta) {
      issues.push(
        `⚠️  Focus keyword "${seo.focusKeyword}" not in meta description`
      );
      score -= 5;
    }

    if (focusKeywordInTitle && focusKeywordInMeta) {
      recommendations.push(
        `✅ Focus keyword "${seo.focusKeyword}" properly placed`
      );
    }
  }

  // Slug optimization
  if (blog.slug.length > 75) {
    issues.push(`⚠️  Slug too long (${blog.slug.length} chars, max 75)`);
    score -= 3;
  }

  // Keywords array
  if (!seo.metaKeywords || seo.metaKeywords.length === 0) {
    issues.push("❌ Missing meta keywords");
    score -= 5;
  } else if (seo.metaKeywords.length < 5) {
    issues.push(
      `⚠️  Too few keywords (${seo.metaKeywords.length}, recommended 5-10)`
    );
    score -= 3;
  } else {
    recommendations.push(
      `✅ Good keyword coverage (${seo.metaKeywords.length} keywords)`
    );
  }

  return { score, issues, recommendations };
}

// Helper function to analyze content structure
function analyzeStructure(content, headings) {
  const issues = [];
  const recommendations = [];
  let score = 100;

  // H1 check
  if (headings.h1.length === 0) {
    issues.push("❌ Missing H1 heading");
    score -= 20;
  } else if (headings.h1.length > 1) {
    issues.push(
      `⚠️  Multiple H1 headings (${headings.h1.length}, should be 1)`
    );
    score -= 10;
  } else {
    recommendations.push("✅ Proper H1 structure (1 H1)");
  }

  // H2 check
  if (headings.h2.length < 5) {
    issues.push(
      `⚠️  Too few H2 sections (${headings.h2.length}, recommended 5-8)`
    );
    score -= 10;
  } else if (headings.h2.length > 12) {
    issues.push(`⚠️  Too many H2 sections (${headings.h2.length}, max 12)`);
    score -= 5;
  } else {
    recommendations.push(
      `✅ Good H2 structure (${headings.h2.length} sections)`
    );
  }

  // H3 check
  if (headings.h3.length > 0) {
    recommendations.push(`✅ Has H3 subsections (${headings.h3.length})`);
  }

  // Paragraph length check
  const paragraphs = content
    .split(/\n\n+/)
    .filter(p => p.trim().length > 0 && !p.startsWith("#"));
  const longParagraphs = paragraphs.filter(p => countWords(p) > 100);

  if (longParagraphs.length > 0) {
    issues.push(
      `⚠️  ${longParagraphs.length} paragraphs exceed 100 words (poor mobile readability)`
    );
    score -= 5;
  } else {
    recommendations.push("✅ Paragraphs optimized for mobile");
  }

  return { score, issues, recommendations };
}

// Helper function to analyze virality potential
function analyzeVirality(blog, content) {
  const issues = [];
  const recommendations = [];
  let score = 0;

  // Emotional triggers
  const emotionalWords = [
    "inovație",
    "transformă",
    "aventuri",
    "uimitor",
    "incredibil",
    "esențial",
    "important",
    "succes",
    "realizare",
    "viitor",
    "secret",
    "descoperă",
    "revoluționar",
    "spectacular",
  ];

  const contentLower = content.toLowerCase();
  const emotionalCount = emotionalWords.filter(word =>
    contentLower.includes(word)
  ).length;

  if (emotionalCount > 5) {
    recommendations.push(
      `✅ Good emotional triggers (${emotionalCount} power words)`
    );
    score += 20;
  } else {
    issues.push(
      `⚠️  Few emotional triggers (${emotionalCount}, recommended 5+)`
    );
  }

  // Question-based content
  const questions = content.match(/\?/g)?.length || 0;
  if (questions >= 10) {
    recommendations.push(`✅ Engaging questions (${questions} questions)`);
    score += 15;
  } else {
    issues.push(
      `⚠️  Few questions (${questions}, recommended 10+ for engagement)`
    );
  }

  // Lists and bullet points
  const bulletPoints = content.match(/^[-*]\s/gm)?.length || 0;
  if (bulletPoints >= 10) {
    recommendations.push(
      `✅ Scannable content (${bulletPoints} bullet points)`
    );
    score += 15;
  } else {
    issues.push(
      `⚠️  Few bullet points (${bulletPoints}, recommended 10+ for scannability)`
    );
  }

  // Social proof elements
  const socialProofKeywords = [
    "studiu",
    "cercetare",
    "experți",
    "statistici",
    "demonstrat",
    "dovedit",
  ];
  const socialProofCount = socialProofKeywords.filter(word =>
    contentLower.includes(word)
  ).length;

  if (socialProofCount >= 3) {
    recommendations.push(
      `✅ Contains social proof (${socialProofCount} evidence markers)`
    );
    score += 15;
  } else {
    issues.push(
      `⚠️  Limited social proof (${socialProofCount}, add more statistics/studies)`
    );
  }

  // Call to action
  const ctaKeywords = [
    "descoperă",
    "vezi",
    "explorează",
    "află",
    "încearcă",
    "cumpără",
  ];
  const ctaCount = ctaKeywords.filter(word =>
    contentLower.includes(word)
  ).length;

  if (ctaCount >= 3) {
    recommendations.push(`✅ Clear calls-to-action (${ctaCount} CTAs)`);
    score += 15;
  } else {
    issues.push(`⚠️  Weak calls-to-action (${ctaCount}, recommended 3+ CTAs)`);
  }

  // Title clickability (power words in title)
  const titleLower = blog.title.toLowerCase();
  const titlePowerWords = [
    "cum",
    "de ce",
    "ghid",
    "complet",
    "top",
    "avantaje",
    "beneficii",
    "transformă",
  ];
  const titleScore = titlePowerWords.filter(word =>
    titleLower.includes(word)
  ).length;

  if (titleScore >= 2) {
    recommendations.push(`✅ Clickable title (${titleScore} power words)`);
    score += 20;
  } else {
    issues.push(
      `⚠️  Title lacks power words (${titleScore}, add words like "cum", "ghid", "top")`
    );
  }

  return { score, issues, recommendations };
}

// Helper function to analyze performance
function analyzePerformance(blog, content) {
  const issues = [];
  const recommendations = [];
  let score = 100;

  // Content length
  const wordCount = countWords(content);
  if (wordCount < 1500) {
    issues.push(
      `⚠️  Content too short (${wordCount} words, recommended 1800-2500)`
    );
    score -= 15;
  } else if (wordCount > 3000) {
    issues.push(
      `⚠️  Content very long (${wordCount} words, may impact load time)`
    );
    score -= 5;
  } else {
    recommendations.push(`✅ Optimal word count (${wordCount} words)`);
  }

  // Image optimization
  if (!blog.coverImage) {
    issues.push("⚠️  Missing cover image (poor social sharing)");
    score -= 10;
  } else {
    recommendations.push("✅ Has cover image");
  }

  // Links for engagement
  const links = extractLinks(content);
  const totalLinks = links.internalLinks.length + links.externalLinks.length;

  if (totalLinks < 5) {
    issues.push(`⚠️  Few links (${totalLinks}, recommended 5+ for engagement)`);
    score -= 5;
  } else if (totalLinks > 20) {
    issues.push(`⚠️  Too many links (${totalLinks}, may distract readers)`);
    score -= 3;
  } else {
    recommendations.push(`✅ Good link balance (${totalLinks} links)`);
  }

  // Mobile optimization (short paragraphs, frequent headings)
  const paragraphs = content
    .split(/\n\n+/)
    .filter(p => p.trim().length > 0 && !p.startsWith("#"));
  const avgWordsPerParagraph =
    paragraphs.reduce((acc, p) => acc + countWords(p), 0) / paragraphs.length;

  if (avgWordsPerParagraph > 80) {
    issues.push(
      `⚠️  Long paragraphs (avg ${Math.round(avgWordsPerParagraph)} words, max 60 for mobile)`
    );
    score -= 10;
  } else {
    recommendations.push(
      `✅ Mobile-friendly paragraphs (avg ${Math.round(avgWordsPerParagraph)} words)`
    );
  }

  return { score, issues, recommendations };
}

// Helper function to analyze scalability
function analyzeScalability(blog, content, headings) {
  const issues = [];
  const recommendations = [];
  let score = 100;

  // Template structure consistency
  const hasFAQ = content.includes("## Întrebări Frecvente");
  const hasIntro = headings.h2.some(h => h.includes("Introducere"));
  const hasConclusion = headings.h2.some(
    h => h.includes("Concluzie") || h.includes("Concluzii")
  );

  if (hasFAQ && hasIntro && hasConclusion) {
    recommendations.push("✅ Follows standard template structure");
  } else {
    if (!hasFAQ) {
      issues.push("⚠️  Missing FAQ section (not following template)");
      score -= 10;
    }
    if (!hasConclusion) {
      issues.push("⚠️  Missing Conclusion section (not following template)");
      score -= 5;
    }
  }

  // Metadata completeness
  // ✅ FIX: Check metadata.seo fields
  const seo = blog.metadata?.seo || {};
  const metadataComplete =
    seo.metaTitle &&
    seo.metaDescription &&
    seo.focusKeyword &&
    seo.metaKeywords &&
    seo.metaKeywords.length >= 5;

  if (metadataComplete) {
    recommendations.push("✅ Complete metadata (ready for automation)");
  } else {
    issues.push("⚠️  Incomplete metadata (affects automation potential)");
    score -= 15;
  }

  // Structured data
  if (blog.structuredData && typeof blog.structuredData === "object") {
    recommendations.push("✅ Has structured data (Schema.org)");
  } else {
    issues.push("⚠️  Missing structured data (poor rich snippets)");
    score -= 10;
  }

  // Language consistency
  const romanianChars = content.match(/[ăâîșț]/gi)?.length || 0;
  if (romanianChars > 20) {
    recommendations.push(
      `✅ Proper Romanian diacritics (${romanianChars} chars)`
    );
  } else {
    issues.push(
      `⚠️  Few Romanian diacritics (${romanianChars}, may need review)`
    );
    score -= 5;
  }

  // Category assignment
  if (blog.categoryId) {
    recommendations.push("✅ Properly categorized");
  } else {
    issues.push("⚠️  No category assigned");
    score -= 5;
  }

  // STEM category
  if (blog.stemCategory) {
    recommendations.push(`✅ STEM category: ${blog.stemCategory}`);
  } else {
    issues.push("⚠️  No STEM category assigned");
    score -= 5;
  }

  return { score, issues, recommendations };
}

async function comprehensiveAnalysis() {
  try {
    console.log("🔍 COMPREHENSIVE BLOG ANALYSIS");
    console.log("━".repeat(80));
    console.log(`📌 Blog ID: ${BLOG_ID}\n`);

    const blog = await prisma.blog.findUnique({
      where: { id: BLOG_ID },
      include: {
        category: true,
        author: true,
      },
    });

    if (!blog) {
      console.log(`❌ Blog not found with ID: ${BLOG_ID}`);
      return;
    }

    console.log(`📝 Title: ${blog.title}`);
    console.log(`🔗 Slug: ${blog.slug}`);
    console.log(`👤 Author: ${blog.author?.name || "Unknown"}`);
    console.log(`📁 Category: ${blog.category?.name || "Uncategorized"}`);
    console.log(`🎯 STEM Category: ${blog.stemCategory || "None"}`);
    console.log(`📅 Created: ${blog.createdAt.toISOString()}`);
    console.log(`🌐 Language: ${blog.language || "en"}`);
    console.log(`✅ Published: ${blog.isPublished ? "Yes" : "No"}`);
    console.log("\n" + "━".repeat(80));

    // Extract data
    const wordCount = countWords(blog.content);
    const charCount = countCharacters(blog.content);
    const headings = extractHeadings(blog.content);
    const links = extractLinks(blog.content);
    const faqs = extractFAQs(blog.content);
    const readability = calculateReadability(blog.content);

    // 1. CONTENT QUALITY ANALYSIS
    console.log("\n📊 1. CONTENT QUALITY ANALYSIS");
    console.log("━".repeat(80));
    console.log(`📏 Word Count: ${wordCount} words`);
    console.log(`📏 Character Count: ${charCount} chars`);
    console.log(`📑 Structure:`);
    console.log(`   - H1 headings: ${headings.h1.length}`);
    console.log(`   - H2 headings: ${headings.h2.length}`);
    console.log(`   - H3 headings: ${headings.h3.length}`);
    console.log(`🔗 Links:`);
    console.log(`   - Internal: ${links.internalLinks.length}`);
    console.log(`   - External: ${links.externalLinks.length}`);
    console.log(`❓ FAQ Questions: ${faqs.length}`);
    console.log(`📖 Readability:`);
    console.log(
      `   - Score: ${readability.score.toFixed(1)}/100 (${readability.interpretation})`
    );
    console.log(
      `   - Avg words/sentence: ${readability.avgWordsPerSentence.toFixed(1)}`
    );
    console.log(
      `   - Avg syllables/word: ${readability.avgSyllablesPerWord.toFixed(1)}`
    );

    const structureAnalysis = analyzeStructure(blog.content, headings);
    console.log(`\n🎯 Content Structure Score: ${structureAnalysis.score}/100`);
    if (structureAnalysis.recommendations.length > 0) {
      console.log("Strengths:");
      structureAnalysis.recommendations.forEach(rec =>
        console.log(`   ${rec}`)
      );
    }
    if (structureAnalysis.issues.length > 0) {
      console.log("Issues:");
      structureAnalysis.issues.forEach(issue => console.log(`   ${issue}`));
    }

    // 2. SEO ANALYSIS
    console.log("\n🔍 2. SEO OPTIMIZATION ANALYSIS");
    console.log("━".repeat(80));
    const seoAnalysis = analyzeSEO(blog);
    console.log(`🎯 SEO Score: ${seoAnalysis.score}/100`);

    // ✅ FIX: Access metadata from blog.metadata.seo
    const seo = blog.metadata?.seo || {};

    console.log(`\n📝 Meta Information:`);
    console.log(
      `   Title: "${seo.metaTitle || "MISSING"}" (${seo.metaTitle?.length || 0} chars)`
    );
    console.log(
      `   Description: "${seo.metaDescription || "MISSING"}" (${seo.metaDescription?.length || 0} chars)`
    );
    console.log(`   Focus Keyword: "${seo.focusKeyword || "MISSING"}"`);
    console.log(`   Keywords: ${seo.metaKeywords?.length || 0} keywords`);
    if (seo.metaKeywords && seo.metaKeywords.length > 0) {
      console.log(`   - ${seo.metaKeywords.join(", ")}`);
    }

    if (seoAnalysis.recommendations.length > 0) {
      console.log("\nStrengths:");
      seoAnalysis.recommendations.forEach(rec => console.log(`   ${rec}`));
    }
    if (seoAnalysis.issues.length > 0) {
      console.log("\nIssues:");
      seoAnalysis.issues.forEach(issue => console.log(`   ${issue}`));
    }

    // 3. VIRALITY ANALYSIS
    console.log("\n🚀 3. VIRALITY POTENTIAL ANALYSIS");
    console.log("━".repeat(80));
    const viralityAnalysis = analyzeVirality(blog, blog.content);
    console.log(`🎯 Virality Score: ${viralityAnalysis.score}/100`);

    if (viralityAnalysis.recommendations.length > 0) {
      console.log("\nStrengths:");
      viralityAnalysis.recommendations.forEach(rec => console.log(`   ${rec}`));
    }
    if (viralityAnalysis.issues.length > 0) {
      console.log("\nAreas for Improvement:");
      viralityAnalysis.issues.forEach(issue => console.log(`   ${issue}`));
    }

    // 4. PERFORMANCE ANALYSIS
    console.log("\n⚡ 4. PERFORMANCE ANALYSIS");
    console.log("━".repeat(80));
    const performanceAnalysis = analyzePerformance(blog, blog.content);
    console.log(`🎯 Performance Score: ${performanceAnalysis.score}/100`);

    if (performanceAnalysis.recommendations.length > 0) {
      console.log("\nStrengths:");
      performanceAnalysis.recommendations.forEach(rec =>
        console.log(`   ${rec}`)
      );
    }
    if (performanceAnalysis.issues.length > 0) {
      console.log("\nIssues:");
      performanceAnalysis.issues.forEach(issue => console.log(`   ${issue}`));
    }

    // 5. SCALABILITY ANALYSIS
    console.log("\n🔄 5. SCALABILITY & AUTOMATION ANALYSIS");
    console.log("━".repeat(80));
    const scalabilityAnalysis = analyzeScalability(
      blog,
      blog.content,
      headings
    );
    console.log(`🎯 Scalability Score: ${scalabilityAnalysis.score}/100`);

    if (scalabilityAnalysis.recommendations.length > 0) {
      console.log("\nStrengths:");
      scalabilityAnalysis.recommendations.forEach(rec =>
        console.log(`   ${rec}`)
      );
    }
    if (scalabilityAnalysis.issues.length > 0) {
      console.log("\nIssues:");
      scalabilityAnalysis.issues.forEach(issue => console.log(`   ${issue}`));
    }

    // OVERALL SUMMARY
    console.log("\n" + "━".repeat(80));
    console.log("📈 OVERALL SCORES SUMMARY");
    console.log("━".repeat(80));

    const overallScore = Math.round(
      (structureAnalysis.score +
        seoAnalysis.score +
        viralityAnalysis.score +
        performanceAnalysis.score +
        scalabilityAnalysis.score) /
        5
    );

    console.log(`🏗️  Content Structure:    ${structureAnalysis.score}/100`);
    console.log(`🔍 SEO Optimization:     ${seoAnalysis.score}/100`);
    console.log(`🚀 Virality Potential:   ${viralityAnalysis.score}/100`);
    console.log(`⚡ Performance:          ${performanceAnalysis.score}/100`);
    console.log(`🔄 Scalability:          ${scalabilityAnalysis.score}/100`);
    console.log("━".repeat(80));
    console.log(`🎯 OVERALL SCORE:        ${overallScore}/100`);

    let grade = "F";
    if (overallScore >= 90) grade = "A+";
    else if (overallScore >= 85) grade = "A";
    else if (overallScore >= 80) grade = "B+";
    else if (overallScore >= 75) grade = "B";
    else if (overallScore >= 70) grade = "C+";
    else if (overallScore >= 65) grade = "C";
    else if (overallScore >= 60) grade = "D";

    console.log(`📊 GRADE:                ${grade}`);
    console.log("━".repeat(80));

    // RECOMMENDATIONS
    console.log("\n💡 TOP RECOMMENDATIONS FOR IMPROVEMENT");
    console.log("━".repeat(80));

    const allIssues = [
      ...structureAnalysis.issues,
      ...seoAnalysis.issues,
      ...viralityAnalysis.issues,
      ...performanceAnalysis.issues,
      ...scalabilityAnalysis.issues,
    ];

    if (allIssues.length === 0) {
      console.log(
        "🎉 Excellent! No major issues found. This blog is production-ready!"
      );
    } else {
      console.log(`Found ${allIssues.length} areas for improvement:\n`);
      allIssues.slice(0, 10).forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }

    console.log("\n" + "━".repeat(80));
    console.log("✅ Analysis complete!");
    console.log("━".repeat(80));
  } catch (error) {
    console.error("❌ Error during analysis:", error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

comprehensiveAnalysis();
