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
  enablePreloading = true 
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
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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

// Send performance metrics to analytics
function sendToAnalytics(metric: any) {
  // Send to Google Analytics 4
  if (typeof gtag !== 'undefined') {
    gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }

  // Send to custom analytics endpoint
  if (metric.value > 0) {
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        id: metric.id,
        url: window.location.href,
        timestamp: Date.now(),
      }),
    }).catch(console.error);
  }
}

// Preload critical resources
function preloadCriticalResources() {
  // Preload hero images
  const heroImages = [
    '/images/hero-stem-education.jpg',
    '/images/hero-robotics.jpg',
    '/images/hero-electronics.jpg',
  ];
  
  heroImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });

  // Preload critical API endpoints
  fetch('/api/products/featured', { method: 'HEAD' }).catch(() => {});
  fetch('/api/categories', { method: 'HEAD' }).catch(() => {});
}

// Intelligent prefetching based on user behavior
function implementIntelligentPrefetch() {
  // Prefetch on hover with delay
  let prefetchTimeout: NodeJS.Timeout;
  
  document.addEventListener('mouseover', (event) => {
    const target = event.target as HTMLElement;
    const link = target.closest('a[href^="/"]') as HTMLAnchorElement;
    
    if (link && !link.dataset.prefetched) {
      prefetchTimeout = setTimeout(() => {
        prefetchPage(link.href);
        link.dataset.prefetched = 'true';
      }, 200); // 200ms delay to avoid unnecessary prefetches
    }
  });

  document.addEventListener('mouseout', () => {
    if (prefetchTimeout) {
      clearTimeout(prefetchTimeout);
    }
  });

  // Prefetch visible links in viewport
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const link = entry.target as HTMLAnchorElement;
        if (link.href && !link.dataset.prefetched) {
          setTimeout(() => {
            prefetchPage(link.href);
            link.dataset.prefetched = 'true';
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
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  document.head.appendChild(link);
  
  // Prefetch likely API calls for the page
  if (url.includes('/products/')) {
    const slug = url.split('/products/')[1];
    fetch(`/api/products/${slug}`, { method: 'HEAD' }).catch(() => {});
  } else if (url.includes('/categories/')) {
    const slug = url.split('/categories/')[1];
    fetch(`/api/categories/${slug}/products`, { method: 'HEAD' }).catch(() => {});
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
      onLoad={(e) => {
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
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      }
      
      /* Product grid optimization */
      .product-card {
        background: white;
        border-radius: 0.75rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        overflow: hidden;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      
      .product-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 20px 40px rgba(0,0,0,0.15);
      }
      
      @media (max-width: 768px) {
        .hero-title { font-size: 2.5rem; }
        .hero-subtitle { font-size: 1.1rem; }
      }
    `}</style>
  );
}
