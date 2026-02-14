# Supplier Order Flow Checklist (Kidstory/Boribon + FanCourier)

Last updated: 2026-02-14

- [x] 1. Allowlist decides what is shown (allowed SKUs + allowlist enforced) (evidence: `scripts/setup-kidstory-feed.ts`, `scripts/setup-boribon-feeds.ts`, `lib/suppliers/sync.ts`)
- [x] 2. Daily/cron feed sync merges feeds + validates required fields; invalid products are inactive (evidence: `app/api/cron/suppliers/route.ts`, `lib/suppliers/sync.ts`)
- [x] 3. Storefront only shows active/approved products (evidence: `app/api/products/route.ts`, `app/page.tsx`, `lib/repositories/product-repository.ts`)
- [x] 4. Checkout creates order + order items linked to products (supplier link via `product.supplierId`) (evidence: `app/api/checkout/order/route.ts`, `prisma/schema.prisma`)
- [x] 5. SupplierOrder records are auto-created for physical orders on payment-confirmed flows (Stripe/Netopia webhooks) and COD checkout; admin endpoint remains as fallback (evidence: `lib/order-processor.ts`, `app/api/stripe/webhook/route.ts`, `app/api/payments/netopia/webhook/route.ts`, `app/api/checkout/order/route.ts`, `app/api/admin/orders/process/route.ts`)
- [x] 6. Shipment/AWB creation via FanCourier/Sameday is duplicate-safe (`existing shipment with AWB` short-circuits) (evidence: `lib/shipping/fancourier-awb.ts`, `lib/shipping/sameday-awb.ts`, `app/api/stripe/webhook/route.ts`, `app/api/payments/netopia/webhook/route.ts`, `app/api/checkout/order/route.ts`)
- [x] 7. Customer tracking endpoint returns real tracking only (no synthetic fallback values) and includes explicit availability state (evidence: `app/api/orders/[orderId]/tracking/route.ts`)
- [~] 8. Post-order inventory finalization is still partial: checkout decrements stock and increments reserved, but reserved reconciliation on cancel/refund/return and shipment-finalization automation still needs completion (evidence: `app/api/checkout/order/route.ts`, `app/api/returns/*`)
