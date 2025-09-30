const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function compareBlogs() {
  try {
    const [blog4o, blog4] = await Promise.all([
      prisma.blog.findUnique({
        where: { id: "cmg4fa2x900051kq8mecfn6yd" },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          content: true,
          tags: true,
          metadata: true,
          readingTime: true,
          createdAt: true,
          category: { select: { name: true } },
          author: { select: { name: true } },
        },
      }),
      prisma.blog.findUnique({
        where: { id: "cmg4eh9g200011kq8ffwcwl8r" },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          content: true,
          tags: true,
          metadata: true,
          readingTime: true,
          createdAt: true,
          category: { select: { name: true } },
          author: { select: { name: true } },
        },
      }),
    ]);

    if (!blog4o || !blog4) {
      console.log("❌ One or both blogs not found");
      return;
    }

    console.log("🎯 GPT-4o vs GPT-4 BLOG COMPARISON");
    console.log("=".repeat(60));
    console.log(`🤖 GPT-4o Blog: ${blog4o.id} (${blog4o.createdAt})`);
    console.log(`🤖 GPT-4 Blog: ${blog4.id} (${blog4.createdAt})`);
    console.log();

    // Content Analysis
    console.log("📄 CONTENT ANALYSIS");
    console.log("-".repeat(30));

    const content4o = {
      title: blog4o.title || "",
      excerpt: blog4o.excerpt || "",
      content: blog4o.content || "",
      wordCount: blog4o.content ? Math.round(blog4o.content.length / 5) : 0,
      paragraphs: blog4o.content ? blog4o.content.split("\n\n").length : 0,
      questions: blog4o.content
        ? (blog4o.content.match(/\?/g) || []).length
        : 0,
    };

    const content4 = {
      title: blog4.title || "",
      excerpt: blog4.excerpt || "",
      content: blog4.content || "",
      wordCount: blog4.content ? Math.round(blog4.content.length / 5) : 0,
      paragraphs: blog4.content ? blog4.content.split("\n\n").length : 0,
      questions: blog4.content ? (blog4.content.match(/\?/g) || []).length : 0,
    };

    console.log(
      `GPT-4o: ${content4o.wordCount} words, ${content4o.paragraphs} paragraphs, ${content4o.questions} questions`
    );
    console.log(
      `GPT-4:  ${content4.wordCount} words, ${content4.paragraphs} paragraphs, ${content4.questions} questions`
    );
    console.log();

    // Title Quality
    console.log("🏷️ TITLE QUALITY");
    console.log("-".repeat(20));
    console.log(`GPT-4o: "${content4o.title}"`);
    console.log(`GPT-4:  "${content4.title}"`);

    const title4oScore = analyzeTitleQuality(content4o.title);
    const title4Score = analyzeTitleQuality(content4.title);

    console.log(
      `GPT-4o Score: ${title4oScore}/10 (${getTitleGrade(title4oScore)})`
    );
    console.log(
      `GPT-4 Score:  ${title4Score}/10 (${getTitleGrade(title4Score)})`
    );
    console.log();

    // Romanian Language Quality
    console.log("🇷🇴 ROMANIAN LANGUAGE QUALITY");
    console.log("-".repeat(30));

    const romanian4o = analyzeRomanianQuality(content4o.content);
    const romanian4 = analyzeRomanianQuality(content4.content);

    console.log(`GPT-4o Romanian Score: ${romanian4o.score}/10`);
    console.log(`  - Grammar: ${romanian4o.details.grammar}`);
    console.log(`  - Flow: ${romanian4o.details.flow}`);
    console.log(`  - Cultural: ${romanian4o.details.cultural}`);
    console.log(`  - Emotional: ${romanian4o.details.emotional}`);
    console.log();

    console.log(`GPT-4 Romanian Score: ${romanian4.score}/10`);
    console.log(`  - Grammar: ${romanian4.details.grammar}`);
    console.log(`  - Flow: ${romanian4.details.flow}`);
    console.log(`  - Cultural: ${romanian4.details.cultural}`);
    console.log(`  - Emotional: ${romanian4.details.emotional}`);
    console.log();

    // Viral Elements
    console.log("🚀 VIRAL ELEMENTS ANALYSIS");
    console.log("-".repeat(25));

    const viral4o = analyzeViralElements(content4o.content);
    const viral4 = analyzeViralElements(content4.content);

    console.log("GPT-4o Viral Elements:");
    Object.entries(viral4o).forEach(([key, value]) => {
      console.log(`  ${key}: ${value ? "✅" : "❌"}`);
    });
    console.log();

    console.log("GPT-4 Viral Elements:");
    Object.entries(viral4).forEach(([key, value]) => {
      console.log(`  ${key}: ${value ? "✅" : "❌"}`);
    });
    console.log();

    // SEO Analysis
    console.log("🔍 SEO ANALYSIS");
    console.log("-".repeat(15));

    const seo4o = analyzeSEO(blog4o.metadata);
    const seo4 = analyzeSEO(blog4.metadata);

    console.log(`GPT-4o SEO Score: ${seo4o.score}/10`);
    console.log(`  - Meta Title: ${seo4o.details.metaTitle ? "✅" : "❌"}`);
    console.log(
      `  - Meta Description: ${seo4o.details.metaDescription ? "✅" : "❌"}`
    );
    console.log(
      `  - Focus Keyword: ${seo4o.details.focusKeyword ? "✅" : "❌"}`
    );
    console.log(`  - Keywords Count: ${seo4o.details.keywordsCount}`);
    console.log();

    console.log(`GPT-4 SEO Score: ${seo4.score}/10`);
    console.log(`  - Meta Title: ${seo4.details.metaTitle ? "✅" : "❌"}`);
    console.log(
      `  - Meta Description: ${seo4.details.metaDescription ? "✅" : "❌"}`
    );
    console.log(
      `  - Focus Keyword: ${seo4.details.focusKeyword ? "✅" : "❌"}`
    );
    console.log(`  - Keywords Count: ${seo4.details.keywordsCount}`);
    console.log();

    // Processing Time Comparison
    console.log("⏱️ PROCESSING TIME");
    console.log("-".repeat(15));

    const time4o =
      blog4o.metadata && blog4o.metadata.ai
        ? blog4o.metadata.ai.processingTime || 0
        : 0;
    const time4 =
      blog4.metadata && blog4.metadata.ai
        ? blog4.metadata.ai.processingTime || 0
        : 0;

    console.log(`GPT-4o: ${time4o}ms (${Math.round(time4o / 1000)}s)`);
    console.log(`GPT-4:  ${time4}ms (${Math.round(time4 / 1000)}s)`);
    console.log(
      `Speed Improvement: ${time4 > 0 ? Math.round(((time4 - time4o) / time4) * 100) : 0}% faster`
    );
    console.log();

    // Final Comparison
    console.log("🎯 FINAL VERDICT");
    console.log("=".repeat(20));

    const scores4o = {
      content: content4o.wordCount > 0 ? 8 : 0,
      title: title4oScore,
      romanian: romanian4o.score,
      viral: Object.values(viral4o).filter(Boolean).length * 2,
      seo: seo4o.score,
      speed:
        time4 > 0
          ? Math.min(10, Math.round(((time4 - time4o) / time4) * 5) + 5)
          : 5,
    };

    const scores4 = {
      content: content4.wordCount > 0 ? 8 : 0,
      title: title4Score,
      romanian: romanian4.score,
      viral: Object.values(viral4).filter(Boolean).length * 2,
      seo: seo4.score,
      speed: 5,
    };

    const total4o = Object.values(scores4o).reduce((a, b) => a + b, 0);
    const total4 = Object.values(scores4).reduce((a, b) => a + b, 0);

    console.log("Scoring Breakdown:");
    console.log(
      `GPT-4o Total: ${total4o}/60 (${Math.round((total4o / 60) * 100)}%)`
    );
    console.log(
      `GPT-4 Total:  ${total4}/60 (${Math.round((total4 / 60) * 100)}%)`
    );
    console.log();

    if (total4o > total4) {
      const improvement = Math.round(((total4o - total4) / total4) * 100);
      console.log(`🏆 WINNER: GPT-4o is ${improvement}% better overall!`);
    } else if (total4 > total4o) {
      const improvement = Math.round(((total4 - total4o) / total4o) * 100);
      console.log(`🏆 WINNER: GPT-4 is ${improvement}% better overall!`);
    } else {
      console.log("🤝 TIE: Both models perform equally well!");
    }
  } catch (error) {
    console.error("❌ Error comparing blogs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

function analyzeTitleQuality(title) {
  if (!title || title.length === 0) return 0;

  let score = 5; // Base score

  // Length check (50-60 chars optimal)
  if (title.length >= 50 && title.length <= 60) score += 2;
  else if (title.length >= 40 && title.length <= 70) score += 1;

  // Question hooks
  if (title.includes("?")) score += 1;

  // Emotional words
  if (/șocant|surprinzător|secret|transformă|reușit/i.test(title)) score += 1;

  // Keyword presence
  if (/STEM|matematică|copii|educație/i.test(title)) score += 1;

  return Math.min(10, score);
}

function getTitleGrade(score) {
  if (score >= 9) return "Excellent";
  if (score >= 7) return "Good";
  if (score >= 5) return "Average";
  return "Poor";
}

function analyzeRomanianQuality(content) {
  if (!content)
    return {
      score: 0,
      details: {
        grammar: "N/A",
        flow: "N/A",
        cultural: "N/A",
        emotional: "N/A",
      },
    };

  let score = 0;
  const details = {
    grammar: "Good",
    flow: "Good",
    cultural: "Good",
    emotional: "Good",
  };

  // Grammar check (basic heuristics)
  const hasProperDiacritics = /[ăâîșțĂÂÎȘȚ]/.test(content);
  const hasRomanianWords = /școală|părinți|copii|educație|matematică/i.test(
    content
  );
  const sentenceStructure = (content.match(/[.!?]/g) || []).length;

  if (hasProperDiacritics) score += 3;
  if (hasRomanianWords) score += 3;
  if (sentenceStructure > 5) score += 2;

  // Cultural adaptation
  if (/România|București|Program|Național/i.test(content)) {
    score += 1;
    details.cultural = "Excellent";
  }

  // Emotional depth
  if (/teamă|îngrijorat|succes|transformă|reușit/i.test(content)) {
    score += 1;
    details.emotional = "Excellent";
  }

  return {
    score: Math.min(10, score),
    details,
  };
}

function analyzeViralElements(content) {
  if (!content)
    return {
      shockingStats: false,
      successStories: false,
      socialProof: false,
      ctas: false,
      urgency: false,
      romanianContext: false,
    };

  return {
    shockingStats: /statistic|studi|procent|șocant|surprinzător/i.test(content),
    successStories: /Maria|Ioana|școală|profesor|reușit|succes/i.test(content),
    socialProof: /părinți|copii|mama|tata|familie|români/i.test(content),
    ctas: /comandați|cumparați|vizitați|click|aici|descoperă/i.test(content),
    urgency: /urgent|limitat|acum|imediat|azi|doar|ultima/i.test(content),
    romanianContext: /România|București|Cluj|Program|Național|educație/i.test(
      content
    ),
  };
}

function analyzeSEO(metadata) {
  if (!metadata || !metadata.seo) {
    return {
      score: 0,
      details: {
        metaTitle: false,
        metaDescription: false,
        focusKeyword: false,
        keywordsCount: 0,
      },
    };
  }

  const seo = metadata.seo;
  let score = 0;

  if (seo.metaTitle && seo.metaTitle.length >= 30 && seo.metaTitle.length <= 60)
    score += 3;
  if (
    seo.metaDescription &&
    seo.metaDescription.length >= 120 &&
    seo.metaDescription.length <= 160
  )
    score += 3;
  if (seo.focusKeyword) score += 2;
  if (seo.metaKeywords && seo.metaKeywords.length >= 5) score += 2;

  return {
    score,
    details: {
      metaTitle: !!seo.metaTitle,
      metaDescription: !!seo.metaDescription,
      focusKeyword: !!seo.focusKeyword,
      keywordsCount: seo.metaKeywords ? seo.metaKeywords.length : 0,
    },
  };
}

compareBlogs();
