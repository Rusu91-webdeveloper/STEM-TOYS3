/**
 * Light checkout page surfaces (screenshot-aligned: white cards, gray page shell).
 */
export const checkoutPageShellClass =
  "min-h-screen bg-slate-100 text-slate-900 [color-scheme:light]";

export const checkoutCardClass =
  "rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white text-slate-900 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.1)] sm:shadow-[0_8px_32px_-12px_rgba(15,23,42,0.14)]";

export const checkoutPromoPanelClass =
  "rounded-lg border border-slate-200/80 bg-slate-50";

export const checkoutStepperSurfaceClass = `${checkoutCardClass} shadow-[0_2px_16px_-6px_rgba(15,23,42,0.08)]`;

export const checkoutInputSurfaceClass =
  "rounded-lg border border-slate-200 bg-slate-50/80 text-slate-900 placeholder:text-slate-400";

/** Inputs on light cards: high contrast, screenshot-style light gray fill */
export const checkoutFieldInputClass =
  "rounded-lg border border-slate-200 bg-slate-100 text-slate-900 shadow-sm placeholder:text-slate-500 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20";

export const checkoutFieldLabelClass = "font-medium text-slate-800";

export const checkoutMutedTextClass = "text-slate-600";

export const checkoutInfoBannerClass =
  "rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm font-medium text-sky-950";

export const checkoutBorderSubtleClass = "border-slate-200";
