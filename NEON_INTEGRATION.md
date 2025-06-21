# Integrating Neon PostgreSQL with Next.js

This guide explains how to integrate [Neon](https://neon.tech) serverless PostgreSQL with your Next.js project.

## What is Neon?

Neon is a fully managed serverless PostgreSQL with a generous free tier. It offers:

- Serverless architecture (scale to zero)
- Branching for development and testing
- SQL editor and data browser
- Automatic backups
- Seamless integration with Vercel

## Setup Steps

### 1. Install the Neon serverless driver

```bash
npm install @neondatabase/serverless
```

### 2. Create a Neon database

1. Sign up at [https://neon.tech](https://neon.tech)
2. Create a new project
3. Once your project is created, you'll get a connection string that looks like this:
   ```
   postgres://user:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### 3. Configure environment variables

Add your Neon database URL to your `.env` file:

```
DATABASE_URL="postgres://user:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

For Vercel deployment, add the same environment variable in your Vercel project settings.

### 4. Create database utility functions

Create a file at `lib/neon.ts` with these utility functions:

```typescript
import { neon, neonConfig } from "@neondatabase/serverless";

// Configure neon to use fetch API from the global scope
neonConfig.fetchConnectionCache = true;

// Get the SQL executor
const sql = process.env.DATABASE_URL
  ? neon(process.env.DATABASE_URL)
  : () => {
      throw new Error("DATABASE_URL environment variable is not set");
    };

/**
 * Execute a SQL query with parameters
 * @example
 * // Simple query
 * const users = await query`SELECT * FROM users WHERE active = ${true}`;
 *
 * // With multiple parameters
 * const user = await query`SELECT * FROM users WHERE id = ${userId} AND email = ${email}`;
 */
export async function query<T = any>(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<T[]> {
  return sql(strings, ...values) as Promise<T[]>;
}

/**
 * Execute a SQL query and return the first result or null
 */
export async function queryFirst<T = any>(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<T | null> {
  const results = (await sql(strings, ...values)) as T[];
  return results.length > 0 ? results[0] : null;
}

/**
 * Execute a SQL query that doesn't return results (INSERT, UPDATE, DELETE)
 */
export async function execute(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<void> {
  await sql(strings, ...values);
}

// For direct access to the neon SQL function
export { sql };
```

### 5. Create database tables

In the Neon SQL editor or by running migrations, create your database tables. Here's an example for a comments table:

```sql
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS comments_created_at_idx ON comments(created_at);
```

### 6. Use in Server Components

```tsx
import { query } from "@/lib/neon";

export default async function CommentsPage() {
  // Fetch comments from the database
  const comments = await query`
    SELECT * FROM comments
    ORDER BY created_at DESC
  `;

  return (
    <div>
      <h1>Comments</h1>
      <ul>
        {comments.map((comment) => (
          <li key={comment.id}>{comment.comment}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 7. Use in Server Actions

```tsx
"use server";

import { execute } from "@/lib/neon";
import { revalidatePath } from "next/cache";

export async function addComment(formData: FormData) {
  const comment = formData.get("comment") as string;

  if (!comment || comment.trim() === "") {
    return { error: "Comment cannot be empty" };
  }

  await execute`
    INSERT INTO comments (comment)
    VALUES (${comment})
  `;

  revalidatePath("/comments");
  return { success: true };
}
```

### 8. Use in API Routes (Route Handlers)

```tsx
import { NextResponse } from "next/server";
import { query, execute } from "@/lib/neon";

export async function GET() {
  const comments = await query`
    SELECT * FROM comments
    ORDER BY created_at DESC
  `;

  return NextResponse.json(comments);
}

export async function POST(req: Request) {
  const { comment } = await req.json();

  await execute`
    INSERT INTO comments (comment)
    VALUES (${comment})
  `;

  return NextResponse.json({ message: "Comment added" });
}
```

## Using with Prisma

If you prefer using Prisma ORM with Neon:

1. Install Prisma: `npm install prisma @prisma/client`
2. Initialize Prisma: `npx prisma init`
3. Configure your schema.prisma file:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Your models here
```

4. Run `npx prisma generate` to generate the Prisma client
5. For Vercel deployment, update your build command in `package.json`:

```json
"build": "prisma generate && next build"
```

## Vercel Integration

Neon has a direct integration with Vercel:

1. In your Vercel dashboard, go to Storage
2. Select "Connect Database"
3. Choose Neon
4. Follow the prompts to connect your existing Neon database or create a new one
5. Vercel will automatically add the DATABASE_URL environment variable

## Best Practices

1. **Connection Pooling**: For production workloads, enable connection pooling in Neon dashboard settings
2. **Parameterized Queries**: Always use parameterized queries (`sql\`SELECT \* FROM users WHERE id = ${id}\``) to prevent SQL injection
3. **Error Handling**: Implement proper error handling around database operations
4. **Database Migrations**: For complex schemas, use a migration tool like Prisma Migrate or custom SQL migration scripts
5. **Environment Variables**: Keep your database URL secure in environment variables
6. **Database Indexes**: Add indexes to columns used in WHERE clauses and JOINs for better performance

## Example Use Cases

- User authentication and profiles
- Content management (blogs, products)
- Comments and reviews
- Analytics and statistics
- E-commerce data (products, orders, payments)

## Troubleshooting

- **Connection Issues**: Verify your DATABASE_URL is correct and the IP is allowed
- **SSL Errors**: Ensure `?sslmode=require` is included in your connection string
- **Timeout Errors**: Check for long-running queries or connection limits
- **Prisma Issues**: Run `npx prisma generate` before building your application
