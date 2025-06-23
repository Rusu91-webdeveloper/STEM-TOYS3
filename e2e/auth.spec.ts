import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/auth/login");

    // Check if login page loads
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("should display register page", async ({ page }) => {
    await page.goto("/auth/register");

    // Check if register page loads
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("should show validation errors for invalid login", async ({ page }) => {
    await page.goto("/auth/login");

    // Try to submit with empty fields
    await page.click('button[type="submit"]');

    // Check for validation messages (this will depend on your implementation)
    // Add specific selectors based on your form validation
  });

  test("should navigate to login from register page", async ({ page }) => {
    await page.goto("/auth/register");

    // Look for "Already have an account?" or similar link
    const loginLink = page.locator('a[href*="login"]');
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/login/);
    }
  });

  test("should navigate to register from login page", async ({ page }) => {
    await page.goto("/auth/login");

    // Look for "Create account" or similar link
    const registerLink = page.locator('a[href*="register"]');
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/register/);
    }
  });
});
