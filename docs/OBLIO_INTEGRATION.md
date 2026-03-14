# Oblio Integration

## What is wired

- Billing addresses are persisted separately from shipping addresses during checkout.
- Orders now store local external invoice state in `OrderInvoice`.
- Stripe and Netopia paid orders attempt automatic Oblio invoice sync.
- COD orders attempt automatic Oblio invoice sync when status becomes `SHIPPED`, `DELIVERED`, or `COMPLETED`.
- Admin can manually retry invoice sync with `POST /api/admin/orders/:id/invoice`.
- Admin can register default Oblio webhooks with `POST /api/admin/integrations/oblio/webhooks`.
- Oblio webhook receiver is available at `POST /api/integrations/oblio/webhook`.

## Required env vars

- `OBLIO_ENABLED=true`
- `OBLIO_CLIENT_EMAIL`
- `OBLIO_CLIENT_SECRET`
- `OBLIO_COMPANY_CIF` or `STORE_CUI`

## Recommended env vars

- `OBLIO_SERIES_NAME`
- `OBLIO_WEBHOOK_BASE_URL`
- `OBLIO_AUTO_SEND_EINVOICE=true`
- `OBLIO_AUTO_COLLECT_ONLINE_PAYMENTS=true`

## Operational notes

- Online card payments are issued after payment confirmation and then collected in Oblio.
- COD orders are not collected automatically in Oblio.
- The integration is idempotent at the local level through the `OrderInvoice` record; repeated payment webhooks should not create duplicate local sync attempts for already-synced invoices.
- The Oblio webhook route validates the base64 payload signature and can also enforce an extra shared secret with `OBLIO_WEBHOOK_SECRET`.
