import type { ReactNode } from "react";

import {
  glassCardClass,
  glassPanelClass,
  homeBackgroundClass,
  homeContentWrapperClass,
  homeOverlayBottomClass,
  homeOverlayTopClass,
} from "@/features/home/components/homeTheme";
import { cn } from "@/lib/utils";

type Stat = {
  label: string;
  value: string;
};

type AuthExperienceLayoutProps = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  highlight?: string;
  stats?: Stat[];
  children: ReactNode;
};

const defaultStats: Stat[] = [
  { label: "Familii transformate", value: "10.000+" },
  { label: "Durata configurării", value: "< 5 min" },
  { label: "Grad de recomandare", value: "4.9/5" },
];

export function AuthExperienceLayout({
  eyebrow = "Transformă-ți copilul",
  title,
  subtitle,
  highlight = "Acces instant la ecosistemul TechTots",
  stats = defaultStats,
  children,
}: AuthExperienceLayoutProps) {
  return (
    <div className={cn(homeBackgroundClass, "py-12 sm:py-16 lg:py-20")}>
      <div className={homeOverlayTopClass} aria-hidden />
      <div className={homeOverlayBottomClass} aria-hidden />

      <div className={cn(homeContentWrapperClass, "px-4 sm:px-6 lg:px-8")}>
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 xl:gap-20">
          <div
            className={cn(
              glassPanelClass,
              "relative overflow-hidden rounded-3xl border-slate-200/70 bg-white/90 p-6 text-slate-900 shadow-2xl shadow-slate-300/60 backdrop-blur-sm sm:p-8 lg:p-10"
            )}
          >
            <div className="pointer-events-none absolute -top-20 right-0 h-48 w-48 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 left-6 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl" />
            <div className="relative space-y-6">
              <div className="inline-flex items-center rounded-full border border-emerald-300/70 bg-emerald-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                {eyebrow}
              </div>
              <div className="space-y-4">
                <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">
                  {title}
                </h1>
                <p className="text-base text-slate-700 sm:text-lg">{subtitle}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 text-sm text-slate-800 shadow-inner shadow-slate-200 sm:text-base">
                {highlight}
              </div>
              <dl className="grid gap-4 sm:grid-cols-3">
                {stats.map(stat => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4"
                  >
                    <dt className="text-xs uppercase tracking-wide text-slate-500">
                      {stat.label}
                    </dt>
                    <dd className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-br from-emerald-400/50 via-sky-500/60 to-indigo-500/50 blur-2xl opacity-60" />
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-white via-slate-50 to-slate-100 opacity-80 blur-xl" />
            <div
              className={cn(
                glassCardClass,
                "relative z-10 w-full rounded-[28px] border-slate-200 bg-white p-6 text-slate-900 shadow-2xl shadow-slate-300/60 sm:p-8"
              )}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


