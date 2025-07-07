#!/usr/bin/env node

/**
 * Memory Optimization Script for Development
 * Run this if you're experiencing high memory usage warnings
 */

const fs = require("fs");
const path = require("path");

console.log("🧹 Memory Optimization Script Starting...\n");

// 1. Clear Next.js cache
const nextCacheDir = path.join(process.cwd(), ".next");
if (fs.existsSync(nextCacheDir)) {
  console.log("📁 Clearing Next.js cache...");
  try {
    fs.rmSync(nextCacheDir, { recursive: true, force: true });
    console.log("✅ Next.js cache cleared");
  } catch (error) {
    console.log("⚠️ Could not clear Next.js cache:", error.message);
  }
} else {
  console.log("✅ Next.js cache already clean");
}

// 2. Clear node_modules/.cache if it exists
const nodeModulesCacheDir = path.join(process.cwd(), "node_modules", ".cache");
if (fs.existsSync(nodeModulesCacheDir)) {
  console.log("📁 Clearing node_modules cache...");
  try {
    fs.rmSync(nodeModulesCacheDir, { recursive: true, force: true });
    console.log("✅ Node modules cache cleared");
  } catch (error) {
    console.log("⚠️ Could not clear node modules cache:", error.message);
  }
} else {
  console.log("✅ Node modules cache already clean");
}

// 3. Check for large log files
const logFiles = [
  ".next/trace.json",
  "npm-debug.log",
  "yarn-error.log",
  ".next/cache/webpack",
];

logFiles.forEach(logFile => {
  const fullPath = path.join(process.cwd(), logFile);
  if (fs.existsSync(fullPath)) {
    try {
      const stats = fs.statSync(fullPath);
      const sizeMB = stats.size / (1024 * 1024);
      if (sizeMB > 10) {
        console.log(
          `🗑️ Removing large file: ${logFile} (${sizeMB.toFixed(1)}MB)`
        );
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    } catch (error) {
      console.log(`⚠️ Could not check ${logFile}:`, error.message);
    }
  }
});

console.log("\n🎯 Memory Optimization Tips:");
console.log("1. Restart your dev server: npm run dev");
console.log("2. Use fewer browser tabs while developing");
console.log("3. Close unused IDE extensions/plugins");
console.log("4. Consider increasing Node.js memory limit:");
console.log('   NODE_OPTIONS="--max-old-space-size=2048" npm run dev');
console.log("\n📊 Memory usage will be monitored every 15 minutes now.");
console.log("✨ Optimization complete!\n");
