import type { SupplierFeedSyncResult } from "@/lib/suppliers/sync";

export function summarizeSupplierSyncResults(
  results: SupplierFeedSyncResult[]
) {
  const totals = results.reduce(
    (total, feed) => ({
      imported: total.imported + feed.imported,
      updated: total.updated + feed.updated,
      failed: total.failed + feed.failed,
      zeroed: total.zeroed + feed.zeroed,
    }),
    { imported: 0, updated: 0, failed: 0, zeroed: 0 }
  );
  const failedFeeds = results.filter(
    feed => feed.status === "FAILED" || feed.failed > 0
  ).length;

  return { totals, failedFeeds };
}
