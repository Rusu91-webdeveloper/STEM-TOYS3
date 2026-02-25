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
        "relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f1f8ff_0%,#ffffff_48%,#eef6ff_100%)] text-slate-900",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(56,189,248,0.18),transparent_42%),radial-gradient(circle_at_85%_12%,rgba(250,204,21,0.14),transparent_38%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_85%,rgba(34,197,94,0.12),transparent_42%),radial-gradient(circle_at_80%_82%,rgba(99,102,241,0.12),transparent_44%)]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
