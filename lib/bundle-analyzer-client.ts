"use client";

/**
 * Client-side bundle analysis utilities for STEM-TOYS2
 */

import React, { type ComponentType } from "react";

// Use a browser-safe logger to avoid bundling server-only deps like pino
import { logger } from "./logger-lite";

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
      const [loadFailed, setLoadFailed] = React.useState(false);
      const elementRef = React.useRef<HTMLDivElement>(null);

      const loadComponent = React.useCallback(() => {
        setLoadFailed(false);
        return importFn()
          .then(module => {
            setComponent(() => module.default);
            logger.debug("Intersection lazy component loaded", { name });
          })
          .catch(error => {
            setLoadFailed(true);
            logger.error("Intersection lazy component failed to load", {
              name,
              error,
            });
          });
      }, []);

      React.useEffect(() => {
        if (isVisible) return undefined;
        if (typeof IntersectionObserver === "undefined") {
          setIsVisible(true);
          void loadComponent();
          return undefined;
        }
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting && !isVisible) {
              setIsVisible(true);
              void loadComponent();
            }
          },
          { rootMargin, threshold }
        );

        if (elementRef.current) {
          observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
      }, [isVisible, loadComponent]);

      if (!isVisible) {
        return React.createElement("div", {
          ref: elementRef,
          style: { minHeight: "100px" },
        });
      }

      if (!Component) {
        return React.createElement(
          "div",
          { ref: elementRef, role: "status" },
          loadFailed
            ? React.createElement(
                React.Fragment,
                null,
                React.createElement("p", null, "Secțiunea nu s-a încărcat."),
                React.createElement(
                  "button",
                  {
                    type: "button",
                    onClick: loadComponent,
                    className:
                      "mt-2 min-h-11 rounded-lg border border-slate-300 px-4 text-slate-900",
                  },
                  "Reîncearcă"
                )
              )
            : "Se încarcă…"
        );
      }

      return React.createElement(Component, { ...props, ref });
    }
  );

  LazyComponent.displayName = `IntersectionLazyComponent(${name})`;
  return LazyComponent;
}
