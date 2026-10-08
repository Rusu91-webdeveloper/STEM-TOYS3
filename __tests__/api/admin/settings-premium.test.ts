import { NextRequest } from "next/server";

import { POST as restorePOST } from "@/app/api/admin/settings/backups/[id]/restore/route";
import {
  GET as backupsGET,
  POST as backupsPOST,
} from "@/app/api/admin/settings/backups/route";
import { GET, PUT } from "@/app/api/admin/settings/route";
import {
  mutateAdminSettings,
  readAdminSettings,
  SettingsConflict,
  SettingsMissingBackup,
} from "@/lib/admin/settings-service";
import { auth } from "@/lib/auth";

jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/admin/settings-service", () => ({
  ...jest.requireActual("@/lib/admin/settings-service"),
  mutateAdminSettings: jest.fn(),
  readAdminSettings: jest.fn(),
}));
jest.mock("@/lib/prisma", () => ({ prisma: {} }));
jest.mock("@/lib/utils/store-settings", () => ({
  invalidateStoreSettingsCache: jest.fn(),
}));
const request = (
  path: string,
  method = "GET",
  body?: unknown,
  origin?: string
) =>
  new NextRequest(`http://localhost:3000/api/admin/settings${path}`, {
    method,
    ...(body ? { body: JSON.stringify(body) } : {}),
    headers: origin ? { origin } : {},
  });
const revision = "2026-10-08T09:00:00.000Z";
const cod = {
  section: "cod",
  expectedUpdatedAt: revision,
  codSettings: { percentage: "0", fixedFee: "8.75", active: true },
};
const restore = (req: NextRequest) =>
  restorePOST(req, { params: Promise.resolve({ id: "snapshot-id" }) });
describe("admin configuration boundaries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue({
      user: { role: "ADMIN", id: "admin", name: "Administrator" },
    });
    (readAdminSettings as jest.Mock).mockResolvedValue({
      storeName: "TechTots",
      backups: [],
    });
    (mutateAdminSettings as jest.Mock).mockResolvedValue({
      updatedAt: revision,
    });
  });
  it.each([
    null,
    { user: { role: "CUSTOMER" } },
    { user: { role: "SUPPLIER" } },
    { user: { role: "VISITOR" } },
  ])("denies every settings operation for %j", async session => {
    (auth as jest.Mock).mockResolvedValue(session);
    const results = await Promise.all([
      GET(request("")),
      PUT(request("", "PUT", cod)),
      backupsGET(request("/backups")),
      backupsPOST(
        request("/backups", "POST", {
          name: "Copie",
          expectedUpdatedAt: revision,
        })
      ),
      restore(
        request("/backups/snapshot-id/restore", "POST", {
          expectedUpdatedAt: revision,
        })
      ),
    ]);
    results.forEach(result => {
      expect(result.status).toBe(403);
      expect(result.headers.get("cache-control")).toBe("private, no-store");
    });
    expect(mutateAdminSettings).not.toHaveBeenCalled();
    expect(readAdminSettings).not.toHaveBeenCalled();
  });
  it("passes the latest edited values and revision into the persistence service", async () => {
    expect((await PUT(request("", "PUT", cod))).status).toBe(200);
    expect(mutateAdminSettings).toHaveBeenCalledWith({
      action: "save",
      actor: "Administrator",
      expectedUpdatedAt: revision,
      update: cod,
    });
  });
  it.each([
    { ...cod, codSettings: { ...cod.codSettings, fixedFee: "-1" } },
    { ...cod, codSettings: { ...cod.codSettings, percentage: "101" } },
    { ...cod, expectedUpdatedAt: undefined },
    { ...cod, securitySettings: { twoFactorEnabled: true } },
    { section: "payments", expectedUpdatedAt: revision },
  ])("rejects invalid or unsupported configuration %j", async body => {
    expect((await PUT(request("", "PUT", body))).status).toBe(400);
    expect(mutateAdminSettings).not.toHaveBeenCalled();
  });
  it("rejects cross-origin writes before mutating configuration", async () => {
    expect(
      (await PUT(request("", "PUT", cod, "https://another.example"))).status
    ).toBe(403);
    expect(mutateAdminSettings).not.toHaveBeenCalled();
  });
  it("creates a named copy and restores through authenticated handlers", async () => {
    expect(
      (
        await backupsPOST(
          request("/backups", "POST", {
            name: "Înainte de ofertă",
            expectedUpdatedAt: revision,
          })
        )
      ).status
    ).toBe(200);
    expect(
      (
        await restore(
          request("/backups/snapshot-id/restore", "POST", {
            expectedUpdatedAt: revision,
          })
        )
      ).status
    ).toBe(200);
    expect(mutateAdminSettings).toHaveBeenLastCalledWith({
      action: "restore",
      actor: "Administrator",
      expectedUpdatedAt: revision,
      backupId: "snapshot-id",
    });
  });
  it("reports conflicts and missing snapshots without success", async () => {
    (mutateAdminSettings as jest.Mock).mockRejectedValueOnce(
      new SettingsConflict("Reîncarcă")
    );
    expect((await PUT(request("", "PUT", cod))).status).toBe(409);
    (mutateAdminSettings as jest.Mock).mockRejectedValueOnce(
      new SettingsMissingBackup("Lipsește")
    );
    expect(
      (
        await restore(
          request("/backups/missing/restore", "POST", {
            expectedUpdatedAt: revision,
          })
        )
      ).status
    ).toBe(404);
  });
  it("does not fabricate settings or a backup list on database failure", async () => {
    (readAdminSettings as jest.Mock).mockRejectedValue(
      new Error("Unavailable")
    );
    const response = await GET(request(""));
    expect(response.status).toBe(500);
    expect(await response.json()).not.toHaveProperty("storeName");
  });
});
