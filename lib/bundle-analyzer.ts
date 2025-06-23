/**
 * Bundle analysis and code splitting utilities for STEM-TOYS2
 */

import { logger } from "./logger";
import dynamic from "next/dynamic";
import { ComponentType, lazy } from "react";

// Bundle analysis configuration
export interface BundleConfig {
  enabled: boolean;
  maxChunkSize: number; // bytes
  maxAsyncRequests: number;
  maxInitialRequests: number;
  chunks: {
    vendor: boolean;
    common: boolean;
    runtime: boolean;
  };
  splitRoutes: boolean;
  preload: {
    critical: string[];
    important: string[];
  };
}

// Default bundle configuration
const defaultConfig: BundleConfig = {
  enabled: process.env.NODE_ENV === 'production',
  maxChunkSize: 244 * 1024, // 244KB
  maxAsyncRequests: 30,
  maxInitialRequests: 30,
  chunks: {
    vendor: true,
    common: true,
    runtime: true
  },
  splitRoutes: true,
  preload: {
    critical: [
      '/app/layout',
      '/app/page',
      '/components/ui/button',
      '/components/layout/Header',
      '/components/layout/Footer'
    ],
    important: [
      '/app/products/page',
      '/app/checkout/page',
      '/features/cart/components/CartProvider',
      '/features/products/components/ProductGrid'
    ]
  }
};

// Bundle statistics
interface BundleStats {
  totalSize: number;
  gzippedSize: number;
  chunks: number;
  assets: number;
  modules: number;
  duplicateModules: string[];
  largeAssets: Array<{
    name: string;
    size: number;
    type: string;
  }>;
}

// Code splitting utilities
export class BundleSplitter {
  private config: BundleConfig;
  private componentCache = new Map<string, any>();

  constructor(config: Partial<BundleConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    
    if (this.config.enabled) {
      logger.info('Bundle optimization enabled', { 
        maxChunkSize: this.config.maxChunkSize,
        splitRoutes: this.config.splitRoutes 
      });
    }
  }

  /**
   * Create a lazy-loaded component with error boundary and loading state
   */
  createLazyComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    options: {
      name: string;
      loading?: ComponentType;
      error?: ComponentType<{ error: Error; retry: () => void }>;
      preload?: boolean;
      ssr?: boolean;
    }
  ) {
    const { name, loading, error, preload = false, ssr = true } = options;

    // Check cache first
    if (this.componentCache.has(name)) {
      return this.componentCache.get(name);
    }

    // Create dynamic component
    const LazyComponent = dynamic(importFn, {
      loading: loading ? () => React.createElement(loading) : undefined,
      ssr,
    });

    // Wrap with error boundary if specified
    const WrappedComponent = error ? this.withErrorBoundary(LazyComponent, error, name) : LazyComponent;

    // Add to cache
    this.componentCache.set(name, WrappedComponent);

    // Preload if specified
    if (preload) {
      this.preloadComponent(importFn, name);
    }

    logger.debug('Lazy component created', { name, ssr, preload });

    return WrappedComponent;
  }

  /**
   * Create route-level code splitting
   */
  createRoute(
    importFn: () => Promise<{ default: ComponentType<any> }>,
    name: string,
    options: {
      preload?: boolean;
      prefetch?: boolean;
    } = {}
  ) {
    return this.createLazyComponent(importFn, {
      name: `route:${name}`,
      ssr: true,
      preload: options.preload || this.config.preload.critical.includes(`/app/${name}/page`),
    });
  }

  /**
   * Create feature-level code splitting
   */
  createFeature(
    importFn: () => Promise<{ default: ComponentType<any> }>,
    featureName: string,
    componentName: string
  ) {
    const fullName = `${featureName}:${componentName}`;
    const isImportant = this.config.preload.important.includes(`/features/${featureName}/components/${componentName}`);

    return this.createLazyComponent(importFn, {
      name: fullName,
      ssr: false, // Features can be client-side only
      preload: isImportant,
    });
  }

  /**
   * Preload component for better user experience
   */
  private async preloadComponent(
    importFn: () => Promise<{ default: ComponentType<any> }>,
    name: string
  ): Promise<void> {
    try {
      // Delay preloading to not block initial render
      setTimeout(async () => {
        await importFn();
        logger.debug('Component preloaded', { name });
      }, 100);
    } catch (error) {
      logger.error('Component preload failed', { name, error });
    }
  }

  /**
   * Create error boundary wrapper
   */
  private withErrorBoundary(
    Component: ComponentType<any>,
    ErrorComponent: ComponentType<{ error: Error; retry: () => void }>,
    name: string
  ) {
    return class extends React.Component<any, { hasError: boolean; error?: Error }> {
      constructor(props: any) {
        super(props);
        this.state = { hasError: false };
      }

      static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
      }

      componentDidCatch(error: Error, errorInfo: any) {
        logger.error('Lazy component error', { name, error, errorInfo });
      }

      render() {
        if (this.state.hasError) {
          return React.createElement(ErrorComponent, {
            error: this.state.error!,
            retry: () => this.setState({ hasError: false, error: undefined })
          });
        }

        return React.createElement(Component, this.props);
      }
    };
  }

  /**
   * Get component cache statistics
   */
  getCacheStats() {
    return {
      cachedComponents: this.componentCache.size,
      componentNames: Array.from(this.componentCache.keys())
    };
  }
}

// Webpack bundle analyzer integration
export class WebpackBundleAnalyzer {
  private stats: BundleStats | null = null;

  /**
   * Analyze webpack bundle stats
   */
  async analyzeBundles(statsJson?: any): Promise<BundleStats | null> {
    try {
      // In a real implementation, this would analyze webpack stats
      // For now, we'll simulate the analysis
      const mockStats: BundleStats = {
        totalSize: 2.5 * 1024 * 1024, // 2.5MB
        gzippedSize: 750 * 1024, // 750KB
        chunks: 15,
        assets: 45,
        modules: 230,
        duplicateModules: [
          'lodash',
          'react-dom/client',
          'next/dynamic'
        ],
        largeAssets: [
          { name: 'pages/_app.js', size: 180 * 1024, type: 'javascript' },
          { name: 'chunks/framework.js', size: 150 * 1024, type: 'javascript' },
          { name: 'chunks/main.js', size: 120 * 1024, type: 'javascript' },
          { name: 'static/hero-image.jpg', size: 400 * 1024, type: 'image' }
        ]
      };

      this.stats = mockStats;
      this.logAnalysis(mockStats);
      
      return mockStats;
    } catch (error) {
      logger.error('Bundle analysis failed', { error });
      return null;
    }
  }

  /**
   * Get optimization recommendations
   */
  getRecommendations(): string[] {
    if (!this.stats) return [];

    const recommendations: string[] = [];

    // Check total size
    if (this.stats.totalSize > 3 * 1024 * 1024) { // 3MB
      recommendations.push('Total bundle size is large (>3MB). Consider more aggressive code splitting.');
    }

    // Check large assets
    const largeJSAssets = this.stats.largeAssets.filter(
      asset => asset.type === 'javascript' && asset.size > 200 * 1024
    );
    if (largeJSAssets.length > 0) {
      recommendations.push(`Large JavaScript assets detected: ${largeJSAssets.map(a => a.name).join(', ')}`);
    }

    // Check duplicate modules
    if (this.stats.duplicateModules.length > 0) {
      recommendations.push(`Duplicate modules found: ${this.stats.duplicateModules.join(', ')}`);
    }

    // Check compression ratio
    const compressionRatio = this.stats.gzippedSize / this.stats.totalSize;
    if (compressionRatio > 0.4) {
      recommendations.push('Poor compression ratio. Consider optimizing assets and removing unused code.');
    }

    return recommendations;
  }

  private logAnalysis(stats: BundleStats): void {
    const compressionRatio = ((1 - stats.gzippedSize / stats.totalSize) * 100).toFixed(1);
    
    logger.info('Bundle analysis complete', {
      totalSize: `${(stats.totalSize / 1024 / 1024).toFixed(2)}MB`,
      gzippedSize: `${(stats.gzippedSize / 1024).toFixed(0)}KB`,
      compressionRatio: `${compressionRatio}%`,
      chunks: stats.chunks,
      modules: stats.modules,
      duplicates: stats.duplicateModules.length
    });
  }
}

// Create singleton instances
export const bundleSplitter = new BundleSplitter();
export const bundleAnalyzer = new WebpackBundleAnalyzer();

// React import for the error boundary
import React from 'react';

// Convenience functions for common patterns
export function createAsyncPage(
  importFn: () => Promise<{ default: ComponentType<any> }>,
  name: string
) {
  return bundleSplitter.createRoute(importFn, name, { preload: true });
}

export function createAsyncComponent(
  importFn: () => Promise<{ default: ComponentType<any> }>,
  name: string,
  options: {
    loading?: ComponentType;
    preload?: boolean;
  } = {}
) {
  return bundleSplitter.createLazyComponent(importFn, {
    name,
    loading: options.loading,
    preload: options.preload,
    ssr: false
  });
}

export function createAsyncFeature(
  featureName: string,
  componentName: string,
  importFn: () => Promise<{ default: ComponentType<any> }>
) {
  return bundleSplitter.createFeature(importFn, featureName, componentName);
}

// Bundle size monitoring
export function monitorBundleSize(): void {
  if (typeof window !== 'undefined') {
    // Client-side bundle monitoring
    const navigation = (performance as any).getEntriesByType?.('navigation')?.[0];
    if (navigation) {
      logger.info('Page load performance', {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: (performance as any).getEntriesByType?.('paint')?.[0]?.startTime || 0
      });
    }
  }
}

// Lazy loading with intersection observer
export function createIntersectionLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  name: string,
  options: {
    rootMargin?: string;
    threshold?: number;
  } = {}
) {
  const { rootMargin = '50px', threshold = 0.1 } = options;
  
  return React.forwardRef<any, any>((props, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const [Component, setComponent] = React.useState<T | null>(null);
    const elementRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            importFn().then(module => {
              setComponent(() => module.default);
              logger.debug('Intersection lazy component loaded', { name });
            }).catch(error => {
              logger.error('Intersection lazy component failed to load', { name, error });
            });
          }
        },
        { rootMargin, threshold }
      );

      if (elementRef.current) {
        observer.observe(elementRef.current);
      }

      return () => observer.disconnect();
    }, []);

    if (!isVisible) {
      return React.createElement('div', { ref: elementRef, style: { minHeight: '100px' } });
    }

    if (!Component) {
      return React.createElement('div', { ref: elementRef }, 'Loading...');
    }

    return React.createElement(Component, { ...props, ref });
  });
}

export type { BundleStats }; 