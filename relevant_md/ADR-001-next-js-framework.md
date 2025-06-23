# ADR-001: Adopt Next.js as Primary Framework

## Status

Accepted

## Context

We need to choose a React framework for building the STEM Toys e-commerce
platform. The application requires:

- Server-side rendering (SSR) for SEO optimization
- Static site generation (SSG) for product pages
- API routes for backend functionality
- Image optimization for product galleries
- Internationalization support for Romanian and English
- High performance and good developer experience
- Strong ecosystem and community support

## Decision

We will use **Next.js 15** as our primary framework for both frontend and
backend development.

## Consequences

### Positive

- **SEO Benefits**: Built-in SSR and SSG improve search engine visibility for
  product pages
- **Performance**: Automatic code splitting, image optimization, and caching
  strategies
- **Developer Experience**: Hot reloading, TypeScript support, and excellent
  debugging tools
- **Full-Stack Solution**: API routes eliminate the need for a separate backend
  framework
- **Deployment**: Seamless integration with Vercel for optimal performance
- **Image Optimization**: Next.js Image component with automatic WebP conversion
  and responsive sizes
- **Internationalization**: Built-in i18n support for multiple languages
- **App Router**: Modern routing with layouts, loading states, and error
  boundaries

### Negative

- **Vendor Lock-in**: Some features work best with Vercel hosting
- **Learning Curve**: App Router is newer and requires learning new patterns
- **Build Complexity**: Larger bundle sizes compared to simple React apps
- **Opinionated**: Less flexibility in build configuration compared to custom
  setups

### Neutral

- **Framework Updates**: Need to stay current with Next.js releases
- **Bundle Analysis**: Requires monitoring to prevent bloated bundles

## Alternatives Considered

### 1. Create React App (CRA)

- **Pros**: Simple setup, familiar patterns
- **Cons**: No SSR, limited optimization, deprecated in favor of newer solutions

### 2. Vite + React

- **Pros**: Very fast development server, modern build tools
- **Cons**: Requires additional setup for SSR, no built-in API routes

### 3. Remix

- **Pros**: Excellent data loading patterns, web standards focused
- **Cons**: Smaller ecosystem, less mature compared to Next.js

### 4. Gatsby

- **Pros**: Excellent for static sites, GraphQL integration
- **Cons**: Complex for dynamic e-commerce features, slower build times

### 5. SvelteKit

- **Pros**: Smaller bundle sizes, innovative approach
- **Cons**: Smaller ecosystem, less suitable for large teams

## Implementation Details

### Framework Configuration

```javascript
// next.config.js
module.exports = {
  experimental: {
    appDir: true, // Enable App Router
  },
  images: {
    domains: ["cdn.techtots.com"],
    formats: ["image/webp", "image/avif"],
  },
  i18n: {
    locales: ["en", "ro"],
    defaultLocale: "ro",
  },
};
```

### Project Structure

```
app/
├── api/               # API routes
├── [locale]/          # Internationalized routes
├── globals.css        # Global styles
└── layout.tsx         # Root layout
```

### Key Features Used

- **App Router**: For modern routing and layouts
- **Server Components**: For better performance
- **API Routes**: For backend functionality
- **Image Optimization**: For product images
- **Static Generation**: For category and product pages
- **Incremental Static Regeneration**: For dynamic content

## Migration Strategy

1. **Phase 1**: Set up Next.js project with App Router
2. **Phase 2**: Implement core pages (home, products, categories)
3. **Phase 3**: Add API routes for e-commerce functionality
4. **Phase 4**: Implement authentication and user management
5. **Phase 5**: Add advanced features (search, recommendations, admin)

## Monitoring and Success Metrics

- **Performance**: Core Web Vitals scores (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- **SEO**: Search engine ranking improvements
- **Developer Experience**: Build times, hot reload speed
- **Bundle Size**: JavaScript payload optimization

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Vercel Deployment](https://vercel.com/docs/concepts/next.js/overview)

## Date

2024-01-15

## Reviewers

- Development Team
- Technical Lead
- Product Owner
