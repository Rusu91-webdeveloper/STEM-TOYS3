"use client";

import type { ShippingSettings } from "@/lib/admin/settings-schema";

import { SettingsField, SettingsForm, SettingsToggle } from "./settings-fields";
import { useSettingsEditor } from "./use-settings-editor";

export function SettingsShipping({
  values,
  saving,
  onDirty,
  onSave,
}: {
  values: ShippingSettings;
  saving: boolean;
  onDirty: (dirty: boolean) => void;
  onSave: (values: ShippingSettings) => void;
}) {
  const { draft, setDraft, dirty } = useSettingsEditor(values, onDirty);
  const pickup = draft.fanCourierPickup;
  const updatePickup = (
    change: Partial<NonNullable<ShippingSettings["fanCourierPickup"]>>
  ) =>
    setDraft(previous => ({
      ...previous,
      fanCourierPickup: {
        enabled: false,
        windowStart: "09:00",
        windowEnd: "16:00",
        ...previous.fanCourierPickup,
        ...change,
      },
    }));
  const changeCourier = (
    index: number,
    change: Partial<NonNullable<ShippingSettings["couriers"]>[number]>
  ) =>
    setDraft(previous => ({
      ...previous,
      couriers: previous.couriers?.map((courier, position) =>
        position === index ? { ...courier, ...change } : courier
      ),
    }));
  return (
    <SettingsForm
      title="Livrare și curieri"
      description="Costurile și serviciile oferite la finalizarea comenzii. Modificările se aplică comenzilor noi."
      dirty={dirty}
      saving={saving}
      onSubmit={() => onSave(draft)}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <SettingsField
          label="Cost standard (RON)"
          type="number"
          value={draft.deliveryPrice.price}
          onChange={price =>
            setDraft(previous => ({
              ...previous,
              deliveryPrice: { ...previous.deliveryPrice, price },
            }))
          }
          required
        />
        <SettingsField
          label="Prag transport gratuit (RON)"
          type="number"
          value={draft.freeThreshold.price}
          onChange={price =>
            setDraft(previous => ({
              ...previous,
              freeThreshold: { ...previous.freeThreshold, price },
            }))
          }
          required
        />
      </div>
      <SettingsToggle
        label="Aplică prețul standard de livrare"
        checked={draft.deliveryPrice.active}
        onChange={active =>
          setDraft(previous => ({
            ...previous,
            deliveryPrice: { ...previous.deliveryPrice, active },
          }))
        }
        hint="Tarifele serviciilor și condițiile curierului pot modifica oferta finală."
      />
      <SettingsToggle
        label="Oferă transport gratuit peste prag"
        checked={draft.freeThreshold.active}
        onChange={active =>
          setDraft(previous => ({
            ...previous,
            freeThreshold: { ...previous.freeThreshold, active },
          }))
        }
      />
      <SettingsField
        label="Prag valoare declarată (RON)"
        type="number"
        value={draft.insuranceThreshold ?? "500"}
        onChange={insuranceThreshold =>
          setDraft(previous => ({ ...previous, insuranceThreshold }))
        }
        required
      />
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Servicii disponibile
        </h3>
        {draft.couriers?.map((courier, index) => (
          <details
            key={courier.id}
            className="rounded-xl border border-slate-200 p-4"
            open={courier.enabled}
          >
            <summary className="cursor-pointer text-sm font-medium">
              {courier.name}
            </summary>
            <div className="mt-4 space-y-3">
              <SettingsToggle
                label={`Activează ${courier.name}`}
                checked={courier.enabled}
                onChange={enabled => changeCourier(index, { enabled })}
              />
              {courier.services.map((service, serviceIndex) => (
                <div
                  key={service.id}
                  className="space-y-3 rounded-lg bg-slate-50 p-3"
                >
                  <SettingsToggle
                    label={service.name}
                    checked={service.enabled !== false}
                    onChange={enabled =>
                      changeCourier(index, {
                        services: courier.services.map((entry, i) =>
                          i === serviceIndex ? { ...entry, enabled } : entry
                        ),
                      })
                    }
                    hint={
                      service.methodType === "easybox"
                        ? "Livrare la locker"
                        : "Livrare la adresă"
                    }
                  />
                  <SettingsField
                    label={`Tarif ${service.name} (RON)`}
                    type="number"
                    value={service.priceOverride ?? ""}
                    onChange={priceOverride =>
                      changeCourier(index, {
                        services: courier.services.map((entry, i) =>
                          i === serviceIndex
                            ? {
                                ...entry,
                                priceOverride: priceOverride || undefined,
                              }
                            : entry
                        ),
                      })
                    }
                    hint="Opțional. Lasă gol pentru calculul standard."
                  />
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
      <details className="rounded-xl border border-slate-200 p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Ridicare Fan Courier
        </summary>
        <div className="mt-4 space-y-4">
          <SettingsToggle
            label="Configurează intervalul de ridicare"
            checked={pickup?.enabled ?? false}
            onChange={enabled => updatePickup({ enabled })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SettingsField
              label="Ridicare de la"
              type="time"
              value={pickup?.windowStart ?? "09:00"}
              onChange={windowStart => updatePickup({ windowStart })}
            />
            <SettingsField
              label="Ridicare până la"
              type="time"
              value={pickup?.windowEnd ?? "16:00"}
              onChange={windowEnd => updatePickup({ windowEnd })}
            />
            <SettingsField
              label="Zile până la ridicare"
              type="number"
              value={String(pickup?.offsetDays ?? 0)}
              onChange={value => updatePickup({ offsetDays: Number(value) })}
            />
            <SettingsField
              label="Observații pentru curier"
              value={pickup?.observations ?? ""}
              onChange={observations => updatePickup({ observations })}
              maxLength={500}
            />
          </div>
        </div>
      </details>
    </SettingsForm>
  );
}
