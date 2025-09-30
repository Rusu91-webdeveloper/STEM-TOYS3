/**
 * Facebook Pixel Service for Romanian Viral Content Tracking
 *
 * Advanced Facebook Pixel implementation optimized for Romanian market
 * and viral content spread measurement
 */

// Server-side imports (conditionally imported)
let getServerSession: any = null;
let authOptions: any = null;

// Dynamically import server-only modules
if (typeof window === "undefined") {
  try {
    const serverAuth = require("next-auth/next");
    const serverAuthOptions = require("@/lib/auth");
    getServerSession = serverAuth.getServerSession;
    authOptions = serverAuthOptions.authOptions;
  } catch (error) {
    // Ignore import errors in client-side environment
  }
}

// Facebook Pixel events for Romanian viral content
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
  SHARE = "Share", // Custom event for viral tracking
  VIRAL_SHARE = "ViralShare", // Custom event for Romanian viral content
  BLOG_ENGAGEMENT = "BlogEngagement", // Custom event for blog interactions
}

export interface FacebookPixelEventData {
  eventName: FacebookPixelEvent;
  eventId?: string;
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
  viralCoefficient: number; // How many people each reader shares with
  reach: number;
  engagement: number;
  timeSpent: number; // Average time spent reading
  romanianEngagement: number; // Engagement specifically from Romanian audience
}

export class FacebookPixelService {
  private pixelId: string;
  private accessToken?: string;

  constructor(pixelId?: string, accessToken?: string) {
    this.pixelId = pixelId || process.env.FACEBOOK_PIXEL_ID || "";
    this.accessToken = accessToken || process.env.FACEBOOK_ACCESS_TOKEN;
  }

  /**
   * Get Facebook Pixel ID
   */
  getPixelId(): string {
    return this.pixelId;
  }

  /**
   * Check if Facebook Pixel is configured
   */
  isConfigured(): boolean {
    return Boolean(this.pixelId);
  }

  /**
   * Track Facebook Pixel event
   */
  async trackEvent(eventData: FacebookPixelEventData): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log(
        "Facebook Pixel not configured, skipping event tracking:",
        eventData.eventName
      );
      return false;
    }

    try {
      // Server-side event tracking (for conversion API)
      if (this.accessToken) {
        await this.trackServerSideEvent(eventData);
      }

      // Client-side tracking is handled by the pixel script
      console.log("Facebook Pixel event tracked:", eventData.eventName);
      return true;
    } catch (error) {
      console.error("Failed to track Facebook Pixel event:", error);
      return false;
    }
  }

  /**
   * Track server-side Facebook event using Conversions API
   */
  private async trackServerSideEvent(
    eventData: FacebookPixelEventData
  ): Promise<void> {
    if (!this.accessToken) return;

    try {
      // Get user session for user data
      // TODO: Re-enable session tracking
      // const session = await getServerSession(authOptions);

      const eventPayload = {
        data: [
          {
            event_name: eventData.eventName,
            event_time: Math.floor(Date.now() / 1000),
            event_id: eventData.eventId || `${Date.now()}-${Math.random()}`,
            user_data: {
              ...(eventData.userData || {}),
              ...(session?.user?.email && {
                em: [this.hashString(session.user.email)],
              }),
              // Add Romanian location data
              country: ["ro"], // Romania
              // Add Romanian-specific tracking
            },
            custom_data: {
              ...(eventData.value && { value: eventData.value }),
              ...(eventData.currency && { currency: eventData.currency }),
              ...(eventData.contentType && {
                content_type: eventData.contentType,
              }),
              ...(eventData.contentIds && {
                content_ids: eventData.contentIds,
              }),
              ...(eventData.contentName && {
                content_name: eventData.contentName,
              }),
              ...(eventData.contentCategory && {
                content_category: eventData.contentCategory,
              }),
              ...(eventData.searchString && {
                search_string: eventData.searchString,
              }),
              ...eventData.customData,
              // Romanian-specific custom data
              market: "romania",
              language: "ro",
              timezone: "Europe/Bucharest",
            },
            event_source_url:
              typeof window !== "undefined" ? window.location.href : undefined,
          },
        ],
        access_token: this.accessToken,
      };

      // In production, make actual API call to Facebook
      console.log(
        "Facebook Conversions API payload:",
        JSON.stringify(eventPayload, null, 2)
      );

      // TODO: Implement actual Facebook API call when in production
      // const response = await fetch(`https://graph.facebook.com/v18.0/${this.pixelId}/events`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(eventPayload),
      // });
    } catch (error) {
      console.error("Facebook Conversions API error:", error);
    }
  }

  /**
   * Track Romanian viral content sharing
   */
  async trackViralShare(
    blogId: string,
    platform: "facebook" | "instagram" | "other" = "facebook"
  ): Promise<void> {
    await this.trackEvent({
      eventName: FacebookPixelEvent.VIRAL_SHARE,
      contentIds: [blogId],
      contentType: "blog_post",
      customData: {
        platform,
        viralContent: true,
        romanianMarket: true,
        stemEducation: true,
      },
    });

    // Update viral metrics in database
    await this.updateViralMetrics(blogId, { shares: 1 });
  }

  /**
   * Track blog engagement for Romanian audience
   */
  async trackBlogEngagement(
    blogId: string,
    engagementType: "view" | "read" | "share" | "comment" | "save",
    timeSpent?: number
  ): Promise<void> {
    await this.trackEvent({
      eventName: FacebookPixelEvent.BLOG_ENGAGEMENT,
      contentIds: [blogId],
      contentType: "blog_post",
      customData: {
        engagement_type: engagementType,
        time_spent: timeSpent,
        romanian_audience: true,
        stem_content: true,
      },
    });
  }

  /**
   * Track Romanian product interest from blog traffic
   */
  async trackProductInterestFromBlog(
    blogId: string,
    productIds: string[],
    value?: number
  ): Promise<void> {
    await this.trackEvent({
      eventName: FacebookPixelEvent.VIEW_CONTENT,
      contentIds: productIds,
      contentType: "product",
      value,
      currency: "RON",
      customData: {
        source: "blog_traffic",
        blog_id: blogId,
        romanian_market: true,
        conversion_potential: "high",
      },
    });
  }

  /**
   * Track Romanian purchase from blog traffic
   */
  async trackPurchaseFromBlog(
    blogId: string,
    orderId: string,
    value: number,
    productIds: string[]
  ): Promise<void> {
    await this.trackEvent({
      eventName: FacebookPixelEvent.PURCHASE,
      eventId: orderId,
      contentIds: productIds,
      contentType: "product",
      value,
      currency: "RON",
      customData: {
        source: "blog_traffic",
        blog_id: blogId,
        romanian_conversion: true,
        viral_conversion: true,
      },
    });
  }

  /**
   * Update viral metrics in database
   */
  private async updateViralMetrics(
    blogId: string,
    updates: { shares?: number }
  ): Promise<void> {
    try {
      // This would integrate with the viral metrics service
      // For now, just log the update
      console.log("Updating viral metrics for blog:", blogId, updates);
    } catch (error) {
      console.error("Failed to update viral metrics:", error);
    }
  }

  /**
   * Hash string for Facebook privacy compliance
   */
  private hashString(str: string): string {
    // Simple hash for development - use proper SHA256 in production
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  }

  /**
   * Get Romanian viral tracking data
   */
  async getViralTrackingData(
    blogId: string
  ): Promise<RomanianViralTrackingData | null> {
    // Mock data for development - would fetch from Facebook Insights API
    return {
      blogId,
      shares: 247,
      facebookShares: 189,
      viralCoefficient: 1.8,
      reach: 15420,
      engagement: 892,
      timeSpent: 4.2, // minutes
      romanianEngagement: 734,
    };
  }

  /**
   * Generate Facebook Pixel script for client-side tracking
   */
  generatePixelScript(): string {
    if (!this.pixelId) {
      return "";
    }

    return `
      <!-- Facebook Pixel Code -->
      <script>
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${this.pixelId}');
        fbq('track', 'PageView');

        // Romanian market specific tracking
        fbq('trackCustom', 'RomanianSTEMView', {
          content_type: 'stem_education',
          market: 'romania',
          language: 'ro'
        });
      </script>
      <noscript>
        <img height="1" width="1" style="display:none"
          src="https://www.facebook.com/tr?id=${this.pixelId}&ev=PageView&noscript=1"
        />
      </noscript>
      <!-- End Facebook Pixel Code -->
    `;
  }

  /**
   * Generate Romanian-specific tracking events
   */
  generateRomanianTrackingEvents(): string {
    return `
      <!-- Romanian Viral Content Tracking -->
      <script>
        // Track viral shares from Romanian social media
        function trackViralShare(blogId, platform) {
          fbq('trackCustom', 'ViralShare', {
            blog_id: blogId,
            platform: platform,
            market: 'romania',
            viral_content: true
          });
        }

        // Track Romanian blog engagement
        function trackBlogEngagement(blogId, engagementType, timeSpent) {
          fbq('trackCustom', 'BlogEngagement', {
            blog_id: blogId,
            engagement_type: engagementType,
            time_spent: timeSpent,
            romanian_audience: true,
            market: 'romania'
          });
        }

        // Track product views from Romanian blog traffic
        function trackProductViewFromBlog(blogId, productId) {
          fbq('track', 'ViewContent', {
            content_ids: [productId],
            content_type: 'product',
            content_name: 'STEM Toy from Blog',
            value: 0,
            currency: 'RON',
            custom_data: {
              source: 'blog_traffic',
              blog_id: blogId,
              market: 'romania',
              conversion_potential: 'high'
            }
          });
        }

        // Romanian purchase tracking
        function trackRomanianPurchase(orderId, value, productIds, blogId) {
          fbq('track', 'Purchase', {
            content_ids: productIds,
            content_type: 'product',
            value: value,
            currency: 'RON',
            custom_data: {
              order_id: orderId,
              source: blogId ? 'blog_traffic' : 'direct',
              blog_id: blogId,
              market: 'romania',
              viral_conversion: !!blogId
            }
          });
        }
      </script>
    `;
  }
}

// Export singleton instance
export const facebookPixelService = new FacebookPixelService();
