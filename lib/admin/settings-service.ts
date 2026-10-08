import { randomUUID } from "node:crypto";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { invalidateStoreSettingsCache } from "@/lib/utils/store-settings";

import {
  settingsFieldsSchema,
  type SettingsFields,
  type SettingsUpdate,
} from "./settings-schema";
import {
  fieldsFromSettings,
  journalFromSettings,
  objectValue,
  sectionNames,
  settingsDefaults,
  settingsView,
  type SettingsBackup,
  type SettingsHistory,
} from "./settings-view";

export class SettingsConflict extends Error {}
export class SettingsMissingBackup extends Error {}
export async function readAdminSettings() {
  return settingsView(
    await prisma.storeSettings.findFirst({ orderBy: { createdAt: "asc" } })
  );
}
type Mutation = { expectedUpdatedAt: string | null; actor: string } & (
  | { action: "save"; update: SettingsUpdate }
  | { action: "backup"; name: string }
  | { action: "restore"; backupId: string }
);
export async function mutateAdminSettings(input: Mutation) {
  try {
    const record = await prisma.$transaction(
      async tx => {
        let current = await tx.storeSettings.findFirst({
          orderBy: { createdAt: "asc" },
        });
        if (
          (current?.updatedAt.toISOString() ?? null) !== input.expectedUpdatedAt
        )
          throw new SettingsConflict(
            "Setările au fost modificate în altă sesiune. Reîncarcă înainte de a salva."
          );
        if (!current) {
          const { codSettings, ...defaults } = settingsDefaults();
          current = await tx.storeSettings.create({
            data: {
              ...defaults,
              paymentSettings: { codSettings },
              currency: "ron",
              timezone: "europe-bucharest",
              weightUnit: "kg",
              dateFormat: "dd-mm-yyyy",
            },
          });
        }
        const journal = journalFromSettings(current);
        const previous = fieldsFromSettings(current);
        const date = new Date().toISOString();
        const data: Prisma.StoreSettingsUpdateManyMutationInput = {};
        let section = "Copie de siguranță";
        let fields: string[] = [];
        const addBackup = (kind: SettingsBackup["kind"], name: string) => {
          journal.backups.unshift({
            id: randomUUID(),
            name,
            date,
            actor: input.actor,
            kind,
            values: previous,
          });
        };
        const applyValues = (values: SettingsFields) => {
          const { codSettings, shippingSettings, taxSettings, ...general } =
            values;
          Object.assign(data, general, {
            shippingSettings,
            taxSettings,
            paymentSettings: {
              ...objectValue(current!.paymentSettings),
              codSettings,
            } as Prisma.InputJsonObject,
          });
        };
        if (input.action === "save") {
          const {
            section: key,
            expectedUpdatedAt: _version,
            ...changes
          } = input.update;
          const changed = Object.entries(changes).filter(
            ([key, value]) =>
              JSON.stringify(previous[key as keyof SettingsFields]) !==
              JSON.stringify(value)
          );
          if (!changed.length) return current;
          addBackup(
            "before-save",
            `Înainte de modificare · ${sectionNames[key]}`
          );
          const { codSettings, ...direct } = changes as Partial<SettingsFields>;
          Object.assign(data, direct);
          if (codSettings)
            data.paymentSettings = {
              ...objectValue(current.paymentSettings),
              codSettings,
            } as Prisma.InputJsonObject;
          section = sectionNames[key];
          fields = changed.map(([key]) => key);
        } else if (input.action === "restore") {
          const backup = journal.backups.find(
            item => item.id === input.backupId
          );
          if (!backup)
            throw new SettingsMissingBackup(
              "Copia selectată nu mai este disponibilă."
            );
          const values = settingsFieldsSchema.parse(backup.values);
          addBackup("before-restore", "Înainte de restaurare");
          applyValues(values);
          section = backup.name;
          fields = Object.keys(values);
        } else addBackup("manual", input.name);
        const entry: SettingsHistory = {
          id: randomUUID(),
          date,
          actor: input.actor,
          action: input.action,
          section,
          fields,
        };
        journal.history.unshift(entry);
        data.metadata = {
          ...objectValue(current.metadata),
          adminSettingsJournal: {
            history: journal.history.slice(0, 100),
            backups: journal.backups.slice(0, 30),
          },
        } as unknown as Prisma.InputJsonObject;
        // Monotonic revision even when two edits occur within the same millisecond.
        data.updatedAt = new Date(
          Math.max(Date.now(), current.updatedAt.getTime() + 1)
        );
        const updated = await tx.storeSettings.updateMany({
          where: { id: current.id, updatedAt: current.updatedAt },
          data,
        });
        if (updated.count !== 1)
          throw new SettingsConflict(
            "Setările s-au schimbat. Reîncarcă și verifică modificările."
          );
        return tx.storeSettings.findUniqueOrThrow({
          where: { id: current.id },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
    if (input.action !== "backup") await invalidateStoreSettingsCache();
    return settingsView(record);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    )
      throw new SettingsConflict(
        "O altă sesiune a modificat setările. Reîncarcă și încearcă din nou."
      );
    throw error;
  }
}
