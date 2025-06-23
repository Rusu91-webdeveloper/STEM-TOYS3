# ADR-002: Use Prisma as Database ORM

## Status

Accepted

## Context

We need a robust ORM solution for the STEM Toys e-commerce platform that can
handle:

- Complex e-commerce data relationships (products, orders, users, categories)
- Type-safe database queries
- Database migrations and schema management
- Support for PostgreSQL
- Good developer experience with IDE integration
- Performance optimization capabilities
- Integration with TypeScript and Next.js

## Decision

We will use **Prisma** as our Object-Relational Mapping (ORM) tool for database
operations.

## Consequences

### Positive

- **Type Safety**: Auto-generated TypeScript types from database schema
- **Developer Experience**: Excellent IDE support with autocomplete and
  IntelliSense
- **Schema Management**: Declarative schema definition with automatic migrations
- **Query Performance**: Optimized queries and built-in query optimization
- **Database Introspection**: Can generate schema from existing database
- **Prisma Studio**: Visual database browser for development
- **Multi-Database Support**: Easy to switch between databases if needed
- **Modern Tooling**: Built for modern TypeScript/JavaScript development

### Negative

- **Learning Curve**: Requires learning Prisma's specific syntax and patterns
- **Abstraction Layer**: Adds complexity compared to raw SQL
- **Bundle Size**: Adds to the overall application bundle
- **Query Limitations**: Some complex queries may require raw SQL

### Neutral

- **Migration Strategy**: Need to manage database schema changes carefully
- **Performance Monitoring**: Requires monitoring query performance
- **Version Updates**: Need to stay current with Prisma updates

## Alternatives Considered

### 1. TypeORM

- **Pros**: Mature, decorator-based, similar to Spring/Hibernate
- **Cons**: Less type-safe, more verbose, complex configuration

### 2. Sequelize

- **Pros**: Very mature, large ecosystem
- **Cons**: JavaScript-first, less TypeScript integration, complex for complex
  queries

### 3. Drizzle ORM

- **Pros**: Lightweight, SQL-like syntax, good TypeScript support
- **Cons**: Newer, smaller ecosystem, less mature tooling

### 4. Raw SQL with typed query builders (e.g., Kysely)

- **Pros**: Full SQL control, maximum performance
- **Cons**: More boilerplate, manual type definitions, no schema management

### 5. Mongoose (if using MongoDB)

- **Pros**: Great for document databases
- **Cons**: NoSQL doesn't fit e-commerce relational data well

## Implementation Details

### Schema Definition

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Product {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String
  price       Decimal
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  orderItems  OrderItem[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("products")
}

model Category {
  id       String    @id @default(cuid())
  name     String
  slug     String    @unique
  products Product[]

  @@map("categories")
}
```

### Database Client Usage

```typescript
// lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

### Example Queries

```typescript
// Get products with categories
const products = await db.product.findMany({
  include: {
    category: true,
  },
  where: {
    isActive: true,
  },
  orderBy: {
    createdAt: "desc",
  },
});

// Create order with items
const order = await db.order.create({
  data: {
    userId: user.id,
    total: orderTotal,
    items: {
      create: orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
    },
  },
  include: {
    items: {
      include: {
        product: true,
      },
    },
  },
});
```

### Migration Workflow

```bash
# Create migration
npx prisma migrate dev --name add-user-preferences

# Apply migrations to production
npx prisma migrate deploy

# Generate client after schema changes
npx prisma generate

# Reset database (development only)
npx prisma migrate reset
```

## Database Design Principles

### Normalization Strategy

- **Products**: Normalized with separate categories, variants, and images
- **Orders**: Proper order/order-item relationship with price snapshots
- **Users**: Separate profile information with foreign key relationships

### Performance Considerations

- **Indexes**: Strategic indexing on frequently queried fields
- **Pagination**: Use cursor-based pagination for large datasets
- **N+1 Prevention**: Use `include` and `select` strategically

### Data Integrity

- **Foreign Keys**: Proper relationships with cascading rules
- **Constraints**: Database-level constraints for data validation
- **Transactions**: Use Prisma transactions for complex operations

## File Organization

```
prisma/
├── schema.prisma         # Main schema definition
├── migrations/           # Migration files
│   ├── 20240115_init/
│   └── 20240116_add_user_preferences/
├── seed.ts              # Database seeding script
└── index.ts             # Prisma client configuration
```

## Development Workflow

1. **Schema Changes**: Update `schema.prisma`
2. **Generate Migration**: `npx prisma migrate dev`
3. **Update Client**: `npx prisma generate` (usually automatic)
4. **Update Code**: Use new types and queries
5. **Test Changes**: Run tests to ensure compatibility

## Production Considerations

### Connection Pooling

```typescript
// lib/db.ts - Production configuration
export const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});
```

### Performance Monitoring

- Use Prisma's built-in query logging
- Monitor slow queries and optimize indexes
- Use connection pooling for high-traffic scenarios

### Security

- Environment variable management for database URLs
- Prepared statements (automatic with Prisma)
- Input validation before database operations

## Success Metrics

- **Query Performance**: Monitor query execution times
- **Developer Productivity**: Measure development speed for database-related
  features
- **Type Safety**: Reduction in runtime database errors
- **Migration Success**: Smooth database schema evolution

## References

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [PostgreSQL with Prisma](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Prisma in Production](https://www.prisma.io/docs/guides/deployment)

## Date

2024-01-16

## Reviewers

- Development Team
- Database Administrator
- Technical Lead
