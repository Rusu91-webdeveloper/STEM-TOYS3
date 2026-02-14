/**
 * AI Health Check API
 * Provides health status and monitoring information for AI services
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/admin";
import { aiMonitoring } from "@/lib/ai/monitoring";
import { aiRateLimiter } from "@/lib/ai/rate-limiter";
import { aiErrorRecovery } from "@/lib/ai/error-recovery";
import { aiMemoryOptimizer } from "@/lib/ai/memory-optimizer";
import { aiCache } from "@/lib/ai/cache";
import { AIConfig } from "@/lib/ai/config";
import { z } from "zod";

const healthCheckSchema = z.object({
  provider: z.string().optional(),
  includeMetrics: z.boolean().default(true),
  includeAlerts: z.boolean().default(true),
  includePerformance: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check admin authorization
    if (!isAdmin(session.user)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = {
      provider: searchParams.get("provider") || undefined,
      includeMetrics: searchParams.get("includeMetrics") !== "false",
      includeAlerts: searchParams.get("includeAlerts") !== "false",
      includePerformance: searchParams.get("includePerformance") !== "false",
    };

    const validatedQuery = healthCheckSchema.parse(query);

    // Get AI configuration status
    const configStatus = {
      isConfigured: AIConfig.isConfigured(),
      isEnhancementEnabled: AIConfig.isEnhancementEnabled(),
      provider: AIConfig.getProvider(),
      model: AIConfig.getModel(),
    };

    // Get health status for all providers or specific provider
    const providers = validatedQuery.provider
      ? [validatedQuery.provider]
      : ["openai", "anthropic", "gemini"];

    const healthStatuses: Record<string, any> = {};

    for (const provider of providers) {
      try {
        healthStatuses[provider] = await aiMonitoring.getHealthStatus(provider);
      } catch (error) {
        healthStatuses[provider] = {
          provider,
          isHealthy: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    // Get performance summary if requested
    let performanceSummary = null;
    if (validatedQuery.includePerformance) {
      try {
        performanceSummary = await aiMonitoring.getPerformanceSummary();
      } catch (error) {
        console.error("Failed to get performance summary:", error);
      }
    }

    // Get alerts if requested
    let alerts: any[] = [];
    if (validatedQuery.includeAlerts) {
      try {
        alerts = await aiMonitoring.getAlerts(
          validatedQuery.provider,
          undefined,
          false
        );
      } catch (error) {
        console.error("Failed to get alerts:", error);
      }
    }

    // Get rate limit status
    const rateLimitStatuses: Record<string, any> = {};
    for (const provider of providers) {
      try {
        rateLimitStatuses[provider] =
          await aiRateLimiter.getRateLimitStatus(provider);
      } catch (error) {
        rateLimitStatuses[provider] = {
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    // Get circuit breaker status
    const circuitBreakerStatuses = aiErrorRecovery.getRecoveryStatus();

    // Get memory statistics
    const memoryStats = aiMemoryOptimizer.getMemoryStats();
    const memoryRecommendations =
      aiMemoryOptimizer.getMemoryOptimizationRecommendations(
        validatedQuery.provider || "openai"
      );

    // Get cache statistics
    const cacheStats = await aiCache.getAICacheStats();

    // Calculate overall health score
    const overallHealth = calculateOverallHealth(healthStatuses, configStatus);

    const response = {
      status: "success",
      timestamp: new Date().toISOString(),
      overallHealth,
      config: configStatus,
      health: healthStatuses,
      rateLimits: rateLimitStatuses,
      circuitBreakers: circuitBreakerStatuses,
      memory: {
        stats: memoryStats,
        recommendations: memoryRecommendations,
      },
      cache: cacheStats,
      ...(validatedQuery.includePerformance && {
        performance: performanceSummary,
      }),
      ...(validatedQuery.includeAlerts && { alerts }),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("AI health check failed:", error);
    return NextResponse.json(
      {
        error: "Health check failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate overall health score
 */
function calculateOverallHealth(
  healthStatuses: Record<string, any>,
  configStatus: any
): {
  score: number;
  status: "healthy" | "degraded" | "unhealthy";
  issues: string[];
} {
  const issues: string[] = [];
  let totalScore = 0;
  let providerCount = 0;

  // Check configuration
  if (!configStatus.isConfigured) {
    issues.push("AI configuration is incomplete");
    totalScore += 0;
  } else {
    totalScore += 100;
  }

  if (!configStatus.isEnhancementEnabled) {
    issues.push("AI enhancement is disabled");
    totalScore += 0;
  } else {
    totalScore += 100;
  }

  providerCount += 2;

  // Check provider health
  for (const [provider, status] of Object.entries(healthStatuses)) {
    providerCount++;

    if (status.error) {
      issues.push(`${provider}: ${status.error}`);
      totalScore += 0;
    } else if (status.isHealthy) {
      totalScore += 100;
    } else {
      issues.push(`${provider}: Service unhealthy`);
      totalScore += 50;
    }
  }

  const averageScore = providerCount > 0 ? totalScore / providerCount : 0;

  let status: "healthy" | "degraded" | "unhealthy";
  if (averageScore >= 90) {
    status = "healthy";
  } else if (averageScore >= 70) {
    status = "degraded";
  } else {
    status = "unhealthy";
  }

  return {
    score: Math.round(averageScore),
    status,
    issues,
  };
}
