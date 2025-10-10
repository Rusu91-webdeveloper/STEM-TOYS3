# Features Guide

Comprehensive guide to all features in the TechTots STEM e-commerce platform,
including user-facing features and technical implementation details.

## Table of Contents

- [Core E-commerce Features](#core-e-commerce-features)
- [Admin Features](#admin-features)
- [Supplier Features](#supplier-features)
- [Advanced Features](#advanced-features)
- [Technical Implementation](#technical-implementation)

---

## Core E-commerce Features

### Product Catalog

**User-Facing:**

- Browse products by category, age group, STEM discipline
- Advanced filtering (price, ratings, features, learning outcomes)
- Search with auto-complete and suggestions
- Product cards with images, prices, ratings
- Quick view for product details
- Responsive grid layout (mobile, tablet, desktop)

**Technical Details:**

- **Components:** `features/products/components/ProductGrid.tsx`,
  `ProductCard.tsx`, `ProductFilters.tsx`
- **API:** `GET /api/products` with query parameters
- **Database:** `Product`, `Category`, `Review` tables
- **Performance:** Static generation with ISR, image optimization
- **Key Files:**
  - `app/products/page.tsx` - Main products page
  - `features/products/hooks/useProducts.ts` - Product fetching logic
  - `features/products/hooks/useProductFilters.ts` - Filter state management

**Implementation:**

```typescript
// Example: Product filtering
export function useProductFilters() {
  const [filters, setFilters] = useState<ProductFilters>({
    category: null,
    ageGroup: null,
    priceRange: [0, 1000],
    sortBy: "newest",
  });

  // Filter logic...
  return { filters, setFilters, applyFilters };
}
```

### Shopping Cart & Checkout

**User-Facing:**

- Add/remove items from cart
- Update quantities
- Apply coupon codes
- View cart summary with calculations
- Guest checkout support
- Multiple payment methods (Stripe)
- Order confirmation emails

**Technical Details:**

- **Components:** `features/cart/components/CartDrawer.tsx`, `CartItem.tsx`,
  `CartSummary.tsx`
- **Context:** `features/cart/context/CartContext.tsx`
- **API:** `POST /api/checkout/create-order`, `POST /api/checkout/payment`
- **Database:** `Cart`, `CartItem`, `Order`, `OrderItem` tables
- **Integration:** Stripe Payments API
- **Key Files:**
  - `app/checkout/page.tsx` - Checkout page
  - `features/cart/hooks/useCart.ts` - Cart management
  - `lib/stripe/index.ts` - Stripe integration

**Cart State Management:**

```typescript
// Context-based cart management
export const CartContext = createContext<CartContextType>(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = async (product: Product, quantity: number) => {
    // Add to cart logic with persistence
  };

  const removeItem = async (productId: string) => {
    // Remove from cart
  };

  return <CartContext.Provider value={{ items, addItem, removeItem }}>
    {children}
  </CartContext.Provider>;
}
```

### Payment Processing

**User-Facing:**

- Secure credit card processing
- RON currency support
- Multiple payment methods
- PCI compliant
- Real-time payment status
- Automatic invoice generation

**Technical Details:**

- **Provider:** Stripe
- **API:** `POST /api/checkout/payment`, `POST /api/webhooks/stripe`
- **Components:** `features/checkout/components/PaymentForm.tsx`
- **Database:** `Order`, `Payment` tables
- **Security:** PCI DSS compliant, tokenization
- **Key Files:**
  - `lib/stripe/index.ts` - Stripe client
  - `app/api/checkout/payment/route.ts` - Payment endpoint
  - `app/api/webhooks/stripe/route.ts` - Webhook handler

**Stripe Integration:**

```typescript
// Payment processing
export async function createPaymentIntent(amount: number, currency: string) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    automatic_payment_methods: { enabled: true },
  });

  return paymentIntent;
}
```

### User Authentication

**User-Facing:**

- Email/password registration and login
- Google OAuth login
- Email verification
- Password reset
- Two-factor authentication (2FA)
- Session management
- Remember me functionality

**Technical Details:**

- **Framework:** NextAuth.js 5.0
- **Providers:** Credentials (email/password), Google OAuth
- **Components:** `components/auth/LoginForm.tsx`, `RegisterForm.tsx`
- **API:** `POST /api/auth/register`, `POST /api/auth/signin`
- **Database:** `User`, `Session`, `TwoFactor`, `PasswordResetToken` tables
- **Security:** bcrypt password hashing, CSRF protection, JWT tokens
- **Key Files:**
  - `lib/auth/nextauth-config.ts` - NextAuth configuration
  - `app/auth/login/page.tsx` - Login page
  - `app/auth/register/page.tsx` - Registration page

**Authentication Flow:**

```typescript
// NextAuth configuration
export const authOptions: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        // Verify credentials
        const user = await verifyCredentials(credentials);
        return user;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // Enhance session with user data
      session.user.role = token.role;
      return session;
    },
  },
};
```

### Order Management

**User-Facing:**

- View order history
- Track order status
- Download invoices
- Re-order functionality
- Order cancellation
- Return requests

**Technical Details:**

- **Components:** `features/account/components/OrderHistory.tsx`,
  `OrderDetail.tsx`
- **API:** `GET /api/user/orders`, `GET /api/user/orders/[id]`
- **Database:** `Order`, `OrderItem`, `OrderStatus`, `Return` tables
- **Email:** Order confirmation, status updates via Resend
- **Key Files:**
  - `app/account/orders/page.tsx` - Order history page
  - `features/account/components/OrderTracking.tsx` - Order tracking

**Order Status Flow:**

```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
                                   ↓
                                CANCELLED
                                   ↓
                                REFUNDED
```

### Product Reviews & Ratings

**User-Facing:**

- Write product reviews
- Rate products (1-5 stars)
- Upload review images
- Helpful votes on reviews
- Verified purchase badges
- Review moderation

**Technical Details:**

- **Components:** `features/products/components/ReviewList.tsx`,
  `ReviewForm.tsx`
- **API:** `POST /api/products/[id]/reviews`, `GET /api/products/[id]/reviews`
- **Database:** `Review` table
- **Validation:** Verified purchase check, profanity filter
- **Key Files:**
  - `features/products/components/ProductReviews.tsx` - Review display
  - `app/api/products/[id]/reviews/route.ts` - Review API

---

## Admin Features

### Admin Dashboard

**User-Facing:**

- Overview of key metrics (revenue, orders, customers)
- Sales charts and graphs
- Recent orders and activity
- Low stock alerts
- Performance indicators
- Quick actions

**Technical Details:**

- **Components:** `app/admin/page.tsx`,
  `components/admin/AnalyticsDashboard.tsx`
- **API:** `GET /api/admin/analytics/dashboard`
- **Database:** Aggregated queries across multiple tables
- **Caching:** Redis cache for dashboard data (5-minute TTL)
- **Charts:** Recharts library for data visualization
- **Key Files:**
  - `app/admin/page.tsx` - Dashboard page
  - `components/admin/DashboardStats.tsx` - Stat cards
  - `components/admin/SalesChart.tsx` - Sales visualization

**Dashboard Metrics:**

```typescript
export async function getDashboardMetrics(period: string) {
  const cached = await redis.get(`dashboard:${period}`);
  if (cached) return cached;

  const metrics = await Promise.all([
    getRevenueMetrics(period),
    getOrderMetrics(period),
    getCustomerMetrics(period),
    getProductMetrics(period),
  ]);

  await redis.set(`dashboard:${period}`, metrics, "EX", 300);
  return metrics;
}
```

### Product Management

**User-Facing:**

- Create/edit/delete products
- Bulk product upload (CSV/Excel)
- Product approval workflow
- Image upload and management
- Category management
- Inventory tracking
- AI product enhancement

**Technical Details:**

- **Components:** `components/admin/ProductGrid.tsx`, `ProductForm.tsx`,
  `ProductEnhancementModal.tsx`
- **API:** `GET/POST/PUT/DELETE /api/admin/products/*`
- **Database:** `Product`, `Category`, `ProductImage` tables
- **File Upload:** Uploadthing for images
- **AI Integration:** OpenAI GPT-4 for descriptions
- **Key Files:**
  - `app/admin/products/page.tsx` - Product list
  - `app/admin/products/[id]/page.tsx` - Product editor
  - `components/admin/ProductForm.tsx` - Product form
  - `lib/ai/product-enhancement.ts` - AI enhancement

**AI Product Enhancement:**

```typescript
export async function enhanceProductDescription(product: Product) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You are an expert at writing compelling product descriptions for STEM toys.",
      },
      {
        role: "user",
        content: `Enhance this product description: ${product.description}`,
      },
    ],
  });

  return completion.choices[0].message.content;
}
```

### Order Status Management

**User-Facing:**

- View all orders with filters
- Update order status
- Bulk status updates
- Add tracking numbers
- Print shipping labels
- Order history and audit trail
- Customer notifications

**Technical Details:**

- **Components:** `app/admin/order-management/page.tsx`,
  `components/admin/OrderStatusManagement.tsx`
- **API:** `GET /api/admin/orders`, `PUT /api/admin/orders/[id]/status`
- **Database:** `Order`, `OrderStatus`, `OrderHistory` tables
- **Email:** Automatic customer notifications via Resend
- **Key Files:**
  - `app/admin/order-management/page.tsx` - Order management interface
  - `lib/email/order-notifications.ts` - Email templates

**Order Status Updates:**

```typescript
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  trackingNumber?: string
) {
  // Update order in database
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      trackingNumber,
      statusHistory: {
        create: {
          status,
          changedBy: userId,
          notes: `Status changed to ${status}`,
        },
      },
    },
  });

  // Send customer notification
  await sendOrderStatusEmail(order);

  return order;
}
```

### Customer Management

**User-Facing:**

- View all customers
- Customer segmentation (NEW, ACTIVE, AT_RISK, CHURNED)
- Lifetime value calculation
- Purchase history
- Customer communication
- Account management

**Technical Details:**

- **Components:** `app/admin/customers/page.tsx`,
  `components/admin/CustomerList.tsx`
- **API:** `GET /api/admin/customers`, `GET /api/admin/customers/[id]`
- **Database:** `User`, `Order`, `UserBehavior` tables
- **Segmentation:** Automated customer segmentation based on behavior
- **Key Files:**
  - `app/admin/customers/page.tsx` - Customer list
  - `lib/analytics/customer-segmentation.ts` - Segmentation logic

### Supplier Invoice System

**User-Facing:**

- Generate supplier invoices
- View invoice history
- Mark invoices as paid
- Send invoices via email
- Invoice PDF download
- Payment tracking

**Technical Details:**

- **Components:** `app/admin/supplier-invoices/page.tsx`,
  `components/admin/InvoiceManagement.tsx`
- **API:** `GET/POST/PUT /api/admin/supplier-invoices/*`
- **Database:** `SupplierInvoice`, `SupplierPayment` tables
- **PDF Generation:** React-PDF for invoice generation
- **Key Files:**
  - `app/admin/supplier-invoices/page.tsx` - Invoice management
  - `lib/pdf/invoice-generator.ts` - PDF generation

### Cost Management Dashboard

**User-Facing:**

- Product cost analysis
- Profit margin calculations
- Cost breakdown by category
- Cost optimization recommendations
- Risk assessment
- Export cost reports

**Technical Details:**

- **Components:** `app/admin/cost-management/page.tsx`,
  `components/admin/ProductCostManagement.tsx`
- **API:** `GET /api/admin/cost-management`
- **Database:** `Product`, `SupplierProductCost`, `Order` tables
- **Calculations:** Real-time cost and margin analysis
- **Key Files:**
  - `app/admin/cost-management/page.tsx` - Cost management dashboard
  - `lib/analytics/cost-analysis.ts` - Cost calculations

### Analytics Dashboard

**User-Facing:**

- Revenue analytics
- Sales trends
- Product performance
- Customer behavior analysis
- Conversion funnel
- Custom date ranges
- Export reports

**Technical Details:**

- **Components:** `app/admin/analytics/page.tsx`,
  `components/admin/AdvancedAnalytics.tsx`
- **API:** `GET /api/admin/analytics/*`
- **Database:** `AnalyticsEvent`, `ConversionEvent`, `Order` tables
- **Tracking:** Google Analytics 4, Facebook Pixel
- **Key Files:**
  - `app/admin/analytics/page.tsx` - Analytics dashboard
  - `lib/analytics/metrics.ts` - Metrics calculations

### SEO Dashboard

**User-Facing:**

- SEO performance monitoring
- Keyword rankings
- Backlink tracking
- Google Search Console integration
- Page performance analysis
- SEO recommendations

**Technical Details:**

- **Components:** `app/admin/seo-dashboard/page.tsx`,
  `components/admin/SEOMonitoring.tsx`
- **API:** `GET /api/admin/seo/*`
- **Database:** `SEOLog`, `PageMetadata`, `BacklinkCampaign` tables
- **Integration:** Google Search Console API
- **Key Files:**
  - `app/admin/seo-dashboard/page.tsx` - SEO dashboard
  - `lib/seo/google-search-console.ts` - GSC integration

---

## Supplier Features

### Supplier Portal

**User-Facing:**

- Dedicated supplier dashboard
- Sales analytics and metrics
- Product performance tracking
- Revenue reports
- Order notifications
- Profile management

**Technical Details:**

- **Components:** `app/supplier/page.tsx`,
  `components/supplier/SupplierDashboard.tsx`
- **API:** `GET /api/supplier/analytics`
- **Database:** `Supplier`, `SupplierProduct`, `SupplierOrder` tables
- **Key Files:**
  - `app/supplier/page.tsx` - Supplier dashboard
  - `features/supplier/components/SupplierAnalytics.tsx` - Analytics

### Bulk Product Upload

**User-Facing:**

- Upload products via CSV/Excel
- Data validation and preview
- Error reporting
- Template download
- Batch processing
- Progress tracking

**Technical Details:**

- **Components:** `app/supplier/products/page.tsx`,
  `components/supplier/BulkUpload.tsx`
- **API:** `POST /api/supplier/products/bulk-upload`
- **Database:** `SupplierProduct` table with batch inserts
- **Validation:** Zod schema validation for each product
- **Processing:** Queue-based processing for large uploads
- **Key Files:**
  - `app/supplier/products/page.tsx` - Product management
  - `lib/csv/product-parser.ts` - CSV parsing
  - `lib/validations/product.ts` - Product validation

**CSV Processing:**

```typescript
export async function processBulkUpload(file: File, supplierId: string) {
  const csvData = await parseCSV(file);
  const products = [];
  const errors = [];

  for (const [index, row] of csvData.entries()) {
    const validation = productSchema.safeParse(row);

    if (validation.success) {
      products.push(validation.data);
    } else {
      errors.push({ row: index + 1, errors: validation.error.errors });
    }
  }

  // Batch insert products
  if (products.length > 0) {
    await prisma.supplierProduct.createMany({
      data: products.map(p => ({ ...p, supplierId })),
    });
  }

  return { successful: products.length, failed: errors.length, errors };
}
```

### AI-Enhanced Product Generation

**User-Facing:**

- AI-powered product descriptions
- Image analysis and categorization
- SEO-optimized content
- Multi-language support (Romanian/English)
- Learning outcomes generation
- Automatic tagging

**Technical Details:**

- **API:** `POST /api/supplier/products/ai-enhance`
- **AI Providers:** OpenAI GPT-4, Anthropic Claude (fallback)
- **Database:** `AiJob` table for job tracking
- **Processing:** Background job with Inngest
- **Key Files:**
  - `lib/ai/product-enhancement-service.ts` - AI enhancement
  - `inngest/functions/ai-product-enhancement.ts` - Background job

**AI Enhancement Process:**

```typescript
export async function enhanceProduct(productData: ProductData) {
  // Step 1: Generate enhanced description
  const description = await generateDescription(productData);

  // Step 2: Generate SEO metadata
  const seoData = await generateSEOMetadata(productData);

  // Step 3: Analyze and categorize
  const categorization = await categorizeProduct(productData);

  // Step 4: Generate learning outcomes
  const outcomes = await generateLearningOutcomes(productData);

  return {
    description,
    seoTitle: seoData.title,
    seoDescription: seoData.description,
    category: categorization.category,
    ageGroup: categorization.ageGroup,
    learningOutcomes: outcomes,
  };
}
```

### Sales Analytics & Revenue Tracking

**User-Facing:**

- Revenue dashboard
- Sales by product
- Sales by period
- Commission calculations
- Export reports
- Performance trends

**Technical Details:**

- **Components:** `app/supplier/analytics/page.tsx`,
  `features/supplier/components/SupplierAnalytics.tsx`
- **API:** `GET /api/supplier/analytics`
- **Database:** `SupplierOrder`, `SupplierProduct`, `SupplierPayment` tables
- **Calculations:** Real-time revenue and commission calculations
- **Key Files:**
  - `app/supplier/analytics/page.tsx` - Analytics page
  - `lib/analytics/supplier-metrics.ts` - Metrics calculations

### Invoice Generation & Payment

**User-Facing:**

- Generate invoices for sales period
- View invoice history
- Track payment status
- Download PDF invoices
- Payment notifications

**Technical Details:**

- **Components:** `app/supplier/invoices/page.tsx`,
  `components/supplier/InvoiceList.tsx`
- **API:** `GET /api/supplier/invoices`
- **Database:** `SupplierInvoice`, `SupplierPayment` tables
- **PDF Generation:** React-PDF
- **Key Files:**
  - `app/supplier/invoices/page.tsx` - Invoice list
  - `lib/pdf/supplier-invoice-generator.ts` - PDF generation

### Order Fulfillment

**User-Facing:**

- View pending orders
- Mark orders as shipped
- Add tracking numbers
- Order notifications
- Fulfillment history

**Technical Details:**

- **Components:** `app/supplier/orders/page.tsx`,
  `components/supplier/OrderFulfillment.tsx`
- **API:** `GET /api/supplier/orders`, `PUT /api/supplier/orders/[id]/ship`
- **Database:** `SupplierOrder`, `SupplierOrderItem` tables
- **Email:** Automatic notifications via Resend
- **Key Files:**
  - `app/supplier/orders/page.tsx` - Order management
  - `lib/email/supplier-notifications.ts` - Email templates

---

## Advanced Features

### Email Automation System

**User-Facing:**

- Transactional emails (order confirmation, shipping updates)
- Marketing emails (newsletters, promotions)
- Email templates
- Email sequences
- Unsubscribe management

**Technical Details:**

- **Provider:** Resend
- **Components:** `app/admin/email-automation/page.tsx`
- **API:** `POST /api/email/send`, `POST /api/email/sequence`
- **Database:** `EmailTemplate`, `EmailSequence`, `EmailEvent` tables
- **Templates:** React Email components
- **Queue:** Background job processing with Inngest
- **Key Files:**
  - `lib/email/resend.ts` - Email service
  - `lib/email/templates/` - Email templates
  - `lib/email/queue-system.ts` - Email queue

**Email Sending:**

```typescript
export async function sendOrderConfirmation(order: Order) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: "TechTots <noreply@techtots.ro>",
    to: order.customer.email,
    subject: `Order Confirmation #${order.orderNumber}`,
    react: OrderConfirmationEmail({ order }),
  });

  // Log email event
  await prisma.emailEvent.create({
    data: {
      userId: order.customerId,
      type: "ORDER_CONFIRMATION",
      status: "SENT",
      orderId: order.id,
    },
  });
}
```

### Multi-language Support (i18n)

**User-Facing:**

- Romanian and English languages
- Auto-detect user language
- Language switcher
- Translated content
- RTL support ready

**Technical Details:**

- **Framework:** Custom i18n implementation
- **Components:** `components/language/LanguageSwitcher.tsx`
- **Provider:** `lib/i18n/I18nProvider.tsx`
- **API:** Language-aware content fetching
- **Database:** Multi-language fields in Product, Blog tables
- **Key Files:**
  - `lib/i18n/config.ts` - i18n configuration
  - `lib/i18n/translations/` - Translation files
  - `lib/i18n/useTranslation.ts` - Translation hook

**Translation Usage:**

```typescript
export function ProductCard({ product }) {
  const { t, language } = useTranslation();

  return (
    <div>
      <h3>{product.name[language]}</h3>
      <p>{product.description[language]}</p>
      <button>{t('product.addToCart')}</button>
    </div>
  );
}
```

### SEO System

**User-Facing:**

- Automatic meta tags generation
- Open Graph tags
- Twitter Cards
- Structured data (JSON-LD)
- Sitemap generation
- Robots.txt

**Technical Details:**

- **Components:** `components/seo/SeoJsonLd.tsx`, `MetaTags.tsx`
- **Generation:** Dynamic metadata in `app/*/page.tsx`
- **Database:** `PageMetadata`, `SEOLog` tables
- **Sitemap:** `app/sitemap.ts` - Dynamic sitemap generation
- **Key Files:**
  - `lib/seo/metadata.ts` - Metadata generation
  - `lib/seo/structured-data.ts` - Schema.org markup
  - `app/sitemap.ts` - Sitemap generator

**SEO Metadata:**

```typescript
export async function generateProductMetadata(slug: string): Promise<Metadata> {
  const product = await getProductBySlug(slug);

  return {
    title: `${product.name} | TechTots`,
    description:
      product.seoDescription || product.description.substring(0, 160),
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.images[0]],
      type: "product",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description,
    },
  };
}
```

### Analytics Tracking

**User-Facing:**

- Page view tracking
- Event tracking (purchases, add to cart, etc.)
- Conversion tracking
- User behavior analysis
- A/B testing

**Technical Details:**

- **Providers:** Google Analytics 4, Facebook Pixel
- **Components:** `components/analytics/GoogleAnalytics.tsx`,
  `FacebookPixel.tsx`
- **API:** `POST /api/analytics/event`
- **Database:** `AnalyticsEvent`, `ConversionEvent` tables
- **Key Files:**
  - `components/analytics/GoogleAnalytics.tsx` - GA4 integration
  - `components/analytics/FacebookPixel.tsx` - FB Pixel
  - `lib/analytics/tracking.ts` - Event tracking

### Blog/Content System

**User-Facing:**

- Blog posts with rich content
- Categories and tags
- Author profiles
- Related posts
- Comments (optional)
- Social sharing

**Technical Details:**

- **Components:** `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`
- **API:** `GET /api/blog`, `GET /api/blog/[slug]`
- **Database:** `Blog`, `BlogCategory` tables
- **Editor:** TinyMCE for rich text editing
- **SEO:** Full SEO optimization for blog posts
- **Key Files:**
  - `app/blog/page.tsx` - Blog listing
  - `app/blog/[slug]/page.tsx` - Blog post
  - `app/admin/blog/page.tsx` - Blog management

### Multi-supplier Dropshipping

**User-Facing:**

- Multiple suppliers per product
- Automatic supplier selection
- Commission tracking
- Supplier payouts
- Order routing

**Technical Details:**

- **Database:** `Supplier`, `SupplierProduct`, `SupplierOrder` tables
- **Logic:** Automatic supplier matching based on availability
- **Commission:** Configurable commission rates per supplier
- **Order Flow:** Automatic order splitting for multiple suppliers
- **Key Files:**
  - `lib/dropshipping/supplier-selection.ts` - Supplier matching
  - `lib/dropshipping/order-routing.ts` - Order routing
  - `lib/dropshipping/commission.ts` - Commission calculations

**Supplier Selection:**

```typescript
export async function selectSupplier(productId: string) {
  // Find all suppliers with this product
  const suppliers = await prisma.supplierProduct.findMany({
    where: {
      productId,
      stockQuantity: { gt: 0 },
      supplier: { isApproved: true },
    },
    include: { supplier: true },
    orderBy: { price: "asc" }, // Select lowest price
  });

  return suppliers[0]?.supplier;
}
```

---

## Technical Implementation

### Component Architecture

**Pattern: Feature-First Organization**

```
features/
├── products/
│   ├── components/    # UI components
│   ├── hooks/         # Business logic
│   ├── lib/           # Utilities
│   └── types/         # TypeScript types
```

**Pattern: Server + Client Components**

```typescript
// Server Component (default)
export default async function ProductsPage() {
  const products = await getProducts(); // Server-side data fetching
  return <ProductGrid products={products} />;
}

// Client Component
"use client";
export function ProductFilters({ onChange }) {
  const [filters, setFilters] = useState();
  // Interactive logic...
}
```

### State Management

**Global State:** React Context for cart, user session **Server State:** Fetched
on server, passed as props **Form State:** React Hook Form for complex forms
**URL State:** Search params for filters and pagination

### Database Queries

**Pattern: Prisma ORM with type safety**

```typescript
export async function getProducts(filters: ProductFilters) {
  return await prisma.product.findMany({
    where: {
      isActive: true,
      price: {
        gte: filters.minPrice,
        lte: filters.maxPrice,
      },
      category: filters.category
        ? {
            slug: filters.category,
          }
        : undefined,
    },
    include: {
      category: true,
      reviews: {
        select: { rating: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
```

### API Routes

**Pattern: Next.js Route Handlers**

```typescript
// app/api/products/route.ts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const products = await getProducts(Object.fromEntries(searchParams));

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
```

### Background Jobs

**Pattern: Inngest for async processing**

```typescript
// inngest/functions/ai-enhancement.ts
export const aiProductEnhancement = inngest.createFunction(
  { name: "AI Product Enhancement" },
  { event: "product/enhance" },
  async ({ event, step }) => {
    const product = await step.run("fetch-product", async () => {
      return getProduct(event.data.productId);
    });

    const enhanced = await step.run("enhance-with-ai", async () => {
      return enhanceProduct(product);
    });

    await step.run("update-product", async () => {
      return updateProduct(product.id, enhanced);
    });
  }
);
```

### Caching Strategy

**Levels:**

1. **CDN Cache:** Static assets (1 year)
2. **Edge Cache:** API responses (5-60 minutes)
3. **Redis Cache:** Database queries (1-30 minutes)
4. **Browser Cache:** Client-side state

**Implementation:**

```typescript
export async function getCachedProducts(category: string) {
  const cacheKey = `products:${category}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Fetch from database
  const products = await prisma.product.findMany({
    where: { categoryId: category },
  });

  // Cache for 10 minutes
  await redis.set(cacheKey, JSON.stringify(products), "EX", 600);

  return products;
}
```

---

## Summary

The TechTots platform provides:

- **Complete E-commerce:** Product catalog, cart, checkout, payments
- **Multi-tenant:** Support for suppliers and dropshipping
- **Advanced Admin:** Analytics, order management, cost tracking
- **AI-Powered:** Product enhancement, content generation
- **SEO Optimized:** Metadata, structured data, sitemaps
- **Multi-language:** Romanian and English support
- **Analytics:** Google Analytics, Facebook Pixel, custom tracking
- **Email Automation:** Transactional and marketing emails
- **Performance:** Optimized for Core Web Vitals

All features are built with TypeScript for type safety, use modern React
patterns, and follow best practices for performance, accessibility, and SEO.
