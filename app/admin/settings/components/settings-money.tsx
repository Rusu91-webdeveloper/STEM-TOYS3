"use client";

import type { SettingsFields } from "@/lib/admin/settings-schema";
import { formatCodFeeLabel } from "@/lib/pricing/cod-settings";

import { SettingsField, SettingsForm, SettingsToggle } from "./settings-fields";
import { useSettingsEditor } from "./use-settings-editor";

export function SettingsCOD({
  values,
  saving,
  onDirty,
  onSave,
}: {
  values: SettingsFields["codSettings"];
  saving: boolean;
  onDirty: (dirty: boolean) => void;
  onSave: (values: SettingsFields["codSettings"]) => void;
}) {
  const { draft, setDraft, dirty } = useSettingsEditor(values, onDirty);
  return (
    <SettingsForm
      title="Taxa ramburs"
      description="Taxa adăugată la comenzile cu plata la primire. Disponibilitatea rambursului depinde și de serviciul de livrare."
      dirty={dirty}
      saving={saving}
      onSubmit={() => onSave(draft)}
    >
      <SettingsToggle
        label="Aplică taxa ramburs"
        checked={draft.active}
        onChange={active => setDraft(previous => ({ ...previous, active }))}
        hint="Acest comutator controlează taxa, nu dezactivează metoda de plată."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <SettingsField
          label="Taxă fixă (RON)"
          type="number"
          value={draft.fixedFee}
          onChange={fixedFee =>
            setDraft(previous => ({ ...previous, fixedFee }))
          }
          required
        />
        <SettingsField
          label="Procent (%)"
          type="number"
          value={draft.percentage}
          onChange={percentage =>
            setDraft(previous => ({ ...previous, percentage }))
          }
          required
          hint="Calculat din produse și livrare, după reduceri, înainte de taxa ramburs."
        />
      </div>
      <p className="rounded-xl bg-violet-50 p-4 text-sm text-violet-900">
        Taxă afișată:{" "}
        {draft.active
          ? formatCodFeeLabel(draft) || "Completează valorile."
          : "Taxa ramburs este dezactivată."}
      </p>
    </SettingsForm>
  );
}
export function SettingsTax({
  values,
  saving,
  onDirty,
  onSave,
}: {
  values: SettingsFields["taxSettings"];
  saving: boolean;
  onDirty: (dirty: boolean) => void;
  onSave: (values: SettingsFields["taxSettings"]) => void;
}) {
  const { draft, setDraft, dirty } = useSettingsEditor(values, onDirty);
  return (
    <SettingsForm
      title="TVA"
      description="Configurarea taxei folosite la calculul comenzilor. Alege valorile potrivite situației fiscale a firmei."
      dirty={dirty}
      saving={saving}
      onSubmit={() => onSave(draft)}
    >
      <SettingsToggle
        label="Firma este înregistrată în scopuri de TVA"
        checked={draft.vatRegistered ?? false}
        onChange={vatRegistered =>
          setDraft(previous => ({
            ...previous,
            vatRegistered,
            active: vatRegistered && previous.active,
          }))
        }
        hint="Confirmă situația firmei înainte de a activa calculul TVA. Fără înregistrare, comenzile rămân fără TVA."
      />
      <SettingsToggle
        label="Aplică TVA"
        checked={draft.active}
        onChange={active =>
          setDraft(previous => ({
            ...previous,
            active: Boolean(previous.vatRegistered) && active,
          }))
        }
      />
      <SettingsField
        label="Cota TVA (%)"
        type="number"
        value={draft.rate}
        onChange={rate => setDraft(previous => ({ ...previous, rate }))}
        required
      />
      <SettingsToggle
        label="Prețurile produselor includ TVA"
        checked={draft.includeInPrice}
        onChange={includeInPrice =>
          setDraft(previous => ({ ...previous, includeInPrice }))
        }
        hint="Dacă este dezactivat și TVA este activ, taxa se adaugă la finalizarea comenzii."
      />
    </SettingsForm>
  );
}
