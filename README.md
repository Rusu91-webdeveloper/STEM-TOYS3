# TechTots - STEM Educational Toys E-commerce Platform

A modern, production-ready e-commerce platform built with Next.js 15, designed
specifically for STEM educational products. The application provides a seamless
shopping experience with fast page loads, SEO optimization, and responsive
design.

## 📚 Documentation

### Core technical docs

- **[PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md)** – Codebase structure,
  tech stack, and architecture patterns
- **[API_REFERENCE.md](./API_REFERENCE.md)** – All API endpoints with
  request/response examples
- **[FEATURES_GUIDE.md](./FEATURES_GUIDE.md)** – Detailed features guide with
  technical implementation
- **[ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)** – Environment variables,
  development setup, and deployment guide
- **[DATABASE_TABLES_AUDIT.md](./DATABASE_TABLES_AUDIT.md)** – Status of all database tables (fully functional vs partial vs schema‑only)
- **[DATABASE_TABLES_EXPLAINED.md](./DATABASE_TABLES_EXPLAINED.md)** – Plain‑language explanation of advanced/future‑proof tables

### Safety & migrations

- **[DATABASE_SAFETY.md](./DATABASE_SAFETY.md)** – Complete database protection
  guide, backup/restore procedures
- **[CURSOR_DATABASE_SAFETY_RULE.md](./CURSOR_DATABASE_SAFETY_RULE.md)** – AI safety rules for database operations
- **[PRE_PUSH_SAFETY_GUIDE.md](./PRE_PUSH_SAFETY_GUIDE.md)** – Pre‑push safety checks and migration validation

### Shipping & logistics

- **[SHIPPING_ANALYSIS_REPORT.md](./SHIPPING_ANALYSIS_REPORT.md)** – Shipping prices, delivery logic, legal alignment, and TODOs
- **[FANCOURIER_INTEGRATION.md](./FANCOURIER_INTEGRATION.md)** – Technical Fan Courier integration map
- **[docs/FAN_COURIER_GUIDE.md](./docs/FAN_COURIER_GUIDE.md)** – Operational Fan Courier setup and usage guide

### Operations & launch

- **[LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md)** – Launch blueprint and checklist
- **[docs/SOP_DAILY_OPERATIONS.md](./docs/SOP_DAILY_OPERATIONS.md)** – Standard operating procedures for daily operations
- **[docs/PRODUCT_IMPORT_GUIDE.md](./docs/PRODUCT_IMPORT_GUIDE.md)** – Guide for importing products
- **[docs/BUNDLE_CREATION_GUIDE.md](./docs/BUNDLE_CREATION_GUIDE.md)** – Guide for creating product bundles
- **[docs/SUPPLIER_SYNC_PLAN.md](./docs/SUPPLIER_SYNC_PLAN.md)** – Supplier synchronization plan
- **[docs/CUSTOMER_SUPPORT_MACROS.md](./docs/CUSTOMER_SUPPORT_MACROS.md)** – Customer support macros and templates
- **[docs/GOOGLE_SEARCH_CONSOLE_SETUP.md](./docs/GOOGLE_SEARCH_CONSOLE_SETUP.md)** – Complete guide for setting up Google Search Console API for live SEO data

### Business, value & concepts

- **[FEATURE_COMPLETION_PLAN.md](./FEATURE_COMPLETION_PLAN.md)** – Remaining partial features, priorities, and time/ROI estimates
- **[PROJECT_ASSESSMENT_REPORT.md](./PROJECT_ASSESSMENT_REPORT.md)** – Overall project assessment and valuation
- **[WHAT_IS_A_TENANT.md](./WHAT_IS_A_TENANT.md)** – Simple explanation of tenants vs single‑tenant and why the app runs single‑tenant today

### Incidents & deep dives (when debugging)

- **[docs/INCIDENTS_AND_FIXES.md](./docs/INCIDENTS_AND_FIXES.md)** – Index of focused incident/fix write‑ups (returns, admin order cache, COD payment status, DB safety)

## 🚀 Features

### Core E-commerce Features

- 🛍️ **Complete Product Catalog**: Browse, search, and filter STEM educational
  products
- 🛒 **Shopping Cart**: Add products, manage quantities, and proceed to checkout
- 💳 **Secure Payments**: Integrated with Stripe for secure payment processing
- 📧 **Order Management**: Complete order tracking and email notifications
- 👤 **User Accounts**: Secure authentication with Google OAuth
- 📱 **Responsive Design**: Works seamlessly on mobile, tablet, and desktop

### Admin Features

- 📊 **Admin Dashboard**: Comprehensive analytics and order management
- 🎯 **Product Management**: Create, edit, and manage product catalog
- 👥 **Customer Management**: View and manage customer accounts
- 📈 **Analytics**: Sales reports and performance metrics
- 🔧 **System Configuration**: Manage settings and configurations

### Supplier Features

- 🏪 **Supplier Portal**: Dedicated dashboard for product suppliers
- 📦 **Product Upload**: Bulk upload products via CSV/Excel
- 📊 **Sales Analytics**: Track sales performance and revenue
- 💰 **Commission Tracking**: Monitor earnings and payments
- 📋 **Order Management**: Process and fulfill orders

### Technical Features

- 🚀 **High Performance**: Built with Next.js 15 for optimal loading speeds
- 🔒 **Security**: JWT authentication, CSRF protection, and secure file uploads
- 🌐 **Internationalization**: Support for multiple languages (Romanian/English)
- 🔍 **SEO Optimized**: Search engine friendly structure and metadata
- 📧 **Email Automation**: Order confirmations and updates via Resend
- 🖼️ **Image Management**: Advanced image upload and optimization
- 📝 **Rich Text Editor**: TinyMCE integration for content management
- 🎨 **Modern UI**: Beautiful, accessible design with Shadcn/UI components

## 🚚 Sameday Shipping & COD (Romania)

- ✅ **COD guardrails**: B2C/B2B thresholds enforced in UI + server; recipient type inferred from company fields
- 📦 **Easybox-first flow**: Easybox preselected when eligible (<= 20kg); locker selection required
- 🧮 **Pricing calculator**: Tariff-based quotes with volumetric weight and configurable surcharges
- 🧾 **Order persistence**: Pricing breakdown and COD metadata stored on orders for auditability
- 🧭 **AWB automation**: Server-side validation + auto-create on payment webhooks, with admin manual fallback

### Configuration (see `env.example` for full list)

```env
# COD thresholds
COD_MAX_B2C=10000
COD_MAX_B2B=5000
NEXT_PUBLIC_COD_MAX_B2C=10000
NEXT_PUBLIC_COD_MAX_B2B=5000

# Shipping pricing
SHIPPING_PRICING_VERSION=sameday-2025-10-05
SHIPPING_EASYBOX_BASE_PRICE=19
SHIPPING_HOME_BASE_PRICE=25
SHIPPING_ADDITIONAL_KG_PRICE=2.5
SHIPPING_FUEL_INDEX_PERCENT=0
SHIPPING_EXTRA_RETEA_FEE=8.39
SHIPPING_ATIPIC_FEE=50
SHIPPING_APPLY_FUEL_INDEX=false
SHIPPING_APPLY_EXTRA_RETEA=false
SHIPPING_APPLY_ATIPIC_FEE=false

# Sameday integration
SAMEDAY_USERNAME=your-sameday-username
SAMEDAY_PASSWORD=your-sameday-password
SAMEDAY_BASE_URL=https://api.sameday.ro
SAMEDAY_TOKEN_HEADER=X-AUTH-TOKEN
SAMEDAY_CREATE_AWB_PATH=/api/awb
SAMEDAY_PICKUP_POINTS_PATH=/api/pickup-points
SAMEDAY_SERVICES_PATH=/api/services
SAMEDAY_COUNTIES_PATH=/api/counties
SAMEDAY_CITIES_PATH=/api/cities
SAMEDAY_REFERENCE_TTL_MINUTES=1440
```

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** (App Router) - React framework with server-side rendering
- **React 19** with TypeScript - Modern React with type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - High-quality component library
- **Lucide React** - Beautiful icon library

### Backend

- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Primary database (Neon)
- **NextAuth.js** - Authentication and session management
- **Redis** - Caching and session storage (Upstash)

### Third-party Services

- **Stripe** - Payment processing and subscription management
- **Uploadthing** - File upload and storage
- **Resend** - Email delivery service
- **Google OAuth** - Social authentication
- **Sentry** - Error tracking and monitoring
- **Vercel** - Deployment and hosting platform

### Development Tools

- **TypeScript** - Type-safe JavaScript
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting
- **Jest** - Unit testing framework
- **Playwright** - End-to-end testing
- **Prisma Studio** - Database management

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0 or later
- pnpm (recommended) or npm
- PostgreSQL database
- Redis instance (optional, for caching)

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
# Core Application
NODE_ENV=development
NEXTAUTH_SECRET=your-super-secret-key-here-minimum-32-characters
NEXTAUTH_URL=http://localhost:3000

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://username:password@host:port/database

# Redis (Upstash)
REDIS_URL=https://your-redis-url.upstash.io
REDIS_TOKEN=your-redis-token

# Authentication (Google OAuth)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Payment Processing (Stripe)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# File Uploads (Uploadthing)
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=your-app-id

# Rich Text Editor (TinyMCE)
NEXT_PUBLIC_TINYMCE_API_KEY=your-tinymce-api-key

# Monitoring (Sentry)
SENTRY_DSN=https://...
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

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run E2E tests
pnpm test:e2e

# Run tests with coverage
pnpm test:coverage
```

## 📁 Project Structure

```
STEM-TOYS3/
├── app/                    # Next.js App Router pages and layouts
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── auth/              # Authentication pages
│   ├── products/          # Product catalog
│   ├── checkout/          # Checkout process
│   ├── account/           # User account pages
│   └── supplier/          # Supplier portal
├── components/            # Shared UI components
│   ├── ui/               # Shadcn/UI components
│   ├── admin/            # Admin-specific components
│   ├── auth/             # Authentication components
│   └── layout/           # Layout components
├── features/             # Feature-based organization
│   ├── auth/             # Authentication features
│   ├── products/         # Product management
│   ├── cart/             # Shopping cart
│   ├── checkout/         # Checkout process
│   ├── account/          # User account
│   ├── supplier/         # Supplier features
│   └── home/             # Homepage features
├── lib/                  # Utility functions and shared code
│   ├── auth/             # Authentication utilities
│   ├── db/               # Database utilities
│   ├── email/            # Email services
│   ├── i18n/             # Internationalization
│   └── utils/            # General utilities
├── prisma/               # Database schema and migrations
├── public/               # Static assets
├── types/                # TypeScript type definitions
└── __tests__/            # Test files
```

## 🔒 Security Features

- **Content Security Policy (CSP)** with nonce-based script execution
- **Secure file uploads** with authentication and validation
- **JWT-based authentication** with NextAuth.js
- **CSRF protection** for all forms and mutations
- **Input validation** with Zod schemas
- **Rate limiting** on sensitive endpoints
- **HTTPS enforcement** in production

## 📊 Performance Features

- **Server-side rendering** for optimal SEO and performance
- **Image optimization** with Next.js Image component
- **Code splitting** for faster page loads
- **Caching strategies** for improved performance
- **Database query optimization** with Prisma
- **CDN integration** for static assets

## 🌐 Internationalization

The platform supports multiple languages:

- **Romanian** (default)
- **English**

Language switching is available throughout the application with proper RTL
support and localized content.


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

# Test deployment - Thu Sep 11 08:37:15 EEST 2025
# Test deployment
