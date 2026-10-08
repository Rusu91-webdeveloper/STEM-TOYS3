"use client";

import type { SettingsFields } from "@/lib/admin/settings-schema";

import { SettingsField, SettingsForm } from "./settings-fields";
import { useSettingsEditor } from "./use-settings-editor";

export type GeneralFields = Pick<
  SettingsFields,
  | "storeName"
  | "storeUrl"
  | "storeDescription"
  | "contactEmail"
  | "contactPhone"
>;
export function SettingsGeneral({
  values,
  saving,
  onDirty,
  onSave,
}: {
  values: GeneralFields;
  saving: boolean;
  onDirty: (dirty: boolean) => void;
  onSave: (values: GeneralFields) => void;
}) {
  const { draft, setDraft, dirty } = useSettingsEditor(values, onDirty);
  const update = (key: keyof GeneralFields, value: string) =>
    setDraft(previous => ({ ...previous, [key]: value }));
  return (
    <SettingsForm
      title="Identitatea magazinului"
      description="Datele de contact folosite în magazin și în comunicările cu clienții."
      dirty={dirty}
      saving={saving}
      onSubmit={() => onSave(draft)}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <SettingsField
          label="Numele magazinului"
          value={draft.storeName}
          onChange={value => update("storeName", value)}
          required
          maxLength={120}
        />
        <SettingsField
          label="Adresa magazinului"
          value={draft.storeUrl}
          onChange={value => update("storeUrl", value)}
          type="url"
          required
        />
        <SettingsField
          label="E-mail de contact"
          value={draft.contactEmail}
          onChange={value => update("contactEmail", value)}
          type="email"
          required
        />
        <SettingsField
          label="Telefon de contact"
          value={draft.contactPhone}
          onChange={value => update("contactPhone", value)}
          type="tel"
          required
          maxLength={50}
        />
      </div>
      <label className="block space-y-2 text-sm font-medium text-slate-700">
        <span>Descrierea magazinului</span>
        <textarea
          value={draft.storeDescription}
          onChange={event => update("storeDescription", event.target.value)}
          maxLength={2000}
          rows={4}
          className="w-full rounded-lg border border-slate-200 p-3 font-normal outline-violet-500"
        />
      </label>
    </SettingsForm>
  );
}
