import { expect, test } from "@playwright/test";

test.describe("Launch Smoke", () => {
  test("homepage renders", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/STEM|TechTots|Toys/i);
    await expect(page.locator("header")).toBeVisible();
  });

  test("checkout is protected by auth", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
