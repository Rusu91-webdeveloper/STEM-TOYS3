/**
 * Performance Optimizer Component
 * Implements Core Web Vitals optimizations for maximum Google ranking
 */

"use client";

import { useEffect } from "react";
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

interface PerformanceOptimizerProps {
  enableAnalytics?: boolean;
  enablePreloading?: boolean;
}

export function PerformanceOptimizer({
  enableAnalytics = true,
  enablePreloading = true,
}: PerformanceOptimizerProps) {
  useEffect(() => {
    if (enableAnalytics) {
      // Track Core Web Vitals
      getCLS(sendToAnalytics);
      getFID(sendToAnalytics);
      getFCP(sendToAnalytics);
      getLCP(sendToAnalytics);
      getTTFB(sendToAnalytics);
    }

    if (enablePreloading) {
      // Preload critical resources
      preloadCriticalResources();

      // Implement intelligent prefetching
      implementIntelligentPrefetch();
    }
  }, [enableAnalytics, enablePreloading]);

  return (
    <>
      {/* Critical CSS inlining hint */}
      <style jsx>{`
        /* Critical above-the-fold styles */
        .hero-section {
          display: block;
          min-height: 60vh;
        }
        .product-grid {
          display: grid;
          gap: 1rem;
        }
        @media (min-width: 768px) {
          .product-grid {
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          }
        }
      `}</style>

      {/* Resource hints for better performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link rel="preconnect" href="https://images.unsplash.com" />
      <link rel="dns-prefetch" href="//www.google-analytics.com" />

      {/* Preload critical fonts */}
      <link
        rel="preload"
        href="/fonts/inter-var.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
    </>
  );
}

// **PERFORMANCE**: Optimized performance metrics tracking
function sendToAnalytics(metric: any) {
  // **PERFORMANCE**: Reduce frequency of web vitals tracking in development
  if (process.env.NODE_ENV === "development") {
    // Only track poor metrics in development to reduce console noise
    const thresholds = {
      LCP: 2500,
      FID: 100,
      FCP: 1800,
      CLS: 0.1,
      TTFB: 800,
      INP: 200,
    };

    const threshold = thresholds[metric.name as keyof typeof thresholds];
    const isPoor = threshold && metric.value > threshold;

    if (!isPoor) {
      return; // Skip good metrics in development
    }
  }

  // Send to Google Analytics 4
  if (typeof gtag !== "undefined") {
    gtag("event", metric.name, {
      event_category: "Web Vitals",
      event_label: metric.id,
      value: Math.round(
        metric.name === "CLS" ? metric.value * 1000 : metric.value
      ),
      non_interaction: true,
    });
  }

  // Send to custom analytics endpoint with reduced frequency in production
  if (metric.value > 0) {
    // **PERFORMANCE**: Use sendBeacon for better performance
    if (navigator.sendBeacon) {
      const data = JSON.stringify({
        name: metric.name,
        value: metric.value,
        id: metric.id,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      });

      navigator.sendBeacon("/api/analytics/web-vitals", data);
    } else {
      // Fallback to fetch
      fetch("/api/analytics/web-vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          id: metric.id,
          url: window.location.href,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
        }),
      }).catch(error => {
        // Silently handle errors in production, log in development
        if (process.env.NODE_ENV === "development") {
          console.warn("Web Vitals tracking failed:", error);
        }
      });
    }
  }
}

// Preload critical resources
function preloadCriticalResources() {
  // **PERFORMANCE**: Preload only the actual hero image used
  const heroImage = "/images/optimized/homepage_hero_banner_01_fallback.jpg";
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = heroImage;
  link.fetchPriority = "high";
  document.head.appendChild(link);

  // **PERFORMANCE**: Preload critical fonts
  const fonts = [
    "/fonts/inter-var.woff2",
    "/fonts/inter-400.woff2",
    "/fonts/inter-600.woff2",
    "/fonts/inter-700.woff2",
  ];

  fonts.forEach(href => {
    const fontLink = document.createElement("link");
    fontLink.rel = "preload";
    fontLink.as = "font";
    fontLink.href = href;
    fontLink.type = "font/woff2";
    fontLink.crossOrigin = "anonymous";
    document.head.appendChild(fontLink);
  });

  // **PERFORMANCE**: Prefetch critical routes (don't preload to avoid bandwidth waste)
  const criticalRoutes = ["/products", "/categories"];
  criticalRoutes.forEach(route => {
    const routeLink = document.createElement("link");
    routeLink.rel = "prefetch";
    routeLink.href = route;
    document.head.appendChild(routeLink);
  });
}

// Intelligent prefetching based on user behavior
function implementIntelligentPrefetch() {
  // Prefetch on hover with delay
  let prefetchTimeout: NodeJS.Timeout;

  document.addEventListener("mouseover", event => {
    const target = event.target as HTMLElement;
    const link = target.closest('a[href^="/"]') as HTMLAnchorElement;

    if (link && !link.dataset.prefetched) {
      prefetchTimeout = setTimeout(() => {
        prefetchPage(link.href);
        link.dataset.prefetched = "true";
      }, 200); // 200ms delay to avoid unnecessary prefetches
    }
  });

  document.addEventListener("mouseout", () => {
    if (prefetchTimeout) {
      clearTimeout(prefetchTimeout);
    }
  });

  // Prefetch visible links in viewport
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const link = entry.target as HTMLAnchorElement;
        if (link.href && !link.dataset.prefetched) {
          setTimeout(() => {
            prefetchPage(link.href);
            link.dataset.prefetched = "true";
          }, 1000);
        }
      }
    });
  });

  // Observe all internal links
  setTimeout(() => {
    document.querySelectorAll('a[href^="/"]').forEach(link => {
      observer.observe(link);
    });
  }, 2000);
}

// Prefetch page resources
function prefetchPage(url: string) {
  // Prefetch the page
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = url;
  document.head.appendChild(link);

  // Prefetch likely API calls for the page
  if (url.includes("/products/")) {
    const slug = url.split("/products/")[1];
    fetch(`/api/products/${slug}`, { method: "HEAD" }).catch(() => {});
  } else if (url.includes("/categories/")) {
    const slug = url.split("/categories/")[1];
    fetch(`/api/categories/${slug}/products`, { method: "HEAD" }).catch(
      () => {}
    );
  }
}

/**
 * Image optimization component
 */
export function OptimizedImage({
  src,
  alt,
  priority = false,
  className = "",
  ...props
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  [key: string]: any;
}) {
  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={`${className} transition-opacity duration-300`}
      onLoad={e => {
        (e.target as HTMLImageElement).style.opacity = "1";
      }}
      style={{ opacity: 0 }}
      {...props}
    />
  );
}

/**
 * Critical CSS component for above-the-fold content
 */
export function CriticalCSS() {
  return (
    <style jsx>{`
      /* Critical above-the-fold styles for LCP optimization */
      .hero-section {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 60vh;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        color: white;
      }

      .hero-title {
        font-size: 3.5rem;
        font-weight: 800;
        line-height: 1.1;
        margin-bottom: 1.5rem;
      }

      .hero-subtitle {
        font-size: 1.25rem;
        opacity: 0.9;
        max-width: 600px;
        margin: 0 auto 2rem;
      }

      .cta-button {
        background: #ffffff;
        color: #667eea;
        padding: 1rem 2rem;
        border-radius: 0.5rem;
        font-weight: 700;
        text-decoration: none;
        display: inline-block;
        transition: all 0.3s ease;
      }

      .cta-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      }

      /* Product grid optimization */
      .product-card {
        background: white;
        border-radius: 0.75rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        transition:
          transform 0.3s ease,
          box-shadow 0.3s ease;
      }

      .product-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      }

      @media (max-width: 768px) {
        .hero-title {
          font-size: 2.5rem;
        }
        .hero-subtitle {
          font-size: 1.1rem;
        }
      }
    `}</style>
  );
}
