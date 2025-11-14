import {
  glassCardClass,
  glassPanelClass,
  homeBackgroundClass,
  homeContentWrapperClass,
  homeOverlayBottomClass,
  homeOverlayTopClass,
  subtleDividerClass,
} from "@/features/home/components/homeTheme";

export const productBackgroundClass = `${homeBackgroundClass} text-slate-100`;

export const productOverlayTopClass = homeOverlayTopClass;

export const productOverlayBottomClass = homeOverlayBottomClass;

export const productContentWrapperClass = `${homeContentWrapperClass} py-8 sm:py-10 lg:py-16`;

export const productPrimaryPanelClass = `${glassPanelClass} mx-auto w-full max-w-6xl border-white/15 bg-slate-950/70 px-4 py-6 shadow-black/40 sm:px-6 lg:px-10 lg:py-10`;

export const productHeroGridClass =
  "grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] xl:gap-12";

export const productSecondaryPanelClass = `${glassPanelClass} mx-auto w-full max-w-6xl border-white/12 bg-slate-950/60 px-4 py-6 shadow-black/30 sm:px-6 lg:px-10 lg:py-10`;

export const productSectionCardClass = `${glassCardClass} border-white/15 bg-slate-900/70 p-4 sm:p-6`;

export const productSectionStackClass =
  "grid gap-5 lg:grid-cols-2 xl:gap-8 mt-8";

export const productSubSectionCardClass = `${glassCardClass} border-white/15 bg-slate-900/60 p-4 sm:p-6`;

export const productTitleClass =
  "text-base font-semibold tracking-tight text-slate-100 sm:text-lg";

export const productMutedTextClass = "text-sm text-slate-300";

export const productBodyTextClass = "text-sm leading-relaxed text-slate-200";

export const productDividerClass = subtleDividerClass;

export const productAccentPillClass =
  "inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-400/90 via-indigo-400/90 to-purple-400/90 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white shadow-lg shadow-indigo-900/40";


