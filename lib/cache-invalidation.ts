/**
 * Comprehensive cache invalidation strategies for the STEM-TOYS2 application
 */

import { cache, invalidateCachePattern, CacheKeys } from "./cache";
import { logger } from "./logger";

// Define cache invalidation patterns for different entity types
export const InvalidationPatterns = {
  product: {
    // When a product changes, invalidate:
    patterns: [
      'product:*',      // All individual product caches
      'products:*',     // All product list caches
      'category:*',     // Category caches (may include product counts)
      'health:*'        // Health check might include product stats
    ],
    cascade: true // Also invalidate related entities
  },
  
  category: {
    patterns: [
      'category:*',
      'products:*',     // Product lists filtered by category
      'health:*'
    ],
    cascade: true
  },
  
  user: {
    patterns: [
      'user:*',
      'cart:*',         // User's cart data
      'order:*'         // User's orders
    ],
    cascade: false // Don't cascade to other users
  },
  
  order: {
    patterns: [
      'order:*',
      'user:*',         // User profile might show recent orders
      'health:*'        // Health check might include order stats
    ],
    cascade: false
  },
  
  cart: {
    patterns: [
      'cart:*'
    ],
    cascade: false
  },
  
  book: {
    patterns: [
      'book:*',
      'products:*',     // Books might appear in product lists
      'health:*'
    ],
    cascade: true
  }
};

// Cache invalidation manager
export class CacheInvalidationManager {
  private invalidationQueue: Array<{
    pattern: string;
    reason: string;
    timestamp: number;
    entity?: string;
  }> = [];

  private stats = {
    manualInvalidations: 0,
    automaticInvalidations: 0,
    patternInvalidations: 0,
    errorCount: 0
  };

  /**
   * Invalidate cache for a specific entity by ID
   */
  async invalidateEntity(entityType: keyof typeof InvalidationPatterns, id: string, reason = 'manual'): Promise<void> {
    try {
      const config = InvalidationPatterns[entityType];
      
      if (!config) {
        logger.warn(`Unknown entity type for cache invalidation: ${entityType}`);
        return;
      }

      // Invalidate the specific entity
      const entityKey = this.getEntityKey(entityType, id);
      await cache.delete(entityKey);
      
      logger.info(`Cache invalidated for ${entityType}:${id}`, { reason, entityType, id });

      // Invalidate related patterns if cascade is enabled
      if (config.cascade) {
        await this.invalidatePatterns(config.patterns, `${entityType}:${id} cascade`);
      }

      this.stats.manualInvalidations++;
      
      this.addToQueue({
        pattern: entityKey,
        reason,
        timestamp: Date.now(),
        entity: `${entityType}:${id}`
      });

    } catch (error) {
      this.stats.errorCount++;
      logger.error(`Failed to invalidate cache for ${entityType}:${id}`, { error, entityType, id });
    }
  }

  /**
   * Invalidate multiple cache patterns
   */
  async invalidatePatterns(patterns: string[], reason = 'pattern'): Promise<void> {
    try {
      for (const pattern of patterns) {
        await invalidateCachePattern(pattern);
        
        this.addToQueue({
          pattern,
          reason,
          timestamp: Date.now()
        });
      }

      this.stats.patternInvalidations++;
      logger.info(`Cache patterns invalidated`, { patterns, reason });

    } catch (error) {
      this.stats.errorCount++;
      logger.error(`Failed to invalidate cache patterns`, { error, patterns });
    }
  }

  /**
   * Smart invalidation based on entity relationships
   */
  async smartInvalidate(data: {
    entityType: keyof typeof InvalidationPatterns;
    id: string;
    action: 'create' | 'update' | 'delete';
    affectedFields?: string[];
  }): Promise<void> {
    const { entityType, id, action, affectedFields } = data;
    
    try {
      // Always invalidate the specific entity
      await this.invalidateEntity(entityType, id, `smart:${action}`);

      // Additional invalidations based on action and fields
      if (action === 'delete') {
        // On delete, also invalidate any lists that might contain this item
        await this.invalidatePatterns([
          `${entityType}s:*`, // Plural form for lists
          'health:*'
        ], `smart:${action}:delete`);
      }

      if (action === 'create') {
        // On create, invalidate lists and counts
        await this.invalidatePatterns([
          `${entityType}s:*`,
          'health:*'
        ], `smart:${action}:create`);
      }

      if (action === 'update' && affectedFields) {
        // On update, be more selective about what to invalidate
        if (this.hasListAffectingFields(entityType, affectedFields)) {
          await this.invalidatePatterns([
            `${entityType}s:*`
          ], `smart:${action}:list-affecting`);
        }
      }

      this.stats.automaticInvalidations++;

    } catch (error) {
      this.stats.errorCount++;
      logger.error(`Smart invalidation failed`, { error, data });
    }
  }

  /**
   * Invalidate all caches (nuclear option)
   */
  async invalidateAll(reason = 'manual-all'): Promise<void> {
    try {
      await cache.clear();
      
      this.addToQueue({
        pattern: '*',
        reason,
        timestamp: Date.now()
      });

      logger.warn('All caches invalidated', { reason });
      this.stats.manualInvalidations++;

    } catch (error) {
      this.stats.errorCount++;
      logger.error('Failed to invalidate all caches', { error });
    }
  }

  /**
   * Invalidate expired caches (cleanup)
   */
  async cleanupExpired(): Promise<void> {
    try {
      // This is handled automatically by the cache system
      // But we can trigger a manual cleanup here if needed
      logger.debug('Cache cleanup triggered');
    } catch (error) {
      logger.error('Cache cleanup failed', { error });
    }
  }

  /**
   * Get cache invalidation statistics
   */
  getStats() {
    return {
      ...this.stats,
      queueSize: this.invalidationQueue.length,
      recentInvalidations: this.invalidationQueue.slice(-10) // Last 10 invalidations
    };
  }

  /**
   * Clear invalidation history
   */
  clearHistory(): void {
    this.invalidationQueue = [];
    this.stats = {
      manualInvalidations: 0,
      automaticInvalidations: 0,
      patternInvalidations: 0,
      errorCount: 0
    };
  }

  private getEntityKey(entityType: string, id: string): string {
    switch (entityType) {
      case 'product':
        return CacheKeys.product(id);
      case 'category':
        return CacheKeys.category(id);
      case 'user':
        return CacheKeys.user(id);
      case 'cart':
        return CacheKeys.cart(id);
      case 'order':
        return CacheKeys.order(id);
      case 'book':
        return CacheKeys.book(id);
      default:
        return `${entityType}:${id}`;
    }
  }

  private hasListAffectingFields(entityType: string, fields: string[]): boolean {
    // Define which fields affect list views and need broader invalidation
    const listAffectingFields: Record<string, string[]> = {
      product: ['name', 'price', 'isActive', 'featured', 'categoryId', 'stockQuantity'],
      category: ['name', 'slug', 'isActive', 'parentId'],
      book: ['name', 'price', 'isActive', 'isDigital'],
      user: ['name', 'email', 'isActive'],
      order: ['status', 'total', 'userId']
    };

    const affectingFields = listAffectingFields[entityType] || [];
    return fields.some(field => affectingFields.includes(field));
  }

  private addToQueue(item: {
    pattern: string;
    reason: string;
    timestamp: number;
    entity?: string;
  }): void {
    this.invalidationQueue.push(item);
    
    // Keep only last 100 entries to prevent memory issues
    if (this.invalidationQueue.length > 100) {
      this.invalidationQueue = this.invalidationQueue.slice(-100);
    }
  }
}

// Create singleton instance
export const cacheInvalidation = new CacheInvalidationManager();

// Convenience functions for common invalidation patterns
export async function invalidateProduct(id: string, reason?: string): Promise<void> {
  await cacheInvalidation.invalidateEntity('product', id, reason);
}

export async function invalidateCategory(id: string, reason?: string): Promise<void> {
  await cacheInvalidation.invalidateEntity('category', id, reason);
}

export async function invalidateUser(id: string, reason?: string): Promise<void> {
  await cacheInvalidation.invalidateEntity('user', id, reason);
}

export async function invalidateCart(userId: string, reason?: string): Promise<void> {
  await cacheInvalidation.invalidateEntity('cart', userId, reason);
}

export async function invalidateOrder(id: string, reason?: string): Promise<void> {
  await cacheInvalidation.invalidateEntity('order', id, reason);
}

export async function invalidateBook(id: string, reason?: string): Promise<void> {
  await cacheInvalidation.invalidateEntity('book', id, reason);
}

// Smart invalidation helpers
export async function onProductUpdate(id: string, affectedFields: string[]): Promise<void> {
  await cacheInvalidation.smartInvalidate({
    entityType: 'product',
    id,
    action: 'update',
    affectedFields
  });
}

export async function onProductCreate(id: string): Promise<void> {
  await cacheInvalidation.smartInvalidate({
    entityType: 'product',
    id,
    action: 'create'
  });
}

export async function onProductDelete(id: string): Promise<void> {
  await cacheInvalidation.smartInvalidate({
    entityType: 'product',
    id,
    action: 'delete'
  });
}

// Batch invalidation for multiple entities
export async function invalidateMultiple(entities: Array<{
  type: keyof typeof InvalidationPatterns;
  id: string;
  reason?: string;
}>): Promise<void> {
  const promises = entities.map(entity => 
    cacheInvalidation.invalidateEntity(entity.type, entity.id, entity.reason)
  );
  
  await Promise.all(promises);
}

// Schedule automatic cleanup
setInterval(async () => {
  await cacheInvalidation.cleanupExpired();
}, 15 * 60 * 1000); // Every 15 minutes 