/**
 * Mobile Performance Optimization Utilities
 * Helps reduce animations and improve performance on mobile devices
 */

export const isMobile = () => {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
};

export const isLowEndDevice = () => {
  if (typeof window === "undefined") return false;

  // Check for low-end device indicators
  const hardwareConcurrency = navigator.hardwareConcurrency || 1;
  const deviceMemory = (navigator as any).deviceMemory || 1;

  return hardwareConcurrency <= 2 || deviceMemory <= 2;
};

export const shouldReduceAnimations = () => {
  if (typeof window === "undefined") return false;

  // Check for user preference to reduce motion
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // Check if it's a low-end device
  const lowEndDevice = isLowEndDevice();

  return prefersReducedMotion || lowEndDevice;
};

export const getOptimalAnimationDuration = (defaultDuration: number) => {
  if (shouldReduceAnimations()) {
    return Math.max(defaultDuration * 0.5, 150); // Reduce by 50% but minimum 150ms
  }
  return defaultDuration;
};

export const getMobileOptimizedClasses = (
  desktopClasses: string,
  mobileClasses: string
) => {
  return `${desktopClasses} ${isMobile() ? mobileClasses : ""}`;
};

/**
 * Debounce function optimized for mobile touch events
 */
export const mobileDebounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for scroll events on mobile
 */
export const mobileThrottle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Lazy load images with intersection observer
 */
export const setupLazyLoading = () => {
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
    return;
  }

  const imageObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.classList.remove("lazy");
            observer.unobserve(img);
          }
        }
      });
    },
    {
      rootMargin: "50px 0px",
      threshold: 0.01,
    }
  );

  document.querySelectorAll("img[data-src]").forEach(img => {
    imageObserver.observe(img);
  });
};

/**
 * Preload critical resources for better mobile performance
 */
export const preloadCriticalResources = () => {
  if (typeof window === "undefined") return;

  // Preload critical CSS
  const criticalStyles = document.querySelectorAll(
    'link[rel="stylesheet"][data-critical]'
  );
  criticalStyles.forEach(link => {
    const preloadLink = document.createElement("link");
    preloadLink.rel = "preload";
    preloadLink.as = "style";
    preloadLink.href = (link as HTMLLinkElement).href;
    document.head.appendChild(preloadLink);
  });
};

/**
 * Bulk Upload Timeout Prevention Utilities
 */
export const getBulkUploadRecommendations = (itemCount: number) => {
  const recommendations = {
    shouldUseAI: true, // Always recommend AI with OpenAI-only optimization
    maxBatchSize: 25,
    estimatedTime: 0,
    warnings: [] as string[],
  };

  if (itemCount <= 15) {
    recommendations.shouldUseAI = true;
    recommendations.estimatedTime = itemCount * 4; // 4 seconds per item with OpenAI-only AI
    recommendations.warnings.push(
      "Using OpenAI-only enhancement for optimal performance"
    );
  } else if (itemCount <= 25) {
    recommendations.shouldUseAI = true;
    recommendations.estimatedTime = itemCount * 5; // 5 seconds per item with smaller batches
    recommendations.warnings.push(
      "Large batch detected - using smaller sub-batches for stability",
      "OpenAI-only enhancement enabled for all products"
    );
  } else {
    recommendations.shouldUseAI = true;
    recommendations.maxBatchSize = 20;
    recommendations.estimatedTime = itemCount * 5;
    recommendations.warnings.push(
      "Very large batch - consider splitting for optimal performance",
      `Recommended: ${Math.ceil(itemCount / 20)} batches of ~20 items each`,
      "Full AI enhancement available for all products"
    );
  }

  return recommendations;
};

/**
 * Calculate optimal processing strategy for bulk uploads
 */
export const getOptimalProcessingStrategy = (products: any[]) => {
  const strategy = {
    useOpenAIOnly: true, // Always use OpenAI-only for better performance
    batchSize: 3,
    enableAI: true, // Always enable AI with OpenAI-only optimization
    parallelProcessing: false,
    estimatedDuration: 0,
  };

  const productCount = products.length;

  if (productCount <= 10) {
    strategy.enableAI = true;
    strategy.batchSize = 3; // Small batches for AI processing
    strategy.estimatedDuration = productCount * 4; // 4 seconds per product with OpenAI-only AI
  } else if (productCount <= 20) {
    strategy.enableAI = true;
    strategy.batchSize = 3; // Keep small batches for stability
    strategy.estimatedDuration = productCount * 5; // 5 seconds per product with delays
  } else {
    strategy.enableAI = true;
    strategy.batchSize = 3; // Consistent small batches
    strategy.estimatedDuration = productCount * 6; // 6 seconds per product for large batches
  }

  return strategy;
};
