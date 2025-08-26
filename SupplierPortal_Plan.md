# Supplier Portal Plan for TechTots STEM Toys E-commerce

## Overview

The Supplier Portal will be a comprehensive B2B platform that allows suppliers
to register, manage their products, track orders, and collaborate with TechTots.
This system will integrate seamlessly with the existing e-commerce
infrastructure while providing suppliers with professional tools to manage their
business relationship.

### Key Integration Points

- **Existing User System**: Extends the current User model with SUPPLIER role
- **Product Management**: Suppliers can upload and manage their products through
  the existing Product model
- **Order System**: Suppliers can view and manage orders containing their
  products
- **Authentication**: Leverages existing NextAuth.js setup with role-based
  access
- **Localization**: Uses existing i18n system (Romanian + English)
- **UI Components**: Built with existing shadcn/ui components and design system

### Data Fetching Approach

This implementation uses your existing pattern of `useState` + `useEffect` +
`fetch` instead of React Query, following the same patterns used in your admin
dashboard and other features. This ensures consistency with your current
codebase and eliminates the need for additional dependencies.

## UI/UX Design Plan

### Design Philosophy

- **Modern & Professional**: Clean, business-focused interface that matches
  TechTots' existing design language
- **Responsive First**: Mobile-optimized with progressive enhancement for
  desktop
- **Accessibility**: WCAG 2.1 AA compliance using existing accessibility
  patterns
- **Performance**: Lazy loading, optimized queries, and caching strategies

### Layout Structure

#### 1. Public Landing Page (`/supplier`)

```
┌─────────────────────────────────────┐
│ Header (existing TechTots header)   │
├─────────────────────────────────────┤
│ Hero Section                        │
│ - Compelling headline               │
│ - Value proposition                 │
│ - CTA: "Become a Supplier"          │
├─────────────────────────────────────┤
│ Benefits Section                    │
│ - 3-column grid of benefits         │
│ - Icons + descriptions              │
├─────────────────────────────────────┤
│ Process Section                     │
│ - Step-by-step registration process │
│ - Timeline visualization            │
├─────────────────────────────────────┤
│ Testimonials                        │
│ - Success stories from suppliers    │
├─────────────────────────────────────┤
│ Contact CTA                         │
│ - Contact form or direct email      │
├─────────────────────────────────────┤
│ Footer (existing TechTots footer)   │
└─────────────────────────────────────┘
```

#### 2. Supplier Dashboard (`/supplier/dashboard`)

```
┌─────────────────────────────────────┐
│ Supplier Header                     │
│ - Logo + Company Name               │
│ - Quick Stats (Orders, Revenue)     │
│ - Notifications Bell                │
├─────────────────────────────────────┤
│ Navigation Sidebar                   │
│ - Dashboard                         │
│ - Products                          │
│ - Orders                            │
│ - Invoices                          │
│ - Analytics                         │
│ - Settings                          │
├─────────────────────────────────────┤
│ Main Content Area                   │
│ - Overview Cards                    │
│ - Recent Activity                   │
│ - Quick Actions                     │
│ - Charts & Analytics                │
└─────────────────────────────────────┘
```

### Component Architecture

- **Reuse Existing Components**: Button, Card, Table, Form, Dialog, etc.
- **Supplier-Specific Components**:
  - `SupplierStatsCard`
  - `ProductUploadForm`
  - `OrderManagementTable`
  - `InvoiceGenerator`
  - `AnalyticsChart`

## Database/Backend Plan

### New Database Models

#### 1. Supplier Model

```prisma
model Supplier {
  id                    String   @id @default(cuid())
  userId                String   @unique
  companyName           String
  companySlug           String   @unique
  description           String?
  website               String?
  phone                 String
  vatNumber             String?
  taxId                 String?
  businessAddress       String
  businessCity          String
  businessState         String
  businessCountry       String   @default("România")
  businessPostalCode    String
  contactPersonName     String
  contactPersonEmail    String
  contactPersonPhone    String

  // Business Information
  yearEstablished       Int?
  employeeCount         Int?
  annualRevenue         String?
  certifications        String[]
  productCategories     String[]

  // Status & Approval
  status                SupplierStatus @default(PENDING)
  approvedAt            DateTime?
  approvedBy            String?
  rejectionReason       String?

  // Financial
  commissionRate        Float    @default(15.0) // Default 15%
  paymentTerms          Int      @default(30)   // Net 30 days
  minimumOrderValue     Float    @default(0)

  // Metadata
  logo                  String?
  catalogUrl            String?
  termsAccepted         Boolean  @default(false)
  privacyAccepted       Boolean  @default(false)

  // Timestamps
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relations
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  approvedByUser        User?    @relation("SupplierApprovedBy", fields: [approvedBy], references: [id])
  products              Product[]
  orders                SupplierOrder[]
  invoices              SupplierInvoice[]

  @@index([status])
  @@index([companySlug])
  @@index([vatNumber])
}
```

#### 2. SupplierOrder Model

```prisma
model SupplierOrder {
  id              String   @id @default(cuid())
  supplierId      String
  orderId         String
  orderItemId     String
  productId       String
  quantity        Int
  unitPrice       Float
  totalPrice      Float
  commission      Float
  supplierRevenue Float
  status          SupplierOrderStatus @default(PENDING)
  shippedAt       DateTime?
  trackingNumber  String?
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  supplier        Supplier   @relation(fields: [supplierId], references: [id], onDelete: Cascade)
  order           Order      @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderItem       OrderItem  @relation(fields: [orderItemId], references: [id], onDelete: Cascade)
  product         Product    @relation(fields: [productId], references: [id])

  @@index([supplierId])
  @@index([orderId])
  @@index([status])
  @@index([createdAt])
}
```

#### 3. SupplierInvoice Model

```prisma
model SupplierInvoice {
  id              String   @id @default(cuid())
  supplierId      String
  invoiceNumber   String   @unique
  periodStart     DateTime
  periodEnd       DateTime
  subtotal        Float
  commission      Float
  totalAmount     Float
  status          InvoiceStatus @default(DRAFT)
  dueDate         DateTime
  paidAt          DateTime?
  paymentMethod   String?
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  supplier        Supplier @relation(fields: [supplierId], references: [id], onDelete: Cascade)
  orders          SupplierOrder[]

  @@index([supplierId])
  @@index([invoiceNumber])
  @@index([status])
  @@index([dueDate])
}
```

#### 4. Updated User Model

```prisma
model User {
  // ... existing fields ...
  role                Role                 @default(CUSTOMER)

  // New relations for suppliers
  supplier            Supplier?
  approvedSuppliers   Supplier[]           @relation("SupplierApprovedBy")
}
```

#### 5. Updated Product Model

```prisma
model Product {
  // ... existing fields ...
  supplierId          String?

  // New relations
  supplier            Supplier?            @relation(fields: [supplierId], references: [id])
  supplierOrders      SupplierOrder[]
}
```

#### 6. Updated OrderItem Model

```prisma
model OrderItem {
  // ... existing fields ...

  // New relations
  supplierOrders      SupplierOrder[]
}
```

### New Enums

```prisma
enum SupplierStatus {
  PENDING
  APPROVED
  REJECTED
  SUSPENDED
  INACTIVE
}

enum SupplierOrderStatus {
  PENDING
  CONFIRMED
  IN_PRODUCTION
  READY_TO_SHIP
  SHIPPED
  DELIVERED
  CANCELLED
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
  CANCELLED
}
```

### API Endpoints Structure

#### 1. Public Supplier Endpoints

```
GET    /api/supplier/landing          # Landing page data
POST   /api/supplier/register         # Supplier registration
POST   /api/supplier/contact          # Contact form submission
```

#### 2. Supplier Authentication

```
POST   /api/supplier/auth/login       # Supplier login
POST   /api/supplier/auth/logout      # Supplier logout
GET    /api/supplier/auth/me          # Get current supplier
PUT    /api/supplier/auth/profile     # Update supplier profile
```

#### 3. Supplier Dashboard

```
GET    /api/supplier/dashboard        # Dashboard overview
GET    /api/supplier/stats            # Statistics and analytics
GET    /api/supplier/notifications    # Supplier notifications
```

#### 4. Product Management

```
GET    /api/supplier/products         # List supplier products
POST   /api/supplier/products         # Create new product
GET    /api/supplier/products/:id     # Get product details
PUT    /api/supplier/products/:id     # Update product
DELETE /api/supplier/products/:id     # Delete product
POST   /api/supplier/products/upload  # Bulk product upload
```

#### 5. Order Management

```
GET    /api/supplier/orders           # List supplier orders
GET    /api/supplier/orders/:id       # Get order details
PUT    /api/supplier/orders/:id       # Update order status
POST   /api/supplier/orders/:id/ship  # Mark order as shipped
```

#### 6. Invoice Management

```
GET    /api/supplier/invoices         # List invoices
GET    /api/supplier/invoices/:id     # Get invoice details
GET    /api/supplier/invoices/:id/pdf # Download invoice PDF
POST   /api/supplier/invoices/:id/mark-paid # Mark invoice as paid
```

#### 7. Admin Supplier Management

```
GET    /api/admin/suppliers           # List all suppliers
GET    /api/admin/suppliers/:id       # Get supplier details
PUT    /api/admin/suppliers/:id       # Update supplier
POST   /api/admin/suppliers/:id/approve    # Approve supplier
POST   /api/admin/suppliers/:id/reject     # Reject supplier
DELETE /api/admin/suppliers/:id       # Delete supplier
```

## Frontend Plan

### Feature Organization

```
features/
├── supplier/
│   ├── components/
│   │   ├── SupplierLanding.tsx
│   │   ├── SupplierRegistration.tsx
│   │   ├── SupplierDashboard.tsx
│   │   ├── ProductManagement/
│   │   │   ├── ProductList.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   ├── ProductUpload.tsx
│   │   │   └── ProductAnalytics.tsx
│   │   ├── OrderManagement/
│   │   │   ├── OrderList.tsx
│   │   │   ├── OrderDetails.tsx
│   │   │   └── OrderStatusUpdate.tsx
│   │   ├── InvoiceManagement/
│   │   │   ├── InvoiceList.tsx
│   │   │   ├── InvoiceDetails.tsx
│   │   │   └── InvoiceGenerator.tsx
│   │   └── Analytics/
│   │       ├── RevenueChart.tsx
│   │       ├── OrderChart.tsx
│   │       └── ProductPerformance.tsx
│   ├── hooks/
│   │   ├── useSupplierAuth.ts
│   │   ├── useSupplierProducts.ts
│   │   ├── useSupplierOrders.ts
│   │   └── useSupplierAnalytics.ts
│   ├── lib/
│   │   ├── supplier-api.ts
│   │   ├── supplier-utils.ts
│   │   └── supplier-validation.ts
│   └── types/
│       └── supplier.ts
```

### Key Components

#### 1. SupplierLanding.tsx

- Hero section with compelling value proposition
- Benefits grid (3 columns)
- Registration process timeline
- Testimonials carousel
- Contact form

#### 2. SupplierRegistration.tsx

- Multi-step form with progress indicator
- Company information
- Contact details
- Business verification
- Terms acceptance
- File upload for documents

#### 3. SupplierDashboard.tsx

- Overview cards (Revenue, Orders, Products)
- Recent activity feed
- Quick action buttons
- Performance charts
- Notifications panel

#### 4. ProductManagement Components

- **ProductList.tsx**: Data table with search, filter, pagination
- **ProductForm.tsx**: Comprehensive product creation/editing form
- **ProductUpload.tsx**: Bulk upload with CSV/Excel support
- **ProductAnalytics.tsx**: Performance metrics and charts

#### 5. OrderManagement Components

- **OrderList.tsx**: Filterable order table with status indicators
- **OrderDetails.tsx**: Detailed order view with customer info
- **OrderStatusUpdate.tsx**: Status update modal with tracking

#### 6. InvoiceManagement Components

- **InvoiceList.tsx**: Invoice table with payment status
- **InvoiceDetails.tsx**: Detailed invoice view with PDF download
- **InvoiceGenerator.tsx**: Invoice generation wizard

### State Management

- **useState + useEffect**: For server state management (following existing
  patterns)
- **Zustand**: For client-side state (forms, UI state)
- **React Hook Form**: For form handling with validation

### Data Fetching Patterns

Following your existing pattern from admin dashboard:

```typescript
// Example: useSupplierProducts hook
export function useSupplierProducts(filters?: ProductFilters) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const queryParams = new URLSearchParams();
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value) queryParams.append(key, value.toString());
          });
        }

        const response = await fetch(`/api/supplier/products?${queryParams}`);
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching supplier products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters]);

  return { products, loading, error };
}
```

### API Route Pattern

Following your existing pattern with rate limiting:

```typescript
// Example: /api/supplier/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";

export const GET = withRateLimit(async (request: NextRequest) => {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get supplier ID from session
    const supplier = await db.supplier.findUnique({
      where: { userId: session.user.id },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";

    // Build where clause
    const where: any = { supplierId: supplier.id };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) {
      where.categoryId = category;
    }

    // Fetch products with pagination
    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
        },
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching supplier products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
```

## Security & Performance

### Authentication & Authorization

- **Role-Based Access Control (RBAC)**: Extend existing Role enum with SUPPLIER
- **Session Management**: Leverage existing NextAuth.js setup
- **Route Protection**: Middleware for supplier-only routes
- **API Security**: Rate limiting, input validation, CSRF protection

### Data Validation

```typescript
// Example: Supplier registration schema
const supplierRegistrationSchema = z.object({
  companyName: z.string().min(2).max(100),
  vatNumber: z.string().regex(/^RO\d{2,10}$/),
  contactEmail: z.string().email(),
  // ... other fields
});
```

### Performance Optimizations

- **Lazy Loading**: Code splitting for supplier features using Next.js dynamic
  imports
- **Image Optimization**: Next.js Image component for logos/documents
- **Caching Strategy**: Leverage existing Redis setup for API responses, browser
  caching
- **Database Optimization**: Indexed queries, connection pooling
- **State Management**: Efficient useState/useEffect patterns with proper
  cleanup

### Security Measures

- **Input Sanitization**: DOMPurify for user-generated content
- **File Upload Security**: Virus scanning, file type validation
- **Encryption**: Sensitive data encryption at rest
- **Audit Logging**: Track all supplier actions

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

- [ ] **Database Migration**: Update schema with new models and enums
- [ ] **Role Extension**: Add SUPPLIER to existing Role enum
- [ ] **Authentication**: Extend existing NextAuth.js for supplier role
- [ ] **Basic API Routes**: Create supplier authentication endpoints
- [ ] **Supplier Registration**: Build registration form with validation
- [ ] **Admin Approval**: Create admin interface for supplier approval
- [ ] **Basic Dashboard**: Create supplier dashboard with stats

### Phase 2: Core Features (Week 3-4)

- [ ] **Product Management**: Create product CRUD operations with file uploads
- [ ] **Order Management**: Build order tracking and status update interface
- [ ] **Invoice System**: Create invoice generation and management
- [ ] **Profile Management**: Build supplier profile editing interface
- [ ] **Email Notifications**: Integrate with existing email system
- [ ] **File Upload**: Implement secure file upload for catalogs and documents

### Phase 3: Advanced Features (Week 5-6)

- [ ] **Analytics Dashboard**: Create charts and reporting using Recharts
- [ ] **Bulk Operations**: Implement CSV/Excel import for products
- [ ] **Advanced Tracking**: Build detailed order and shipment tracking
- [ ] **Invoice Management**: Complete invoice workflow with PDF generation
- [ ] **Payment Integration**: Connect with existing Stripe setup for payments
- [ ] **Search & Filters**: Advanced search and filtering capabilities

### Phase 4: Polish & Launch (Week 7-8)

- [ ] **UI/UX Polish**: Refine components and ensure responsive design
- [ ] **Performance Optimization**: Optimize loading times and bundle size
- [ ] **Security Audit**: Review authentication, authorization, and data
      validation
- [ ] **Testing**: Comprehensive testing with existing Jest/Playwright setup
- [ ] **Documentation**: Create supplier and admin documentation
- [ ] **Localization**: Complete Romanian and English translations

### Phase 5: Post-Launch (Week 9+)

- [ ] **User Feedback**: Collect and analyze supplier feedback
- [ ] **Feature Enhancements**: Implement requested improvements
- [ ] **Performance Monitoring**: Monitor using existing Sentry setup
- [ ] **Support System**: Create help documentation and support channels
- [ ] **Analytics**: Track usage patterns and optimize based on data

## Future Extensions

### AI-Assisted Features

- **Smart Product Categorization**: AI-powered product classification
- **Demand Forecasting**: Predictive analytics for inventory management
- **Automated Pricing**: Dynamic pricing based on market data
- **Chatbot Support**: AI-powered supplier support

### Advanced Analytics

- **Real-time Dashboard**: Live performance metrics
- **Predictive Analytics**: Sales forecasting and trend analysis
- **Competitive Analysis**: Market positioning insights
- **Customer Behavior**: Product performance analytics

### Automation Features

- **Automated Invoice Reconciliation**: AI-powered invoice matching
- **Order Fulfillment Automation**: Automated order processing
- **Inventory Synchronization**: Real-time inventory updates
- **Payment Automation**: Automated payment processing

### Integration Capabilities

- **ERP Integration**: Connect with supplier ERP systems
- **Accounting Software**: QuickBooks, Xero integration
- **Shipping Carriers**: Direct integration with shipping providers
- **Marketplace APIs**: Multi-channel selling capabilities

### Mobile Application

- **React Native App**: Mobile supplier dashboard
- **Push Notifications**: Real-time order and payment alerts
- **Offline Capabilities**: Work without internet connection
- **Barcode Scanning**: Product management via mobile

## Technical Considerations

### Scalability

- **Database Optimization**: Leverage existing PostgreSQL setup with proper
  indexing
- **Caching Strategy**: Use existing Redis implementation for API responses
- **CDN Integration**: Extend existing image optimization for supplier content
- **Load Balancing**: Handle high traffic periods with existing infrastructure

### Monitoring & Analytics

- **Error Tracking**: Use existing Sentry setup for comprehensive error logging
- **Performance Monitoring**: Leverage existing monitoring infrastructure
- **User Analytics**: Track supplier behavior using existing analytics patterns
- **Business Intelligence**: Build on existing admin dashboard patterns

### Compliance & Legal

- **GDPR Compliance**: Follow existing data protection patterns
- **VAT Compliance**: Romanian tax regulations integration
- **Contract Management**: Digital contract signing with existing auth system
- **Audit Trails**: Complete action logging using existing patterns

### Integration Points

- **Existing Auth System**: Extend NextAuth.js with supplier role
- **Email System**: Use existing Brevo/Resend setup for notifications
- **File Upload**: Leverage existing UploadThing setup for documents
- **Payment Processing**: Integrate with existing Stripe implementation
- **Localization**: Use existing i18n system for Romanian/English support

This comprehensive plan provides a solid foundation for building a world-class
supplier portal that integrates seamlessly with the existing TechTots e-commerce
platform while providing suppliers with professional tools to manage their
business relationship effectively.
