/**
 * AI Memory Optimization Service
 * Optimizes memory usage for large batch processing
 */

import { BasicProduct, EnhancedProduct, EnhancementResult } from "./types";
import { aiCache } from "./cache";

export interface MemoryConfig {
  maxBatchSize: number;
  maxMemoryUsage: number; // in MB
  chunkSize: number;
  gcThreshold: number; // in MB
  streamThreshold: number; // in MB
}

export interface MemoryStats {
  usedMemory: number; // in MB
  totalMemory: number; // in MB
  freeMemory: number; // in MB
  memoryUsagePercent: number;
  heapUsed: number; // in MB
  heapTotal: number; // in MB
  external: number; // in MB
  arrayBuffers: number; // in MB
}

export interface BatchProcessingConfig {
  maxConcurrentChunks: number;
  chunkSize: number;
  memoryLimit: number; // in MB
  enableStreaming: boolean;
  enableCompression: boolean;
  enableDeduplication: boolean;
}

/**
 * Default memory configurations
 */
export const DEFAULT_MEMORY_CONFIGS: Record<string, MemoryConfig> = {
  openai: {
    maxBatchSize: 50,
    maxMemoryUsage: 512, // 512 MB
    chunkSize: 10,
    gcThreshold: 400, // 400 MB
    streamThreshold: 256, // 256 MB
  },
  anthropic: {
    maxBatchSize: 40,
    maxMemoryUsage: 512, // 512 MB
    chunkSize: 8,
    gcThreshold: 400, // 400 MB
    streamThreshold: 256, // 256 MB
  },
  gemini: {
    maxBatchSize: 60,
    maxMemoryUsage: 768, // 768 MB
    chunkSize: 12,
    gcThreshold: 600, // 600 MB
    streamThreshold: 384, // 384 MB
  },
};

/**
 * AI Memory Optimization Service
 */
export class AIMemoryOptimizer {
  private configs: Map<string, MemoryConfig> = new Map();
  private processingConfigs: Map<string, BatchProcessingConfig> = new Map();
  private memoryStats: MemoryStats | null = null;

  constructor() {
    // Initialize with default configurations
    Object.entries(DEFAULT_MEMORY_CONFIGS).forEach(([provider, config]) => {
      this.configs.set(provider, config);
    });
  }

  /**
   * Set memory configuration for a provider
   */
  setMemoryConfig(provider: string, config: MemoryConfig): void {
    this.configs.set(provider, config);
  }

  /**
   * Set batch processing configuration
   */
  setBatchProcessingConfig(
    provider: string,
    config: BatchProcessingConfig
  ): void {
    this.processingConfigs.set(provider, config);
  }

  /**
   * Get current memory statistics
   */
  getMemoryStats(): MemoryStats {
    const memUsage = process.memoryUsage();

    this.memoryStats = {
      usedMemory: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100,
      totalMemory: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100,
      freeMemory:
        Math.round(
          ((memUsage.heapTotal - memUsage.heapUsed) / 1024 / 1024) * 100
        ) / 100,
      memoryUsagePercent:
        Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100 * 100) / 100,
      heapUsed: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotal: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100,
      external: Math.round((memUsage.external / 1024 / 1024) * 100) / 100,
      arrayBuffers:
        Math.round((memUsage.arrayBuffers / 1024 / 1024) * 100) / 100,
    };

    return this.memoryStats;
  }

  /**
   * Check if memory usage is within limits
   */
  isMemoryUsageOk(provider: string): boolean {
    const config = this.configs.get(provider);
    if (!config) return true;

    const stats = this.getMemoryStats();
    return stats.usedMemory < config.maxMemoryUsage;
  }

  /**
   * Check if garbage collection is needed
   */
  shouldTriggerGC(provider: string): boolean {
    const config = this.configs.get(provider);
    if (!config) return false;

    const stats = this.getMemoryStats();
    return stats.usedMemory > config.gcThreshold;
  }

  /**
   * Check if streaming should be enabled
   */
  shouldEnableStreaming(provider: string): boolean {
    const config = this.configs.get(provider);
    if (!config) return false;

    const stats = this.getMemoryStats();
    return stats.usedMemory > config.streamThreshold;
  }

  /**
   * Process products in optimized chunks
   */
  async processProductsInChunks<T>(
    provider: string,
    products: BasicProduct[],
    processor: (chunk: BasicProduct[]) => Promise<T[]>,
    options?: {
      onProgress?: (progress: {
        processed: number;
        total: number;
        chunk: number;
        totalChunks: number;
      }) => void;
      onChunkComplete?: (chunk: number, results: T[]) => void;
    }
  ): Promise<T[]> {
    const config = this.configs.get(provider);
    if (!config) {
      throw new Error(
        `No memory configuration found for provider: ${provider}`
      );
    }

    // Use smaller chunk size to prevent memory issues
    const chunkSize = Math.min(
      5,
      this.calculateOptimalChunkSize(provider, products.length)
    );
    const chunks = this.createChunks(products, chunkSize);
    const results: T[] = [];

    console.log(
      `Processing ${products.length} products in ${chunks.length} chunks of size ${chunkSize}`
    );

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      try {
        // Check memory before processing chunk
        const memoryStats = this.getMemoryStats();
        if (memoryStats.usedMemory > 1000) {
          // 1GB limit
          console.warn(
            `Memory usage high (${memoryStats.usedMemory}MB), triggering GC before chunk ${i + 1}`
          );
          await this.triggerGC();
        }

        // Process chunk
        const chunkResults = await processor(chunk);
        results.push(...chunkResults);

        // Call progress callback
        if (options?.onProgress) {
          options.onProgress({
            processed: Math.min((i + 1) * chunkSize, products.length),
            total: products.length,
            chunk: i + 1,
            totalChunks: chunks.length,
          });
        }

        // Call chunk complete callback
        if (options?.onChunkComplete) {
          options.onChunkComplete(i + 1, chunkResults);
        }

        // Clear chunk from memory
        this.clearChunkFromMemory(chunk);

        // Longer delay to allow GC and prevent memory buildup
        await this.sleep(500);
      } catch (error) {
        console.error(`Error processing chunk ${i + 1}:`, error);
        throw error;
      }
    }

    return results;
  }

  /**
   * Stream process products for very large batches
   */
  async streamProcessProducts<T>(
    provider: string,
    products: BasicProduct[],
    processor: (chunk: BasicProduct[]) => Promise<T[]>,
    options?: {
      onProgress?: (progress: { processed: number; total: number }) => void;
      onChunkComplete?: (chunk: number, results: T[]) => void;
    }
  ): Promise<T[]> {
    const config = this.configs.get(provider);
    if (!config) {
      throw new Error(
        `No memory configuration found for provider: ${provider}`
      );
    }

    const chunkSize = Math.min(config.chunkSize, 5); // Smaller chunks for streaming
    const results: T[] = [];

    console.log(
      `Streaming ${products.length} products in chunks of size ${chunkSize}`
    );

    for (let i = 0; i < products.length; i += chunkSize) {
      const chunk = products.slice(i, i + chunkSize);

      try {
        // Process chunk
        const chunkResults = await processor(chunk);
        results.push(...chunkResults);

        // Call progress callback
        if (options?.onProgress) {
          options.onProgress({
            processed: Math.min(i + chunkSize, products.length),
            total: products.length,
          });
        }

        // Call chunk complete callback
        if (options?.onChunkComplete) {
          options.onChunkComplete(Math.floor(i / chunkSize) + 1, chunkResults);
        }

        // Clear chunk from memory
        this.clearChunkFromMemory(chunk);

        // Force GC after each chunk
        await this.triggerGC();

        // Longer delay for streaming
        await this.sleep(500);
      } catch (error) {
        console.error(
          `Error processing stream chunk ${Math.floor(i / chunkSize) + 1}:`,
          error
        );
        throw error;
      }
    }

    return results;
  }

  /**
   * Deduplicate products to reduce memory usage
   */
  deduplicateProducts(products: BasicProduct[]): BasicProduct[] {
    const seen = new Set<string>();
    const deduplicated: BasicProduct[] = [];

    for (const product of products) {
      const key = this.generateProductKey(product);
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(product);
      }
    }

    console.log(
      `Deduplicated ${products.length} products to ${deduplicated.length} unique products`
    );
    return deduplicated;
  }

  /**
   * Compress product data to reduce memory usage
   */
  compressProductData(products: BasicProduct[]): BasicProduct[] {
    return products.map(product => ({
      ...product,
      // Remove unnecessary fields
      images: product.images?.slice(0, 3), // Keep only first 3 images
      description: product.description?.substring(0, 500), // Truncate description
      tags: product.tags?.slice(0, 10), // Keep only first 10 tags
    }));
  }

  /**
   * Calculate optimal chunk size based on memory usage
   */
  calculateOptimalChunkSize(provider: string, totalProducts: number): number {
    const config = this.configs.get(provider);
    if (!config) return 10;

    const stats = this.getMemoryStats();
    const availableMemory = config.maxMemoryUsage - stats.usedMemory;

    // Estimate memory per product (rough estimate)
    const estimatedMemoryPerProduct = 0.5; // MB
    const maxChunkSize = Math.floor(
      availableMemory / estimatedMemoryPerProduct
    );

    // Use the smaller of config chunk size, max chunk size, or total products
    return Math.min(config.chunkSize, maxChunkSize, totalProducts);
  }

  /**
   * Create chunks from products array
   */
  private createChunks<T>(items: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];

    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }

    return chunks;
  }

  /**
   * Clear chunk from memory
   */
  private clearChunkFromMemory(chunk: any[]): void {
    // Clear array safely
    if (Array.isArray(chunk)) {
      chunk.length = 0;
    }

    // Don't try to clear individual items as they might be frozen
    // Let garbage collection handle the cleanup
  }

  /**
   * Trigger garbage collection
   */
  private async triggerGC(): Promise<void> {
    if (global.gc) {
      global.gc();
      console.log("Garbage collection triggered");
    } else {
      console.warn(
        "Garbage collection not available. Run with --expose-gc flag"
      );
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate product key for deduplication
   */
  private generateProductKey(product: BasicProduct): string {
    return `${product.name.toLowerCase().trim()}_${product.category.toLowerCase().trim()}_${product.price}`;
  }

  /**
   * Get memory optimization recommendations
   */
  getMemoryOptimizationRecommendations(provider: string): string[] {
    const config = this.configs.get(provider);
    if (!config) return [];

    const stats = this.getMemoryStats();
    const recommendations: string[] = [];

    if (stats.memoryUsagePercent > 80) {
      recommendations.push(
        "High memory usage detected. Consider reducing batch size or enabling streaming."
      );
    }

    if (stats.memoryUsagePercent > 90) {
      recommendations.push(
        "Critical memory usage. Enable streaming mode and reduce chunk size."
      );
    }

    if (stats.usedMemory > config.gcThreshold) {
      recommendations.push(
        "Memory usage above GC threshold. Garbage collection will be triggered more frequently."
      );
    }

    if (stats.usedMemory > config.streamThreshold) {
      recommendations.push(
        "Memory usage above streaming threshold. Consider enabling streaming mode."
      );
    }

    return recommendations;
  }

  /**
   * Monitor memory usage during processing
   */
  async monitorMemoryUsage(
    provider: string,
    operation: () => Promise<void>,
    options?: {
      onMemoryCheck?: (stats: MemoryStats) => void;
      memoryCheckInterval?: number; // in milliseconds
    }
  ): Promise<void> {
    const interval = options?.memoryCheckInterval || 1000;
    const config = this.configs.get(provider);

    if (!config) {
      throw new Error(
        `No memory configuration found for provider: ${provider}`
      );
    }

    // Start memory monitoring
    const monitoringInterval = setInterval(() => {
      const stats = this.getMemoryStats();

      if (options?.onMemoryCheck) {
        options.onMemoryCheck(stats);
      }

      // Check if memory usage is too high
      if (stats.usedMemory > config.maxMemoryUsage) {
        console.warn(
          `Memory usage exceeded limit: ${stats.usedMemory}MB > ${config.maxMemoryUsage}MB`
        );
      }
    }, interval);

    try {
      await operation();
    } finally {
      clearInterval(monitoringInterval);
    }
  }
}

// Export singleton instance
export const aiMemoryOptimizer = new AIMemoryOptimizer();

/**
 * Memory optimization decorator
 */
export function withMemoryOptimization(provider: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const products = args[0]?.products || args[0];

      if (Array.isArray(products) && products.length > 0) {
        // Check if memory optimization is needed
        if (aiMemoryOptimizer.shouldEnableStreaming(provider)) {
          console.log("Enabling streaming mode due to high memory usage");
          return aiMemoryOptimizer.streamProcessProducts(
            provider,
            products,
            chunk => method.apply(this, [{ ...args[0], products: chunk }])
          );
        } else if (products.length > 20) {
          console.log("Enabling chunked processing for large batch");
          return aiMemoryOptimizer.processProductsInChunks(
            provider,
            products,
            chunk => method.apply(this, [{ ...args[0], products: chunk }])
          );
        }
      }

      // Process normally if no optimization needed
      return method.apply(this, args);
    };

    return descriptor;
  };
}
