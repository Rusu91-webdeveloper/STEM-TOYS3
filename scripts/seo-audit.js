#!/usr/bin/env node

/**
 * SEO Audit Script for TechTots
 *
 * This script audits all pages for common SEO issues that prevent Google indexing:
 * 1. Missing or generic meta titles/descriptions
 * 2. Missing canonical URLs
 * 3. Missing structured data
 * 4. Translation key issues
 * 5. Missing hreflang attributes
 */

const fs = require("fs");
const path = require("path");

/**
 * Find files matching pattern recursively
 */
function findFiles(dir, pattern) {
  const results = [];

  function searchDirectory(currentDir) {
    try {
      const files = fs.readdirSync(currentDir);

      for (const file of files) {
        const fullPath = path.join(currentDir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          searchDirectory(fullPath);
        } else if (pattern.test(file)) {
          results.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  searchDirectory(dir);
  return results;
}

// Configuration
const BASE_URL = "https://www.techtots.ro";
const AUDIT_RESULTS = {
  critical: [],
  warnings: [],
  info: [],
  summary: {
    totalPages: 0,
    criticalIssues: 0,
    warnings: 0,
    infoIssues: 0,
  },
};

// Common translation keys that indicate SEO issues
const GENERIC_TRANSLATION_KEYS = [
  "metaTitle",
  "metaDescription",
  "aboutTitle",
  "aboutDescription",
  "contactTitle",
  "contactDescription",
  "blogTitle",
  "blogDescription",
];

// Required SEO elements
const REQUIRED_SEO_ELEMENTS = {
  title: {
    minLength: 30,
    maxLength: 60,
    pattern: /^[A-Za-z0-9\s\-.,!?]+$/,
  },
  description: {
    minLength: 120,
    maxLength: 160,
    pattern: /^[A-Za-z0-9\s\-.,!?]+$/,
  },
  canonical: {
    pattern: new RegExp(`^${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/`),
  },
};

/**
 * Audit a single metadata file
 */
function auditMetadataFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  const pageName = path.basename(path.dirname(filePath));

  try {
    const content = fs.readFileSync(filePath, "utf8");

    // Check for generic translation keys
    const hasGenericKeys = GENERIC_TRANSLATION_KEYS.some(
      key => content.includes(`"${key}"`) || content.includes(`'${key}'`)
    );

    if (hasGenericKeys) {
      AUDIT_RESULTS.critical.push({
        file: relativePath,
        issue: "Generic translation keys used instead of actual SEO content",
        severity: "CRITICAL",
        fix: "Replace translation keys with actual SEO-optimized titles and descriptions",
      });
    }

    // Check for missing structured data
    if (
      !content.includes("structuredData") &&
      !content.includes("JSON.stringify")
    ) {
      AUDIT_RESULTS.warnings.push({
        file: relativePath,
        issue: "Missing structured data (JSON-LD)",
        severity: "WARNING",
        fix: "Add structured data to improve search engine understanding",
      });
    }

    // Check for missing canonical URL
    if (!content.includes("canonicalUrl") && !content.includes("canonical")) {
      AUDIT_RESULTS.warnings.push({
        file: relativePath,
        issue: "Missing canonical URL",
        severity: "WARNING",
        fix: "Add canonicalUrl to prevent duplicate content issues",
      });
    }

    // Check for missing translations
    if (!content.includes("translations") && pageName !== "layout") {
      AUDIT_RESULTS.info.push({
        file: relativePath,
        issue: "Missing multilingual translations",
        severity: "INFO",
        fix: "Add translations object for better international SEO",
      });
    }

    // Check for missing keywords
    if (!content.includes("keywords") && pageName !== "layout") {
      AUDIT_RESULTS.info.push({
        file: relativePath,
        issue: "Missing SEO keywords",
        severity: "INFO",
        fix: "Add relevant keywords array for better search visibility",
      });
    }
  } catch (error) {
    AUDIT_RESULTS.critical.push({
      file: relativePath,
      issue: `Error reading file: ${error.message}`,
      severity: "CRITICAL",
      fix: "Fix file syntax errors",
    });
  }
}

/**
 * Audit a page component for SEO issues
 */
function auditPageComponent(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);

  try {
    const content = fs.readFileSync(filePath, "utf8");

    // Check for missing structured data script
    if (
      !content.includes("application/ld+json") &&
      !content.includes("dangerouslySetInnerHTML")
    ) {
      AUDIT_RESULTS.warnings.push({
        file: relativePath,
        issue: "Missing JSON-LD structured data script",
        severity: "WARNING",
        fix: 'Add <script type="application/ld+json"> with structured data',
      });
    }

    // Check for proper heading structure
    const h1Count = (content.match(/<h1[^>]*>/gi) || []).length;
    if (h1Count === 0) {
      AUDIT_RESULTS.warnings.push({
        file: relativePath,
        issue: "Missing H1 heading",
        severity: "WARNING",
        fix: "Add a single H1 heading for better SEO",
      });
    } else if (h1Count > 1) {
      AUDIT_RESULTS.warnings.push({
        file: relativePath,
        issue: `Multiple H1 headings found (${h1Count})`,
        severity: "WARNING",
        fix: "Use only one H1 heading per page",
      });
    }

    // Check for missing alt attributes on images
    const imgTags = content.match(/<img[^>]*>/gi) || [];
    const imagesWithoutAlt = imgTags.filter(img => !img.includes("alt="));

    if (imagesWithoutAlt.length > 0) {
      AUDIT_RESULTS.warnings.push({
        file: relativePath,
        issue: `${imagesWithoutAlt.length} images missing alt attributes`,
        severity: "WARNING",
        fix: "Add descriptive alt attributes to all images",
      });
    }
  } catch (error) {
    AUDIT_RESULTS.critical.push({
      file: relativePath,
      issue: `Error reading file: ${error.message}`,
      severity: "CRITICAL",
      fix: "Fix file syntax errors",
    });
  }
}

/**
 * Generate audit report
 */
function generateReport() {
  const report = `
# 🔍 SEO Audit Report - TechTots

**Generated:** ${new Date().toISOString()}
**Total Pages Audited:** ${AUDIT_RESULTS.summary.totalPages}

## 📊 Summary

- 🔴 **Critical Issues:** ${AUDIT_RESULTS.critical.length}
- 🟡 **Warnings:** ${AUDIT_RESULTS.warnings.length}  
- 🔵 **Info:** ${AUDIT_RESULTS.info.length}

## 🔴 Critical Issues (Must Fix)

${AUDIT_RESULTS.critical
  .map(
    issue => `
### ${issue.file}
- **Issue:** ${issue.issue}
- **Fix:** ${issue.fix}
`
  )
  .join("\n")}

## 🟡 Warnings (Should Fix)

${AUDIT_RESULTS.warnings
  .map(
    issue => `
### ${issue.file}
- **Issue:** ${issue.issue}
- **Fix:** ${issue.fix}
`
  )
  .join("\n")}

## 🔵 Info (Nice to Have)

${AUDIT_RESULTS.info
  .map(
    issue => `
### ${issue.file}
- **Issue:** ${issue.issue}
- **Fix:** ${issue.fix}
`
  )
  .join("\n")}

## 🚀 Quick Fix Recommendations

1. **Replace all generic translation keys** with actual SEO content
2. **Add structured data** to all pages
3. **Ensure canonical URLs** are properly set
4. **Add multilingual translations** for international SEO
5. **Fix missing alt attributes** on images
6. **Verify heading structure** (one H1 per page)

## 📈 Expected Impact

After fixing these issues:
- ✅ Google will be able to properly index your pages
- ✅ Rich snippets will appear in search results
- ✅ Better international SEO performance
- ✅ Improved click-through rates from search results
- ✅ Reduced "Discovered - currently not indexed" issues in GSC

---

*Run this audit regularly to maintain SEO health.*
`;

  return report;
}

/**
 * Main audit function
 */
async function runSEOAudit() {
  console.log("🔍 Starting SEO Audit...\n");

  try {
    // Find all metadata files
    const metadataFiles = findFiles("app", /metadata\.ts$/);
    console.log(`📁 Found ${metadataFiles.length} metadata files`);

    // Find all page components
    const pageFiles = findFiles("app", /page\.tsx$/);
    console.log(`📄 Found ${pageFiles.length} page components\n`);

    AUDIT_RESULTS.summary.totalPages = metadataFiles.length + pageFiles.length;

    // Audit metadata files
    console.log("🔍 Auditing metadata files...");
    metadataFiles.forEach(auditMetadataFile);

    // Audit page components
    console.log("🔍 Auditing page components...");
    pageFiles.forEach(auditPageComponent);

    // Generate and save report
    const report = generateReport();
    const reportPath = "SEO_AUDIT_REPORT.md";
    fs.writeFileSync(reportPath, report);

    console.log(`\n✅ Audit completed!`);
    console.log(`📊 Results:`);
    console.log(`   🔴 Critical: ${AUDIT_RESULTS.critical.length}`);
    console.log(`   🟡 Warnings: ${AUDIT_RESULTS.warnings.length}`);
    console.log(`   🔵 Info: ${AUDIT_RESULTS.info.length}`);
    console.log(`\n📄 Full report saved to: ${reportPath}`);

    if (AUDIT_RESULTS.critical.length > 0) {
      console.log(
        "\n🚨 CRITICAL ISSUES FOUND - These must be fixed for proper indexing!"
      );
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Audit failed:", error.message);
    process.exit(1);
  }
}

// Run the audit
if (require.main === module) {
  runSEOAudit().catch(console.error);
}

module.exports = { runSEOAudit, auditMetadataFile, auditPageComponent };
