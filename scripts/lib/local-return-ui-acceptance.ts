import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

import { chromium, type APIRequestContext } from "@playwright/test";

export async function verifyDigitalReturnUI(input: {
  api: APIRequestContext;
  baseURL: string;
  orderId: string;
  output: string;
}) {
  assert.equal(input.baseURL, "http://localhost:3014");
  const browser = await chromium.launch({ headless: true });
  await mkdir(input.output, { recursive: true });
  try {
    const context = await browser.newContext({
      storageState: await input.api.storageState(),
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`${input.baseURL}/account/orders/${input.orderId}/return`);
    await page.getByText("Synthetic Digital Book").waitFor();
    await page.getByText("Pentru conținut digital", { exact: false }).waitFor();
    await page.getByRole("button", { name: "Refuz opționale" }).click();
    const item = page.getByRole("checkbox", { name: /Synthetic Digital Book/ });
    await item.focus();
    await page.keyboard.press("Space");
    assert.equal(await item.getAttribute("aria-checked"), "true");
    await page.getByRole("combobox").click();
    await page
      .getByRole("option", { name: "M-am răzgândit", exact: true })
      .click();
    await page
      .getByText("Verificare individuală pentru conținut digital", {
        exact: false,
      })
      .waitFor();
    assert.equal(
      await page
        .locator("form")
        .getByText("Încadrare pentru produsele fizice", { exact: false })
        .count(),
      0
    );
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.screenshot({
        path: `${input.output}/digital-return-${width}.png`,
        fullPage: true,
      });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        ),
        true
      );
    }
    assert.equal(errors.length, 0, errors.join("\n"));
    await context.close();
  } finally {
    await browser.close();
  }
}
