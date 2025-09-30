/**
 * Viral Metrics Service for Romanian Market Domination
 *
 * Tracks and updates viral content metrics for blog posts to optimize
 * Romanian Google search rankings and social media performance
 */

import { db } from "@/lib/db";
import { BlogPost } from "@/lib/api/blog";

export interface ViralMetricsUpdate {
  blogId: string;
  viralScore?: number; // 0.00-9.99 viral potential score
  socialShares?: number; // Total social media shares
  competitorRank?: number; // Rank vs competitors for target keywords
  romanianMarketFit?: number; // 0.00-9.99 Romanian market relevance
}

export interface ViralMetricsAnalytics {
  totalBlogs: number;
  averageViralScore: number;
  totalSocialShares: number;
  topPerformingBlogs: BlogPost[];
  viralScoreDistribution: {
    high: number; // 7.0+
    medium: number; // 4.0-6.9
    low: number; // <4.0
  };
  competitorRankings: {
    top3: number;
    top10: number;
    top20: number;
  };
}

export class ViralMetricsService {
  /**
   * Update viral metrics for a blog post
   */
  static async updateViralMetrics(update: ViralMetricsUpdate): Promise<void> {
    const { blogId, ...metrics } = update;

    // Validate input ranges
    if (
      metrics.viralScore !== undefined &&
      (metrics.viralScore < 0 || metrics.viralScore > 9.99)
    ) {
      throw new Error("Viral score must be between 0.00 and 9.99");
    }

    if (
      metrics.romanianMarketFit !== undefined &&
      (metrics.romanianMarketFit < 0 || metrics.romanianMarketFit > 9.99)
    ) {
      throw new Error("Romanian market fit must be between 0.00 and 9.99");
    }

    if (metrics.socialShares !== undefined && metrics.socialShares < 0) {
      throw new Error("Social shares cannot be negative");
    }

    if (metrics.competitorRank !== undefined && metrics.competitorRank < 0) {
      throw new Error("Competitor rank cannot be negative");
    }

    await db.blog.update({
      where: { id: blogId },
      data: {
        viralScore: metrics.viralScore,
        socialShares: metrics.socialShares,
        competitorRank: metrics.competitorRank,
        romanianMarketFit: metrics.romanianMarketFit,
      },
    });
  }

  /**
   * Increment social shares for a blog post
   */
  static async incrementSocialShares(
    blogId: string,
    increment: number = 1
  ): Promise<void> {
    if (increment < 0) {
      throw new Error("Increment cannot be negative");
    }

    await db.blog.update({
      where: { id: blogId },
      data: {
        socialShares: {
          increment,
        },
      },
    });
  }

  /**
   * Get viral metrics analytics for all blogs
   */
  static async getViralMetricsAnalytics(): Promise<ViralMetricsAnalytics> {
    const blogs = await db.blog.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
      },
      orderBy: { viralScore: "desc" },
    });

    const totalBlogs = blogs.length;
    const blogsWithViralScore = blogs.filter(blog => blog.viralScore !== null);

    const averageViralScore =
      blogsWithViralScore.length > 0
        ? blogsWithViralScore.reduce(
            (sum, blog) => sum + (blog.viralScore || 0),
            0
          ) / blogsWithViralScore.length
        : 0;

    const totalSocialShares = blogs.reduce(
      (sum, blog) => sum + blog.socialShares,
      0
    );

    // Top performing blogs (by viral score)
    const topPerformingBlogs = blogs
      .filter(blog => blog.viralScore !== null && blog.viralScore >= 7.0)
      .slice(0, 10) as BlogPost[];

    // Viral score distribution
    const viralScoreDistribution = {
      high: blogs.filter(
        blog => blog.viralScore !== null && blog.viralScore >= 7.0
      ).length,
      medium: blogs.filter(
        blog =>
          blog.viralScore !== null &&
          blog.viralScore >= 4.0 &&
          blog.viralScore < 7.0
      ).length,
      low: blogs.filter(
        blog => blog.viralScore !== null && blog.viralScore < 4.0
      ).length,
    };

    // Competitor rankings distribution
    const competitorRankings = {
      top3: blogs.filter(
        blog => blog.competitorRank !== null && blog.competitorRank <= 3
      ).length,
      top10: blogs.filter(
        blog => blog.competitorRank !== null && blog.competitorRank <= 10
      ).length,
      top20: blogs.filter(
        blog => blog.competitorRank !== null && blog.competitorRank <= 20
      ).length,
    };

    return {
      totalBlogs,
      averageViralScore: Math.round(averageViralScore * 100) / 100,
      totalSocialShares,
      topPerformingBlogs,
      viralScoreDistribution,
      competitorRankings,
    };
  }

  /**
   * Get viral metrics for a specific blog post
   */
  static async getBlogViralMetrics(
    blogId: string
  ): Promise<ViralMetricsUpdate | null> {
    const blog = await db.blog.findUnique({
      where: { id: blogId },
      select: {
        id: true,
        viralScore: true,
        socialShares: true,
        competitorRank: true,
        romanianMarketFit: true,
      },
    });

    if (!blog) return null;

    return {
      blogId: blog.id,
      viralScore: blog.viralScore ? Number(blog.viralScore) : undefined,
      socialShares: blog.socialShares,
      competitorRank: blog.competitorRank || undefined,
      romanianMarketFit: blog.romanianMarketFit
        ? Number(blog.romanianMarketFit)
        : undefined,
    };
  }

  /**
   * Calculate viral score based on multiple factors
   * This is a basic algorithm that can be enhanced with ML
   */
  static calculateViralScore({
    socialShares = 0,
    competitorRank,
    romanianMarketFit = 0,
    contentLength = 0,
    keywordDensity = 0,
  }: {
    socialShares?: number;
    competitorRank?: number;
    romanianMarketFit?: number;
    contentLength?: number;
    keywordDensity?: number;
  }): number {
    let score = 0;

    // Social shares factor (0-3 points)
    if (socialShares >= 1000) score += 3;
    else if (socialShares >= 100) score += 2;
    else if (socialShares >= 10) score += 1;

    // Competitor rank factor (0-3 points)
    if (competitorRank && competitorRank <= 3) score += 3;
    else if (competitorRank && competitorRank <= 10) score += 2;
    else if (competitorRank && competitorRank <= 20) score += 1;

    // Romanian market fit factor (0-2 points)
    if (romanianMarketFit >= 8.0) score += 2;
    else if (romanianMarketFit >= 6.0) score += 1;

    // Content quality factor (0-2 points)
    if (contentLength >= 2000) score += 2;
    else if (contentLength >= 1500) score += 1;

    // SEO optimization factor (0-2 points)
    if (keywordDensity >= 1.5 && keywordDensity <= 2.5) score += 2;
    else if (keywordDensity >= 1.0 && keywordDensity <= 3.0) score += 1;

    // Normalize to 0.00-9.99 scale
    return Math.min(9.99, Math.max(0, score * 1.11));
  }

  /**
   * Get blogs that need viral metrics updates
   */
  static async getBlogsNeedingMetricsUpdate(): Promise<BlogPost[]> {
    const blogs = await db.blog.findMany({
      where: {
        OR: [{ viralScore: null }, { romanianMarketFit: null }],
        isPublished: true,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 50,
    });

    return blogs as BlogPost[];
  }
}
