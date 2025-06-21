# Brevo (formerly Sendinblue) Email Integration

This document explains how to set up and use Brevo for transactional emails in your Next.js e-commerce application.

## Table of Contents

- [Setup](#setup)
- [Configuration](#configuration)
- [Using the Email API](#using-the-email-api)
- [Email Templates](#email-templates)
- [SEO Optimization](#seo-optimization)
- [GDPR Compliance](#gdpr-compliance)
- [Troubleshooting](#troubleshooting)

## Setup

### 1. Dependencies

This project uses direct HTTP API calls with axios for better security and performance. The integration is built into the application without requiring additional SDKs.

Required dependencies (already included):

- `axios` - For HTTP API calls to Brevo
- `nodemailer` - For SMTP fallback option

### 2. Create a Brevo Account

1. Sign up for a free Brevo account at [https://app.brevo.com](https://app.brevo.com)
2. The free plan includes 300 emails/day (9,000/month), which should be sufficient for most small to medium e-commerce sites

### 3. Get API Credentials

1. In your Brevo dashboard, go to SMTP & API → API Keys
2. Create a new API key with appropriate permissions (minimum "Transactional emails")
3. Copy the API key and update your `.env.local` file

```
BREVO_API_KEY=your_actual_api_key
```

4. Update your sender information:

```
EMAIL_FROM=your_actual_email@yourdomain.com
EMAIL_FROM_NAME=Your Store Name
```

## Configuration

The integration supports two methods of sending emails:

### API Method (Recommended)

Uses the Brevo API directly with axios HTTP calls. This is the preferred method for modern applications.

- Pros: Faster, better analytics, templates managed on Brevo dashboard, no deprecated dependencies
- Requirements: `BREVO_API_KEY` environment variable

### SMTP Method (Alternative)

Uses Nodemailer with Brevo's SMTP relay. This is a compatibility option if you prefer using Nodemailer.

- Pros: Compatible with existing Nodemailer code, familiar for developers
- Requirements: `BREVO_SMTP_LOGIN` and `BREVO_SMTP_KEY` environment variables

The system will automatically use the API method if `BREVO_API_KEY` is set, otherwise it will fall back to the SMTP method.

## Using the Email API

Send transactional emails using the `/api/email/brevo` endpoint:

```javascript
// Example: Send a welcome email
const response = await fetch("/api/email/brevo", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    type: "welcome",
    data: {
      to: "customer@example.com",
      name: "John Doe",
    },
  }),
});

if (response.ok) {
  console.log("Email sent successfully");
} else {
  console.error("Failed to send email");
}
```

### Available Email Types

The API supports the following email types:

1. **welcome** - Welcome email for new users

   ```javascript
   {
     type: 'welcome',
     data: {
       to: 'user@example.com',
       name: 'User Name',
     }
   }
   ```

2. **verification** - Email verification link

   ```javascript
   {
     type: 'verification',
     data: {
       to: 'user@example.com',
       name: 'User Name',
       verificationLink: 'https://yourdomain.com/verify?token=abc123',
       expiresIn: '24 hours', // optional
     }
   }
   ```

3. **passwordReset** - Password reset link

   ```javascript
   {
     type: 'passwordReset',
     data: {
       to: 'user@example.com',
       resetLink: 'https://yourdomain.com/reset-password?token=abc123',
       expiresIn: '1 hour', // optional
     }
   }
   ```

4. **orderConfirmation** - Order confirmation with product details

   ```javascript
   {
     type: 'orderConfirmation',
     data: {
       to: 'customer@example.com',
       orderId: 'order_123',
       userId: 'user_456',
     }
   }
   ```

5. **returnProcessing** - Return status updates
   ```javascript
   {
     type: 'returnProcessing',
     data: {
       to: 'customer@example.com',
       orderId: 'order_123',
       userId: 'user_456',
       returnStatus: 'RECEIVED', // 'RECEIVED', 'PROCESSING', 'APPROVED', or 'COMPLETED'
       returnDetails: {
         id: 'return_123',
         reason: 'Defective product',
         comments: 'The toy had missing parts', // optional
       }
     }
   }
   ```

## Email Templates

All email templates are defined in `lib/brevoTemplates.ts` and include:

- Mobile-responsive design
- SEO-optimized links and content
- GDPR-compliant unsubscribe links
- Schema.org markup for better email client rendering

You can modify the templates in this file to match your brand styling and messaging.

## SEO Optimization

The email templates are optimized for SEO with:

1. **Product Links**: Each product in order confirmations includes a direct link to its product page using the product's slug
2. **Related Products**: Order confirmation emails show related products based on the purchased items' categories
3. **Schema.org Markup**: Structured data is included in emails to improve rendering in email clients
4. **Blog Links**: Welcome and verification emails include links to relevant blog posts
5. **Rich Media**: Images and clear calls-to-action drive traffic back to your site

## GDPR Compliance

The email integration is GDPR-compliant with:

1. **Unsubscribe Links**: Every email includes an unsubscribe link in the footer
2. **Clear Sender Information**: Full sender information including company name and contact details
3. **EU-Based Processing**: Brevo has EU-based servers for data processing
4. **Privacy Policy Links**: Direct links to your privacy policy
5. **Consent Management**: The system is designed to work with your existing consent management

## Troubleshooting

### Email Not Sending

1. Check your environment variables are correctly set in `.env.local`
2. Verify your Brevo account is active and within sending limits
3. Check the logs for any error messages
4. Verify the email template exists for the type you're trying to send

### Development Mode

In development mode, emails will not be sent if credentials are missing. Instead, the email content will be logged to the console for debugging.

### Testing Templates

You can test email templates using the `/api/test-email` endpoint (admin login required).

### Common Issues

- **Spam Filtering**: Ensure your domain is properly set up with SPF and DKIM records
- **API Rate Limiting**: The Brevo free plan has limitations on emails per day
- **Invalid Recipients**: Check that email addresses are valid before sending

For more information, refer to the [Brevo API Documentation](https://developers.brevo.com/docs).
