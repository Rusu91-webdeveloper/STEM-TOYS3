import type { Prisma } from "@prisma/client";

import selection from "@/data/upsell/launch-selection.json";
import { mapAgeRangeToAgeGroup } from "@/lib/suppliers/kidstory/age-mapper";

export const launchSelection = selection;
export function jsonObject(value: unknown): Prisma.JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Prisma.JsonObject)
    : {};
}

export function rolloutMetadata(
  existing: unknown,
  supplier: string,
  identity: Prisma.InputJsonObject,
  baseSkus: string[],
  active: boolean
): Prisma.InputJsonObject {
  const metadata = jsonObject(existing);
  const previous = metadata.upsellFor;
  const pairs = Array.from(
    new Set([
      ...(typeof previous === "string"
        ? [previous]
        : Array.isArray(previous)
          ? previous.filter((s): s is string => typeof s === "string")
          : []),
      ...baseSkus,
    ])
  );
  return {
    ...metadata,
    [supplier.toLowerCase()]: {
      ...jsonObject(metadata[supplier.toLowerCase()]),
      ...identity,
    },
    upsellFor: pairs.length === 1 ? pairs[0] : pairs,
    staged: !active,
    stagedReason: active
      ? "Reviewed compatible add-on"
      : "Reviewed add-on awaiting activation",
    upsellRollout: "2026-09-compatible-addons",
  };
}

export function rolloutAgeGroup(age: string, existing: string | null) {
  const group = mapAgeRangeToAgeGroup(age) ?? existing;
  if (!group) throw new Error(`Missing supplier age range: ${age}`);
  return group;
}

export function validateRolloutIdentity(
  sku: string,
  supplierId: string,
  ean: string,
  product:
    | {
        id: string;
        sku: string | null;
        supplierId: string | null;
        barcode: string | null;
      }
    | undefined,
  link: { productId: string | null } | undefined
) {
  if (
    product &&
    (product.sku !== sku ||
      product.supplierId !== supplierId ||
      product.barcode !== ean)
  ) {
    throw new Error(`Product identity conflict: ${sku}`);
  }
  if (link?.productId && link.productId !== product?.id) {
    throw new Error(`Supplier mapping conflict: ${sku}`);
  }
}
