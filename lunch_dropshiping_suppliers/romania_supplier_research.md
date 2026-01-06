# Refined Supplier Research for Romanian STEM Toy Market

## 1. Boribon (Romania)
- **Best for:** Premium educational and STEM toys.
- **Shipping:** RO warehouse. Same-day shipping for orders before 15:00.
- **Integration:** XML/CSV feeds (categories, descriptions, images, stock, SKU, EAN).
- **COD Handling:** Requires merchant to provide their own AWB (courier label). Merchant handles COD collection via their courier contract (e.g., Fan Courier, Sameday).
- **VAT:** Romanian company, B2B ready, standard RO VAT.
- **Returns:** Returns accepted at their warehouse, processed monthly with a credit note (factura storno).

## 2. Viva Toys (Romania)
- **Best for:** Large variety (5k+ products), major brands (LEGO, Mattel, Hasbro).
- **Shipping:** RO warehouse.
- **Integration:** Dropshipping platform with feed support.
- **COD Handling:** Likely similar to Boribon (merchant AWB) or internal system.
- **VAT:** Romanian company, B2B ready.
- **Returns:** Standard RO B2B terms.

## 3. Kidstory (Romania)
- **Best for:** Unique imported brands, specialized STEM toys.
- **Shipping:** RO warehouse.
- **Integration:** B2B platform with dropshipping support.
- **COD Handling:** Direct through platform or merchant AWB.
- **VAT:** Romanian company.

## 4. BigBuy (Spain/EU)
- **Best for:** Massive catalog, technical excellence (API).
- **Shipping:** Spain warehouse. 3-5 days to Romania.
- **Integration:** RESTful JSON API, XML/CSV feeds.
- **COD Handling:** Does NOT support COD for international shipments directly. Merchant must use a local fulfillment center or a courier that handles "cross-border COD" (e.g., Eurosender, specialized CEE couriers).
- **VAT:** EU VAT (VIES registered). B2B invoices without VAT for RO companies with VIES.
- **Returns:** 14-day window, but shipping back to Spain can be costly.

## 5. LeanToys (Poland/EU)
- **Best for:** Specialized toy selection, proximity to Romania.
- **Shipping:** Poland warehouse. 2-4 days to Romania.
- **Integration:** XML/CSV feeds (IOF format).
- **COD Handling:** Merchant AWB recommended for RO COD.
- **VAT:** EU VAT.
- **Returns:** Merchant handles returns; LeanToys does not accept consumer returns directly.

## COD Management in Romania
- **The Reality:** >60% of RO e-commerce is COD.
- **Strategy:** Merchant must sign a contract with a local courier (Fan Courier, Sameday, DPD).
- **Workflow:** 
  1. Customer orders COD on Next.js store.
  2. Merchant generates AWB via courier API (Fan/Sameday).
  3. Merchant sends AWB PDF to supplier (Boribon/LeanToys).
  4. Supplier prints AWB, packs, and hands over to courier.
  5. Courier collects cash, remits to Merchant's bank account.
