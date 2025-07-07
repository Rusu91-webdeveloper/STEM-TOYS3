// WARNING: Do not import this file in client components! Use ./client.ts for client-safe lazy components.

/**
 * Lazy-loaded components for non-critical parts of the application
 */

import {
  createAsyncComponent,
  createIntersectionLazyComponent,
} from "@/lib/bundle-analyzer";
import { ComponentType } from "react";
import React from "react";

// Loading components
const DefaultLoading: ComponentType = () =>
  React.createElement(
    "div",
    {
      className: "flex items-center justify-center p-4",
    },
    React.createElement("div", {
      className: "animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900",
    })
  );

const SkeletonLoading: ComponentType<{ className?: string }> = ({
  className = "",
}) =>
  React.createElement("div", {
    className: `animate-pulse bg-gray-200 rounded ${className}`,
  });

// Error components
const DefaultError: ComponentType<{ error: Error; retry: () => void }> = ({
  error,
  retry,
}) =>
  React.createElement(
    "div",
    {
      className: "p-4 border border-red-200 rounded-lg bg-red-50",
    },
    React.createElement(
      "h3",
      {
        className: "text-red-800 font-medium",
      },
      "Error loading component"
    ),
    React.createElement(
      "p",
      {
        className: "text-red-600 text-sm mt-1",
      },
      error.message
    ),
    React.createElement(
      "button",
      {
        onClick: retry,
        className:
          "mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700",
      },
      "Retry"
    )
  );

// =================== NON-CRITICAL COMPONENTS ===================

// Admin Components (Heavy and not needed for regular users)
export const LazyAdminDashboard = createAsyncComponent(
  () => import("@/app/admin/page"),
  "AdminDashboard",
  { loading: DefaultLoading }
);

export const LazyAdminAnalytics = createAsyncComponent(
  () => import("@/app/admin/analytics/page"),
  "AdminAnalytics",
  { loading: DefaultLoading }
);

export const LazyAdminProducts = createAsyncComponent(
  () => import("@/app/admin/products/page"),
  "AdminProducts",
  { loading: DefaultLoading }
);

// Account/Profile Components (User-specific, not critical for initial load)
export const LazyAccountPage = createAsyncComponent(
  () => import("@/app/account/page"),
  "AccountPage",
  { loading: DefaultLoading }
);

export const LazyDigitalLibrary = createAsyncComponent(
  () => import("@/app/account/digital-library/page"),
  "DigitalLibrary",
  { loading: DefaultLoading }
);

export const LazyOrderHistory = createAsyncComponent(
  () => import("@/app/account/orders/page"),
  "OrderHistory",
  { loading: DefaultLoading }
);

export const LazyWishlist = createAsyncComponent(
  () => import("@/app/account/wishlist/page"),
  "Wishlist",
  { loading: DefaultLoading }
);

// Checkout Components (Only needed when user is purchasing)
export const LazyCheckoutPage = createAsyncComponent(
  () => import("@/app/checkout/page"),
  "CheckoutPage",
  { loading: DefaultLoading, preload: true } // Preload since it's important for conversion
);

export const LazyPaymentForm = createAsyncComponent(
  () =>
    import("@/features/checkout/components/PaymentForm").then(mod => ({
      default: mod.PaymentForm,
    })),
  "PaymentForm",
  { loading: DefaultLoading }
);

// Blog Components (Content, not critical for e-commerce flow)
export const LazyBlogPage = createAsyncComponent(
  () => import("@/app/blog/page"),
  "BlogPage",
  { loading: DefaultLoading }
);

export const LazyBlogPost = createAsyncComponent(
  () => import("@/app/blog/[slug]/page"),
  "BlogPost",
  { loading: DefaultLoading }
);

// =================== INTERSECTION OBSERVER LAZY COMPONENTS ===================
// These components load only when they come into view

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

// Product Comparison Modal (Only when opened)
export const LazyProductComparison = createAsyncComponent(
  () =>
    import("@/features/products/components/ProductComparison").then(mod => ({
      default: mod.ProductComparison,
    })),
  "ProductComparison",
  { loading: DefaultLoading }
);

// Advanced Search Filters (Only when expanded)
export const LazyAdvancedFilters = createAsyncComponent(
  () => import("@/features/products/components/AdvancedFilters"),
  "AdvancedFilters",
  { loading: DefaultLoading }
);

// =================== FEATURE-SPECIFIC LAZY COMPONENTS ===================

// Cart Components (Important but can be lazy-loaded initially)
export const LazyCartDrawer = createAsyncComponent(
  () => import("@/features/cart/components/CartDrawer"),
  "CartDrawer",
  { loading: DefaultLoading, preload: true }
);

// Auth Components (Modal-based, loaded on demand)
/*
export const LazyLoginModal = createAsyncComponent(
  () => import("@/components/auth/LoginModal"),
  "LoginModal",
  { loading: DefaultLoading }
);

export const LazyRegisterModal = createAsyncComponent(
  () => import("@/components/auth/RegisterModal"),
  "RegisterModal",
  { loading: DefaultLoading }
);

export const LazyForgotPasswordModal = createAsyncComponent(
  () => import("@/components/auth/ForgotPasswordModal"),
  "ForgotPasswordModal",
  { loading: DefaultLoading }
);
*/

// =================== UTILITY COMPONENTS ===================

// Image Gallery (Heavy component with multiple images)
export const LazyImageGallery = createAsyncComponent(
  () =>
    import("@/features/products/components/ProductImageGallery").then(mod => ({
      default: mod.ProductImageGallery,
    })),
  "ImageGallery",
  {
    loading: () =>
      React.createElement(SkeletonLoading, { className: "w-full h-96" }),
  }
);

// Video Player (Heavy media component)
/*
export const LazyVideoPlayer = createAsyncComponent(
  () =>
    import("@/components/VideoPlayer").then((mod) => ({
      default: mod.VideoPlayer,
    })),
  "VideoPlayer",
  {
    loading: () =>
      React.createElement(SkeletonLoading, { className: "w-full h-64" }),
  }
);
*/

// PDF Viewer (Heavy component with external dependencies)
/*
export const LazyPDFViewer = createAsyncComponent(
  () =>
    import("@/components/PDFViewer").then((mod) => ({
      default: mod.PDFViewer,
    })),
  "PDFViewer",
  { loading: DefaultLoading }
);
*/

// Chat Widget (Support, not critical for initial experience)
/*
export const LazyChatWidget = createIntersectionLazyComponent(
  () =>
    import("@/components/ChatWidget").then((mod) => ({
      default: mod.ChatWidget,
    })),
  "ChatWidget",
  { rootMargin: "200px" }
);
*/

// =================== ADMIN-SPECIFIC LAZY COMPONENTS ===================

export const LazyUserManagement = createAsyncComponent(
  () => import("@/app/admin/customers/page"),
  "UserManagement",
  { loading: DefaultLoading }
);
/*
export const LazyInventoryManagement = createAsyncComponent(
  () =>
    import("@/app/admin/products/components/InventoryManagement").then(
      (mod) => ({ default: mod.InventoryManagement })
    ),
  "InventoryManagement",
  { loading: DefaultLoading }
);

export const LazyReportsPage = createAsyncComponent(
  () =>
    import("@/app/admin/analytics/components/ReportsPage").then((mod) => ({
      default: mod.ReportsPage,
    })),
  "ReportsPage",
  { loading: DefaultLoading }
);
*/

// =================== EXPORT COLLECTIONS ===================

// Group exports for easier importing
export const AdminComponents = {
  Dashboard: LazyAdminDashboard,
  Analytics: LazyAdminAnalytics,
  Products: LazyAdminProducts,
  UserManagement: LazyUserManagement,
  // InventoryManagement: LazyInventoryManagement,
  // Reports: LazyReportsPage,
};

export const AccountComponents = {
  AccountPage: LazyAccountPage,
  DigitalLibrary: LazyDigitalLibrary,
  OrderHistory: LazyOrderHistory,
  Wishlist: LazyWishlist,
  // RegisterModal: LazyRegisterModal,
  // ForgotPasswordModal: LazyForgotPasswordModal,
};

export const CheckoutComponents = {
  CheckoutPage: LazyCheckoutPage,
  PaymentForm: LazyPaymentForm,
};

export const BlogComponents = {
  BlogPage: LazyBlogPage,
  BlogPost: LazyBlogPost,
};

/*
export const AuthComponents = {
  LoginModal: LazyLoginModal,
  RegisterModal: LazyRegisterModal,
  ForgotPasswordModal: LazyForgotPasswordModal,
};
*/

export const IntersectionComponents = {
  ProductReviews: LazyProductReviews,
  RelatedProducts: LazyRelatedProducts,
  // ChatWidget: LazyChatWidget,
};

export const MediaComponents = {
  ImageGallery: LazyImageGallery,
  // VideoPlayer: LazyVideoPlayer,
  // PDFViewer: LazyPDFViewer,
};

// Lazy loading statistics
export function getLazyComponentStats() {
  return {
    totalLazyComponents: Object.keys({
      ...AdminComponents,
      ...AccountComponents,
      ...CheckoutComponents,
      ...BlogComponents,
      // ...AuthComponents,
      ...IntersectionComponents,
      ...MediaComponents,
    }).length,
    categories: {
      admin: Object.keys(AdminComponents).length,
      account: Object.keys(AccountComponents).length,
      checkout: Object.keys(CheckoutComponents).length,
      blog: Object.keys(BlogComponents).length,
      // auth: Object.keys(AuthComponents).length,
      intersection: Object.keys(IntersectionComponents).length,
      media: Object.keys(MediaComponents).length,
    },
  };
}
