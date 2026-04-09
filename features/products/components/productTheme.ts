import {
  productsGlassCardClass,
  productsGlassPanelClass,
  productsBackgroundClass,
  productsOverlayTopClass,
  productsOverlayBottomClass,
  productsMutedDividerClass,
  productsAccentPillClass,
} from "./productsTheme";

// Re-export common theme constants to ensure consistency
export {
  productsBackgroundClass as productBackgroundClass,
  productsOverlayTopClass as productOverlayTopClass,
  productsOverlayBottomClass as productOverlayBottomClass,
  productsGlassPanelClass,
  productsGlassCardClass
};

export const productContentWrapperClass =
  "relative z-10 container mx-auto px-2.5 sm:px-6 lg:px-8 py-6 sm:py-12";

// Primary panel (Main product details) - Clean white card
export const productPrimaryPanelClass =
  "bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-8 lg:p-10";

export const productHeroGridClass =
  "grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] xl:gap-16 items-start";

// Secondary panel (Reviews etc) - Clean white card
export const productSecondaryPanelClass =
  "bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-8 lg:p-10 mt-6 sm:mt-8";

// Sub-cards (Specs, Features)
export const productSectionCardClass =
  "bg-slate-50/50 rounded-xl border border-slate-100 p-4 sm:p-6";

export const productSectionStackClass = "grid gap-6 lg:grid-cols-2 xl:gap-8 mt-10";

// Smaller sub-cards
export const productSubSectionCardClass =
  "bg-white rounded-xl border border-slate-100 p-3 sm:p-6 shadow-sm";

export const productTitleClass =
  "text-lg font-bold tracking-tight text-slate-900 sm:text-xl";

export const productMutedTextClass = "text-sm text-slate-500";

export const productBodyTextClass = "text-sm leading-relaxed text-slate-600";

export const productDividerClass = productsMutedDividerClass;

export const productAccentPillClass = productsAccentPillClass;


