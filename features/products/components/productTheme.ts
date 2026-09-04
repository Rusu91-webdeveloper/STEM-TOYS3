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
  productsGlassCardClass,
};

export const productContentWrapperClass =
  "relative z-10 container mx-auto max-w-[1440px] px-3 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10";

// Primary panel (Main product details) - Clean white card
export const productPrimaryPanelClass =
  "rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-[0_28px_70px_-52px_rgba(15,23,42,0.42)] sm:rounded-[2rem] sm:p-8 lg:p-10";

export const productHeroGridClass =
  "grid items-start gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] xl:gap-12";

// Secondary panel (Reviews etc) - Clean white card
export const productSecondaryPanelClass =
  "mt-6 rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-[0_28px_70px_-52px_rgba(15,23,42,0.35)] sm:mt-8 sm:rounded-[2rem] sm:p-8 lg:p-10";

// Sub-cards (Specs, Features)
export const productSectionCardClass =
  "rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 sm:p-6";

export const productSectionStackClass =
  "grid gap-6 lg:grid-cols-2 xl:gap-8 mt-10";

// Smaller sub-cards
export const productSubSectionCardClass =
  "rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_16px_40px_-36px_rgba(15,23,42,0.35)] sm:p-6";

export const productTitleClass =
  "text-lg font-bold tracking-tight text-slate-900 sm:text-xl";

export const productMutedTextClass = "text-sm text-slate-500";

export const productBodyTextClass = "text-sm leading-relaxed text-slate-600";

export const productDividerClass = productsMutedDividerClass;

export const productAccentPillClass = productsAccentPillClass;
