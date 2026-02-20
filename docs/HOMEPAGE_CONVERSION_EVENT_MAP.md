# Homepage Conversion Event Map

This map defines the GA4 events emitted by homepage conversion blocks.

## A/B tests tracked
- `homepage_hero_headline`
- `homepage_hero_cta`

## Event list

| Event name | Trigger | Component | Key parameters | Goal |
|---|---|---|---|---|
| `homepage_hero_impression` | Hero rendered | `features/home/components/HeroSection.tsx` | `headline_variant`, `cta_variant`, `section` | Measure hero exposure by variant |
| `homepage_hero_primary_cta_click` | Click on hero primary CTA | `features/home/components/HeroSection.tsx` | `cta_label`, `headline_variant`, `cta_variant` | Primary click-through to bundle catalog |
| `homepage_hero_secondary_cta_click` | Click on hero secondary CTA | `features/home/components/HeroSection.tsx` | `cta_label`, `headline_variant`, `cta_variant` | Secondary click-through to products |
| `homepage_hero_age_chip_click` | Click on age quick chip | `features/home/components/HeroSection.tsx` | `age_label`, `age_group_query`, `headline_variant` | Validate age-based entry preference |
| `homepage_five_second_step_click` | Click on one of 3 five-second cards | `features/home/components/FiveSecondConversionStrip.tsx` | `step_title`, `step_cta`, `target_href` | Identify best quick-decision path |
| `homepage_five_second_primary_cta_click` | Click on five-second primary CTA | `features/home/components/FiveSecondConversionStrip.tsx` | `cta_label`, `target_href` | Push to bundle funnel |
| `homepage_five_second_secondary_cta_click` | Click on five-second secondary CTA | `features/home/components/FiveSecondConversionStrip.tsx` | `cta_label`, `target_href` | Push to general catalog funnel |
| `homepage_bundle_card_click` | Click on a bundle card | `features/home/components/BundlesShowcaseSection.tsx` | `bundle_id`, `bundle_slug`, `bundle_name`, `bundle_price`, `bundle_discount` | Bundle PDP traffic attribution |
| `homepage_bundle_list_cta_click` | Click on bundle list CTA | `features/home/components/BundlesShowcaseSection.tsx` | `cta_label`, `target_href` | Open full bundle listing |
| `homepage_trust_badge_click` | Click on trust badge | `features/home/components/TrustBadgesRow.tsx` | `badge_label` | Understand trust-signal interactions |

## Common parameters
All events include:
- `page_type = homepage`
- `funnel_stage = consideration`

## Dashboard slices
- Hero CTR by `headline_variant` and `cta_variant`
- Bundle intent rate: (`homepage_hero_primary_cta_click` + `homepage_bundle_list_cta_click`) / `homepage_hero_impression`
- Five-second path winner by `step_title`
- Bundle card engagement by `bundle_slug`

## Source of truth
- Event constants: `lib/analytics/homepage-conversion-events.ts`
- GA4 setup checklist: `docs/GA4_HOMEPAGE_TRACKING_SETUP_CHECKLIST.md`
- Looker dashboard blueprint: `docs/LOOKER_STUDIO_HOMEPAGE_DASHBOARD_BLUEPRINT.md`
- Click-by-click runbook: `docs/LOOKER_STUDIO_CLICK_BY_CLICK_RUNBOOK.md`
