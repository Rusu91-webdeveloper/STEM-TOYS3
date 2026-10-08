"use client";

import { Plus, RefreshCw, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { OperationsOverview } from "@/lib/admin/api";
import type { DashboardData } from "@/lib/admin/dashboard-types";

import { DashboardAttention } from "./dashboard-attention";
import { DashboardMetricCards } from "./dashboard-metric-cards";
import { DashboardOrders } from "./dashboard-orders";
import { DashboardSales, DashboardTopProducts } from "./dashboard-sales";
import { DashboardError, DashboardLoading } from "./dashboard-status";
import { DashboardSuppliers } from "./dashboard-suppliers";
import { useDashboardResource } from "./use-dashboard-resource";

export function OwnerDashboard({ report = false }: { report?: boolean }) {
  const [period, setPeriod] = useState("30");
  const [refresh, setRefresh] = useState(0);
  const business = useDashboardResource<DashboardData>(
    `/api/admin/dashboard?period=${period}`,
    refresh
  );
  const operations = useDashboardResource<OperationsOverview>(
    report ? null : "/api/admin/operations-overview",
    refresh
  );
  const retry = () => setRefresh(value => value + 1);
  const data = business.data;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600">
            TechTots · Administrare
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {report ? "Raport de vânzări" : "Magazinul tău, dintr-o privire"}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500">
            {report
              ? "Comenzi, clienți și produse vândute în perioada aleasă."
              : "Vezi evoluția afacerii și ce ai de rezolvat astăzi."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="dashboard-period" className="sr-only">
            Perioada raportului
          </label>
          <select
            id="dashboard-period"
            value={period}
            onChange={event => setPeriod(event.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-violet-600"
          >
            <option value="1">Astăzi</option>
            <option value="7">Ultimele 7 zile</option>
            <option value="30">Ultimele 30 de zile</option>
            <option value="90">Ultimele 90 de zile</option>
          </select>
          <Button
            variant="outline"
            onClick={retry}
            disabled={business.loading || operations.loading}
            aria-label="Actualizează datele"
          >
            <RefreshCw
              className={`h-4 w-4 ${business.loading || operations.loading ? "animate-spin" : ""}`}
            />
            <span className="ml-2 hidden sm:inline">Actualizează</span>
          </Button>
        </div>
      </div>
      {business.error ? (
        <DashboardError
          message={business.error}
          stale={Boolean(data)}
          onRetry={retry}
        />
      ) : null}
      {business.loading && !data ? <DashboardLoading /> : null}
      {data ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              {new Date(data.metadata.start).toLocaleDateString("ro-RO", {
                timeZone: "Europe/Bucharest",
              })}{" "}
              –{" "}
              {new Date(data.metadata.end).toLocaleDateString("ro-RO", {
                timeZone: "Europe/Bucharest",
              })}{" "}
              · ora României · ziua curentă este parțială
            </span>
            <span role="status">
              {business.loading
                ? "Se actualizează…"
                : `Date încărcate la ${new Date(data.metadata.generatedAt).toLocaleTimeString("ro-RO", { timeZone: "Europe/Bucharest", hour: "2-digit", minute: "2-digit" })}`}
            </span>
          </div>
          <DashboardMetricCards data={data} />
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div className="min-w-0 space-y-6 xl:order-2">
              {report ? (
                <DashboardTopProducts products={data.topProducts} />
              ) : (
                <DashboardAttention
                  data={data}
                  operations={operations.data}
                  loading={operations.loading}
                  error={operations.error}
                  retry={retry}
                />
              )}
              {report ? null : (
                <DashboardSuppliers
                  operations={operations.data}
                  count={data.catalog.activeSuppliers}
                  stale={Boolean(operations.error && operations.data)}
                />
              )}
              {!report && <DashboardTopProducts products={data.topProducts} />}
            </div>
            <div className="min-w-0 space-y-6 xl:order-1">
              <DashboardSales data={data} />
              <DashboardOrders orders={data.recentOrders} />
            </div>
          </div>
          <details className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500">
            <summary className="cursor-pointer font-medium text-slate-600">
              Cum sunt calculate cifrele
            </summary>
            <div className="mt-3 max-w-4xl space-y-2 leading-relaxed">
              <p>
                Valoarea comenzilor achitate include comenzile în RON cu plata
                marcată achitată/finalizată, după data plasării. Include
                transportul și taxele din totalul comenzii. Comenzile anulate
                sau cu plata rambursată integral sunt excluse. Rambursările
                parțiale nu sunt deduse; această valoare nu reprezintă profitul
                sau încasările bancare reconciliate.
              </p>
              <p>
                Clienții sunt cumpărători distincți cu cel puțin o comandă
                neanulată în perioada selectată, inclusiv cumpărătorii fără cont
                activ. Comenzile plasate includ și anulările. Comparația
                folosește perioada calendaristică precedentă; ziua curentă este
                incompletă.
              </p>
              <p>
                Produsele, furnizorii și sarcinile arată situația curentă,
                indiferent de perioada aleasă. Un produs activ nu este automat
                disponibil pentru vânzare. Datele se actualizează la deschiderea
                paginii sau prin butonul Actualizează.
              </p>
            </div>
          </details>
        </>
      ) : null}
      {!report ? (
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/admin/products/create">
              <Plus className="mr-2 h-4 w-4" />
              Adaugă un produs
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/settings">
              <Settings className="mr-2 h-4 w-4" />
              Configurează magazinul
            </Link>
          </Button>
        </div>
      ) : (
        <Link
          href="/admin/analytics"
          className="inline-block text-sm text-violet-700 hover:underline"
        >
          ← Toate rapoartele
        </Link>
      )}
    </div>
  );
}
