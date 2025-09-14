#!/usr/bin/env tsx

/**
 * Deployment monitoring script
 * This script helps monitor the deployment and check for common issues
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deploymentMonitor() {
  console.log("🚀 [DEPLOYMENT-MONITOR] Starting deployment health check...");
  
  try {
    // Check database connection
    console.log("🔍 [DEPLOYMENT-MONITOR] Checking database connection...");
    await prisma.$connect();
    console.log("✅ [DEPLOYMENT-MONITOR] Database connection successful");

    // Check admin users
    console.log("👑 [DEPLOYMENT-MONITOR] Checking admin users...");
    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        password: true,
      },
    });
    
    console.log(`📊 [DEPLOYMENT-MONITOR] Found ${adminUsers.length} admin users:`);
    adminUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - Active: ${user.isActive} - Has Password: ${!!user.password}`);
    });

    // Check email templates
    console.log("📧 [DEPLOYMENT-MONITOR] Checking email templates...");
    const templateCount = await prisma.emailTemplate.count();
    const activeTemplateCount = await prisma.emailTemplate.count({
      where: { isActive: true }
    });
    
    console.log(`📊 [DEPLOYMENT-MONITOR] Email templates: ${templateCount} total, ${activeTemplateCount} active`);

    // Check environment variables
    console.log("🔧 [DEPLOYMENT-MONITOR] Checking critical environment variables...");
    const criticalEnvVars = [
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
      'DATABASE_URL',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET'
    ];
    
    const envStatus = criticalEnvVars.map(envVar => ({
      name: envVar,
      exists: !!process.env[envVar],
      value: process.env[envVar] ? `${process.env[envVar].substring(0, 10)}...` : 'NOT SET'
    }));
    
    console.log("🔧 [DEPLOYMENT-MONITOR] Environment variables status:");
    envStatus.forEach(env => {
      const status = env.exists ? '✅' : '❌';
      console.log(`   ${status} ${env.name}: ${env.value}`);
    });

    // Check for missing environment variables
    const missingEnvVars = envStatus.filter(env => !env.exists);
    if (missingEnvVars.length > 0) {
      console.log("⚠️  [DEPLOYMENT-MONITOR] Missing environment variables:", missingEnvVars.map(env => env.name));
    }

    // Test JWT functionality
    console.log("🎫 [DEPLOYMENT-MONITOR] Testing JWT functionality...");
    try {
      const jwt = require('jsonwebtoken');
      const testToken = jwt.sign(
        { test: 'data' },
        process.env.NEXTAUTH_SECRET || 'development-secret',
        { expiresIn: '1h' }
      );
      
      const decoded = jwt.verify(testToken, process.env.NEXTAUTH_SECRET || 'development-secret');
      console.log("✅ [DEPLOYMENT-MONITOR] JWT functionality working");
    } catch (error) {
      console.log("❌ [DEPLOYMENT-MONITOR] JWT functionality failed:", error instanceof Error ? error.message : String(error));
    }

    // Test bcrypt functionality
    console.log("🔐 [DEPLOYMENT-MONITOR] Testing bcrypt functionality...");
    try {
      const bcrypt = require('bcryptjs');
      const testPassword = 'test123';
      const hashed = await bcrypt.hash(testPassword, 12);
      const isValid = await bcrypt.compare(testPassword, hashed);
      
      if (isValid) {
        console.log("✅ [DEPLOYMENT-MONITOR] bcrypt functionality working");
      } else {
        console.log("❌ [DEPLOYMENT-MONITOR] bcrypt password verification failed");
      }
    } catch (error) {
      console.log("❌ [DEPLOYMENT-MONITOR] bcrypt functionality failed:", error instanceof Error ? error.message : String(error));
    }

    console.log("🎉 [DEPLOYMENT-MONITOR] Deployment health check completed successfully!");

  } catch (error) {
    console.error("❌ [DEPLOYMENT-MONITOR] Deployment health check failed:", error);
    console.error("❌ [DEPLOYMENT-MONITOR] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deploymentMonitor();
