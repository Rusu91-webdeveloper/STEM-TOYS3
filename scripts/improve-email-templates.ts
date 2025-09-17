import { prisma } from "../lib/prisma";
import { DatabaseTemplateService } from "../lib/email/database-template-service";

/**
 * Script to check and improve email templates:
 * 1. Verify all templates have the correct variables
 * 2. Check for professional styling and layout
 * 3. Suggest improvements where needed
 */
async function improveEmailTemplates() {
  console.log("🔍 Analyzing email templates for improvements...\n");

  try {
    // Get all email templates
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { category: "asc" },
    });

    console.log(`Found ${templates.length} email templates to analyze.\n`);

    // Create a comprehensive set of template variables by category
    const templateVariablesByCategory = {
      authentication: {
        userName: "John Doe",
        verificationLink: "https://example.com/verify?token=abc123",
        resetLink: "https://example.com/reset?token=xyz789",
        expiresIn: "24 ore",
        oldEmail: "old@example.com",
        newEmail: "new@example.com",
        changeDate: "17 septembrie 2023",
        accountUrl: "https://example.com/account",
        siteUrl: "https://example.com",
        suspensionReason: "multiple failed login attempts",
      },
      orders: {
        customerName: "John Doe",
        orderNumber: "ORD-12345",
        orderDate: "17 septembrie 2023",
        orderTotal: "199.99 RON",
        items: [
          {
            name: "Joc educațional STEM",
            quantity: 2,
            price: "49.99 RON",
            sku: "STEM-001",
          },
          {
            name: "Kit robotică pentru copii",
            quantity: 1,
            price: "99.99 RON",
            sku: "ROB-002",
          },
        ],
        shippingAddress: {
          street: "Strada Exemplu 123",
          city: "București",
          postalCode: "012345",
          country: "România",
        },
        shippingDate: "18 septembrie 2023",
        shippingCompany: "Fan Courier",
        trackingNumber: "FCR123456789",
        trackingUrl: "https://example.com/track/FCR123456789",
        estimatedDeliveryDays: "1-2 zile",
        deliveryDate: "19 septembrie 2023",
        deliveryAddress: "Strada Exemplu 123, București",
        oldStatus: "În procesare",
        newStatus: "Expediată",
        updateDate: "18 septembrie 2023",
        updateReason: "Coletul a fost preluat de curier",
        nextSteps: "Veți primi un SMS când comanda va fi livrată",
        orderTrackingUrl: "https://example.com/orders/ORD-12345/track",
        orderHistoryUrl: "https://example.com/account/orders",
        reviewUrl: "https://example.com/products/review?order=ORD-12345",
        cancellationReason: "Produs indisponibil",
        cancellationDate: "17 septembrie 2023",
        refundStatus: "Procesat",
        refundAmount: "199.99 RON",
        refundMethod: "Card bancar",
        refundDate: "18 septembrie 2023",
        refundTimeframe: "3-5 zile lucrătoare",
        creditTimeframe: "3-5 zile lucrătoare",
        paymentStatus: "Plătit",
        failureDate: "17 septembrie 2023",
        failureReason: "Card expirat",
        retryPaymentUrl: "https://example.com/orders/ORD-12345/pay",
        supportUrl: "https://example.com/support",
        siteUrl: "https://example.com",
        adminOrderUrl: "https://example.com/admin/orders/ORD-12345",
      },
      returns: {
        customerName: "John Doe",
        returnId: "RET-12345",
        orderNumber: "ORD-12345",
        productName: "Joc educațional STEM",
        returnReason: "Produs deteriorat",
        returnAddress: "Strada Depozit 456, București",
        returnDeadline: "30 septembrie 2023",
        returnLabelUrl: "https://example.com/return-label/RET-12345",
        returnStatusUrl: "https://example.com/returns/RET-12345",
        requestDate: "17 septembrie 2023",
        siteUrl: "https://example.com",
      },
      supplier: {
        contactPersonName: "John Doe",
        companyName: "STEM Innovations SRL",
        contactPersonEmail: "john@steminnovations.ro",
        contactPersonPhone: "0712345678",
        applicationId: "SUP-12345",
        applicationDate: "17 septembrie 2023",
        commissionRate: "15%",
        paymentTerms: "30 zile",
        minimumOrderValue: "1000 RON",
        productCategories: "Jocuri STEM, Robotică",
        businessAddress: "Strada Afaceri 789, București",
        website: "https://steminnovations.ro",
        yearEstablished: "2020",
        employeeCount: "25",
        annualRevenue: "1.5 milioane RON",
        tempPassword: "Temp123!@#",
        suspensionReason: "Încălcarea termenilor de utilizare",
        suspensionDate: "17 septembrie 2023",
        suspensionDuration: "14 zile",
        rejectionReason: "Informații incomplete",
        reapplyUrl: "https://example.com/supplier/apply",
        adminSupplierUrl: "https://example.com/admin/suppliers/SUP-12345",
        supplierDashboardUrl: "https://example.com/supplier/dashboard",
        supplierProductsUrl: "https://example.com/supplier/products",
        siteUrl: "https://example.com",
      },
      marketing: {
        subscriberName: "John Doe",
        subscriberEmail: "john@example.com",
        newsletterDate: "17 septembrie 2023",
        couponCode: "STEM25",
        discountValue: "25%",
        expiryDate: "30 septembrie 2023",
        applicableProducts: "Toate produsele STEM",
        minimumOrderValue: "200 RON",
        validityPeriod: "14 zile",
        usageLimit: "1 utilizare per client",
        weeklyTheme: "Robotică pentru copii",
        weeklyThemeDescription:
          "Descoperă cele mai bune kit-uri de robotică pentru copii",
        weeklyTip:
          "Începeți cu proiecte simple pentru a construi încrederea copilului dumneavoastră",
        resubscribeUrl: "https://example.com/newsletter/resubscribe",
        unsubscribeUrl: "https://example.com/newsletter/unsubscribe",
        shopUrl: "https://example.com/shop",
        productsUrl: "https://example.com/products",
        blogUrl: "https://example.com/blog",
        siteUrl: "https://example.com",
        blogPosts: [
          {
            title: "Top 5 jocuri STEM pentru dezvoltarea gândirii critice",
            excerpt:
              "Descoperiți cele mai bune jocuri educaționale care dezvoltă gândirea critică...",
            url: "https://example.com/blog/top-stem-games",
            publishDate: "15 septembrie 2023",
            readTime: "5 minute",
          },
          {
            title: "Ghidul părinților pentru activități STEM acasă",
            excerpt:
              "Activități simple pe care le puteți face acasă pentru a introduce conceptele STEM...",
            url: "https://example.com/blog/stem-activities-home",
            publishDate: "10 septembrie 2023",
            readTime: "8 minute",
          },
        ],
        recommendedProducts: [
          {
            name: "Kit robotică pentru începători",
            description:
              "Perfect pentru copiii care fac primii pași în lumea roboticii",
            price: "149.99 RON",
            originalPrice: "199.99 RON",
            salePrice: "149.99 RON",
            url: "https://example.com/products/robot-kit-beginners",
          },
          {
            name: "Microscop digital pentru copii",
            description:
              "Explorează lumea microscopică cu acest instrument educațional",
            price: "249.99 RON",
            originalPrice: "299.99 RON",
            salePrice: "249.99 RON",
            url: "https://example.com/products/digital-microscope",
          },
        ],
        featuredProducts: [
          {
            name: "Kit robotică pentru începători",
            description:
              "Perfect pentru copiii care fac primii pași în lumea roboticii",
            price: "149.99 RON",
            originalPrice: "199.99 RON",
            salePrice: "149.99 RON",
            url: "https://example.com/products/robot-kit-beginners",
          },
          {
            name: "Microscop digital pentru copii",
            description:
              "Explorează lumea microscopică cu acest instrument educațional",
            price: "249.99 RON",
            originalPrice: "299.99 RON",
            salePrice: "249.99 RON",
            url: "https://example.com/products/digital-microscope",
          },
        ],
      },
      system: {
        maintenanceDate: "24 septembrie 2023",
        startTime: "22:00",
        endTime: "02:00",
        estimatedDuration: "4 ore",
        productName: "Kit robotică pentru începători",
        lowStockProducts: [
          {
            name: "Kit robotică pentru începători",
            sku: "ROB-001",
            currentStock: 3,
            minStock: 10,
          },
          {
            name: "Microscop digital pentru copii",
            sku: "SCI-002",
            currentStock: 2,
            minStock: 5,
          },
        ],
        adminProductsUrl: "https://example.com/admin/products",
        siteUrl: "https://example.com",
      },
      admin: {
        orderNumber: "ORD-12345",
        customerName: "John Doe",
        customerEmail: "john@example.com",
        orderTotal: "199.99 RON",
        orderDate: "17 septembrie 2023",
        paymentStatus: "Plătit",
        shippingAddress: "Strada Exemplu 123, București",
        adminOrderUrl: "https://example.com/admin/orders/ORD-12345",
        orderItems: [
          {
            name: "Joc educațional STEM",
            quantity: 2,
            price: "49.99 RON",
            sku: "STEM-001",
          },
          {
            name: "Kit robotică pentru copii",
            quantity: 1,
            price: "99.99 RON",
            sku: "ROB-002",
          },
        ],
        companyName: "STEM Innovations SRL",
        contactPersonName: "John Doe",
        contactPersonEmail: "john@steminnovations.ro",
        contactPersonPhone: "0712345678",
        productCategories: "Jocuri STEM, Robotică",
        applicationId: "SUP-12345",
        applicationDate: "17 septembrie 2023",
        businessAddress: "Strada Afaceri 789, București",
        website: "https://steminnovations.ro",
        yearEstablished: "2020",
        employeeCount: "25",
        annualRevenue: "1.5 milioane RON",
        adminSupplierUrl: "https://example.com/admin/suppliers/SUP-12345",
        siteUrl: "https://example.com",
      },
    };

    // Process each template
    for (const template of templates) {
      console.log(
        `\n===== Template: ${template.name} (${template.slug}) =====`
      );
      console.log(`Category: ${template.category}`);

      // Get category-specific variables
      const categoryVars =
        templateVariablesByCategory[
          template.category as keyof typeof templateVariablesByCategory
        ] || {};

      // Extract variables mentioned in template
      const variableRegex = /{{([^}|#\/]+)}}/g;
      const matches = [...template.content.matchAll(variableRegex)];
      const mentionedVars = Array.from(
        new Set(matches.map(match => match[1].trim()))
      );

      // Extract loop variables
      const loopRegex = /{{#each\s+([^}]+)}}/g;
      const loopMatches = [...template.content.matchAll(loopRegex)];
      const loopVars = loopMatches.map(match => match[1].trim());

      // Extract conditional variables
      const condRegex = /{{#if\s+([^}]+)}}/g;
      const condMatches = [...template.content.matchAll(condRegex)];
      const condVars = condMatches.map(match => match[1].trim());

      // Special directives
      const directives: string[] = [];
      loopVars.forEach(v => {
        directives.push(`#each ${v}`);
        directives.push("/each");
      });
      condVars.forEach(v => {
        directives.push(`#if ${v}`);
        directives.push("/if");
      });

      // Combine all necessary variables
      const allNeededVars = [...mentionedVars, ...directives];

      // Compare with currently defined variables
      const missingVars = allNeededVars.filter(
        v => !template.variables.includes(v)
      );
      const unusedVars = template.variables.filter(
        v =>
          !allNeededVars.includes(v) && !v.startsWith("#") && !v.startsWith("/")
      );

      console.log(`\nTemplate variables analysis:`);
      console.log(`- Variables defined: [${template.variables.join(", ")}]`);
      console.log(
        `- Variables used in template: [${mentionedVars.join(", ")}]`
      );

      if (loopVars.length > 0) {
        console.log(`- Loop variables: [${loopVars.join(", ")}]`);
      }

      if (condVars.length > 0) {
        console.log(`- Conditional variables: [${condVars.join(", ")}]`);
      }

      // Check for issues
      const hasIssues = missingVars.length > 0 || unusedVars.length > 0;

      if (hasIssues) {
        console.log("\n⚠️ Issues found:");

        if (missingVars.length > 0) {
          console.log(`- Missing variables: [${missingVars.join(", ")}]`);
        }

        if (unusedVars.length > 0) {
          console.log(`- Unused variables: [${unusedVars.join(", ")}]`);
        }

        // Prepare updated variables list
        const updatedVars = [...template.variables];

        // Add missing variables
        missingVars.forEach(v => {
          if (!updatedVars.includes(v)) {
            updatedVars.push(v);
          }
        });

        console.log("\n📝 Proposed fix:");
        console.log(`- Updated variables: [${updatedVars.join(", ")}]`);

        // Update the template
        console.log("Updating template variables...");
        await prisma.emailTemplate.update({
          where: { id: template.id },
          data: {
            variables: updatedVars,
            updatedAt: new Date(),
          },
        });
        console.log("✅ Template updated!");
      } else {
        console.log("\n✅ No variable issues found");
      }

      // Test template rendering with category variables
      console.log("\n🧪 Testing template rendering:");

      try {
        // Process the subject and content
        const processedSubject = DatabaseTemplateService.replaceVariables(
          template.subject,
          categoryVars
        );

        const processedContent = DatabaseTemplateService.replaceVariables(
          template.content,
          categoryVars
        );

        // Check for unreplaced variables
        const unreplacedSubjectVars = processedSubject.match(/{{([^}]+)}}/g);
        const unreplacedContentVars = processedContent.match(/{{([^}]+)}}/g);

        if (unreplacedSubjectVars || unreplacedContentVars) {
          console.log("⚠️ Some variables could not be replaced:");

          if (unreplacedSubjectVars) {
            console.log(`- In subject: [${unreplacedSubjectVars.join(", ")}]`);
          }

          if (unreplacedContentVars) {
            console.log(`- In content: [${unreplacedContentVars.join(", ")}]`);
          }

          console.log("Additional data may be needed for these variables.");
        } else {
          console.log("✅ All variables successfully replaced");
        }
      } catch (error) {
        console.error(
          "❌ Error rendering template:",
          error instanceof Error ? error.message : String(error)
        );
      }

      // Check for professionalism and styling
      console.log("\n🎨 Analyzing template design and professionalism:");

      const professionalChecks = analyzeTemplateDesign(template.content);

      let hasDesignIssues = false;
      Object.entries(professionalChecks).forEach(([check, passed]) => {
        if (!passed) {
          hasDesignIssues = true;
          console.log(`❌ ${check}`);
        }
      });

      if (!hasDesignIssues) {
        console.log("✅ Template meets all professional design standards");
      }
    }

    console.log("\n===== SUMMARY =====");
    console.log(`Total templates analyzed: ${templates.length}`);
    console.log("All template variables have been updated!");
    console.log("\n✅ Email template improvement process complete!");
  } catch (error) {
    console.error("❌ Error improving templates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Analyze template design for professionalism
 */
function analyzeTemplateDesign(content: string): Record<string, boolean> {
  const results: Record<string, boolean> = {
    "Has DOCTYPE declaration": content.includes("<!DOCTYPE html>"),
    "Has proper head section":
      content.includes("<head>") && content.includes("</head>"),
    "Has meta charset": content.includes("<meta charset="),
    "Has viewport meta tag": content.includes("viewport"),
    "Has title tag": /<title>.*?<\/title>/i.test(content),
    "Has body tag": content.includes("<body") && content.includes("</body>"),
    "Has responsive design": content.includes("width=device-width"),
    "Has proper font styling":
      content.includes("font-family:") || content.includes("font-family="),
    "Uses appropriate spacing":
      content.includes("line-height:") ||
      content.includes("padding:") ||
      content.includes("margin:"),
    "Contains company branding": content.includes("TechTots"),
    "Has footer with contact info":
      content.includes("footer") ||
      (content.toLowerCase().includes("contact") && content.includes("@")),
    "Has unsubscribe link":
      content.toLowerCase().includes("unsubscribe") ||
      content.toLowerCase().includes("dezabonar"),
    "Contains social media links":
      content.includes("facebook") ||
      content.includes("instagram") ||
      content.includes("linkedin"),
    "Includes company address":
      content.includes("address") || content.includes("adres"),
  };

  return results;
}

// Run the improvement script
improveEmailTemplates().catch(console.error);
