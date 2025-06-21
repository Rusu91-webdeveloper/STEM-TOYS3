# NextCommerce Setup Guide

This guide provides detailed instructions for setting up and running the NextCommerce project locally.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0 or later)
- **npm** (v7 or later) or **yarn** (v1.22 or later)
- **PostgreSQL** (v12 or later)
- **Git**

## Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/nextcommerce.git

# Navigate to the project directory
cd nextcommerce
```

## Step 2: Install Dependencies

```bash
# Using npm
npm install

# OR using Yarn
yarn install
```

## Step 3: Set Up the Database

1. Create a PostgreSQL database:

```bash
# Access PostgreSQL command line
psql -U postgres

# Create the database
CREATE DATABASE nextcommerce;

# Exit PostgreSQL
\q
```

2. Configure your database connection:

   - Copy the `.env.example` file to `.env.local`:
     ```bash
     cp env.example .env.local
     ```
   - Update the `DATABASE_URL` in `.env.local` with your PostgreSQL credentials:
     ```
     DATABASE_URL="postgresql://username:password@localhost:5432/nextcommerce"
     ```

## Step 4: Configure Environment Variables

1. Open the `.env.local` file and configure all required variables:

   - See the [Environment Variables Documentation](ENVIRONMENT_VARIABLES.md) for details on each variable
   - For development, you can use test/dummy values for third-party services

2. Generate a secure value for NEXTAUTH_SECRET:

   ```bash
   # Using openssl (recommended)
   openssl rand -base64 32

   # OR, any random string of at least 32 characters
   ```

## Step 5: Initialize the Database Schema

```bash
# Generate Prisma client
npx prisma generate

# Push the schema to your database
npx prisma db push
```

## Step 6: (Optional) Seed the Database with Test Data

```bash
# Run the database seeding script
npx prisma db seed
```

## Step 7: Start the Development Server

```bash
# Using npm
npm run dev

# OR using Yarn
yarn dev
```

Your application should now be running at [http://localhost:3000](http://localhost:3000).

## Step 8: Access Admin Dashboard (Optional)

If you seeded the database, you can access the admin dashboard using:

- **URL**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Email**: admin@example.com
- **Password**: password (you should change this immediately in a real deployment)

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Verify your PostgreSQL service is running
2. Check that the `DATABASE_URL` in `.env.local` is correct
3. Ensure your PostgreSQL user has appropriate permissions

```bash
# Grant necessary permissions to your database user
psql -U postgres
GRANT ALL PRIVILEGES ON DATABASE nextcommerce TO your_username;
\q
```

### Package Installation Problems

If you encounter issues during package installation:

```bash
# Clear npm cache
npm cache clean --force

# Try installation again
npm install
```

### Prisma Issues

If you face problems with Prisma:

```bash
# Reset Prisma
npx prisma generate --force

# If schema changes aren't reflecting
npx prisma db push --force-reset
```

## Third-Party Service Setup

For full functionality, you'll need to set up the following services:

### Stripe (Payments)

1. Create a [Stripe](https://stripe.com) account
2. Get your API keys from the Stripe Dashboard
3. Update your `.env.local` with your Stripe keys

### Uploadthing (File Uploads)

1. Create an [Uploadthing](https://uploadthing.com) account
2. Configure your upload policies
3. Add your API keys to `.env.local`

### Resend (Email)

1. Sign up for [Resend](https://resend.com)
2. Verify your domain or use the sandbox mode for testing
3. Add your API key to `.env.local`

## Next Steps

After setting up the project locally, you might want to:

1. Explore the codebase to understand the architecture
2. Check out the API documentation
3. Try adding a test product through the admin dashboard
4. Make a test purchase to verify the checkout flow
