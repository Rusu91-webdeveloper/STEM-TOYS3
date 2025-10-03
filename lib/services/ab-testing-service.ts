/**
 * A/B Testing Service for Viral Content Optimization
 *
 * Advanced A/B testing framework specifically designed for Romanian STEM content
 * optimization, focusing on titles, content structure, and conversion elements
 */

import { db } from "../db/index";

// Define our own types based on the Prisma schema
export type ABTestType =
  | "TITLE"
  | "CONTENT"
  | "CALL_TO_ACTION"
  | "IMAGE"
  | "STRUCTURE"
  | "LAYOUT"
  | "PRICING"
  | "CUSTOM";
export type ABTestStatus =
  | "DRAFT"
  | "RUNNING"
  | "COMPLETED"
  | "PAUSED"
  | "CANCELLED";
export type ABTestAudience =
  | "ALL"
  | "ROMANIAN"
  | "NEW_USERS"
  | "RETURNING_USERS"
  | "MOBILE_USERS"
  | "DESKTOP_USERS";

export interface ABTest {
  id: string;
  name: string;
  description: string | null;
  type: ABTestType;
  status: ABTestStatus;
  targetAudience: ABTestAudience;
  startDate: Date | null;
  endDate: Date | null;
  winner: string | null;
  confidence: number | null;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ABTestVariant {
  id: string;
  testId: string;
  name: string;
  content: string;
  weight: number;
  isControl: boolean;
  isWinner: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ABTestMetrics {
  id: string;
  testId: string;
  variantId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  socialShares: number;
  timeOnPage: number;
  bounceRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ABTestResult {
  id: string;
  testId: string;
  winnerVariantId: string;
  confidence: number;
  improvement: number;
  statisticalSignificance: boolean;
  recommendations: string[];
  analysisData: any;
  completedAt: Date;
}

// Extended types for the service layer
export interface ABTestWithVariants extends ABTest {
  variants: ABTestVariant[];
  metrics: ABTestMetrics[];
  results?: ABTestResult | null;
}

export interface ABTestResultWithDetails extends ABTestResult {
  test: ABTestWithVariants;
}

export interface CreateABTestData {
  name: string;
  description?: string;
  type: ABTestType;
  targetAudience: ABTestAudience;
  variants: Array<{
    name: string;
    content: string;
    weight: number;
    isControl?: boolean;
  }>;
  startDate?: Date;
  endDate?: Date;
  createdBy: string;
}

export class ABTestingService {
  /**
   * Create a new A/B test
   */
  static async createABTest(
    testData: CreateABTestData
  ): Promise<ABTestWithVariants> {
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

    // Create the test with variants and metrics in a transaction
    const result = await db.$transaction(async tx => {
      // Create the main test
      const test = await tx.aBTest.create({
        data: {
          name: testData.name,
          description: testData.description,
          type: testData.type,
          targetAudience: testData.targetAudience,
          startDate: testData.startDate,
          endDate: testData.endDate,
          createdBy: testData.createdBy,
          status: "DRAFT",
          isActive: false,
        },
      });

      // Create variants
      const variants = await Promise.all(
        testData.variants.map(variantData =>
          tx.aBTestVariant.create({
            data: {
              testId: test.id,
              name: variantData.name,
              content: variantData.content,
              weight: variantData.weight,
              isControl: variantData.isControl || false,
            },
          })
        )
      );

      // Create initial metrics for each variant
      const metrics = await Promise.all(
        variants.map(variant =>
          tx.aBTestMetrics.create({
            data: {
              testId: test.id,
              variantId: variant.id,
              impressions: 0,
              clicks: 0,
              conversions: 0,
              socialShares: 0,
              timeOnPage: 0,
              bounceRate: 0,
            },
          })
        )
      );

      return { test, variants, metrics };
    });

    return {
      ...result.test,
      variants: result.variants,
      metrics: result.metrics,
    };
  }

  /**
   * Get all A/B tests with their variants and metrics
   */
  static async getAllTests(): Promise<ABTestWithVariants[]> {
    return await db.aBTest.findMany({
      include: {
        variants: true,
        metrics: true,
        results: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Get running A/B tests
   */
  static async getRunningTests(): Promise<ABTestWithVariants[]> {
    return await db.aBTest.findMany({
      where: {
        status: "RUNNING",
        isActive: true,
      },
      include: {
        variants: true,
        metrics: true,
        results: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Get completed A/B tests
   */
  static async getCompletedTests(): Promise<ABTestWithVariants[]> {
    return await db.aBTest.findMany({
      where: {
        status: "COMPLETED",
      },
      include: {
        variants: true,
        metrics: true,
        results: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  /**
   * Get A/B test by ID
   */
  static async getTestById(testId: string): Promise<ABTestWithVariants | null> {
    return await db.aBTest.findUnique({
      where: { id: testId },
      include: {
        variants: true,
        metrics: true,
        results: true,
      },
    });
  }

  /**
   * Start an A/B test
   */
  static async startTest(testId: string): Promise<ABTestWithVariants> {
    const test = await db.$transaction(async tx => {
      const updatedTest = await tx.aBTest.update({
        where: { id: testId },
        data: {
          status: "RUNNING",
          isActive: true,
          startDate: new Date(),
        },
      });

      return await tx.aBTest.findUnique({
        where: { id: testId },
        include: {
          variants: true,
          metrics: true,
          results: true,
        },
      });
    });

    if (!test) {
      throw new Error("Test not found");
    }

    return test;
  }

  /**
   * Pause an A/B test
   */
  static async pauseTest(testId: string): Promise<ABTestWithVariants> {
    const test = await db.$transaction(async tx => {
      await tx.aBTest.update({
        where: { id: testId },
        data: {
          status: "PAUSED",
          isActive: false,
        },
      });

      return await tx.aBTest.findUnique({
        where: { id: testId },
        include: {
          variants: true,
          metrics: true,
          results: true,
        },
      });
    });

    if (!test) {
      throw new Error("Test not found");
    }

    return test;
  }

  /**
   * Stop an A/B test and complete it
   */
  static async stopTest(testId: string): Promise<ABTestWithVariants> {
    const test = await db.$transaction(async tx => {
      // Get current test data
      const currentTest = await tx.aBTest.findUnique({
        where: { id: testId },
        include: {
          variants: true,
          metrics: true,
        },
      });

      if (!currentTest) {
        throw new Error("Test not found");
      }

      // Calculate winner and results
      const results = this.calculateTestResults(currentTest);

      // Update test status
      await tx.aBTest.update({
        where: { id: testId },
        data: {
          status: "COMPLETED",
          isActive: false,
          endDate: new Date(),
          winner: results.winnerVariantId,
          confidence: results.confidence,
        },
      });

      // Create result record
      await tx.aBTestResult.create({
        data: {
          testId: testId,
          winnerVariantId: results.winnerVariantId,
          confidence: results.confidence,
          improvement: results.improvement,
          statisticalSignificance: results.statisticalSignificance,
          recommendations: results.recommendations,
          analysisData: results.analysisData,
        },
      });

      // Mark winning variant
      await tx.aBTestVariant.updateMany({
        where: {
          testId: testId,
          id: results.winnerVariantId,
        },
        data: {
          isWinner: true,
        },
      });

      return await tx.aBTest.findUnique({
        where: { id: testId },
        include: {
          variants: true,
          metrics: true,
          results: true,
        },
      });
    });

    if (!test) {
      throw new Error("Test not found");
    }

    return test;
  }

  /**
   * Track metric for A/B test variant
   */
  static async trackMetric(
    testId: string,
    variantId: string,
    metricType: keyof Omit<
      ABTestMetrics,
      "id" | "testId" | "variantId" | "createdAt" | "updatedAt"
    >,
    value: number = 1
  ): Promise<void> {
    await db.aBTestMetrics.upsert({
      where: {
        testId_variantId: { testId, variantId },
      },
      update: {
        [metricType]: { increment: value },
        updatedAt: new Date(),
      },
      create: {
        testId,
        variantId,
        [metricType]: value,
        impressions: metricType === "impressions" ? value : 0,
        clicks: metricType === "clicks" ? value : 0,
        conversions: metricType === "conversions" ? value : 0,
        socialShares: metricType === "socialShares" ? value : 0,
        timeOnPage: metricType === "timeOnPage" ? value : 0,
        bounceRate: metricType === "bounceRate" ? value : 0,
      },
    });
  }

  /**
   * Get variant for user based on test configuration
   */
  static getVariantForUser(
    test: ABTestWithVariants,
    userId: string
  ): ABTestVariant | null {
    if (!test.isActive || test.status !== "RUNNING") {
      return null;
    }

    // Simple deterministic assignment based on user ID
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
    return test.variants[0] || null;
  }

  /**
   * Get A/B test results and determine winner
   */
  static async getTestResults(
    testId: string
  ): Promise<ABTestResultWithDetails | null> {
    const test = await this.getTestById(testId);
    if (!test || !test.results) {
      return null;
    }

    return {
      ...test.results,
      test,
    };
  }

  /**
   * Calculate test results and determine winner
   */
  private static calculateTestResults(test: ABTestWithVariants): {
    winnerVariantId: string;
    confidence: number;
    improvement: number;
    statisticalSignificance: boolean;
    recommendations: string[];
    analysisData: any;
  } {
    // Calculate conversion rates for each variant
    const variantsWithMetrics = test.variants.map(variant => {
      const metrics = test.metrics.find(m => m.variantId === variant.id);
      const conversionRate = metrics
        ? metrics.conversions / Math.max(metrics.clicks, 1)
        : 0;
      return {
        variant,
        metrics,
        conversionRate,
      };
    });

    // Sort by conversion rate
    const sortedVariants = variantsWithMetrics.sort(
      (a, b) => b.conversionRate - a.conversionRate
    );
    const winner = sortedVariants[0];
    const control = variantsWithMetrics.find(v => v.variant.isControl);

    if (!control) {
      throw new Error("No control variant found");
    }

    const improvement = control.metrics?.clicks
      ? (((winner.metrics?.conversions || 0) -
          (control.metrics?.conversions || 0)) /
          Math.max(control.metrics.conversions, 1)) *
        100
      : 0;

    // Calculate statistical significance
    const confidence = this.calculateStatisticalSignificance(
      winner.metrics?.conversions || 0,
      winner.metrics?.clicks || 0,
      control.metrics?.conversions || 0,
      control.metrics?.clicks || 0
    );

    const recommendations = [
      `Implement "${winner.variant.name}" as the winning variation`,
      `Expected ${improvement.toFixed(1)}% improvement over control`,
      "Continue A/B testing other content elements",
      "Consider testing winning variation with different contexts",
    ];

    return {
      winnerVariantId: winner.variant.id,
      confidence,
      improvement,
      statisticalSignificance: confidence > 95,
      recommendations,
      analysisData: {
        variantsWithMetrics,
        conversionRates: variantsWithMetrics.map(v => ({
          variantId: v.variant.id,
          conversionRate: v.conversionRate,
        })),
      },
    };
  }

  /**
   * Generate Romanian title variations for A/B testing
   */
  static generateRomanianTitleVariations(baseTopic: string): Array<{
    name: string;
    content: string;
    weight: number;
    isControl?: boolean;
  }> {
    return [
      {
        name: "Control - Question Based",
        content: `De ce Copiii Au Nevoie de ${baseTopic}?`,
        weight: 40,
        isControl: true,
      },
      {
        name: "Viral - Shock Statistic",
        content: `ȘOC! De ce 8 din 10 Copii Români URĂSC ${baseTopic}?`,
        weight: 20,
      },
      {
        name: "Viral - Local Secret",
        content: `SECRETUL Părinților din București: Copiii Lor EXCELEAZĂ la ${baseTopic}!`,
        weight: 20,
      },
      {
        name: "Viral - Fear of Missing Out",
        content: `NU RATA ȘANSA! Cum să faci Copilul să IUBEASCĂ ${baseTopic} în 30 de zile`,
        weight: 20,
      },
    ];
  }

  /**
   * Generate Romanian CTA variations for A/B testing
   */
  static generateRomanianCTAVariations(): Array<{
    name: string;
    content: string;
    weight: number;
    isControl?: boolean;
  }> {
    return [
      {
        name: "Control - Standard CTA",
        content: "Descoperă colecția noastră STEM →",
        weight: 40,
        isControl: true,
      },
      {
        name: "Urgency - Limited Time",
        content:
          "🚨 Doar azi: Reducere 30% la jucăriile STEM! Descoperă acum →",
        weight: 20,
      },
      {
        name: "Social Proof - Numbers",
        content:
          "Alătură-te celor 10,000+ părinți mulțumiți! Vezi rezultatele →",
        weight: 20,
      },
      {
        name: "FOMO - Don't Miss Out",
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
    if (clicksA === 0 || clicksB === 0) return 0;

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
}

// Export singleton instance
export const abTestingService = new ABTestingService();
