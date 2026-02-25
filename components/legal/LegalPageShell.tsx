"use client";

import Image from "next/image";
import { ReactNode } from "react";

interface LegalPageShellProps {
  badge?: string;
  badgeIconSrc?: string;
  badgeIconAlt?: string;
  title: string;
  description: string;
  lastUpdated?: string;
  lastUpdatedLabel?: string;
  children: ReactNode;
}

export function LegalPageShell({
  badge = "TechTots Legal",
  badgeIconSrc = "/TechTots_LOGO.png",
  badgeIconAlt = "TechTots Logo",
  title,
  description,
  lastUpdated,
  lastUpdatedLabel = "Ultimă actualizare",
  children,
}: LegalPageShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/70 text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(99,102,241,0.08),_transparent_60%)]" />
      <div className="relative z-10">
        <section className="container mx-auto px-3 py-8 sm:px-6 sm:py-10 lg:py-16">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-xl shadow-slate-900/10 backdrop-blur sm:p-10">
            <div className="absolute inset-y-[25%] right-0 hidden w-1/3 rounded-full bg-sky-200/50 blur-3xl lg:block" />
            <div className="relative mx-auto max-w-4xl space-y-6 text-center">
              <span className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-sky-700">
                {badgeIconSrc ? (
                  <Image
                    src={badgeIconSrc}
                    alt={badgeIconAlt}
                    width={28}
                    height={28}
                    className="h-7 w-auto"
                  />
                ) : null}
                <span className="text-slate-700">{badge}</span>
              </span>
              <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl lg:text-4xl">
                {title}
              </h1>
              <p className="mx-auto max-w-3xl text-sm text-slate-600 sm:text-base md:text-lg">
                {description}
              </p>
              {lastUpdated ? (
                <div className="mx-auto inline-flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-xs text-slate-600 backdrop-blur sm:text-sm">
                  <span>📅 {lastUpdatedLabel}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span>{lastUpdated}</span>
                </div>
              ) : null}
            </div>
          </div>
        </section>
        <div className="container mx-auto px-3 pb-12 sm:px-6 lg:pb-20">
          <div className="mx-auto max-w-5xl space-y-8 sm:space-y-10 lg:space-y-12">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

