"use client";

import { type ComponentType } from "react";
import { createIntersectionLazyComponent } from "@/lib/bundle-analyzer-client";

// Using the createIntersectionLazyComponent from lib/bundle-analyzer-client

// =================== CLIENT-SAFE LAZY COMPONENTS ===================

// Newsletter Signup (Footer area)
export const LazyNewsletterSignup = createIntersectionLazyComponent(
  () => import("@/components/NewsletterSignup"),
  "NewsletterSignup",
  { rootMargin: "50px" }
);

// =================== INTERSECTION OBSERVER LAZY COMPONENTS ===================
// These components load only when they come into view (moved from server.ts)

// Product Reviews (Below the fold)
export const LazyProductReviews = createIntersectionLazyComponent(
  () =>
    import("@/features/products/components/ProductReviews").then(mod => ({
      default: mod.ProductReviews,
    })),
  "ProductReviews",
  { rootMargin: "100px" }
);

// Related Products (Below the fold)
export const LazyRelatedProducts = createIntersectionLazyComponent(
  () =>
    import("@/features/products/components/RelatedProducts").then(mod => ({
      default: mod.RelatedProducts,
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
