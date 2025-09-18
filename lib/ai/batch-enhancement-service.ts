/**
 * Batch Enhancement Service
 * Handles batch processing of multiple products with AI enhancement
 */

import { ProductEnhancementService } from "./product-enhancement-service";
import { AIConfig } from "./config";
import { ApiErrors } from "@/lib/api-error-handler";
import {
  BasicProduct,
  EnhancedProduct,
  EnhancementOptions,
  EnhancementProgress,
  EnhancementResult,
  BatchEnhancementResult,
} from "./types";
import { aiRateLimiter } from "./rate-limiter";
import { simpleAIMonitoring } from "./monitoring-simple";
import { aiErrorRecovery } from "./error-recovery";
import { aiMemoryOptimizer } from "./memory-optimizer";
import { aiCache } from "./cache";

const aiMonitoring = simpleAIMonitoring;

export class BatchEnhancementService {
  private enhancementService = new ProductEnhancementService();
  private defaultBatchSize = 3; // Reduced from 5 to prevent memory issues
  private defaultDelayMs = 2000; // Increased delay to 2 seconds between batches

  /**
   * Enhance multiple products in batches
   */
  async enhanceProductsBatch(
    products: BasicProduct[],
    options?: Partial<EnhancementOptions>,
    onProgress?: (progress: EnhancementProgress) => void
  ): Promise<BatchEnhancementResult> {
    const startTime = Date.now();
    const provider = AIConfig.getProvider();
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Check if AI enhancement is enabled
      if (!AIConfig.isEnhancementEnabled()) {
        throw new Error("AI enhancement is disabled");
      }

      // Check memory usage before starting
      const memoryStats = aiMemoryOptimizer.getMemoryStats();
      if (memoryStats.usedMemory > 1500) {
        // 1.5GB limit
        throw new Error(
          `Memory usage too high (${memoryStats.usedMemory}MB). Please restart the server or reduce batch size.`
        );
      }

      // Check batch rate limit
      const batchRateLimit = await aiRateLimiter.checkBatchRateLimit(
        provider,
        products.length
      );
      if (!batchRateLimit.allowed) {
        throw new Error(
          `Batch rate limit exceeded. Max batch size: ${batchRateLimit.maxBatchSize}, ` +
            `Estimated wait time: ${batchRateLimit.estimatedWaitTime}ms`
        );
      }

      // Record batch start
      await aiRateLimiter.recordBatchStart(provider, batchId);

      // Optimize products for memory usage
      const optimizedProducts = this.optimizeProductsForProcessing(products);

      // Use memory-optimized processing
      const results = await aiMemoryOptimizer.processProductsInChunks(
        provider,
        optimizedProducts,
        async chunk => {
          return this.processChunk(chunk, options, onProgress, startTime);
        },
        {
          onProgress: chunkProgress => {
            if (onProgress) {
              onProgress({
                total: products.length,
                processed: chunkProgress.processed,
                successful: 0, // Will be calculated in processChunk
                failed: 0, // Will be calculated in processChunk
                errors: [],
                startTime,
                estimatedTimeRemaining: 0, // Will be calculated
              });
            }
          },
        }
      );

      // Calculate final summary
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      const totalProcessingTime = Date.now() - startTime;
      const averageProcessingTime =
        results.length > 0
          ? results.reduce((sum, r) => sum + r.processingTime, 0) /
            results.length
          : 0;

      const summary = {
        total: products.length,
        successful,
        failed,
        successRate:
          products.length > 0 ? (successful / products.length) * 100 : 0,
        totalProcessingTime,
        averageProcessingTime,
      };

      // Record batch completion
      await aiRateLimiter.recordBatchComplete(provider, batchId);
      await aiMonitoring.recordBatchEvent(
        provider,
        true,
        products.length,
        totalProcessingTime
      );

      return {
        results,
        summary,
        errors: results
          .filter(r => !r.success)
          .map(r => ({
            product: r.enhancedProduct?.name || "Unknown",
            error: r.error || "Unknown error",
          })),
      };
    } catch (error) {
      // Record batch failure
      await aiRateLimiter.recordBatchComplete(provider, batchId);
      await aiMonitoring.recordBatchEvent(
        provider,
        false,
        products.length,
        Date.now() - startTime
      );
      await aiMonitoring.recordError(provider, error.constructor.name);

      throw error;
    }
  }

  /**
   * Process a chunk of products with optimization
   */
  private async processChunk(
    chunk: BasicProduct[],
    options?: Partial<EnhancementOptions>,
    onProgress?: (progress: EnhancementProgress) => void,
    startTime?: number
  ): Promise<EnhancementResult[]> {
    const results: EnhancementResult[] = [];
    const chunkStartTime = Date.now();

    // Process products in parallel within the chunk
    const promises = chunk.map(async (product, index) => {
      const productStartTime = Date.now();

      try {
        const enhancedProduct = await this.enhancementService.enhanceProduct(
          product,
          options
        );

        const result: EnhancementResult = {
          success: true,
          enhancedProduct,
          processingTime: Date.now() - productStartTime,
        };

        results.push(result);
        return result;
      } catch (error) {
        const result: EnhancementResult = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          processingTime: Date.now() - productStartTime,
        };

        results.push(result);
        return result;
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  /**
   * Process a single batch of products (legacy method)
   */
  private async processBatch(
    batch: BasicProduct[],
    options?: Partial<EnhancementOptions>,
    onProgress?: (progress: EnhancementProgress) => void
  ): Promise<EnhancementResult[]> {
    return this.processChunk(batch, options, onProgress);
  }

  /**
   * Optimize products for memory-efficient processing
   */
  private optimizeProductsForProcessing(
    products: BasicProduct[]
  ): BasicProduct[] {
    // Deduplicate products
    const deduplicated = aiMemoryOptimizer.deduplicateProducts(products);

    // Compress product data
    const compressed = aiMemoryOptimizer.compressProductData(deduplicated);

    return compressed;
  }

  /**
   * Create batches from products array
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    return batches;
  }

  /**
   * Add delay between operations
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Enhance products with custom batch size and delay
   */
  async enhanceProductsWithCustomSettings(
    products: BasicProduct[],
    batchSize: number = 5,
    delayMs: number = 1000,
    options?: Partial<EnhancementOptions>,
    onProgress?: (progress: EnhancementProgress) => void
  ): Promise<BatchEnhancementResult> {
    const originalBatchSize = this.defaultBatchSize;
    const originalDelay = this.defaultDelayMs;

    try {
      this.defaultBatchSize = batchSize;
      this.defaultDelayMs = delayMs;

      return await this.enhanceProductsBatch(products, options, onProgress);
    } finally {
      this.defaultBatchSize = originalBatchSize;
      this.defaultDelayMs = originalDelay;
    }
  }

  /**
   * Enhance products with retry logic for failed items
   */
  async enhanceProductsWithRetry(
    products: BasicProduct[],
    maxRetries: number = 2,
    options?: Partial<EnhancementOptions>,
    onProgress?: (progress: EnhancementProgress) => void
  ): Promise<BatchEnhancementResult> {
    let result = await this.enhanceProductsBatch(products, options, onProgress);

    // Retry failed products
    for (
      let retry = 0;
      retry < maxRetries && result.summary.failed > 0;
      retry++
    ) {
      const failedProducts = result.results
        .filter(r => !r.success)
        .map((r, index) => products.find(p => p.name === products[index]?.name))
        .filter(Boolean) as BasicProduct[];

      if (failedProducts.length === 0) break;

      console.log(
        `Retrying ${failedProducts.length} failed products (attempt ${retry + 1}/${maxRetries})`
      );

      const retryResult = await this.enhanceProductsBatch(
        failedProducts,
        options,
        onProgress
      );

      // Merge retry results
      result.results = result.results.map((originalResult, index) => {
        const retryIndex = failedProducts.findIndex(
          p => p.name === products[index]?.name
        );
        if (retryIndex >= 0 && retryResult.results[retryIndex]?.success) {
          return retryResult.results[retryIndex];
        }
        return originalResult;
      });

      // Recalculate summary
      const successful = result.results.filter(r => r.success).length;
      const failed = result.results.filter(r => !r.success).length;

      result.summary = {
        ...result.summary,
        successful,
        failed,
        successRate:
          products.length > 0 ? (successful / products.length) * 100 : 0,
      };
    }

    return result;
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): {
    defaultBatchSize: number;
    defaultDelayMs: number;
    estimatedTimePerProduct: number;
  } {
    return {
      defaultBatchSize: this.defaultBatchSize,
      defaultDelayMs: this.defaultDelayMs,
      estimatedTimePerProduct: this.defaultDelayMs + 2000, // Rough estimate
    };
  }

  /**
   * Test batch enhancement with a small sample
   */
  async testBatchEnhancement(): Promise<boolean> {
    try {
      const testProducts: BasicProduct[] = [
        {
          name: "Test Robot Kit 1",
          price: 299.99,
          category: "Robotics",
          description: "A basic robotics kit for learning programming",
        },
        {
          name: "Test Puzzle Set 2",
          price: 149.99,
          category: "Puzzles",
          description: "Educational puzzle set for problem solving",
        },
      ];

      const result = await this.enhanceProductsBatch(testProducts);
      return result.summary.successful > 0;
    } catch (error) {
      console.error("Batch enhancement test failed:", error);
      return false;
    }
  }
}
