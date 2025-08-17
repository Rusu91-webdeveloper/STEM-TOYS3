# Development Setup Guide

## Overview

This guide will help you set up the STEM Toys e-commerce platform development
environment on your local machine. The platform is built with Next.js 15,
TypeScript, Prisma, and includes comprehensive testing, analytics, and content
management features.

## Prerequisites

Before starting, ensure you have the following installed:

### Required Software

- **Node.js**: v18.17.0 or higher (LTS recommended)
- **npm**: v9.0.0 or higher (comes with Node.js)
- **Git**: Latest version
- **PostgreSQL**: v14.0 or higher (for local database)
- **Redis**: v6.0 or higher (for caching, optional but recommended)

### Development Tools (Recommended)

- **VS Code**: With recommended extensions (see `.vscode/extensions.json`)
- **Docker**: For containerized development (optional)
- **Postman**: For API testing
- **TablePlus/pgAdmin**: For database management

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/STEM-TOYS2.git
cd STEM-TOYS2
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the environment template and configure your settings:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/stemtoys_dev"

# Authentication
NEXTAUTH_SECRET="your-development-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Stripe (use test keys)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Email (optional for development)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# File Upload
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="your-app-id"

# AI Services (optional)
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."
PERPLEXITY_API_KEY="pplx-..."

# Analytics (optional)
SENTRY_DSN="https://..."

# Redis (optional)
REDIS_URL="redis://localhost:6379"
```

### 4. Database Setup

Initialize and seed the database:

```bash
# Generate Prisma client
npx prisma generate

# Apply database migrations
npx prisma db push

# Seed the database with sample data
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at:

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api

## Project Structure

```
STEM-TOYS2/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints
│   ├── admin/             # Admin dashboard pages
│   ├── auth/              # Authentication pages
│   ├── products/          # Product pages
│   ├── blog/              # Blog pages
│   └── ...
├── components/            # Reusable React components
│   ├── ui/               # Base UI components
│   ├── admin/            # Admin-specific components
│   ├── auth/             # Authentication components
│   └── ...
├── features/             # Feature-based organization
│   ├── cart/             # Shopping cart functionality
│   ├── checkout/         # Checkout process
│   ├── products/         # Product management
│   └── ...
├── lib/                  # Utility libraries and configurations
│   ├── auth/             # Authentication utilities
│   ├── db/               # Database configuration
│   ├── services/         # Business logic services
│   ├── utils/            # Helper functions
│   └── ...
├── prisma/               # Database schema and migrations
├── public/               # Static assets
├── docs/                 # Project documentation
├── e2e/                  # End-to-end tests
├── __tests__/            # Unit and integration tests
└── ...
```

## Development Workflow

### 1. Feature Development

1. **Create a feature branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes following our conventions**:
   - Use TypeScript for all new code
   - Follow the established file structure
   - Add tests for new functionality
   - Update documentation as needed

3. **Run tests before committing**:

   ```bash
   npm run test           # Unit tests
   npm run test:e2e       # End-to-end tests
   npm run lint           # Linting
   npm run type-check     # TypeScript checks
   ```

4. **Commit with conventional commits**:
   ```bash
   git commit -m "feat(products): add product variant selector"
   ```

### 2. Database Changes

When modifying the database schema:

1. **Update Prisma schema**:

   ```bash
   # Edit prisma/schema.prisma
   ```

2. **Generate migration**:

   ```bash
   npx prisma migrate dev --name your-migration-name
   ```

3. **Update seed data if needed**:
   ```bash
   # Edit prisma/seed.ts
   npm run db:seed
   ```

### 3. Testing Strategy

#### Unit Tests

```bash
npm run test              # Run all unit tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Generate coverage report
```

#### Integration Tests

```bash
npm run test:integration  # Test API endpoints
```

#### End-to-End Tests

```bash
npm run test:e2e          # Run E2E tests
npm run test:e2e:ui       # Run E2E tests with UI
```

#### Specific Test Patterns

```bash
npm run test -- products  # Test files matching "products"
npm run test -- --watch   # Run specific tests in watch mode
```

## Environment Configurations

### Development (.env.local)

- Use test API keys
- Local database
- Debug logging enabled
- Hot reload enabled

### Testing (.env.test)

- In-memory or test database
- Mock external services
- Minimal logging

### Production (.env.production)

- Production API keys
- Production database
- Error reporting enabled
- Optimized builds

## Available Scripts

### Development

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run type-check       # TypeScript type checking
```

### Database

```bash
npm run db:migrate       # Apply pending migrations
npm run db:seed          # Seed database with sample data
npm run db:reset         # Reset database and reseed
npm run db:studio        # Open Prisma Studio
```

### Testing

```bash
npm run test             # Run unit tests
npm run test:e2e         # Run E2E tests
npm run test:coverage    # Generate coverage report
```

### Code Quality

```bash
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier
npm run check-all        # Run all checks (lint, type-check, test)
```

### Deployment

```bash
npm run build            # Build for production
npm run deploy:staging   # Deploy to staging
npm run deploy:prod      # Deploy to production
```

## IDE Setup

### VS Code Configuration

Recommended extensions (defined in `.vscode/extensions.json`):

- TypeScript and JavaScript Language Features
- Prisma
- Tailwind CSS IntelliSense
- ESLint
- Prettier
- Auto Rename Tag
- GitLens
- Thunder Client (API testing)

### Settings (`.vscode/settings.json`):

```json
{
  "typescript.preferences.quoteStyle": "double",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

## Common Development Tasks

### Adding a New API Endpoint

1. **Create the route file**:

   ```bash
   # app/api/your-endpoint/route.ts
   ```

2. **Implement the handler**:

   ```typescript
   import { NextRequest, NextResponse } from "next/server";
   import { auth } from "@/lib/auth";

   export async function GET(request: NextRequest) {
     const session = await auth();
     // Implementation
   }
   ```

3. **Add tests**:
   ```bash
   # __tests__/api/your-endpoint.test.ts
   ```

### Adding a New Component

1. **Create the component**:

   ```bash
   # components/ui/your-component.tsx
   ```

2. **Export from index**:

   ```typescript
   // components/ui/index.ts
   export { YourComponent } from "./your-component";
   ```

3. **Add Storybook story**:
   ```bash
   # stories/YourComponent.stories.ts
   ```

### Database Schema Changes

1. **Update schema**:

   ```prisma
   // prisma/schema.prisma
   model NewModel {
     id        String   @id @default(cuid())
     createdAt DateTime @default(now())
   }
   ```

2. **Generate migration**:

   ```bash
   npx prisma migrate dev --name add-new-model
   ```

3. **Update TypeScript types**:
   ```bash
   npx prisma generate
   ```

## Debugging

### Frontend Debugging

- Use React DevTools browser extension
- Check browser console for client-side errors
- Use VS Code debugger with launch configuration

### Backend Debugging

- Check server logs in terminal
- Use Prisma Studio for database inspection
- Enable debug logging in `.env.local`:
  ```env
  LOG_LEVEL=debug
  DEBUG=prisma:*
  ```

### Database Debugging

```bash
npx prisma studio          # GUI for database inspection
npx prisma db seed --preview-feature  # Test seed scripts
```

## Performance Optimization

### Development Performance

- Use `npm run dev --turbo` for faster builds
- Configure VS Code for better TypeScript performance
- Use selective imports to reduce bundle size

### Database Performance

- Use database indexes for frequently queried fields
- Monitor query performance with Prisma logs
- Use database connection pooling

## Security Considerations

### Development Security

- Never commit secrets to version control
- Use environment variables for sensitive data
- Regularly update dependencies
- Enable security linting rules

### API Security

- Always validate input data
- Use authentication middleware
- Implement rate limiting
- Sanitize database queries

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
lsof -ti:3000 | xargs kill -9  # Kill process on port 3000
npm run dev -- --port 3001    # Use different port
```

#### Database Connection Issues

```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Reset database connection
npx prisma migrate reset
```

#### Node Modules Issues

```bash
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Errors

```bash
npm run type-check          # Check all TypeScript errors
npx tsc --noEmit           # Alternative TypeScript check
```

### Getting Help

1. **Check documentation**: Review relevant docs in `/docs` folder
2. **Check existing issues**: Look for similar problems in GitHub issues
3. **Team communication**: Use your team's preferred communication channel
4. **Create detailed bug reports**: Include error messages, steps to reproduce

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Testing Library Documentation](https://testing-library.com/docs)

## Contributing

Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our
code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.
