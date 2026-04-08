#!/usr/bin/env tsx

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

import {
  ACTIVE_RETURN_STATUSES,
  appendResolutionNote,
  buildDuplicateCleanupResolutionNote,
  getDuplicateActiveReturnLosers,
  isActiveReturnStatus,
  mapKeeperToOrderItemReturnStatus,
  pickDuplicateActiveReturnKeeper,
  type DuplicateActiveReturnGroup,
  type DuplicateActiveReturnRecord,
} from "@/lib/returns/duplicate-active-returns";

function loadScriptEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  const envLocalPath = path.resolve(process.cwd(), ".env.local");

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }

  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath, override: true });
  }

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL =
      process.env.DIRECT_DATABASE_URL ||
      process.env.DATABASE_URL_POOLED ||
      process.env.NEON_DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.DIRECT_URL ||
      "";
  }
}

type CliOptions = {
  apply: boolean;
};

function parseArgs(args: string[]): CliOptions {
  return {
    apply: args.includes("--apply"),
  };
}

function formatStatusSummary(group: DuplicateActiveReturnGroup): string {
  return group.activeReturns.map(item => `${item.status}:${item.id}`).join(", ");
}

async function findDuplicateActiveReturnGroups(): Promise<
  DuplicateActiveReturnGroup[]
> {
  const { db } = await import("@/lib/db");
  const activeReturns = await db.return.findMany({
    where: {
      status: {
        in: [...ACTIVE_RETURN_STATUSES],
      },
    },
    select: {
      id: true,
      orderItemId: true,
      orderId: true,
      userId: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      supplierAuthorizationStatus: true,
      resolutionStatus: true,
      resolutionNotes: true,
    },
    orderBy: [{ orderItemId: "asc" }, { updatedAt: "desc" }, { createdAt: "desc" }],
  });

  const groupedReturns = new Map<string, DuplicateActiveReturnRecord[]>();

  for (const activeReturn of activeReturns) {
    if (!isActiveReturnStatus(activeReturn.status)) {
      continue;
    }

    const group = groupedReturns.get(activeReturn.orderItemId) ?? [];
    group.push(activeReturn);
    groupedReturns.set(activeReturn.orderItemId, group);
  }

  return [...groupedReturns.entries()]
    .map(([orderItemId, records]) => ({
      orderItemId,
      activeReturns: records,
    }))
    .filter(group => group.activeReturns.length > 1)
    .sort((left, right) => left.orderItemId.localeCompare(right.orderItemId));
}

async function applyCleanup(groups: DuplicateActiveReturnGroup[], executedAt: Date) {
  const { db } = await import("@/lib/db");
  let closedReturnCount = 0;

  for (const group of groups) {
    const keeper = pickDuplicateActiveReturnKeeper(group.activeReturns);
    const duplicates = getDuplicateActiveReturnLosers(
      group.activeReturns,
      keeper.id
    );
    const orderItemReturnStatus = mapKeeperToOrderItemReturnStatus(keeper);

    await db.$transaction(async tx => {
      for (const duplicate of duplicates) {
        const cleanupNote = buildDuplicateCleanupResolutionNote({
          keeper,
          duplicate,
          executedAt,
        });

        await tx.return.update({
          where: { id: duplicate.id },
          data: {
            status: "REJECTED",
            resolutionStatus: "CLOSED",
            resolutionNotes: appendResolutionNote(
              duplicate.resolutionNotes,
              cleanupNote
            ),
            supplierAuthorizationStatus: "REJECTED",
          },
        });
      }

      await tx.orderItem.update({
        where: { id: group.orderItemId },
        data: {
          returnStatus: orderItemReturnStatus,
        },
      });
    });

    closedReturnCount += duplicates.length;
  }

  return { closedReturnCount };
}

async function main() {
  loadScriptEnv();

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local or export it before running this script."
    );
  }

  const options = parseArgs(process.argv.slice(2));
  const executedAt = new Date();

  console.log("");
  console.log("Return duplicate cleanup");
  console.log("========================");
  console.log(`Mode: ${options.apply ? "APPLY" : "DRY RUN"}`);
  console.log(
    `Active statuses checked: ${ACTIVE_RETURN_STATUSES.join(", ")}`
  );
  console.log("");

  const groups = await findDuplicateActiveReturnGroups();

  if (groups.length === 0) {
    console.log("No duplicate active returns found.");
    return;
  }

  console.log(
    `Found ${groups.length} order item(s) with duplicate active returns.`
  );
  console.log("");

  for (const group of groups) {
    const keeper = pickDuplicateActiveReturnKeeper(group.activeReturns);
    const duplicates = getDuplicateActiveReturnLosers(
      group.activeReturns,
      keeper.id
    );

    console.log(`Order item: ${group.orderItemId}`);
    console.log(`  Active returns: ${formatStatusSummary(group)}`);
    console.log(`  Keeper: ${keeper.id} (${keeper.status})`);
    console.log(
      `  To close: ${duplicates.map(item => `${item.id} (${item.status})`).join(", ")}`
    );
    console.log(
      `  Order item returnStatus after cleanup: ${mapKeeperToOrderItemReturnStatus(keeper)}`
    );
    console.log("");
  }

  if (!options.apply) {
    console.log("Dry run only. Re-run with --apply to close duplicate records.");
    return;
  }

  const { closedReturnCount } = await applyCleanup(groups, executedAt);

  console.log(
    `Closed ${closedReturnCount} duplicate active return record(s) across ${groups.length} order item(s).`
  );
}

main()
  .catch(error => {
    console.error("Duplicate active return cleanup failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }

    const { db } = await import("@/lib/db");
    await db.$disconnect();
  });
