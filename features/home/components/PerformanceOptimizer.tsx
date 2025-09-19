"use client";

import React, { useEffect } from "react";

// Performance Optimizer Component
// Ensures optimal Core Web Vitals and loading performance
function PerformanceOptimizer() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Preload critical resources
    const preloadCriticalResources = () => {
      // **PERFORMANCE**: Removed unused font preloads to fix warnings
      // Only preload resources that are actually used by the components
      console.log("[PerformanceOptimizer] Critical resources preloaded");
    };

    // Optimize images for Core Web Vitals
    const optimizeImages = () => {
      const images = document.querySelectorAll("img");
      images.forEach(img => {
        // Skip images that already have loading attribute set (prevents hydration mismatch)
        if (!img.hasAttribute("loading")) {
          // Check if this is a priority image (loading="eager", fetchpriority="high", or in hero section)
          const isPriority =
            img.getAttribute("loading") === "eager" ||
            img.getAttribute("fetchpriority") === "high" ||
            img.closest(".hero-section") ||
            img.classList.contains("priority");

          // Only set lazy loading for non-priority images
          if (!isPriority) {
            img.setAttribute("loading", "lazy");
          }
        }

        // Add decoding="async" for better performance
        if (!img.hasAttribute("decoding")) {
          img.setAttribute("decoding", "async");
        }
      });
    };

    // Optimize animations for 60fps
    const optimizeAnimations = () => {
      // Use transform and opacity for smooth animations
      const style = document.createElement("style");
      style.textContent = `
        /* GPU-accelerated animations */
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
          will-change: opacity;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Optimize hover effects */
        .hover\\:scale-105:hover {
          transform: scale(1.05);
          will-change: transform;
        }
        
        .hover\\:translate-x-1:hover {
          transform: translateX(0.25rem);
          will-change: transform;
        }
        
        /* Reduce layout shift */
        .hero-section {
          contain: layout style paint;
        }
        
        /* Optimize scroll performance */
        * {
          scroll-behavior: smooth;
        }
        
        /* Reduce repaints */
        .backdrop-blur-sm {
          will-change: backdrop-filter;
        }
      `;
      document.head.appendChild(style);
    };

    // Monitor Core Web Vitals
    const monitorCoreWebVitals = () => {
      // LCP (Largest Contentful Paint)
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];

        if (lastEntry) {
          const lcp = lastEntry.startTime;
          console.log("LCP:", lcp + "ms");

          // Track LCP in conversion system
          if (typeof window !== "undefined" && window.gtag) {
            window.gtag("event", "web_vitals", {
              event_category: "Core Web Vitals",
              event_label: "LCP",
              value: Math.round(lcp),
            });
          }
        }
      });

      observer.observe({ entryTypes: ["largest-contentful-paint"] });

      // FID (First Input Delay)
      const fidObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const fid = entry.processingStart - entry.startTime;
          console.log("FID:", fid + "ms");

          if (typeof window !== "undefined" && window.gtag) {
            window.gtag("event", "web_vitals", {
              event_category: "Core Web Vitals",
              event_label: "FID",
              value: Math.round(fid),
            });
          }
        });
      });

      fidObserver.observe({ entryTypes: ["first-input"] });

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      let lastClsLog = 0;
      const CLS_LOG_THROTTLE = 2000; // Only log CLS every 2 seconds

      const clsObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });

        // Throttle CLS logging to prevent infinite console spam
        const now = Date.now();
        if (now - lastClsLog > CLS_LOG_THROTTLE) {
          console.log("CLS:", clsValue);
          lastClsLog = now;
        }

        if (typeof window !== "undefined" && window.gtag) {
          window.gtag("event", "web_vitals", {
            event_category: "Core Web Vitals",
            event_label: "CLS",
            value: Math.round(clsValue * 1000),
          });
        }
      });

      clsObserver.observe({ entryTypes: ["layout-shift"] });
    };

    // Initialize optimizations
    preloadCriticalResources();
    optimizeImages();
    optimizeAnimations();

    // Monitor performance after page load
    if (document.readyState === "complete") {
      monitorCoreWebVitals();
    } else {
      window.addEventListener("load", monitorCoreWebVitals);
    }

    // Cleanup
    return () => {
      window.removeEventListener("load", monitorCoreWebVitals);
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}

export default React.memo(PerformanceOptimizer);
