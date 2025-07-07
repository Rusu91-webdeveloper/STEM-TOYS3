import { User, Prisma, Role } from "@prisma/client";

import {
  BaseRepository,
  PaginationOptions,
  QueryOptions,
} from "@/lib/architecture/base-repository";
import { cache } from "@/lib/cache";
import { db } from "@/lib/db";

export type UserWithRelations = User & {
  addresses?: any[];
  orders?: any[];
  paymentCards?: any[];
  wishlistItems?: any[];
  reviews?: any[];
  _count?: {
    orders?: number;
    addresses?: number;
    reviews?: number;
    wishlistItems?: number;
  };
};

export interface UserFilters {
  role?: Role;
  isActive?: boolean;
  emailVerified?: boolean;
  search?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface UserSearchOptions extends QueryOptions {
  include?: {
    addresses?: boolean;
    orders?: boolean;
    paymentCards?: boolean;
    wishlistItems?: boolean;
    reviews?: boolean;
    _count?: boolean;
  };
  orderBy?: {
    name?: "asc" | "desc";
    email?: "asc" | "desc";
    createdAt?: "asc" | "desc";
    updatedAt?: "asc" | "desc";
  };
}

export class UserRepository extends BaseRepository<
  UserWithRelations,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput
> {
  constructor() {
    super("User");
  }

  protected getModel() {
    return db.user;
  }

  /**
   * Find user by email
   */
  async findByEmail(
    email: string,
    options: UserSearchOptions = {}
  ): Promise<UserWithRelations | null> {
    const cacheKey = this.getCacheKey("findByEmail", email);

    if (options.cache) {
      const cached = await cache.get(cacheKey);
      if (cached) return cached;
    }

    const result = await this.executeOperation(
      () =>
        this.getModel().findUnique({
          where: { email },
          include: options.include,
        }),
      "findByEmail",
      options
    );

    if (options.cache && result) {
      await cache.set(cacheKey, result, options.cacheTTL);
    }

    return result;
  }

  /**
   * Find users with advanced filtering
   */
  async findWithFilters(
    filters: UserFilters = {},
    pagination: PaginationOptions = {},
    options: UserSearchOptions = {}
  ) {
    const {
      role,
      isActive,
      emailVerified,
      search,
      createdAfter,
      createdBefore,
    } = filters;

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (emailVerified !== undefined) {
      if (emailVerified) {
        where.emailVerified = { not: null };
      } else {
        where.emailVerified = null;
      }
    }

    // Date range filtering
    if (createdAfter || createdBefore) {
      where.createdAt = {};
      if (createdAfter) where.createdAt.gte = createdAfter;
      if (createdBefore) where.createdAt.lte = createdBefore;
    }

    // Search functionality
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    return await this.findMany(where, pagination, {
      ...options,
      include: {
        addresses: options.include?.addresses,
        orders: options.include?.orders
          ? {
              select: {
                id: true,
                orderNumber: true,
                total: true,
                status: true,
                createdAt: true,
              },
            }
          : false,
        paymentCards: options.include?.paymentCards
          ? {
              select: {
                id: true,
                cardholderName: true,
                lastFourDigits: true,
                cardType: true,
                isDefault: true,
              },
            }
          : false,
        wishlistItems: options.include?.wishlistItems,
        reviews: options.include?.reviews,
        _count: options.include?._count
          ? {
              select: {
                orders: true,
                addresses: true,
                reviews: true,
                wishlistItems: true,
              },
            }
          : false,
      },
    });
  }

  /**
   * Find customers only
   */
  async findCustomers(
    pagination: PaginationOptions = {},
    options: UserSearchOptions = {}
  ) {
    return await this.findWithFilters(
      { role: "CUSTOMER" },
      pagination,
      options
    );
  }

  /**
   * Find admins only
   */
  async findAdmins(
    pagination: PaginationOptions = {},
    options: UserSearchOptions = {}
  ) {
    return await this.findWithFilters({ role: "ADMIN" }, pagination, options);
  }

  /**
   * Find unverified users
   */
  async findUnverified(
    pagination: PaginationOptions = {},
    options: UserSearchOptions = {}
  ) {
    return await this.findWithFilters({ emailVerified: false }, pagination, {
      ...options,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find inactive users
   */
  async findInactive(
    pagination: PaginationOptions = {},
    options: UserSearchOptions = {}
  ) {
    return await this.findWithFilters({ isActive: false }, pagination, {
      ...options,
      orderBy: { updatedAt: "desc" },
    });
  }

  /**
   * Verify user email
   */
  async verifyEmail(userId: string, verificationToken?: string) {
    const updateData: Prisma.UserUpdateInput = {
      emailVerified: new Date(),
      verificationToken: null,
      isActive: true,
    };

    // If verification token provided, verify it matches
    if (verificationToken) {
      const user = await this.findById(userId);
      if (!user || user.verificationToken !== verificationToken) {
        throw new Error("Invalid verification token");
      }
    }

    return await this.update(userId, updateData);
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, hashedPassword: string) {
    return await this.update(userId, { password: hashedPassword });
  }

  /**
   * Set password reset token
   */
  async setPasswordResetToken(userId: string, token: string, expires: Date) {
    // Create password reset token record
    await db.passwordResetToken.create({
      data: {
        email: (await this.findById(userId))?.email || "",
        token,
        expires,
      },
    });

    return true;
  }

  /**
   * Get user by verification token
   */
  async findByVerificationToken(
    token: string,
    options: UserSearchOptions = {}
  ) {
    const cacheKey = this.getCacheKey("findByVerificationToken", token);

    if (options.cache) {
      const cached = await cache.get(cacheKey);
      if (cached) return cached;
    }

    const result = await this.executeOperation(
      () =>
        this.getModel().findFirst({
          where: { verificationToken: token },
          include: options.include,
        }),
      "findByVerificationToken",
      options
    );

    if (options.cache && result) {
      await cache.set(cacheKey, result, options.cacheTTL);
    }

    return result;
  }

  /**
   * Get user statistics
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
          totalUsers,
          activeUsers,
          customers,
          admins,
          verifiedUsers,
          unverifiedUsers,
          newUsersThisMonth,
        ] = await Promise.all([
          db.user.count(),
          db.user.count({ where: { isActive: true } }),
          db.user.count({ where: { role: "CUSTOMER" } }),
          db.user.count({ where: { role: "ADMIN" } }),
          db.user.count({ where: { emailVerified: { not: null } } }),
          db.user.count({ where: { emailVerified: null } }),
          db.user.count({
            where: {
              createdAt: {
                gte: new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  1
                ),
              },
            },
          }),
        ]);

        return {
          totalUsers,
          activeUsers,
          customers,
          admins,
          verifiedUsers,
          unverifiedUsers,
          newUsersThisMonth,
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

  /**
   * Get user activity summary
   */
  async getUserActivity(userId: string, options: QueryOptions = {}) {
    const cacheKey = this.getCacheKey("getUserActivity", userId);

    if (options.cache) {
      const cached = await cache.get(cacheKey);
      if (cached) return cached;
    }

    const result = await this.executeOperation(
      async () => {
        const [user, orderStats, reviewStats, wishlistStats] =
          await Promise.all([
            db.user.findUnique({
              where: { id: userId },
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                updatedAt: true,
              },
            }),
            db.order.aggregate({
              where: { userId },
              _count: true,
              _sum: { total: true },
            }),
            db.review.aggregate({
              where: { userId },
              _count: true,
              _avg: { rating: true },
            }),
            db.wishlist.count({ where: { userId } }),
          ]);

        return {
          user,
          orders: {
            count: orderStats._count,
            totalSpent: orderStats._sum.total || 0,
          },
          reviews: {
            count: reviewStats._count,
            averageRating: reviewStats._avg.rating || 0,
          },
          wishlistItems: wishlistStats,
        };
      },
      "getUserActivity",
      options
    );

    if (options.cache) {
      await cache.set(cacheKey, result, options.cacheTTL || 300); // Cache for 5 minutes
    }

    return result;
  }
}
