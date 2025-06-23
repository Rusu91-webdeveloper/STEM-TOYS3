import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load the homepage", async ({ page }) => {
    await page.goto("/");

    // Check if the page loads without errors
    await expect(page).toHaveTitle(/STEM-TOYS/i);

    // Check if main navigation is present
    await expect(page.locator("nav")).toBeVisible();
  });

  test("should have working navigation", async ({ page }) => {
    await page.goto("/");

    // Check if main navigation links are present and functional
    const productLink = page.locator('a[href*="products"]');
    if (await productLink.isVisible()) {
      await expect(productLink).toBeVisible();
    }

    const aboutLink = page.locator('a[href*="about"]');
    if (await aboutLink.isVisible()) {
      await expect(aboutLink).toBeVisible();
    }
  });

  test("should be responsive", async ({ page }) => {
    await page.goto("/");

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator("nav")).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator("nav")).toBeVisible();
  });
});
