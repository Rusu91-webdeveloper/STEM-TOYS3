/**
 * Web Vitals Analytics API
 * Tracks Core Web Vitals for SEO performance monitoring
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const webVitalsSchema = z.object({
  name: z.enum(["CLS", "FID", "FCP", "LCP", "TTFB", "INP"]), // Added INP support
  value: z.number(),
  id: z.string(),
  url: z.string().url(),
  timestamp: z
    .number()
    .optional()
    .default(() => Date.now()), // Make timestamp optional with default
  userAgent: z.string().optional(),
  connectionType: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // **PERFORMANCE (DEV)**: In development, short-circuit to reduce TTFB noise
    if (process.env.NODE_ENV === "development") {
      // Drain body quickly to avoid hanging connections
      try {
        await request.arrayBuffer();
      } catch (_) {}
      return NextResponse.json({ success: true, dev: true });
    }
    // **FIX**: Handle empty request body gracefully
    let body;
    try {
      const text = await request.text();
      if (!text || text.trim() === "") {
        console.warn("Empty Web Vitals request body");
        return NextResponse.json(
          { success: false, error: "Empty request body" },
          { status: 400 }
        );
      }
      body = JSON.parse(text);
    } catch (jsonError) {
      console.warn("Web Vitals JSON parsing error:", jsonError.message);
      return NextResponse.json(
        { success: false, error: "Invalid JSON format" },
        { status: 400 }
      );
    }

    // Add additional validation and sanitization
    if (!body || typeof body !== "object") {
      console.warn("Invalid Web Vitals payload:", body);
      return NextResponse.json(
        { success: false, error: "Invalid payload structure" },
        { status: 400 }
      );
    }

    const validatedData = webVitalsSchema.parse(body);

    // Map metric names to database field names
    const metricFieldMap = {
      CLS: "cls",
      FID: "fid",
      FCP: "fcp",
      LCP: "lcp",
      TTFB: "ttfb",
      INP: "fid", // INP replaces FID in newer web vitals
    } as const;

    const metricField =
      metricFieldMap[validatedData.name as keyof typeof metricFieldMap];

    if (!metricField) {
      console.warn(`Unknown metric name: ${validatedData.name}`);
      return NextResponse.json(
        { success: false, error: `Unknown metric: ${validatedData.name}` },
        { status: 400 }
      );
    }

    // Create a record with the specific metric field set
    const metricData: any = {
      [metricField]: validatedData.value,
      url: validatedData.url,
      timestamp: new Date(validatedData.timestamp || Date.now()),
      userAgent:
        validatedData.userAgent || request.headers.get("user-agent") || "",
      metadata: {
        connectionType: validatedData.connectionType,
        referrer: request.headers.get("referer"),
        country: request.geo?.country || "RO",
        metricId: validatedData.id,
        metricName: validatedData.name,
      },
    };

    // Store in database for analysis
    await db.performanceMetric.create({
      data: metricData,
    });

    // Check if metrics exceed thresholds and log warnings
    const thresholds = {
      LCP: 2500, // 2.5 seconds
      FID: 100, // 100ms
      CLS: 0.1, // 0.1
      FCP: 1800, // 1.8 seconds
      TTFB: 800, // 800ms
      INP: 200, // 200ms - Interaction to Next Paint
    };

    const threshold = thresholds[validatedData.name as keyof typeof thresholds];
    if (threshold && validatedData.value > threshold) {
      console.warn(
        `⚠️  Poor ${validatedData.name} detected: ${validatedData.value} (threshold: ${threshold})`
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Handle Zod validation errors more gracefully
    if (error instanceof z.ZodError) {
      console.warn("Web Vitals validation error:", {
        issues: error.issues.map(issue => ({
          field: issue.path.join("."),
          message: issue.message,
          received:
            issue.code === "invalid_type" ? (issue as any).received : undefined,
        })),
      });
      return NextResponse.json(
        {
          success: false,
          error: "Invalid web vitals data",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error("Web Vitals tracking error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to track web vitals" },
      { status: 500 }
    );
  }
}

// GET - Web Vitals Snapshot Data (for WebVitalsSnapshot component)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "7"); // Default to 7 days for snapshot

    const whereClause = {
      timestamp: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    };

    // Get all recent metrics
    const metrics = await db.performanceMetric.findMany({
      where: whereClause,
      orderBy: {
        timestamp: "desc",
      },
      take: 1000, // Limit for performance
    });

    // Group metrics by type and calculate aggregations
    const metricGroups: Record<
      string,
      { values: number[]; timestamps: number[] }
    > = {};

    metrics.forEach(metric => {
      // Extract metric values from the record
      const metricTypes = ["cls", "fid", "fcp", "lcp", "ttfb"] as const;

      metricTypes.forEach(type => {
        const value = (metric as any)[type];
        if (value !== null && value !== undefined && value !== 0) {
          if (!metricGroups[type]) {
            metricGroups[type] = { values: [], timestamps: [] };
          }
          metricGroups[type].values.push(value);
          metricGroups[type].timestamps.push(metric.timestamp.getTime());
        }
      });
    });

    // Calculate aggregations for each metric type
    const result: Record<
      string,
      {
        count: number;
        avg: number;
        p75: number;
        last: { value?: number; rating?: string; ts?: number } | null;
      }
    > = {};

    Object.entries(metricGroups).forEach(([metricName, data]) => {
      if (data.values.length === 0) return;

      const sortedValues = data.values.sort((a, b) => a - b);
      const avg =
        data.values.reduce((sum, val) => sum + val, 0) / data.values.length;

      // Calculate 75th percentile
      const p75Index = Math.floor(sortedValues.length * 0.75);
      const p75 = sortedValues[p75Index];

      // Get last value (most recent)
      const lastIndex = data.timestamps.indexOf(Math.max(...data.timestamps));
      const lastValue = data.values[lastIndex];

      // Calculate rating
      const thresholds = {
        cls: { good: 0.1, poor: 0.25 },
        fid: { good: 100, poor: 300 },
        fcp: { good: 1800, poor: 3000 },
        lcp: { good: 2500, poor: 4000 },
        ttfb: { good: 800, poor: 1800 },
      };

      const threshold = thresholds[metricName as keyof typeof thresholds];
      let rating = "good";
      if (threshold && lastValue > threshold.poor) {
        rating = "poor";
      } else if (threshold && lastValue > threshold.good) {
        rating = "needs-improvement";
      }

      result[metricName.toUpperCase()] = {
        count: data.values.length,
        avg: Math.round(avg * 100) / 100,
        p75: Math.round(p75 * 100) / 100,
        last: {
          value: Math.round(lastValue * 100) / 100,
          rating,
          ts: data.timestamps[lastIndex],
        },
      };
    });

    return NextResponse.json({
      redis: false, // We're using database, not Redis
      data: result,
    });
  } catch (error) {
    console.error("Web Vitals snapshot error:", error);
    return NextResponse.json(
      { error: "Failed to fetch web vitals snapshot" },
      { status: 500 }
    );
  }
}
