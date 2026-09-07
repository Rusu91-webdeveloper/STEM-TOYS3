import { expect, test } from "@playwright/test";

// Run against a seeded catalog or the read-only production-data preview.
test("homepage provides honest product paths and accessible age previews", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "STEM fără ecran"
  );
  await expect(
    page.getByRole("link", { name: "Explorează colecția", exact: true })
  ).toHaveAttribute("href", "/products");
  await expect(
    page.getByRole("link", { name: "Cadouri 6–8 ani", exact: true })
  ).toHaveAttribute("href", "/cadouri-stem-6-8-ani");
  await expect(
    page.getByText("Plată ramburs (COD)", { exact: true })
  ).toBeVisible();
  const cards = page.locator(
    'section[aria-labelledby="home-products"] article'
  );
  await expect(cards).toHaveCount(4);
  await expect(cards.first()).toContainText("Hover Racer 4M");
  await expect(cards.first()).toContainText("8+ ani");
  await expect(cards.first()).toContainText("Recomandarea săptămânii");
  await expect(
    cards.locator("a").filter({ hasText: "Vezi produsul" })
  ).toHaveCount(4);
  await expect(
    page.locator('section[aria-labelledby="home-themes"] a')
  ).toHaveCount(4);
  await expect(page.locator("main")).not.toContainText(
    /Top Rated|50[.,]000|Ghid 2025/
  );
  for (const [age, group] of [
    ["3–5 ani", "PRESCHOOL_3_5"],
    ["6–8 ani", "ELEMENTARY_6_8"],
    ["9–12 ani", "MIDDLE_SCHOOL_9_12"],
    ["13+ ani", "TEENS_13_PLUS"],
  ]) {
    const chip = page.getByRole("button", { name: age, exact: true });
    await chip.focus();
    await page.keyboard.press("Enter");
    await expect(chip).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(`#preview-${group} a`)).toHaveAttribute(
      "href",
      `/products?ageGroup=${group}`
    );
    await page.keyboard.press("Escape");
    await expect(chip).toHaveAttribute("aria-expanded", "false");
  }
});

test("hero motion pauses offscreen and respects reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const animation = page.locator(".home-hover-racer");
  await expect(animation).toHaveAttribute("data-playing", "true");
  await page.getByRole("button", { name: "Pauză animație" }).click();
  await expect(animation).toHaveAttribute("data-playing", "false");
  await page.getByRole("button", { name: "Pornește animația" }).click();
  await expect(animation).toHaveAttribute("data-playing", "true");
  await page.locator("#home-themes").scrollIntoViewIfNeeded();
  await expect(animation).toHaveAttribute("data-playing", "false");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(animation).toHaveAttribute("data-playing", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(animation).toHaveCSS("animation-name", "none");
  await expect(animation).toHaveAttribute("data-playing", "false");
  await expect(
    page.getByRole("button", { name: "Pauză animație" })
  ).toHaveCount(0);
  await expect(animation.locator("img")).toBeVisible();
});

test("mobile has two product columns and working touch chips", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000");
  const chip = page.getByRole("button", { name: "6–8 ani", exact: true });
  await chip.tap();
  await expect(chip).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#preview-ELEMENTARY_6_8 a")).toBeVisible();
  await chip.tap();
  await expect(chip).toHaveAttribute("aria-expanded", "false");
  const cards = page.locator(
    'section[aria-labelledby="home-products"] article'
  );
  await expect(cards).toHaveCount(4);
  const boxes = await cards.evaluateAll(elements =>
    elements.map(element => {
      const r = element.getBoundingClientRect();
      return { x: r.x, y: r.y, height: r.height };
    })
  );
  expect(boxes[0].y).toBe(boxes[1].y);
  expect(boxes[1].x).toBeGreaterThan(boxes[0].x);
  expect(boxes[0].height).toBe(boxes[1].height);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
  await context.close();
});

test("headline and CTAs render with JavaScript disabled", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Explorează colecția", exact: true })
  ).toBeVisible();
  await expect(page.locator(".home-hover-racer")).toHaveAttribute(
    "data-playing",
    "false"
  );
  await context.close();
});

test("footer and hero share the delivery promise without promotional overlays", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("footer")).toBeVisible();
  await expect(page.locator("footer")).not.toContainText(
    /1[–-]3 zile|50[.,]000/
  );
  await expect(
    page.getByText("Livrare 1–4 zile lucrătoare", { exact: true }).first()
  ).toBeVisible();
  await expect(
    page
      .locator("footer")
      .getByText("Livrare 1–4 zile lucrătoare", { exact: true })
  ).toBeVisible();
  await page.waitForTimeout(10000);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("catalog, gift landing page, Hover Racer and updated guide resolve", async ({
  page,
}) => {
  for (const path of [
    "/products",
    "/cadouri-stem-6-8-ani",
    "/products/kit-constructie-robot---hover-racer-kidz-robotix-4M-03366",
    "/ghid-jucarii-stem-2026",
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  }
  await page.goto("/ghid-jucarii-stem-2025");
  await expect(page).toHaveURL(/ghid-jucarii-stem-2026/);
});
