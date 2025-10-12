/**
 * AI Cache Service
 * Specialized caching for AI responses and product enhancement data
 */

import { cache, getCached, CacheKeys, cacheUtils } from "@/lib/cache";
import { BasicProduct, EnhancedProduct, EnhancementResult } from "./types";
import crypto from "crypto";

/**
 * AI-specific cache keys
 */
export const AICacheKeys = {
  // AI response caching
  aiResponse: (prompt: string, model: string, options?: any) => {
    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify({ prompt, model, options }))
      .digest("hex")
      .substring(0, 16);
    return `ai:response:${model}:${hash}`;
  },

  // Product enhancement caching
  productEnhancement: (product: BasicProduct, options?: any) => {
    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify({ product, options }))
      .digest("hex")
      .substring(0, 16);
    return `ai:enhancement:${hash}`;
  },

  // Batch enhancement caching
  batchEnhancement: (batchId: string) => `ai:batch:${batchId}`,
  batchProgress: (batchId: string) => `ai:batch:${batchId}:progress`,

  // AI service health
  aiHealth: (provider: string) => `ai:health:${provider}`,
  aiMetrics: (provider: string, date?: string) =>
    date ? `ai:metrics:${provider}:${date}` : `ai:metrics:${provider}`,

  // Rate limiting
  rateLimit: (provider: string, userId?: string) =>
    userId ? `ai:rate:${provider}:${userId}` : `ai:rate:${provider}`,

  // AI configuration
  aiConfig: () => "ai:config",
  aiModels: (provider: string) => `ai:models:${provider}`,

  // Product similarity (for deduplication)
  productSimilarity: (productHash: string) => `ai:similarity:${productHash}`,
} as const;

/**
 * AI Cache TTL values (in seconds)
 */
export const AICacheTTL = {
  // AI responses - cache for 24 hours (AI responses are deterministic for same inputs)
  AI_RESPONSE: 86400,

  // Product enhancements - cache for 7 days (products don't change often)
  PRODUCT_ENHANCEMENT: 604800,

  // Batch progress - cache for 1 hour (temporary data)
  BATCH_PROGRESS: 3600,

  // Health checks - cache for 5 minutes
  HEALTH_CHECK: 300,

  // Metrics - cache for 1 hour
  METRICS: 3600,

  // Rate limiting - cache for 1 minute
  RATE_LIMIT: 60,

  // Configuration - cache for 1 hour
  CONFIG: 3600,

  // Models - cache for 1 day
  MODELS: 86400,

  // Product similarity - cache for 1 day
  SIMILARITY: 86400,
} as const;

/**
 * AI Cache Service
 */
export class AICacheService {
  /**
   * Cache AI response
   */
  async cacheAIResponse(
    prompt: string,
    model: string,
    response: string,
    options?: any
  ): Promise<void> {
    const key = AICacheKeys.aiResponse(prompt, model, options);
    await cache.set(key, response, AICacheTTL.AI_RESPONSE);
  }

  /**
   * Get cached AI response
   */
  async getCachedAIResponse(
    prompt: string,
    model: string,
    options?: any
  ): Promise<string | null> {
    const key = AICacheKeys.aiResponse(prompt, model, options);
    return await cache.get<string>(key);
  }

  /**
   * Cache product enhancement result
   */
  async cacheProductEnhancement(
    product: BasicProduct,
    result: EnhancementResult,
    options?: any
  ): Promise<void> {
    const key = AICacheKeys.productEnhancement(product, options);
    await cache.set(key, result, AICacheTTL.PRODUCT_ENHANCEMENT);
  }

  /**
   * Get cached product enhancement
   */
  async getCachedProductEnhancement(
    product: BasicProduct,
    options?: any
  ): Promise<EnhancementResult | null> {
    const key = AICacheKeys.productEnhancement(product, options);
    return await cache.get<EnhancementResult>(key);
  }

  /**
   * Cache batch enhancement progress
   */
  async cacheBatchProgress(batchId: string, progress: any): Promise<void> {
    const key = AICacheKeys.batchProgress(batchId);
    await cache.set(key, progress, AICacheTTL.BATCH_PROGRESS);
  }

  /**
   * Get cached batch progress
   */
  async getCachedBatchProgress(batchId: string): Promise<any | null> {
    const key = AICacheKeys.batchProgress(batchId);
    return await cache.get(key);
  }

  /**
   * Cache AI service health
   */
  async cacheAIHealth(provider: string, health: any): Promise<void> {
    const key = AICacheKeys.aiHealth(provider);
    await cache.set(key, health, AICacheTTL.HEALTH_CHECK);
  }

  /**
   * Get cached AI service health
   */
  async getCachedAIHealth(provider: string): Promise<any | null> {
    const key = AICacheKeys.aiHealth(provider);
    return await cache.get(key);
  }

  /**
   * Cache AI metrics
   */
  async cacheAIMetrics(
    provider: string,
    metrics: any,
    date?: string
  ): Promise<void> {
    const key = AICacheKeys.aiMetrics(provider, date);
    await cache.set(key, metrics, AICacheTTL.METRICS);
  }

  /**
   * Get cached AI metrics
   */
  async getCachedAIMetrics(
    provider: string,
    date?: string
  ): Promise<any | null> {
    const key = AICacheKeys.aiMetrics(provider, date);
    return await cache.get(key);
  }

  /**
   * Check rate limit
   */
  async checkRateLimit(
    provider: string,
    userId?: string,
    limit: number = 100
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = AICacheKeys.rateLimit(provider, userId);
    const current = await cache.incr(key, AICacheTTL.RATE_LIMIT);

    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetTime: Date.now() + AICacheTTL.RATE_LIMIT * 1000,
    };
  }

  /**
   * Reset rate limit
   */
  async resetRateLimit(provider: string, userId?: string): Promise<void> {
    const key = AICacheKeys.rateLimit(provider, userId);
    await cache.del(key);
  }

  /**
   * Cache AI configuration
   */
  async cacheAIConfig(config: any): Promise<void> {
    const key = AICacheKeys.aiConfig();
    await cache.set(key, config, AICacheTTL.CONFIG);
  }

  /**
   * Get cached AI configuration
   */
  async getCachedAIConfig(): Promise<any | null> {
    const key = AICacheKeys.aiConfig();
    return await cache.get(key);
  }

  /**
   * Cache available AI models
   */
  async cacheAIModels(provider: string, models: string[]): Promise<void> {
    const key = AICacheKeys.aiModels(provider);
    await cache.set(key, models, AICacheTTL.MODELS);
  }

  /**
   * Get cached AI models
   */
  async getCachedAIModels(provider: string): Promise<string[] | null> {
    const key = AICacheKeys.aiModels(provider);
    return await cache.get<string[]>(key);
  }

  /**
   * Cache product similarity for deduplication
   */
  async cacheProductSimilarity(
    productHash: string,
    similarProducts: string[]
  ): Promise<void> {
    const key = AICacheKeys.productSimilarity(productHash);
    await cache.set(key, similarProducts, AICacheTTL.SIMILARITY);
  }

  /**
   * Get cached product similarity
   */
  async getCachedProductSimilarity(
    productHash: string
  ): Promise<string[] | null> {
    const key = AICacheKeys.productSimilarity(productHash);
    return await cache.get<string[]>(key);
  }

  /**
   * Generate product hash for similarity detection
   */
  generateProductHash(product: BasicProduct): string {
    // Create a hash based on key product attributes
    const keyAttributes = {
      name: product.name.toLowerCase().trim(),
      category: product.category.toLowerCase().trim(),
      price: Math.round(product.price * 100) / 100, // Round to 2 decimal places
    };

    return crypto
      .createHash("sha256")
      .update(JSON.stringify(keyAttributes))
      .digest("hex")
      .substring(0, 16);
  }

  /**
   * Invalidate AI-related cache
   */
  async invalidateAICache(pattern?: string): Promise<void> {
    const patterns = pattern
      ? [pattern]
      : [
          "ai:response:*",
          "ai:enhancement:*",
          "ai:batch:*",
          "ai:health:*",
          "ai:metrics:*",
          "ai:rate:*",
          "ai:config",
          "ai:models:*",
          "ai:similarity:*",
        ];

    for (const p of patterns) {
      const keys = await cache.keys(p);
      if (keys.length > 0) {
        await Promise.all(keys.map(key => cache.del(key)));
        console.log(
          `Invalidated ${keys.length} AI cache keys matching pattern: ${p}`
        );
      }
    }
  }

  /**
   * Get AI cache statistics
   */
  async getAICacheStats(): Promise<{
    totalKeys: number;
    responseKeys: number;
    enhancementKeys: number;
    batchKeys: number;
    healthKeys: number;
    metricsKeys: number;
    rateLimitKeys: number;
    configKeys: number;
    modelKeys: number;
    similarityKeys: number;
  }> {
    const patterns = [
      { pattern: "ai:response:*", key: "responseKeys" },
      { pattern: "ai:enhancement:*", key: "enhancementKeys" },
      { pattern: "ai:batch:*", key: "batchKeys" },
      { pattern: "ai:health:*", key: "healthKeys" },
      { pattern: "ai:metrics:*", key: "metricsKeys" },
      { pattern: "ai:rate:*", key: "rateLimitKeys" },
      { pattern: "ai:config", key: "configKeys" },
      { pattern: "ai:models:*", key: "modelKeys" },
      { pattern: "ai:similarity:*", key: "similarityKeys" },
    ];

    const stats: any = {
      totalKeys: 0,
      responseKeys: 0,
      enhancementKeys: 0,
      batchKeys: 0,
      healthKeys: 0,
      metricsKeys: 0,
      rateLimitKeys: 0,
      configKeys: 0,
      modelKeys: 0,
      similarityKeys: 0,
    };

    for (const { pattern, key } of patterns) {
      const keys = await cache.keys(pattern);
      stats[key] = keys.length;
      stats.totalKeys += keys.length;
    }

    return stats;
  }
}

// Export singleton instance
export const aiCache = new AICacheService();

/**
 * Cached AI response function
 */
export async function getCachedAIResponse<T>(
  prompt: string,
  model: string,
  fetchFn: () => Promise<T>,
  options?: any
): Promise<T> {
  return getCached(
    AICacheKeys.aiResponse(prompt, model, options),
    fetchFn,
    AICacheTTL.AI_RESPONSE * 1000 // Convert to milliseconds
  );
}

/**
 * Cached product enhancement function
 */
export async function getCachedProductEnhancement<T>(
  product: BasicProduct,
  fetchFn: () => Promise<T>,
  options?: any
): Promise<T> {
  return getCached(
    AICacheKeys.productEnhancement(product, options),
    fetchFn,
    AICacheTTL.PRODUCT_ENHANCEMENT * 1000 // Convert to milliseconds
  );
}

/**
 * Cached AI health check function
 */
export async function getCachedAIHealth<T>(
  provider: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  return getCached(
    AICacheKeys.aiHealth(provider),
    fetchFn,
    AICacheTTL.HEALTH_CHECK * 1000 // Convert to milliseconds
  );
}
