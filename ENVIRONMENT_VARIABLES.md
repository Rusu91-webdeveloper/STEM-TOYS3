# Environment Variables

This document lists all environment variables used in the NextCommerce project, their purpose, and example values. These variables should be added to a `.env.local` file in the project root directory.

## Database Configuration

| Variable     | Description                  | Example Value                                            |
| ------------ | ---------------------------- | -------------------------------------------------------- |
| DATABASE_URL | PostgreSQL connection string | `postgresql://user:password@localhost:5432/nextcommerce` |

## Authentication

| Variable        | Description                         | Example Value                            |
| --------------- | ----------------------------------- | ---------------------------------------- |
| NEXTAUTH_SECRET | Secret key for NextAuth.js sessions | `your-secret-key-at-least-32-chars-long` |
| NEXTAUTH_URL    | URL for NextAuth.js                 | `http://localhost:3000`                  |

## Payment Processing (Stripe)

| Variable                      | Description                                      | Example Value               |
| ----------------------------- | ------------------------------------------------ | --------------------------- |
| STRIPE_SECRET_KEY             | Stripe API secret key                            | `sk_test_your_test_key`     |
| NEXT_PUBLIC_STRIPE_PUBLIC_KEY | Stripe publishable key (client-side)             | `pk_test_your_test_key`     |
| STRIPE_WEBHOOK_SECRET         | Secret for Stripe webhook signature verification | `whsec_your_webhook_secret` |

## File Uploads (Uploadthing)

| Variable           | Description                | Example Value             |
| ------------------ | -------------------------- | ------------------------- |
| UPLOADTHING_SECRET | Uploadthing secret key     | `sk_live_your_secret_key` |
| UPLOADTHING_APP_ID | Uploadthing application ID | `your-app-id`             |

## Email Notifications (Resend)

| Variable       | Description                       | Example Value     |
| -------------- | --------------------------------- | ----------------- |
| RESEND_API_KEY | Resend API key for sending emails | `re_your_api_key` |

## Other Configuration

| Variable             | Description                                    | Example Value           |
| -------------------- | ---------------------------------------------- | ----------------------- |
| NEXT_PUBLIC_SITE_URL | Base URL of the website for generating links   | `http://localhost:3000` |
| NODE_ENV             | Environment (development, production, or test) | `development`           |

## Setting Up Your Environment

1. Create a `.env.local` file in the project root directory.
2. Copy all the variables above and set your own values.
3. Restart the development server to apply changes.

**Note:** In production, you would set these environment variables through your hosting provider's dashboard or deployment configuration.

## Obtaining API Keys

- **Stripe**: Sign up at [stripe.com](https://stripe.com) and navigate to the Developers > API keys section.
- **Uploadthing**: Create an account at [uploadthing.com](https://uploadthing.com) and get your API keys from the dashboard.
- **Resend**: Sign up at [resend.com](https://resend.com) and get your API key from the dashboard.

## Security Best Practices

When handling environment variables, follow these security best practices:

1. **Never commit `.env` files to version control** - Ensure `.env*` files are included in your `.gitignore` file
2. **Use different values for development and production** - Never use the same secret keys across environments
3. **Rotate secrets regularly** - Change your secret keys periodically, especially for production environments
4. **Limit access to production secrets** - Only team members who absolutely need access should have it
5. **Use secret management services** in production - Consider using services like Vercel's Environment Variables UI, AWS Secrets Manager, or Hashicorp Vault instead of plain text files
6. **Monitor for exposed secrets** - Use tools like GitGuardian or GitHub secret scanning to detect accidentally committed secrets
7. **Use strong, randomly generated values** for secrets - Don't use simple or predictable secret values

For local development:

```bash
# Generate a secure random string for NEXTAUTH_SECRET
openssl rand -base64 32
```
