import { NextRequest, NextResponse } from "next/server";

import {
  isEmailMarketingEnabled,
  getEmailMarketingConfig,
  getEmailTemplate,
  isSocialMediaEnabled,
  isSocialPlatformEnabled,
  getSocialPlatformConfig,
  isAutoSharingEnabled,
  arePromotionalCampaignsEnabled,
  isCampaignTypeEnabled,
  getCampaignConfig,
  getDiscountRules,
  isCustomerSegmentationEnabled,
  isCustomerSegmentEnabled,
  getCustomerSegmentConfig,
  isMarketingAutomationEnabled,
  isWorkflowEnabled,
  getWorkflowConfig,
  isTriggerEnabled,
  isAnalyticsEnabled,
  isTrackingEnabled,
  getTrackingConfig,
  getAnalyticsGoals,
  isContentMarketingEnabled,
  isBlogEnabled,
  getBlogConfig,
  isSEOEnabled,
  getSEOConfig,
  isInfluencerMarketingEnabled,
  getInfluencerMarketingConfig,
  calculateDiscountAmount,
  canApplyDiscountToCategory,
  canStackDiscounts,
  isDiscountOneTimeUse,
} from "@/lib/utils/marketing-settings";

/**
 * POST - Test marketing settings functionality
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      originalPrice,
      discountPercent,
      orderTotal,
      categoryId,
      platform,
      contentType,
      campaignType,
      segment,
      workflow,
      trigger,
      tracking,
      templateType,
    } = body;

    // Test all marketing settings functions
    const results = {
      // Email marketing
      emailMarketingEnabled: await isEmailMarketingEnabled(),
      emailMarketingConfig: await getEmailMarketingConfig(),
      emailTemplate: await getEmailTemplate(templateType || "welcome"),

      // Social media
      socialMediaEnabled: await isSocialMediaEnabled(),
      socialPlatformEnabled: await isSocialPlatformEnabled(
        platform || "facebook"
      ),
      socialPlatformConfig: await getSocialPlatformConfig(
        platform || "facebook"
      ),
      autoSharingEnabled: await isAutoSharingEnabled(
        contentType || "newProducts"
      ),

      // Promotional campaigns
      promotionalCampaignsEnabled: await arePromotionalCampaignsEnabled(),
      campaignTypeEnabled: await isCampaignTypeEnabled(
        campaignType || "flashSales"
      ),
      campaignConfig: await getCampaignConfig(campaignType || "flashSales"),
      discountRules: await getDiscountRules(),
      discountAmount: await calculateDiscountAmount(
        originalPrice || 100,
        discountPercent || 10,
        orderTotal || 50
      ),
      canApplyToCategory: await canApplyDiscountToCategory(
        categoryId || "test-category"
      ),
      canStackDiscounts: await canStackDiscounts(),
      isOneTimeUse: await isDiscountOneTimeUse(),

      // Customer segmentation
      customerSegmentationEnabled: await isCustomerSegmentationEnabled(),
      customerSegmentEnabled: await isCustomerSegmentEnabled(
        segment || "newCustomers"
      ),
      customerSegmentConfig: await getCustomerSegmentConfig(
        segment || "newCustomers"
      ),

      // Marketing automation
      marketingAutomationEnabled: await isMarketingAutomationEnabled(),
      workflowEnabled: await isWorkflowEnabled(workflow || "welcomeSeries"),
      workflowConfig: await getWorkflowConfig(workflow || "welcomeSeries"),
      triggerEnabled: await isTriggerEnabled(trigger || "newCustomer"),

      // Analytics
      analyticsEnabled: await isAnalyticsEnabled(),
      trackingEnabled: await isTrackingEnabled(tracking || "googleAnalytics"),
      trackingConfig: await getTrackingConfig(tracking || "googleAnalytics"),
      analyticsGoals: await getAnalyticsGoals(),

      // Content marketing
      contentMarketingEnabled: await isContentMarketingEnabled(),
      blogEnabled: await isBlogEnabled(),
      blogConfig: await getBlogConfig(),
      seoEnabled: await isSEOEnabled(),
      seoConfig: await getSEOConfig(),
      influencerMarketingEnabled: await isInfluencerMarketingEnabled(),
      influencerMarketingConfig: await getInfluencerMarketingConfig(),
    };

    return NextResponse.json({
      success: true,
      data: results,
      message: "Marketing settings test completed successfully",
    });
  } catch (error) {
    console.error("Error testing marketing settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test marketing settings functionality",
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Get current marketing settings
 */
export async function GET() {
  try {
    const { getMarketingSettings } = await import(
      "@/lib/utils/marketing-settings"
    );
    const settings = await getMarketingSettings();

    return NextResponse.json({
      success: true,
      data: settings,
      message: "Marketing settings retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting marketing settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get marketing settings",
      },
      { status: 500 }
    );
  }
}
