# Looker Studio Homepage Dashboard Blueprint

Use this blueprint to build a production-ready dashboard for homepage conversion performance using the GA4 events already implemented.

This is documentation-only setup. No app runtime changes are required.

## 1. Goal
- Measure if homepage messaging converts visitors into buyers faster.
- Compare hero variants, CTA quality, and bundle intent.
- Detect drop-off before checkout.

## 2. Data source strategy

## Option A (fastest): GA4 Connector
- Best for quick setup and day-to-day monitoring.
- Build with GA4 standard fields + custom dimensions from:
  - `docs/GA4_HOMEPAGE_TRACKING_SETUP_CHECKLIST.md`

## Option B (most accurate): BigQuery Export + Looker Studio
- Best for advanced funnel modeling and custom SQL.
- Requires GA4 -> BigQuery export enabled.
- Recommended when you want strict attribution across long ranges.

## 3. Report structure (recommended pages)

## Page 1: Executive Overview
Scorecards:
- Hero Impressions
- Hero Primary CTA Clicks
- Hero Primary CTR
- Bundle Intent Clicks
- Bundle Intent Rate
- Checkout Intent Clicks (`homepage_five_second_step_click` where `target_href=/checkout`)

Charts:
- Daily trend: `homepage_hero_impression`, `homepage_hero_primary_cta_click`, `homepage_bundle_card_click`
- Device split: conversion metrics by device category
- Source/Medium split: conversion metrics by acquisition channel

## Page 2: Hero A/B Performance
Breakdowns:
- `headline_variant`
- `cta_variant`

Charts:
- Table: variant pair -> impressions, clicks, CTR
- Time series: hero CTR by day, split by `headline_variant`
- Bar chart: secondary CTA clicks by variant

## Page 3: 5-Second Rule Flow
Charts:
- Step card performance by `step_title`
- CTR by `step_cta`
- Exit destination by `target_href`

Primary KPI:
- `homepage_five_second_primary_cta_click / homepage_hero_impression`

## Page 4: Bundle Conversion
Charts:
- Bundle card clicks by `bundle_slug`
- Bundle click trend by day
- Top bundle cards by `bundle_discount`
- Bundle list CTA trend

Primary KPI:
- Bundle Intent Rate:
  `(homepage_bundle_card_click + homepage_bundle_list_cta_click) / homepage_hero_impression`

## 4. Required controls (filters)
Add global controls on top of all pages:
- Date range
- Device category
- Country
- Source / Medium
- Event name
- `headline_variant`
- `cta_variant`

## 5. Calculated fields (Looker Studio)
Create these in your GA4 data source or report-level fields.

## Base counters
- `Hero Impressions`
```text
SUM(CASE WHEN Event name = "homepage_hero_impression" THEN Event count ELSE 0 END)
```

- `Hero Primary Clicks`
```text
SUM(CASE WHEN Event name = "homepage_hero_primary_cta_click" THEN Event count ELSE 0 END)
```

- `Hero Secondary Clicks`
```text
SUM(CASE WHEN Event name = "homepage_hero_secondary_cta_click" THEN Event count ELSE 0 END)
```

- `Bundle Card Clicks`
```text
SUM(CASE WHEN Event name = "homepage_bundle_card_click" THEN Event count ELSE 0 END)
```

- `Bundle List CTA Clicks`
```text
SUM(CASE WHEN Event name = "homepage_bundle_list_cta_click" THEN Event count ELSE 0 END)
```

- `Five Second Primary Clicks`
```text
SUM(CASE WHEN Event name = "homepage_five_second_primary_cta_click" THEN Event count ELSE 0 END)
```

## Derived KPIs
- `Hero Primary CTR`
```text
SAFE_DIVIDE(Hero Primary Clicks, Hero Impressions)
```

- `Hero Secondary CTR`
```text
SAFE_DIVIDE(Hero Secondary Clicks, Hero Impressions)
```

- `Bundle Intent Clicks`
```text
Bundle Card Clicks + Bundle List CTA Clicks
```

- `Bundle Intent Rate`
```text
SAFE_DIVIDE(Bundle Intent Clicks, Hero Impressions)
```

- `5s Primary Rate`
```text
SAFE_DIVIDE(Five Second Primary Clicks, Hero Impressions)
```

## 6. Widget-level filters (important)
- On homepage scorecards/charts, apply:
  - `page_type = "homepage"`
- For funnel charts, optionally enforce:
  - `funnel_stage = "consideration"`

## 7. QA checklist before sharing dashboard
1. Realtime GA4 shows recent homepage events.
2. Last 24h counts in Looker match GA4 events report (allow minor delay).
3. `headline_variant` and `cta_variant` appear in breakdowns.
4. `bundle_slug` appears for bundle card clicks.
5. KPI formulas never divide by zero (use `SAFE_DIVIDE`).
6. Date control updates all pages consistently.

## 8. Common mistakes to avoid
- Forgetting to create custom dimensions in GA4 first.
- Mixing `Event count` with `Total users` in the same CTR formula.
- Not filtering to `page_type = homepage`, causing noisy data.
- Treating diagnostic events as conversions.

## 9. Source references
- Event map: `docs/HOMEPAGE_CONVERSION_EVENT_MAP.md`
- GA4 setup checklist: `docs/GA4_HOMEPAGE_TRACKING_SETUP_CHECKLIST.md`
- Click-by-click runbook: `docs/LOOKER_STUDIO_CLICK_BY_CLICK_RUNBOOK.md`
- Event constants: `lib/analytics/homepage-conversion-events.ts`
