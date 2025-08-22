import { onCLS, onFID, onFCP, onLCP, onTTFB } from "web-vitals";

export interface WebVitalsMetrics {
  CLS: number;
  FID: number;
  FCP: number;
  LCP: number;
  TTFB: number;
  timestamp: string;
  url: string;
  userAgent: string;
}

export interface PerformanceMetrics {
  navigationStart: number;
  loadEventEnd: number;
  domContentLoadedEventEnd: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToFirstByte: number;
  totalBlockingTime: number;
  speedIndex: number;
}

export interface PerformanceReport {
  webVitals: WebVitalsMetrics;
  performance: PerformanceMetrics;
  recommendations: string[];
  score: number;
}

/**
 * Initialize Core Web Vitals monitoring
 */
export function initializeWebVitalsMonitoring(
  onMetric: (metric: any) => void,
  options: {
    debug?: boolean;
    reportToAnalytics?: boolean;
    customThresholds?: {
      CLS?: number;
      FID?: number;
      FCP?: number;
      LCP?: number;
      TTFB?: number;
    };
  } = {}
): void {
  const {
    debug = false,
    reportToAnalytics = true,
    customThresholds = {
      CLS: 0.1,
      FID: 100,
      FCP: 1800,
      LCP: 2500,
      TTFB: 600,
    },
  } = options;

  // CLS (Cumulative Layout Shift)
  onCLS(metric => {
    if (debug) console.log("CLS:", metric);

    const isGood = metric.value < customThresholds.CLS!;
    const rating = isGood
      ? "good"
      : metric.value < customThresholds.CLS! * 2
        ? "needs-improvement"
        : "poor";

    onMetric({
      ...metric,
      rating,
      threshold: customThresholds.CLS,
    });
  });

  // FID (First Input Delay)
  onFID(metric => {
    if (debug) console.log("FID:", metric);

    const isGood = metric.value < customThresholds.FID!;
    const rating = isGood
      ? "good"
      : metric.value < customThresholds.FID! * 2
        ? "needs-improvement"
        : "poor";

    onMetric({
      ...metric,
      rating,
      threshold: customThresholds.FID,
    });
  });

  // FCP (First Contentful Paint)
  onFCP(metric => {
    if (debug) console.log("FCP:", metric);

    const isGood = metric.value < customThresholds.FCP!;
    const rating = isGood
      ? "good"
      : metric.value < customThresholds.FCP! * 2
        ? "needs-improvement"
        : "poor";

    onMetric({
      ...metric,
      rating,
      threshold: customThresholds.FCP,
    });
  });

  // LCP (Largest Contentful Paint)
  onLCP(metric => {
    if (debug) console.log("LCP:", metric);

    const isGood = metric.value < customThresholds.LCP!;
    const rating = isGood
      ? "good"
      : metric.value < customThresholds.LCP! * 2
        ? "needs-improvement"
        : "poor";

    onMetric({
      ...metric,
      rating,
      threshold: customThresholds.LCP,
    });
  });

  // TTFB (Time to First Byte)
  onTTFB(metric => {
    if (debug) console.log("TTFB:", metric);

    const isGood = metric.value < customThresholds.TTFB!;
    const rating = isGood
      ? "good"
      : metric.value < customThresholds.TTFB! * 2
        ? "needs-improvement"
        : "poor";

    onMetric({
      ...metric,
      rating,
      threshold: customThresholds.TTFB,
    });
  });
}

/**
 * Get comprehensive performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  if (typeof window === "undefined" || !window.performance) {
    return {
      navigationStart: 0,
      loadEventEnd: 0,
      domContentLoadedEventEnd: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      firstInputDelay: 0,
      cumulativeLayoutShift: 0,
      timeToFirstByte: 0,
      totalBlockingTime: 0,
      speedIndex: 0,
    };
  }

  const navigation = performance.getEntriesByType(
    "navigation"
  )[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType("paint");

  const fcp = paint.find(entry => entry.name === "first-contentful-paint");
  const lcp = paint.find(entry => entry.name === "largest-contentful-paint");

  return {
    navigationStart: navigation?.navigationStart || 0,
    loadEventEnd: navigation?.loadEventEnd || 0,
    domContentLoadedEventEnd: navigation?.domContentLoadedEventEnd || 0,
    firstContentfulPaint: fcp?.startTime || 0,
    largestContentfulPaint: lcp?.startTime || 0,
    firstInputDelay: 0, // Will be populated by web-vitals
    cumulativeLayoutShift: 0, // Will be populated by web-vitals
    timeToFirstByte: navigation?.responseStart || 0,
    totalBlockingTime: 0, // Will be populated by web-vitals
    speedIndex: 0, // Would need additional calculation
  };
}

/**
 * Calculate performance score based on Core Web Vitals
 */
export function calculatePerformanceScore(metrics: WebVitalsMetrics): number {
  const weights = {
    CLS: 0.25,
    FID: 0.25,
    FCP: 0.15,
    LCP: 0.25,
    TTFB: 0.1,
  };

  const thresholds = {
    CLS: { good: 0.1, needsImprovement: 0.25 },
    FID: { good: 100, needsImprovement: 300 },
    FCP: { good: 1800, needsImprovement: 3000 },
    LCP: { good: 2500, needsImprovement: 4000 },
    TTFB: { good: 600, needsImprovement: 1800 },
  };

  let totalScore = 0;

  // CLS (lower is better)
  if (metrics.CLS <= thresholds.CLS.good) {
    totalScore += weights.CLS * 100;
  } else if (metrics.CLS <= thresholds.CLS.needsImprovement) {
    totalScore += weights.CLS * 50;
  }

  // FID (lower is better)
  if (metrics.FID <= thresholds.FID.good) {
    totalScore += weights.FID * 100;
  } else if (metrics.FID <= thresholds.FID.needsImprovement) {
    totalScore += weights.FID * 50;
  }

  // FCP (lower is better)
  if (metrics.FCP <= thresholds.FCP.good) {
    totalScore += weights.FCP * 100;
  } else if (metrics.FCP <= thresholds.FCP.needsImprovement) {
    totalScore += weights.FCP * 50;
  }

  // LCP (lower is better)
  if (metrics.LCP <= thresholds.LCP.good) {
    totalScore += weights.LCP * 100;
  } else if (metrics.LCP <= thresholds.LCP.needsImprovement) {
    totalScore += weights.LCP * 50;
  }

  // TTFB (lower is better)
  if (metrics.TTFB <= thresholds.TTFB.good) {
    totalScore += weights.TTFB * 100;
  } else if (metrics.TTFB <= thresholds.TTFB.needsImprovement) {
    totalScore += weights.TTFB * 50;
  }

  return Math.round(totalScore);
}

/**
 * Generate performance recommendations
 */
export function generatePerformanceRecommendations(
  metrics: WebVitalsMetrics
): string[] {
  const recommendations: string[] = [];

  if (metrics.CLS > 0.1) {
    recommendations.push(
      "Optimize Cumulative Layout Shift (CLS): Ensure images have explicit width and height attributes"
    );
  }

  if (metrics.FID > 100) {
    recommendations.push(
      "Improve First Input Delay (FID): Reduce JavaScript execution time and optimize event handlers"
    );
  }

  if (metrics.FCP > 1800) {
    recommendations.push(
      "Optimize First Contentful Paint (FCP): Minimize render-blocking resources and optimize critical rendering path"
    );
  }

  if (metrics.LCP > 2500) {
    recommendations.push(
      "Improve Largest Contentful Paint (LCP): Optimize images, implement lazy loading, and use efficient image formats"
    );
  }

  if (metrics.TTFB > 600) {
    recommendations.push(
      "Reduce Time to First Byte (TTFB): Optimize server response time and implement caching strategies"
    );
  }

  return recommendations;
}

/**
 * Send performance data to analytics
 */
export async function sendPerformanceData(
  metrics: WebVitalsMetrics
): Promise<void> {
  try {
    // Send to your analytics endpoint
    await fetch("/api/analytics/performance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...metrics,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    });
  } catch (error) {
    console.error("Failed to send performance data:", error);
  }
}

/**
 * Monitor performance in real-time
 */
export function startPerformanceMonitoring(
  options: {
    debug?: boolean;
    reportToAnalytics?: boolean;
    customThresholds?: {
      CLS?: number;
      FID?: number;
      FCP?: number;
      LCP?: number;
      TTFB?: number;
    };
  } = {}
): void {
  const metrics: Partial<WebVitalsMetrics> = {
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : "",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
  };

  initializeWebVitalsMonitoring(metric => {
    // Store metric
    metrics[metric.name as keyof WebVitalsMetrics] = metric.value;

    // Log if debug is enabled
    if (options.debug) {
      console.log(`Web Vital: ${metric.name}`, {
        value: metric.value,
        rating: metric.rating,
        threshold: metric.threshold,
      });
    }

    // Send to analytics if enabled
    if (options.reportToAnalytics && typeof window !== "undefined") {
      sendPerformanceData(metrics as WebVitalsMetrics);
    }

    // Generate report when all metrics are available
    if (Object.keys(metrics).length >= 7) {
      // All 5 metrics + timestamp + url + userAgent
      const score = calculatePerformanceScore(metrics as WebVitalsMetrics);
      const recommendations = generatePerformanceRecommendations(
        metrics as WebVitalsMetrics
      );

      if (options.debug) {
        console.log("Performance Report:", {
          score,
          metrics,
          recommendations,
        });
      }
    }
  }, options);
}

/**
 * Get performance report for current page
 */
export async function getPerformanceReport(): Promise<PerformanceReport> {
  const metrics = getPerformanceMetrics();

  // Wait for web vitals to be available
  return new Promise(resolve => {
    const checkMetrics = () => {
      if (metrics.firstContentfulPaint > 0) {
        const webVitals: WebVitalsMetrics = {
          CLS: 0, // Will be populated by web-vitals
          FID: 0, // Will be populated by web-vitals
          FCP: metrics.firstContentfulPaint,
          LCP: metrics.largestContentfulPaint,
          TTFB: metrics.timeToFirstByte,
          timestamp: new Date().toISOString(),
          url: typeof window !== "undefined" ? window.location.href : "",
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : "",
        };

        const score = calculatePerformanceScore(webVitals);
        const recommendations = generatePerformanceRecommendations(webVitals);

        resolve({
          webVitals,
          performance: metrics,
          recommendations,
          score,
        });
      } else {
        setTimeout(checkMetrics, 100);
      }
    };

    checkMetrics();
  });
}
