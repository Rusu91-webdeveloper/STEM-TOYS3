/**
 * Advanced pagination utilities for optimized database queries
 */

import { logger } from "./logger";

export interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page?: number;
    limit: number;
    total?: number;
    totalPages?: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor?: string;
    previousCursor?: string;
    nextPage?: number;
    previousPage?: number;
  };
  meta: {
    queryType: 'offset' | 'cursor';
    executionTime: number;
    itemsCount: number;
  };
}

export interface CursorPaginationConfig {
  cursorField: string;
  direction: 'forward' | 'backward';
  limit: number;
}

/**
 * Enhanced pagination class supporting both offset and cursor-based pagination
 */
export class PaginationBuilder {
  protected options: PaginationOptions;
  private defaultLimit = 20;
  private maxLimit = 100;

  constructor(options: PaginationOptions = {}) {
    this.options = {
      page: options.page || 1,
      limit: Math.min(options.limit || this.defaultLimit, this.maxLimit),
      cursor: options.cursor,
      orderBy: options.orderBy || 'createdAt',
      orderDirection: options.orderDirection || 'desc',
    };
  }

  /**
   * Generate Prisma query options for offset-based pagination
   */
  getOffsetQuery() {
    const { page = 1, limit = this.defaultLimit } = this.options;
    const skip = (page - 1) * limit;

    return {
      take: limit,
      skip,
      orderBy: {
        [this.options.orderBy!]: this.options.orderDirection
      }
    };
  }

  /**
   * Generate Prisma query options for cursor-based pagination
   */
  getCursorQuery(config: CursorPaginationConfig) {
    const { cursor, limit = this.defaultLimit } = this.options;
    const { cursorField, direction } = config;

    const query: any = {
      take: direction === 'forward' ? limit + 1 : -(limit + 1), // +1 to check if there's a next page
      orderBy: {
        [cursorField]: this.options.orderDirection
      }
    };

    if (cursor) {
      query.cursor = { [cursorField]: cursor };
      query.skip = 1; // Skip the cursor item itself
    }

    return query;
  }

  /**
   * Process cursor-based pagination results
   */
  processCursorResults<T extends Record<string, any>>(
    results: T[],
    config: CursorPaginationConfig
  ): { data: T[]; hasNext: boolean; hasPrevious: boolean; nextCursor?: string; previousCursor?: string } {
    const { limit = this.defaultLimit } = this.options;
    const { cursorField } = config;
    
    const hasNext = results.length > limit;
    const data = hasNext ? results.slice(0, limit) : results;
    
    return {
      data,
      hasNext,
      hasPrevious: !!this.options.cursor,
      nextCursor: hasNext ? data[data.length - 1][cursorField] : undefined,
      previousCursor: data.length > 0 ? data[0][cursorField] : undefined
    };
  }

  /**
   * Build complete paginated response
   */
  static buildResponse<T>(
    data: T[],
    options: PaginationOptions,
    total?: number,
    executionTime?: number
  ): PaginatedResult<T> {
    const { page = 1, limit = 20, cursor } = options;
    const queryType = cursor ? 'cursor' : 'offset';
    
    const response: PaginatedResult<T> = {
      data,
      pagination: {
        limit,
        hasNextPage: false,
        hasPreviousPage: false,
      },
      meta: {
        queryType,
        executionTime: executionTime || 0,
        itemsCount: data.length,
      }
    };

    if (queryType === 'offset' && total !== undefined) {
      const totalPages = Math.ceil(total / limit);
      response.pagination = {
        ...response.pagination,
        page,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        nextPage: page < totalPages ? page + 1 : undefined,
        previousPage: page > 1 ? page - 1 : undefined,
      };
    }

    return response;
  }
}

/**
 * Performance-optimized product pagination
 */
export class ProductPagination extends PaginationBuilder {
  constructor(options: PaginationOptions = {}) {
    super(options);
  }

  /**
   * Get optimized product query with smart pagination choice
   */
  getOptimalQuery() {
    const { cursor, page } = this.options;
    
    // Use cursor-based pagination for large datasets or when cursor is provided
    if (cursor || (page && page > 10)) {
      logger.debug('Using cursor-based pagination for products', { cursor, page });
      return {
        type: 'cursor' as const,
        query: this.getCursorQuery({ 
          cursorField: 'id', 
          direction: 'forward',
          limit: this.options.limit || 20
        })
      };
    }

    // Use offset-based pagination for small page numbers
    logger.debug('Using offset-based pagination for products', { page });
    return {
      type: 'offset' as const,
      query: this.getOffsetQuery()
    };
  }

  /**
   * Process product search results with optimized includes
   */
  getProductIncludes(options: {
    includeCategory?: boolean;
    includeImages?: boolean;
    includeReviews?: boolean;
    includeVariants?: boolean;
  } = {}) {
    const includes: any = {};
    
    if (options.includeCategory) {
      includes.category = {
        select: { id: true, name: true, slug: true, image: true }
      };
    }
    
    if (options.includeImages) {
      // Limit images to prevent large payloads
      includes.images = true; // Images are already an array field, no need for complex query
    }
    
    if (options.includeReviews) {
      includes.reviews = {
        take: 5, // Limit reviews for performance
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          rating: true,
          title: true,
          content: true,
          createdAt: true,
          user: {
            select: { name: true, id: true }
          }
        }
      };
    }
    
    return includes;
  }

  /**
   * Optimized product selection fields
   */
  getProductSelect() {
    return {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      compareAtPrice: true,
      images: true,
      categoryId: true,
      tags: true,
      attributes: true,
      isActive: true,
      featured: true,
      stockQuantity: true,
      createdAt: true,
      updatedAt: true,
    };
  }
}

/**
 * Search pagination for complex queries
 */
export class SearchPagination extends PaginationBuilder {
  constructor(options: PaginationOptions = {}) {
    super(options);
  }

  /**
   * Build optimized search where clause
   */
  buildSearchWhere(searchTerm?: string, filters?: {
    categoryId?: string;
    stemCategory?: string;
    priceRange?: { min: number; max: number };
    ageRange?: string;
    inStock?: boolean;
    featured?: boolean;
  }) {
    const where: any = { isActive: true };
    
    if (searchTerm && searchTerm.trim().length > 0) {
      const searchTermLower = searchTerm.toLowerCase().trim();
      where.OR = [
        { name: { contains: searchTermLower, mode: 'insensitive' } },
        { description: { contains: searchTermLower, mode: 'insensitive' } },
        { tags: { hasSome: [searchTermLower] } }
      ];
    }
    
    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }
    
    if (filters?.priceRange) {
      where.price = {
        ...(filters.priceRange.min && { gte: filters.priceRange.min }),
        ...(filters.priceRange.max && { lte: filters.priceRange.max })
      };
    }
    
    if (filters?.inStock) {
      where.stockQuantity = { gt: 0 };
    }
    
    if (filters?.featured) {
      where.featured = true;
    }
    
    return where;
  }
}

/**
 * Utility function for quick pagination setup
 */
export function createPagination(options: PaginationOptions = {}) {
  return new PaginationBuilder(options);
}

/**
 * Utility function for product-specific pagination
 */
export function createProductPagination(options: PaginationOptions = {}) {
  return new ProductPagination(options);
}

/**
 * Utility function for search pagination
 */
export function createSearchPagination(options: PaginationOptions = {}) {
  return new SearchPagination(options);
} 