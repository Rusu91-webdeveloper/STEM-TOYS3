# TechTots - STEM Educational Toys E-commerce Platform

A modern, production-ready e-commerce platform built with Next.js 15, designed
specifically for STEM educational products. The application provides a seamless
shopping experience with fast page loads, SEO optimization, and responsive
design.

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

## 📚 Additional Documentation

- [Technical Stack Documentation](./TECHNICAL_STACK.md) - Detailed information
  about all libraries and frameworks
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
# Test deployment - Thu Sep 11 08:37:15 EEST 2025
