/**
 * Social Media Marketing API
 * Endpoint for social media posting and auto-sharing
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SocialMediaService } from "@/lib/social-media/social-media-service";

// POST - Post to social media platforms
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      content,
      images,
      hashtags,
      url,
      scheduledTime,
      platforms, // Optional: specific platforms to post to
    } = body;

    // Validate required fields
    if (!content) {
      return NextResponse.json(
        { error: "Missing required field: content" },
        { status: 400 }
      );
    }

    let results;

    if (platforms && Array.isArray(platforms)) {
      // Post to specific platforms
      results = [];
      for (const platform of platforms) {
        const result = await SocialMediaService.postToPlatform(platform, {
          content,
          images,
          hashtags,
          url,
          scheduledTime,
        });
        results.push(result);
      }
    } else {
      // Post to all enabled platforms
      results = await SocialMediaService.postToAllPlatforms({
        content,
        images,
        hashtags,
        url,
        scheduledTime,
      });
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    return NextResponse.json({
      success: successCount > 0,
      results,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: totalCount - successCount,
      },
      message: `Posted to ${successCount}/${totalCount} platforms successfully`,
    });
  } catch (error) {
    console.error("Error posting to social media:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to post to social media",
      },
      { status: 500 }
    );
  }
}

// GET - Test social media configuration
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Test social media configuration with a test post
    const testResults = await SocialMediaService.postToAllPlatforms({
      content:
        "🧪 Test post from TechTots marketing system - configuration working correctly! #TechTots #Test",
      hashtags: ["#TechTots", "#Test", "#Marketing"],
    });

    const successCount = testResults.filter(r => r.success).length;
    const totalCount = testResults.length;

    return NextResponse.json({
      success: successCount > 0,
      results: testResults,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: totalCount - successCount,
      },
      message: `Social media configuration test: ${successCount}/${totalCount} platforms working`,
    });
  } catch (error) {
    console.error("Error testing social media configuration:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test social media configuration",
      },
      { status: 500 }
    );
  }
}
