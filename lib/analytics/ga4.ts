/**
 * Google Analytics 4 Configuration for TechTots
 * Optimized for e-commerce and multilingual content
 */

export const GA4_CONFIG = {
  // Replace with your actual GA4 Measurement ID
  MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || "G-XXXXXXXXXX",

  // Enhanced e-commerce configuration
  ECOMMERCE: {
    CURRENCY: "RON",
    COUNTRY: "RO",
    LANGUAGE: "ro",
  },

  // Custom dimensions for TechTots
  CUSTOM_DIMENSIONS: {
    USER_TYPE: "user_type", // customer, supplier, admin
    PRODUCT_CATEGORY: "product_category", // science, technology, engineering, mathematics
    LANGUAGE: "language", // ro, en
    AGE_GROUP: "age_group", // 3-5, 6-8, 9-12, 13+
    STEM_FOCUS: "stem_focus", // science, technology, engineering, mathematics
  },

  // Custom events for STEM toys tracking
  EVENTS: {
    PRODUCT_VIEW: "view_item",
    ADD_TO_CART: "add_to_cart",
    REMOVE_FROM_CART: "remove_from_cart",
    BEGIN_CHECKOUT: "begin_checkout",
    PURCHASE: "purchase",
    SEARCH: "search",
    FILTER_PRODUCTS: "filter_products",
    VIEW_CATEGORY: "view_item_list",
    STEM_ENGAGEMENT: "stem_engagement",
    EDUCATIONAL_CONTENT_VIEW: "educational_content_view",
  },

  // Enhanced measurement events
  ENHANCED_MEASUREMENT: {
    SCROLLS: true,
    OUTBOUND_CLICKS: true,
    SITE_SEARCH: true,
    VIDEO_ENGAGEMENT: true,
    FILE_DOWNLOADS: true,
  },
};

// GA4 Event tracking functions
export const trackEvent = (
  eventName: string,
  parameters: Record<string, any> = {}
) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, {
      ...parameters,
      custom_map: GA4_CONFIG.CUSTOM_DIMENSIONS,
    });
  }
};

// E-commerce tracking functions
export const trackProductView = (product: {
  item_id: string;
  item_name: string;
  category: string;
  price: number;
  currency: string;
  language?: string;
  age_group?: string;
  stem_focus?: string;
}) => {
  trackEvent(GA4_CONFIG.EVENTS.PRODUCT_VIEW, {
    currency: product.currency || GA4_CONFIG.ECOMMERCE.CURRENCY,
    value: product.price,
    items: [
      {
        item_id: product.item_id,
        item_name: product.item_name,
        category: product.category,
        price: product.price,
        quantity: 1,
        custom_parameters: {
          language: product.language || "ro",
          age_group: product.age_group,
          stem_focus: product.stem_focus,
        },
      },
    ],
  });
};

export const trackAddToCart = (product: {
  item_id: string;
  item_name: string;
  category: string;
  price: number;
  quantity: number;
  currency: string;
  language?: string;
}) => {
  trackEvent(GA4_CONFIG.EVENTS.ADD_TO_CART, {
    currency: product.currency || GA4_CONFIG.ECOMMERCE.CURRENCY,
    value: product.price * product.quantity,
    items: [
      {
        item_id: product.item_id,
        item_name: product.item_name,
        category: product.category,
        price: product.price,
        quantity: product.quantity,
        custom_parameters: {
          language: product.language || "ro",
        },
      },
    ],
  });
};

export const trackPurchase = (transaction: {
  transaction_id: string;
  value: number;
  currency: string;
  items: Array<{
    item_id: string;
    item_name: string;
    category: string;
    price: number;
    quantity: number;
  }>;
  language?: string;
}) => {
  trackEvent(GA4_CONFIG.EVENTS.PURCHASE, {
    transaction_id: transaction.transaction_id,
    value: transaction.value,
    currency: transaction.currency || GA4_CONFIG.ECOMMERCE.CURRENCY,
    items: transaction.items.map(item => ({
      ...item,
      custom_parameters: {
        language: transaction.language || "ro",
      },
    })),
  });
};

// STEM-specific tracking
export const trackSTEMEngagement = (engagement: {
  activity_type: "experiment" | "tutorial" | "game" | "quiz";
  stem_subject: "science" | "technology" | "engineering" | "mathematics";
  age_group: string;
  duration_seconds: number;
  language: string;
}) => {
  trackEvent(GA4_CONFIG.EVENTS.STEM_ENGAGEMENT, {
    activity_type: engagement.activity_type,
    stem_subject: engagement.stem_subject,
    age_group: engagement.age_group,
    duration_seconds: engagement.duration_seconds,
    language: engagement.language,
  });
};

// Search tracking
export const trackSearch = (
  searchTerm: string,
  resultsCount: number,
  language: string = "ro"
) => {
  trackEvent(GA4_CONFIG.EVENTS.SEARCH, {
    search_term: searchTerm,
    results_count: resultsCount,
    language: language,
  });
};

// Category view tracking
export const trackCategoryView = (category: {
  category_name: string;
  stem_focus: string;
  product_count: number;
  language: string;
}) => {
  trackEvent(GA4_CONFIG.EVENTS.VIEW_CATEGORY, {
    category_name: category.category_name,
    stem_focus: category.stem_focus,
    product_count: category.product_count,
    language: category.language,
  });
};

// TypeScript declarations for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}
