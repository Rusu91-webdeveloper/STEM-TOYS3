import {
  merchantOfferPolicies,
  merchantShippingRate,
} from "@/lib/seo/merchant-policy";
import { generateEducationalProductSchema } from "@/lib/seo/advanced-schema";
import type { Product } from "@/types/product";
const settings = {
  deliveryPrice: { active: true, price: "19.99" },
  freeThreshold: { active: true, price: "500" },
  onlinePaymentPrice: "24.99",
};
it("uses checkout delivery pricing and free-shipping threshold", () => {
  expect(merchantShippingRate(100, settings)).toBe(19.99);
  expect(merchantShippingRate(500, settings)).toBe(0);
  expect(
    merchantShippingRate(770, {
      ...settings,
      freeThreshold: { active: false, price: "500" },
    })
  ).toBe(19.99);
});
it("honors service overrides and rejects unknown rates", () => {
  const couriers = [
    {
      id: "fan",
      name: "Fan",
      enabled: true,
      services: [
        {
          id: "standard",
          name: "Standard",
          description: "",
          estimatedDelivery: "",
          methodType: "home" as const,
          priceOverride: "12.50",
        },
      ],
    },
  ];
  expect(merchantShippingRate(100, { ...settings, couriers })).toBe(12.5);
  expect(
    merchantShippingRate(100, {
      deliveryPrice: { active: false, price: "19.99" },
    })
  ).toBeNull();
  expect(
    merchantShippingRate(100, { deliveryPrice: { active: true, price: "NaN" } })
  ).toBeNull();
});
it("publishes the actual 14-day customer-paid return policy", () => {
  const policy = merchantOfferPolicies(100, settings);
  expect(policy.hasMerchantReturnPolicy).toMatchObject({
    merchantReturnDays: 14,
    returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
    applicableCountry: "RO",
  });
  expect(policy.shippingDetails?.shippingRate.value).toBe(19.99);
  expect(policy.hasMerchantReturnPolicy).not.toHaveProperty(
    "returnShippingFeesAmount"
  );
});
it("includes policies and description on product offers", () => {
  const schema = generateEducationalProductSchema(
    {
      id: "p",
      slug: "p",
      name: "Toy",
      description: "Supplier description",
      images: [],
      price: 100,
      stockQuantity: 1,
      tags: [],
    } as unknown as Product,
    settings
  );
  expect(schema.description).toBe("Supplier description");
  expect(schema.offers).toMatchObject({
    shippingDetails: { shippingDestination: { addressCountry: "RO" } },
    hasMerchantReturnPolicy: { merchantReturnDays: 14 },
  });
});
