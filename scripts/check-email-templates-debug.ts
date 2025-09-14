#!/usr/bin/env ts-node

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkEmailTemplates() {
  try {
    console.log("🔍 Checking email templates in database...");

    // Check if EmailTemplate table exists and has data
    const templates = await prisma.emailTemplate.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        slug: true,
        subject: true,
        category: true,
        isActive: true,
        createdAt: true,
      },
    });

    console.log(`📊 Found ${templates.length} email templates:`);
    templates.forEach((template, index) => {
      console.log(
        `  ${index + 1}. ${template.name} (${template.slug}) - ${template.category}`
      );
    });

    if (templates.length === 0) {
      console.log("⚠️  No email templates found. Creating sample templates...");

      // Create sample templates
      const sampleTemplates = [
        {
          name: "Welcome Email",
          slug: "welcome-email",
          subject: "Welcome to TechTots STEM Store!",
          content:
            "<h1>Welcome {{user.name}}!</h1><p>Thank you for joining TechTots STEM Store. We're excited to help you find the perfect educational toys for your child.</p>",
          variables: ["user.name", "user.email"],
          category: "welcome",
          isActive: true,
          createdBy: "system",
        },
        {
          name: "Order Confirmation",
          slug: "order-confirmation",
          subject: "Order Confirmation - {{order.number}}",
          content:
            "<h2>Order Confirmed!</h2><p>Thank you for your order {{order.number}}.</p><p>Total: {{order.total}}</p>",
          variables: ["order.number", "order.total", "user.name"],
          category: "order-confirmation",
          isActive: true,
          createdBy: "system",
        },
        {
          name: "Password Reset",
          slug: "password-reset",
          subject: "Reset Your Password",
          content:
            '<h2>Password Reset Request</h2><p>Hello {{user.name}},</p><p>Click the link below to reset your password:</p><p><a href="{{reset.link}}">Reset Password</a></p>',
          variables: ["user.name", "reset.link"],
          category: "password-reset",
          isActive: true,
          createdBy: "system",
        },
      ];

      for (const template of sampleTemplates) {
        try {
          await prisma.emailTemplate.create({
            data: template,
          });
          console.log(`✅ Created template: ${template.name}`);
        } catch (error) {
          console.log(`❌ Failed to create template ${template.name}:`, error);
        }
      }

      console.log("🎉 Sample templates created successfully!");
    }

    // Check database connection
    console.log("\n🔗 Testing database connection...");
    const userCount = await prisma.user.count();
    console.log(`✅ Database connected. Found ${userCount} users.`);
  } catch (error) {
    console.error("❌ Error checking email templates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmailTemplates();
