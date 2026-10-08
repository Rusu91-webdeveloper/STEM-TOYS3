import Link from "next/link";

import type { OperationsOverview } from "@/lib/admin/api";

const syncLabels: Record<string, string> = {
  COMPLETED: "Finalizată",
  SUCCESS: "Finalizată",
  FAILED: "Eșuată",
  RUNNING: "În curs",
  PENDING: "În așteptare",
  PARTIAL: "Parțială",
};

export function DashboardSuppliers({
  operations,
  count,
  stale = false,
}: {
  operations: OperationsOverview | null;
  count: number;
  stale?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-950">Furnizori</h2>
          <p className="mt-1 text-xs text-slate-500">
            {count} {count === 1 ? "activ" : "activi"} în magazin
          </p>
        </div>
        <Link
          href="/admin/suppliers"
          className="text-xs font-medium text-violet-700 hover:underline"
        >
          Gestionează →
        </Link>
      </div>
      {stale && (
        <p className="mt-3 text-xs text-amber-800">
          Ultima situație încărcată. Starea furnizorilor nu a putut fi
          actualizată.
        </p>
      )}
      {!operations ? (
        <p className="mt-5 text-sm text-slate-500">
          Starea sincronizărilor nu este disponibilă.
        </p>
      ) : operations.supplierHealth.length === 0 ? (
        <p className="mt-5 text-sm text-slate-500">
          Niciun furnizor în situația operațională.
        </p>
      ) : (
        <div className="mt-3 divide-y divide-slate-100">
          {operations.supplierHealth.slice(0, 3).map(supplier => (
            <div key={supplier.supplierId} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/admin/suppliers/${supplier.supplierId}`}
                  className="text-sm font-medium hover:text-violet-700"
                >
                  {supplier.supplierName}
                </Link>
                <span
                  className={`text-xs ${supplier.issues > 0 ? "text-amber-700" : "text-slate-500"}`}
                >
                  {supplier.issues}{" "}
                  {supplier.issues === 1 ? "problemă" : "probleme"}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {supplier.openLines}{" "}
                {supplier.openLines === 1
                  ? "poziție deschisă"
                  : "poziții deschise"}{" "}
                ·{" "}
                {supplier.latestSyncJob
                  ? `Sincronizare: ${syncLabels[supplier.latestSyncJob.status] ?? supplier.latestSyncJob.status}`
                  : "Fără sincronizare înregistrată"}
              </p>
              {supplier.latestSyncJob?.finishedAt ? (
                <p className="mt-1 text-[11px] text-slate-400">
                  {new Date(supplier.latestSyncJob.finishedAt).toLocaleString(
                    "ro-RO",
                    { timeZone: "Europe/Bucharest" }
                  )}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
      <Link
        href="/admin/suppliers/feeds"
        className="mt-3 inline-block text-xs font-medium text-violet-700 hover:underline"
      >
        Verifică sursele de produse →
      </Link>
    </section>
  );
}
