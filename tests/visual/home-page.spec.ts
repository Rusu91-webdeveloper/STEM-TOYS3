import { test, expect } from "@playwright/test";

test.describe("Home Page Visual Regression Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page and wait for it to load
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for any animations to complete
    await page.waitForTimeout(2000);
  });

  test("home page should match baseline on desktop", async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Wait for all images to load
    await page.waitForLoadState("networkidle");

    // Take screenshot of the entire page
    await expect(page).toHaveScreenshot("home-page-desktop.png", {
      fullPage: true,
      animations: "disabled",
    });
  });

  test("home page should match baseline on tablet", async ({ page }) => {
    // Set viewport to tablet size
    await page.setViewportSize({ width: 768, height: 1024 });

    // Wait for all images to load
    await page.waitForLoadState("networkidle");

    // Take screenshot of the entire page
    await expect(page).toHaveScreenshot("home-page-tablet.png", {
      fullPage: true,
      animations: "disabled",
    });
  });

  test("home page should match baseline on mobile", async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for all images to load
    await page.waitForLoadState("networkidle");

    // Take screenshot of the entire page
    await expect(page).toHaveScreenshot("home-page-mobile.png", {
      fullPage: true,
      animations: "disabled",
    });
  });

  test("hero section should match baseline", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForLoadState("networkidle");

    // Take screenshot of hero section
    const heroSection = page.locator("section").first();
    await expect(heroSection).toHaveScreenshot("hero-section.png", {
      animations: "disabled",
    });
  });

  test("featured products section should match baseline", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForLoadState("networkidle");

    // Scroll to featured products section
    await page.evaluate(() => {
      const featuredSection =
        document.querySelector('[data-testid="featured-products"]') ||
        document.querySelector("section:nth-child(2)");
      if (featuredSection) {
        featuredSection.scrollIntoView();
      }
    });

    await page.waitForTimeout(1000);

    // Take screenshot of featured products section
    const featuredSection = page
      .locator('[data-testid="featured-products"]')
      .or(page.locator("section").nth(1));
    await expect(featuredSection).toHaveScreenshot(
      "featured-products-section.png",
      {
        animations: "disabled",
      }
    );
  });

  test("categories section should match baseline", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForLoadState("networkidle");

    // Scroll to categories section
    await page.evaluate(() => {
      const categoriesSection =
        document.querySelector('[data-testid="categories-section"]') ||
        document.querySelector("section:nth-child(3)");
      if (categoriesSection) {
        categoriesSection.scrollIntoView();
      }
    });

    await page.waitForTimeout(1000);

    // Take screenshot of categories section
    const categoriesSection = page
      .locator('[data-testid="categories-section"]')
      .or(page.locator("section").nth(2));
    await expect(categoriesSection).toHaveScreenshot("categories-section.png", {
      animations: "disabled",
    });
  });

  test("navigation header should match baseline", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForLoadState("networkidle");

    // Take screenshot of navigation header
    const header = page
      .locator("header")
      .or(page.locator("nav"))
      .or(page.locator('[role="banner"]'));
    await expect(header).toHaveScreenshot("navigation-header.png", {
      animations: "disabled",
    });
  });

  test("footer should match baseline", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForLoadState("networkidle");

    // Scroll to footer
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await page.waitForTimeout(1000);

    // Take screenshot of footer
    const footer = page
      .locator("footer")
      .or(page.locator('[role="contentinfo"]'));
    await expect(footer).toHaveScreenshot("footer.png", {
      animations: "disabled",
    });
  });

  test("mobile navigation menu should match baseline", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState("networkidle");

    // Look for mobile menu button and click it
    const menuButton = page
      .locator('[aria-label*="menu"]')
      .or(page.locator('[data-testid="mobile-menu"]'))
      .or(page.locator("button").filter({ hasText: /menu/i }));

    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(500);

      // Take screenshot of mobile menu
      const mobileMenu = page
        .locator('[role="navigation"]')
        .or(page.locator('[data-testid="mobile-menu"]'))
        .or(page.locator("nav"));
      await expect(mobileMenu).toHaveScreenshot("mobile-navigation-menu.png", {
        animations: "disabled",
      });
    }
  });

  test("loading states should match baseline", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navigate to home page and capture loading state
    const responsePromise = page.waitForResponse(response =>
      response.url().includes("/api/")
    );
    await page.goto("/");

    // Take screenshot during loading
    await expect(page).toHaveScreenshot("home-page-loading.png", {
      fullPage: true,
      animations: "disabled",
    });

    // Wait for response to complete
    await responsePromise;
  });

  test("error states should match baseline", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Mock API failure
    await page.route("**/api/products/featured", route => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal Server Error" }),
      });
    });

    // Navigate to home page
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Take screenshot of error state
    await expect(page).toHaveScreenshot("home-page-error-state.png", {
      fullPage: true,
      animations: "disabled",
    });
  });

  test("dark mode should match baseline", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Look for theme toggle and switch to dark mode
    const themeToggle = page
      .locator('[data-testid="theme-toggle"]')
      .or(page.locator('[aria-label*="theme"]'))
      .or(page.locator("button").filter({ hasText: /dark|theme/i }));

    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(1000);

      // Take screenshot in dark mode
      await expect(page).toHaveScreenshot("home-page-dark-mode.png", {
        fullPage: true,
        animations: "disabled",
      });
    }
  });

  test("accessibility focus states should match baseline", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Focus on first interactive element
    await page.keyboard.press("Tab");
    await page.waitForTimeout(500);

    // Take screenshot with focus state
    await expect(page).toHaveScreenshot("home-page-focus-state.png", {
      fullPage: true,
      animations: "disabled",
    });
  });
});
