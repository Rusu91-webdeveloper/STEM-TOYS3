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
  findByEmail(
    email: string,
    options: UserSearchOptions = {}
  ): Promise<UserWithRelations | null> {
    const cacheKey = this.getCacheKey("findByEmail", email);

    if (options.cache) {
      const cached = cache.get(cacheKey);
      if (cached) return cached;
    }

    const result = this.executeOperation(
      () =>
        this.getModel().findUnique({
          where: { email },
          include: options.include,
        }),
      "findByEmail",
      options
    );

    if (options.cache && result) {
      cache.set(cacheKey, result, options.cacheTTL);
    }

    return result;
  }

  /**
   * Find users with advanced filtering
   */
  findWithFilters(
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

    return this.findMany(where, pagination, {
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
  findCustomers(
    pagination: PaginationOptions = {},
    options: UserSearchOptions = {}
  ) {
    return this.findWithFilters({ role: "CUSTOMER" }, pagination, options);
  }

  /**
   * Find admins only
   */
  findAdmins(
    pagination: PaginationOptions = {},
    options: UserSearchOptions = {}
  ) {
    return this.findWithFilters({ role: "ADMIN" }, pagination, options);
  }

  /**
   * Find unverified users
   */
  findUnverified(
    pagination: PaginationOptions = {},
    options: UserSearchOptions = {}
  ) {
    return this.findWithFilters({ emailVerified: false }, pagination, {
      ...options,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find inactive users
   */
  findInactive(
    pagination: PaginationOptions = {},
    options: UserSearchOptions = {}
  ) {
    return this.findWithFilters({ isActive: false }, pagination, {
      ...options,
      orderBy: { updatedAt: "desc" },
    });
  }

  /**
   * Verify user email
   */
  verifyEmail(userId: string, verificationToken?: string) {
    const updateData: Prisma.UserUpdateInput = {
      emailVerified: new Date(),
      verificationToken: null,
      isActive: true,
    };

    // If verification token provided, verify it matches
    if (verificationToken) {
      const user = this.findById(userId);
      if (!user || user.verificationToken !== verificationToken) {
        throw new Error("Invalid verification token");
      }
    }

    return this.update(userId, updateData);
  }

  /**
   * Update user password
   */
  updatePassword(userId: string, hashedPassword: string) {
    return this.update(userId, { password: hashedPassword });
  }

  /**
   * Set password reset token
   */
  setPasswordResetToken(userId: string, token: string, expires: Date) {
    // Create password reset token record
    db.passwordResetToken.create({
      data: {
        email: this.findById(userId)?.email || "",
        token,
        expires,
      },
    });

    return true;
  }

  /**
   * Get user by verification token
   */
  findByVerificationToken(
    token: string,
    options: UserSearchOptions = {}
  ): Promise<UserWithRelations | null> {
    const cacheKey = this.getCacheKey("findByVerificationToken", token);

    if (options.cache) {
      const cached = cache.get(cacheKey);
      if (cached) return cached;
    }

    const result = this.executeOperation(
      () =>
        this.getModel().findFirst({
          where: { verificationToken: token },
          include: options.include,
        }),
      "findByVerificationToken",
      options
    );

    if (options.cache && result) {
      cache.set(cacheKey, result, options.cacheTTL);
    }

    return result;
  }

  /**
   * Get user statistics
   */
  getStats(options: QueryOptions = {}) {
    const cacheKey = this.getCacheKey("getStats");

    if (options.cache) {
      const cached = cache.get(cacheKey);
      if (cached) return cached;
    }

    const result = this.executeOperation(
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
      cache.set(cacheKey, result, options.cacheTTL || 600); // Cache for 10 minutes
    }

    return result;
  }

  /**
   * Get user activity summary
   */
  getUserActivity(userId: string, options: QueryOptions = {}) {
    const cacheKey = this.getCacheKey("getUserActivity", userId);

    if (options.cache) {
      const cached = cache.get(cacheKey);
      if (cached) return cached;
    }

    const result = this.executeOperation(
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
      cache.set(cacheKey, result, options.cacheTTL || 300); // Cache for 5 minutes
    }

    return result;
  }
}
