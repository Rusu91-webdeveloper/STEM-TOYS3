import * as fs from "fs";
import * as path from "path";

import { Prisma, PrismaClient, SupplierFeedType } from "@prisma/client";
import * as dotenv from "dotenv";

import {
  BORIBON_ALLOWED_SKUS,
  BORIBON_FEEDS,
  buildBoribonMapping,
  validateBoribonConfig,
} from "../lib/suppliers/boribon-config";
import { isStaticSeedSource } from "../lib/suppliers/source-policy";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

const envLocalPath = path.resolve(process.cwd(), ".env.local");
dotenv.config(
  fs.existsSync(envLocalPath) ? { path: envLocalPath } : undefined
);

type FeedBackup = {
  createdAt: string;
  reason: string;
  feeds: unknown[];
};

type InventoryPoint = {
  id: string;
  stockQuantity: number;
  reservedQuantity: number;
};

function inventoryFingerprint(products: InventoryPoint[]) {
  return products
    .map(product =>
      [product.id, product.stockQuantity, product.reservedQuantity].join(":")
    )
    .join("|");
}

function assertProtectedBackupPath() {
  const configured = process.env.SUPPLIER_FEED_BACKUP_PATH;
  if (!configured) {
    throw new Error(
      "SUPPLIER_FEED_BACKUP_PATH is required with --apply and must point outside the repository."
    );
  }

  const resolved = path.resolve(configured);
  const repositoryRoot = path.resolve(process.cwd());
  if (
    resolved === repositoryRoot ||
    resolved.startsWith(`${repositoryRoot}${path.sep}`)
  ) {
    throw new Error("Supplier feed backup must be stored outside the repository.");
  }
  if (!fs.existsSync(path.dirname(resolved))) {
    throw new Error("Supplier feed backup directory does not exist.");
  }
  return resolved;
}

function writeProtectedBackup(backupPath: string, backup: FeedBackup) {
  const descriptor = fs.openSync(
    backupPath,
    fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_WRONLY,
    0o600
  );
  try {
    fs.writeFileSync(descriptor, `${JSON.stringify(backup, null, 2)}\n`);
  } finally {
    fs.closeSync(descriptor);
  }
}

async function assertSourcesReachable() {
  const checks = await Promise.all(
    BORIBON_FEEDS.map(async feed => {
      try {
        const response = await fetch(feed.sourceUrl, {
          headers: { Accept: "text/csv,application/octet-stream;q=0.9,*/*;q=0.1" },
        });
        await response.body?.cancel();
        return { name: feed.name, ok: response.ok, status: response.status };
      } catch {
        return { name: feed.name, ok: false, status: 0 };
      }
    })
  );
  const failed = checks.filter(check => !check.ok);
  if (failed.length > 0) {
    throw new Error(
      `Unavailable Boribon sources: ${failed
        .map(check => `${check.name} (${check.status || "network error"})`)
        .join(", ")}`
    );
  }
}

async function findSupplier(companySlug: string) {
  const supplier = await prisma.supplier.findFirst({
    where: {
      OR: [
        { companySlug },
        { name: { equals: companySlug, mode: "insensitive" } },
      ],
    },
  });
  if (!supplier) throw new Error(`Supplier not found: ${companySlug}`);
  return supplier;
}

async function main() {
  validateBoribonConfig();
  await assertSourcesReachable();

  const [boribon, kidstory] = await Promise.all([
    findSupplier("boribon"),
    findSupplier("kidstory"),
  ]);
  const [boribonFeeds, kidstoryFeeds, boribonProductCount, kidstoryProducts] =
    await Promise.all([
      prisma.supplierFeed.findMany({ where: { supplierId: boribon.id } }),
      prisma.supplierFeed.findMany({ where: { supplierId: kidstory.id } }),
      prisma.product.count({
        where: { supplierId: boribon.id, isBundle: false },
      }),
      prisma.product.findMany({
        where: { supplierId: kidstory.id, isBundle: false },
        select: { id: true, stockQuantity: true, reservedQuantity: true },
        orderBy: { id: "asc" },
      }),
    ]);
  const kidstoryProductCount = kidstoryProducts.length;
  const kidstoryInventoryBefore = inventoryFingerprint(kidstoryProducts);

  if (kidstoryProductCount !== 56) {
    throw new Error(
      `Expected 56 Kidstory baseline products, found ${kidstoryProductCount}`
    );
  }
  if (boribonProductCount !== 77) {
    throw new Error(`Expected 77 Boribon products, found ${boribonProductCount}`);
  }

  const desiredSources = new Set<string>(
    BORIBON_FEEDS.map(feed => feed.sourceUrl)
  );
  const duplicateSources = BORIBON_FEEDS.filter(
    desired =>
      boribonFeeds.filter(feed => feed.sourceUrl === desired.sourceUrl).length > 1
  );
  if (duplicateSources.length > 0) {
    throw new Error(
      `Duplicate Boribon feed rows require manual review: ${duplicateSources
        .map(feed => feed.name)
        .join(", ")}`
    );
  }

  const unexpectedActive = boribonFeeds.filter(
    feed =>
      feed.isActive &&
      !isStaticSeedSource(feed.sourceUrl) &&
      !desiredSources.has(feed.sourceUrl ?? "")
  );
  if (unexpectedActive.length > 0) {
    throw new Error(
      `Unexpected active Boribon feeds require manual review: ${unexpectedActive
        .map(feed => feed.name ?? feed.id)
        .join(", ")}`
    );
  }

  const boribonSnapshots = boribonFeeds.filter(feed =>
    isStaticSeedSource(feed.sourceUrl)
  );
  const kidstorySnapshots = kidstoryFeeds.filter(feed =>
    isStaticSeedSource(feed.sourceUrl)
  );
  if (kidstorySnapshots.length === 0) {
    throw new Error("Kidstory seed feed was not found; refusing to infer a baseline.");
  }

  const existingDesired = BORIBON_FEEDS.filter(desired =>
    boribonFeeds.some(feed => feed.sourceUrl === desired.sourceUrl)
  ).length;
  const activeBoribonSnapshots = boribonSnapshots.filter(
    feed => feed.isActive
  ).length;
  const activeKidstorySnapshots = kidstorySnapshots.filter(
    feed => feed.isActive
  ).length;
  if (
    existingDesired !== 6 ||
    BORIBON_FEEDS.length - existingDesired !== 1 ||
    activeBoribonSnapshots !== 1 ||
    activeKidstorySnapshots !== 1
  ) {
    throw new Error(
      "Production feed plan changed: expected six Boribon updates, one Boribon creation, one active Boribon snapshot, and one active Kidstory snapshot."
    );
  }
  const plan = {
    mode: apply ? "apply" : "dry-run",
    boribonAllowedSkus: BORIBON_ALLOWED_SKUS.length,
    boribonLiveSources: BORIBON_FEEDS.length,
    boribonFeedsToUpdate: existingDesired,
    boribonFeedsToCreate: BORIBON_FEEDS.length - existingDesired,
    boribonProducts: boribonProductCount,
    boribonSnapshotsToDeactivate: activeBoribonSnapshots,
    kidstoryBaselineProducts: kidstoryProductCount,
    kidstorySnapshotsToDeactivate: activeKidstorySnapshots,
  };
  console.info("[SUPPLIER FEED REPAIR] plan", plan);

  if (!apply) {
    console.info(
      "[SUPPLIER FEED REPAIR] dry-run complete; no database records changed"
    );
    return;
  }

  const backupPath = assertProtectedBackupPath();
  writeProtectedBackup(backupPath, {
    createdAt: new Date().toISOString(),
    reason: "Pre-change supplier feed mapping backup",
    feeds: [...boribonFeeds, ...kidstoryFeeds],
  });

  const verification = await prisma.$transaction(async transaction => {
    for (const desired of BORIBON_FEEDS) {
      const existing = boribonFeeds.find(
        feed => feed.sourceUrl === desired.sourceUrl
      );
      const authoritative =
        "authoritativeForMissingStock" in desired &&
        desired.authoritativeForMissingStock;
      const data = {
        name: desired.name,
        type: SupplierFeedType.CSV,
        sourceUrl: desired.sourceUrl,
        mapping: buildBoribonMapping(authoritative) as Prisma.InputJsonValue,
        pollingIntervalMinutes: 1440,
        isActive: true,
      };

      if (existing) {
        await transaction.supplierFeed.update({
          where: { id: existing.id },
          data,
        });
      } else {
        await transaction.supplierFeed.create({
          data: { supplierId: boribon.id, ...data },
        });
      }
    }

    if (boribonSnapshots.length > 0) {
      await transaction.supplierFeed.updateMany({
        where: { id: { in: boribonSnapshots.map(feed => feed.id) } },
        data: { isActive: false },
      });
    }

    for (const feed of kidstorySnapshots) {
      const existingMapping =
        feed.mapping && typeof feed.mapping === "object"
          ? (feed.mapping as Record<string, unknown>)
          : {};
      await transaction.supplierFeed.update({
        where: { id: feed.id },
        data: {
          isActive: false,
          mapping: {
            ...existingMapping,
            inventoryPolicy: "owner-approved-static-baseline",
            baselineAsOf: "2026-03-22T23:59:49Z",
            autoCreateProducts: false,
          } as Prisma.InputJsonValue,
        },
      });
    }

    const [activeBoribon, activeSnapshots, kidstoryProductsAfter] =
      await Promise.all([
        transaction.supplierFeed.findMany({
          where: {
            supplierId: boribon.id,
            isActive: true,
            sourceUrl: { in: Array.from(desiredSources) },
          },
        }),
        transaction.supplierFeed.findMany({
          where: {
            supplierId: { in: [boribon.id, kidstory.id] },
            isActive: true,
          },
        }),
        transaction.product.findMany({
          where: { supplierId: kidstory.id, isBundle: false },
          select: { id: true, stockQuantity: true, reservedQuantity: true },
          orderBy: { id: "asc" },
        }),
      ]);
    const liveStaticSnapshots = activeSnapshots.filter(feed =>
      isStaticSeedSource(feed.sourceUrl)
    );
    const kidstoryInventoryAfter = inventoryFingerprint(kidstoryProductsAfter);
    if (
      activeBoribon.length !== 7 ||
      liveStaticSnapshots.length !== 0 ||
      kidstoryProductsAfter.length !== 56 ||
      kidstoryInventoryAfter !== kidstoryInventoryBefore
    ) {
      throw new Error(
        "In-transaction verification failed: expected seven active Boribon feeds, zero active static snapshots, and an unchanged 56-product Kidstory inventory baseline."
      );
    }

    return {
      activeBoribonFeeds: activeBoribon.length,
      activeStaticSnapshots: liveStaticSnapshots.length,
      kidstoryBaselineProducts: kidstoryProductsAfter.length,
    };
  });

  console.info("[SUPPLIER FEED REPAIR] apply complete", verification);
}

main()
  .catch(error => {
    console.error(
      "[SUPPLIER FEED REPAIR] failed",
      error instanceof Error ? error.message : "Unknown error"
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
