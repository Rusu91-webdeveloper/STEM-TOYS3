/**
 * Responsive Design System
 * Mobile-first approach with progressive enhancement
 */

// Mobile-first breakpoints (min-width approach)
export const breakpoints = {
  xs: "375px", // Small phones
  sm: "640px", // Large phones
  md: "768px", // Tablets
  lg: "1024px", // Small desktops
  xl: "1280px", // Large desktops
  "2xl": "1536px", // Ultra-wide screens
} as const;

// Device categories
export const devices = {
  mobile: { min: 0, max: 767 },
  tablet: { min: 768, max: 1023 },
  desktop: { min: 1024, max: Infinity },
} as const;

// Responsive text sizes following mobile-first approach
export const responsiveText = {
  "text-xs-responsive": "text-xs sm:text-sm",
  "text-sm-responsive": "text-sm sm:text-base",
  "text-base-responsive": "text-base sm:text-lg",
  "text-lg-responsive": "text-lg sm:text-xl md:text-2xl",
  "text-xl-responsive": "text-xl sm:text-2xl md:text-3xl",
  "text-2xl-responsive": "text-2xl sm:text-3xl md:text-4xl",
  "text-3xl-responsive": "text-3xl sm:text-4xl md:text-5xl",
  "text-4xl-responsive": "text-4xl sm:text-5xl md:text-6xl",
} as const;

// Responsive spacing patterns
export const responsiveSpacing = {
  "p-responsive": "p-3 sm:p-4 md:p-6 lg:p-8",
  "px-responsive": "px-3 sm:px-4 md:px-6 lg:px-8",
  "py-responsive": "py-3 sm:py-4 md:py-6 lg:py-8",
  "m-responsive": "m-3 sm:m-4 md:m-6 lg:m-8",
  "mx-responsive": "mx-3 sm:mx-4 md:mx-6 lg:mx-8",
  "my-responsive": "my-3 sm:my-4 md:my-6 lg:my-8",
  "gap-responsive": "gap-3 sm:gap-4 md:gap-6 lg:gap-8",
} as const;

// Container responsive patterns
export const responsiveContainers = {
  "container-responsive":
    "w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8",
  "container-narrow": "w-full max-w-4xl mx-auto px-3 sm:px-4 md:px-6",
  "container-wide":
    "w-full max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8",
} as const;

// Grid responsive patterns
export const responsiveGrids = {
  "grid-responsive-1": "grid grid-cols-1",
  "grid-responsive-2": "grid grid-cols-1 sm:grid-cols-2",
  "grid-responsive-3": "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  "grid-responsive-4":
    "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  "grid-responsive-auto":
    "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
} as const;

// Flex responsive patterns
export const responsiveFlex = {
  "flex-responsive-col": "flex flex-col",
  "flex-responsive-row": "flex flex-col sm:flex-row",
  "flex-responsive-wrap": "flex flex-wrap",
  "flex-responsive-center":
    "flex flex-col sm:flex-row items-center justify-center",
  "flex-responsive-between":
    "flex flex-col sm:flex-row items-start sm:items-center sm:justify-between",
} as const;

// Button responsive patterns
export const responsiveButtons = {
  "btn-sm-responsive": "text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5",
  "btn-base-responsive": "text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2",
  "btn-lg-responsive": "text-base sm:text-lg px-4 sm:px-6 py-2 sm:py-3",
  "btn-full-mobile": "w-full sm:w-auto",
} as const;

// Image responsive patterns
export const responsiveImages = {
  avatar: "(max-width: 640px) 32px, (max-width: 768px) 40px, 48px",
  thumbnail: "(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw",
  card: "(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw",
  hero: "(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw",
  product: "(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw",
  gallery: "(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw",
  banner: "100vw",
} as const;

// Touch-friendly sizing
export const touchTargets = {
  "touch-target": "min-h-[44px] min-w-[44px]", // iOS minimum touch target
  "touch-target-lg": "min-h-[48px] min-w-[48px]", // Android minimum touch target
  "touch-padding": "p-3", // Minimum padding for touch targets
  "touch-margin": "m-2", // Minimum margin between touch targets
} as const;

// Mobile-specific utility classes
export const mobileUtilities = {
  "mobile-full": "w-full sm:w-auto",
  "mobile-hidden": "hidden sm:block",
  "mobile-only": "block sm:hidden",
  "mobile-center": "text-center sm:text-left",
  "mobile-stack": "flex flex-col sm:flex-row",
  "mobile-scroll": "overflow-x-auto sm:overflow-x-visible",
} as const;

// Navigation responsive patterns
export const responsiveNav = {
  "nav-mobile": "block md:hidden",
  "nav-desktop": "hidden md:block",
  "nav-item-mobile": "block w-full p-3 text-base",
  "nav-item-desktop": "inline-block px-3 py-2 text-sm",
} as const;

// Utility function to get responsive classes
export function getResponsiveClasses(
  pattern:
    | keyof typeof responsiveText
    | keyof typeof responsiveSpacing
    | keyof typeof responsiveContainers
    | keyof typeof responsiveGrids
    | keyof typeof responsiveFlex
    | keyof typeof responsiveButtons
    | keyof typeof mobileUtilities
    | keyof typeof responsiveNav
): string {
  return (
    responsiveText[pattern as keyof typeof responsiveText] ||
    responsiveSpacing[pattern as keyof typeof responsiveSpacing] ||
    responsiveContainers[pattern as keyof typeof responsiveContainers] ||
    responsiveGrids[pattern as keyof typeof responsiveGrids] ||
    responsiveFlex[pattern as keyof typeof responsiveFlex] ||
    responsiveButtons[pattern as keyof typeof responsiveButtons] ||
    mobileUtilities[pattern as keyof typeof mobileUtilities] ||
    responsiveNav[pattern as keyof typeof responsiveNav] ||
    ""
  );
}

// Hook for detecting device type
export function useDeviceType() {
  if (typeof window === "undefined") return "desktop";

  const width = window.innerWidth;
  if (width < devices.tablet.min) return "mobile";
  if (width < devices.desktop.min) return "tablet";
  return "desktop";
}

// Media query helpers
export const mediaQueries = {
  mobile: `@media (max-width: ${devices.mobile.max}px)`,
  tablet: `@media (min-width: ${devices.tablet.min}px) and (max-width: ${devices.tablet.max}px)`,
  desktop: `@media (min-width: ${devices.desktop.min}px)`,
  retina:
    "@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)",
} as const;

// CSS-in-JS responsive helpers
export const responsive = {
  mobile: (styles: Record<string, any>) => ({
    [`@media (max-width: ${devices.mobile.max}px)`]: styles,
  }),
  tablet: (styles: Record<string, any>) => ({
    [`@media (min-width: ${devices.tablet.min}px) and (max-width: ${devices.tablet.max}px)`]:
      styles,
  }),
  desktop: (styles: Record<string, any>) => ({
    [`@media (min-width: ${devices.desktop.min}px)`]: styles,
  }),
};

// Performance considerations for mobile
export const mobilePerformance = {
  // Lazy load images below the fold
  imageLazyLoading: 'loading="lazy"',
  // Preload critical images
  imagePreloading: 'loading="eager"',
  // Optimize for mobile viewport
  viewportMeta:
    '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">',
  // Reduce motion for accessibility
  reduceMotion: "motion-reduce:animate-none",
} as const;

// Mobile-first design principles
export const designPrinciples = {
  // Content hierarchy: Most important content first
  contentFirst: "Mobile content should be prioritized and simplified",

  // Touch-friendly interactions
  touchFriendly: "Minimum 44px touch targets with adequate spacing",

  // Progressive enhancement
  progressiveEnhancement:
    "Start with mobile experience, enhance for larger screens",

  // Performance first
  performanceFirst: "Optimize for mobile networks and devices",

  // Accessibility
  accessibility: "Ensure keyboard navigation and screen reader compatibility",
} as const;

// Export all patterns for easy access
export const allResponsivePatterns = {
  ...responsiveText,
  ...responsiveSpacing,
  ...responsiveContainers,
  ...responsiveGrids,
  ...responsiveFlex,
  ...responsiveButtons,
  ...mobileUtilities,
  ...responsiveNav,
  ...touchTargets,
} as const;
