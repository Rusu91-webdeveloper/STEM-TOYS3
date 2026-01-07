# TechTots (techtots.ro) — 2‑Month “Go Live” Roadmap (Romania • STEM Toys • Next.js)
**Date:** 2026-01-07  
**Goal:** In **8 weeks**, TechTots is live in Romania with **~50 real products**, real suppliers, real payments (Stripe + Netopia), real shipping labels (AWB), and a clean returns process.

> Your site already communicates “livrare rapidă 1–3 zile” and “plăți securizate / Netopia” in the UI. Before launch, make sure those claims match reality (or adjust copy) to avoid unhappy customers and legal risk.  
> Evidence: homepage and footer pages on techtots.ro. citeturn3view0turn3view1

---

## 0) What “running” means (Definition of Done for Week 8)
By the end of Week 8 you can confidently do this 20 times/day:

1. A customer orders (card via Stripe / Netopia; optional COD later).
2. Payment is confirmed by webhook + stored reliably.
3. Order is routed to the correct supplier.
4. An **AWB** is generated and printed (Fan Courier and/or Sameday).
5. Customer receives tracking and status emails.
6. If a return happens, you can process it with a simple “RMA → pickup → inspect → refund/replace” flow.
7. Your stock/prices update automatically so you don’t oversell.

---

## 1) Your “Critical Path” (things that can block launch)
These are non-negotiable and must start immediately:

1. **Supplier onboarding** (no suppliers = no products).  
2. **Courier contract + AWB generation** (Fan/Sameday). Fan’s selfAWB API requires a contract. citeturn2search13  
3. **Netopia integration** (API v2 recommended; uses API tokens). citeturn4search3turn0search1  
4. **Returns + consumer rights pages** (RO: 14-day withdrawal; missing info can extend the withdrawal period). citeturn4search2turn0search18turn0search2  
5. **Toy compliance documentation** (CE / Toy Safety Directive). citeturn4search0turn4search14turn4search1  

---

## 2) The operating model you should use in the first 2 months
### Phase 1 (Launch): Dropship‑first + curated catalog
- You list **only** products that Romanian suppliers can deliver reliably.
- Suppliers ship directly to your customer.
- You control: checkout, customer support, returns coordination, product pages, tracking.

### Phase 2 (After launch, month 3+): Micro‑stock your winners
- When you identify the top 10–20 SKUs, you keep small stock for 24–48h delivery.

This keeps risk low while you prove demand.

---

# 8‑Week Plan (Weekly milestones + why each step exists)

## Week 1 — Set rules + start supplier pipeline (this week is mostly outreach)
### Why this exists
Without suppliers, you can’t sell. Supplier onboarding often takes longer than tech work.

### Deliverables
- A curated product “scope” (what you will and won’t sell).
- A supplier list + outreach sent.
- Your supplier requirements (what you need from them to integrate).

### Tasks
1) **Define your “Do‑Not‑List rules” (protect the brand)**
- If supplier can’t consistently deliver in your stated window (e.g., 1–3 days), don’t list.
- If product has unclear safety/docs (CE, warnings, age labels), don’t list.
- If product is fragile/high return risk for v1, don’t list.

2) **Create a supplier short‑list (Romania)**
Start with importers/distributors + B2B platforms (contact for B2B terms and ask for dropshipping or “ship-to-customer” option):

- ConarToys (importer/distributor; B2B). citeturn1search1  
- Boribon (importer of educational toys; B2B story). citeturn1search3  
- CARO toys (importer/distributor). citeturn1search9  
- ArmToys (wholesale importer). citeturn1search10  
- EngrosTulli (B2B site includes “jocuri științifice și educaționale (STEM)”). citeturn1search16  
- Magicaland (national distribution; B2B platform mentioned). citeturn1search14  
- AAD Total (claims importer pricing; B2B). citeturn1search19  

Potential dropshipping‑explicit leads (they mention dropshipping publicly; still validate terms):
- Teomarket (mentions dropshipping + CSV/feed). citeturn1search7  
- MagicKids (mentions “sistem dropshipping”). citeturn1search15  

3) **Send outreach emails (today)**
Use a short email requesting:
- dropshipping/ship-to-customer terms
- product feed (CSV/XML/API) fields: EAN, stock, price, images, weight/dimensions
- dispatch cut‑off time + SLA
- returns handling + credit note timing
You can reuse the templates from your 12‑month plan’s Appendix (copy/paste). fileciteturn1file15  

4) **Decide your first 6 “hero clusters” (for TechTots)**
Use the clusters already aligned to your brand:
- programmable “first robot”
- snap‑together electronics kits
- magnetic engineering tiles
- microscope/exploration bundles
- marble runs/mechanics kits
- monthly challenge pack (later)
(These are consistent with your longer roadmap logic). fileciteturn1file11  

### Definition of Done (Week 1)
- 10–15 supplier emails sent.
- A shortlist of 80 possible SKUs (not published yet).
- A clear rule set for what gets listed.

---

## Week 2 — Lock logistics + returns (so every order follows one script)
### Why this exists
Marketing without fulfillment creates a “support disaster.” Logistics and returns are your real product.

### Deliverables
- Courier plan (Fan + optional Sameday/easybox).
- Return flow (RMA) and policy pages updated.

### Tasks
1) **Pick courier strategy**
- **Fan Courier** for broad coverage + AWB API (selfAWB). Their API documentation states you need a signed contract. citeturn2search13  
- Optional: **Sameday / easybox** (if you want lockers). Sameday has an onboarding/affiliation flow for easybox. citeturn2search14  

2) **Decide how you’ll generate AWBs**
Option A (recommended for solo founder): integrate directly with courier API(s).  
Option B: use an integrator/aggregator service (faster, fewer edge cases).  
(If you choose direct, Fan has official API PDFs; Sameday has API docs and requires tokens/headers). citeturn2search13turn2search16  

3) **Write your “Returns SOP” (1 page internal doc)**
- When a customer requests return → how you respond within 24h
- Who pays shipping (be explicit)
- Where the return goes (your address vs supplier vs 3PL)
- How you inspect (QC checklist)
- Refund timeline

4) **Update the legal pages (minimum viable, but correct)**
Romania/EU: consumers have a 14‑day right of withdrawal for distance sales, and failure to inform can extend the period. citeturn4search2turn0search2turn0search18  
Also ensure your site has: contact info, terms, privacy/cookies/GDPR links (you already have these in footer). citeturn3view1turn3view2  

### Definition of Done (Week 2)
- Courier contract(s) started (or already signed).
- Returns SOP written.
- Shipping + returns pages updated and match reality.

---

## Week 3 — Payments: add Netopia (and make webhooks rock‑solid)
### Why this exists
In Romania, local payment logos and flows can improve trust/conversion. Also: payment bugs destroy a store.

### Deliverables
- Netopia (API v2) integrated end‑to‑end in staging.
- Webhooks idempotent and observable.

### Tasks
1) **Integrate Netopia Payments API v2**
Netopia recommends API v2 (JSON endpoints secured by API tokens). citeturn4search3turn0search1  
Implement:
- create payment (start) → redirect/hosted payment page
- handle callbacks (success/fail) + IPN/webhook
- persist payment status transitions

2) **Webhook reliability checklist**
- Idempotency keys (avoid double order creation)
- Retry-safe handlers
- “Payment pending” state in DB
- Admin dashboard shows payment timeline

3) **Update the UI truthfully**
If your footer says “Plăți securizate Netopia,” ensure it’s actually available before launch, or hide it until live. citeturn3view1turn3view2  

### Definition of Done (Week 3)
- You can complete a Netopia sandbox transaction and see the order created exactly once.
- Admin can see payment status + raw payload logs.

---

## Week 4 — Supplier onboarding “factory” + catalog pipeline (make 50 SKUs possible)
### Why this exists
You need a repeatable way to turn “supplier feed” → “published product page.”

### Deliverables
- At least 1 supplier agreement/account active.
- Product schema finalized (what fields every SKU must have).
- Stock sync v1.

### Tasks
1) **Close your first supplier**
You want **at least 1 supplier** signed by end of Week 4 (2 is better).

2) **Define your product data requirements**
Minimum fields to require from suppliers:
- EAN / SKU, title, age range, category, stock qty, price, VAT info
- dimensions + weight (for shipping)
- images (at least 4), safety/warnings, manuals (PDF if available)

3) **Build stock/price sync**
- Run every 15–30 minutes for local suppliers (or faster if feed supports).
- Add a “safety buffer” to avoid overselling.

4) **Compliance folder (per SKU)**
EU toy safety rules: keep CE/compliance evidence in your records; EU guidance explains CE marking for toys and the Toy Safety Directive context. citeturn4search14turn4search0turn4search1  

### Definition of Done (Week 4)
- Supplier feed imports into your admin as draft products.
- Stock sync updates stock/prices automatically.

---

## Week 5 — Build 50 product pages that reduce returns (content is operations)
### Why this exists
Most returns happen because expectations were wrong. Your product pages prevent returns.

### Deliverables
- 50 SKUs published (or at least “ready to publish”).
- Category structure by age/outcome.
- FAQ blocks + shipping expectations.

### Tasks
For each product:
- “Who it’s for” (age, skill)
- “What it teaches” (1–3 bullets)
- “What’s in the box”
- “Warnings / safety”
- Delivery estimate (aligned to your supplier SLA)
- Good images and at least 1 short demo clip (phone video is fine)

Also:
- Align categories to your site’s age‑based navigation (3–5, 6–8, 9–12, 13+). citeturn3view0turn3view1  

### Definition of Done (Week 5)
- 50 SKUs published with complete content and pricing.
- Each SKU has shipping/returns expectations.

---

## Week 6 — Fulfillment rehearsal (test orders + returns drill)
### Why this exists
If you can’t return smoothly, you don’t have ecommerce—just a website.

### Deliverables
- 10–20 realistic test orders (end-to-end).
- 1–2 test returns completed.

### Tasks
1) Run test orders:
- Stripe card, Netopia card
- Different cities/addresses
- Different suppliers (if >1)

2) Validate:
- AWB generation + tracking emails
- Supplier picks/ships correctly
- Status updates in admin

3) Run test returns:
- Customer request → label/pickup → inspection → refund
- Measure time + cost

### Definition of Done (Week 6)
- You can fulfill orders without manual chaos.
- Returns do not “break” you.

---

## Week 7 — Soft launch (controlled traffic, real feedback)
### Why this exists
You want problems while volume is low.

### Deliverables
- Store open publicly.
- First 10–30 real orders (small, controlled).
- KPI tracking started.

### Tasks
- Announce to your email list and socials (small).
- Track:
  - on-time delivery rate per supplier
  - support tickets per 100 orders
  - refund/return reasons
  - payment failure rate by method

### Definition of Done (Week 7)
- Stable order pipeline.
- Top 3 issues identified and prioritized.

---

## Week 8 — Stabilize + prepare for scaling (without breaking)
### Why this exists
Scaling before stability is the fastest way to fail.

### Deliverables
- “Ops checklist” you can repeat weekly.
- Winner list (top 10 SKUs) + plan to micro-stock later.
- Marketing engine v1 (content + email flows).

### Tasks
- Create a weekly rhythm:
  - Monday: supplier SLA/stock audit
  - Wednesday: improve top product pages + checkout
  - Friday: batch content (unboxing/demo)

- Prepare: review request email at day 7–10 after delivery (improves trust and conversion long-term).

### Definition of Done (Week 8)
- You can handle 10–20 orders/day solo without drowning.
- You have a clear next step: micro-stock winners.

---

# 3) Supplier “qualification checklist” (use this on every call)
Ask every supplier:

1) **Do you support dropshipping / ship-to-customer?** If yes, is there a per-order fee?  
2) **Dispatch SLA:** same-day vs next-day, cut-off time.  
3) **Stock update method:** CSV feed, XML, API; update frequency.  
4) **Returns:** where do returns go? how fast credit note/refund?  
5) **Compliance docs:** CE/Toy Safety/EN71 references, warnings, manuals. citeturn4search0turn4search1turn4search14  
6) **Packaging:** damage rate, “gift-ready” packaging.

---

# 4) Tech checklist (specific to your stack: Next.js + Admin dashboard)
You said: Stripe done, emails done, admin dashboard exists.

Minimum tech additions for launch:
- Netopia payment module (API v2). citeturn4search3turn0search1  
- Payment state machine in DB (pending/paid/failed/refunded).
- Courier AWB integration (Fan; optional Sameday). citeturn2search13turn2search14  
- Stock sync job + supplier adapter layer.
- Audit log (admin changes: price, stock override, status updates).
- Basic monitoring/alerts (errors + payment webhook failures).

---

# 5) Legal & compliance (minimum viable for RO toy ecommerce)
- **Right of withdrawal (14 days)** must be clearly communicated; official Romanian text available via ANPC PDF. citeturn4search2turn0search18  
- **Toy safety / CE**: only toys meeting EU requirements should be placed on the market; see EU Commission guidance. citeturn4search14turn4search0  
- Keep a folder per SKU with supplier declarations, warnings, manuals, batch/lot info.

> Note: talk to an accountant about **RO e-Factura** obligations in your exact legal setup; several guides state changes for 2025+. (Treat this as “verify,” not legal advice.) citeturn2search7turn2search3  

---

# 6) What I still need from you (optional, to make this even more “TechTots-specific”)
Reply with bullets when you can:
1) Are you shipping from **suppliers directly** (dropship) or do you plan to hold stock at home initially?
2) Do you want **COD** at launch (yes/no)?
3) Which courier do you prefer: Fan, Sameday, both?
4) What’s your current order database schema (Order, Payment, Shipment models) — do you already have “shipment” objects?

If you answer these, I can produce a **day-by-day checklist for the next 14 days** tailored to your exact stack and data model.
