import { isVisibleOnProductsListing } from "@/lib/products/catalog-access";
import { productPublicPath } from "@/lib/products/public-slug";
import type { Product } from "@/types/product";

import {
  merchantShippingRate,
  type MerchantShippingSettings,
} from "./merchant-policy";
import { validGtin } from "./product-identifiers";

function xml(value: unknown): string {
  return String(value)
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(
      /[&<>"']/g,
      char =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&apos;",
        })[char]!
    );
}
const element = (name: string, value: unknown) =>
  `<g:${name}>${xml(value)}</g:${name}>`;

/** Same editorial/availability gate as the storefront; no fabricated identifiers or ratings. */
export function buildMerchantFeed(
  products: Product[],
  shipping: MerchantShippingSettings
): string {
  const items = products
    .filter(
      product =>
        isVisibleOnProductsListing(product) &&
        !product.isBook &&
        Number.isFinite(product.price) &&
        product.price > 0 &&
        product.images[0]
    )
    .map(product => {
      const guide = product.buyingGuide;
      const description = guide
        ? `${guide.summary} ${guide.contents} ${guide.preparation}`
        : product.description
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
      const brand = guide?.brand ?? product.attributes?.brand;
      const gtin = validGtin(product.barcode);
      const rate = product.isBundle
        ? null
        : merchantShippingRate(product.price, shipping);
      const image = (url: string) =>
        url.startsWith("/") ? `https://www.techtots.ro${url}` : url;
      return `<item>${[
        element("id", product.id),
        element("title", product.name.slice(0, 150)),
        element("description", description.slice(0, 5000)),
        element(
          "link",
          `https://www.techtots.ro${productPublicPath(product.slug)}`
        ),
        element("image_link", image(product.images[0])),
        ...product.images
          .slice(1, 11)
          .map(url => element("additional_image_link", image(url))),
        element("availability", "in_stock"),
        element("condition", "new"),
        element("price", `${product.price.toFixed(2)} RON`),
        ...(typeof brand === "string" && brand.trim()
          ? [element("brand", brand)]
          : []),
        ...(gtin ? [element("gtin", gtin)] : []),
        ...(rate !== null
          ? [
              `<g:shipping>${element("country", "RO")}${element("price", `${rate.toFixed(2)} RON`)}</g:shipping>`,
            ]
          : []),
      ].join("")}</item>`;
    });
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>TechTots — catalog de produse</title><link>https://www.techtots.ro/products</link><description>Jucării STEM disponibile în România</description>${items.join("")}</channel></rss>`;
}
