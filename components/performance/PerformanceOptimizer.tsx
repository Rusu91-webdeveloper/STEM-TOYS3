"use client";

import { useEffect, useState } from "react";
import { logger } from "@/lib/utils/logger";

interface PerformanceMetrics {
  loadTime: number;
  bundleSize: number;
  resourceCount: number;
  cacheHitRate: number;
}

export default function PerformanceOptimizer() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const measurePerformance = async () => {
      setIsOptimizing(true);

      try {
        // Measure page load time
        const loadTime = performance.now();

        // Wait for page to be fully loaded
        if (document.readyState !== "complete") {
          await new Promise(resolve => {
            window.addEventListener("load", resolve, { once: true });
          });
        }

        const finalLoadTime = performance.now() - loadTime;

        // Analyze bundle size
        const resources = await analyzeResources();
        const bundleSize = calculateBundleSize(resources);
        const resourceCount = resources.length;

        // Calculate cache hit rate (simplified)
        const cacheHitRate = await calculateCacheHitRate();

        const performanceMetrics: PerformanceMetrics = {
          loadTime: finalLoadTime,
          bundleSize,
          resourceCount,
          cacheHitRate,
        };

        setMetrics(performanceMetrics);

        // Log performance metrics
        logger.info("Performance Metrics:", performanceMetrics);

        // Warn if performance is poor
        if (finalLoadTime > 3000) {
          logger.warn("Slow page load detected", {
            loadTime: `${finalLoadTime.toFixed(2)}ms`,
            threshold: "3000ms",
          });
        }

        if (bundleSize > 1024 * 1024) {
          // 1MB
          logger.warn("Large bundle size detected", {
            bundleSize: `${(bundleSize / (1024 * 1024)).toFixed(2)}MB`,
            threshold: "1MB",
          });
        }

        // Optimize images
        optimizeImages();

        // Preload critical resources
        preloadCriticalResources();
      } catch (error) {
        console.error("Performance measurement failed:", error);
      } finally {
        setIsOptimizing(false);
      }
    };

    // Measure performance after a short delay to allow initial rendering
    const timeoutId = setTimeout(measurePerformance, 1000);

    return () => clearTimeout(timeoutId);
  }, []);

  const analyzeResources = async (): Promise<
    Array<{ url: string; size: number; type: string }>
  > => {
    const resources: Array<{ url: string; size: number; type: string }> = [];

    // Analyze scripts
    const scripts = document.querySelectorAll("script[src]");
    for (const script of scripts) {
      const src = script.getAttribute("src");
      if (src) {
        const size = await getResourceSize(src);
        resources.push({ url: src, size, type: "script" });
      }
    }

    // Analyze stylesheets
    const styles = document.querySelectorAll('link[rel="stylesheet"]');
    for (const style of styles) {
      const href = style.getAttribute("href");
      if (href) {
        const size = await getResourceSize(href);
        resources.push({ url: href, size, type: "stylesheet" });
      }
    }

    // Analyze images
    const images = document.querySelectorAll("img[src]");
    for (const img of images) {
      const src = img.getAttribute("src");
      if (src && !src.startsWith("data:")) {
        const size = await getResourceSize(src);
        resources.push({ url: src, size, type: "image" });
      }
    }

    return resources;
  };

  const getResourceSize = async (url: string): Promise<number> => {
    try {
      const response = await fetch(url, { method: "HEAD" });
      const contentLength = response.headers.get("content-length");
      return contentLength ? parseInt(contentLength, 10) : 0;
    } catch {
      return 0;
    }
  };

  const calculateBundleSize = (
    resources: Array<{ url: string; size: number; type: string }>
  ): number => {
    return resources.reduce((total, resource) => {
      // Only count scripts and stylesheets for bundle size
      if (resource.type === "script" || resource.type === "stylesheet") {
        return total + resource.size;
      }
      return total;
    }, 0);
  };

  const calculateCacheHitRate = async (): Promise<number> => {
    // Simplified cache hit rate calculation
    // In a real implementation, you'd track actual cache hits
    return 0.85; // Assume 85% cache hit rate
  };

  const optimizeImages = () => {
    // Lazy load images that are not in viewport
    const images = document.querySelectorAll("img[data-src]");
    const imageObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || "";
          img.classList.remove("lazy");
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  };

  const preloadCriticalResources = () => {
    // Preload critical CSS and JS files
    const criticalResources = [
      "/_next/static/css/app/layout.css",
      "/_next/static/chunks/webpack.js",
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.href = resource;
      link.as = resource.endsWith(".css") ? "style" : "script";
      document.head.appendChild(link);
    });
  };

  const optimizeServiceWorker = () => {
    // Send optimization message to service worker
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "OPTIMIZE_CACHE",
        data: { timestamp: Date.now() },
      });
    }
  };

  // Only render in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white border rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="text-sm font-semibold mb-2">Performance Optimizer</h3>

      {isOptimizing && (
        <div className="text-xs text-gray-600 mb-2">
          Analyzing performance...
        </div>
      )}

      {metrics && (
        <div className="space-y-1 text-xs">
          <div>Load Time: {metrics.loadTime.toFixed(0)}ms</div>
          <div>Bundle Size: {(metrics.bundleSize / 1024).toFixed(1)}KB</div>
          <div>Resources: {metrics.resourceCount}</div>
          <div>Cache Hit: {(metrics.cacheHitRate * 100).toFixed(0)}%</div>
        </div>
      )}

      <div className="mt-2 space-y-1">
        <button
          onClick={optimizeServiceWorker}
          className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
        >
          Optimize SW
        </button>
        <button
          onClick={preloadCriticalResources}
          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 ml-1"
        >
          Preload
        </button>
      </div>
    </div>
  );
}
