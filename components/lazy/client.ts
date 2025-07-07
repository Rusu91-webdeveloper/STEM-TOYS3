"use client";

import React, { ComponentType } from "react";

// Copied from lib/bundle-analyzer.ts to be client-safe
// Logging has been removed.
function createIntersectionLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  _name: string, // name is kept for signature consistency, but not used without logger
  options: {
    rootMargin?: string;
    threshold?: number;
    loading?: ComponentType;
  } = {}
) {
  const {
    rootMargin = "50px",
    threshold = 0.1,
    loading: LoadingComponent,
  } = options;

  return React.forwardRef<any, any>((props, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const [Component, setComponent] = React.useState<T | null>(null);
    const [error, setError] = React.useState<Error | null>(null);
    const elementRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            importFn()
              .then(module => {
                setComponent(() => module.default);
              })
              .catch(err => {
                setError(err);
              });
          }
        },
        { rootMargin, threshold }
      );

      if (elementRef.current) {
        observer.observe(elementRef.current);
      }

      return () => {
        if (elementRef.current) {
          observer.unobserve(elementRef.current);
        }
        observer.disconnect();
      };
    }, [isVisible]); // Re-run if isVisible changes (for retry logic perhaps)

    if (error) {
      // A simple error display
      return React.createElement(
        "div",
        { ref: elementRef, style: { color: "red" } },
        "Error loading component."
      );
    }

    if (!isVisible) {
      // Render a placeholder with a minimum height to ensure it's observable
      return React.createElement("div", {
        ref: elementRef,
        style: { minHeight: "100px" },
      });
    }

    if (!Component) {
      // If a loading component is provided, use it. Otherwise, a simple text.
      return React.createElement(
        "div",
        { ref: elementRef },
        LoadingComponent ? React.createElement(LoadingComponent) : "Loading..."
      );
    }

    return React.createElement(Component, { ...props, ref });
  });
}

// =================== CLIENT-SAFE LAZY COMPONENTS ===================

// Newsletter Signup (Footer area)
export const LazyNewsletterSignup = createIntersectionLazyComponent(
  () => import("@/components/NewsletterSignup"),
  "NewsletterSignup",
  { rootMargin: "50px" }
);

// Re-export server-only lazy components for client-side usage
export { LazyProductReviews, LazyRelatedProducts } from "./server";
