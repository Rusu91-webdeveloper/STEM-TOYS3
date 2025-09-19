#!/usr/bin/env node

/**
 * CLS Testing Script for /products page
 * Tests the improvements made to reduce Cumulative Layout Shift
 */

const { chromium } = require("playwright");

async function testCLS() {
  console.log("🧪 Starting CLS Testing for /products page...\n");

  const browser = await chromium.launch({
    headless: false, // Show browser for visual verification
    slowMo: 50, // Slow down for better observation
  });

  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 },
  });

  const page = await context.newPage();

  // Track CLS values
  let clsValue = 0;
  let clsEntries = [];

  // Listen for layout shift events
  await page.evaluate(() => {
    let cumulativeLayoutShift = 0;

    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          cumulativeLayoutShift += entry.value;
          window.clsEntries = window.clsEntries || [];
          window.clsEntries.push({
            value: entry.value,
            time: entry.startTime,
            sources:
              entry.sources?.map(source => ({
                element: source.node?.tagName || "unknown",
                previousRect: source.previousRect,
                currentRect: source.currentRect,
              })) || [],
          });

          // Update global CLS value
          window.currentCLS = cumulativeLayoutShift;
        }
      });
    });

    observer.observe({ entryTypes: ["layout-shift"] });
  });

  console.log("📍 Navigating to /products page...");
  await page.goto("http://localhost:3000/products", {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  console.log("⏳ Waiting for page to fully load and settle...");
  await page.waitForTimeout(3000);

  // Get CLS value
  const finalCLS = await page.evaluate(() => window.currentCLS || 0);
  const layoutShiftEntries = await page.evaluate(() => window.clsEntries || []);

  console.log("\n📊 CLS Test Results:");
  console.log("===================");
  console.log(`Final CLS Score: ${finalCLS.toFixed(4)}`);

  // Evaluate CLS score
  let clsGrade = "";
  let clsColor = "";
  if (finalCLS <= 0.1) {
    clsGrade = "GOOD ✅";
    clsColor = "\x1b[32m"; // Green
  } else if (finalCLS <= 0.25) {
    clsGrade = "NEEDS IMPROVEMENT ⚠️";
    clsColor = "\x1b[33m"; // Yellow
  } else {
    clsGrade = "POOR ❌";
    clsColor = "\x1b[31m"; // Red
  }

  console.log(`${clsColor}CLS Grade: ${clsGrade}\x1b[0m`);
  console.log(`Total Layout Shifts: ${layoutShiftEntries.length}`);

  if (layoutShiftEntries.length > 0) {
    console.log("\n🔍 Layout Shift Details:");
    layoutShiftEntries.forEach((entry, index) => {
      console.log(
        `  ${index + 1}. Shift Value: ${entry.value.toFixed(4)} at ${entry.time.toFixed(0)}ms`
      );
      if (entry.sources.length > 0) {
        entry.sources.forEach(source => {
          console.log(`     Element: ${source.element}`);
        });
      }
    });
  }

  // Test different viewport sizes
  console.log("\n📱 Testing different viewport sizes...");

  const viewports = [
    { name: "Mobile", width: 375, height: 667 },
    { name: "Tablet", width: 768, height: 1024 },
    { name: "Desktop", width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    console.log(
      `\n📐 Testing ${viewport.name} (${viewport.width}x${viewport.height})`
    );
    await page.setViewportSize(viewport);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const viewportCLS = await page.evaluate(() => {
      window.currentCLS = 0; // Reset
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(window.currentCLS || 0);
        }, 1000);
      });
    });

    console.log(`  CLS Score: ${viewportCLS.toFixed(4)}`);
  }

  // Test filter interactions
  console.log("\n🎛️  Testing filter interactions...");
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Reset CLS tracking
  await page.evaluate(() => {
    window.currentCLS = 0;
    window.clsEntries = [];
  });

  // Try clicking some filters
  try {
    await page.click(
      '[data-testid="category-science"], .category-button:has-text("Science"), button:has-text("Science")',
      { timeout: 5000 }
    );
    await page.waitForTimeout(1000);

    const filterCLS = await page.evaluate(() => window.currentCLS || 0);
    console.log(`  Filter interaction CLS: ${filterCLS.toFixed(4)}`);
  } catch (error) {
    console.log(
      "  ⚠️  Could not test filter interactions (elements not found)"
    );
  }

  console.log("\n🎯 CLS Improvement Recommendations:");
  console.log("=====================================");

  if (finalCLS > 0.1) {
    console.log("• ❌ CLS is above the recommended threshold of 0.1");
    console.log("• 🔧 Consider adding more specific dimensions to elements");
    console.log("• 🔧 Use CSS containment for dynamic content");
    console.log("• 🔧 Reserve space for images and dynamic content");
  } else {
    console.log("• ✅ CLS is within the good range (≤ 0.1)");
    console.log("• ✅ Page layout appears stable");
  }

  console.log("\n📈 Performance Summary:");
  console.log("======================");
  console.log(`Previous CLS: ~0.31 (Poor)`);
  console.log(
    `Current CLS: ${finalCLS.toFixed(4)} (${clsGrade.replace(/[✅⚠️❌]/g, "").trim()})`
  );

  const improvement = ((0.31 - finalCLS) / 0.31) * 100;
  if (improvement > 0) {
    console.log(
      `\x1b[32m🎉 Improvement: ${improvement.toFixed(1)}% reduction in CLS!\x1b[0m`
    );
  } else {
    console.log(
      `\x1b[31m⚠️  CLS increased by ${Math.abs(improvement).toFixed(1)}%\x1b[0m`
    );
  }

  await browser.close();
  console.log("\n✅ CLS testing completed!");
}

// Handle errors gracefully
testCLS().catch(error => {
  console.error("❌ Error during CLS testing:", error);
  process.exit(1);
});
