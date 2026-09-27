import type { StripePaymentElementOptions } from "@stripe/stripe-js";

/** Card checkout omits a country so Stripe's default stays unchanged. */
export function buildStripePaymentElementOptions(
  defaultBillingCountry?: string
): StripePaymentElementOptions {
  return {
    layout: {
      type: "tabs",
      defaultCollapsed: false,
    },
    wallets: {
      applePay: "auto",
      googlePay: "auto",
    },
    business: {
      name: "STEM Toys",
    },
    ...(defaultBillingCountry
      ? {
          defaultValues: {
            billingDetails: {
              address: {
                country: defaultBillingCountry,
              },
            },
          },
        }
      : {}),
  };
}
