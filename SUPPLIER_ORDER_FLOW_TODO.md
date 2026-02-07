# Supplier Order Flow Checklist (Kidstory/Boribon + FanCourier)

Last updated: 2026-02-07

- [x] 1. Allowlist decides what is shown (allowed SKUs + allowlist enforced) (evidence: scripts/setup-kidstory-feed.ts, scripts/setup-boribon-feeds.ts, lib/suppliers/sync.ts)
- [x] 2. Daily/cron feed sync merges feeds + validates required fields; invalid products are inactive (evidence: app/api/cron/suppliers/route.ts, lib/suppliers/sync.ts)
- [x] 3. Storefront only shows active/approved products (evidence: app/api/products/route.ts, app/page.tsx, lib/repositories/product-repository.ts)
- [x] 4. Checkout creates order + order items linked to products (supplier link via product.supplierId) (evidence: app/api/checkout/order/route.ts, prisma/schema.prisma)
- [ ] 5. SupplierOrder records auto-created per supplier after order creation (status: manual only via admin endpoint) (evidence: lib/order-processor.ts, app/api/admin/orders/process/route.ts)
- [x] 6. Shipment/AWB creation via FanCourier (evidence: lib/shipping/fancourier-awb.ts, lib/shipping/awb-dispatcher.ts, app/api/checkout/order/route.ts)
- [ ] 7. Customer receives real tracking number and link (status: order tracking endpoint returns mock tracking number; AWB not propagated) (evidence: app/api/orders/[orderId]/tracking/route.ts, lib/shipping/fancourier-awb.ts)
- [ ] 8. Post-order updates: supplier order status/tracking auto-updated from shipment + inventory finalization + returns (status: inventory decremented; returns exist; supplier order tracking not auto-updated) (evidence: app/api/checkout/order/route.ts, app/api/admin/supplier-orders/[id]/route.ts, app/api/returns/*)
