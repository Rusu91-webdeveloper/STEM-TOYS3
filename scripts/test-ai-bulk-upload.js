#!/usr/bin/env node

/**
 * AI Bulk Upload Test Runner
 * Comprehensive test suite for AI-enhanced bulk upload functionality
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${colors.cyan}${description}${colors.reset}`);
  log(`${colors.yellow}Running: ${command}${colors.reset}`);

  try {
    const output = execSync(command, {
      encoding: "utf8",
      stdio: "pipe",
      cwd: process.cwd(),
    });
    log(
      `${colors.green}✓ ${description} completed successfully${colors.reset}`
    );
    return { success: true, output };
  } catch (error) {
    log(`${colors.red}✗ ${description} failed${colors.reset}`);
    log(`${colors.red}Error: ${error.message}${colors.reset}`);
    if (error.stdout) {
      log(`${colors.yellow}Output: ${error.stdout}${colors.reset}`);
    }
    if (error.stderr) {
      log(`${colors.red}Error output: ${error.stderr}${colors.reset}`);
    }
    return { success: false, error: error.message };
  }
}

function checkFileExists(filePath) {
  const fullPath = path.resolve(filePath);
  return fs.existsSync(fullPath);
}

function main() {
  log(`${colors.bright}${colors.blue}AI Bulk Upload Test Suite${colors.reset}`);
  log(`${colors.blue}=====================================${colors.reset}`);

  const testResults = {
    unit: { passed: 0, failed: 0, total: 0 },
    integration: { passed: 0, failed: 0, total: 0 },
    component: { passed: 0, failed: 0, total: 0 },
    e2e: { passed: 0, failed: 0, total: 0 },
  };

  // Check if test files exist
  const testFiles = [
    "__tests__/lib/ai/product-enhancement-service.test.ts",
    "__tests__/lib/ai/batch-enhancement-service.test.ts",
    "__tests__/api/admin/products/ai-enhance.test.ts",
    "__tests__/api/admin/products/bulk-upload.test.ts",
    "__tests__/components/admin/AIEnhancementToggle.test.tsx",
    "__tests__/components/admin/AIEnhancementProgress.test.tsx",
    "__tests__/components/admin/AIEnhancementPreview.test.tsx",
    "__tests__/integration/ai-bulk-upload.test.ts",
  ];

  log(`\n${colors.cyan}Checking test files...${colors.reset}`);
  const missingFiles = testFiles.filter(file => !checkFileExists(file));

  if (missingFiles.length > 0) {
    log(`${colors.red}Missing test files:${colors.reset}`);
    missingFiles.forEach(file =>
      log(`${colors.red}  - ${file}${colors.reset}`)
    );
    log(`${colors.yellow}Some tests may not run properly.${colors.reset}`);
  } else {
    log(`${colors.green}✓ All test files found${colors.reset}`);
  }

  // Run unit tests
  log(`\n${colors.bright}${colors.magenta}Running Unit Tests${colors.reset}`);
  log(`${colors.magenta}===================${colors.reset}`);

  const unitTests = [
    "lib/ai/product-enhancement-service.test.ts",
    "lib/ai/batch-enhancement-service.test.ts",
  ];

  unitTests.forEach(testFile => {
    const result = runCommand(
      `npx jest __tests__/${testFile} --verbose`,
      `Unit test: ${testFile}`
    );

    testResults.unit.total++;
    if (result.success) {
      testResults.unit.passed++;
    } else {
      testResults.unit.failed++;
    }
  });

  // Run integration tests
  log(
    `\n${colors.bright}${colors.blue}Running Integration Tests${colors.reset}`
  );
  log(`${colors.blue}===========================${colors.reset}`);

  const integrationTests = [
    "api/admin/products/ai-enhance.test.ts",
    "api/admin/products/bulk-upload.test.ts",
    "integration/ai-bulk-upload.test.ts",
  ];

  integrationTests.forEach(testFile => {
    const result = runCommand(
      `npx jest __tests__/${testFile} --verbose`,
      `Integration test: ${testFile}`
    );

    testResults.integration.total++;
    if (result.success) {
      testResults.integration.passed++;
    } else {
      testResults.integration.failed++;
    }
  });

  // Run component tests
  log(
    `\n${colors.bright}${colors.green}Running Component Tests${colors.reset}`
  );
  log(`${colors.green}=======================${colors.reset}`);

  const componentTests = [
    "components/admin/AIEnhancementToggle.test.tsx",
    "components/admin/AIEnhancementProgress.test.tsx",
    "components/admin/AIEnhancementPreview.test.tsx",
  ];

  componentTests.forEach(testFile => {
    const result = runCommand(
      `npx jest __tests__/${testFile} --verbose`,
      `Component test: ${testFile}`
    );

    testResults.component.total++;
    if (result.success) {
      testResults.component.passed++;
    } else {
      testResults.component.failed++;
    }
  });

  // Run E2E tests (if available)
  log(`\n${colors.bright}${colors.yellow}Running E2E Tests${colors.reset}`);
  log(`${colors.yellow}===================${colors.reset}`);

  if (checkFileExists("e2e/ai-bulk-upload.spec.ts")) {
    const result = runCommand(
      "npx playwright test e2e/ai-bulk-upload.spec.ts",
      "E2E test: AI bulk upload"
    );

    testResults.e2e.total++;
    if (result.success) {
      testResults.e2e.passed++;
    } else {
      testResults.e2e.failed++;
    }
  } else {
    log(`${colors.yellow}E2E tests not found, skipping...${colors.reset}`);
  }

  // Run linting
  log(`\n${colors.bright}${colors.cyan}Running Linting${colors.reset}`);
  log(`${colors.cyan}===============${colors.reset}`);

  const lintResult = runCommand(
    "npx eslint lib/ai/ app/api/admin/products/ai-enhance/ components/admin/AIEnhancement*.tsx --ext .ts,.tsx",
    "ESLint check for AI components"
  );

  // Run type checking
  log(`\n${colors.bright}${colors.cyan}Running Type Checking${colors.reset}`);
  log(`${colors.cyan}=====================${colors.reset}`);

  const typeCheckResult = runCommand(
    "npx tsc --noEmit",
    "TypeScript type checking"
  );

  // Summary
  log(`\n${colors.bright}${colors.blue}Test Summary${colors.reset}`);
  log(`${colors.blue}=============${colors.reset}`);

  const totalTests =
    testResults.unit.total +
    testResults.integration.total +
    testResults.component.total +
    testResults.e2e.total;
  const totalPassed =
    testResults.unit.passed +
    testResults.integration.passed +
    testResults.component.passed +
    testResults.e2e.passed;
  const totalFailed =
    testResults.unit.failed +
    testResults.integration.failed +
    testResults.component.failed +
    testResults.e2e.failed;

  log(`\n${colors.bright}Test Results:${colors.reset}`);
  log(
    `  Unit Tests:      ${testResults.unit.passed}/${testResults.unit.total} passed`
  );
  log(
    `  Integration:     ${testResults.integration.passed}/${testResults.integration.total} passed`
  );
  log(
    `  Component:       ${testResults.component.passed}/${testResults.component.total} passed`
  );
  log(
    `  E2E:            ${testResults.e2e.passed}/${testResults.e2e.total} passed`
  );
  log(
    `  ${colors.bright}Total:          ${totalPassed}/${totalTests} passed${colors.reset}`
  );

  log(`\n${colors.bright}Quality Checks:${colors.reset}`);
  log(
    `  Linting:        ${lintResult.success ? colors.green + "✓ Passed" : colors.red + "✗ Failed" + colors.reset}`
  );
  log(
    `  Type Checking:  ${typeCheckResult.success ? colors.green + "✓ Passed" : colors.red + "✗ Failed" + colors.reset}`
  );

  // Overall result
  const allPassed =
    totalFailed === 0 && lintResult.success && typeCheckResult.success;

  if (allPassed) {
    log(
      `\n${colors.bright}${colors.green}🎉 All tests passed! AI Bulk Upload is ready for deployment.${colors.reset}`
    );
    process.exit(0);
  } else {
    log(
      `\n${colors.bright}${colors.red}❌ Some tests failed. Please review the errors above.${colors.reset}`
    );
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
