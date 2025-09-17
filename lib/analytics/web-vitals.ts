/**
 * Core Web Vitals Monitoring for TechTots
 * Tracks LCP, FID, CLS, FCP, TTFB metrics
 */

import { onCLS, onINP, onFCP, onLCP, onTTFB } from "web-vitals";

interface WebVitalsMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  rating: "good" | "needs-improvement" | "poor";
  navigationType: string;
}

interface WebVitalsConfig {
  sendToGA4: boolean;
  sendToConsole: boolean;
  sendToAPI: boolean;
  apiEndpoint?: string;
}

const DEFAULT_CONFIG: WebVitalsConfig = {
  sendToGA4: true,
  sendToConsole: process.env.NODE_ENV === "development",
  sendToAPI: false,
};

// Core Web Vitals thresholds for 2025
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 }, // INP replaces FID
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

function getRating(
  metric: string,
  value: number
): "good" | "needs-improvement" | "poor" {
  const threshold = THRESHOLDS[metric as keyof typeof THRESHOLDS];
  if (!threshold) return "good";

  if (value <= threshold.good) return "good";
  if (value <= threshold.poor) return "needs-improvement";
  return "poor";
}

function sendToGoogleAnalytics(metric: WebVitalsMetric) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", metric.name, {
      event_category: "Web Vitals",
      event_label: metric.id,
      value: Math.round(
        metric.name === "CLS" ? metric.value * 1000 : metric.value
      ),
      non_interaction: true,
      custom_parameters: {
        metric_rating: metric.rating,
        metric_delta: metric.delta,
        navigation_type: metric.navigationType,
      },
    });
  }
}

function sendToConsole(metric: WebVitalsMetric) {
  const emoji = {
    good: "✅",
    "needs-improvement": "⚠️",
    poor: "❌",
  }[metric.rating];

  console.log(
    `${emoji} ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`
  );
}

function sendToAPI(metric: WebVitalsMetric, config: WebVitalsConfig) {
  if (!config.apiEndpoint) return;

  fetch(config.apiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
      rating: metric.rating,
      navigationType: metric.navigationType,
      url: window.location.href,
      ts: Date.now(),
    }),
  }).catch(console.error);
}

function handleMetric(
  metric: WebVitalsMetric,
  config: WebVitalsConfig = DEFAULT_CONFIG
) {
  // Add rating to metric
  const enhancedMetric = {
    ...metric,
    rating: getRating(metric.name, metric.value),
  };

  // Send to different destinations
  if (config.sendToGA4) {
    sendToGoogleAnalytics(enhancedMetric);
  }

  if (config.sendToConsole) {
    sendToConsole(enhancedMetric);
  }

  if (config.sendToAPI) {
    sendToAPI(enhancedMetric, config);
  }
}

export function initWebVitals(config: Partial<WebVitalsConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Track Largest Contentful Paint
  onLCP(metric => {
    handleMetric(metric, finalConfig);
  });

  // Track Interaction to Next Paint (replaces FID)
  onINP(metric => {
    handleMetric(metric, finalConfig);
  });

  // Track Cumulative Layout Shift
  onCLS(metric => {
    handleMetric(metric, finalConfig);
  });

  // Track First Contentful Paint
  onFCP(metric => {
    handleMetric(metric, finalConfig);
  });

  // Track Time to First Byte
  onTTFB(metric => {
    handleMetric(metric, finalConfig);
  });
}

// Performance monitoring for specific TechTots features
export function trackPagePerformance() {
  if (typeof window === "undefined") return;

  // Track page load time
  window.addEventListener("load", () => {
    const loadTime =
      performance.timing.loadEventEnd - performance.timing.navigationStart;

    if (window.gtag) {
      window.gtag("event", "page_load_time", {
        event_category: "Performance",
        value: loadTime,
        non_interaction: true,
      });
    }
  });

  // Track resource loading performance
  if ("PerformanceObserver" in window) {
    const observer = new PerformanceObserver(list => {
      list.getEntries().forEach(entry => {
        if (entry.entryType === "resource") {
          const resource = entry as PerformanceResourceTiming;

          // Track slow resources (> 1 second)
          if (resource.duration > 1000) {
            console.warn(
              `Slow resource: ${resource.name} (${resource.duration.toFixed(2)}ms)`
            );

            if (window.gtag) {
              window.gtag("event", "slow_resource", {
                event_category: "Performance",
                event_label: resource.name,
                value: Math.round(resource.duration),
                non_interaction: true,
              });
            }
          }
        }
      });
    });

    observer.observe({ entryTypes: ["resource"] });
  }
}

// E-commerce specific performance tracking
export function trackEcommercePerformance() {
  if (typeof window === "undefined") return;

  // Track product page load performance
  if (window.location.pathname.includes("/products/")) {
    const startTime = performance.now();

    window.addEventListener("load", () => {
      const loadTime = performance.now() - startTime;

      if (window.gtag) {
        window.gtag("event", "product_page_load", {
          event_category: "E-commerce Performance",
          value: Math.round(loadTime),
          non_interaction: true,
        });
      }
    });
  }

  // Track cart performance
  if (window.location.pathname.includes("/checkout")) {
    const startTime = performance.now();

    window.addEventListener("load", () => {
      const loadTime = performance.now() - startTime;

      if (window.gtag) {
        window.gtag("event", "checkout_page_load", {
          event_category: "E-commerce Performance",
          value: Math.round(loadTime),
          non_interaction: true,
        });
      }
    });
  }
}

// Mobile performance tracking
export function trackMobilePerformance() {
  if (typeof window === "undefined") return;

  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  if (isMobile) {
    // Track mobile-specific metrics
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;

      if (window.gtag) {
        window.gtag("event", "mobile_connection", {
          event_category: "Mobile Performance",
          event_label: connection.effectiveType || "unknown",
          value: connection.downlink || 0,
          non_interaction: true,
        });
      }
    }
  }
}

// Initialize all performance tracking
export function initPerformanceTracking(config: Partial<WebVitalsConfig> = {}) {
  initWebVitals(config);
  trackPagePerformance();
  trackEcommercePerformance();
  trackMobilePerformance();
}
