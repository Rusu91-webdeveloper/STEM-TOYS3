# Technical Stack Documentation

This document provides detailed information about all libraries, frameworks, and
tools used in the TechTots STEM educational toys e-commerce platform.

## 🏗️ Core Framework

### Next.js 15

- **Purpose**: React framework with App Router for server-side rendering and API
  routes
- **Version**: 15.3.5
- **Usage**: Main application framework, routing, API endpoints, and server-side
  rendering
- **Benefits**:
  - Improved performance with App Router
  - Built-in API routes for backend functionality
  - Automatic code splitting and optimization
  - SEO-friendly server-side rendering

### React 19

- **Purpose**: UI library for building user interfaces
- **Version**: 19.1.0
- **Usage**: Component-based UI development with hooks and modern React patterns
- **Benefits**:
  - Latest React features and performance improvements
  - Concurrent rendering capabilities
  - Enhanced developer experience

### TypeScript

- **Purpose**: Type-safe JavaScript development
- **Version**: 5.8.3
- **Usage**: Type checking, better IDE support, and runtime error prevention
- **Benefits**:
  - Compile-time error detection
  - Better code documentation through types
  - Enhanced IDE support and autocomplete

## 🎨 UI & Styling

### Tailwind CSS

- **Purpose**: Utility-first CSS framework
- **Version**: 3.4.0
- **Usage**: Rapid UI development with utility classes
- **Benefits**:
  - Rapid prototyping and development
  - Consistent design system
  - Small bundle size with purging
  - Responsive design utilities

### Shadcn/UI

- **Purpose**: High-quality, accessible component library
- **Usage**: Pre-built components for common UI patterns
- **Components Used**:
  - Button, Input, Card, Dialog, Dropdown, etc.
  - Form components with validation
  - Layout components (Header, Footer, Sidebar)
- **Benefits**:
  - Accessible by default
  - Customizable and themeable
  - Built on Radix UI primitives

### Radix UI

- **Purpose**: Low-level UI primitives for building accessible components
- **Version**: Various (2.x series)
- **Components Used**:
  - Dialog, Dropdown, Select, Tabs, Toast, etc.
- **Benefits**:
  - Fully accessible components
  - Unstyled and customizable
  - Keyboard navigation support

### Lucide React

- **Purpose**: Beautiful icon library
- **Version**: 0.510.0
- **Usage**: Consistent iconography throughout the application
- **Benefits**:
  - Consistent design language
  - Tree-shakeable icons
  - SVG-based for crisp rendering

## 🗄️ Database & ORM

### Prisma

- **Purpose**: Type-safe database ORM and query builder
- **Version**: 6.11.1
- **Usage**: Database schema management, migrations, and type-safe queries
- **Features**:
  - Type-safe database access
  - Automatic migration generation
  - Prisma Studio for database management
  - Connection pooling and optimization
- **Benefits**:
  - Compile-time type safety
  - Automatic query optimization
  - Database-agnostic queries

### PostgreSQL

- **Purpose**: Primary relational database
- **Provider**: Neon (serverless PostgreSQL)
- **Usage**: Data storage for users, products, orders, and application state
- **Benefits**:
  - ACID compliance
  - JSON support for flexible schemas
  - Excellent performance and scalability
  - Full-text search capabilities

### Redis

- **Purpose**: Caching and session storage
- **Provider**: Upstash
- **Usage**: Session management, API response caching, and temporary data
  storage
- **Benefits**:
  - Fast in-memory storage
  - Automatic scaling
  - Session persistence
  - Cache invalidation strategies

## 🔐 Authentication & Security

### NextAuth.js

- **Purpose**: Authentication and session management
- **Version**: 5.0.0-beta.28
- **Usage**: User authentication, session handling, and OAuth integration
- **Providers**: Google OAuth
- **Benefits**:
  - Secure session management
  - OAuth provider integration
  - CSRF protection
  - JWT token handling

### bcrypt

- **Purpose**: Password hashing and verification
- **Version**: 6.0.0
- **Usage**: Secure password storage and verification
- **Benefits**:
  - Industry-standard password hashing
  - Salt generation and management
  - Protection against rainbow table attacks

### Zod

- **Purpose**: Runtime type validation and schema validation
- **Version**: 3.25.20
- **Usage**: API request validation, form validation, and type checking
- **Benefits**:
  - Runtime type safety
  - Automatic error messages
  - Type inference for TypeScript
  - Schema composition and reuse

## 💳 Payment Processing

### Stripe

- **Purpose**: Payment processing and subscription management
- **Version**: 18.1.0 (server), 7.3.0 (client)
- **Usage**: Credit card processing, payment intents, and webhook handling
- **Features**:
  - Secure payment processing
  - PCI compliance
  - Webhook integration
  - Subscription management
- **Benefits**:
  - Industry-leading security
  - Global payment methods
  - Real-time payment status
  - Comprehensive reporting

### @stripe/react-stripe-js

- **Purpose**: React components for Stripe integration
- **Version**: 3.7.0
- **Usage**: Payment form components and Stripe Elements
- **Benefits**:
  - Pre-built React components
  - Automatic validation
  - PCI compliance
  - Mobile-optimized forms

## 📧 Email & Communication

### Resend

- **Purpose**: Email delivery service
- **Version**: 4.5.1
- **Usage**: Transactional emails, order confirmations, and notifications
- **Features**:
  - High deliverability rates
  - Template management
  - Analytics and tracking
  - Webhook support
- **Benefits**:
  - Developer-friendly API
  - Reliable delivery
  - Email analytics
  - Template system

### Nodemailer

- **Purpose**: Email sending library (backup/alternative)
- **Version**: 6.10.1
- **Usage**: SMTP email sending for custom email configurations
- **Benefits**:
  - Flexible SMTP configuration
  - Multiple transport options
  - Attachment support
  - Template engine integration

## 📁 File Management

### Uploadthing

- **Purpose**: File upload and storage service
- **Version**: 7.7.3
- **Usage**: Product image uploads, document storage, and file management
- **Features**:
  - Direct client uploads
  - Image optimization
  - CDN delivery
  - Access control
- **Benefits**:
  - Easy integration
  - Automatic optimization
  - Global CDN
  - Security features

### Sharp

- **Purpose**: Image processing and optimization
- **Version**: 0.34.3
- **Usage**: Server-side image resizing, format conversion, and optimization
- **Benefits**:
  - High-performance image processing
  - Multiple format support
  - Automatic optimization
  - Memory efficient

## 📝 Content Management

### TinyMCE

- **Purpose**: Rich text editor for content creation
- **Version**: 6.3.0
- **Usage**: Product descriptions, blog posts, and admin content editing
- **Features**:
  - WYSIWYG editing
  - Plugin ecosystem
  - Custom toolbar configuration
  - Image and media support
- **Benefits**:
  - Professional editing experience
  - Extensible functionality
  - Mobile-friendly interface
  - Accessibility features

### React Markdown

- **Purpose**: Markdown rendering in React
- **Version**: 10.1.0
- **Usage**: Blog posts, product descriptions, and documentation rendering
- **Benefits**:
  - Safe HTML rendering
  - Customizable components
  - Syntax highlighting
  - Plugin support

## 🌐 Internationalization

### Custom i18n System

- **Purpose**: Multi-language support
- **Usage**: Romanian and English language support
- **Features**:
  - Language switching
  - RTL support
  - Localized content
  - Dynamic language loading
- **Benefits**:
  - Seamless language switching
  - SEO-friendly URLs
  - Performance optimized
  - Easy content management

## 📊 State Management

### Zustand

- **Purpose**: Lightweight state management
- **Version**: 5.0.4
- **Usage**: Global application state, cart management, and user preferences
- **Benefits**:
  - Simple API
  - TypeScript support
  - Small bundle size
  - No boilerplate

### React Hook Form

- **Purpose**: Form state management and validation
- **Version**: 7.56.4
- **Usage**: Form handling, validation, and user input management
- **Benefits**:
  - Uncontrolled components
  - Built-in validation
  - Performance optimized
  - Easy integration with UI libraries

## 🧪 Testing

### Jest

- **Purpose**: JavaScript testing framework
- **Version**: 29.7.0
- **Usage**: Unit tests, integration tests, and test utilities
- **Benefits**:
  - Zero configuration
  - Snapshot testing
  - Code coverage
  - Mocking capabilities

### React Testing Library

- **Purpose**: React component testing utilities
- **Version**: 16.0.1
- **Usage**: Component testing with user-centric approach
- **Benefits**:
  - User-focused testing
  - Accessibility testing
  - Simple API
  - Best practices enforcement

### Playwright

- **Purpose**: End-to-end testing framework
- **Version**: 1.49.1
- **Usage**: Full application testing, user journey testing
- **Benefits**:
  - Cross-browser testing
  - Fast execution
  - Reliable selectors
  - Visual testing

## 📈 Monitoring & Analytics

### Sentry

- **Purpose**: Error tracking and performance monitoring
- **Version**: 8.47.0
- **Usage**: Error reporting, performance monitoring, and user feedback
- **Benefits**:
  - Real-time error tracking
  - Performance insights
  - User context
  - Release tracking

### Vercel Speed Insights

- **Purpose**: Performance monitoring and analytics
- **Version**: 1.2.0
- **Usage**: Core Web Vitals tracking and performance optimization
- **Benefits**:
  - Real user monitoring
  - Core Web Vitals tracking
  - Performance insights
  - Optimization recommendations

## 🛠️ Development Tools

### ESLint

- **Purpose**: Code linting and style enforcement
- **Version**: 9.30.1
- **Usage**: Code quality, style consistency, and error prevention
- **Benefits**:
  - Customizable rules
  - TypeScript support
  - Auto-fixing capabilities
  - IDE integration

### Prettier

- **Purpose**: Code formatting
- **Version**: 3.4.2
- **Usage**: Consistent code formatting across the project
- **Benefits**:
  - Opinionated formatting
  - Multiple language support
  - IDE integration
  - Configurable options

### Lint-staged

- **Purpose**: Run linters on staged files
- **Version**: 15.2.10
- **Usage**: Pre-commit hooks for code quality
- **Benefits**:
  - Faster CI/CD
  - Consistent code quality
  - Pre-commit validation
  - Selective linting

## 📦 Build & Deployment

### Vercel

- **Purpose**: Deployment platform and hosting
- **Usage**: Production deployment, preview deployments, and edge functions
- **Benefits**:
  - Zero-config deployment
  - Global CDN
  - Automatic scaling
  - Preview deployments

### Docker

- **Purpose**: Containerization
- **Usage**: Development environment and deployment containerization
- **Benefits**:
  - Consistent environments
  - Easy deployment
  - Scalability
  - Isolation

## 🔧 Utility Libraries

### date-fns

- **Purpose**: Date manipulation and formatting
- **Version**: 4.1.0
- **Usage**: Date formatting, calculations, and timezone handling
- **Benefits**:
  - Modular design
  - Tree-shakeable
  - Immutable
  - TypeScript support

### clsx

- **Purpose**: Conditional className utility
- **Version**: 2.1.1
- **Usage**: Dynamic CSS class generation
- **Benefits**:
  - Simple API
  - TypeScript support
  - Small bundle size
  - Performance optimized

### tailwind-merge

- **Purpose**: Tailwind CSS class merging
- **Version**: 3.3.0
- **Usage**: Intelligent class merging for Tailwind CSS
- **Benefits**:
  - Conflict resolution
  - Performance optimized
  - TypeScript support
  - Custom configuration

### class-variance-authority

- **Purpose**: Component variant management
- **Version**: 0.7.1
- **Usage**: Type-safe component variants and styling
- **Benefits**:
  - Type-safe variants
  - Consistent API
  - Performance optimized
  - Developer experience

## 📊 Data Visualization

### Recharts

- **Purpose**: Chart and data visualization library
- **Version**: 2.15.3
- **Usage**: Admin dashboard charts, analytics, and data visualization
- **Benefits**:
  - React-native
  - Responsive design
  - Customizable
  - Accessibility support

## 🔄 Data Fetching

### Axios

- **Purpose**: HTTP client for API requests
- **Version**: 1.9.0
- **Usage**: API communication, request/response handling
- **Benefits**:
  - Promise-based
  - Request/response interceptors
  - Error handling
  - TypeScript support

### TanStack Query (React Query)

- **Purpose**: Server state management and caching
- **Version**: 5.76.1
- **Usage**: API data fetching, caching, and synchronization
- **Benefits**:
  - Automatic caching
  - Background updates
  - Optimistic updates
  - Error handling

## 📄 Document Generation

### PDF-lib

- **Purpose**: PDF document creation and manipulation
- **Version**: 1.17.1
- **Usage**: Invoice generation, reports, and document creation
- **Benefits**:
  - Client-side PDF generation
  - Form filling
  - Text and image insertion
  - TypeScript support

### PDFKit

- **Purpose**: PDF generation library
- **Version**: 0.17.1
- **Usage**: Server-side PDF generation and document creation
- **Benefits**:
  - Low-level PDF control
  - Custom layouts
  - Font embedding
  - Vector graphics

## 🎯 Performance Optimization

### Sharp

- **Purpose**: Image processing and optimization
- **Version**: 0.34.3
- **Usage**: Image resizing, format conversion, and optimization
- **Benefits**:
  - High performance
  - Multiple formats
  - Memory efficient
  - Batch processing

### Embla Carousel

- **Purpose**: Lightweight carousel library
- **Version**: 8.6.0
- **Usage**: Product image galleries and content carousels
- **Benefits**:
  - Lightweight
  - Touch support
  - Accessibility
  - Customizable

## 🔍 Search & Filtering

### Custom Search Implementation

- **Purpose**: Product search and filtering
- **Usage**: Full-text search, category filtering, and advanced search
- **Features**:
  - Real-time search
  - Category filtering
  - Price range filtering
  - Sort options
- **Benefits**:
  - Fast search results
  - User-friendly interface
  - SEO-friendly URLs
  - Mobile optimized

## 📱 Mobile & PWA

### Service Worker

- **Purpose**: Progressive Web App functionality
- **Usage**: Offline support, caching, and push notifications
- **Benefits**:
  - Offline functionality
  - Fast loading
  - Push notifications
  - App-like experience

### Responsive Design

- **Purpose**: Mobile-first responsive design
- **Usage**: Consistent experience across all devices
- **Benefits**:
  - Mobile optimized
  - Touch-friendly
  - Fast loading
  - Accessibility

## 🔒 Security Libraries

### DOMPurify

- **Purpose**: HTML sanitization
- **Version**: 3.2.6
- **Usage**: Sanitizing user-generated content and preventing XSS
- **Benefits**:
  - XSS prevention
  - Configurable
  - Fast processing
  - Browser compatibility

### Isomorphic DOMPurify

- **Purpose**: Server-side HTML sanitization
- **Version**: 2.25.0
- **Usage**: Server-side content sanitization
- **Benefits**:
  - Server-side safety
  - Consistent behavior
  - Performance optimized
  - TypeScript support

## 📊 Logging & Monitoring

### Winston

- **Purpose**: Logging library
- **Version**: 3.17.0
- **Usage**: Application logging and error tracking
- **Benefits**:
  - Multiple transports
  - Log levels
  - Formatting options
  - Performance optimized

### Pino

- **Purpose**: Fast JSON logger
- **Version**: 9.6.0
- **Usage**: High-performance logging
- **Benefits**:
  - Fast performance
  - JSON output
  - Child loggers
  - TypeScript support

## 🌐 WebSocket & Real-time

### WebSocket (ws)

- **Purpose**: WebSocket communication
- **Version**: 8.18.3
- **Usage**: Real-time features and live updates
- **Benefits**:
  - Real-time communication
  - Low latency
  - Bidirectional
  - Event-driven

## 📋 Form Handling

### React Hook Form Resolvers

- **Purpose**: Form validation resolvers
- **Version**: 5.0.1
- **Usage**: Integration with validation libraries
- **Benefits**:
  - Multiple validation libraries
  - Type-safe validation
  - Performance optimized
  - Easy integration

## 🎨 Animation & Interactions

### Sonner

- **Purpose**: Toast notification library
- **Version**: 2.0.5
- **Usage**: User feedback and notifications
- **Benefits**:
  - Beautiful animations
  - Customizable
  - Accessible
  - TypeScript support

## 📊 Data Processing

### XLSX

- **Purpose**: Excel file processing
- **Version**: 0.18.5
- **Usage**: Bulk product upload, data export, and spreadsheet processing
- **Benefits**:
  - Excel file support
  - CSV processing
  - Data validation
  - TypeScript support

## 🔧 Development Utilities

### ts-node

- **Purpose**: TypeScript execution
- **Version**: 10.9.2
- **Usage**: Running TypeScript files directly
- **Benefits**:
  - Direct TypeScript execution
  - Development scripts
  - Configuration support
  - Performance optimized

### dotenv

- **Purpose**: Environment variable loading
- **Version**: 16.5.0
- **Usage**: Loading environment variables from .env files
- **Benefits**:
  - Simple configuration
  - Development support
  - Security
  - Easy deployment

## 📱 Mobile Development

### Cookies Next

- **Purpose**: Cookie management for Next.js
- **Version**: 6.1.0
- **Usage**: Client and server-side cookie handling
- **Benefits**:
  - SSR support
  - Type-safe
  - Easy API
  - Security features

## 🎯 Performance Monitoring

### OpenTelemetry

- **Purpose**: Observability and monitoring
- **Version**: Various
- **Usage**: Application performance monitoring and tracing
- **Benefits**:
  - Distributed tracing
  - Performance metrics
  - Error tracking
  - Standardized observability

## 🔄 Caching & Performance

### Upstash Redis

- **Purpose**: Redis client for serverless environments
- **Version**: 1.35.0
- **Usage**: Caching, session storage, and rate limiting
- **Benefits**:
  - Serverless compatible
  - HTTP-based
  - TypeScript support
  - Global edge caching

### IORedis

- **Purpose**: Redis client for Node.js
- **Version**: 5.6.1
- **Usage**: Redis connection management and operations
- **Benefits**:
  - High performance
  - Cluster support
  - Pipeline support
  - TypeScript support

## 📊 Analytics & Tracking

### Custom Analytics

- **Purpose**: User behavior tracking and analytics
- **Usage**: Conversion tracking, user journey analysis, and performance metrics
- **Features**:
  - Privacy-compliant tracking
  - Custom events
  - Performance metrics
  - User journey analysis
- **Benefits**:
  - GDPR compliant
  - Real-time insights
  - Custom dashboards
  - Performance optimization

---

This technical stack provides a robust, scalable, and maintainable foundation
for the TechTots e-commerce platform, ensuring excellent performance, security,
and user experience across all devices and use cases.
