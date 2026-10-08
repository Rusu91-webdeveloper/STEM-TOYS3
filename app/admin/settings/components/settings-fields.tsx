import { type ReactNode } from "react";

import { Button } from "@/components/ui/button";

export function SettingsField({
  label,
  value,
  onChange,
  type = "text",
  hint,
  required = false,
  maxLength = 300,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  hint?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <input
        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
        required={required}
        maxLength={maxLength}
        {...(type === "number" ? { min: 0, step: "0.01" } : {})}
      />
      {hint && (
        <span className="block text-xs font-normal leading-relaxed text-slate-500">
          {hint}
        </span>
      )}
    </label>
  );
}
export function SettingsToggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
      <span>
        <span className="block text-sm font-medium text-slate-800">
          {label}
        </span>
        {hint && (
          <span className="mt-1 block text-xs leading-relaxed text-slate-500">
            {hint}
          </span>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={event => onChange(event.target.checked)}
        className="h-5 w-5 shrink-0 accent-violet-600"
      />
    </label>
  );
}
export function SettingsForm({
  title,
  description,
  children,
  dirty,
  saving,
  onSubmit,
}: {
  title: string;
  description: string;
  children: ReactNode;
  dirty: boolean;
  saving: boolean;
  onSubmit: () => void;
}) {
  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        onSubmit();
      }}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          {description}
        </p>
      </div>
      <fieldset
        disabled={saving}
        className="space-y-5 p-5 disabled:opacity-60 sm:p-7"
      >
        {children}
      </fieldset>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-7">
        <p role="status" className="text-xs text-slate-500">
          {dirty ? "Ai modificări nesalvate." : "Nicio modificare nesalvată."}
        </p>
        <Button
          type="submit"
          disabled={saving || !dirty}
          className="bg-violet-600 hover:bg-violet-700"
        >
          {saving ? "Se salvează…" : "Salvează modificările"}
        </Button>
      </div>
    </form>
  );
}
