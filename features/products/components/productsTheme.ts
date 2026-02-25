"use client";

// Modern e-commerce theme with clean, light design
// Professional styling that looks like modern online stores

export const productsBackgroundClass =
  "relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f7fcff_0%,#edf7ff_45%,#f5f9ff_100%)] text-slate-900";

export const productsOverlayTopClass =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.09),_transparent_58%),radial-gradient(circle_at_18%_18%,_rgba(16,185,129,0.07),_transparent_42%)]";

export const productsOverlayBottomClass =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(165,180,252,0.10),_transparent_60%),radial-gradient(circle_at_82%_85%,_rgba(251,191,36,0.05),_transparent_40%)]";

export const productsContentWrapperClass =
  "relative z-10 flex flex-col gap-6 sm:gap-7 lg:gap-8 xl:gap-10 before:pointer-events-none before:absolute before:inset-0 before:content-[''] before:opacity-[0.02] before:bg-[radial-gradient(circle,_#0f172a_1px,_transparent_1px)] before:bg-[length:16px_16px]";

export const productsGlassPanelClass =
  "rounded-2xl border border-[#e7dece] bg-[#fbf8f1]/90 shadow-[0_20px_40px_-34px_rgba(71,85,105,0.32)] backdrop-blur-sm";

export const productsGlassCardClass =
  "rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_16px_35px_-30px_rgba(51,65,85,0.35)] transition-shadow duration-200";

export const productsAccentPillClass =
  "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm";

export const productsMutedDividerClass =
  "my-4 border-t border-slate-200/70";
