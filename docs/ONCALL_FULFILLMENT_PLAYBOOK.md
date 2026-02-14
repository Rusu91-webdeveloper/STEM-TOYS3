# On-Call Fulfillment Playbook (Boribon + Kidstory + FanCourier)

## Scope
Operational response guide for launch-critical incidents in checkout, supplier fulfillment, and courier workflows.

## Incident 1: Stripe/Netopia webhook failure
1. Confirm provider event exists in Stripe/Netopia dashboard.
2. Verify webhook endpoint health and signature validation logs.
3. Check order state in DB/admin:
   - `paymentStatus`
   - `status`
   - `manualShippingReviewRequired`
4. If order is paid but not fulfilled:
   - Trigger supplier order processing via `/api/admin/orders/process`.
   - Trigger AWB creation via `/api/shipping/create-awb` or `/api/shipping/fancourier/create-awb`.
5. Record provider event ID + order ID in incident notes.

## Incident 2: AWB creation failure
1. Filter admin orders for `Needs Shipping Review`.
2. Read `shippingReviewReason` and `courierErrorMessage`.
3. If FanCourier API is failing, create AWB manually in carrier portal.
4. Update order and supplier-order tracking fields with real AWB.
5. Clear manual review flag only after tracking is valid.

## Incident 3: Mixed-supplier order (Boribon + Kidstory)
1. Treat as manual-review by design.
2. Split fulfillment into supplier-specific shipment plan.
3. Coordinate shipment timing and customer communication.
4. Ensure only real AWB values are sent to customer.

## Incident 4: Stock mismatch
1. Compare ordered SKU with latest supplier feed and catalog stock.
2. Request ETA from supplier.
3. Offer customer alternatives or refund when ETA is unacceptable.
4. Capture SKU/mapping details for feed-rule follow-up.

## Data checks before closing incident
- Order has correct `paymentStatus` and fulfillment `status`.
- `manualShippingReviewRequired` is false unless intentionally unresolved.
- `trackingNumber` is real AWB or null (never synthetic).
- Supplier orders exist for all physical order lines.
