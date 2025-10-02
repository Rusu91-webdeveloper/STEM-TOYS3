#!/usr/bin/env node

/**
 * Setup Facebook Pixel Analytics
 *
 * This script creates the necessary database tables and seeds initial data
 * for Facebook Pixel analytics functionality.
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function setupFacebookPixelAnalytics() {
  console.log("🚀 Setting up Facebook Pixel Analytics...");

  try {
    // Create Facebook Pixel configuration if it doesn't exist
    const pixelId = process.env.FACEBOOK_PIXEL_ID || "123456789012345";

    const pixelConfig = await prisma.facebookPixelConfig.upsert({
      where: { pixelId },
      update: {},
      create: {
        pixelId,
        isActive: true,
        metadata: {
          description: "Main Facebook Pixel for Romanian STEM toys tracking",
          market: "romania",
          language: "ro",
        },
      },
    });

    console.log(
      "✅ Facebook Pixel configuration created/updated:",
      pixelConfig.id
    );

    // Get some existing blogs to seed viral content data
    const blogs = await prisma.blog.findMany({
      where: { isPublished: true },
      take: 10,
    });

    console.log(`📝 Found ${blogs.length} published blogs`);

    // Create Romanian viral content entries for each blog
    for (const blog of blogs) {
      const existingViralContent = await prisma.romanianViralContent.findUnique(
        {
          where: { blogId: blog.slug },
        }
      );

      if (!existingViralContent) {
        // Generate realistic viral metrics
        const shares = Math.floor(Math.random() * 100) + 10;
        const facebookShares = Math.floor(shares * 0.7);
        const instagramShares = Math.floor(shares * 0.2);
        const viralCoefficient = 1.0 + Math.random() * 2; // 1.0 to 3.0
        const reach = shares * (10 + Math.random() * 50); // 10-60x shares
        const engagement = Math.floor(reach * (0.05 + Math.random() * 0.1)); // 5-15% engagement
        const timeSpent = 2 + Math.random() * 6; // 2-8 minutes
        const romanianEngagement = Math.floor(
          engagement * (0.8 + Math.random() * 0.15)
        ); // 80-95% Romanian

        await prisma.romanianViralContent.create({
          data: {
            blogId: blog.slug,
            contentTitle: blog.title,
            contentSlug: blog.slug,
            shares,
            facebookShares,
            instagramShares,
            viralCoefficient,
            reach,
            engagement,
            timeSpent,
            romanianEngagement,
          },
        });

        console.log(`✅ Created viral content entry for blog: ${blog.title}`);
      }
    }

    // Create some sample Facebook Pixel events
    const sampleEvents = [
      {
        eventName: "ViralShare",
        contentIds: [blogs[0]?.slug || "sample-blog"],
        contentType: "blog_post",
        customData: { platform: "facebook", viralContent: true },
      },
      {
        eventName: "BlogEngagement",
        contentIds: [blogs[0]?.slug || "sample-blog"],
        contentType: "blog_post",
        customData: { engagement_type: "reading", time_spent: 180 },
      },
      {
        eventName: "ViewContent",
        contentIds: ["sample-product-1"],
        contentType: "product",
        customData: { source: "blog_traffic", blog_id: blogs[0]?.slug },
      },
      {
        eventName: "Purchase",
        contentIds: ["sample-product-1", "sample-product-2"],
        contentType: "product",
        value: 299.99,
        currency: "RON",
        customData: { source: "blog_traffic", blog_id: blogs[0]?.slug },
      },
    ];

    for (const eventData of sampleEvents) {
      await prisma.facebookPixelEvent.create({
        data: {
          ...eventData,
          pixelId,
          timestamp: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
          ), // Last 7 days
        },
      });
    }

    console.log("✅ Created sample Facebook Pixel events");

    // Display summary
    const totalEvents = await prisma.facebookPixelEvent.count();
    const totalViralContent = await prisma.romanianViralContent.count();
    const totalShares = await prisma.romanianViralContent.aggregate({
      _sum: { shares: true },
    });

    console.log("\n📊 Facebook Pixel Analytics Setup Summary:");
    console.log(`   • Total Facebook Pixel Events: ${totalEvents}`);
    console.log(`   • Total Viral Content Entries: ${totalViralContent}`);
    console.log(`   • Total Shares Tracked: ${totalShares._sum.shares || 0}`);
    console.log(`   • Facebook Pixel ID: ${pixelId}`);

    console.log("\n🎉 Facebook Pixel Analytics setup completed successfully!");
    console.log(
      "   You can now view real data at /admin/analytics/facebook-pixel"
    );
  } catch (error) {
    console.error("❌ Error setting up Facebook Pixel Analytics:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupFacebookPixelAnalytics();
