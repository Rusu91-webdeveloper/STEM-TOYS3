# 🚚 FAN Courier Integration Guide

> A simple step-by-step guide explaining how FAN Courier shipping works in your e-commerce store.

---

## 📋 Table of Contents

1. [Initial Setup (One-Time)](#-initial-setup-one-time)
2. [What Happens When a Customer Orders](#-what-happens-when-a-customer-orders)
3. [What You See as Admin](#-what-you-see-as-admin)
4. [Creating the Shipping Label (AWB)](#-creating-the-shipping-label-awb)
5. [Special Cases](#-special-cases)
6. [Quick Reference](#-quick-reference)

---

## 🔧 Initial Setup (One-Time)

Before you can use FAN Courier, you need to set up your credentials.

### Step 1: Get FAN Courier Account

1. Go to [FAN Courier](https://www.fancourier.ro)
2. Sign up for a business account (SelfAWB integration)
3. You'll receive:
   - Client ID
   - Username
   - Password

### Step 2: Add Credentials to Your Website

Open your `.env.local` file and add:

```bash
# FAN Courier API Credentials
FANCOURIER_BASE_URL=https://api.fancourier.ro/v2
FANCOURIER_CLIENT_ID=your-client-id-here
FANCOURIER_USERNAME=your-username-here
FANCOURIER_PASSWORD=your-password-here

# Your Business Address (where packages ship FROM)
FANCOURIER_SENDER_NAME=TechTots SRL
FANCOURIER_SENDER_PHONE=+40746000000
FANCOURIER_SENDER_EMAIL=expedieri@techtots.ro
FANCOURIER_SENDER_COUNTY=Cluj
FANCOURIER_SENDER_LOCALITY=Cluj-Napoca
FANCOURIER_SENDER_STREET=Mehedinți
FANCOURIER_SENDER_NUMBER=54-56
FANCOURIER_SENDER_POSTAL_CODE=400000
```

### Step 3: Configure Shipping Prices (Admin Panel)

1. Go to **Admin** → **Settings** → **Shipping** tab
2. Set your prices:
   - **Online Payment Price**: 19.99 RON (customers who pay by card)
   - **Ramburs (COD) Price**: 24.99 RON (customers who pay cash on delivery)
   - **Free Shipping Threshold**: 199 RON (orders above this = free shipping)

**Why different prices?**
- Ramburs (cash on delivery) costs more because:
  - The courier handles cash for you
  - There's more paperwork
  - Higher risk of refused deliveries

---

## 🛒 What Happens When a Customer Orders

### Customer Journey (Step by Step)

```
┌─────────────────────────────────────────────────────────────────┐
│                     CUSTOMER CHECKOUT FLOW                       │
└─────────────────────────────────────────────────────────────────┘

1️⃣ Customer adds products to cart
   └── Example: Robot educațional (450 RON)

2️⃣ Customer goes to checkout
   
3️⃣ Customer chooses PAYMENT METHOD
   ┌─────────────────────────────────────────────┐
   │  💳 Card (Stripe/Netopia)  →  19.99 RON    │
   │  🏦 Bank Transfer          →  19.99 RON    │
   │  💵 Ramburs (COD)          →  24.99 RON    │
   └─────────────────────────────────────────────┘

4️⃣ Customer sees shipping cost in cart
   └── If order > 199 RON → "TRANSPORT GRATUIT!" ✨

5️⃣ Customer enters shipping address
   └── Name, phone, address, city, postal code

6️⃣ Customer completes order
   └── Receives order confirmation email
```

### Automatic Calculations That Happen

When order is created, the system automatically:

| What | How It Works |
|------|--------------|
| **Shipping Price** | Based on payment method (19.99 or 24.99 RON) |
| **Free Shipping** | Applied if cart total ≥ 199 RON |
| **Declared Value** | Set to cart total if: bundle in cart OR any product ≥ 500 RON |
| **COD Amount** | Total to collect if Ramburs payment |

---

## 👨‍💼 What You See as Admin

### Viewing Orders

1. Go to **Admin** → **Orders**
2. You'll see a list of all orders

### Normal Order (No Issues)

```
┌────────────────────────────────────────────────────────┐
│ Order #ORD-123456                                      │
│ Customer: Maria Popescu                                │
│ Total: 469.99 RON                                      │
│ Payment: Ramburs                                       │
│ Status: Processing                                     │
└────────────────────────────────────────────────────────┘
```

### Order Needing Attention ⚠️

If an order has a special issue (like delivery to a remote location), you'll see:

```
┌────────────────────────────────────────────────────────┐
│ Order #ORD-789012                                      │
│ Customer: Ion Vasile                                   │
│ Total: 299.99 RON                                      │
│ Payment: Card                                          │
│ Status: Processing                                     │
│ ⚠️ Shipping Review: Remote locality - extra km fees   │
└────────────────────────────────────────────────────────┘
```

**What does "Shipping Review" mean?**
- FAN Courier charges extra for:
  - Remote villages (far from main roads)
  - Extra kilometers outside city limits
- The system flags these so you can:
  - Contact the customer about extra fees
  - Or absorb the cost yourself

### Filtering Orders

Use the dropdown to filter orders:
- **All Status** - see everything
- **Processing** - orders waiting to ship
- **Shipped** - orders already sent
- **⚠️ Needs Shipping Review** - orders with delivery issues

---

## 📦 Creating the Shipping Label (AWB)

### What is an AWB?

AWB = **Air Waybill** (shipping label)
- It's the sticker you put on the package
- Has all delivery information
- Has a barcode for tracking

### Step-by-Step: Creating AWB

1. **Go to Order Details**
   - Admin → Orders → Click on order

2. **Click "Create AWB" button**
   - Select courier: FAN Courier
   - Click confirm

3. **System Does This Automatically:**
   ```
   ┌─────────────────────────────────────────────────┐
   │           WHAT HAPPENS BEHIND THE SCENES        │
   └─────────────────────────────────────────────────┘
   
   1. Connects to FAN Courier API
   2. Sends package details:
      - Your address (sender)
      - Customer address (recipient)
      - Package weight
      - COD amount (if Ramburs)
      - Declared value (for insurance)
   3. FAN Courier returns AWB number
   4. System saves AWB to order
   ```

4. **You Receive:**
   - AWB number (example: `2070123456789`)
   - Printable shipping label (PDF)

5. **Print & Stick**
   - Print the label
   - Stick it on the package
   - Call FAN Courier for pickup (or drop at their office)

### If Something Goes Wrong

If FAN Courier API fails, the system:
1. Saves the error message
2. Marks order as "needs manual review"
3. You can:
   - Try again later
   - Create AWB manually on FAN Courier website

---

## 🔍 Special Cases

### 1. Bundle Orders (Gift Sets)

If customer orders a bundle (like a STEM gift set):
- **Declared Value** = Full order total
- This provides **insurance** if package is lost/damaged
- FAN Courier must reimburse you

### 2. High-Value Orders (≥ 500 RON)

Insurance triggers automatically when:
- **Any single product** costs ≥ 500 RON, OR
- **Cart total** is ≥ 500 RON (even with many cheap items!)

**Examples:**
| Scenario | Declared Value | Insurance? |
|----------|----------------|------------|
| 1 toy × 150 RON = 150 RON total | `null` | ❌ No |
| 1 bundle × 300 RON | `300` | ✅ Yes (bundle) |
| 1 expensive robot × 550 RON | `550` | ✅ Yes (high-value item) |
| **10 toys × 50 RON = 500 RON total** | `500` | ✅ Yes (cart total) |
| 3 toys × 100 RON = 300 RON total | `null` | ❌ No |

### 3. Remote Locations

If customer lives in a remote area:
- FAN Courier charges extra fees
- System flags the order with ⚠️
- You decide: charge customer or absorb cost

### 4. Cash on Delivery (Ramburs)

When customer pays cash to courier:
1. Courier collects: **Order Total** (products + shipping)
2. Courier keeps: Their delivery fee
3. You receive: Rest via bank transfer (every few days)

**Example:**
```
Customer pays courier:     469.99 RON
FAN Courier keeps:        ~25.00 RON (their fee)
You receive:              444.99 RON
```

---

## 📊 Quick Reference

### Shipping Prices

| Payment Method | Shipping Cost | Notes |
|----------------|---------------|-------|
| Card / Bank Transfer | 19.99 RON | Online payment |
| Ramburs (COD) | 24.99 RON | Cash on delivery |
| Any method (order > 199 RON) | FREE | Threshold configurable |

### Order Statuses

| Status | Meaning |
|--------|---------|
| Processing | Order received, preparing to ship |
| ⚠️ Shipping Review | Needs your attention (remote locality, etc.) |
| Shipped | Package sent, has AWB number |
| Delivered | Customer received package |
| Completed | Order finished |

### Important Files

| File | What It Does |
|------|--------------|
| `/shipping` | Shipping policy page for customers |
| `/admin/settings` → Shipping | Configure prices |
| `/admin/orders` | Manage orders & create AWBs |

### Environment Variables

| Variable | What It Is |
|----------|------------|
| `FANCOURIER_CLIENT_ID` | Your FAN Courier account ID |
| `FANCOURIER_USERNAME` | Your login username |
| `FANCOURIER_PASSWORD` | Your login password |
| `FANCOURIER_SENDER_*` | Your business address |

---

## 🎯 Summary: The Complete Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    THE COMPLETE SHIPPING JOURNEY                  │
└──────────────────────────────────────────────────────────────────┘

CUSTOMER                          ADMIN                    FAN COURIER
────────                          ─────                    ───────────
   │                                │                           │
   │  1. Places Order               │                           │
   │  ─────────────────►           │                           │
   │                                │                           │
   │                         2. Sees new order                  │
   │                                │                           │
   │                         3. Packs products                  │
   │                                │                           │
   │                         4. Creates AWB ─────────────►      │
   │                                │          (API call)       │
   │                                │                           │
   │                                │ ◄─────────────────────    │
   │                                │     Returns AWB #         │
   │                                │                           │
   │                         5. Prints label                    │
   │                                │                           │
   │                         6. Schedules pickup ──────────►    │
   │                                │                           │
   │                                │                    7. Picks up
   │                                │                           │
   │ ◄──────────────────────────────────────────────────────    │
   │              8. Delivers to customer                       │
   │                                                            │
   │  9. Signs/Pays                                             │
   │                                                            │
   │                                │ ◄─────────────────────    │
   │                                │   10. Confirmation        │
   │                                │                           │
   │                         11. Order → Delivered              │
   └──────────────────────────────────────────────────────────────
```

---

## ❓ Frequently Asked Questions

**Q: What if I don't have FAN Courier credentials?**
A: The system will work for Sameday courier. FAN Courier features require credentials.

**Q: Can I use both Sameday and FAN Courier?**
A: Yes! Create AWB with whichever courier you prefer per order.

**Q: What happens if customer refuses delivery?**
A: Package returns to you. No extra code needed - FAN Courier handles returns.

**Q: How do I track a package?**
A: Use the AWB number on FAN Courier's website or app.

---

*Last updated: January 2026*
