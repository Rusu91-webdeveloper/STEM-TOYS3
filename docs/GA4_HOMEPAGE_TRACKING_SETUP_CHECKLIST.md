# GA4 Homepage Tracking Setup Checklist

Use this checklist to make the new homepage conversion instrumentation fully visible in GA4 reports and dashboards.

## 1. Confirm base setup
- Ensure `NEXT_PUBLIC_GA4_MEASUREMENT_ID` is set in your environment.
- Open GA4 Realtime and verify baseline traffic is visible from your site.

## 2. Register homepage events as Key Events (Conversions)
In GA4:
1. Go to **Admin**.
2. Open **Data display** -> **Events**.
3. Find and mark these as **Key events**:
   - `homepage_hero_primary_cta_click`
   - `homepage_hero_secondary_cta_click`
   - `homepage_five_second_primary_cta_click`
   - `homepage_bundle_list_cta_click`
   - `homepage_bundle_card_click`

Recommended:
- Keep `homepage_hero_impression` and `homepage_trust_badge_click` as non-conversion events (diagnostic/funnel quality).

## 3. Create Event-Scoped Custom Dimensions
In GA4:
1. Go to **Admin**.
2. Open **Data display** -> **Custom definitions**.
3. Click **Create custom dimensions** for each parameter below.
4. Scope: **Event**.

### Global homepage dimensions
| Dimension name (GA4 UI) | Event parameter |
|---|---|
| Homepage Page Type | `page_type` |
| Homepage Funnel Stage | `funnel_stage` |

### Hero-specific dimensions
| Dimension name (GA4 UI) | Event parameter |
|---|---|
| Hero Headline Variant | `headline_variant` |
| Hero CTA Variant | `cta_variant` |
| Hero CTA Label | `cta_label` |
| Hero Age Label | `age_label` |
| Hero Age Group Query | `age_group_query` |

### 5-second strip dimensions
| Dimension name (GA4 UI) | Event parameter |
|---|---|
| 5s Step Title | `step_title` |
| 5s Step CTA | `step_cta` |
| 5s Target Href | `target_href` |

### Bundle dimensions
| Dimension name (GA4 UI) | Event parameter |
|---|---|
| Bundle ID | `bundle_id` |
| Bundle Slug | `bundle_slug` |
| Bundle Name | `bundle_name` |
| Bundle Price | `bundle_price` |
| Bundle Discount | `bundle_discount` |

### Trust dimension
| Dimension name (GA4 UI) | Event parameter |
|---|---|
| Trust Badge Label | `badge_label` |

## 4. Wait for data availability
- Realtime: usually immediate.
- Standard reports/custom explorations: can take up to 24h.

## 5. Quick validation flow (10 minutes)
1. Open homepage in incognito.
2. Click:
   - Hero primary CTA
   - One age chip
   - One 5-second card
   - One bundle card
   - Trust badge
3. Check Realtime events in GA4.
4. Confirm event parameters are populated for those events.

## 6. Dashboard starter widgets
- Hero CTR by variant:  
  `homepage_hero_primary_cta_click / homepage_hero_impression`, breakdown by `headline_variant`, `cta_variant`
- Bundle intent:  
  `homepage_bundle_card_click + homepage_bundle_list_cta_click` trend daily
- 5-second winner:  
  `homepage_five_second_step_click` by `step_title`
- Trust interaction rate:  
  `homepage_trust_badge_click / homepage_hero_impression`

## 7. Source references
- Event constants: `lib/analytics/homepage-conversion-events.ts`
- Event map: `docs/HOMEPAGE_CONVERSION_EVENT_MAP.md`
- Looker dashboard blueprint: `docs/LOOKER_STUDIO_HOMEPAGE_DASHBOARD_BLUEPRINT.md`
- Click-by-click runbook: `docs/LOOKER_STUDIO_CLICK_BY_CLICK_RUNBOOK.md`
