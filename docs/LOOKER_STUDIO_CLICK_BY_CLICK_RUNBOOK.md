# Looker Studio Click-by-Click Runbook (Homepage Conversion)

Follow this runbook in order. It is designed to get a working homepage conversion dashboard in one pass.

## Phase 0: Prerequisites (2 minutes)
1. Confirm your app is live and sending GA4 events.
2. Confirm `NEXT_PUBLIC_GA4_MEASUREMENT_ID` is set.
3. Open:
   - GA4 property
   - Looker Studio

Reference:
- `docs/GA4_HOMEPAGE_TRACKING_SETUP_CHECKLIST.md`
- `docs/HOMEPAGE_CONVERSION_EVENT_MAP.md`
- `docs/LOOKER_STUDIO_HOMEPAGE_DASHBOARD_BLUEPRINT.md`

## Phase 1: GA4 Admin setup (10-15 minutes)

## 1.1 Mark conversion events (Key events)
1. In GA4, go to **Admin**.
2. Go to **Data display -> Events**.
3. Search and mark as **Key event**:
   - `homepage_hero_primary_cta_click`
   - `homepage_hero_secondary_cta_click`
   - `homepage_five_second_primary_cta_click`
   - `homepage_bundle_list_cta_click`
   - `homepage_bundle_card_click`

## 1.2 Create custom dimensions
1. In GA4, go to **Admin**.
2. Go to **Data display -> Custom definitions**.
3. Click **Create custom dimension** for each row below.
4. Use:
   - Scope: **Event**
   - Description: short text (optional)

Create these:
- `page_type`
- `funnel_stage`
- `headline_variant`
- `cta_variant`
- `cta_label`
- `age_label`
- `age_group_query`
- `step_title`
- `step_cta`
- `target_href`
- `bundle_id`
- `bundle_slug`
- `bundle_name`
- `bundle_price`
- `bundle_discount`
- `badge_label`

## 1.3 Realtime sanity check
1. Open your homepage in incognito.
2. Click:
   - Hero primary CTA
   - Hero secondary CTA
   - One age chip
   - One 5-second card
   - One bundle card
   - One trust badge
3. In GA4 -> **Reports -> Realtime**, confirm those events appear.

## Phase 2: Looker Studio data source (5 minutes)

## 2.1 Create report
1. Open Looker Studio.
2. Click **Create -> Report**.
3. Select connector: **Google Analytics**.
4. Choose your GA4 property + web data stream.
5. Click **Add**.

## 2.2 Add core fields
In the data source panel, ensure you can select:
- Dimensions:
  - Event name
  - Date
  - Device category
  - Session source / medium
  - Country
  - Custom dimensions created above (after GA4 processing delay)
- Metrics:
  - Event count
  - Total users (optional)

If custom dimensions are missing, continue with standard fields and refresh later.

## Phase 3: Build dashboard pages (20-30 minutes)

## 3.1 Page 1: Executive Overview
1. Add **Date range control** (top left).
2. Add **Drop-down controls**:
   - Device category
   - Country
   - Session source / medium
3. Add scorecards with these calculated fields:
   - Hero Impressions
   - Hero Primary Clicks
   - Hero Primary CTR
   - Bundle Intent Clicks
   - Bundle Intent Rate
4. Add time series chart:
   - Dimension: Date
   - Metric: Event count
   - Filter: Event name IN (`homepage_hero_impression`, `homepage_hero_primary_cta_click`, `homepage_bundle_card_click`)
5. Apply chart filter:
   - `page_type = homepage`

## 3.2 Page 2: Hero A/B Performance
1. Duplicate Page 1, rename to **Hero A/B**.
2. Remove overview charts.
3. Add table:
   - Dimensions: `headline_variant`, `cta_variant`
   - Metrics: Hero Impressions, Hero Primary Clicks, Hero Primary CTR
4. Add bar chart:
   - Dimension: `headline_variant`
   - Metric: Hero Secondary Clicks
5. Keep `page_type = homepage` filter.

## 3.3 Page 3: 5-Second Rule Flow
1. Add table:
   - Dimension: `step_title`
   - Metrics: Event count (filtered to `homepage_five_second_step_click`)
2. Add bar chart:
   - Dimension: `target_href`
   - Metric: Event count
   - Filter: Event name IN (`homepage_five_second_step_click`, `homepage_five_second_primary_cta_click`, `homepage_five_second_secondary_cta_click`)
3. Add scorecard:
   - `5s Primary Rate`

## 3.4 Page 4: Bundle Conversion
1. Add table:
   - Dimension: `bundle_slug`
   - Metrics: Event count
   - Filter: Event name = `homepage_bundle_card_click`
2. Add time series:
   - Dimension: Date
   - Metrics: Bundle Card Clicks, Bundle List CTA Clicks
3. Add scorecard:
   - Bundle Intent Rate

## Phase 4: Calculated fields (copy exactly)

Create report-level fields:

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

## Phase 5: Final QA before sharing (5 minutes)
1. Compare last 24h events in GA4 vs Looker scorecards.
2. Verify variant breakdowns show values for:
   - `headline_variant`
   - `cta_variant`
3. Verify bundle table has `bundle_slug`.
4. Verify date filter updates all pages.
5. Verify no KPI breaks when traffic is low (safe divide fields).

## Phase 6: Publish
1. Click **Share** in Looker Studio.
2. Add view access for your team.
3. Pin this dashboard URL in ops docs/SOP.
