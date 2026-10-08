"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SettingsView } from "@/lib/admin/settings-view";

import { SettingsField } from "./settings-fields";

const dateLabel = (date: string) =>
  new Date(date).toLocaleString("ro-RO", {
    timeZone: "Europe/Bucharest",
    dateStyle: "medium",
    timeStyle: "short",
  });
export function SettingsHistoryPanel({
  data,
  saving,
  onCreate,
  onRestore,
}: {
  data: SettingsView;
  saving: boolean;
  onCreate: (name: string) => Promise<boolean>;
  onRestore: (id: string) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        <h2 className="text-lg font-semibold text-slate-950">
          Copii ale setărilor
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Păstrăm cele mai recente 30 de copii. Fiecare salvare și restaurare
          creează automat o copie a valorilor anterioare. Aceste copii includ
          datele magazinului, livrarea, taxa ramburs și TVA; comenzile, clienții
          și cheile de acces au administrare separată.
        </p>
        <form
          className="mt-5 flex flex-wrap items-end gap-3"
          onSubmit={async event => {
            event.preventDefault();
            if (await onCreate(name.trim())) setName("");
          }}
        >
          <div className="min-w-0 flex-1">
            <SettingsField
              label="Numele copiei"
              value={name}
              onChange={setName}
              required
              maxLength={100}
            />
          </div>
          <Button type="submit" disabled={saving || !name.trim()}>
            Creează o copie
          </Button>
        </form>
        <ul className="mt-6 divide-y divide-slate-100">
          {data.backups.map(backup => (
            <li
              key={backup.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div className="min-w-0">
                <p className="break-words text-sm font-medium text-slate-800">
                  {backup.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {dateLabel(backup.date)} · {backup.actor}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => setSelected(backup.id)}
              >
                Restaurează
              </Button>
            </li>
          ))}
        </ul>
        {!data.backups.length && (
          <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            Nu există încă o copie a setărilor. Creează prima copie sau salvează
            o modificare.
          </p>
        )}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        <h2 className="text-lg font-semibold text-slate-950">
          Istoricul modificărilor
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Cele mai recente 100 de acțiuni înregistrate din acest panou.
        </p>
        <ol className="mt-5 divide-y divide-slate-100">
          {data.history.map(entry => (
            <li key={entry.id} className="py-4">
              <p className="text-sm font-medium text-slate-800">
                {entry.action === "save"
                  ? "Setări salvate"
                  : entry.action === "restore"
                    ? "Copie restaurată"
                    : "Copie creată"}{" "}
                · {entry.section}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {dateLabel(entry.date)} · {entry.actor}
              </p>
            </li>
          ))}
        </ol>
        {!data.history.length && (
          <p className="mt-4 text-sm text-slate-500">
            Nu există încă modificări înregistrate din acest panou.
          </p>
        )}
      </section>
      <Dialog
        open={Boolean(selected)}
        onOpenChange={open => {
          if (!open && !saving) setSelected(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurezi această copie?</DialogTitle>
            <DialogDescription>
              Se vor înlocui datele magazinului, livrarea, taxa ramburs și TVA
              cu valorile copiei „
              {data.backups.find(backup => backup.id === selected)?.name}”.
              Valorile curente se salvează într-o copie nouă înainte de
              restaurare.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => setSelected(null)}
            >
              Renunță
            </Button>
            <Button
              disabled={saving}
              onClick={async () => {
                if (selected && (await onRestore(selected))) setSelected(null);
              }}
            >
              {saving ? "Se restaurează…" : "Confirmă restaurarea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
