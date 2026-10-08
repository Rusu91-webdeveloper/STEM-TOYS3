import { AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DashboardError({
  message,
  onRetry,
  stale = false,
}: {
  message: string;
  onRetry: () => void;
  stale?: boolean;
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950"
    >
      <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium">{message}</p>
        <p className="mt-1 text-amber-800">
          {stale
            ? "Ultima situație încărcată este afișată mai jos. Actualizarea a eșuat."
            : "Nicio valoare nu este afișată până la încărcarea datelor."}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Reîncearcă
      </Button>
    </div>
  );
}

export function DashboardLoading() {
  return (
    <div
      role="status"
      aria-label="Se încarcă datele magazinului"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
        />
      ))}
    </div>
  );
}
