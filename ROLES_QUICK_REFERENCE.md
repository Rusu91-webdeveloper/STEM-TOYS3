# Roles Quick Reference Guide

## 🎭 Available User Roles

### CUSTOMER (Default)

- **Access**: Public website, shopping, user account
- **Can**: Browse products, place orders, manage profile
- **Cannot**: Access admin or supplier dashboards

### ADMIN

- **Access**: Full admin dashboard, all features
- **Can**: Manage everything (products, orders, users, suppliers, settings)
- **Cannot**: Nothing - full access

### SUPPLIER

- **Access**: Supplier dashboard
- **Can**: Manage own products, orders, invoices, analytics
- **Cannot**: Access admin features, manage other suppliers

### VISITOR (Demo Mode) ⭐ NEW

- **Access**: Admin dashboard + Supplier dashboard (Read Only)
- **Can**: View everything, see all integrations and features
- **Cannot**: Create, edit, or delete anything
- **Purpose**: Showcase platform to potential buyers

## 🔐 Test Credentials

After running the seed script, these accounts will be available:

```
VISITOR (Demo Mode)
  Email: visitor@demo.com
  Password: Visitor123!

SUPPLIER
  Email: supplier@demo.com
  Password: Supplier123!
```

## 🚀 Setup Commands

### 1. Apply Database Changes

```bash
npx prisma migrate dev --name add-supplier-visitor-roles
```

### 2. Create Test Accounts

```bash
npx tsx prisma/seed-roles.ts
```

### 3. Generate Prisma Client (if needed)

```bash
npx prisma generate
```

## 📋 Role Comparison Matrix

| Feature            | CUSTOMER | ADMIN    | SUPPLIER | VISITOR   |
| ------------------ | -------- | -------- | -------- | --------- |
| Browse Products    | ✅       | ✅       | ✅       | ✅        |
| Place Orders       | ✅       | ✅       | ❌       | ❌        |
| Admin Dashboard    | ❌       | ✅       | ❌       | ✅ (Read) |
| Manage Products    | ❌       | ✅       | ✅ (Own) | ❌        |
| Manage Orders      | ❌       | ✅       | ✅ (Own) | ❌        |
| Manage Users       | ❌       | ✅       | ❌       | ❌        |
| Supplier Dashboard | ❌       | ✅       | ✅       | ✅ (Read) |
| Manage Suppliers   | ❌       | ✅       | ❌       | ❌        |
| Analytics          | ❌       | ✅       | ✅ (Own) | ✅ (View) |
| Settings           | ✅ (Own) | ✅ (All) | ✅ (Own) | ❌        |

## 🎯 Use Cases

### VISITOR Role Use Cases

1. **Sales Demonstrations**: Show potential clients all platform features
2. **Investor Presentations**: Demonstrate integrations and capabilities
3. **Feature Showcases**: Let prospects explore without risk
4. **Testing**: QA team can verify UI without modifying data

### SUPPLIER Role Use Cases

1. **Third-party sellers**: Manage their product catalog
2. **Dropshippers**: Handle orders and inventory
3. **Wholesalers**: Track sales and commissions
4. **Partners**: Collaborate on product offerings

## 🛡️ Security Features

### VISITOR Protection

- ✅ API-level write operation blocking
- ✅ Friendly "Demo Mode" error messages
- ✅ Visual banners indicating read-only access
- ✅ No database modifications possible
- ✅ Session-based role checking

### Implementation Pattern

All protected endpoints check:

```typescript
if (session?.user?.role === "VISITOR") {
  return NextResponse.json(
    {
      error: "Demo Mode - Read Only Access",
      message:
        "This is a demonstration account. Write operations are disabled.",
      isDemo: true,
    },
    { status: 403 }
  );
}
```

## 📱 User Experience

### VISITOR Experience

- **Dashboard Access**: Full visibility of admin and supplier features
- **Visual Indicators**: Blue banners on every page
- **Friendly Messages**: Clear explanation of demo mode
- **No Errors**: Graceful handling of write attempts
- **Complete View**: See all integrations and data

### SUPPLIER Experience

- **Dedicated Dashboard**: Purpose-built supplier portal
- **Product Management**: Full CRUD on own products
- **Order Tracking**: Monitor and fulfill orders
- **Analytics**: View sales performance
- **Settings**: Manage business profile

## 🔧 Developer Notes

### Adding Role Checks

```typescript
// In Server Components
const session = await auth();
const isVisitor = session?.user?.role === "VISITOR";

// In Client Components
const { data: session } = useSession();
const isVisitor = session?.user?.role === "VISITOR";
```

### Disabling UI Elements

```typescript
const { data: session } = useSession();
const isReadOnly = session?.user?.role === "VISITOR";

<Button disabled={isReadOnly}>
  {isReadOnly ? "Demo Mode" : "Save"}
</Button>
```

### API Route Protection

```typescript
// Add after authentication check
if (session?.user?.role === "VISITOR") {
  return demoModeResponse();
}
```

## 📞 Support

For issues or questions about roles implementation:

1. Check `IMPLEMENTATION_SUMMARY.md` for detailed status
2. Review `add-supplier-and-visitor-roles.plan.md` for the plan
3. Check API route implementations for examples
4. Review middleware files for helper functions

## ✨ Key Benefits

1. **Safe Demo Mode**: Showcase without risk
2. **Flexible Access**: Different levels for different users
3. **Security First**: API-level protection
4. **Great UX**: Clear indicators and messages
5. **Easy Testing**: Pre-configured test accounts
6. **Scalable**: Easy to add more protected routes
