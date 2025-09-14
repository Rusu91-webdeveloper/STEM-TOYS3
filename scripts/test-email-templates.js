#!/usr/bin/env node

/**
 * Email Template Testing Script
 *
 * This script tests all email templates to ensure they work correctly
 * and can be sent through the email system.
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Test data for different scenarios
const testData = {
  // User data
  user: {
    name: "Test User",
    email: "test@example.com",
    id: "test-user-123",
  },

  // Order data
  order: {
    number: "ORD-2024-001",
    date: "2024-01-15",
    total: "299.99",
    items: [
      { name: "LEGO Mindstorms EV3", quantity: 1, price: "299.99" },
      { name: "Arduino Starter Kit", quantity: 2, price: "89.99" },
    ],
  },

  // Supplier data
  supplier: {
    companyName: "Test Supplier SRL",
    contactPersonName: "John Doe",
    contactPersonEmail: "john@testsupplier.com",
    registrationDate: "2024-01-15",
    commissionRate: "15",
    paymentTerms: "30",
    minimumOrderValue: "500",
    rejectionReason: "Documentația incompletă",
  },

  // Return data
  return: {
    id: "RET-2024-001",
    orderNumber: "ORD-2024-001",
    reason: "Produs defect",
    requestDate: "2024-01-15",
  },

  // Digital product data
  digitalProduct: {
    name: "Ghidul complet STEM pentru părinți",
    author: "Dr. Maria Popescu",
    format: "PDF",
    fileSize: "2.5 MB",
    downloadLinks: [
      {
        format: "PDF",
        language: "Română",
        url: "https://example.com/download/pdf",
      },
      {
        format: "EPUB",
        language: "Română",
        url: "https://example.com/download/epub",
      },
    ],
    expiryDays: "30",
  },

  // Blog data
  blog: {
    title: "Cum să îți inspirezi copilul să iubească știința",
    excerpt:
      "Descoperă metodele practice și eficiente pentru a face știința distractivă și captivantă pentru copiii tăi.",
    url: "https://techtots.ro/blog/inspira-copilul-stiinta",
  },

  // Marketing data
  marketing: {
    couponCode: "WELCOME20",
    discountAmount: "20%",
    expiryDate: "2024-02-15",
    saleTitle: "Vânzare flash jucării STEM",
    discountPercent: "30",
    saleEndTime: "2024-01-20 23:59",
  },

  // System data
  system: {
    siteUrl: "https://techtots.ro",
    adminUrl: "https://techtots.ro/admin",
    unsubscribeUrl: "https://techtots.ro/unsubscribe",
    verificationLink: "https://techtots.ro/verify?token=abc123",
    resetLink: "https://techtots.ro/reset-password?token=xyz789",
    trackingNumber: "RO123456789",
    carrier: "Fan Courier",
    shippingDate: "2024-01-16",
    trackingUrl: "https://fancourier.ro/track/RO123456789",
    deliveryDate: "2024-01-18",
    reviewUrl: "https://techtots.ro/review/ORD-2024-001",
    cancellationReason: "Produs indisponibil",
    cancellationDate: "2024-01-15",
    refundInfo: "Rambursarea se va procesa în 3-5 zile lucrătoare.",
    failureReason: "Probleme cu procesarea plății",
    failureDate: "2024-01-15",
    retryUrl: "https://techtots.ro/checkout/retry/ORD-2024-001",
    changeTime: "2024-01-15 14:30",
    deviceInfo: "Chrome 120.0.0.0 pe Windows 10",
    ipAddress: "192.168.1.100",
    location: "Cluj-Napoca, România",
    loginTime: "2024-01-15 14:30",
  },
};

// Function to replace variables in template content
function replaceVariables(content, variables) {
  let result = content;

  // Replace simple variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, value);
  });

  // Handle array variables (like items, downloadLinks)
  if (variables.items) {
    const itemsHtml = variables.items
      .map(
        item => `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="color: #1f2937;">${item.name}</strong><br>
            <span style="color: #6b7280; font-size: 14px;">Cantitate: ${item.quantity}</span>
          </div>
          <div style="text-align: right;">
            <span style="color: #1f2937; font-weight: 600;">${item.price} RON</span>
          </div>
        </div>
      </div>
    `
      )
      .join("");

    result = result.replace(
      /\{\{#each items\}\}[\s\S]*?\{\{\/each\}\}/g,
      itemsHtml
    );
  }

  if (variables.downloadLinks) {
    const linksHtml = variables.downloadLinks
      .map(
        link => `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="color: #1f2937;">${link.format}</strong><br>
            <span style="color: #6b7280; font-size: 14px;">${link.language}</span>
          </div>
          <div>
            <a href="${link.url}" 
               style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
              📥 Descarcă
            </a>
          </div>
        </div>
      </div>
    `
      )
      .join("");

    result = result.replace(
      /\{\{#each downloadLinks\}\}[\s\S]*?\{\{\/each\}\}/g,
      linksHtml
    );
  }

  return result;
}

// Function to get variables for a specific template
function getTemplateVariables(template) {
  const baseVariables = {
    ...testData.user,
    ...testData.order,
    ...testData.supplier,
    ...testData.return,
    ...testData.digitalProduct,
    ...testData.blog,
    ...testData.marketing,
    ...testData.system,
  };

  // Add specific variables based on template category
  switch (template.category) {
    case "authentication":
      return {
        ...baseVariables,
        userName: testData.user.name,
        verificationLink: testData.system.verificationLink,
        resetLink: testData.system.resetLink,
        changeTime: testData.system.changeTime,
        deviceInfo: testData.system.deviceInfo,
        ipAddress: testData.system.ipAddress,
        loginTime: testData.system.loginTime,
        location: testData.system.location,
      };

    case "orders":
      return {
        ...baseVariables,
        customerName: testData.user.name,
        orderNumber: testData.order.number,
        orderDate: testData.order.date,
        orderTotal: testData.order.total,
        items: testData.order.items,
        estimatedDelivery: "2024-01-20",
        trackingNumber: testData.system.trackingNumber,
        carrier: testData.system.carrier,
        shippingDate: testData.system.shippingDate,
        trackingUrl: testData.system.trackingUrl,
        deliveryDate: testData.system.deliveryDate,
        reviewUrl: testData.system.reviewUrl,
        cancellationReason: testData.system.cancellationReason,
        cancellationDate: testData.system.cancellationDate,
        refundInfo: testData.system.refundInfo,
        failureReason: testData.system.failureReason,
        failureDate: testData.system.failureDate,
        retryUrl: testData.system.retryUrl,
      };

    case "suppliers":
      return {
        ...baseVariables,
        companyName: testData.supplier.companyName,
        contactPersonName: testData.supplier.contactPersonName,
        contactPersonEmail: testData.supplier.contactPersonEmail,
        registrationDate: testData.supplier.registrationDate,
        commissionRate: testData.supplier.commissionRate,
        paymentTerms: testData.supplier.paymentTerms,
        minimumOrderValue: testData.supplier.minimumOrderValue,
        rejectionReason: testData.supplier.rejectionReason,
      };

    case "returns":
      return {
        ...baseVariables,
        customerName: testData.user.name,
        returnId: testData.return.id,
        orderNumber: testData.return.orderNumber,
        reason: testData.return.reason,
        requestDate: testData.return.requestDate,
      };

    case "digital":
      return {
        ...baseVariables,
        customerName: testData.user.name,
        productName: testData.digitalProduct.name,
        author: testData.digitalProduct.author,
        format: testData.digitalProduct.format,
        fileSize: testData.digitalProduct.fileSize,
        downloadLinks: testData.digitalProduct.downloadLinks,
        expiryDays: testData.digitalProduct.expiryDays,
      };

    case "marketing":
      return {
        ...baseVariables,
        customerName: testData.user.name,
        subscriberName: testData.user.name,
        blogTitle: testData.blog.title,
        blogExcerpt: testData.blog.excerpt,
        blogUrl: testData.blog.url,
        couponCode: testData.marketing.couponCode,
        discountAmount: testData.marketing.discountAmount,
        expiryDate: testData.marketing.expiryDate,
        saleTitle: testData.marketing.saleTitle,
        discountPercent: testData.marketing.discountPercent,
        saleEndTime: testData.marketing.saleEndTime,
        unsubscribeUrl: testData.system.unsubscribeUrl,
      };

    case "admin":
      return {
        ...baseVariables,
        orderNumber: testData.order.number,
        customerName: testData.user.name,
        customerEmail: testData.user.email,
        orderTotal: testData.order.total,
        orderItems: testData.order.items,
        adminUrl: testData.system.adminUrl,
      };

    default:
      return baseVariables;
  }
}

// Function to test a single template
async function testTemplate(template) {
  console.log(`\n🧪 Testing template: ${template.name} (${template.slug})`);
  console.log(`   Category: ${template.category}`);
  console.log(`   Variables: ${template.variables.join(", ")}`);

  try {
    // Get variables for this template
    const variables = getTemplateVariables(template);

    // Replace variables in content
    const processedContent = replaceVariables(template.content, variables);
    const processedSubject = replaceVariables(template.subject, variables);

    // Check if all variables were replaced
    const missingVariables = template.variables.filter(
      variable =>
        processedContent.includes(`{{${variable}}}`) ||
        processedSubject.includes(`{{${variable}}}`)
    );

    if (missingVariables.length > 0) {
      console.log(`   ❌ Missing variables: ${missingVariables.join(", ")}`);
      return false;
    }

    // Check if content is valid HTML
    if (!processedContent.includes("<!DOCTYPE html>")) {
      console.log(`   ❌ Invalid HTML structure`);
      return false;
    }

    console.log(`   ✅ Template processed successfully`);
    console.log(`   📧 Subject: ${processedSubject}`);

    return true;
  } catch (error) {
    console.log(`   ❌ Error processing template: ${error.message}`);
    return false;
  }
}

// Function to test all templates
async function testAllTemplates() {
  console.log("🚀 Starting email template testing...\n");

  const allTemplates = [...EMAIL_TEMPLATES, ...ADDITIONAL_EMAIL_TEMPLATES];
  const results = {
    total: allTemplates.length,
    passed: 0,
    failed: 0,
    categories: {},
  };

  for (const template of allTemplates) {
    const success = await testTemplate(template);

    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }

    // Track by category
    if (!results.categories[template.category]) {
      results.categories[template.category] = {
        passed: 0,
        failed: 0,
        total: 0,
      };
    }
    results.categories[template.category].total++;
    if (success) {
      results.categories[template.category].passed++;
    } else {
      results.categories[template.category].failed++;
    }
  }

  // Print summary
  console.log("\n📊 Test Results Summary:");
  console.log(`   Total templates: ${results.total}`);
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(
    `   Success rate: ${((results.passed / results.total) * 100).toFixed(1)}%`
  );

  console.log("\n📋 Results by Category:");
  Object.entries(results.categories).forEach(([category, stats]) => {
    const successRate = ((stats.passed / stats.total) * 100).toFixed(1);
    console.log(
      `   ${category}: ${stats.passed}/${stats.total} (${successRate}%)`
    );
  });

  if (results.failed > 0) {
    console.log("\n❌ Some templates failed. Please check the errors above.");
    process.exit(1);
  } else {
    console.log("\n🎉 All templates passed! Email system is ready.");
  }
}

// Function to test specific template categories
async function testCategory(category) {
  console.log(`🧪 Testing ${category} templates...\n`);

  const allTemplates = [...EMAIL_TEMPLATES, ...ADDITIONAL_EMAIL_TEMPLATES];
  const categoryTemplates = allTemplates.filter(t => t.category === category);

  if (categoryTemplates.length === 0) {
    console.log(`❌ No templates found for category: ${category}`);
    return;
  }

  let passed = 0;
  let failed = 0;

  for (const template of categoryTemplates) {
    const success = await testTemplate(template);
    if (success) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log(
    `\n📊 ${category} Results: ${passed}/${categoryTemplates.length} passed`
  );
}

// Main execution
async function main() {
  try {
    const args = process.argv.slice(2);
    const category = args[0];

    if (category) {
      await testCategory(category);
    } else {
      await testAllTemplates();
    }
  } catch (error) {
    console.error("❌ Error running tests:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  testTemplate,
  testAllTemplates,
  testCategory,
  testData,
};
