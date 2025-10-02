/**
 * Multi-Platform Social Media Analytics Service
 *
 * Unified analytics service for Facebook, Instagram, and TikTok tracking
 * Optimized for Romanian viral content and STEM education
 */

// TikTok Pixel events
export enum TikTokPixelEvent {
  VIEW_CONTENT = "ViewContent",
  SEARCH = "Search",
  CONTACT = "Contact",
  LEAD = "Lead",
  COMPLETE_REGISTRATION = "CompleteRegistration",
  PURCHASE = "Purchase",
  ADD_TO_CART = "AddToCart",
  INITIATE_CHECKOUT = "InitiateCheckout",
  ADD_PAYMENT_INFO = "AddPaymentInfo",
  VIRAL_SHARE = "ViralShare", // Custom event for viral tracking
  BLOG_ENGAGEMENT = "BlogEngagement", // Custom event for blog interactions
}

// Instagram events (using Facebook Pixel but with Instagram context)
export enum InstagramEvent {
  VIEW_CONTENT = "ViewContent",
  VIRAL_SHARE = "ViralShare",
  BLOG_ENGAGEMENT = "BlogEngagement",
  PURCHASE = "Purchase",
  ADD_TO_CART = "AddToCart",
}

// Facebook Pixel events (already defined, re-exporting)
export enum FacebookPixelEvent {
  VIEW_CONTENT = "ViewContent",
  SEARCH = "Search",
  CONTACT = "Contact",
  LEAD = "Lead",
  COMPLETE_REGISTRATION = "CompleteRegistration",
  PURCHASE = "Purchase",
  ADD_TO_CART = "AddToCart",
  INITIATE_CHECKOUT = "InitiateCheckout",
  ADD_PAYMENT_INFO = "AddPaymentInfo",
  SHARE = "Share",
  VIRAL_SHARE = "ViralShare",
  BLOG_ENGAGEMENT = "BlogEngagement",
}

export interface SocialMediaEventData {
  eventName: string;
  platform: "facebook" | "instagram" | "tiktok";
  eventId?: string;
  userId?: string;
  sessionId?: string;
  value?: number;
  currency?: string;
  contentType?: string;
  contentIds?: string[];
  contentName?: string;
  contentCategory?: string;
  searchString?: string;
  customData?: Record<string, any>;
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

export interface RomanianViralTrackingData {
  blogId: string;
  shares: number;
  facebookShares: number;
  instagramShares: number;
  tiktokShares: number;
  viralCoefficient: number;
  reach: number;
  engagement: number;
  timeSpent: number;
  romanianEngagement: number;
  platformBreakdown: {
    facebook: number;
    instagram: number;
    tiktok: number;
    other: number;
  };
}

export class SocialMediaAnalyticsService {
  private facebookPixelId: string;
  private instagramPixelId: string;
  private tiktokPixelId: string;
  private facebookAccessToken?: string;
  private tiktokAccessToken?: string;

  constructor() {
    this.facebookPixelId = process.env.FACEBOOK_PIXEL_ID || "";
    this.instagramPixelId = process.env.INSTAGRAM_PIXEL_ID || "";
    this.tiktokPixelId = process.env.TIKTOK_PIXEL_ID || "";
    this.facebookAccessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    this.tiktokAccessToken = process.env.TIKTOK_ACCESS_TOKEN;
  }

  /**
   * Track event across all configured platforms
   */
  async trackEvent(eventData: SocialMediaEventData): Promise<{
    facebook: boolean;
    instagram: boolean;
    tiktok: boolean;
  }> {
    const results = {
      facebook: false,
      instagram: false,
      tiktok: false,
    };

    try {
      // Store event in database first
      await this.storeEventInDatabase(eventData);

      // Track on Facebook
      if (this.facebookPixelId && eventData.platform === "facebook") {
        results.facebook = await this.trackFacebookEvent(eventData);
      }

      // Track on Instagram (uses Facebook Pixel with Instagram context)
      if (this.instagramPixelId && eventData.platform === "instagram") {
        results.instagram = await this.trackInstagramEvent(eventData);
      }

      // Track on TikTok
      if (this.tiktokPixelId && eventData.platform === "tiktok") {
        results.tiktok = await this.trackTikTokEvent(eventData);
      }

      return results;
    } catch (error) {
      console.error("Failed to track social media event:", error);
      return results;
    }
  }

  /**
   * Track Romanian viral share across platforms
   */
  async trackViralShare(
    blogId: string,
    platform: "facebook" | "instagram" | "tiktok" | "all" = "all"
  ): Promise<void> {
    const platforms =
      platform === "all" ? ["facebook", "instagram", "tiktok"] : [platform];

    for (const p of platforms) {
      await this.trackEvent({
        eventName: "ViralShare",
        platform: p as "facebook" | "instagram" | "tiktok",
        contentIds: [blogId],
        contentType: "blog_post",
        customData: {
          platform: p,
          viralContent: true,
          romanianMarket: true,
          stemEducation: true,
          timestamp: Date.now(),
        },
      });
    }

    // Update viral metrics in database
    await this.updateViralMetrics(blogId, platform);
  }

  /**
   * Track blog engagement across platforms
   */
  async trackBlogEngagement(
    blogId: string,
    engagementType: "view" | "read" | "share" | "comment" | "save",
    platform: "facebook" | "instagram" | "tiktok" | "all" = "all",
    timeSpent?: number
  ): Promise<void> {
    const platforms =
      platform === "all" ? ["facebook", "instagram", "tiktok"] : [platform];

    for (const p of platforms) {
      await this.trackEvent({
        eventName: "BlogEngagement",
        platform: p as "facebook" | "instagram" | "tiktok",
        contentIds: [blogId],
        contentType: "blog_post",
        customData: {
          engagement_type: engagementType,
          time_spent: timeSpent,
          romanian_audience: true,
          stem_content: true,
          platform: p,
        },
      });
    }
  }

  /**
   * Track purchase from social media traffic
   */
  async trackPurchaseFromSocial(
    blogId: string,
    orderId: string,
    value: number,
    productIds: string[],
    platform: "facebook" | "instagram" | "tiktok"
  ): Promise<void> {
    await this.trackEvent({
      eventName: "Purchase",
      platform,
      eventId: orderId,
      contentIds: productIds,
      contentType: "product",
      value,
      currency: "RON",
      customData: {
        source: "social_traffic",
        blog_id: blogId,
        platform,
        romanian_conversion: true,
        viral_conversion: true,
      },
    });
  }

  /**
   * Store event in database
   */
  private async storeEventInDatabase(
    eventData: SocialMediaEventData
  ): Promise<void> {
    try {
      const { prisma } = await import("@/lib/prisma");

      await prisma.facebookPixelEvent.create({
        data: {
          eventName: `${eventData.platform}_${eventData.eventName}`,
          eventId: eventData.eventId,
          pixelId: this.getPixelId(eventData.platform),
          userId: eventData.userData?.email
            ? this.hashString(eventData.userData.email)
            : null,
          value: eventData.value,
          currency: eventData.currency || "RON",
          contentType: eventData.contentType,
          contentIds: eventData.contentIds || [],
          contentName: eventData.contentName,
          contentCategory: eventData.contentCategory,
          searchString: eventData.searchString,
          customData: {
            ...eventData.customData,
            platform: eventData.platform,
            originalEventName: eventData.eventName,
          },
          userData: eventData.userData,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error("Failed to store social media event in database:", error);
    }
  }

  /**
   * Track Facebook event
   */
  private async trackFacebookEvent(
    eventData: SocialMediaEventData
  ): Promise<boolean> {
    try {
      // Facebook Pixel tracking (client-side)
      if (typeof window !== "undefined" && window.fbq) {
        window.fbq("trackCustom", eventData.eventName, {
          ...eventData.customData,
          platform: "facebook",
        });
      }

      // Facebook Conversions API (server-side)
      if (this.facebookAccessToken) {
        await this.trackFacebookConversionsAPI(eventData);
      }

      return true;
    } catch (error) {
      console.error("Failed to track Facebook event:", error);
      return false;
    }
  }

  /**
   * Track Instagram event (uses Facebook Pixel with Instagram context)
   */
  private async trackInstagramEvent(
    eventData: SocialMediaEventData
  ): Promise<boolean> {
    try {
      // Instagram tracking via Facebook Pixel
      if (typeof window !== "undefined" && window.fbq) {
        window.fbq("trackCustom", eventData.eventName, {
          ...eventData.customData,
          platform: "instagram",
          instagram_context: true,
        });
      }

      return true;
    } catch (error) {
      console.error("Failed to track Instagram event:", error);
      return false;
    }
  }

  /**
   * Track TikTok event
   */
  private async trackTikTokEvent(
    eventData: SocialMediaEventData
  ): Promise<boolean> {
    try {
      // TikTok Pixel tracking (client-side)
      if (typeof window !== "undefined" && window.ttq) {
        window.ttq("track", eventData.eventName, {
          ...eventData.customData,
          platform: "tiktok",
        });
      }

      // TikTok Conversions API (server-side)
      if (this.tiktokAccessToken) {
        await this.trackTikTokConversionsAPI(eventData);
      }

      return true;
    } catch (error) {
      console.error("Failed to track TikTok event:", error);
      return false;
    }
  }

  /**
   * Update viral metrics in database
   */
  private async updateViralMetrics(
    blogId: string,
    platform: "facebook" | "instagram" | "tiktok" | "all"
  ): Promise<void> {
    try {
      const { prisma } = await import("@/lib/prisma");

      const updateData: any = {
        shares: { increment: 1 },
        lastCalculatedAt: new Date(),
      };

      if (platform === "facebook" || platform === "all") {
        updateData.facebookShares = { increment: 1 };
      }
      if (platform === "instagram" || platform === "all") {
        updateData.instagramShares = { increment: 1 };
      }
      if (platform === "tiktok" || platform === "all") {
        updateData.tiktokShares = { increment: 1 };
      }

      await prisma.romanianViralContent.upsert({
        where: { blogId },
        update: updateData,
        create: {
          blogId,
          shares: 1,
          facebookShares: platform === "facebook" || platform === "all" ? 1 : 0,
          instagramShares:
            platform === "instagram" || platform === "all" ? 1 : 0,
          tiktokShares: platform === "tiktok" || platform === "all" ? 1 : 0,
          viralCoefficient: 1.0,
          reach: 1,
          engagement: 1,
          romanianEngagement: 1,
        },
      });
    } catch (error) {
      console.error("Failed to update viral metrics:", error);
    }
  }

  /**
   * Get pixel ID for platform
   */
  private getPixelId(platform: "facebook" | "instagram" | "tiktok"): string {
    switch (platform) {
      case "facebook":
        return this.facebookPixelId;
      case "instagram":
        return this.instagramPixelId;
      case "tiktok":
        return this.tiktokPixelId;
      default:
        return "";
    }
  }

  /**
   * Track Facebook Conversions API
   */
  private async trackFacebookConversionsAPI(
    eventData: SocialMediaEventData
  ): Promise<void> {
    // Implementation for Facebook Conversions API
    console.log("Facebook Conversions API tracking:", eventData);
  }

  /**
   * Track TikTok Conversions API
   */
  private async trackTikTokConversionsAPI(
    eventData: SocialMediaEventData
  ): Promise<void> {
    // Implementation for TikTok Conversions API
    console.log("TikTok Conversions API tracking:", eventData);
  }

  /**
   * Hash string for privacy compliance
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString();
  }

  /**
   * Get comprehensive viral tracking data
   */
  async getViralTrackingData(
    blogId: string
  ): Promise<RomanianViralTrackingData | null> {
    try {
      const { prisma } = await import("@/lib/prisma");

      const viralData = await prisma.romanianViralContent.findUnique({
        where: { blogId },
      });

      if (!viralData) {
        return null;
      }

      return {
        blogId: viralData.blogId,
        shares: viralData.shares,
        facebookShares: viralData.facebookShares,
        instagramShares: viralData.instagramShares,
        tiktokShares: viralData.tiktokShares,
        viralCoefficient: viralData.viralCoefficient,
        reach: viralData.reach,
        engagement: viralData.engagement,
        timeSpent: viralData.timeSpent,
        romanianEngagement: viralData.romanianEngagement,
        platformBreakdown: {
          facebook: viralData.facebookShares,
          instagram: viralData.instagramShares,
          tiktok: viralData.tiktokShares,
          other:
            viralData.shares -
            (viralData.facebookShares +
              viralData.instagramShares +
              viralData.tiktokShares),
        },
      };
    } catch (error) {
      console.error("Failed to fetch viral tracking data:", error);
      return null;
    }
  }
}

// Export singleton instance
export const socialMediaAnalyticsService = new SocialMediaAnalyticsService();

// Global type declarations for TikTok Pixel
declare global {
  interface Window {
    ttq: any; // TikTok Pixel
    fbq: any; // Facebook Pixel
    trackViralShare: (blogId: string, platform?: string) => void;
    trackBlogEngagement: (
      blogId: string,
      engagementType: string,
      timeSpent?: number,
      platform?: string
    ) => void;
    trackSocialPurchase: (
      orderId: string,
      value: number,
      productIds: string[],
      blogId?: string,
      platform?: string
    ) => void;
  }
}
