import {
  BORIBON_ID,
  BORIBON_MAX_AGE_MS,
  boribonStockIsFresh,
  isCuratedBoribon,
} from "./boribon/feed";
import { KIDSTORY_ID } from "./kidstory/feed";
export const CURATED_SUPPLIER_IDS = [BORIBON_ID, KIDSTORY_ID];
export const CURATED_MAX_AGE_MS = BORIBON_MAX_AGE_MS;
export const curatedStockIsFresh = boribonStockIsFresh;
export function isCuratedSupplier(
  supplierId: string | null,
  metadata: unknown
) {
  return (
    isCuratedBoribon(supplierId, metadata) ||
    (supplierId === KIDSTORY_ID &&
      typeof metadata === "object" &&
      metadata !== null &&
      "kidstory" in metadata)
  );
}
