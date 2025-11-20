#!/usr/bin/env node

/**
 * Netopia Configuration Checker
 * 
 * This script validates the Netopia payment gateway configuration
 * and provides detailed diagnostics for troubleshooting.
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log('');
  log('='.repeat(60), colors.blue);
  log(message, colors.bright);
  log('='.repeat(60), colors.blue);
  console.log('');
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Load environment variables
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    logWarning('.env.local file not found');
    logInfo('Checking process.env for Netopia configuration...');
    return false;
  }
  
  logSuccess('.env.local file found');
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        if (key && value && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
    
    return true;
  } catch (error) {
    logError(`Failed to load .env.local: ${error.message}`);
    return false;
  }
}

// Check required environment variables
function checkEnvironmentVariables() {
  logHeader('Checking Netopia Environment Variables');
  
  const requiredVars = [
    {
      name: 'NETOPIA_API_KEY',
      description: 'Netopia API key for authentication',
      required: true,
    },
    {
      name: 'NETOPIA_SIGNATURE',
      description: 'POS Signature for merchant identification',
      required: true,
    },
    {
      name: 'NETOPIA_SANDBOX',
      description: 'Environment flag (true for sandbox, false for production)',
      required: false,
      defaultValue: 'true',
    },
    {
      name: 'NETOPIA_WEBHOOK_SECRET',
      description: 'Public key certificate for webhook verification',
      required: false,
    },
    {
      name: 'NEXT_PUBLIC_SITE_URL',
      description: 'Base URL for callback and webhook endpoints',
      required: true,
    },
  ];
  
  let hasErrors = false;
  let hasWarnings = false;
  
  requiredVars.forEach(varInfo => {
    const value = process.env[varInfo.name];
    
    if (!value || value.trim() === '') {
      if (varInfo.required) {
        logError(`${varInfo.name} is NOT set (REQUIRED)`);
        logInfo(`   Description: ${varInfo.description}`);
        hasErrors = true;
      } else {
        logWarning(`${varInfo.name} is NOT set (OPTIONAL)`);
        logInfo(`   Description: ${varInfo.description}`);
        if (varInfo.defaultValue) {
          logInfo(`   Default value will be used: ${varInfo.defaultValue}`);
        }
        hasWarnings = true;
      }
    } else {
      logSuccess(`${varInfo.name} is set`);
      
      // Show partial value for verification (mask sensitive data)
      if (varInfo.name.includes('KEY') || varInfo.name.includes('SECRET')) {
        const maskedValue = value.substring(0, 8) + '...' + value.substring(value.length - 4);
        logInfo(`   Value: ${maskedValue} (${value.length} characters)`);
      } else {
        logInfo(`   Value: ${value}`);
      }
    }
  });
  
  return { hasErrors, hasWarnings };
}

// Validate Netopia SDK installation
function checkNetopiaSDK() {
  logHeader('Checking Netopia SDK Installation');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (dependencies['netopia-payment2']) {
      logSuccess(`netopia-payment2 SDK is installed (v${dependencies['netopia-payment2']})`);
      
      // Check if node_modules exists
      const nodeModulesPath = path.join(process.cwd(), 'node_modules', 'netopia-payment2');
      if (fs.existsSync(nodeModulesPath)) {
        logSuccess('SDK package files are present in node_modules');
        return true;
      } else {
        logWarning('SDK package is in package.json but not found in node_modules');
        logInfo('Run: pnpm install');
        return false;
      }
    } else {
      logError('netopia-payment2 SDK is NOT installed');
      logInfo('Run: pnpm add netopia-payment2');
      return false;
    }
  } catch (error) {
    logError(`Failed to check SDK installation: ${error.message}`);
    return false;
  }
}

// Check Netopia-related files
function checkNetopiaFiles() {
  logHeader('Checking Netopia Implementation Files');
  
  const filesToCheck = [
    {
      path: 'lib/payments/NetopiaProvider.ts',
      description: 'Main Netopia provider implementation',
    },
    {
      path: 'app/api/payments/netopia/create/route.ts',
      description: 'Payment creation API endpoint',
    },
    {
      path: 'app/api/payments/netopia/webhook/route.ts',
      description: 'Webhook handler for payment notifications',
    },
    {
      path: 'features/checkout/components/PaymentMethodSelector.tsx',
      description: 'Payment method selector UI component',
    },
  ];
  
  let allFilesExist = true;
  
  filesToCheck.forEach(file => {
    const fullPath = path.join(process.cwd(), file.path);
    if (fs.existsSync(fullPath)) {
      logSuccess(`${file.path}`);
      logInfo(`   ${file.description}`);
    } else {
      logError(`${file.path} NOT FOUND`);
      logInfo(`   ${file.description}`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

// Validate URL configuration
function validateURLConfiguration() {
  logHeader('Validating URL Configuration');
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  
  if (!siteUrl) {
    logError('NEXT_PUBLIC_SITE_URL is not set - cannot validate URLs');
    return false;
  }
  
  const endpoints = [
    { path: '/checkout/cancelled', name: 'Cancel URL' },
    { path: '/api/payments/netopia/webhook', name: 'Webhook URL (notify)' },
    { path: '/checkout/netopia/callback', name: 'Redirect URL (callback)' },
  ];
  
  logInfo('Expected Netopia endpoint URLs:');
  console.log('');
  
  endpoints.forEach(endpoint => {
    const fullUrl = `${siteUrl}${endpoint.path}`;
    log(`  ${endpoint.name}:`, colors.blue);
    log(`    ${fullUrl}`, colors.green);
  });
  
  console.log('');
  logInfo('These URLs must be accessible from the internet for webhooks to work');
  
  if (siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1')) {
    logWarning('Using localhost URL - webhooks will NOT work from Netopia');
    logInfo('For testing webhooks, deploy to a public URL or use a tunnel service (ngrok, etc.)');
  }
  
  return true;
}

// Test Netopia SDK initialization
function testSDKInitialization() {
  logHeader('Testing Netopia SDK Initialization');
  
  try {
    // Try to require the SDK
    const NetopiaModule = require('netopia-payment2');
    logSuccess('Netopia SDK module can be loaded');
    
    // Check for required exports
    if (NetopiaModule.Netopia) {
      logSuccess('Netopia class is exported');
    } else {
      logError('Netopia class is NOT exported from the module');
      return false;
    }
    
    if (NetopiaModule.Ipn) {
      logSuccess('Ipn class is exported');
    } else {
      logWarning('Ipn class is NOT exported (needed for webhook verification)');
    }
    
    // Try to instantiate (only if credentials are available)
    const apiKey = process.env.NETOPIA_API_KEY;
    const signature = process.env.NETOPIA_SIGNATURE;
    const isLive = process.env.NETOPIA_SANDBOX !== 'true';
    
    if (apiKey && signature) {
      try {
        const netopiaInstance = new NetopiaModule.Netopia({
          apiKey,
          posSignature: signature,
          isLive,
        });
        
        logSuccess('Netopia SDK instance created successfully');
        logInfo(`   Environment: ${isLive ? 'PRODUCTION' : 'SANDBOX'}`);
        
        // Check if createOrder method exists
        if (typeof netopiaInstance.createOrder === 'function') {
          logSuccess('createOrder method is available');
        } else {
          logError('createOrder method is NOT available');
          return false;
        }
        
        return true;
      } catch (error) {
        logError(`Failed to create Netopia instance: ${error.message}`);
        return false;
      }
    } else {
      logWarning('Cannot test SDK initialization - missing API credentials');
      logInfo('Set NETOPIA_API_KEY and NETOPIA_SIGNATURE to test initialization');
      return false;
    }
  } catch (error) {
    logError(`Failed to load Netopia SDK: ${error.message}`);
    logInfo('Make sure netopia-payment2 is installed: pnpm add netopia-payment2');
    return false;
  }
}

// Generate configuration template
function generateConfigTemplate() {
  logHeader('Configuration Template');
  
  log('Copy this template to your .env.local file:', colors.yellow);
  console.log('');
  
  const template = `# Netopia Payment Gateway Configuration
# Get these credentials from your Netopia merchant account

# Netopia API Key (required)
NETOPIA_API_KEY=your-api-key-here

# Netopia POS Signature (required)
NETOPIA_SIGNATURE=your-pos-signature-here

# Environment: true for sandbox/testing, false for production
NETOPIA_SANDBOX=true

# Public key certificate for webhook verification (optional but recommended)
NETOPIA_WEBHOOK_SECRET=your-public-key-certificate-here

# Your site's base URL (required for callbacks and webhooks)
# For local development:
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# For production:
# NEXT_PUBLIC_SITE_URL=https://yourdomain.com
`;
  
  log(template, colors.green);
}

// Main execution
function main() {
  console.clear();
  log('╔════════════════════════════════════════════════════════════╗', colors.blue);
  log('║          NETOPIA PAYMENT CONFIGURATION CHECKER            ║', colors.bright);
  log('╚════════════════════════════════════════════════════════════╝', colors.blue);
  
  // Load environment
  loadEnvFile();
  
  // Run checks
  const envCheck = checkEnvironmentVariables();
  const sdkCheck = checkNetopiaSDK();
  const filesCheck = checkNetopiaFiles();
  validateURLConfiguration();
  const initCheck = testSDKInitialization();
  
  // Summary
  logHeader('Configuration Summary');
  
  if (!envCheck.hasErrors && !envCheck.hasWarnings && sdkCheck && filesCheck && initCheck) {
    logSuccess('All checks passed! Netopia configuration looks good. ✨');
    logInfo('You can now test the payment flow in your application.');
  } else if (envCheck.hasErrors) {
    logError('Configuration has ERRORS - Netopia payments will NOT work');
    console.log('');
    generateConfigTemplate();
    console.log('');
    logInfo('Next steps:');
    logInfo('1. Add the missing environment variables to .env.local');
    logInfo('2. Run this script again to verify: node scripts/check-netopia-config.js');
    logInfo('3. Restart your development server');
    process.exit(1);
  } else if (envCheck.hasWarnings || !initCheck) {
    logWarning('Configuration has WARNINGS - Some features may not work correctly');
    logInfo('Review the warnings above and update your configuration as needed');
  } else {
    logSuccess('Configuration is valid');
    logInfo('You can proceed with testing the Netopia payment flow');
  }
  
  console.log('');
  log('For more information, visit: https://github.com/mobilpay/Node.js', colors.blue);
  console.log('');
}

// Run the checker
main();

