import { Product, Prisma } from "@prisma/client";

import {
  BaseRepository,
  PaginationOptions,
  QueryOptions,
} from "@/lib/architecture/base-repository";
import { cache } from "@/lib/cache";
import { db } from "@/lib/db";

export type ProductWithRelations = Product & {
  category?: any;
  images?: any[];
  reviews?: any[];
  variants?: any[];
};

export interface ProductFilters {
  categoryId?: string;
  categorySlug?: string;
  priceMin?: number;
  priceMax?: number;
  isActive?: boolean;
  featured?: boolean;
  inStock?: boolean;
  search?: string;
  tags?: string[];
}

export interface ProductSearchOptions extends QueryOptions {
  include?: {
    category?: boolean;
    images?: boolean;
    reviews?: boolean;
    variants?: boolean;
    _count?: boolean;
  };
  orderBy?: {
    name?: "asc" | "desc";
    price?: "asc" | "desc";
    createdAt?: "asc" | "desc";
    featured?: "asc" | "desc";
    stockQuantity?: "asc" | "desc";
    averageRating?: "asc" | "desc";
  };
}

export class ProductRepository extends BaseRepository<
  ProductWithRelations,
  Prisma.ProductCreateInput,
  Prisma.ProductUpdateInput
> {
  constructor() {
    super("Product");
  }

  protected getModel() {
    return db.product;
  }

  /**
   * Find products with advanced filtering and search
   */
  findWithFilters(
    filters: ProductFilters = {},
    pagination: PaginationOptions = {},
    options: ProductSearchOptions = {}
  ) {
    const {
      categoryId,
      categorySlug,
      priceMin,
      priceMax,
      isActive = true,
      featured,
      inStock,
      search,
      tags,
    } = filters;

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      isActive,
    };

    // Category filtering
    if (categoryId) {
      where.categoryId = categoryId;
    } else if (categorySlug) {
      where.category = {
        slug: categorySlug,
        isActive: true,
      };
    }

    // Price range filtering
    if (priceMin !== undefined || priceMax !== undefined) {
      where.price = {};
      if (priceMin !== undefined) where.price.gte = priceMin;
      if (priceMax !== undefined) where.price.lte = priceMax;
    }

    // Featured products
    if (featured !== undefined) {
      where.featured = featured;
    }

    // Stock filtering
    if (inStock) {
      where.stockQuantity = { gt: 0 };
    }

    // Search functionality
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search] } },
      ];
    }

    // Tags filtering
    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    return this.findMany(where, pagination, {
      ...options,
      include: {
        category: options.include?.category,
        images: options.include?.images,
        reviews: options.include?.reviews
          ? {
              select: {
                id: true,
                rating: true,
                createdAt: true,
              },
            }
          : false,
        variants: options.include?.variants,
        _count: options.include?._count
          ? {
              select: {
                reviews: true,
                wishlistItems: true,
              },
            }
          : false,
      },
    });
  }

  /**
   * Find products by category
   */
  findByCategory(
    categorySlug: string,
    pagination: PaginationOptions = {},
    options: ProductSearchOptions = {}
  ) {
    return this.findWithFilters({ categorySlug }, pagination, options);
  }

  /**
   * Find featured products
   */
  findFeatured(
    pagination: PaginationOptions = {},
    options: ProductSearchOptions = {}
  ) {
    return this.findWithFilters({ featured: true }, pagination, {
      ...options,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find products with low stock
   */
  findLowStock(
    threshold: number = 10,
    pagination: PaginationOptions = {},
    options: ProductSearchOptions = {}
  ) {
    const where = {
      stockQuantity: { lte: threshold, gt: 0 },
      isActive: true,
    };

    return this.findMany(where, pagination, {
      ...options,
      orderBy: { stockQuantity: "asc" },
    });
  }

  /**
   * Find out of stock products
   */
  findOutOfStock(
    pagination: PaginationOptions = {},
    options: ProductSearchOptions = {}
  ) {
    const where = {
      stockQuantity: { lte: 0 },
      isActive: true,
    };

    return this.findMany(where, pagination, {
      ...options,
      orderBy: { updatedAt: "desc" },
    });
  }

  /**
   * Find related products
   */
  async findRelated(
    productId: string,
    limit: number = 4,
    options: ProductSearchOptions = {}
  ) {
    // Get the product to find related items
    const product = await this.findById(productId);
    if (!product)
      return {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };

    const where: Prisma.ProductWhereInput = {
      id: { not: productId },
      isActive: true,
      OR: [
        { categoryId: product.categoryId },
        { tags: { hasSome: product.tags } },
      ],
    };

    return this.findMany(
      where,
      { limit },
      {
        ...options,
        orderBy: { averageRating: "desc" },
      }
    );
  }

  /**
   * Update stock quantity
   */
  async updateStock(
    productId: string,
    quantity: number,
    operation: "increase" | "decrease" | "set" = "set"
  ) {
    const updateData: Prisma.ProductUpdateInput = {};

    if (operation === "set") {
      updateData.stockQuantity = quantity;
    } else {
      // For increase/decrease, we need to use raw SQL or fetch first
      const product = await this.findById(productId);
      if (!product) throw new Error("Product not found");

      const newQuantity =
        operation === "increase"
          ? (product.stockQuantity || 0) + quantity
          : Math.max(0, (product.stockQuantity || 0) - quantity);

      updateData.stockQuantity = newQuantity;
    }

    return this.update(productId, updateData);
  }

  /**
   * Find product by SKU
   */
  async findBySku(sku: string, options: ProductSearchOptions = {}) {
    const cacheKey = this.getCacheKey("findBySku", sku);

    if (options.cache) {
      const cached = await cache.get(cacheKey);
      if (cached) return cached;
    }

    const result = await this.executeOperation(
      () =>
        this.getModel().findUnique({
          where: { sku },
          include: options.include,
        }),
      "findBySku",
      options
    );

    if (options.cache && result) {
      await cache.set(cacheKey, result, options.cacheTTL);
    }

    return result;
  }

  /**
   * Find product by slug
   */
  async findBySlug(slug: string, options: ProductSearchOptions = {}) {
    const cacheKey = this.getCacheKey("findBySlug", slug);

    if (options.cache) {
      const cached = await cache.get(cacheKey);
      if (cached) return cached;
    }

    const result = await this.executeOperation(
      () =>
        this.getModel().findUnique({
          where: { slug },
          include: options.include,
        }),
      "findBySlug",
      options
    );

    if (options.cache && result) {
      await cache.set(cacheKey, result, options.cacheTTL);
    }

    return result;
  }

  /**
   * Get product statistics
   */
  async getStats(options: QueryOptions = {}) {
    const cacheKey = this.getCacheKey("getStats");

    if (options.cache) {
      const cached = await cache.get(cacheKey);
      if (cached) return cached;
    }

    const result = await this.executeOperation(
      async () => {
        const [
          totalProducts,
          activeProducts,
          featuredProducts,
          outOfStockProducts,
          lowStockProducts,
          averagePrice,
        ] = await Promise.all([
          db.product.count(),
          db.product.count({ where: { isActive: true } }),
          db.product.count({ where: { featured: true, isActive: true } }),
          db.product.count({
            where: { stockQuantity: { lte: 0 }, isActive: true },
          }),
          db.product.count({
            where: { stockQuantity: { lte: 10, gt: 0 }, isActive: true },
          }),
          db.product.aggregate({
            where: { isActive: true },
            _avg: { price: true },
          }),
        ]);

        return {
          totalProducts,
          activeProducts,
          featuredProducts,
          outOfStockProducts,
          lowStockProducts,
          averagePrice: averagePrice._avg.price || 0,
        };
      },
      "getStats",
      options
    );

    if (options.cache) {
      await cache.set(cacheKey, result, options.cacheTTL || 600); // Cache for 10 minutes
    }

    return result;
  }
}
