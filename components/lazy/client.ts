"use client";

import { type ComponentType } from "react";

import { createIntersectionLazyComponent } from "@/lib/bundle-analyzer-client";

// Using the createIntersectionLazyComponent from lib/bundle-analyzer-client

// =================== CLIENT-SAFE LAZY COMPONENTS ===================

// Newsletter Signup (Footer area) - Increased rootMargin for faster loading
export const LazyNewsletterSignup = createIntersectionLazyComponent(
  () => import("@/components/NewsletterSignup"),
  "NewsletterSignup",
  { rootMargin: "200px" } // Increased from 50px to 200px for faster loading
);

// =================== INTERSECTION OBSERVER LAZY COMPONENTS ===================
// These components load only when they come into view (moved from server.ts)

// Product Reviews (Below the fold)
export const LazyProductReviews = createIntersectionLazyComponent(
  () =>
    import("@/features/products/components/ProductReviews").then(mod => ({
      default: mod.ProductReviews as ComponentType<any>,
    })),
  "ProductReviews",
  { rootMargin: "100px" }
);

// Related Products (Below the fold)
export const LazyRelatedProducts = createIntersectionLazyComponent(
  () =>
    import("@/features/products/components/RelatedProducts").then(mod => ({
      default: mod.RelatedProducts as ComponentType<any>,
    })),
  "RelatedProducts",
  { rootMargin: "100px" }
);

// Export collections
export const IntersectionComponents = {
  NewsletterSignup: LazyNewsletterSignup,
  ProductReviews: LazyProductReviews,
  RelatedProducts: LazyRelatedProducts,
};
