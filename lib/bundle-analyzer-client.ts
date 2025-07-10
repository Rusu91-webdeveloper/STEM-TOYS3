"use client";

/**
 * Client-side bundle analysis utilities for STEM-TOYS2
 */

import React, { type ComponentType } from "react";
import { logger } from "./logger";

// Lazy loading with intersection observer (CLIENT ONLY)
export function createIntersectionLazyComponent<
  T extends ComponentType<Record<string, unknown>>,
>(
  importFn: () => Promise<{ default: T }>,
  name: string,
  options: {
    rootMargin?: string;
    threshold?: number;
  } = {}
) {
  const { rootMargin = "50px", threshold = 0.1 } = options;

  const LazyComponent = React.forwardRef<unknown, Record<string, unknown>>(
    (props, ref) => {
      const [isVisible, setIsVisible] = React.useState(false);
      const [Component, setComponent] = React.useState<T | null>(null);
      const elementRef = React.useRef<HTMLDivElement>(null);

      React.useEffect(() => {
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting && !isVisible) {
              setIsVisible(true);
              importFn()
                .then(module => {
                  setComponent(() => module.default);
                  logger.debug("Intersection lazy component loaded", { name });
                })
                .catch(error => {
                  logger.error("Intersection lazy component failed to load", {
                    name,
                    error,
                  });
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
        return React.createElement("div", {
          ref: elementRef,
          style: { minHeight: "100px" },
        });
      }

      if (!Component) {
        return React.createElement("div", { ref: elementRef }, "Loading...");
      }

      return React.createElement(Component, { ...props, ref });
    }
  );

  LazyComponent.displayName = `IntersectionLazyComponent(${name})`;
  return LazyComponent;
}
