"use client";

// Shared visual tokens for the `/products` experience so it mirrors the
// home page's premium dark-glass aesthetic while keeping product-specific
// hooks encapsulated within the products feature folder.
// The classes are intentionally aligned with `homeTheme.ts` but scoped
// locally to avoid cross-feature coupling and give us flexibility to
// tweak the catalog independently if needed.

export const productsBackgroundClass =
  "relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-slate-100";

export const productsOverlayTopClass =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_55%)]";

export const productsOverlayBottomClass =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(129,140,248,0.16),_transparent_60%)]";

export const productsContentWrapperClass =
  "relative z-10 flex flex-col gap-6 sm:gap-7 lg:gap-8 xl:gap-10";

export const productsGlassPanelClass =
  "rounded-3xl border border-white/12 bg-white/8 shadow-xl shadow-indigo-900/30 backdrop-blur-2xl";

export const productsGlassCardClass =
  "rounded-2xl border border-white/10 bg-slate-900/70 shadow-lg shadow-black/30 backdrop-blur-xl";

export const productsAccentPillClass =
  "inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-400/90 via-indigo-400/90 to-purple-400/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-lg shadow-sky-500/40";

export const productsMutedDividerClass =
  "my-4 border-t border-white/10";


