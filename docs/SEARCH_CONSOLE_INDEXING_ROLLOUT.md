# Search Console Indexing Rollout

This rollout is designed for a revenue-focused ecommerce SEO program, not a
"submit everything and hope" workflow. The goal is to get the most important
commercial pages crawled, indexed, and reinforced first.

## Submission Order

Submit pages in this order inside Google Search Console and Bing Webmaster
Tools:

1. Homepage: `https://www.techtots.ro/`
2. Core commercial hubs:
   - `https://www.techtots.ro/jucarii-stem`
   - `https://www.techtots.ro/jucarii-educative`
   - `https://www.techtots.ro/jucarii-inteligente`
   - `https://www.techtots.ro/robotica-pentru-copii`
3. Selection / supporting pages:
   - `https://www.techtots.ro/jucarii-stem-dupa-varsta`
   - `https://www.techtots.ro/ghid-educatie-stem-romania`
   - `https://www.techtots.ro/beneficiile-jucariilor-stem`
4. City-intent pages:
   - `https://www.techtots.ro/jucarii-stem/bucuresti`
   - `https://www.techtots.ro/jucarii-stem/cluj-napoca`
   - `https://www.techtots.ro/jucarii-stem/timisoara`
   - `https://www.techtots.ro/jucarii-stem/iasi`
   - `https://www.techtots.ro/jucarii-stem/constanta`
5. Main categories with real products
6. Best-selling product pages
7. Blog posts and supporting guides

Do not start by mass-submitting low-value URLs, account URLs, filtered URLs, or
thin archive pages.

## Crawl Checks

Before requesting indexing, verify:

- The URL returns `200`
- Canonical points to itself
- `robots` allows indexing
- The page is linked from the homepage, sitemap, or another indexed page
- The page has a unique title and description
- The page contains visible content, not just schema and CTA blocks

## Weekly Operating Rhythm

Run this every week:

1. Check Coverage / Pages in Search Console for new exclusions
2. Check the submitted sitemap for fetch errors
3. Inspect core hub URLs manually after significant content changes
4. Review the Queries report for:
   - `jucarii stem`
   - `jucarii stem romania`
   - `jucarii educative`
   - `jucarii inteligente`
   - `robotica pentru copii`
   - city modifiers like `bucuresti`, `cluj`, `timisoara`, `iasi`, `constanta`
5. Expand internal links from pages already earning impressions

## Priority KPIs

Track these metrics first:

- Indexed pages among the commercial hubs
- Impressions for Romanian money terms
- Average position for the four core hubs
- CTR on homepage, hubs, and best-selling product pages
- Number of queries that include city + niche combinations

## If a Page Does Not Index

Use this sequence:

1. Confirm the page is not `noindex`
2. Confirm the canonical is correct
3. Add at least 2-3 new internal links from stronger pages
4. Refresh the copy so the page is not too similar to another landing page
5. Resubmit the URL in Search Console
6. Wait for recrawl before changing the slug or duplicating the page elsewhere

## AI Search Readiness Checks

To improve citation and retrieval odds in AI search systems:

- Keep FAQ answers short, direct, and factual
- Keep product/category/guide relationships obvious in the page content
- Avoid fake local claims or unsupported trust signals
- Use real entity data consistently across metadata and visible page copy
- Make sure city pages clearly state national delivery rather than fake offices
