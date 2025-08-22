import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

test.describe("Home Page Accessibility Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should pass axe-core accessibility audit", async ({ page }) => {
    // Run axe-core accessibility audit
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    // Check for violations
    expect(accessibilityScanResults.violations).toEqual([]);

    // Log results for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log(
        "Accessibility violations found:",
        accessibilityScanResults.violations
      );
    }
  });

  test("should have proper heading structure", async ({ page }) => {
    // Check for main heading (h1)
    const h1Elements = await page.locator("h1").count();
    expect(h1Elements).toBeGreaterThan(0);
    expect(h1Elements).toBeLessThanOrEqual(1); // Should have exactly one h1

    // Check heading hierarchy
    const headings = await page.locator("h1, h2, h3, h4, h5, h6").all();
    let previousLevel = 0;

    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
      const level = parseInt(tagName.charAt(1));

      // Ensure no heading levels are skipped (e.g., h1 -> h3)
      expect(level).toBeLessThanOrEqual(previousLevel + 1);
      previousLevel = level;
    }
  });

  test("should have proper alt text for images", async ({ page }) => {
    const images = await page.locator("img").all();

    for (const image of images) {
      const alt = await image.getAttribute("alt");
      const src = await image.getAttribute("src");

      // Decorative images should have alt="" or be hidden
      // Content images should have meaningful alt text
      if (src && !src.includes("data:") && !src.includes("placeholder")) {
        expect(alt).not.toBeNull();
        if (alt !== "") {
          expect(alt.length).toBeGreaterThan(0);
        }
      }
    }
  });

  test("should have proper form labels and controls", async ({ page }) => {
    // Check for form inputs
    const inputs = await page.locator("input, select, textarea").all();

    for (const input of inputs) {
      const tagName = await input.evaluate(el => el.tagName.toLowerCase());
      const type = await input.getAttribute("type");
      const id = await input.getAttribute("id");

      // Skip hidden inputs
      if (type === "hidden") continue;

      // Check for associated labels
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        const ariaLabel = await input.getAttribute("aria-label");
        const ariaLabelledBy = await input.getAttribute("aria-labelledby");

        // Should have either a label, aria-label, or aria-labelledby
        expect(label > 0 || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test("should have proper color contrast", async ({ page }) => {
    // Run axe-core with color contrast rules
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2aa"])
      .withRules(["color-contrast"])
      .analyze();

    // Check for color contrast violations
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === "color-contrast"
    );

    expect(colorContrastViolations).toEqual([]);
  });

  test("should have proper focus indicators", async ({ page }) => {
    // Check that focusable elements are visible when focused
    const focusableElements = await page
      .locator(
        'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      .all();

    for (const element of focusableElements) {
      // Skip hidden elements
      const isVisible = await element.isVisible();
      if (!isVisible) continue;

      // Focus the element
      await element.focus();

      // Check if focus is visible (either through CSS outline or aria attributes)
      const hasFocusVisible = await element.evaluate(el => {
        const style = window.getComputedStyle(el);
        return (
          style.outline !== "none" ||
          style.outlineWidth !== "0px" ||
          el.hasAttribute("aria-focused") ||
          el.classList.contains("focus-visible")
        );
      });

      expect(hasFocusVisible).toBeTruthy();
    }
  });

  test("should have proper ARIA attributes", async ({ page }) => {
    // Check for proper ARIA usage
    const elementsWithAria = await page.locator("[aria-*]").all();

    for (const element of elementsWithAria) {
      const ariaAttributes = await element.evaluate(el => {
        const attrs = {};
        for (const attr of el.attributes) {
          if (attr.name.startsWith("aria-")) {
            attrs[attr.name] = attr.value;
          }
        }
        return attrs;
      });

      // Check for common ARIA patterns
      if (ariaAttributes["aria-expanded"] !== undefined) {
        expect(ariaAttributes["aria-expanded"]).toMatch(/^(true|false)$/);
      }

      if (ariaAttributes["aria-pressed"] !== undefined) {
        expect(ariaAttributes["aria-pressed"]).toMatch(/^(true|false|mixed)$/);
      }

      if (ariaAttributes["aria-checked"] !== undefined) {
        expect(ariaAttributes["aria-checked"]).toMatch(/^(true|false|mixed)$/);
      }
    }
  });

  test("should have proper semantic HTML structure", async ({ page }) => {
    // Check for semantic elements
    const semanticElements = await page
      .locator("main, nav, header, footer, section, article, aside")
      .count();
    expect(semanticElements).toBeGreaterThan(0);

    // Check for main landmark
    const mainElement = await page.locator("main").count();
    expect(mainElement).toBeGreaterThan(0);

    // Check for navigation
    const navElement = await page.locator("nav").count();
    expect(navElement).toBeGreaterThan(0);
  });

  test("should have proper skip links", async ({ page }) => {
    // Check for skip links (common accessibility pattern)
    const skipLinks = await page
      .locator('a[href^="#"]')
      .filter({ hasText: /skip|jump/i })
      .count();

    // If skip links exist, they should be properly implemented
    if (skipLinks > 0) {
      const skipLink = page
        .locator('a[href^="#"]')
        .filter({ hasText: /skip|jump/i })
        .first();
      const href = await skipLink.getAttribute("href");
      const targetId = href?.substring(1);

      if (targetId) {
        const targetElement = await page.locator(`#${targetId}`).count();
        expect(targetElement).toBeGreaterThan(0);
      }
    }
  });

  test("should have proper language attributes", async ({ page }) => {
    // Check for lang attribute on html element
    const htmlLang = await page.locator("html").getAttribute("lang");
    expect(htmlLang).toBeTruthy();
    expect(htmlLang.length).toBeGreaterThan(0);

    // Check for lang attributes on elements with different languages
    const elementsWithLang = await page.locator("[lang]").all();
    for (const element of elementsWithLang) {
      const lang = await element.getAttribute("lang");
      expect(lang).toBeTruthy();
      expect(lang.length).toBeGreaterThan(0);
    }
  });

  test("should have proper keyboard navigation", async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press("Tab");

    // Check that focus moves to first focusable element
    const focusedElement = await page.evaluate(() => document.activeElement);
    expect(focusedElement).not.toBeNull();

    // Test that focus is visible
    const isFocusVisible = await page.evaluate(() => {
      const activeElement = document.activeElement as HTMLElement;
      if (!activeElement) return false;

      const style = window.getComputedStyle(activeElement);
      return (
        style.outline !== "none" ||
        style.outlineWidth !== "0px" ||
        activeElement.hasAttribute("aria-focused") ||
        activeElement.classList.contains("focus-visible")
      );
    });

    expect(isFocusVisible).toBeTruthy();
  });

  test("should have proper error handling for screen readers", async ({
    page,
  }) => {
    // Check for error messages and their association with form controls
    const errorMessages = await page
      .locator('[role="alert"], .error, [aria-invalid="true"]')
      .all();

    for (const error of errorMessages) {
      const ariaInvalid = await error.getAttribute("aria-invalid");
      const role = await error.getAttribute("role");

      // Error messages should be properly announced
      expect(ariaInvalid === "true" || role === "alert").toBeTruthy();
    }
  });

  test("should have proper loading states for screen readers", async ({
    page,
  }) => {
    // Check for loading indicators and their accessibility
    const loadingElements = await page
      .locator('[aria-busy="true"], [role="progressbar"], .loading, .spinner')
      .all();

    for (const loading of loadingElements) {
      const ariaBusy = await loading.getAttribute("aria-busy");
      const role = await loading.getAttribute("role");
      const ariaLabel = await loading.getAttribute("aria-label");

      // Loading elements should be properly announced
      expect(
        ariaBusy === "true" || role === "progressbar" || ariaLabel
      ).toBeTruthy();
    }
  });
});
