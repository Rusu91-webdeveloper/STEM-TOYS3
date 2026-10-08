import { z } from "zod";

const text = (max = 300) => z.string().trim().max(max);
const amount = z
  .string()
  .regex(
    /^\d+(\.\d{1,2})?$/,
    "Introdu o sumă pozitivă, cu cel mult două zecimale."
  )
  .refine(value => Number(value) <= 1000000, "Suma este prea mare.");
const percentage = amount.refine(
  value => Number(value) <= 100,
  "Procentul trebuie să fie între 0 și 100."
);
const price = z.object({ price: amount, active: z.boolean() });
const service = z.object({
  id: text(80).min(1),
  name: text(120).min(1),
  description: text(300),
  estimatedDelivery: text(80),
  methodType: z.enum(["home", "easybox"]),
  enabled: z.boolean().optional(),
  priceOverride: amount.optional(),
});
export const shippingSchema = z
  .object({
    deliveryPrice: price,
    freeThreshold: price,
    insuranceThreshold: amount.optional(),
    fanCourierPickup: z
      .object({
        enabled: z.boolean(),
        windowStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        windowEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        offsetDays: z.number().int().min(0).max(30).optional(),
        observations: text(500).optional(),
      })
      .refine(
        value => !value.enabled || value.windowStart < value.windowEnd,
        "Ora de încheiere trebuie să fie după ora de început."
      )
      .optional(),
    couriers: z
      .array(
        z.object({
          id: text(80).min(1),
          name: text(120).min(1),
          enabled: z.boolean(),
          isDefault: z.boolean().optional(),
          services: z.array(service).max(20),
        })
      )
      .max(20)
      .optional(),
  })
  .superRefine((value, ctx) => {
    const couriers = value.couriers ?? [];
    if (
      couriers.length &&
      !couriers.some(
        c => c.enabled && c.services.some(s => s.enabled !== false)
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Păstrează cel puțin un serviciu de livrare activ.",
      });
    if (
      new Set(couriers.map(c => c.id)).size !== couriers.length ||
      couriers.some(
        c => new Set(c.services.map(s => s.id)).size !== c.services.length
      )
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Identificatorii curierilor și serviciilor trebuie să fie unici.",
      });
  });
export const generalSchema = z.object({
  storeName: text(120).min(1),
  storeUrl: z
    .string()
    .trim()
    .url()
    .max(500)
    .refine(
      value => /^https?:\/\//.test(value),
      "Folosește o adresă HTTP sau HTTPS."
    ),
  storeDescription: text(2000),
  contactEmail: z.string().trim().email().max(254),
  contactPhone: text(50).min(6),
});
export const codSchema = z.object({
  percentage,
  fixedFee: amount,
  active: z.boolean(),
});
export const taxSchema = z
  .object({
    rate: percentage,
    active: z.boolean(),
    includeInPrice: z.boolean(),
    vatRegistered: z.boolean().optional(),
  })
  .refine(
    value => value.vatRegistered !== false || !value.active,
    "Activează aplicarea TVA numai după confirmarea înregistrării firmei."
  );
export const settingsFieldsSchema = generalSchema.extend({
  shippingSettings: shippingSchema,
  codSettings: codSchema,
  taxSettings: taxSchema,
});
const version = { expectedUpdatedAt: z.string().datetime().nullable() };
export const settingsUpdateSchema = z.discriminatedUnion("section", [
  generalSchema.extend({ section: z.literal("general"), ...version }).strict(),
  z
    .object({
      section: z.literal("shipping"),
      shippingSettings: shippingSchema,
      ...version,
    })
    .strict(),
  z
    .object({ section: z.literal("cod"), codSettings: codSchema, ...version })
    .strict(),
  z
    .object({ section: z.literal("tax"), taxSettings: taxSchema, ...version })
    .strict(),
]);
export const backupCreateSchema = z
  .object({ name: text(100).min(1), ...version })
  .strict();
export const backupRestoreSchema = z.object(version).strict();
export type SettingsFields = z.infer<typeof settingsFieldsSchema>;
export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>;
export type ShippingSettings = SettingsFields["shippingSettings"];
export type SettingsSection = SettingsUpdate["section"];
