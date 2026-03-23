# KB: E-commerce Launch Patterns for STEM Toys (2026-02-22)

## What Works Repeatedly
1. **Reliability first**: auth/payment/webhook/fulfillment must be stable before traffic scaling.
2. **Trust stack**: visible shipping/returns/support + educational and safety credibility.
3. **Segmented conversion benchmarks**: optimize by category, AOV band, and device mix.
4. **Entry + bundle ladder**: low-friction first buy SKU + bundle upsell for AOV/margin.

## Implementation in TechTots Context
- Follow launch blocker checks from `docs/LAUNCH_PLAYBOOK_SIMPLE.md` before campaign push.
- Prioritize funnel instrumentation (session > ATC > checkout > purchase).
- Align pricing ladder with local market zones:
  - Entry: 49–79 RON
  - Core: 89–149 RON
  - Premium/bundle: 169–279 RON

## Metric Targets to Set at Launch
- Purchase conversion rate (by device)
- AOV and bundle attach rate
- Payment success rate (Stripe/Netopia/COD)
- AWB creation success rate
- Refund and support-ticket rate
