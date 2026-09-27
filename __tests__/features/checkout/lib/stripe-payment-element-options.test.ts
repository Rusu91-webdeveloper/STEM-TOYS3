import {
  COD_GUARANTEE_STRIPE_COUNTRY,
  COD_GUARANTEE_STRIPE_LOCALE,
} from "@/features/checkout/lib/cod-guarantee-element";
import { buildStripePaymentElementOptions } from "@/features/checkout/lib/stripe-payment-element-options";

describe("Stripe Payment Element defaults", () => {
  it("leaves the card checkout element on Stripe's own country default", () => {
    const options = buildStripePaymentElementOptions();
    expect(options.defaultValues).toBeUndefined();
  });

  it("defaults the guarantee element country to Romania", () => {
    const options = buildStripePaymentElementOptions(
      COD_GUARANTEE_STRIPE_COUNTRY
    );
    expect(options.defaultValues?.billingDetails?.address?.country).toBe("RO");
    expect(COD_GUARANTEE_STRIPE_LOCALE).toBe("ro");
  });
});
