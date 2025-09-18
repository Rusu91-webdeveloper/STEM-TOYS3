/**
 * Web Vitals Analytics API
 * Tracks Core Web Vitals for SEO performance monitoring
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const webVitalsSchema = z.object({
  name: z.enum(["CLS", "FID", "FCP", "LCP", "TTFB"]),
  value: z.number(),
  id: z.string(),
  url: z.string().url(),
  timestamp: z.number(),
  userAgent: z.string().optional(),
  connectionType: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = webVitalsSchema.parse(body);

    // Store in database for analysis
    await db.performanceMetric.create({
      data: {
        metricName: validatedData.name,
        metricValue: validatedData.value,
        url: validatedData.url,
        timestamp: new Date(validatedData.timestamp),
        userAgent: validatedData.userAgent || request.headers.get("user-agent") || "",
        sessionId: validatedData.id,
        metadata: {
          connectionType: validatedData.connectionType,
          referrer: request.headers.get("referer"),
          country: request.geo?.country || "RO",
        },
      },
    });

    // Check if metrics exceed thresholds and alert
    const thresholds = {
      LCP: 2500, // 2.5 seconds
      FID: 100,  // 100ms
      CLS: 0.1,  // 0.1
      FCP: 1800, // 1.8 seconds
      TTFB: 800, // 800ms
    };

    const threshold = thresholds[validatedData.name as keyof typeof thresholds];
    if (validatedData.value > threshold) {
      console.warn(`⚠️  Poor ${validatedData.name} detected: ${validatedData.value} (threshold: ${threshold})`);
      
      // Log for performance optimization
      await db.performanceAlert.create({
        data: {
          metricName: validatedData.name,
          metricValue: validatedData.value,
          threshold: threshold,
          url: validatedData.url,
          severity: validatedData.value > threshold * 1.5 ? "HIGH" : "MEDIUM",
          createdAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Web Vitals tracking error:", error);
    return NextResponse.json(
      { error: "Failed to track web vitals" },
      { status: 500 }
    );
  }
}

// GET - Web Vitals Dashboard Data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "7");
    const url = searchParams.get("url");

    const whereClause = {
      timestamp: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
      ...(url && { url: { contains: url } }),
    };

    // Get average metrics
    const metrics = await db.performanceMetric.groupBy({
      by: ["metricName"],
      where: whereClause,
      _avg: {
        metricValue: true,
      },
      _count: {
        metricValue: true,
      },
    });

    // Get recent alerts
    const alerts = await db.performanceAlert.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    // Calculate performance scores
    const performanceScores = metrics.map(metric => {
      const avgValue = metric._avg.metricValue || 0;
      const thresholds = {
        LCP: { good: 2500, needsImprovement: 4000 },
        FID: { good: 100, needsImprovement: 300 },
        CLS: { good: 0.1, needsImprovement: 0.25 },
        FCP: { good: 1800, needsImprovement: 3000 },
        TTFB: { good: 800, needsImprovement: 1800 },
      };

      const threshold = thresholds[metric.metricName as keyof typeof thresholds];
      let score = "good";
      if (avgValue > threshold.needsImprovement) {
        score = "poor";
      } else if (avgValue > threshold.good) {
        score = "needs-improvement";
      }

      return {
        metric: metric.metricName,
        averageValue: avgValue,
        sampleCount: metric._count.metricValue,
        score,
        threshold: threshold.good,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        performanceScores,
        alerts: alerts.length,
        timeRange: `${days} days`,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Web Vitals dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch web vitals data" },
      { status: 500 }
    );
  }
}