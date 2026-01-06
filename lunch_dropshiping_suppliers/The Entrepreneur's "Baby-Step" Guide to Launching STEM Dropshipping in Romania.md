# The Entrepreneur's "Baby-Step" Guide to Launching STEM Dropshipping in Romania

This guide breaks down your launch into three simple phases: **Setup**, **Technical Build**, and **Launch & Scale**. Follow these steps in order to ensure a smooth and compliant start in the Romanian market.

## Phase 1: The Foundation (Days 1-6)

This phase is about setting up your business legally and financially in Romania, and securing your first suppliers.

### Step 1: Legal & Financial Setup

1.  **Register Your Company:** Go to a notary or use an online service to register your business as a **SRL** (Societate cu Răspundere Limitată - Limited Liability Company) or **PFA** (Persoană Fizică Autorizată - Authorized Physical Person). *SRL is generally recommended for dropshipping.*
2.  **Open a Business Bank Account:** Open an account in RON (Romanian Leu) for your company. This is where your sales revenue and COD cash will be deposited.
3.  **Hire a Romanian Accountant:** This is **CRITICAL**. Find an accountant who understands **e-commerce**, **dropshipping**, and **intra-Community acquisitions** (buying from EU suppliers like BigBuy). They will handle your VAT and the mandatory **RO e-Factura** system.
4.  **Sign Courier Contracts:** Contact **Fan Courier** and **Sameday** (the two largest Romanian couriers). Sign a contract with them to get your own **AWB (Air Waybill) generation API key** and, most importantly, to set up **Cash-on-Delivery (COD) collection**. *The courier collects the cash and sends it to your bank account.*

### Step 2: Supplier Contracts

1.  **Contact Boribon (Local Priority):** Go to their partner page [1] and apply for a dropshipping account. This is your fastest, most reliable local supplier.
    *   **Action:** Sign their contract and get the **XML/CSV product feed URL**.
2.  **Contact BigBuy (Technical Priority):** Apply for a dropshipping account. This is your source for a massive catalog and the best technical integration.
    *   **Action:** Sign their contract and get your **RESTful API key**.
3.  **Select Initial Products:** Choose 50-100 of the best STEM toys from Boribon and BigBuy to start with.

## Phase 2: The Technical Build (Days 7-12)

This phase is about connecting your Next.js store to the suppliers and the courier. **You will need a developer for this part.**

### Step 3: Data Synchronization (Product Catalog)

1.  **Build the Data Parser:** Instruct your developer to create a service (a Node.js script or Next.js API route) that does two things:
    *   **A.** Reads the **XML/CSV feeds** from Boribon and other feed-based suppliers.
    *   **B.** Makes calls to the **BigBuy API** (JSON).
2.  **Normalize and Store:** The service must clean and combine all this data into a single, unified product catalog in your Next.js database.
3.  **Set Up Stock Sync:** Set the service to run automatically every **15-30 minutes** to check for stock and price changes from all suppliers. *This prevents you from selling out-of-stock items.*

### Step 4: Order Automation (The COD Solution)

1.  **Integrate Courier API:** Instruct your developer to integrate the **Fan Courier/Sameday API** key you received in Step 1.
2.  **Automate AWB Generation:** When a customer places an order (especially COD), your Next.js backend must automatically:
    *   **A.** Call the courier API to generate a unique **AWB (shipping label)**.
    *   **B.** Save the AWB number and the PDF file.
3.  **Automate Supplier Order:**
    *   **BigBuy (API):** Your system automatically sends the order details and the AWB number to the BigBuy API.
    *   **Boribon (Feed-based):** Your system automatically generates an order file (CSV/email) and sends it to Boribon, **attaching the AWB PDF**. *Boribon prints your AWB and ships the package.*

## Phase 3: Launch & Scale (Days 13+)

This phase is about making money and growing the business.

### Step 5: Final Checks and Pricing

1.  **Set Your Pricing:** Use the formula from the previous report to set your final selling price. **Always include a buffer** for the courier fees and the high COD rejection rate in Romania.
2.  **Enable Payments:** Integrate a local payment gateway (e.g., Netopia, MobilPay) for card payments. **Enable COD** as a payment option.
3.  **Place Test Orders:** Place 3 real test orders (1 Card, 2 COD) with your main suppliers (Boribon, BigBuy). Track the entire process: AWB generation, supplier fulfillment, delivery time, and COD cash remittance. *If the test orders work, you are ready.*

### Step 6: Marketing and Optimization

1.  **Soft Launch:** Go live with your initial 50-100 curated products.
2.  **Start Marketing:** Begin with small, targeted campaigns on **Google Search Ads** and **Facebook/Instagram** targeting Romanian parents interested in STEM/educational toys.
3.  **Track the Critical KPI:** Track your **COD Rejection Rate**. If it is above 20%, you must implement a **mandatory phone/SMS confirmation** for all first-time COD orders to reduce losses.
4.  **Scale the Winners:** After 30 days, analyze which products are selling best. Drop the non-performers and add more similar products from your suppliers. **Focus on what works.**

***

## Key Romanian Market Realities to Remember

| Reality | Your Action |
| :--- | :--- |
| **Cash-on-Delivery (COD) is King** | You **MUST** have a contract with a local courier (Fan/Sameday) to handle the cash collection. |
| **VAT & E-Invoicing** | You **MUST** hire a specialized Romanian accountant to manage the mandatory **RO e-Factura** system and VAT compliance. |
| **Fast Delivery is Expected** | Prioritize local Romanian suppliers (Boribon, Kidstory) for your best-selling items to ensure 1-2 day delivery. |

***

## References

[1] Boribon. *acces distribuitori*. Available at: [https://www.boribon.ro/info/acces-distribuitori](https://www.boribon.ro/info/acces-distribuitori)
[2] BigBuy. *BigBuy API for developers and programmers*. Available at: [https://www.bigbuy.eu/en/api_bigbuy.html](https://www.bigbuy.eu/en/api_bigbuy.html)
[3] Sameday. *Sameday API Documentation*. (Source inferred from market research on RO couriers)
