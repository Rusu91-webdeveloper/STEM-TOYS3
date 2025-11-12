"use client";

import clsx from "clsx";
import { ReactNode } from "react";

interface SupplierMarketingShellProps {
  children: ReactNode;
  className?: string;
}

export function SupplierMarketingShell({
  children,
  className,
}: SupplierMarketingShellProps) {
  return (
    <div
      className={clsx(
        "relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-slate-100",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(129,140,248,0.16),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,_rgba(15,23,42,0.7),_rgba(30,64,175,0.35),_rgba(15,23,42,0.8))]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}


