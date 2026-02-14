# SOP - Daily Operations Checklist

## Overview
Standard Operating Procedures (SOP) for daily operations of TechTots dropshipping business.

---

## Daily Operations Checklist

### ☐ Morning Routine (9:00 AM)

#### 1. Check New Orders
- [ ] Log into admin panel
- [ ] Review orders from last 24 hours
- [ ] Verify payment status (PAID orders only)
- [ ] Check for any payment issues or pending payments
- [ ] Export order list for supplier processing

**Tools:**
- Admin panel: `/admin/orders`
- Filter: Status = "PAID", Date = Today

**Action Items:**
- Mark orders ready for supplier processing
- Flag any payment issues for follow-up

---

#### 2. Process Supplier Orders

**For each PAID order (and COD order):**

- [ ] **Validate automation output**
  - Open `/admin/orders`
  - Filter `Status = ⚠️ Needs Shipping Review`
  - Confirm new orders have supplier orders and no unresolved review flags

- [ ] **Verify stock availability**
  - Check supplier product stock
  - If out of stock:
    - Contact supplier for ETA
    - Notify customer of delay
    - Offer alternative product or refund

- [ ] **Manual fallback only when needed**
  - If supplier orders are missing, run admin process endpoint for that order
  - Add internal note with reason and resolution timestamp

**Tools:**
- Admin panel: `/admin/orders/[id]`
- Manual fallback endpoint: `/api/admin/orders/process`

**Time Estimate:** 2-5 minutes per order (exceptions only)

---

#### 3. Courier Pickup / AWB Generation

**For each physical order:**

- [ ] **Verify automatic AWB status**
  - AWB should be auto-created from checkout/webhook flow
  - Confirm tracking number appears on order and supplier orders

- [ ] **Handle manual shipping review queue**
  - Open orders flagged with `manualShippingReviewRequired`
  - Reasons include mixed suppliers, missing supplier mapping, or courier API errors
  - Resolve by split-shipment planning or manual AWB creation with operations notes

- [ ] **Confirm customer visibility**
  - Tracking endpoint must show real AWB only
  - If AWB is missing, customer sees tracking unavailable (expected until created)

**Tools:**
- Admin panel: `/admin/orders/[id]`
- Fallback AWB endpoints: `/api/shipping/create-awb`, `/api/shipping/fancourier/create-awb`

**Time Estimate:** 1-3 minutes per order (exceptions only)

---

### ☐ Midday Check (12:00 PM)

#### 4. Monitor Supplier Sync

- [ ] **Check supplier feed sync status**
  - Review sync logs: `/admin/suppliers/sync-logs`
  - Verify last sync completed successfully
  - Check for errors or warnings

- [ ] **Review stock updates**
  - Check products with stock changes
  - Update product availability on site
  - Hide products with 0 stock (if needed)

- [ ] **Review price updates**
  - Check for significant price changes
  - Verify margin is still acceptable
  - Update prices if needed

**Tools:**
- Admin panel: `/admin/suppliers`
- Supplier sync logs

**Time Estimate:** 10-15 minutes

---

#### 5. Customer Support Queue

- [ ] **Check support email inbox**
  - Review new emails
  - Categorize by type:
    - Order questions
    - Return requests
    - Defect claims
    - General inquiries

- [ ] **Process support tickets**
  - Use appropriate macro template
  - Respond within 24 hours (target: 4 hours)
  - Escalate complex issues

- [ ] **Update order statuses**
  - Mark orders as "SHIPPED" when tracking added
  - Update return statuses
  - Close resolved tickets

**Tools:**
- Support email: [CONTACT_EMAIL]
- Support macros: `docs/CUSTOMER_SUPPORT_MACROS.md`
- Admin panel for order updates

**Time Estimate:** 30-60 minutes (depends on volume)

---

### ☐ Afternoon Routine (3:00 PM)

#### 6. Process Returns / Claims

**For each return request:**

- [ ] **Review return form**
  - Check reason for return
  - Verify photos/videos uploaded (for claims)
  - Confirm return is within 14-day window

- [ ] **For defect/missing parts claims:**
  - Review photos/videos
  - Determine if supplier authorization needed (ARP/RMA)
  - If needed:
    - Contact supplier for ARP/RMA number
    - Wait for authorization
    - Update return status

- [ ] **Generate return label**
  - Create return shipping label
  - Send to customer via email
  - Use "Return Request" macro

- [ ] **Update return status**
  - Mark as "APPROVED" or "PENDING_SUPPLIER_AUTH"
  - Add notes if needed

**Tools:**
- Admin panel: `/admin/returns`
- Return processing API
- Email template: "Return Request"

**Time Estimate:** 10-15 minutes per return

---

#### 7. Track Deliveries

- [ ] **Check delivery status**
  - Review orders marked as "SHIPPED"
  - Check tracking updates from courier
  - Identify any delays

- [ ] **For delayed deliveries:**
  - Contact courier for status
  - Notify customer of delay
  - Use "Delivery Delay" macro

- [ ] **Mark as DELIVERED**
  - When tracking shows "Delivered"
  - Update order status
  - Send delivery confirmation (optional)

**Tools:**
- Courier tracking portals
- Admin panel: `/admin/orders`
- Email template: "Delivery Delay"

**Time Estimate:** 15-20 minutes

---

### ☐ End of Day (6:00 PM)

#### 8. Daily Summary

- [ ] **Review daily metrics**
  - Orders processed: [COUNT]
  - Supplier orders created: [COUNT]
  - AWBs generated: [COUNT]
  - Returns processed: [COUNT]
  - Support tickets resolved: [COUNT]

- [ ] **Check for pending items**
  - Orders waiting for supplier processing
  - Returns waiting for supplier authorization
  - Support tickets pending response

- [ ] **Plan next day priorities**
  - List high-priority items
  - Schedule follow-ups

- [ ] **Update operations log**
  - Document any issues
  - Note improvements needed

**Tools:**
- Admin panel dashboard
- Operations log (spreadsheet or notes)

**Time Estimate:** 10-15 minutes

---

## Weekly Tasks

### Monday: Supplier Relations
- [ ] Review supplier performance (delivery times, stock accuracy)
- [ ] Contact suppliers about any issues
- [ ] Update supplier agreements if needed

### Tuesday: Inventory Review
- [ ] Review product catalog
- [ ] Check low-stock products
- [ ] Update product descriptions/prices

### Wednesday: Customer Feedback
- [ ] Review customer reviews
- [ ] Analyze return reasons
- [ ] Identify product quality issues

### Thursday: Financial Review
- [ ] Review order margins
- [ ] Check supplier invoices
- [ ] Reconcile payments

### Friday: Process Improvement
- [ ] Review SOP effectiveness
- [ ] Identify bottlenecks
- [ ] Plan improvements

---

## Emergency Procedures

Detailed incident runbook: `docs/ONCALL_FULFILLMENT_PLAYBOOK.md`

### Payment Webhook Failures (Stripe/Netopia)
1. Confirm provider dashboard shows successful payment event and timestamp.
2. Check webhook route logs for signature/auth or processing errors.
3. Verify order state: `paymentStatus`, supplier orders, AWB fields.
4. Re-run fulfillment manually:
   - supplier order processing (`/api/admin/orders/process`)
   - AWB creation fallback endpoint if needed
5. Add incident note with provider event ID and order ID.

### AWB Creation Failures
1. Filter `/admin/orders` by `Needs Shipping Review`.
2. Inspect `shippingReviewReason` and `courierErrorMessage`.
3. If courier API outage: create AWB manually in FanCourier portal.
4. Update order/supplier tracking fields and clear manual review flag.
5. Notify customer only after real AWB exists.

### Mixed Supplier Order (Boribon + Kidstory)
1. Treat as manual-review order by design.
2. Split fulfillment by supplier and coordinate separate shipment handling.
3. Keep customer updates explicit if split delivery timeline changes.
4. Ensure final tracking communication uses real AWB values only.

### Stock Mismatch After Order Placement
1. Validate catalog stock vs supplier feed latest sync.
2. If supplier out of stock, contact supplier and get ETA.
3. Offer customer alternatives/refund if ETA unacceptable.
4. Record mismatch for feed mapping/reconciliation follow-up.

### Order Processing Delays
1. Identify delay cause (supplier, courier, stock)
2. Contact supplier/courier immediately
3. Notify customer with "Delivery Delay" macro
4. Offer solution (refund, alternative product, wait)
5. Document issue for follow-up

### Supplier Stock Issues
1. Check alternative suppliers
2. Contact supplier for ETA
3. Notify customer of delay
4. Offer alternative or refund
5. Update product availability

### Return/Claim Disputes
1. Review all documentation (photos, videos)
2. Contact supplier for guidance
3. Escalate to manager if needed
4. Provide clear explanation to customer
5. Offer fair resolution

---

## Tools & Resources

### Admin Tools
- Admin Panel: `/admin`
- Order Management: `/admin/orders`
- Return Management: `/admin/returns`
- Supplier Management: `/admin/suppliers`

### Communication
- Support Email: [CONTACT_EMAIL]
- Support Phone: [CONTACT_PHONE]
- Support Macros: `docs/CUSTOMER_SUPPORT_MACROS.md`

### External Systems
- Courier Portals (Fan Courier, Sameday, GLS)
- Supplier Portals (Boribon, KidStory)
- Payment Gateway (Netopia)

---

## KPIs to Track

### Daily
- Orders processed
- Supplier orders created
- AWBs generated
- Support response time
- Returns processed

### Weekly
- Order fulfillment rate
- Average delivery time
- Return rate
- Customer satisfaction
- Supplier performance

### Monthly
- Total revenue
- Average order value (AOV)
- Profit margin
- Customer retention
- Supplier reliability

---

**Status:** ✅ SOP checklist ready for daily operations.
