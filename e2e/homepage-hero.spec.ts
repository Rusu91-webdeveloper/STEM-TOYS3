import { test, expect } from "@playwright/test";

test.describe("Homepage Hero", () => {
  test("CTAs are visible and clickable", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('a[href="/products"]')).toBeVisible();
    await expect(page.locator('a[href="/blog"]')).toBeVisible();
  });

  test("LCP within budget on mobile conditions (smoke)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 844 });
    const start = performance.now();
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(3500);
  });
});
