"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface MarketingSettings {
  // Email marketing
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

  // Social media integration
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

  // Promotional campaigns
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

  // Customer segmentation
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

  // Marketing automation
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

  // Analytics and tracking
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

  // Content marketing
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

interface MarketingSettingsProps {
  marketingSettings: MarketingSettings;
  onSave: (marketingSettings: MarketingSettings) => void;
  isSaving: boolean;
}

export default function MarketingSettings({
  marketingSettings,
  onSave,
  isSaving,
}: MarketingSettingsProps) {
  const [localMarketingSettings, setLocalMarketingSettings] =
    React.useState<MarketingSettings>(marketingSettings);

  const updateField = (path: string, value: any) => {
    setLocalMarketingSettings(prev => {
      const newState = { ...prev };
      const keys = path.split(".");
      let current: any = newState;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newState;
    });
  };

  const handleSave = () => {
    onSave(localMarketingSettings);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Marketing & Promotional Settings</CardTitle>
        <CardDescription>
          Configure email marketing, social media integration, promotional
          campaigns, customer segmentation, and marketing automation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Marketing */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Email Marketing</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email-marketing-enabled">
                Enable Email Marketing
              </Label>
              <Switch
                checked={localMarketingSettings.emailMarketing.enabled}
                onCheckedChange={checked =>
                  updateField("emailMarketing.enabled", checked)
                }
                id="email-marketing-enabled"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-provider">Email Provider</Label>
              <Select
                value={localMarketingSettings.emailMarketing.provider}
                onValueChange={value =>
                  updateField("emailMarketing.provider", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                  <SelectItem value="mailchimp">Mailchimp</SelectItem>
                  <SelectItem value="brevo">Brevo</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                value={localMarketingSettings.emailMarketing.apiKey}
                onChange={e =>
                  updateField("emailMarketing.apiKey", e.target.value)
                }
                type="password"
                placeholder="Enter API key"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-email">From Email</Label>
              <Input
                id="from-email"
                value={localMarketingSettings.emailMarketing.fromEmail}
                onChange={e =>
                  updateField("emailMarketing.fromEmail", e.target.value)
                }
                type="email"
                placeholder="noreply@techtots.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="from-name">From Name</Label>
              <Input
                id="from-name"
                value={localMarketingSettings.emailMarketing.fromName}
                onChange={e =>
                  updateField("emailMarketing.fromName", e.target.value)
                }
                type="text"
                placeholder="TechTots"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reply-to-email">Reply To Email</Label>
              <Input
                id="reply-to-email"
                value={localMarketingSettings.emailMarketing.replyToEmail}
                onChange={e =>
                  updateField("emailMarketing.replyToEmail", e.target.value)
                }
                type="email"
                placeholder="support@techtots.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="double-opt-in">Double Opt-In</Label>
              <Switch
                checked={localMarketingSettings.emailMarketing.doubleOptIn}
                onCheckedChange={checked =>
                  updateField("emailMarketing.doubleOptIn", checked)
                }
                id="double-opt-in"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unsubscribe-required">Unsubscribe Required</Label>
              <Switch
                checked={
                  localMarketingSettings.emailMarketing.unsubscribeRequired
                }
                onCheckedChange={checked =>
                  updateField("emailMarketing.unsubscribeRequired", checked)
                }
                id="unsubscribe-required"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Social Media Integration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Social Media Integration</h3>
          <div className="space-y-2">
            <Label htmlFor="social-media-enabled">
              Enable Social Media Integration
            </Label>
            <Switch
              checked={localMarketingSettings.socialMedia.enabled}
              onCheckedChange={checked =>
                updateField("socialMedia.enabled", checked)
              }
              id="social-media-enabled"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="facebook-enabled">Facebook</Label>
              <Switch
                checked={
                  localMarketingSettings.socialMedia.platforms.facebook.enabled
                }
                onCheckedChange={checked =>
                  updateField("socialMedia.platforms.facebook.enabled", checked)
                }
                id="facebook-enabled"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram-enabled">Instagram</Label>
              <Switch
                checked={
                  localMarketingSettings.socialMedia.platforms.instagram.enabled
                }
                onCheckedChange={checked =>
                  updateField(
                    "socialMedia.platforms.instagram.enabled",
                    checked
                  )
                }
                id="instagram-enabled"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter-enabled">Twitter</Label>
              <Switch
                checked={
                  localMarketingSettings.socialMedia.platforms.twitter.enabled
                }
                onCheckedChange={checked =>
                  updateField("socialMedia.platforms.twitter.enabled", checked)
                }
                id="twitter-enabled"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin-enabled">LinkedIn</Label>
              <Switch
                checked={
                  localMarketingSettings.socialMedia.platforms.linkedin.enabled
                }
                onCheckedChange={checked =>
                  updateField("socialMedia.platforms.linkedin.enabled", checked)
                }
                id="linkedin-enabled"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-md font-medium">Auto Sharing</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="share-new-products">Share New Products</Label>
                <Switch
                  checked={
                    localMarketingSettings.socialMedia.autoSharing.newProducts
                  }
                  onCheckedChange={checked =>
                    updateField("socialMedia.autoSharing.newProducts", checked)
                  }
                  id="share-new-products"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="share-blog-posts">Share Blog Posts</Label>
                <Switch
                  checked={
                    localMarketingSettings.socialMedia.autoSharing.blogPosts
                  }
                  onCheckedChange={checked =>
                    updateField("socialMedia.autoSharing.blogPosts", checked)
                  }
                  id="share-blog-posts"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="share-promotions">Share Promotions</Label>
                <Switch
                  checked={
                    localMarketingSettings.socialMedia.autoSharing.promotions
                  }
                  onCheckedChange={checked =>
                    updateField("socialMedia.autoSharing.promotions", checked)
                  }
                  id="share-promotions"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="share-reviews">Share Customer Reviews</Label>
                <Switch
                  checked={
                    localMarketingSettings.socialMedia.autoSharing
                      .customerReviews
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "socialMedia.autoSharing.customerReviews",
                      checked
                    )
                  }
                  id="share-reviews"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Promotional Campaigns */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Promotional Campaigns</h3>
          <div className="space-y-2">
            <Label htmlFor="promotional-campaigns-enabled">
              Enable Promotional Campaigns
            </Label>
            <Switch
              checked={localMarketingSettings.promotionalCampaigns.enabled}
              onCheckedChange={checked =>
                updateField("promotionalCampaigns.enabled", checked)
              }
              id="promotional-campaigns-enabled"
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-md font-medium">Campaign Types</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="flash-sales-enabled">Flash Sales</Label>
                <Switch
                  checked={
                    localMarketingSettings.promotionalCampaigns.campaignTypes
                      .flashSales.enabled
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "promotionalCampaigns.campaignTypes.flashSales.enabled",
                      checked
                    )
                  }
                  id="flash-sales-enabled"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seasonal-sales-enabled">Seasonal Sales</Label>
                <Switch
                  checked={
                    localMarketingSettings.promotionalCampaigns.campaignTypes
                      .seasonalSales.enabled
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "promotionalCampaigns.campaignTypes.seasonalSales.enabled",
                      checked
                    )
                  }
                  id="seasonal-sales-enabled"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loyalty-program-enabled">Loyalty Program</Label>
                <Switch
                  checked={
                    localMarketingSettings.promotionalCampaigns.campaignTypes
                      .loyaltyProgram.enabled
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "promotionalCampaigns.campaignTypes.loyaltyProgram.enabled",
                      checked
                    )
                  }
                  id="loyalty-program-enabled"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referral-program-enabled">
                  Referral Program
                </Label>
                <Switch
                  checked={
                    localMarketingSettings.promotionalCampaigns.campaignTypes
                      .referralProgram.enabled
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "promotionalCampaigns.campaignTypes.referralProgram.enabled",
                      checked
                    )
                  }
                  id="referral-program-enabled"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthday-offers-enabled">Birthday Offers</Label>
                <Switch
                  checked={
                    localMarketingSettings.promotionalCampaigns.campaignTypes
                      .birthdayOffers.enabled
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "promotionalCampaigns.campaignTypes.birthdayOffers.enabled",
                      checked
                    )
                  }
                  id="birthday-offers-enabled"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="first-time-buyer-enabled">
                  First Time Buyer
                </Label>
                <Switch
                  checked={
                    localMarketingSettings.promotionalCampaigns.campaignTypes
                      .firstTimeBuyer.enabled
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "promotionalCampaigns.campaignTypes.firstTimeBuyer.enabled",
                      checked
                    )
                  }
                  id="first-time-buyer-enabled"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-md font-medium">Discount Rules</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="max-discount-percent">
                  Max Discount Percent
                </Label>
                <Input
                  id="max-discount-percent"
                  value={
                    localMarketingSettings.promotionalCampaigns.discountRules
                      .maxDiscountPercent
                  }
                  onChange={e =>
                    updateField(
                      "promotionalCampaigns.discountRules.maxDiscountPercent",
                      parseInt(e.target.value) || 0
                    )
                  }
                  type="number"
                  min="0"
                  max="100"
                  placeholder="50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimum-order-amount">
                  Minimum Order Amount
                </Label>
                <Input
                  id="minimum-order-amount"
                  value={
                    localMarketingSettings.promotionalCampaigns.discountRules
                      .minimumOrderAmount
                  }
                  onChange={e =>
                    updateField(
                      "promotionalCampaigns.discountRules.minimumOrderAmount",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="25.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="stackable-discounts">Stackable Discounts</Label>
                <Switch
                  checked={
                    localMarketingSettings.promotionalCampaigns.discountRules
                      .stackableDiscounts
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "promotionalCampaigns.discountRules.stackableDiscounts",
                      checked
                    )
                  }
                  id="stackable-discounts"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="one-time-use">One Time Use</Label>
                <Switch
                  checked={
                    localMarketingSettings.promotionalCampaigns.discountRules
                      .oneTimeUse
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "promotionalCampaigns.discountRules.oneTimeUse",
                      checked
                    )
                  }
                  id="one-time-use"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Customer Segmentation */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Customer Segmentation</h3>
          <div className="space-y-2">
            <Label htmlFor="customer-segmentation-enabled">
              Enable Customer Segmentation
            </Label>
            <Switch
              checked={localMarketingSettings.customerSegmentation.enabled}
              onCheckedChange={checked =>
                updateField("customerSegmentation.enabled", checked)
              }
              id="customer-segmentation-enabled"
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-md font-medium">Segments</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-customers-enabled">New Customers</Label>
                <Switch
                  checked={
                    localMarketingSettings.customerSegmentation.segments
                      .newCustomers.enabled
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "customerSegmentation.segments.newCustomers.enabled",
                      checked
                    )
                  }
                  id="new-customers-enabled"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="returning-customers-enabled">
                  Returning Customers
                </Label>
                <Switch
                  checked={
                    localMarketingSettings.customerSegmentation.segments
                      .returningCustomers.enabled
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "customerSegmentation.segments.returningCustomers.enabled",
                      checked
                    )
                  }
                  id="returning-customers-enabled"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="high-value-customers-enabled">
                  High Value Customers
                </Label>
                <Switch
                  checked={
                    localMarketingSettings.customerSegmentation.segments
                      .highValueCustomers.enabled
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "customerSegmentation.segments.highValueCustomers.enabled",
                      checked
                    )
                  }
                  id="high-value-customers-enabled"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inactive-customers-enabled">
                  Inactive Customers
                </Label>
                <Switch
                  checked={
                    localMarketingSettings.customerSegmentation.segments
                      .inactiveCustomers.enabled
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "customerSegmentation.segments.inactiveCustomers.enabled",
                      checked
                    )
                  }
                  id="inactive-customers-enabled"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cart-abandoners-enabled">Cart Abandoners</Label>
                <Switch
                  checked={
                    localMarketingSettings.customerSegmentation.segments
                      .cartAbandoners.enabled
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "customerSegmentation.segments.cartAbandoners.enabled",
                      checked
                    )
                  }
                  id="cart-abandoners-enabled"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-lovers-enabled">Category Lovers</Label>
                <Switch
                  checked={
                    localMarketingSettings.customerSegmentation.segments
                      .productCategoryLovers.enabled
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "customerSegmentation.segments.productCategoryLovers.enabled",
                      checked
                    )
                  }
                  id="category-lovers-enabled"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Marketing Automation */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Marketing Automation</h3>
          <div className="space-y-2">
            <Label htmlFor="marketing-automation-enabled">
              Enable Marketing Automation
            </Label>
            <Switch
              checked={localMarketingSettings.marketingAutomation.enabled}
              onCheckedChange={checked =>
                updateField("marketingAutomation.enabled", checked)
              }
              id="marketing-automation-enabled"
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-md font-medium">Workflows</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="welcome-series-enabled">Welcome Series</Label>
                <Switch
                  checked={
                    localMarketingSettings.marketingAutomation.workflows
                      .welcomeSeries.enabled
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "marketingAutomation.workflows.welcomeSeries.enabled",
                      checked
                    )
                  }
                  id="welcome-series-enabled"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="abandoned-cart-enabled">Abandoned Cart</Label>
                <Switch
                  checked={
                    localMarketingSettings.marketingAutomation.workflows
                      .abandonedCart.enabled
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "marketingAutomation.workflows.abandonedCart.enabled",
                      checked
                    )
                  }
                  id="abandoned-cart-enabled"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="post-purchase-enabled">Post Purchase</Label>
                <Switch
                  checked={
                    localMarketingSettings.marketingAutomation.workflows
                      .postPurchase.enabled
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "marketingAutomation.workflows.postPurchase.enabled",
                      checked
                    )
                  }
                  id="post-purchase-enabled"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="re-engagement-enabled">Re-engagement</Label>
                <Switch
                  checked={
                    localMarketingSettings.marketingAutomation.workflows
                      .reEngagement.enabled
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "marketingAutomation.workflows.reEngagement.enabled",
                      checked
                    )
                  }
                  id="re-engagement-enabled"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Analytics and Tracking */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Analytics and Tracking</h3>
          <div className="space-y-2">
            <Label htmlFor="analytics-enabled">Enable Analytics</Label>
            <Switch
              checked={localMarketingSettings.analytics.enabled}
              onCheckedChange={checked =>
                updateField("analytics.enabled", checked)
              }
              id="analytics-enabled"
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-md font-medium">Tracking</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="google-analytics-enabled">
                  Google Analytics
                </Label>
                <Switch
                  checked={
                    localMarketingSettings.analytics.tracking.googleAnalytics
                      .enabled
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "analytics.tracking.googleAnalytics.enabled",
                      checked
                    )
                  }
                  id="google-analytics-enabled"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook-pixel-enabled">Facebook Pixel</Label>
                <Switch
                  checked={
                    localMarketingSettings.analytics.tracking.facebookPixel
                      .enabled
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "analytics.tracking.facebookPixel.enabled",
                      checked
                    )
                  }
                  id="facebook-pixel-enabled"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="google-ads-enabled">Google Ads</Label>
                <Switch
                  checked={
                    localMarketingSettings.analytics.tracking.googleAds.enabled
                  }
                  onCheckedChange={checked =>
                    updateField("analytics.tracking.googleAds.enabled", checked)
                  }
                  id="google-ads-enabled"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tiktok-pixel-enabled">TikTok Pixel</Label>
                <Switch
                  checked={
                    localMarketingSettings.analytics.tracking.tiktokPixel
                      .enabled
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "analytics.tracking.tiktokPixel.enabled",
                      checked
                    )
                  }
                  id="tiktok-pixel-enabled"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-md font-medium">Goals</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="revenue-target">Revenue Target (LEI)</Label>
                <Input
                  id="revenue-target"
                  value={localMarketingSettings.analytics.goals.revenueTarget}
                  onChange={e =>
                    updateField(
                      "analytics.goals.revenueTarget",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="10000.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conversion-rate">Conversion Rate (%)</Label>
                <Input
                  id="conversion-rate"
                  value={localMarketingSettings.analytics.goals.conversionRate}
                  onChange={e =>
                    updateField(
                      "analytics.goals.conversionRate",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="2.5"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Content Marketing */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Content Marketing</h3>
          <div className="space-y-2">
            <Label htmlFor="content-marketing-enabled">
              Enable Content Marketing
            </Label>
            <Switch
              checked={localMarketingSettings.contentMarketing.enabled}
              onCheckedChange={checked =>
                updateField("contentMarketing.enabled", checked)
              }
              id="content-marketing-enabled"
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-md font-medium">Blog</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="blog-enabled">Enable Blog</Label>
                <Switch
                  checked={localMarketingSettings.contentMarketing.blog.enabled}
                  onCheckedChange={checked =>
                    updateField("contentMarketing.blog.enabled", checked)
                  }
                  id="blog-enabled"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auto-publish">Auto Publish</Label>
                <Switch
                  checked={
                    localMarketingSettings.contentMarketing.blog.autoPublish
                  }
                  onCheckedChange={checked =>
                    updateField("contentMarketing.blog.autoPublish", checked)
                  }
                  id="auto-publish"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo-optimization">SEO Optimization</Label>
                <Switch
                  checked={
                    localMarketingSettings.contentMarketing.blog.seoOptimization
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "contentMarketing.blog.seoOptimization",
                      checked
                    )
                  }
                  id="seo-optimization"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social-sharing">Social Sharing</Label>
                <Switch
                  checked={
                    localMarketingSettings.contentMarketing.blog.socialSharing
                  }
                  onCheckedChange={checked =>
                    updateField("contentMarketing.blog.socialSharing", checked)
                  }
                  id="social-sharing"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-md font-medium">SEO</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="seo-enabled">Enable SEO</Label>
                <Switch
                  checked={localMarketingSettings.contentMarketing.seo.enabled}
                  onCheckedChange={checked =>
                    updateField("contentMarketing.seo.enabled", checked)
                  }
                  id="seo-enabled"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta-tags">Meta Tags</Label>
                <Switch
                  checked={localMarketingSettings.contentMarketing.seo.metaTags}
                  onCheckedChange={checked =>
                    updateField("contentMarketing.seo.metaTags", checked)
                  }
                  id="meta-tags"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="structured-data">Structured Data</Label>
                <Switch
                  checked={
                    localMarketingSettings.contentMarketing.seo.structuredData
                  }
                  onCheckedChange={checked =>
                    updateField("contentMarketing.seo.structuredData", checked)
                  }
                  id="structured-data"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sitemap-generation">Sitemap Generation</Label>
                <Switch
                  checked={
                    localMarketingSettings.contentMarketing.seo
                      .sitemapGeneration
                  }
                  onCheckedChange={checked =>
                    updateField(
                      "contentMarketing.seo.sitemapGeneration",
                      checked
                    )
                  }
                  id="sitemap-generation"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  );
}
