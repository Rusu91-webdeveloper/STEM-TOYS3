import { chromium, FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  const { baseURL, storageState } = config.projects[0].use;

  // Skip if no storage state is configured
  if (!storageState) return;

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to the base URL to ensure the app is running
  await page.goto(baseURL!);

  // Wait for the page to be fully loaded
  await page.waitForLoadState("networkidle");

  // Store authentication state if needed
  // This is useful for tests that require authentication
  await page.context().storageState({ path: storageState as string });

  await browser.close();
}

export default globalSetup;
