import assert from "node:assert/strict";
import { config } from "dotenv";

async function main() {
  config({ path: ".env.local" });
  const url = new URL(process.env.DATABASE_URL ?? "");
  if (
    url.hostname !== "localhost" ||
    url.port !== "55434" ||
    url.pathname !== "/stemtoys_admin_dev"
  )
    throw new Error(
      "Requires the isolated localhost:55434/stemtoys_admin_dev test database."
    );
  const { prisma } = await import("@/lib/prisma");
  const { readAdminSettings, mutateAdminSettings, SettingsConflict } =
    await import("@/lib/admin/settings-service");
  const { settingsUpdateSchema, settingsFieldsSchema } = await import(
    "@/lib/admin/settings-schema"
  );
  const { getShippingSettings, getCODSettings, getTaxSettings } = await import(
    "@/lib/utils/store-settings"
  );
  const actor = "Verificare locală";
  let snapshotId: string | undefined;
  const original = await readAdminSettings();
  const originalRecord = await prisma.storeSettings.findFirstOrThrow({
    orderBy: { createdAt: "asc" },
  });
  const originalValues = settingsFieldsSchema.parse(original);
  try {
    let result = await mutateAdminSettings({
      action: "backup",
      name: "Înainte de verificarea locală",
      actor,
      expectedUpdatedAt: original.updatedAt,
    });
    snapshotId = result.backups[0].id;
    assert.equal(result.backups[0].kind, "manual");
    assert.equal(result.history[0].actor, actor);
    assert.ok(
      !("values" in result.backups[0]),
      "Public copy metadata excludes snapshot values"
    );
    const save = async (values: Record<string, unknown>) => {
      const update = settingsUpdateSchema.parse({
        ...values,
        expectedUpdatedAt: result.updatedAt,
      });
      result = await mutateAdminSettings({
        action: "save",
        update,
        actor,
        expectedUpdatedAt: result.updatedAt,
      });
      return result;
    };
    await save({
      section: "general",
      storeName: "TechTots · verificare locală",
      storeUrl: "https://www.techtots.ro",
      storeDescription: "Magazin STEM, verificare locală",
      contactEmail: "owner@dashboard.local",
      contactPhone: "+40700000000",
    });
    assert.equal(
      (await readAdminSettings()).storeName,
      "TechTots · verificare locală"
    );
    assert.equal(result.history[0].section, "Magazin");
    assert.equal(result.backups[0].kind, "before-save");
    const shipping = {
      ...result.shippingSettings,
      deliveryPrice: { price: "21.35", active: true },
      freeThreshold: { price: "450.00", active: true },
    };
    await save({ section: "shipping", shippingSettings: shipping });
    assert.equal((await getShippingSettings()).deliveryPrice.price, "21.35");
    assert.equal((await getShippingSettings()).freeThreshold.price, "450.00");
    const revisionBeforeInvalid = result.updatedAt;
    assert.throws(() =>
      settingsUpdateSchema.parse({
        section: "cod",
        expectedUpdatedAt: result.updatedAt,
        codSettings: { percentage: "101", fixedFee: "-1", active: true },
      })
    );
    assert.equal((await readAdminSettings()).updatedAt, revisionBeforeInvalid);
    await save({
      section: "cod",
      codSettings: { percentage: "2", fixedFee: "7.50", active: true },
    });
    assert.equal((await getCODSettings()).fixedFee, "7.50");
    await save({
      section: "tax",
      taxSettings: {
        rate: "19",
        vatRegistered: true,
        active: true,
        includeInPrice: false,
      },
    });
    assert.equal((await getTaxSettings()).active, true);
    assert.equal((await getTaxSettings()).rate, "19");
    await save({
      section: "tax",
      taxSettings: {
        rate: "19",
        vatRegistered: false,
        active: false,
        includeInPrice: true,
      },
    });
    assert.equal((await getTaxSettings()).active, false);
    assert.equal((await getTaxSettings()).rate, "0");
    const staleRevision = result.updatedAt;
    await save({
      section: "cod",
      codSettings: { percentage: "0", fixedFee: "8.00", active: true },
    });
    const staleUpdate = settingsUpdateSchema.parse({
      section: "cod",
      expectedUpdatedAt: staleRevision,
      codSettings: { percentage: "0", fixedFee: "9.00", active: true },
    });
    await assert.rejects(
      () =>
        mutateAdminSettings({
          action: "save",
          update: staleUpdate,
          actor,
          expectedUpdatedAt: staleRevision,
        }),
      SettingsConflict
    );
    assert.equal((await readAdminSettings()).codSettings.fixedFee, "8.00");
    const concurrentRevision = result.updatedAt;
    const concurrent = await Promise.allSettled(
      ["10.00", "11.00"].map(fixedFee => {
        const update = settingsUpdateSchema.parse({
          section: "cod",
          expectedUpdatedAt: concurrentRevision,
          codSettings: { percentage: "0", fixedFee, active: true },
        });
        return mutateAdminSettings({
          action: "save",
          update,
          actor,
          expectedUpdatedAt: concurrentRevision,
        });
      })
    );
    assert.equal(
      concurrent.filter(item => item.status === "fulfilled").length,
      1
    );
    const rejected = concurrent.find(
      item => item.status === "rejected"
    ) as PromiseRejectedResult;
    assert.ok(rejected.reason instanceof SettingsConflict);
    result = await readAdminSettings();
    const persisted = await prisma.storeSettings.findUniqueOrThrow({
      where: { id: result.id! },
    });
    const originalPayment = originalRecord.paymentSettings as Record<
      string,
      unknown
    >;
    for (const [key, value] of Object.entries(originalPayment ?? {}))
      if (key !== "codSettings")
        assert.deepEqual(
          (persisted.paymentSettings as Record<string, unknown>)[key],
          value
        );
    const originalMetadata = originalRecord.metadata as Record<string, unknown>;
    for (const [key, value] of Object.entries(originalMetadata ?? {}))
      if (key !== "adminSettingsJournal")
        assert.deepEqual(
          (persisted.metadata as Record<string, unknown>)[key],
          value
        );
    const restored = await mutateAdminSettings({
      action: "restore",
      backupId: snapshotId,
      actor,
      expectedUpdatedAt: result.updatedAt,
    });
    assert.deepEqual(settingsFieldsSchema.parse(restored), originalValues);
    assert.equal(restored.history[0].action, "restore");
    assert.equal(restored.backups[0].kind, "before-restore");
    assert.ok(restored.history.length >= 10);
    snapshotId = undefined;
    console.log(
      "PASS: real settings save/reload, shipping/COD/tax consumers, rejected invalid and stale edits, concurrent conflict, metadata preservation, snapshots and restoration."
    );
  } finally {
    if (snapshotId) {
      const current = await readAdminSettings();
      await mutateAdminSettings({
        action: "restore",
        backupId: snapshotId,
        actor,
        expectedUpdatedAt: current.updatedAt,
      });
    }
    await prisma.$disconnect();
  }
}
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
