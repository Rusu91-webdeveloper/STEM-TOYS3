# Admin User Setup Guide

This guide explains how to securely set up administrator users for the NextCommerce application without hardcoded credentials.

## Prerequisites

- Node.js and npm installed
- Access to the project repository
- Database connection configured

## Environment Variables Setup

Before running any admin user scripts, you need to set up the proper environment variables. Create a `.env` file in the project root (if it doesn't exist already) with the following variables:

```
# Admin User (required for admin creation)
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_NAME="Your Admin Name"
ADMIN_PASSWORD="secure-password-here"
```

> ⚠️ **Security Warning**: Never commit your `.env` file to version control. Make sure it's listed in your `.gitignore` file.

## Available Scripts

The project provides multiple ways to create admin users:

### 1. Using the new Prisma Seed Script (Recommended)

This is the recommended method for development and production environments:

```bash
npm run seed:admin
```

This script:

- Reads admin credentials from your environment variables
- Checks if the admin user already exists
- Creates or updates the admin user as needed
- Provides helpful error messages if environment variables are missing

### 2. Using the Legacy Scripts (Alternative)

The following scripts have been updated to use environment variables instead of hardcoded credentials:

```bash
# Create a single admin user
node scripts/create-admin.js

# Add an admin user (similar functionality)
node scripts/add-admin-user.js

# Initialize database with admin, categories, products
node scripts/init-database.js
```

All these scripts now rely on the same environment variables (`ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD`).

## Production Deployment

For production environments:

1. Set the environment variables securely using your hosting platform's environment variable management
2. Run the admin seeding script as part of your deployment process
3. Verify that no hardcoded credentials exist in your deployed code

## Testing Admin Login

After creating an admin user, you can test the login at:

```
http://your-site-url/auth/login
```

Use the email and password specified in your environment variables.

## Troubleshooting

If you encounter issues:

1. Verify your environment variables are set correctly
2. Check database connection is working
3. Look for error messages in the console output
4. Ensure you have the latest version of the scripts
