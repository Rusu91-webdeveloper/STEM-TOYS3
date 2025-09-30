/**
 * A/B Testing Service for Viral Content Optimization
 *
 * Advanced A/B testing framework specifically designed for Romanian STEM content
 * optimization, focusing on titles, content structure, and conversion elements
 */

import { db } from "@/lib/db";

export interface ABTestVariant {
  id: string;
  name: string;
  content: string;
  weight: number; // Percentage of traffic (0-100)
  isControl?: boolean;
}

export interface ABTestMetrics {
  variantId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  socialShares: number;
  timeOnPage: number;
  bounceRate: number;
  viralScore?: number;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  type: "title" | "content" | "call_to_action" | "image" | "structure";
  status: "draft" | "running" | "completed" | "paused";
  targetAudience: "all" | "romanian" | "new_users" | "returning_users";
  variants: ABTestVariant[];
  metrics: ABTestMetrics[];
  startDate?: Date;
  endDate?: Date;
  winner?: string; // Variant ID of the winner
  confidence?: number; // Statistical confidence level
  createdAt: Date;
  updatedAt: Date;
}

export interface ABTestResult {
  test: ABTest;
  winner: ABTestVariant;
  confidence: number;
  improvement: number; // Percentage improvement over control
  statisticalSignificance: boolean;
  recommendations: string[];
}

export class ABTestingService {
  /**
   * Create a new A/B test
   */
  static async createABTest(
    testData: Omit<ABTest, "id" | "metrics" | "createdAt" | "updatedAt">
  ): Promise<ABTest> {
    // Validate variants
    const totalWeight = testData.variants.reduce(
      (sum, variant) => sum + variant.weight,
      0
    );
    if (Math.abs(totalWeight - 100) > 0.1) {
      throw new Error("Variant weights must sum to 100%");
    }

    if (testData.variants.length < 2) {
      throw new Error("A/B test must have at least 2 variants");
    }

    // Ensure one control variant
    const controlVariants = testData.variants.filter(v => v.isControl);
    if (controlVariants.length !== 1) {
      throw new Error("A/B test must have exactly one control variant");
    }

    // In a real implementation, this would save to database
    const test: ABTest = {
      ...testData,
      id: `ab_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metrics: testData.variants.map(variant => ({
        variantId: variant.id,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        socialShares: 0,
        timeOnPage: 0,
        bounceRate: 0,
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return test;
  }

  /**
   * Get variant for user based on test configuration
   */
  static getVariantForUser(test: ABTest, userId: string): ABTestVariant {
    // Simple deterministic assignment based on user ID
    // In production, use proper randomization with consistent assignment
    const hash = this.simpleHash(userId + test.id);
    const randomValue = (hash % 100) / 100;

    let cumulativeWeight = 0;
    for (const variant of test.variants) {
      cumulativeWeight += variant.weight / 100;
      if (randomValue <= cumulativeWeight) {
        return variant;
      }
    }

    // Fallback to first variant
    return test.variants[0];
  }

  /**
   * Track metric for A/B test variant
   */
  static async trackMetric(
    testId: string,
    variantId: string,
    metricType: keyof ABTestMetrics,
    value: number = 1
  ): Promise<void> {
    // In a real implementation, this would update the database
    console.log(
      `Tracking ${metricType} for test ${testId}, variant ${variantId}: ${value}`
    );

    // Simulate database update
    // await db.abTestMetric.upsert({
    //   where: { testId_variantId: { testId, variantId } },
    //   update: { [metricType]: { increment: value } },
    //   create: {
    //     testId,
    //     variantId,
    //     [metricType]: value,
    //     impressions: metricType === 'impressions' ? value : 0,
    //     clicks: metricType === 'clicks' ? value : 0,
    //     conversions: metricType === 'conversions' ? value : 0,
    //     socialShares: metricType === 'socialShares' ? value : 0,
    //     timeOnPage: metricType === 'timeOnPage' ? value : 0,
    //     bounceRate: metricType === 'bounceRate' ? value : 0,
    //   },
    // });
  }

  /**
   * Get A/B test results and determine winner
   */
  static async getTestResults(testId: string): Promise<ABTestResult | null> {
    // Mock implementation - in production would fetch from database
    const mockTest: ABTest = {
      id: testId,
      name: "Romanian Title Test",
      description: "Testing viral title variations for STEM content",
      type: "title",
      status: "running",
      targetAudience: "romanian",
      variants: [
        {
          id: "control",
          name: "Control Title",
          content: "De ce Copiii Au Nevoie de Jucării STEM?",
          weight: 50,
          isControl: true,
        },
        {
          id: "variant_a",
          name: "Viral Title A",
          content: "ȘOC! De ce 8 din 10 Copii Români URĂSC Matematica?",
          weight: 25,
        },
        {
          id: "variant_b",
          name: "Viral Title B",
          content: "SECRETUL Părinților din Cluj: Copiii Lor EXCELEAZĂ!",
          weight: 25,
        },
      ],
      metrics: [
        {
          variantId: "control",
          impressions: 15420,
          clicks: 1234,
          conversions: 89,
          socialShares: 156,
          timeOnPage: 185,
          bounceRate: 0.35,
        },
        {
          variantId: "variant_a",
          impressions: 7680,
          clicks: 984,
          conversions: 76,
          socialShares: 234,
          timeOnPage: 245,
          bounceRate: 0.28,
        },
        {
          variantId: "variant_b",
          impressions: 7720,
          clicks: 756,
          conversions: 45,
          socialShares: 198,
          timeOnPage: 198,
          bounceRate: 0.42,
        },
      ],
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Calculate winner based on conversion rate
    const variantsWithConversionRate = mockTest.metrics.map(metric => {
      const variant = mockTest.variants.find(v => v.id === metric.variantId);
      const conversionRate = metric.conversions / metric.clicks;
      return {
        variant: variant!,
        metric,
        conversionRate,
      };
    });

    const sortedVariants = variantsWithConversionRate.sort(
      (a, b) => b.conversionRate - a.conversionRate
    );
    const winner = sortedVariants[0];
    const control = variantsWithConversionRate.find(v => v.variant.isControl)!;

    const improvement =
      ((winner.conversionRate - control.conversionRate) /
        control.conversionRate) *
      100;

    // Calculate statistical significance (simplified)
    const confidence = this.calculateStatisticalSignificance(
      winner.metric.conversions,
      winner.metric.clicks,
      control.metric.conversions,
      control.metric.clicks
    );

    return {
      test: mockTest,
      winner: winner.variant,
      confidence,
      improvement,
      statisticalSignificance: confidence > 95,
      recommendations: [
        `Implement "${winner.variant.name}" as the winning title variation`,
        `Expected ${improvement.toFixed(1)}% improvement in conversions`,
        "Continue A/B testing other content elements",
        "Consider testing winning title with different content structures",
      ],
    };
  }

  /**
   * Generate Romanian title variations for A/B testing
   */
  static generateRomanianTitleVariations(baseTopic: string): ABTestVariant[] {
    const variations = [
      {
        id: "control",
        name: "Control - Question Based",
        content: `De ce Copiii Au Nevoie de ${baseTopic}?`,
        weight: 40,
        isControl: true,
      },
      {
        id: "viral_shock",
        name: "Viral - Shock Statistic",
        content: `ȘOC! De ce 8 din 10 Copii Români URĂSC ${baseTopic}?`,
        weight: 20,
      },
      {
        id: "viral_secret",
        name: "Viral - Local Secret",
        content: `SECRETUL Părinților din București: Copiii Lor EXCELEAZĂ la ${baseTopic}!`,
        weight: 20,
      },
      {
        id: "viral_fear",
        name: "Viral - Fear of Missing Out",
        content: `NU RATA ȘANSA! Cum să faci Copilul să IUBEASCĂ ${baseTopic} în 30 de zile`,
        weight: 20,
      },
    ];

    return variations;
  }

  /**
   * Generate Romanian CTA variations for A/B testing
   */
  static generateRomanianCTAVariations(): ABTestVariant[] {
    return [
      {
        id: "control",
        name: "Control - Standard CTA",
        content: "Descoperă colecția noastră STEM →",
        weight: 40,
        isControl: true,
      },
      {
        id: "urgency",
        name: "Urgency - Limited Time",
        content:
          "🚨 Doar azi: Reducere 30% la jucăriile STEM! Descoperă acum →",
        weight: 20,
      },
      {
        id: "social_proof",
        name: "Social Proof - Numbers",
        content:
          "Alătură-te celor 10,000+ părinți mulțumiți! Vezi rezultatele →",
        weight: 20,
      },
      {
        id: "fear_missing_out",
        name: "FOMO - Don&apos;t Miss Out",
        content: "⚠️ NU pierde șansa! Copiii tăi vor rămâne în urmă fără STEM",
        weight: 20,
      },
    ];
  }

  /**
   * Calculate statistical significance using chi-square test (simplified)
   */
  private static calculateStatisticalSignificance(
    conversionsA: number,
    clicksA: number,
    conversionsB: number,
    clicksB: number
  ): number {
    // Simplified statistical significance calculation
    // In production, use proper statistical libraries

    const rateA = conversionsA / clicksA;
    const rateB = conversionsB / clicksB;
    const diff = Math.abs(rateA - rateB);

    // Simple confidence calculation (not statistically rigorous)
    const pooledSE = Math.sqrt(
      (rateA * (1 - rateA)) / clicksA + (rateB * (1 - rateB)) / clicksB
    );

    if (pooledSE === 0) return 100;

    const zScore = diff / pooledSE;
    const confidence = Math.min(
      99.9,
      (1 - Math.exp((-zScore * zScore) / 2)) * 100
    );

    return Math.round(confidence * 10) / 10;
  }

  /**
   * Simple hash function for consistent user assignment
   */
  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get running A/B tests
   */
  static async getRunningTests(): Promise<ABTest[]> {
    // Mock implementation - would fetch from database
    return [
      {
        id: "title_test_2025",
        name: "Romanian Title Optimization",
        description:
          "Testing viral title variations for maximum click-through rates",
        type: "title",
        status: "running",
        targetAudience: "romanian",
        variants: [],
        metrics: [],
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "cta_test_2025",
        name: "Call-to-Action Optimization",
        description: "Testing different CTA variations for maximum conversions",
        type: "call_to_action",
        status: "running",
        targetAudience: "all",
        variants: [],
        metrics: [],
        startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }
}

// Export singleton instance
export const abTestingService = new ABTestingService();
