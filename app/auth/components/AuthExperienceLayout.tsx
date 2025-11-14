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
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 xl:gap-20 items-center">
          <div
            className={cn(
              glassPanelClass,
              "relative overflow-hidden p-6 sm:p-8 lg:p-10 text-slate-100 shadow-2xl"
            )}
          >
            <div className="absolute -top-16 right-0 h-48 w-48 rounded-full bg-emerald-400/30 blur-3xl opacity-60" />
            <div className="absolute -bottom-12 left-6 h-40 w-40 rounded-full bg-indigo-500/30 blur-3xl opacity-70" />
            <div className="relative space-y-6">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                {eyebrow}
              </div>
              <div className="space-y-4">
                <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
                  {title}
                </h1>
                <p className="text-base text-slate-200 sm:text-lg">{subtitle}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-4 text-sm text-slate-100 shadow-inner shadow-black/20 sm:text-base">
                {highlight}
              </div>
              <dl className="grid gap-4 sm:grid-cols-3">
                {stats.map(stat => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4"
                  >
                    <dt className="text-xs uppercase tracking-wide text-slate-300">
                      {stat.label}
                    </dt>
                    <dd className="text-2xl font-semibold text-white sm:text-3xl">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-br from-emerald-400/50 via-sky-500/60 to-indigo-500/50 blur-2xl opacity-60" />
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/10 via-white/5 to-transparent opacity-70 blur-xl" />
            <div
              className={cn(
                glassCardClass,
                "relative z-10 w-full rounded-[28px] border-white/15 bg-slate-950/70 p-6 shadow-2xl shadow-emerald-500/10 sm:p-8"
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


