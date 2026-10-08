"use client";

import {
  Building2,
  Truck,
  CreditCard,
  Receipt,
  History,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  DashboardError,
  DashboardLoading,
} from "@/app/admin/components/dashboard-status";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SettingsSection } from "@/lib/admin/settings-schema";

import { SettingsConnections } from "./settings-connections";
import { SettingsGeneral } from "./settings-general";
import { SettingsHistoryPanel } from "./settings-history";
import { SettingsCOD, SettingsTax } from "./settings-money";
import { SettingsShipping } from "./settings-shipping";
import { useAdminSettings } from "./use-admin-settings";

const sections = [
  {
    id: "general",
    title: "Magazin",
    description: "Identitate și contact",
    icon: Building2,
  },
  {
    id: "shipping",
    title: "Livrare",
    description: "Tarife și servicii",
    icon: Truck,
  },
  {
    id: "cod",
    title: "Ramburs",
    description: "Taxa pentru plata la primire",
    icon: CreditCard,
  },
  { id: "tax", title: "TVA", description: "Taxe și prețuri", icon: Receipt },
  {
    id: "connections",
    title: "Acces și integrări",
    description: "Servicii și operațiuni",
    icon: ShieldCheck,
  },
  {
    id: "history",
    title: "Copii și istoric",
    description: "Recuperare și modificări",
    icon: History,
  },
] as const;
type Section = (typeof sections)[number]["id"];
export function SettingsConsole() {
  const settings = useAdminSettings();
  const [section, setSection] = useState<Section>("general");
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState<Section | "reload" | null>(null);
  const [reset, setReset] = useState(0);
  const onDirty = useCallback((value: boolean) => setDirty(value), []);
  useEffect(() => {
    if (!dirty) return undefined;
    const protect = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, [dirty]);
  const select = (target: Section | "reload") => {
    if (settings.saving) return;
    if (dirty) {
      setDiscard(target);
      return;
    }
    if (target === "reload") void settings.load();
    else setSection(target);
  };
  const save = (section: SettingsSection, values: Record<string, unknown>) =>
    settings.write(
      "/api/admin/settings",
      "PUT",
      { section, ...values },
      "Modificările au fost salvate."
    );
  const data = settings.data;
  const formProps = { saving: settings.saving || settings.loading, onDirty };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600">
            TechTots · Configurare
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Setările magazinului
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500">
            Configurează vânzarea, livrarea și datele magazinului, într-un
            singur loc.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={settings.loading || settings.saving}
          onClick={() => select("reload")}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reîncarcă
        </Button>
      </div>
      {settings.error && (
        <DashboardError
          message={settings.error}
          stale={Boolean(data)}
          onRetry={() => select("reload")}
        />
      )}
      {settings.message && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {settings.message}
        </p>
      )}
      {settings.loading && !data && <DashboardLoading />}
      {data && (
        <>
          {data.warnings?.map(warning => (
            <p
              key={warning}
              role="alert"
              className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
            >
              {warning}
            </p>
          ))}
          <p className="text-xs text-slate-500">
            {data.updatedAt
              ? `Ultima actualizare: ${new Date(data.updatedAt).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" })}`
              : "Configurare inițială · valorile se înregistrează la prima salvare."}
          </p>
          <div className="grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
            <nav
              aria-label="Secțiuni setări"
              className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-white p-2 sm:grid-cols-3 lg:sticky lg:top-20 lg:grid-cols-1"
            >
              {sections.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={section === item.id ? "page" : undefined}
                    disabled={settings.saving}
                    onClick={() => select(item.id)}
                    className={`flex min-h-12 items-center gap-2 rounded-xl px-3 py-3 text-left sm:min-h-16 sm:gap-3 transition-colors ${section === item.id ? "bg-violet-50 text-violet-800" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>
                      <span className="block text-sm font-semibold">
                        {item.title}
                      </span>
                      <span className="mt-1 hidden text-xs opacity-75 sm:block">
                        {item.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
            <div
              key={`${section}-${data.updatedAt}-${reset}`}
              className="min-w-0"
            >
              {section === "general" && (
                <SettingsGeneral
                  {...formProps}
                  values={{
                    storeName: data.storeName,
                    storeUrl: data.storeUrl,
                    storeDescription: data.storeDescription,
                    contactEmail: data.contactEmail,
                    contactPhone: data.contactPhone,
                  }}
                  onSave={values => {
                    void save("general", values);
                  }}
                />
              )}
              {section === "shipping" && (
                <SettingsShipping
                  {...formProps}
                  values={data.shippingSettings}
                  onSave={shippingSettings => {
                    void save("shipping", { shippingSettings });
                  }}
                />
              )}
              {section === "cod" && (
                <SettingsCOD
                  {...formProps}
                  values={data.codSettings}
                  onSave={codSettings => {
                    void save("cod", { codSettings });
                  }}
                />
              )}
              {section === "tax" && (
                <SettingsTax
                  {...formProps}
                  values={data.taxSettings}
                  onSave={taxSettings => {
                    void save("tax", { taxSettings });
                  }}
                />
              )}
              {section === "connections" && <SettingsConnections data={data} />}
              {section === "history" && (
                <SettingsHistoryPanel
                  data={data}
                  saving={formProps.saving}
                  onCreate={name =>
                    settings.write(
                      "/api/admin/settings/backups",
                      "POST",
                      { name },
                      "Copia setărilor a fost creată."
                    )
                  }
                  onRestore={id =>
                    settings.write(
                      `/api/admin/settings/backups/${id}/restore`,
                      "POST",
                      {},
                      "Setările au fost restaurate. Valorile anterioare sunt disponibile într-o copie nouă."
                    )
                  }
                />
              )}
            </div>
          </div>
        </>
      )}
      <Dialog
        open={Boolean(discard)}
        onOpenChange={open => {
          if (!open) setDiscard(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ai modificări nesalvate</DialogTitle>
            <DialogDescription>
              Salvează înainte de a continua sau renunță la modificările din
              această secțiune.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscard(null)}>
              Continuă editarea
            </Button>
            <Button
              onClick={() => {
                const target = discard;
                setDiscard(null);
                setDirty(false);
                setReset(value => value + 1);
                if (target === "reload") void settings.load();
                else if (target) setSection(target);
              }}
            >
              Renunță la modificări
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
