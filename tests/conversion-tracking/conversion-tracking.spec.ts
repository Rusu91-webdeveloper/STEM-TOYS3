import { test, expect } from "@playwright/test";

test.describe("Conversion Tracking", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto("/");
  });

  test("should track CTA button clicks", async ({ page }) => {
    // Mock the conversion tracking API
    await page.route("/api/analytics/conversions", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { storedCount: 1 },
        }),
      });
    });

    // Click on the "Shop All Products" button
    await page.click('[data-conversion-action="shop_all_products"]');

    // Wait for the API call to be made
    await page.waitForResponse("/api/analytics/conversions");
  });

  test("should track category card clicks", async ({ page }) => {
    // Mock the conversion tracking API
    await page.route("/api/analytics/conversions", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { storedCount: 1 },
        }),
      });
    });

    // Click on a category card
    await page.click('[data-conversion-action="explore_category"]');

    // Wait for the API call to be made
    await page.waitForResponse("/api/analytics/conversions");
  });

  test("should track product card clicks", async ({ page }) => {
    // Mock the conversion tracking API
    await page.route("/api/analytics/conversions", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { storedCount: 1 },
        }),
      });
    });

    // Click on a product card
    await page.click('[data-conversion-action="view_product_details"]');

    // Wait for the API call to be made
    await page.waitForResponse("/api/analytics/conversions");
  });

  test("should track scroll depth", async ({ page }) => {
    // Mock the conversion tracking API
    await page.route("/api/analytics/conversions", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { storedCount: 1 },
        }),
      });
    });

    // Scroll to 50% of the page
    await page.evaluate(() => {
      const scrollHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      window.scrollTo(0, (scrollHeight - windowHeight) * 0.5);
    });

    // Wait a bit for the scroll event to be processed
    await page.waitForTimeout(1000);

    // Wait for the API call to be made
    await page.waitForResponse("/api/analytics/conversions");
  });

  test("should track time on page", async ({ page }) => {
    // Mock the conversion tracking API
    await page.route("/api/analytics/conversions", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { storedCount: 1 },
        }),
      });
    });

    // Wait for 30 seconds (or simulate it by advancing time)
    await page.evaluate(() => {
      // Mock Date.now to advance time
      const originalDateNow = Date.now;
      let mockTime = Date.now();

      Date.now = () => {
        mockTime += 30000; // Advance by 30 seconds
        return mockTime;
      };
    });

    // Wait a bit for the time tracking to trigger
    await page.waitForTimeout(1000);

    // Wait for the API call to be made
    await page.waitForResponse("/api/analytics/conversions");
  });

  test("should have proper data attributes on CTA elements", async ({
    page,
  }) => {
    // Check that hero buttons have conversion tracking attributes
    const shopButton = page.locator(
      '[data-conversion-action="shop_all_products"]'
    );
    await expect(shopButton).toHaveAttribute("data-conversion", "cta");
    await expect(shopButton).toHaveAttribute("data-conversion-type", "click");
    await expect(shopButton).toHaveAttribute("data-conversion-category", "cta");

    const categoriesButton = page.locator(
      '[data-conversion-action="explore_categories"]'
    );
    await expect(categoriesButton).toHaveAttribute("data-conversion", "cta");
    await expect(categoriesButton).toHaveAttribute(
      "data-conversion-type",
      "click"
    );
    await expect(categoriesButton).toHaveAttribute(
      "data-conversion-category",
      "cta"
    );

    // Check that category cards have conversion tracking attributes
    const categoryCard = page
      .locator('[data-conversion-action="explore_category"]')
      .first();
    await expect(categoryCard).toHaveAttribute("data-conversion", "cta");
    await expect(categoryCard).toHaveAttribute("data-conversion-type", "click");
    await expect(categoryCard).toHaveAttribute(
      "data-conversion-category",
      "navigation"
    );

    // Check that product cards have conversion tracking attributes
    const productCard = page
      .locator('[data-conversion-action="view_product_details"]')
      .first();
    await expect(productCard).toHaveAttribute("data-conversion", "cta");
    await expect(productCard).toHaveAttribute("data-conversion-type", "click");
    await expect(productCard).toHaveAttribute(
      "data-conversion-category",
      "ecommerce"
    );
  });

  test("should handle conversion tracking API errors gracefully", async ({
    page,
  }) => {
    // Mock the conversion tracking API to return an error
    await page.route("/api/analytics/conversions", async route => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "Internal server error",
        }),
      });
    });

    // Click on a CTA button - should not throw an error
    await page.click('[data-conversion-action="shop_all_products"]');

    // Wait for the API call to be made
    await page.waitForResponse("/api/analytics/conversions");

    // The page should still be functional
    await expect(page).toHaveURL("/");
  });
});
