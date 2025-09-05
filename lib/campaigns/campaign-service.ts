/**
 * Promotional Campaign Management Service
 * Integrates marketing settings with actual campaign functionality
 */

import {
  getMarketingSettings,
  arePromotionalCampaignsEnabled,
  isCampaignTypeEnabled,
  getCampaignConfig,
  getDiscountRules,
  calculateDiscountAmount,
  canApplyDiscountToCategory,
  canStackDiscounts,
  isDiscountOneTimeUse,
} from "@/lib/utils/marketing-settings";
import { prisma } from "@/lib/prisma";

export interface Campaign {
  id: string;
  name: string;
  type:
    | "flashSale"
    | "seasonalSale"
    | "loyaltyProgram"
    | "referralProgram"
    | "birthdayOffer"
    | "firstTimeBuyer";
  status: "draft" | "active" | "paused" | "completed" | "cancelled";
  startDate: Date;
  endDate: Date;
  discountPercent?: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  applicableCategories?: string[];
  applicableProducts?: string[];
  customerSegments?: string[];
  maxUses?: number;
  currentUses: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignApplication {
  campaignId: string;
  orderId: string;
  customerId: string;
  discountAmount: number;
  appliedAt: Date;
}

export interface CampaignResult {
  success: boolean;
  discountAmount?: number;
  error?: string;
  campaignId?: string;
}

export class CampaignService {
  /**
   * Create a new promotional campaign
   */
  static async createCampaign(
    campaignData: Omit<
      Campaign,
      "id" | "currentUses" | "createdAt" | "updatedAt"
    >
  ): Promise<Campaign> {
    try {
      // Check if promotional campaigns are enabled
      const isEnabled = await arePromotionalCampaignsEnabled();
      if (!isEnabled) {
        throw new Error(
          "Promotional campaigns are not enabled in marketing settings"
        );
      }

      // Check if campaign type is enabled
      const isTypeEnabled = await isCampaignTypeEnabled(campaignData.type);
      if (!isTypeEnabled) {
        throw new Error(
          `Campaign type '${campaignData.type}' is not enabled in marketing settings`
        );
      }

      // Get campaign configuration for validation
      const config = await getCampaignConfig(campaignData.type);
      if (!config) {
        throw new Error(
          `Campaign configuration for '${campaignData.type}' not found`
        );
      }

      // Validate campaign data against configuration
      this.validateCampaignData(campaignData, config);

      // Create campaign in database
      const campaign = await prisma.campaign.create({
        data: {
          name: campaignData.name,
          type: campaignData.type,
          status: campaignData.status,
          startDate: campaignData.startDate,
          endDate: campaignData.endDate,
          discountPercent: campaignData.discountPercent,
          minimumOrderAmount: campaignData.minimumOrderAmount,
          maximumDiscountAmount: campaignData.maximumDiscountAmount,
          applicableCategories: campaignData.applicableCategories,
          applicableProducts: campaignData.applicableProducts,
          customerSegments: campaignData.customerSegments,
          maxUses: campaignData.maxUses,
          currentUses: 0,
        },
      });

      return campaign as Campaign;
    } catch (error) {
      console.error("Error creating campaign:", error);
      throw error;
    }
  }

  /**
   * Apply campaign discount to an order
   */
  static async applyCampaignDiscount(
    campaignId: string,
    orderId: string,
    customerId: string,
    orderTotal: number,
    categoryIds: string[] = []
  ): Promise<CampaignResult> {
    try {
      // Get campaign
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        return {
          success: false,
          error: "Campaign not found",
        };
      }

      // Check if campaign is active
      if (campaign.status !== "active") {
        return {
          success: false,
          error: "Campaign is not active",
        };
      }

      // Check if campaign is within date range
      const now = new Date();
      if (now < campaign.startDate || now > campaign.endDate) {
        return {
          success: false,
          error: "Campaign is not currently running",
        };
      }

      // Check if campaign has reached max uses
      if (campaign.maxUses && campaign.currentUses >= campaign.maxUses) {
        return {
          success: false,
          error: "Campaign has reached maximum uses",
        };
      }

      // Check minimum order amount
      if (
        campaign.minimumOrderAmount &&
        orderTotal < campaign.minimumOrderAmount
      ) {
        return {
          success: false,
          error: `Minimum order amount of $${campaign.minimumOrderAmount} required`,
        };
      }

      // Check if categories are applicable
      if (
        campaign.applicableCategories &&
        campaign.applicableCategories.length > 0
      ) {
        const hasApplicableCategory = categoryIds.some(categoryId =>
          campaign.applicableCategories!.includes(categoryId)
        );
        if (!hasApplicableCategory) {
          return {
            success: false,
            error: "Campaign does not apply to any items in this order",
          };
        }
      }

      // Calculate discount amount
      const discountAmount = await calculateDiscountAmount(
        orderTotal,
        campaign.discountPercent || 0,
        orderTotal
      );

      // Check maximum discount amount
      if (
        campaign.maximumDiscountAmount &&
        discountAmount > campaign.maximumDiscountAmount
      ) {
        return {
          success: false,
          error: `Maximum discount amount of $${campaign.maximumDiscountAmount} exceeded`,
        };
      }

      // Check if customer has already used this campaign (for one-time use campaigns)
      const isOneTimeUse = await isDiscountOneTimeUse();
      if (isOneTimeUse) {
        const existingApplication = await prisma.campaignApplication.findFirst({
          where: {
            campaignId: campaignId,
            customerId: customerId,
          },
        });

        if (existingApplication) {
          return {
            success: false,
            error: "Campaign has already been used by this customer",
          };
        }
      }

      // Apply the campaign
      await prisma.campaignApplication.create({
        data: {
          campaignId: campaignId,
          orderId: orderId,
          customerId: customerId,
          discountAmount: discountAmount,
          appliedAt: new Date(),
        },
      });

      // Update campaign usage count
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          currentUses: {
            increment: 1,
          },
        },
      });

      return {
        success: true,
        discountAmount: discountAmount,
        campaignId: campaignId,
      };
    } catch (error) {
      console.error("Error applying campaign discount:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to apply campaign discount",
      };
    }
  }

  /**
   * Get active campaigns for a customer
   */
  static async getActiveCampaignsForCustomer(
    customerId: string
  ): Promise<Campaign[]> {
    try {
      const now = new Date();
      const campaigns = await prisma.campaign.findMany({
        where: {
          status: "active",
          startDate: { lte: now },
          endDate: { gte: now },
          OR: [
            { maxUses: null },
            { currentUses: { lt: prisma.campaign.fields.maxUses } },
          ],
        },
      });

      return campaigns as Campaign[];
    } catch (error) {
      console.error("Error getting active campaigns:", error);
      return [];
    }
  }

  /**
   * Get campaign statistics
   */
  static async getCampaignStats(campaignId: string): Promise<{
    totalUses: number;
    totalDiscountGiven: number;
    averageOrderValue: number;
    conversionRate: number;
  }> {
    try {
      const applications = await prisma.campaignApplication.findMany({
        where: { campaignId: campaignId },
        include: {
          order: true,
        },
      });

      const totalUses = applications.length;
      const totalDiscountGiven = applications.reduce(
        (sum, app) => sum + app.discountAmount,
        0
      );
      const totalOrderValue = applications.reduce(
        (sum, app) => sum + (app.order?.total || 0),
        0
      );
      const averageOrderValue = totalUses > 0 ? totalOrderValue / totalUses : 0;

      // Calculate conversion rate (simplified - would need more data in real implementation)
      const conversionRate =
        totalUses > 0 ? (totalUses / (totalUses * 10)) * 100 : 0; // Simplified calculation

      return {
        totalUses,
        totalDiscountGiven,
        averageOrderValue,
        conversionRate,
      };
    } catch (error) {
      console.error("Error getting campaign stats:", error);
      return {
        totalUses: 0,
        totalDiscountGiven: 0,
        averageOrderValue: 0,
        conversionRate: 0,
      };
    }
  }

  /**
   * Validate campaign data against configuration
   */
  private static validateCampaignData(campaignData: any, config: any): void {
    // Validate flash sale duration
    if (campaignData.type === "flashSale" && config.duration) {
      const duration =
        campaignData.endDate.getTime() - campaignData.startDate.getTime();
      const maxDuration = config.duration * 24 * 60 * 60 * 1000; // Convert days to milliseconds
      if (duration > maxDuration) {
        throw new Error(
          `Flash sale duration cannot exceed ${config.duration} days`
        );
      }
    }

    // Validate maximum discount
    if (campaignData.discountPercent && config.maxDiscount) {
      if (campaignData.discountPercent > config.maxDiscount) {
        throw new Error(
          `Discount percentage cannot exceed ${config.maxDiscount}%`
        );
      }
    }

    // Validate loyalty program settings
    if (campaignData.type === "loyaltyProgram") {
      if (!campaignData.pointsPerDollar || !campaignData.redemptionRate) {
        throw new Error(
          "Loyalty program requires pointsPerDollar and redemptionRate"
        );
      }
    }

    // Validate referral program settings
    if (campaignData.type === "referralProgram") {
      if (!campaignData.rewardAmount || !campaignData.expiryDays) {
        throw new Error(
          "Referral program requires rewardAmount and expiryDays"
        );
      }
    }

    // Validate birthday offer settings
    if (campaignData.type === "birthdayOffer") {
      if (!campaignData.discountPercent || !campaignData.validDays) {
        throw new Error(
          "Birthday offer requires discountPercent and validDays"
        );
      }
    }

    // Validate first time buyer settings
    if (campaignData.type === "firstTimeBuyer") {
      if (!campaignData.discountPercent || !campaignData.minimumOrder) {
        throw new Error(
          "First time buyer offer requires discountPercent and minimumOrder"
        );
      }
    }
  }

  /**
   * Create flash sale campaign
   */
  static async createFlashSale(
    name: string,
    discountPercent: number,
    durationHours: number,
    applicableCategories?: string[]
  ): Promise<Campaign> {
    const startDate = new Date();
    const endDate = new Date(
      startDate.getTime() + durationHours * 60 * 60 * 1000
    );

    return this.createCampaign({
      name,
      type: "flashSale",
      status: "active",
      startDate,
      endDate,
      discountPercent,
      applicableCategories,
    });
  }

  /**
   * Create seasonal sale campaign
   */
  static async createSeasonalSale(
    name: string,
    discountPercent: number,
    startDate: Date,
    endDate: Date,
    applicableCategories?: string[]
  ): Promise<Campaign> {
    return this.createCampaign({
      name,
      type: "seasonalSale",
      status: "active",
      startDate,
      endDate,
      discountPercent,
      applicableCategories,
    });
  }

  /**
   * Create loyalty program campaign
   */
  static async createLoyaltyProgram(
    name: string,
    pointsPerDollar: number,
    redemptionRate: number
  ): Promise<Campaign> {
    return this.createCampaign({
      name,
      type: "loyaltyProgram",
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      discountPercent: redemptionRate,
    });
  }

  /**
   * Create referral program campaign
   */
  static async createReferralProgram(
    name: string,
    rewardAmount: number,
    expiryDays: number
  ): Promise<Campaign> {
    return this.createCampaign({
      name,
      type: "referralProgram",
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      discountPercent: rewardAmount,
    });
  }

  /**
   * Create birthday offer campaign
   */
  static async createBirthdayOffer(
    name: string,
    discountPercent: number,
    validDays: number
  ): Promise<Campaign> {
    return this.createCampaign({
      name,
      type: "birthdayOffer",
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      discountPercent,
      maxUses: 1, // One-time use per customer
    });
  }

  /**
   * Create first time buyer campaign
   */
  static async createFirstTimeBuyerOffer(
    name: string,
    discountPercent: number,
    minimumOrder: number
  ): Promise<Campaign> {
    return this.createCampaign({
      name,
      type: "firstTimeBuyer",
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      discountPercent,
      minimumOrderAmount: minimumOrder,
      maxUses: 1, // One-time use per customer
    });
  }
}
