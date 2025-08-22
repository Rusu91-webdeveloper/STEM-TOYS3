import { prisma } from "@/lib/prisma";

export interface MarketingSettings {
  emailMarketing: {
    enabled: boolean;
    provider: "sendgrid" | "mailchimp" | "brevo" | "custom";
    apiKey: string;
    fromEmail: string;
    fromName: string;
    replyToEmail: string;
    doubleOptIn: boolean;
    unsubscribeRequired: boolean;
    emailTemplates: {
      welcome: string;
      abandonedCart: string;
      orderConfirmation: string;
      shippingUpdate: string;
      reviewRequest: string;
      birthday: string;
      reEngagement: string;
    };
  };
  socialMedia: {
    enabled: boolean;
    platforms: {
      facebook: { enabled: boolean; pageId: string; accessToken: string };
      instagram: { enabled: boolean; accountId: string; accessToken: string };
      twitter: { enabled: boolean; handle: string; apiKey: string };
      linkedin: { enabled: boolean; companyId: string; accessToken: string };
      youtube: { enabled: boolean; channelId: string; apiKey: string };
      tiktok: { enabled: boolean; username: string; accessToken: string };
    };
    autoSharing: {
      newProducts: boolean;
      blogPosts: boolean;
      promotions: boolean;
      customerReviews: boolean;
    };
    socialProof: {
      showReviews: boolean;
      showFollowers: boolean;
      showRecentActivity: boolean;
    };
  };
  promotionalCampaigns: {
    enabled: boolean;
    campaignTypes: {
      flashSales: { enabled: boolean; duration: number; maxDiscount: number };
      seasonalSales: { enabled: boolean; autoSchedule: boolean };
      loyaltyProgram: {
        enabled: boolean;
        pointsPerDollar: number;
        redemptionRate: number;
      };
      referralProgram: {
        enabled: boolean;
        rewardAmount: number;
        expiryDays: number;
      };
      birthdayOffers: {
        enabled: boolean;
        discountPercent: number;
        validDays: number;
      };
      firstTimeBuyer: {
        enabled: boolean;
        discountPercent: number;
        minimumOrder: number;
      };
    };
    discountRules: {
      maxDiscountPercent: number;
      minimumOrderAmount: number;
      excludeCategories: string[];
      stackableDiscounts: boolean;
      oneTimeUse: boolean;
    };
  };
  customerSegmentation: {
    enabled: boolean;
    segments: {
      newCustomers: { enabled: boolean; daysSinceFirstOrder: number };
      returningCustomers: { enabled: boolean; minimumOrders: number };
      highValueCustomers: { enabled: boolean; minimumSpend: number };
      inactiveCustomers: { enabled: boolean; daysSinceLastOrder: number };
      cartAbandoners: { enabled: boolean; abandonedThreshold: number };
      productCategoryLovers: { enabled: boolean; categories: string[] };
    };
    targetingRules: {
      locationBased: boolean;
      purchaseHistory: boolean;
      browsingBehavior: boolean;
      emailEngagement: boolean;
      socialMediaActivity: boolean;
    };
  };
  marketingAutomation: {
    enabled: boolean;
    workflows: {
      welcomeSeries: { enabled: boolean; emails: number; interval: number };
      abandonedCart: { enabled: boolean; emails: number; interval: number };
      postPurchase: { enabled: boolean; emails: number; interval: number };
      reEngagement: { enabled: boolean; emails: number; interval: number };
      birthdayCampaign: { enabled: boolean; emails: number; interval: number };
      seasonalPromotions: {
        enabled: boolean;
        emails: number;
        interval: number;
      };
    };
    triggers: {
      newCustomer: boolean;
      cartAbandonment: boolean;
      orderCompletion: boolean;
      productView: boolean;
      categoryView: boolean;
      searchQuery: boolean;
    };
  };
  analytics: {
    enabled: boolean;
    tracking: {
      googleAnalytics: { enabled: boolean; trackingId: string };
      facebookPixel: { enabled: boolean; pixelId: string };
      googleAds: { enabled: boolean; conversionId: string };
      tiktokPixel: { enabled: boolean; pixelId: string };
      customTracking: { enabled: boolean; script: string };
    };
    goals: {
      revenueTarget: number;
      conversionRate: number;
      emailOpenRate: number;
      clickThroughRate: number;
      socialEngagement: number;
    };
  };
  contentMarketing: {
    enabled: boolean;
    blog: {
      enabled: boolean;
      autoPublish: boolean;
      seoOptimization: boolean;
      socialSharing: boolean;
      emailNewsletter: boolean;
    };
    seo: {
      enabled: boolean;
      metaTags: boolean;
      structuredData: boolean;
      sitemapGeneration: boolean;
      robotsTxt: boolean;
    };
    influencerMarketing: {
      enabled: boolean;
      collaborationPlatform: string;
      commissionRate: number;
      minimumFollowers: number;
    };
  };
}

/**
 * Get marketing settings from the database
 */
export async function getMarketingSettings(): Promise<MarketingSettings | null> {
  try {
    const settings = await prisma.storeSettings.findFirst();

    if (!settings?.marketingSettings) {
      return null;
    }

    return settings.marketingSettings as any as MarketingSettings;
  } catch (error) {
    console.error("Error fetching marketing settings:", error);
    return null;
  }
}

/**
 * Check if email marketing is enabled
 */
export async function isEmailMarketingEnabled(): Promise<boolean> {
  try {
    const settings = await getMarketingSettings();
    return settings?.emailMarketing.enabled || false;
  } catch (error) {
    console.error("Error checking email marketing status:", error);
    return false;
  }
}

/**
 * Get email marketing provider configuration
 */
export async function getEmailMarketingConfig(): Promise<{
  provider: string;
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyToEmail: string;
} | null> {
  try {
    const settings = await getMarketingSettings();

    if (!settings?.emailMarketing.enabled) {
      return null;
    }

    return {
      provider: settings.emailMarketing.provider,
      apiKey: settings.emailMarketing.apiKey,
      fromEmail: settings.emailMarketing.fromEmail,
      fromName: settings.emailMarketing.fromName,
      replyToEmail: settings.emailMarketing.replyToEmail,
    };
  } catch (error) {
    console.error("Error getting email marketing config:", error);
    return null;
  }
}

/**
 * Get email template by type
 */
export async function getEmailTemplate(
  templateType: keyof MarketingSettings["emailMarketing"]["emailTemplates"]
): Promise<string | null> {
  try {
    const settings = await getMarketingSettings();

    if (!settings?.emailMarketing.enabled) {
      return null;
    }

    return settings.emailMarketing.emailTemplates[templateType] || null;
  } catch (error) {
    console.error("Error getting email template:", error);
    return null;
  }
}

/**
 * Check if social media integration is enabled
 */
export async function isSocialMediaEnabled(): Promise<boolean> {
  try {
    const settings = await getMarketingSettings();
    return settings?.socialMedia.enabled || false;
  } catch (error) {
    console.error("Error checking social media status:", error);
    return false;
  }
}

/**
 * Check if specific social media platform is enabled
 */
export async function isSocialPlatformEnabled(
  platform: keyof MarketingSettings["socialMedia"]["platforms"]
): Promise<boolean> {
  try {
    const settings = await getMarketingSettings();

    if (!settings?.socialMedia.enabled) {
      return false;
    }

    return settings.socialMedia.platforms[platform].enabled || false;
  } catch (error) {
    console.error("Error checking social platform status:", error);
    return false;
  }
}

/**
 * Get social media platform configuration
 */
export async function getSocialPlatformConfig(
  platform: keyof MarketingSettings["socialMedia"]["platforms"]
): Promise<any | null> {
  try {
    const settings = await getMarketingSettings();

    if (
      !settings?.socialMedia.enabled ||
      !settings.socialMedia.platforms[platform].enabled
    ) {
      return null;
    }

    return settings.socialMedia.platforms[platform];
  } catch (error) {
    console.error("Error getting social platform config:", error);
    return null;
  }
}

/**
 * Check if auto-sharing is enabled for specific content type
 */
export async function isAutoSharingEnabled(
  contentType: keyof MarketingSettings["socialMedia"]["autoSharing"]
): Promise<boolean> {
  try {
    const settings = await getMarketingSettings();

    if (!settings?.socialMedia.enabled) {
      return false;
    }

    return settings.socialMedia.autoSharing[contentType] || false;
  } catch (error) {
    console.error("Error checking auto-sharing status:", error);
    return false;
  }
}

/**
 * Check if promotional campaigns are enabled
 */
export async function arePromotionalCampaignsEnabled(): Promise<boolean> {
  try {
    const settings = await getMarketingSettings();
    return settings?.promotionalCampaigns.enabled || false;
  } catch (error) {
    console.error("Error checking promotional campaigns status:", error);
    return false;
  }
}

/**
 * Check if specific campaign type is enabled
 */
export async function isCampaignTypeEnabled(
  campaignType: keyof MarketingSettings["promotionalCampaigns"]["campaignTypes"]
): Promise<boolean> {
  try {
    const settings = await getMarketingSettings();

    if (!settings?.promotionalCampaigns.enabled) {
      return false;
    }

    return (
      settings.promotionalCampaigns.campaignTypes[campaignType].enabled || false
    );
  } catch (error) {
    console.error("Error checking campaign type status:", error);
    return false;
  }
}

/**
 * Get campaign configuration
 */
export async function getCampaignConfig(
  campaignType: keyof MarketingSettings["promotionalCampaigns"]["campaignTypes"]
): Promise<any | null> {
  try {
    const settings = await getMarketingSettings();

    if (
      !settings?.promotionalCampaigns.enabled ||
      !settings.promotionalCampaigns.campaignTypes[campaignType].enabled
    ) {
      return null;
    }

    return settings.promotionalCampaigns.campaignTypes[campaignType];
  } catch (error) {
    console.error("Error getting campaign config:", error);
    return null;
  }
}

/**
 * Get discount rules
 */
export async function getDiscountRules(): Promise<
  MarketingSettings["promotionalCampaigns"]["discountRules"] | null
> {
  try {
    const settings = await getMarketingSettings();

    if (!settings?.promotionalCampaigns.enabled) {
      return null;
    }

    return settings.promotionalCampaigns.discountRules;
  } catch (error) {
    console.error("Error getting discount rules:", error);
    return null;
  }
}

/**
 * Check if customer segmentation is enabled
 */
export async function isCustomerSegmentationEnabled(): Promise<boolean> {
  try {
    const settings = await getMarketingSettings();
    return settings?.customerSegmentation.enabled || false;
  } catch (error) {
    console.error("Error checking customer segmentation status:", error);
    return false;
  }
}

/**
 * Check if specific customer segment is enabled
 */
export async function isCustomerSegmentEnabled(
  segment: keyof MarketingSettings["customerSegmentation"]["segments"]
): Promise<boolean> {
  try {
    const settings = await getMarketingSettings();

    if (!settings?.customerSegmentation.enabled) {
      return false;
    }

    return settings.customerSegmentation.segments[segment].enabled || false;
  } catch (error) {
    console.error("Error checking customer segment status:", error);
    return false;
  }
}

/**
 * Get customer segment configuration
 */
export async function getCustomerSegmentConfig(
  segment: keyof MarketingSettings["customerSegmentation"]["segments"]
): Promise<any | null> {
  try {
    const settings = await getMarketingSettings();

    if (
      !settings?.customerSegmentation.enabled ||
      !settings.customerSegmentation.segments[segment].enabled
    ) {
      return null;
    }

    return settings.customerSegmentation.segments[segment];
  } catch (error) {
    console.error("Error getting customer segment config:", error);
    return null;
  }
}

/**
 * Check if marketing automation is enabled
 */
export async function isMarketingAutomationEnabled(): Promise<boolean> {
  try {
    const settings = await getMarketingSettings();
    return settings?.marketingAutomation.enabled || false;
  } catch (error) {
    console.error("Error checking marketing automation status:", error);
    return false;
  }
}

/**
 * Check if specific workflow is enabled
 */
export async function isWorkflowEnabled(
  workflow: keyof MarketingSettings["marketingAutomation"]["workflows"]
): Promise<boolean> {
  try {
    const settings = await getMarketingSettings();

    if (!settings?.marketingAutomation.enabled) {
      return false;
    }

    return settings.marketingAutomation.workflows[workflow].enabled || false;
  } catch (error) {
    console.error("Error checking workflow status:", error);
    return false;
  }
}

/**
 * Get workflow configuration
 */
export async function getWorkflowConfig(
  workflow: keyof MarketingSettings["marketingAutomation"]["workflows"]
): Promise<any | null> {
  try {
    const settings = await getMarketingSettings();

    if (
      !settings?.marketingAutomation.enabled ||
      !settings.marketingAutomation.workflows[workflow].enabled
    ) {
      return null;
    }

    return settings.marketingAutomation.workflows[workflow];
  } catch (error) {
    console.error("Error getting workflow config:", error);
    return null;
  }
}

/**
 * Check if specific trigger is enabled
 */
export async function isTriggerEnabled(
  trigger: keyof MarketingSettings["marketingAutomation"]["triggers"]
): Promise<boolean> {
  try {
    const settings = await getMarketingSettings();

    if (!settings?.marketingAutomation.enabled) {
      return false;
    }

    return settings.marketingAutomation.triggers[trigger] || false;
  } catch (error) {
    console.error("Error checking trigger status:", error);
    return false;
  }
}

/**
 * Check if analytics is enabled
 */
export async function isAnalyticsEnabled(): Promise<boolean> {
  try {
    const settings = await getMarketingSettings();
    return settings?.analytics.enabled || false;
  } catch (error) {
    console.error("Error checking analytics status:", error);
    return false;
  }
}

/**
 * Check if specific tracking is enabled
 */
export async function isTrackingEnabled(
  tracking: keyof MarketingSettings["analytics"]["tracking"]
): Promise<boolean> {
  try {
    const settings = await getMarketingSettings();

    if (!settings?.analytics.enabled) {
      return false;
    }

    return settings.analytics.tracking[tracking].enabled || false;
  } catch (error) {
    console.error("Error checking tracking status:", error);
    return false;
  }
}

/**
 * Get tracking configuration
 */
export async function getTrackingConfig(
  tracking: keyof MarketingSettings["analytics"]["tracking"]
): Promise<any | null> {
  try {
    const settings = await getMarketingSettings();

    if (
      !settings?.analytics.enabled ||
      !settings.analytics.tracking[tracking].enabled
    ) {
      return null;
    }

    return settings.analytics.tracking[tracking];
  } catch (error) {
    console.error("Error getting tracking config:", error);
    return null;
  }
}

/**
 * Get analytics goals
 */
export async function getAnalyticsGoals(): Promise<
  MarketingSettings["analytics"]["goals"] | null
> {
  try {
    const settings = await getMarketingSettings();

    if (!settings?.analytics.enabled) {
      return null;
    }

    return settings.analytics.goals;
  } catch (error) {
    console.error("Error getting analytics goals:", error);
    return null;
  }
}

/**
 * Check if content marketing is enabled
 */
export async function isContentMarketingEnabled(): Promise<boolean> {
  try {
    const settings = await getMarketingSettings();
    return settings?.contentMarketing.enabled || false;
  } catch (error) {
    console.error("Error checking content marketing status:", error);
    return false;
  }
}

/**
 * Check if blog is enabled
 */
export async function isBlogEnabled(): Promise<boolean> {
  try {
    const settings = await getMarketingSettings();

    if (!settings?.contentMarketing.enabled) {
      return false;
    }

    return settings.contentMarketing.blog.enabled || false;
  } catch (error) {
    console.error("Error checking blog status:", error);
    return false;
  }
}

/**
 * Get blog configuration
 */
export async function getBlogConfig(): Promise<
  MarketingSettings["contentMarketing"]["blog"] | null
> {
  try {
    const settings = await getMarketingSettings();

    if (
      !settings?.contentMarketing.enabled ||
      !settings.contentMarketing.blog.enabled
    ) {
      return null;
    }

    return settings.contentMarketing.blog;
  } catch (error) {
    console.error("Error getting blog config:", error);
    return null;
  }
}

/**
 * Check if SEO is enabled
 */
export async function isSEOEnabled(): Promise<boolean> {
  try {
    const settings = await getMarketingSettings();

    if (!settings?.contentMarketing.enabled) {
      return false;
    }

    return settings.contentMarketing.seo.enabled || false;
  } catch (error) {
    console.error("Error checking SEO status:", error);
    return false;
  }
}

/**
 * Get SEO configuration
 */
export async function getSEOConfig(): Promise<
  MarketingSettings["contentMarketing"]["seo"] | null
> {
  try {
    const settings = await getMarketingSettings();

    if (
      !settings?.contentMarketing.enabled ||
      !settings.contentMarketing.seo.enabled
    ) {
      return null;
    }

    return settings.contentMarketing.seo;
  } catch (error) {
    console.error("Error getting SEO config:", error);
    return null;
  }
}

/**
 * Check if influencer marketing is enabled
 */
export async function isInfluencerMarketingEnabled(): Promise<boolean> {
  try {
    const settings = await getMarketingSettings();

    if (!settings?.contentMarketing.enabled) {
      return false;
    }

    return settings.contentMarketing.influencerMarketing.enabled || false;
  } catch (error) {
    console.error("Error checking influencer marketing status:", error);
    return false;
  }
}

/**
 * Get influencer marketing configuration
 */
export async function getInfluencerMarketingConfig(): Promise<
  MarketingSettings["contentMarketing"]["influencerMarketing"] | null
> {
  try {
    const settings = await getMarketingSettings();

    if (
      !settings?.contentMarketing.enabled ||
      !settings.contentMarketing.influencerMarketing.enabled
    ) {
      return null;
    }

    return settings.contentMarketing.influencerMarketing;
  } catch (error) {
    console.error("Error getting influencer marketing config:", error);
    return null;
  }
}

/**
 * Calculate discount amount based on rules
 */
export async function calculateDiscountAmount(
  originalPrice: number,
  discountPercent: number,
  orderTotal: number = 0
): Promise<number> {
  try {
    const discountRules = await getDiscountRules();

    if (!discountRules) {
      return 0;
    }

    // Check minimum order amount
    if (orderTotal < discountRules.minimumOrderAmount) {
      return 0;
    }

    // Check maximum discount percent
    const actualDiscountPercent = Math.min(
      discountPercent,
      discountRules.maxDiscountPercent
    );

    return (originalPrice * actualDiscountPercent) / 100;
  } catch (error) {
    console.error("Error calculating discount amount:", error);
    return 0;
  }
}

/**
 * Check if discount can be applied to category
 */
export async function canApplyDiscountToCategory(
  categoryId: string
): Promise<boolean> {
  try {
    const discountRules = await getDiscountRules();

    if (!discountRules) {
      return true;
    }

    return !discountRules.excludeCategories.includes(categoryId);
  } catch (error) {
    console.error("Error checking discount category eligibility:", error);
    return true;
  }
}

/**
 * Check if discounts can be stacked
 */
export async function canStackDiscounts(): Promise<boolean> {
  try {
    const discountRules = await getDiscountRules();
    return discountRules?.stackableDiscounts || false;
  } catch (error) {
    console.error("Error checking discount stacking:", error);
    return false;
  }
}

/**
 * Check if discount is one-time use
 */
export async function isDiscountOneTimeUse(): Promise<boolean> {
  try {
    const discountRules = await getDiscountRules();
    return discountRules?.oneTimeUse || false;
  } catch (error) {
    console.error("Error checking discount one-time use:", error);
    return false;
  }
}
