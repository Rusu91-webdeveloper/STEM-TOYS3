import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

import { chromium } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { config } from "dotenv";

import { loginFixture } from "./lib/local-acceptance-auth";

async function main() {
  config({ path: ".env.local" });
  const url = new URL(process.env.DATABASE_URL ?? "");
  assert.equal(url.hostname, "localhost");
  assert.equal(url.port, "55435");
  assert.equal(url.pathname, "/stemtoys_order_status_dev");
  const baseURL = "http://localhost:3015";
  assert.equal(process.env.NEXTAUTH_URL, baseURL);
  const db = new PrismaClient();
  try {
    if (process.argv.includes("--seed-only")) {
      assert.equal(
        await db.order.count(),
        0,
        "Requires an empty isolated database."
      );
      const password = await hash("SyntheticOrderStatus2026!", 10);
      await db.user.upsert({
        where: { id: "order-status-admin" },
        update: {},
        create: {
          id: "order-status-admin",
          name: "Administrator local",
          email: "admin@order-status.invalid",
          role: "ADMIN",
          isActive: true,
          password,
        },
      });
      await db.user.upsert({
        where: { id: "order-status-customer" },
        update: {},
        create: {
          id: "order-status-customer",
          name: "Client local",
          // Empty address makes the route skip email delivery for these fixtures.
          email: "",
          isActive: false,
          password,
        },
      });
      await db.address.create({
        data: {
          id: "order-status-address",
          userId: "order-status-customer",
          name: "Adresă locală",
          fullName: "Client local",
          addressLine1: "Adresă fictivă",
          city: "București",
          state: "București",
          postalCode: "000000",
          country: "RO",
          phone: "0000000000",
        },
      });
      for (const surface of ["list", "details"]) {
        await db.order.create({
          data: {
            id: `order-status-${surface}`,
            orderNumber: `LOCAL-STATUS-${surface.toUpperCase()}`,
            userId: "order-status-customer",
            shippingAddressId: "order-status-address",
            total: 154.89,
            subtotal: 154.89,
            tax: 0,
            shippingCost: 0,
            paymentMethod: "cash_on_delivery",
            status: "READY_FOR_SHIPPING",
            notes: "Existing local note",
          },
        });
      }
      console.log(
        "Seeded two synthetic orders; no email address or payment authorization attached."
      );
      return;
    }

    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({
        baseURL,
        viewport: { width: 1440, height: 1000 },
      });
      await loginFixture(context.request, {
        baseURL,
        email: "admin@order-status.invalid",
        password: "SyntheticOrderStatus2026!",
        role: "ADMIN",
      });
      const unprotected = await context.request.patch(
        "/api/admin/orders/order-status-list",
        {
          data: { status: "CANCELLED" },
        }
      );
      assert.equal(unprotected.status(), 403);
      assert.equal(
        (
          await db.order.findUniqueOrThrow({
            where: { id: "order-status-list" },
          })
        ).status,
        "READY_FOR_SHIPPING"
      );

      const page = await context.newPage();
      page.setDefaultNavigationTimeout(60000);
      const pageErrors: string[] = [];
      page.on("pageerror", error => pageErrors.push(error.message));
      for (const surface of ["list", "details"] as const) {
        const id = `order-status-${surface}`;
        await page.goto(
          surface === "list" ? "/admin/orders" : `/admin/orders/${id}`,
          { waitUntil: "domcontentloaded" }
        );
        if (surface === "list") {
          const row = page
            .getByRole("row")
            .filter({ hasText: "LOCAL-STATUS-LIST" });
          await row
            .getByRole("button", { name: "Acțiuni", exact: true })
            .click();
          await page
            .getByRole("menuitem", { name: "Actualizează starea", exact: true })
            .click();
        }
        const form =
          surface === "list" ? page.getByRole("dialog") : page.locator("main");
        await form.getByRole("combobox").first().click();
        await page
          .getByRole("option", { name: "Anulată", exact: true })
          .click();
        const reason = page.getByPlaceholder(/Scrie motivul anulării/);
        await reason.fill("  Verificare locală  ");
        const save = form.getByRole("button", {
          name: surface === "list" ? "Actualizează starea" : "Actualizează",
          exact: true,
        });

        if (surface === "list") {
          await page.route("**/api/csrf-token", route =>
            route.fulfill({ status: 503, body: "Unavailable" })
          );
          await save.click();
          await page
            .getByText(/Verificarea de securitate nu a putut fi inițializată/)
            .waitFor();
          assert.equal(await reason.inputValue(), "  Verificare locală  ");
          assert.equal(
            (await db.order.findUniqueOrThrow({ where: { id } })).status,
            "READY_FOR_SHIPPING"
          );
          await page.unroute("**/api/csrf-token");
        }

        const responsePromise = page.waitForResponse(
          response =>
            response.url().endsWith(`/api/admin/orders/${id}`) &&
            response.request().method() === "PATCH"
        );
        await save.click();
        const response = await responsePromise;
        assert.equal(response.status(), 200, await response.text());
        assert.ok(response.request().headers()["x-csrf-token"]);
        if (surface === "list")
          await page.getByRole("dialog").waitFor({ state: "hidden" });
        const saved = await db.order.findUniqueOrThrow({ where: { id } });
        assert.equal(saved.status, "CANCELLED");
        assert.equal(
          saved.notes,
          "Existing local note | Cancellation reason: Verificare locală"
        );
        await page.reload();
        if (surface === "list") {
          await page
            .getByRole("row")
            .filter({ hasText: "LOCAL-STATUS-LIST" })
            .getByText("Anulată", { exact: true })
            .waitFor();
        } else {
          await page.getByText("Anulată", { exact: true }).first().waitFor();
        }
      }
      assert.deepEqual(pageErrors, []);
      await mkdir("test-results/order-status", { recursive: true });
      await page.screenshot({
        path: "test-results/order-status/details-cancelled.png",
        fullPage: true,
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/admin/orders");
      await page
        .getByRole("link", { name: "LOCAL-STATUS-LIST", exact: true })
        .waitFor();
      await page.screenshot({
        path: "test-results/order-status/list-mobile-cancelled.png",
        fullPage: true,
      });
      console.log(
        "PASS: real ADMIN login, missing-token 403, token-fetch failure/retry, list and details cancellation, preserved notes, database persistence after reload, mobile rendering, and no page errors. No email or payment sent."
      );
    } finally {
      await browser.close();
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
