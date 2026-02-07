# Supplier order flow

## SupplierOrder model

- **Granularity:** One `SupplierOrder` per **order line** (order item), not one per supplier. An order with three items from the same supplier yields three `SupplierOrder` rows. This supports per-line tracking and cost.
- **Creation:** Supplier orders are created by `OrderProcessor.processNewOrder(orderId)` in:
  - **Stripe webhook** (after payment success, for physical items), if the order has no supplier orders yet.
  - **Netopia webhook** (after payment success, for physical items), if the order has no supplier orders yet.
  - **Admin:** POST `/api/admin/orders/process` with `{ orderId }` (manual trigger).
- **Items without a supplier:** Order items whose product has no `supplierId` are skipped; an error is logged and added to the processor result. No `SupplierOrder` row is created for those lines.
- **Tracking propagation:** When an AWB is created (FanCourier or Sameday), `Order.trackingNumber` and `Order.carrier` are set, and all `SupplierOrder` rows for that order are updated with the same `trackingNumber` and `carrier` so admin and supplier views stay in sync.

## Related flows

- AWB creation (FanCourier/Sameday) uses `Order` + `Product` (and optional supplier for pickup/label); it does not require `SupplierOrder`. After AWB creation, Order and SupplierOrders are updated with the AWB number and carrier. See `lib/shipping/fancourier-awb.ts`, `lib/shipping/sameday-awb.ts`, and `SUPPLIER_ORDER_FLOW_TODO.md`.

## Inventory: reserved quantity

- **At checkout:** For each physical order item, `Product.stockQuantity` is decremented and `Product.reservedQuantity` is incremented (in `app/api/checkout/order/route.ts`), so stock is held for the order.
- **Finalization:** There is no automatic step that decrements `reservedQuantity` when the order is shipped or delivered (or that releases reserved and restores `stockQuantity` on cancel/refund/return). Implementing that would involve: on order status transition to SHIPPED or DELIVERED, decrement `reservedQuantity` for the order’s physical items; on cancel/refund/return, release reserved and optionally restore `stockQuantity`. This is left for a future change; until then, reserved quantity can accumulate for old orders unless cleared manually or by another process.

## Returns and SupplierOrder

- Returns are handled in `app/api/returns/*` (create, status, admin, send-report). The `Return` model has `supplierAuthorizationStatus` and related fields for supplier ARP/RMA flow.
- Approving a return or marking it received does not currently update `SupplierOrder` status or notes. If you need to reflect return state on supplier orders (e.g. for reporting or supplier notifications), that would be a separate enhancement in the returns flow.
