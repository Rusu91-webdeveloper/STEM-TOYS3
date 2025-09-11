# 🚀 Google Search Console Setup Guide for TechTots (2025)

## 📋 Complete Setup Checklist

### ✅ Pre-Setup Requirements

- [ ] Domain: `techtots.com` is live and accessible
- [ ] SSL certificate installed and working
- [ ] Website loads properly on both desktop and mobile
- [ ] All sitemaps are accessible
- [ ] robots.txt is configured correctly

### 🔧 Technical Setup

#### 1. Domain Configuration

```bash
# Update environment variables
NEXT_PUBLIC_SITE_URL=https://techtots.com
NEXT_PUBLIC_BASE_URL=https://techtots.com
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### 2. DNS Records Required

```
# A Records
techtots.com.          A       YOUR_SERVER_IP
www.techtots.com.      A       YOUR_SERVER_IP

# CNAME Records
www.techtots.com.      CNAME   techtots.com.

# TXT Records (for verification)
techtots.com.          TXT     "google-site-verification=VERIFICATION_CODE"
```

#### 3. Verification Methods

- **HTML File**: Place verification file in `/public/` directory
- **Meta Tag**: Add to `app/metadata.ts`
- **DNS TXT**: Add TXT record to domain DNS

### 🎯 Google Search Console Setup Steps

#### Step 1: Create Property

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click "Add Property"
3. Select "Domain" property type
4. Enter: `techtots.com`
5. Click "Continue"

#### Step 2: Verify Ownership

Choose one verification method:

**Option A: HTML File (Recommended)**

1. Download the verification file from GSC
2. Place it in `/public/` directory
3. Ensure it's accessible at `https://techtots.com/google[random-string].html`
4. Click "Verify" in GSC

**Option B: Meta Tag**

1. Copy the meta tag from GSC
2. Add to `app/metadata.ts`:

```typescript
verification: {
  google: "YOUR_VERIFICATION_CODE",
},
```

3. Deploy and click "Verify" in GSC

**Option C: DNS TXT Record**

1. Add TXT record to your DNS:

```
Name: @ (or techtots.com)
Type: TXT
Value: google-site-verification=YOUR_VERIFICATION_CODE
```

2. Wait for DNS propagation (up to 24 hours)
3. Click "Verify" in GSC

#### Step 3: Submit Sitemaps

In GSC, go to "Sitemaps" section and submit:

- `sitemap.xml`
- `sitemap-index.xml`
- `sitemap-products.xml`
- `sitemap-blog.xml`
- `sitemap-categories.xml`

#### Step 4: Configure Settings

1. **Crawling Settings**:
   - Set crawl rate to "Let Google decide"
   - Enable "Fetch as Google" for testing
   - Configure URL parameters if needed

2. **Users and Permissions**:
   - Add team members with appropriate access levels
   - Set up email notifications

3. **Alerts**:
   - Enable email alerts for coverage issues
   - Set up alerts for manual actions
   - Configure security issue alerts

### 📊 Google Analytics 4 Integration

#### Step 1: Create GA4 Property

1. Go to [Google Analytics](https://analytics.google.com)
2. Create a new GA4 property
3. Get your Measurement ID (G-XXXXXXXXXX)

#### Step 2: Configure GA4

1. Update environment variable:

```bash
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

2. GA4 is already integrated in the codebase:
   - `components/analytics/GoogleAnalytics.tsx`
   - `lib/analytics/ga4.ts`
   - `lib/analytics/web-vitals.ts`

#### Step 3: Link GA4 to GSC

1. In GA4, go to "Admin" → "Product Links"
2. Click "Search Console Links"
3. Link your GSC property

### ⚡ Core Web Vitals Monitoring

#### Automatic Monitoring

Core Web Vitals are automatically tracked:

- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)
- **CLS** (Cumulative Layout Shift)
- **FCP** (First Contentful Paint)
- **TTFB** (Time to First Byte)

#### Performance Thresholds (2025)

- **LCP**: Good ≤ 2.5s, Poor > 4.0s
- **FID**: Good ≤ 100ms, Poor > 300ms
- **CLS**: Good ≤ 0.1, Poor > 0.25
- **FCP**: Good ≤ 1.8s, Poor > 3.0s
- **TTFB**: Good ≤ 800ms, Poor > 1.8s

### 🔍 Search Performance Monitoring

#### Tracked Metrics

- Search queries and results
- Zero-result queries
- Popular search terms
- Language distribution (Romanian/English)
- Category performance
- User engagement metrics

#### Alert System

- High zero-result rate (>30%)
- Low average results (<5)
- Slow page load times (>3s)
- High error rates (>5%)
- Poor Core Web Vitals scores

### 🎯 TechTots-Specific Optimizations

#### Romanian Keywords to Monitor

- "jucării STEM"
- "jucării educative"
- "jucării știință"
- "jucării tehnologie"
- "jocuri educative"
- "materiale educative"

#### English Keywords to Monitor

- "STEM toys Romania"
- "educational toys"
- "science toys"
- "technology toys"
- "engineering toys"
- "mathematics toys"

#### Product Categories

- Science toys
- Technology toys
- Engineering toys
- Mathematics toys
- Educational games
- Learning materials

### 🧪 Testing & Validation

#### Run Tests

```bash
# Test DNS configuration
node scripts/verify-dns.js

# Test GSC setup
node scripts/verify-gsc.js

# Run comprehensive tests
node scripts/test-gsc-setup.js

# View setup guide
node scripts/gsc-setup-guide.js
```

#### Manual Verification

1. **Site Accessibility**: Test all URLs manually
2. **Sitemap Validation**: Use GSC's sitemap tester
3. **Mobile-Friendly Test**: Use Google's Mobile-Friendly Test
4. **PageSpeed Insights**: Test Core Web Vitals
5. **Rich Results Test**: Validate structured data

### 📈 Monitoring Schedule

#### Daily

- Check for errors and issues in GSC
- Monitor Core Web Vitals
- Review search performance

#### Weekly

- Analyze search query performance
- Review zero-result queries
- Check mobile performance

#### Monthly

- Comprehensive SEO audit
- Review and optimize sitemaps
- Analyze competitor performance
- Update keyword strategy

### 🚨 Troubleshooting

#### Common Issues

1. **Verification Failed**: Check file accessibility or DNS propagation
2. **Sitemap Errors**: Validate XML syntax and URLs
3. **Crawling Issues**: Check robots.txt and server response codes
4. **Performance Issues**: Optimize images and code

#### Support Resources

- [Google Search Console Help](https://support.google.com/webmasters)
- [GSC Community](https://support.google.com/webmasters/community)
- [Core Web Vitals Guide](https://web.dev/vitals/)
- [PageSpeed Insights](https://pagespeed.web.dev/)

### 🎉 Success Metrics

After setup, you should have:

- ✅ Complete search performance insights
- ✅ Automatic error monitoring
- ✅ Core Web Vitals tracking
- ✅ Keyword performance data
- ✅ Indexing status monitoring
- ✅ Security issue alerts
- ✅ Mobile performance tracking
- ✅ E-commerce conversion tracking

### 📞 Support

For technical issues:

- Check the test scripts output
- Review GSC error messages
- Consult Google's documentation
- Contact your development team

---

**Last Updated**: January 2025 **Version**: 1.0 **Status**: Ready for Production
