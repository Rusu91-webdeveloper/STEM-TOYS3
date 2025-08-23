# STEM Toys E-commerce Platform

A modern, production-ready e-commerce platform built with Next.js, designed
specifically for STEM education products. The application provides a seamless
shopping experience with fast page loads, SEO optimization, and responsive
design.

## 🚀 Features

- 🛍️ **Complete E-commerce Platform**: Product catalog, search, filtering, cart,
  checkout
- 💳 **Secure Payments**: Integrated with Stripe for secure payment processing
- 📱 **Responsive Design**: Works smoothly on mobile, tablet, and desktop
- 🚀 **High Performance**: Built with Next.js for optimal loading speeds
- 🔒 **Authentication**: Secure user accounts and profiles
- 📧 **Email Notifications**: Order confirmations and updates via Resend
- 🖼️ **Image Uploads**: Product image management with Uploadthing
- 🔍 **SEO Optimized**: Search engine friendly structure and metadata
- 🌐 **Internationalization**: Support for multiple languages (i18n)
- 📊 **Admin Dashboard**: Comprehensive analytics and order management
- 🎨 **Modern UI**: Beautiful, accessible design with Shadcn/UI components

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** (App Router)
- **React 19** with TypeScript
- **Tailwind CSS** with custom design system
- **Shadcn/UI** component library
- **React Query** for server state management

### Backend

- **Next.js API Routes**
- **Prisma ORM** with PostgreSQL
- **NextAuth.js** for authentication
- **Redis** for caching and sessions

### Third-party Services

- **Stripe** for payment processing
- **Uploadthing** for image uploads
- **Resend** for email notifications
- **Sentry** for error tracking
- **Vercel** for deployment

## 🔒 Security Features

- **Content Security Policy (CSP)** with nonce-based script execution
- **Secure file uploads** with authentication and validation
- **JWT-based authentication** with NextAuth.js
- **CSRF protection** for all forms and mutations
- **Input validation** with Zod schemas
- **Rate limiting** on sensitive endpoints
- **HTTPS enforcement** in production

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0 or later
- pnpm (recommended) or npm
- PostgreSQL database
- Redis (optional, for caching)

### Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd STEM-TOYS3
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Set up environment variables**:

   ```bash
   cp env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up the database**:

   ```bash
   pnpm prisma generate
   pnpm prisma db push
   ```

5. **Start the development server**:

   ```bash
   pnpm dev
   ```

6. **Open** [http://localhost:3000](http://localhost:3000) in your browser

## 🌍 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/stemtoys"
SHADOW_DATABASE_URL="postgresql://user:password@localhost:5432/stemtoys_shadow"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Email (Resend)
RESEND_API_KEY="re_..."

# File Uploads
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="your-app-id"

# Redis (Optional)
REDIS_URL="redis://localhost:6379"

# Sentry (Optional)
SENTRY_DSN="https://..."
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy your app

### Production Checklist

#### Pre-Deployment

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] Monitoring alerts set up

#### Post-Deployment

- [ ] Health checks passing
- [ ] Payment processing tested
- [ ] Email notifications working
- [ ] Admin dashboard accessible
- [ ] Performance monitoring active

### Essential Commands

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Deploy to Vercel
vercel --prod

# Check application health
curl https://your-domain.com/api/health

# Database management
pnpm prisma generate
pnpm prisma db push
pnpm db:studio
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run E2E tests
pnpm test:e2e

# Run accessibility tests
pnpm test:accessibility

# Run performance tests
pnpm test:performance
```

## 🛠️ Troubleshooting

### Common Issues

**Database Connection Errors**

```bash
# Check database connectivity
pnpm prisma db push --preview-feature

# Verify environment variables
echo $DATABASE_URL
```

**Build Failures**

```bash
# Clear Next.js cache
rm -rf .next
pnpm build

# Check TypeScript errors
pnpm type-check
```

**Payment Processing Issues**

- Verify Stripe keys are correct
- Check webhook endpoints
- Validate payment intent creation

**Email Issues**

- Verify Resend API key
- Check email templates
- Validate SMTP settings

### Performance Optimization

- **Core Web Vitals Targets**:
  - LCP: < 2.5s
  - FID: < 100ms
  - CLS: < 0.1

- **Key Metrics to Monitor**:
  - Page load times
  - API response times
  - Database query performance
  - Error rates
  - User conversion rates

## 📁 Project Structure

```
STEM-TOYS3/
├── app/                    # Next.js App Router pages and layouts
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── auth/              # Authentication pages
│   ├── products/          # Product catalog
│   ├── checkout/          # Checkout process
│   └── account/           # User account pages
├── components/            # Shared UI components
│   ├── ui/               # Shadcn/UI components
│   ├── admin/            # Admin-specific components
│   └── layout/           # Layout components
├── lib/                  # Utility functions and shared code
│   ├── auth/             # Authentication utilities
│   ├── db/               # Database utilities
│   ├── email/            # Email services
│   └── utils/            # General utilities
├── prisma/               # Database schema and migrations
├── public/               # Static assets
├── types/                # TypeScript type definitions
└── tests/                # Test files
```

## 📚 Additional Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Detailed deployment instructions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Shadcn/UI](https://ui.shadcn.com/) - UI component library
- [Prisma](https://www.prisma.io/) - Database ORM
- [Stripe](https://stripe.com/) - Payment processing
- [Vercel](https://vercel.com/) - Deployment platform

---

**Built with ❤️ for STEM education**
