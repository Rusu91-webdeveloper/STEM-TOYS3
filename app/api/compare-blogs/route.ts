import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blogId4o = searchParams.get("blog4o");
    const blogId4 = searchParams.get("blog4");

    if (!blogId4o || !blogId4) {
      return NextResponse.json(
        {
          error: "Both blog IDs required (blog4o and blog4 parameters)",
        },
        { status: 400 }
      );
    }

    const [blog4o, blog4] = await Promise.all([
      db.blog.findUnique({
        where: { id: blogId4o },
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
      db.blog.findUnique({
        where: { id: blogId4 },
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
      return NextResponse.json(
        {
          error: "One or both blogs not found",
        },
        { status: 404 }
      );
    }

    // Content Analysis
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

    // Title Quality Analysis
    const title4oScore = analyzeTitleQuality(content4o.title);
    const title4Score = analyzeTitleQuality(content4.title);

    // Romanian Language Quality
    const romanian4o = analyzeRomanianQuality(content4o.content);
    const romanian4 = analyzeRomanianQuality(content4.content);

    // Viral Elements
    const viral4o = analyzeViralElements(content4o.content);
    const viral4 = analyzeViralElements(content4.content);

    // SEO Analysis
    const seo4o = analyzeSEO(blog4o.metadata);
    const seo4 = analyzeSEO(blog4.metadata);

    // Processing Time
    const time4o =
      blog4o.metadata && blog4o.metadata.ai
        ? blog4o.metadata.ai.processingTime || 0
        : 0;
    const time4 =
      blog4.metadata && blog4.metadata.ai
        ? blog4.metadata.ai.processingTime || 0
        : 0;

    // Scoring
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

    const comparison = {
      blogs: {
        gpt4o: {
          id: blog4o.id,
          createdAt: blog4o.createdAt,
          title: content4o.title,
          wordCount: content4o.wordCount,
          paragraphs: content4o.paragraphs,
          questions: content4o.questions,
        },
        gpt4: {
          id: blog4.id,
          createdAt: blog4.createdAt,
          title: content4.title,
          wordCount: content4.wordCount,
          paragraphs: content4.paragraphs,
          questions: content4.questions,
        },
      },
      analysis: {
        titleQuality: {
          gpt4o: { score: title4oScore, grade: getTitleGrade(title4oScore) },
          gpt4: { score: title4Score, grade: getTitleGrade(title4Score) },
        },
        romanianQuality: {
          gpt4o: romanian4o,
          gpt4: romanian4,
        },
        viralElements: {
          gpt4o: viral4o,
          gpt4: viral4,
        },
        seoAnalysis: {
          gpt4o: seo4o,
          gpt4: seo4,
        },
        processingTime: {
          gpt4o: time4o,
          gpt4: time4,
          improvement:
            time4 > 0 ? Math.round(((time4 - time4o) / time4) * 100) : 0,
        },
      },
      scoring: {
        breakdown: {
          gpt4o: scores4o,
          gpt4: scores4,
        },
        totals: {
          gpt4o: `${total4o}/60 (${Math.round((total4o / 60) * 100)}%)`,
          gpt4: `${total4}/60 (${Math.round((total4 / 60) * 100)}%)`,
        },
        winner: total4o > total4 ? "gpt4o" : total4 > total4o ? "gpt4" : "tie",
        improvement:
          total4o > total4
            ? `${Math.round(((total4o - total4) / total4) * 100)}% better`
            : total4 > total4o
              ? `${Math.round(((total4 - total4o) / total4o) * 100)}% better`
              : "Equal performance",
      },
    };

    return NextResponse.json({
      success: true,
      comparison,
    });
  } catch (error) {
    console.error("Error comparing blogs:", error);
    return NextResponse.json(
      {
        error: "Failed to compare blogs",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

function analyzeTitleQuality(title: string) {
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

function getTitleGrade(score: number) {
  if (score >= 9) return "Excellent";
  if (score >= 7) return "Good";
  if (score >= 5) return "Average";
  return "Poor";
}

function analyzeRomanianQuality(content: string) {
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

function analyzeViralElements(content: string) {
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

function analyzeSEO(metadata: any) {
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
