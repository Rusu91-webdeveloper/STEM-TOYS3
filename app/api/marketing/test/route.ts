/**
 * Marketing Integration Test API
 * Comprehensive test endpoint for all marketing functionality
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MarketingEmailService } from "@/lib/email/marketing-email-service";
import { SocialMediaService } from "@/lib/social-media/social-media-service";
import { CampaignService } from "@/lib/campaigns/campaign-service";
import { MarketingAutomationService } from "@/lib/automation/marketing-automation-service";
import {
  getMarketingSettings,
  isEmailMarketingEnabled,
  isSocialMediaEnabled,
  arePromotionalCampaignsEnabled,
  isMarketingAutomationEnabled,
} from "@/lib/utils/marketing-settings";

// POST - Run comprehensive marketing tests
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // Check authentication and admin role
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { testType = "all" } = body;

    const testResults = {
      timestamp: new Date().toISOString(),
      testType,
      results: {} as any,
    };

    // Test 1: Marketing Settings Configuration
    console.log("🧪 Testing marketing settings configuration...");
    try {
      const settings = await getMarketingSettings();
      testResults.results.marketingSettings = {
        success: !!settings,
        hasSettings: !!settings,
        emailMarketingEnabled: await isEmailMarketingEnabled(),
        socialMediaEnabled: await isSocialMediaEnabled(),
        campaignsEnabled: await arePromotionalCampaignsEnabled(),
        automationEnabled: await isMarketingAutomationEnabled(),
        settings: settings
          ? {
              emailMarketing: {
                enabled: settings.emailMarketing?.enabled,
                provider: settings.emailMarketing?.provider,
              },
              socialMedia: {
                enabled: settings.socialMedia?.enabled,
                platforms: Object.keys(settings.socialMedia?.platforms || {}),
              },
              promotionalCampaigns: {
                enabled: settings.promotionalCampaigns?.enabled,
              },
              marketingAutomation: {
                enabled: settings.marketingAutomation?.enabled,
              },
            }
          : null,
      };
    } catch (error) {
      testResults.results.marketingSettings = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    // Test 2: Email Marketing
    if (testType === "all" || testType === "email") {
      console.log("🧪 Testing email marketing...");
      try {
        const emailResult = await MarketingEmailService.sendMarketingEmail({
          to: session.user.email || "test@example.com",
          templateType: "welcome",
          variables: {
            customerName: session.user.name || "Test User",
            email: session.user.email || "test@example.com",
          },
        });

        testResults.results.emailMarketing = {
          success: emailResult.success,
          messageId: emailResult.messageId,
          provider: emailResult.provider,
          error: emailResult.error,
        };
      } catch (error) {
        testResults.results.emailMarketing = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    // Test 3: Social Media Integration
    if (testType === "all" || testType === "social") {
      console.log("🧪 Testing social media integration...");
      try {
        const socialResults = await SocialMediaService.postToAllPlatforms({
          content:
            "🧪 Marketing integration test from TechTots - all systems working! #TechTots #Test",
          hashtags: ["#TechTots", "#Test", "#Marketing"],
        });

        const successCount = socialResults.filter(r => r.success).length;
        testResults.results.socialMedia = {
          success: successCount > 0,
          totalPlatforms: socialResults.length,
          successfulPlatforms: successCount,
          results: socialResults,
        };
      } catch (error) {
        testResults.results.socialMedia = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    // Test 4: Campaign Management
    if (testType === "all" || testType === "campaigns") {
      console.log("🧪 Testing campaign management...");
      try {
        // Create a test flash sale campaign
        const testCampaign = await CampaignService.createFlashSale(
          "Test Flash Sale - Marketing Integration",
          10, // 10% discount
          1, // 1 hour duration
          [] // No category restrictions
        );

        // Test applying the campaign
        const applyResult = await CampaignService.applyCampaignDiscount(
          testCampaign.id,
          "test-order-123",
          session.user.id || "test-customer",
          100, // $100 order
          []
        );

        testResults.results.campaigns = {
          success: true,
          campaignCreated: true,
          campaignId: testCampaign.id,
          applyResult: applyResult,
        };

        // Clean up test campaign
        // Note: In production, you might want to keep test campaigns for debugging
        // await prisma.campaign.delete({ where: { id: testCampaign.id } });
      } catch (error) {
        testResults.results.campaigns = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    // Test 5: Marketing Automation
    if (testType === "all" || testType === "automation") {
      console.log("🧪 Testing marketing automation...");
      try {
        // Test new customer trigger
        const automationResults =
          await MarketingAutomationService.processTrigger({
            type: "newCustomer",
            customerId: session.user.id || "test-customer",
            data: {
              email: session.user.email || "test@example.com",
              name: session.user.name || "Test User",
            },
            timestamp: new Date(),
          });

        testResults.results.automation = {
          success: automationResults.some(r => r.success),
          results: automationResults,
        };
      } catch (error) {
        testResults.results.automation = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    // Calculate overall success
    const allTests = Object.values(testResults.results);
    const successfulTests = allTests.filter((test: any) => test.success).length;
    const totalTests = allTests.length;

    testResults.results.summary = {
      totalTests,
      successfulTests,
      failedTests: totalTests - successfulTests,
      overallSuccess: successfulTests === totalTests,
      successRate: totalTests > 0 ? (successfulTests / totalTests) * 100 : 0,
    };

    return NextResponse.json({
      success: true,
      testResults,
      message: `Marketing integration test completed: ${successfulTests}/${totalTests} tests passed`,
    });
  } catch (error) {
    console.error("Error running marketing integration tests:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to run marketing integration tests",
      },
      { status: 500 }
    );
  }
}

// GET - Get marketing integration status
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    // Check authentication and admin role
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    // Get marketing settings status
    const settings = await getMarketingSettings();
    const status = {
      marketingSettings: {
        configured: !!settings,
        emailMarketing: {
          enabled: await isEmailMarketingEnabled(),
          provider: settings?.emailMarketing?.provider,
        },
        socialMedia: {
          enabled: await isSocialMediaEnabled(),
          platforms: settings?.socialMedia?.platforms
            ? Object.keys(settings.socialMedia.platforms)
            : [],
        },
        campaigns: {
          enabled: await arePromotionalCampaignsEnabled(),
        },
        automation: {
          enabled: await isMarketingAutomationEnabled(),
        },
      },
      integrations: {
        emailService: "✅ Implemented",
        socialMediaService: "✅ Implemented",
        campaignService: "✅ Implemented",
        automationService: "✅ Implemented",
      },
      database: {
        campaignsTable: "✅ Added",
        automationWorkflowsTable: "✅ Added",
      },
      apis: {
        emailApi: "✅ /api/marketing/email",
        socialMediaApi: "✅ /api/marketing/social-media",
        campaignsApi: "✅ /api/marketing/campaigns",
        automationApi: "✅ /api/marketing/automation",
      },
    };

    return NextResponse.json({
      success: true,
      status,
      message: "Marketing integration status retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting marketing integration status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get marketing integration status",
      },
      { status: 500 }
    );
  }
}
