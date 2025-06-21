# NextCommerce - E-commerce Platform

## Overview

NextCommerce is a modern, full-featured e-commerce platform specializing in STEM toys for educational purposes. This document provides a comprehensive overview of the project, detailing the technologies, frameworks, and database structure used throughout the application.

## Technologies & Frameworks

### Core Technologies

- **Next.js 15**: App Router-based React framework for building the frontend and API routes
- **React 19**: UI library for building component-based interfaces
- **TypeScript**: For type-safe JavaScript development
- **PostgreSQL**: Relational database via NeonDB serverless PostgreSQL
- **Prisma 6**: ORM for database access and management

### Authentication & Security

- **NextAuth v5**: For authentication and user management
- **bcrypt**: For password hashing and security
- **zod**: For runtime type checking and data validation

### UI Components

- **Radix UI**: Headless UI components library (accordion, dialog, select, etc.)
- **Tailwind CSS 4**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Class Variance Authority (CVA)**: For creating variant components with consistent styling

### State Management & Data Fetching

- **Zustand**: Lightweight state management
- **TanStack React Query**: For server state management and data fetching
- **Axios**: HTTP client for API requests

### Payment Processing

- **Stripe**: Payment processing integration

### File Uploads & Email

- **UploadThing**: For file uploads and management
- **Resend** & **Nodemailer**: For transactional emails

### Additional Features

- **Sharp**: For image processing and optimization
- **date-fns**: Date utility library
- **cookies-next**: Cookie management

## Project Structure

The project follows Next.js App Router conventions with a feature-first organization pattern:

```
/app
  /features         # Feature-specific components and logic
    /auth           # Authentication-related components
    /products       # Product-related components
    /checkout       # Checkout flow components
    ...
  /api              # API routes
  /lib              # Shared utilities and helpers
  /components       # Shared UI components
  /generated        # Generated Prisma client
  ...
```

## Database Structure

### User Management

- **User**: Main user model with authentication details

  - Relations: Addresses, PaymentCards, Orders, Blogs, Wishlist
  - Role-based access (CUSTOMER, ADMIN)

- **PasswordResetToken**: For handling password resets

  - Linked to User via email

- **Address**: User shipping/billing addresses

  - Relations: User, Orders

- **PaymentCard**: Stored payment methods (with encryption)
  - Relations: User

### Product Catalog

- **Category**: Product categories with hierarchical structure

  - Relations: Products, Blogs, Self-relation (parent/children)

- **Product**: Main product information

  - Relations: Category, OrderItems, Wishlist
  - Features: SKU, barcode, stock tracking, pricing

- **Wishlist**: User product wishlist
  - Relations: User, Product

### Content Management

- **Blog**: Blog posts for educational content

  - Relations: User (author), Category
  - Categorized by STEM areas (SCIENCE, TECHNOLOGY, ENGINEERING, MATHEMATICS, GENERAL)

- **Book**: Educational books

  - Relations: Languages

- **Language**: Language availability for books
  - Relations: Book

### Order Processing

- **Order**: Customer orders

  - Relations: User, Address, OrderItems
  - Status tracking for both order and payment

- **OrderItem**: Individual line items in orders
  - Relations: Order, Product

### Configuration

- **StoreSettings**: Global store configuration
  - Default store information, meta data, shipping & payment settings

## Enums and Statuses

- **Role**: CUSTOMER, ADMIN
- **StemCategory**: SCIENCE, TECHNOLOGY, ENGINEERING, MATHEMATICS, GENERAL
- **OrderStatus**: PROCESSING, SHIPPED, DELIVERED, CANCELLED, COMPLETED
- **PaymentStatus**: PENDING, PAID, FAILED, REFUNDED

## API Integration

The platform integrates with:

- **Stripe**: For payment processing
- **Email services**: Via Resend and Nodemailer
- **UploadThing**: For file uploads

## Development & Deployment

- **Development**: `npm run dev` - Next.js development server
- **Build**: `prisma generate && next build` - Generate Prisma client and build the Next.js application
- **Database Seeding**: Various seed scripts for populating the database with initial data

## Data Seeding

The application includes several data seeding scripts:

- Main seed script: `npm run seed`
- Romanian content: `npm run seed:romanian`
- Blog seed: `npm run seed:blogs`
- Books seed: `npm run seed:books`
