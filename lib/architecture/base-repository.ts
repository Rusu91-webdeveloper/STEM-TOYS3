import { PrismaClient, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { cache } from "@/lib/cache";
import { ApiError, ApiErrors } from "@/lib/api-error-handler";
import { withPerformanceMonitoring } from "@/lib/performance";

export interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    cursor?: string;
  };
}

export interface QueryOptions {
  cache?: boolean;
  cacheTTL?: number;
  skipPerfMonitoring?: boolean;
}

/**
 * Base repository class providing common database operations
 * Implements the repository pattern with caching, error handling, and performance monitoring
 */
export abstract class BaseRepository<TModel, TCreateInput, TUpdateInput> {
  protected readonly modelName: string;
  protected readonly cachePrefix: string;

  constructor(modelName: string) {
    this.modelName = modelName;
    this.cachePrefix = `repo:${modelName.toLowerCase()}`;
  }

  /**
   * Get the Prisma model delegate
   */
  protected abstract getModel(): any;

  /**
   * Generate cache key for a specific operation
   */
  protected getCacheKey(operation: string, ...params: any[]): string {
    const paramsStr = params.map(p => JSON.stringify(p)).join(":");
    return `${this.cachePrefix}:${operation}:${paramsStr}`;
  }

  /**
   * Execute a database operation with error handling and optional caching
   */
  protected async executeOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    options: QueryOptions = {}
  ): Promise<T> {
    const {
      cache: useCache = false,
      cacheTTL = 300,
      skipPerfMonitoring = false,
    } = options;

    const executeFn = async () => {
      try {
        return await operation();
      } catch (error) {
        logger.error(`Repository operation failed: ${operationName}`, {
          modelName: this.modelName,
          error: error instanceof Error ? error.message : String(error),
        });

        // Convert Prisma errors to API errors
        if (error && typeof error === "object" && "code" in error) {
          const prismaError = error as any;
          switch (prismaError.code) {
            case "P2002":
              throw ApiErrors.conflict(
                "A record with this data already exists"
              );
            case "P2025":
              throw ApiErrors.notFound(this.modelName);
            case "P2003":
              throw ApiErrors.invalidInput(
                "reference",
                "Related record not found"
              );
            default:
              throw ApiErrors.database(operationName);
          }
        }

        throw error;
      }
    };

    if (skipPerfMonitoring) {
      return await executeFn();
    }

    return await withPerformanceMonitoring(
      executeFn,
      `${this.modelName}.${operationName}`
    );
  }

  /**
   * Find a record by ID with optional caching
   */
  async findById(
    id: string,
    options: QueryOptions = {}
  ): Promise<TModel | null> {
    const cacheKey = this.getCacheKey("findById", id);

    if (options.cache) {
      const cached = await cache.get(cacheKey);
      if (cached) return cached;
    }

    const result = await this.executeOperation(
      () => this.getModel().findUnique({ where: { id } }),
      "findById",
      options
    );

    if (options.cache && result) {
      await cache.set(cacheKey, result, options.cacheTTL);
    }

    return result;
  }

  /**
   * Find many records with filtering and pagination
   */
  async findMany(
    where: any = {},
    pagination: PaginationOptions = {},
    options: QueryOptions & { include?: any; orderBy?: any } = {}
  ): Promise<PaginatedResult<TModel>> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const cacheKey = this.getCacheKey("findMany", where, pagination, options);

    if (options.cache) {
      const cached = await cache.get(cacheKey);
      if (cached) return cached;
    }

    const [data, total] = await this.executeOperation(
      () =>
        Promise.all([
          this.getModel().findMany({
            where,
            include: options.include,
            orderBy: options.orderBy,
            skip,
            take: limit,
          }),
          this.getModel().count({ where }),
        ]),
      "findMany",
      options
    );

    const totalPages = Math.ceil(total / limit);
    const result: PaginatedResult<TModel> = {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    if (options.cache) {
      await cache.set(cacheKey, result, options.cacheTTL);
    }

    return result;
  }

  /**
   * Create a new record
   */
  async create(
    data: TCreateInput,
    options: QueryOptions = {}
  ): Promise<TModel> {
    const result = await this.executeOperation(
      () => this.getModel().create({ data }),
      "create",
      options
    );

    // Invalidate related cache entries
    await this.invalidateCache("findMany");
    await this.invalidateCache("count");

    return result;
  }

  /**
   * Update a record by ID
   */
  async update(
    id: string,
    data: TUpdateInput,
    options: QueryOptions = {}
  ): Promise<TModel> {
    const result = await this.executeOperation(
      () => this.getModel().update({ where: { id }, data }),
      "update",
      options
    );

    // Invalidate cache for this record and related queries
    await this.invalidateCache("findById", id);
    await this.invalidateCache("findMany");

    return result;
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string, options: QueryOptions = {}): Promise<TModel> {
    const result = await this.executeOperation(
      () => this.getModel().delete({ where: { id } }),
      "delete",
      options
    );

    // Invalidate cache for this record and related queries
    await this.invalidateCache("findById", id);
    await this.invalidateCache("findMany");
    await this.invalidateCache("count");

    return result;
  }

  /**
   * Count records with optional filtering
   */
  async count(where: any = {}, options: QueryOptions = {}): Promise<number> {
    const cacheKey = this.getCacheKey("count", where);

    if (options.cache) {
      const cached = await cache.get(cacheKey);
      if (cached !== null) return cached;
    }

    const result = await this.executeOperation(
      () => this.getModel().count({ where }),
      "count",
      options
    );

    if (options.cache) {
      await cache.set(cacheKey, result, options.cacheTTL);
    }

    return result;
  }

  /**
   * Check if a record exists
   */
  async exists(where: any, options: QueryOptions = {}): Promise<boolean> {
    const count = await this.count(where, options);
    return count > 0;
  }

  /**
   * Upsert (create or update) a record
   */
  async upsert(
    where: any,
    create: TCreateInput,
    update: TUpdateInput,
    options: QueryOptions = {}
  ): Promise<TModel> {
    const result = await this.executeOperation(
      () => this.getModel().upsert({ where, create, update }),
      "upsert",
      options
    );

    // Invalidate related cache entries
    await this.invalidateCache("findMany");

    return result;
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(
    operations: (tx: PrismaClient) => Promise<T>
  ): Promise<T> {
    return await this.executeOperation(
      () => db.$transaction(operations),
      "transaction"
    );
  }

  /**
   * Invalidate cache entries by pattern
   */
  protected async invalidateCache(
    operation: string,
    ...params: any[]
  ): Promise<void> {
    try {
      if (params.length > 0) {
        const cacheKey = this.getCacheKey(operation, ...params);
        await cache.delete(cacheKey);
      } else {
        // Invalidate all entries for this operation
        const pattern = `${this.cachePrefix}:${operation}:*`;
        await cache.invalidateByPattern(pattern);
      }
    } catch (error) {
      logger.warn("Cache invalidation failed", {
        operation,
        params,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Invalidate all cache entries for this repository
   */
  async invalidateAllCache(): Promise<void> {
    try {
      const pattern = `${this.cachePrefix}:*`;
      await cache.invalidateByPattern(pattern);
    } catch (error) {
      logger.warn("Full cache invalidation failed", {
        modelName: this.modelName,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
