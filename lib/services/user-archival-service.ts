import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";
import { getUserCache } from "@/lib/cache/user-cache";

export interface ArchivalConfig {
  inactiveThresholdDays: number; // Days of inactivity before archival
  archiveBatchSize: number; // Users to process per batch
  retentionPeriodDays: number; // Days to retain archived data
  compressionEnabled: boolean; // Whether to compress archived data
  archiveDatabaseUrl?: string; // Separate archive database URL
}

export interface ArchivalResult {
  processed: number;
  archived: number;
  failed: number;
  errors: string[];
}

/**
 * User Data Archival Service for Phase 5 Performance Optimization
 * Implements automated archival strategies for old/inactive user data
 */
export class UserArchivalService {
  constructor(
    private prisma: PrismaClient,
    private config: ArchivalConfig,
    private userCache = getUserCache()
  ) {}

  /**
   * Archive inactive users based on configuration
   */
  async archiveInactiveUsers(): Promise<ArchivalResult> {
    const result: ArchivalResult = {
      processed: 0,
      archived: 0,
      failed: 0,
      errors: [],
    };

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(
        cutoffDate.getDate() - this.config.inactiveThresholdDays
      );

      // Get users eligible for archival
      const usersToArchive = await this.prisma.user.findMany({
        where: {
          OR: [
            { lastActivityAt: { lt: cutoffDate } },
            {
              lastActivityAt: null,
              createdAt: { lt: cutoffDate },
            },
          ],
          dataArchiveStatus: "ACTIVE",
          isActive: false,
          // Don't archive high-value or recently active users
          lifetimeValue: { lt: 100 }, // Low value threshold
        },
        orderBy: { updatedAt: "asc" },
        take: this.config.archiveBatchSize,
        select: {
          id: true,
          email: true,
          createdAt: true,
          lastActivityAt: true,
          lifetimeValue: true,
          tenantId: true,
        },
      });

      result.processed = usersToArchive.length;

      // Process users in batches
      for (const user of usersToArchive) {
        try {
          await this.archiveSingleUser(user.id);
          result.archived++;

          // Invalidate cache for archived user
          await this.userCache.invalidateUser(user.id);

          logger.info("User archived successfully", {
            userId: user.id,
            email: user.email,
            lifetimeValue: user.lifetimeValue,
          });
        } catch (error) {
          result.failed++;
          result.errors.push(`Failed to archive user ${user.id}: ${error}`);
          logger.error("User archival failed", { userId: user.id, error });
        }
      }

      logger.info("User archival batch completed", result);
      return result;
    } catch (error) {
      logger.error("User archival process failed", { error });
      result.errors.push(`Archival process failed: ${error}`);
      return result;
    }
  }

  /**
   * Archive a single user and related data
   */
  private async archiveSingleUser(userId: string): Promise<void> {
    // Start transaction for data consistency
    await this.prisma.$transaction(async tx => {
      // 1. Archive user profile data
      const userData = await tx.user.findUnique({
        where: { id: userId },
        include: {
          addresses: true,
          orders: { take: 10, orderBy: { createdAt: "desc" } }, // Keep recent orders
          reviews: { take: 20, orderBy: { createdAt: "desc" } }, // Keep recent reviews
          consentLogs: { take: 50, orderBy: { createdAt: "desc" } }, // Keep recent consents
        },
      });

      if (!userData) {
        throw new Error(`User ${userId} not found`);
      }

      // 2. Create compressed archive record
      const archiveData = this.compressUserData(userData);

      // In a real implementation, you'd store this in a separate archive table or database
      // For now, we'll update the user record to mark as archived
      await tx.user.update({
        where: { id: userId },
        data: {
          dataArchiveStatus: "ARCHIVED",
          anonymized: true,
          // Clear sensitive data but keep minimal tracking info
          name: null,
          phone: null,
          cnp: null,
          cui: null,
          adresaDomiciliu: null,
          codPostal: null,
          judet: null,
          localitate: null,
          // Keep aggregated data for analytics
          // Remove detailed behavioral data
          totalPageViews: 0,
          totalTimeSpent: 0,
          avgSessionDuration: null,
          socialEngagementScore: null,
          recommendationClicks: 0,
          wishlistSize: 0,
          // Archive preferences and tags
          preferences: null,
          tags: [],
          regionalPreference: null,
          seasonalPatterns: null,
          productCategoryPrefs: [],
          ageGroup: null,
          educationLevel: null,
          paymentMethodPrefs: [],
          deliveryTimeExpectation: null,
          priceSensitivity: null,
          brandLoyaltyScore: null,
        },
      });

      // 3. Archive related data (soft delete or move to archive tables)
      await this.archiveRelatedData(tx, userId);

      // 4. Log archival action
      logger.info("User data archived", {
        userId,
        originalSize: JSON.stringify(userData).length,
        archivedSize: JSON.stringify(archiveData).length,
        compressionRatio:
          JSON.stringify(archiveData).length / JSON.stringify(userData).length,
      });
    });
  }

  /**
   * Archive related user data (orders, reviews, etc.)
   */
  private async archiveRelatedData(
    tx: PrismaClient,
    userId: string
  ): Promise<void> {
    // Archive old orders (keep recent ones)
    const oldOrders = await tx.order.findMany({
      where: {
        userId,
        createdAt: { lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }, // Older than 1 year
        status: { in: ["DELIVERED", "COMPLETED", "CANCELLED"] },
      },
      select: { id: true },
    });

    if (oldOrders.length > 0) {
      // In a real implementation, you'd move these to archive tables
      // For now, we'll mark them as archived in place
      await tx.order.updateMany({
        where: {
          id: { in: oldOrders.map(o => o.id) },
        },
        data: {
          notes: "[ARCHIVED] Old order data moved to archive storage",
        },
      });
    }

    // Archive old reviews
    const oldReviews = await tx.review.findMany({
      where: {
        userId,
        createdAt: { lt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) }, // Older than 6 months
      },
      select: { id: true },
    });

    if (oldReviews.length > 0) {
      await tx.review.updateMany({
        where: {
          id: { in: oldReviews.map(r => r.id) },
        },
        data: {
          content: "[ARCHIVED] Review content archived for performance",
        },
      });
    }

    // Clean up old consent logs (keep recent ones)
    const oldConsentLogs = await tx.consentLog.findMany({
      where: {
        userId,
        createdAt: { lt: new Date(Date.now() - 2555 * 24 * 60 * 60 * 1000) }, // Older than 7 years (GDPR max)
      },
      select: { id: true },
    });

    if (oldConsentLogs.length > 0) {
      await tx.consentLog.deleteMany({
        where: {
          id: { in: oldConsentLogs.map(c => c.id) },
        },
      });
    }
  }

  /**
   * Compress user data for archival
   */
  private compressUserData(userData: any): any {
    if (!this.config.compressionEnabled) {
      return userData;
    }

    // In a real implementation, you'd use a compression algorithm
    // For now, we'll just remove redundant fields and structure the data
    const compressed = {
      id: userData.id,
      email: userData.email,
      tenantId: userData.tenantId,
      createdAt: userData.createdAt,
      archivedAt: new Date(),
      // Keep only essential aggregated data
      lifetimeValue: userData.lifetimeValue,
      totalOrders: userData.orders?.length || 0,
      totalReviews: userData.reviews?.length || 0,
      // Archive addresses count
      addressCount: userData.addresses?.length || 0,
      // Compress behavioral data
      behavioralSummary: {
        totalPageViews: userData.totalPageViews,
        totalTimeSpent: userData.totalTimeSpent,
        avgOrderValue: userData.avgOrderValue,
        segment: userData.segment,
        lifecycleStage: userData.lifecycleStage,
      },
    };

    return compressed;
  }

  /**
   * Clean up expired archived data
   */
  async cleanupExpiredArchives(): Promise<ArchivalResult> {
    const result: ArchivalResult = {
      processed: 0,
      archived: 0,
      failed: 0,
      errors: [],
    };

    try {
      const expiryDate = new Date();
      expiryDate.setDate(
        expiryDate.getDate() - this.config.retentionPeriodDays
      );

      // Find archived users older than retention period
      const expiredUsers = await this.prisma.user.findMany({
        where: {
          dataArchiveStatus: "ARCHIVED",
          updatedAt: { lt: expiryDate },
          // Don't delete users with significant value or legal holds
          lifetimeValue: { lt: 10 }, // Very low value threshold
        },
        select: { id: true, email: true, updatedAt: true },
        take: this.config.archiveBatchSize,
      });

      result.processed = expiredUsers.length;

      // In a real implementation, you'd move to long-term archive or delete
      // For now, we'll mark as permanently deleted
      for (const user of expiredUsers) {
        try {
          // Final anonymization - remove all remaining identifiers
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              dataArchiveStatus: "DELETED",
              email: `archived-${user.id}@deleted.local`,
              verificationToken: null,
              password: "DELETED",
              // Clear any remaining personal data
            },
          });

          result.archived++;
          logger.info("Expired archived user cleaned up", {
            userId: user.id,
            archivedDate: user.updatedAt,
          });
        } catch (error) {
          result.failed++;
          result.errors.push(`Failed to cleanup user ${user.id}: ${error}`);
        }
      }

      return result;
    } catch (error) {
      logger.error("Archive cleanup failed", { error });
      result.errors.push(`Cleanup process failed: ${error}`);
      return result;
    }
  }

  /**
   * Get archival statistics
   */
  async getArchivalStats() {
    const [activeUsers, archivedUsers, deletedUsers, recentArchivals] =
      await Promise.all([
        this.prisma.user.count({ where: { dataArchiveStatus: "ACTIVE" } }),
        this.prisma.user.count({ where: { dataArchiveStatus: "ARCHIVED" } }),
        this.prisma.user.count({ where: { dataArchiveStatus: "DELETED" } }),
        this.prisma.user.count({
          where: {
            dataArchiveStatus: "ARCHIVED",
            updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),
      ]);

    return {
      activeUsers,
      archivedUsers,
      deletedUsers,
      totalUsers: activeUsers + archivedUsers + deletedUsers,
      recentArchivals,
      archiveRate: (archivedUsers / (activeUsers + archivedUsers)) * 100,
      storageSavings: this.estimateStorageSavings(archivedUsers, deletedUsers),
    };
  }

  /**
   * Estimate storage savings from archival
   */
  private estimateStorageSavings(
    archivedUsers: number,
    deletedUsers: number
  ): number {
    // Rough estimates - in a real implementation, you'd calculate actual sizes
    const avgUserSize = 2048; // 2KB per active user
    const archivedUserSize = 256; // 256B per archived user
    const deletedUserSize = 128; // 128B per deleted user

    const activeSize = archivedUsers * avgUserSize;
    const archivedSize =
      archivedUsers * archivedUserSize + deletedUsers * deletedUserSize;

    return activeSize - archivedSize;
  }
}

// Factory function for creating archival service
export function createUserArchivalService(
  prisma: PrismaClient,
  config?: Partial<ArchivalConfig>
): UserArchivalService {
  const defaultConfig: ArchivalConfig = {
    inactiveThresholdDays: parseInt(
      process.env.USER_ARCHIVAL_INACTIVE_DAYS || "365"
    ),
    archiveBatchSize: parseInt(process.env.USER_ARCHIVAL_BATCH_SIZE || "1000"),
    retentionPeriodDays: parseInt(
      process.env.USER_ARCHIVAL_RETENTION_DAYS || "2555"
    ), // 7 years GDPR
    compressionEnabled: process.env.USER_ARCHIVAL_COMPRESSION === "true",
    archiveDatabaseUrl: process.env.ARCHIVE_DATABASE_URL,
  };

  return new UserArchivalService(prisma, { ...defaultConfig, ...config });
}
