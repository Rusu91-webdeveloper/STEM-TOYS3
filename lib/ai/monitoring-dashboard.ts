/**
 * AI Monitoring Dashboard
 * Provides usage statistics and diagnostics for AI enhancement
 */

import { AIMetrics, aiMonitoring } from "./monitoring";
import { AIConfig } from "./config";

export interface AIUsageReport {
  period: "daily" | "weekly" | "monthly" | "all";
  metrics: AIMetrics;
  costBreakdown: {
    [provider: string]: {
      totalTokens: number;
      inputTokens: number;
      outputTokens: number;
      estimatedCost: number;
      currency: string;
    };
  };
  usageByDate: {
    [date: string]: {
      requests: number;
      tokens: number;
      cost: number;
    };
  };
  usageByModel: {
    [model: string]: {
      requests: number;
      tokens: number;
      cost: number;
    };
  };
  topErrors: Array<{
    errorType: string;
    count: number;
    percentage: number;
  }>;
  recommendations: string[];
}

export interface UsageAlert {
  type: "budget" | "performance" | "quota";
  message: string;
  level: "info" | "warning" | "error";
  timestamp: number;
}

/**
 * Pricing information by model
 */
const pricingInfo = {
  // OpenAI pricing ($/1K tokens)
  openai: {
    "gpt-4": { input: 0.03, output: 0.06, currency: "USD" },
    "gpt-4-turbo": { input: 0.01, output: 0.03, currency: "USD" },
    "gpt-3.5-turbo": { input: 0.0005, output: 0.0015, currency: "USD" },
    // Add other models as needed
  },
  anthropic: {
    "claude-2": { input: 0.008, output: 0.024, currency: "USD" },
    "claude-instant-1": { input: 0.0008, output: 0.0024, currency: "USD" },
  },
  gemini: {
    "gemini-pro": { input: 0.00025, output: 0.0005, currency: "USD" },
  },
};

/**
 * AI Monitoring Dashboard Service
 */
export class AIMonitoringDashboard {
  /**
   * Generate a usage report
   */
  async generateUsageReport(
    period: "daily" | "weekly" | "monthly" | "all" = "all"
  ): Promise<AIUsageReport> {
    // Get performance summary
    const summary = await aiMonitoring.getPerformanceSummary();

    // Build usage report
    const report: AIUsageReport = {
      period,
      metrics: summary.overall,
      costBreakdown: {},
      usageByDate: {},
      usageByModel: {},
      topErrors: [],
      recommendations: [],
    };

    // Calculate cost breakdown by provider
    for (const [provider, metrics] of Object.entries(summary.byProvider)) {
      const model = AIConfig.getModel();
      const pricing = this.getPricing(provider, model);

      // Estimate input/output tokens (typically 1:3 ratio for OpenAI)
      const inputTokens = Math.floor(metrics.totalTokens * 0.25);
      const outputTokens = metrics.totalTokens - inputTokens;

      // Calculate cost
      const inputCost = (inputTokens / 1000) * (pricing?.input || 0);
      const outputCost = (outputTokens / 1000) * (pricing?.output || 0);
      const totalCost = inputCost + outputCost;

      report.costBreakdown[provider] = {
        totalTokens: metrics.totalTokens,
        inputTokens,
        outputTokens,
        estimatedCost: totalCost,
        currency: pricing?.currency || "USD",
      };

      // Add model usage
      report.usageByModel[model] = {
        requests: metrics.totalRequests,
        tokens: metrics.totalTokens,
        cost: totalCost,
      };
    }

    // Get top errors
    const errorEntries = Object.entries(summary.overall.errorCounts);
    report.topErrors = errorEntries
      .map(([errorType, count]) => ({
        errorType,
        count,
        percentage: (count / summary.overall.totalRequests) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Generate recommendations
    report.recommendations = this.generateRecommendations(report);

    return report;
  }

  /**
   * Get pricing information for a provider and model
   */
  private getPricing(
    provider: string,
    model: string
  ): { input: number; output: number; currency: string } | undefined {
    return pricingInfo[provider]?.[model];
  }

  /**
   * Generate recommendations based on usage patterns
   */
  private generateRecommendations(report: AIUsageReport): string[] {
    const recommendations: string[] = [];

    // Check error rate
    if (report.metrics.errorRate > 5) {
      recommendations.push(
        `High error rate (${report.metrics.errorRate.toFixed(1)}%). Review top errors and adjust your prompts or API usage.`
      );
    }

    // Check cache hit rate
    if (report.metrics.cacheHitRate < 40) {
      recommendations.push(
        `Low cache hit rate (${report.metrics.cacheHitRate.toFixed(1)}%). Consider adjusting cache settings or implementing better caching strategies.`
      );
    }

    // Check response time
    if (report.metrics.averageResponseTime > 3000) {
      recommendations.push(
        `Slow average response time (${(report.metrics.averageResponseTime / 1000).toFixed(1)}s). Consider using a faster model or optimizing your prompts.`
      );
    }

    // Check for cost optimizations
    let totalCost = 0;
    for (const provider in report.costBreakdown) {
      totalCost += report.costBreakdown[provider].estimatedCost;
    }

    if (totalCost > 50) {
      recommendations.push(
        `High estimated API cost ($${totalCost.toFixed(2)}). Consider implementing token caps or using more efficient models.`
      );
    }

    // Default recommendation
    if (recommendations.length === 0) {
      recommendations.push(
        "Your AI usage looks good! No specific recommendations at this time."
      );
    }

    return recommendations;
  }

  /**
   * Check for cost alerts
   */
  async checkCostAlerts(): Promise<UsageAlert[]> {
    const alerts: UsageAlert[] = [];
    const report = await this.generateUsageReport("monthly");

    // Check total cost
    let totalCost = 0;
    for (const provider in report.costBreakdown) {
      totalCost += report.costBreakdown[provider].estimatedCost;
    }

    // Set thresholds (these would ideally be configurable)
    const warningThreshold = 50;
    const errorThreshold = 100;

    if (totalCost > errorThreshold) {
      alerts.push({
        type: "budget",
        message: `Monthly AI cost has exceeded $${errorThreshold} (currently $${totalCost.toFixed(2)})`,
        level: "error",
        timestamp: Date.now(),
      });
    } else if (totalCost > warningThreshold) {
      alerts.push({
        type: "budget",
        message: `Monthly AI cost is approaching $${errorThreshold} (currently $${totalCost.toFixed(2)})`,
        level: "warning",
        timestamp: Date.now(),
      });
    }

    return alerts;
  }

  /**
   * Export usage data as CSV
   */
  async exportUsageDataCSV(): Promise<string> {
    const report = await this.generateUsageReport("all");

    // Generate CSV header
    let csv = "Date,Requests,Success,Failed,Tokens,Cost\n";

    // Add data rows (mocked as we don't have actual daily data)
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // Distribute metrics across last 30 days as an example
      const requests = Math.round(report.metrics.totalRequests / 30);
      const success = Math.round(report.metrics.successfulRequests / 30);
      const failed = requests - success;
      const tokens = Math.round(report.metrics.totalTokens / 30);

      // Calculate cost
      let dayCost = 0;
      for (const provider in report.costBreakdown) {
        dayCost += report.costBreakdown[provider].estimatedCost / 30;
      }

      csv += `${dateStr},${requests},${success},${failed},${tokens},${dayCost.toFixed(4)}\n`;
    }

    return csv;
  }
}

// Export singleton instance
export const aiDashboard = new AIMonitoringDashboard();
