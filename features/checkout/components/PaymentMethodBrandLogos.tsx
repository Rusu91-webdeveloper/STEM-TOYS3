"use client";

import Image from "next/image";

/**
 * Compact Stripe wordmark for the checkout payment row (boxed logo style).
 */
export function StripePaymentRowLogo() {
  return (
    <div className="flex h-full w-full min-w-[4.75rem] max-w-[5.75rem] items-center justify-center px-1.5">
      <Image
        src="/images/checkout/stripe-wordmark.svg"
        alt=""
        width={80}
        height={22}
        className="h-[1.15rem] w-auto max-h-5 object-contain object-left sm:h-5"
      />
    </div>
  );
}

/**
 * Netopia Payments wordmark — uses a vendored SVG so checkout works when
 * external CDNs (mny.ro) are blocked by CSP or network policies.
 */
export function NetopiaPaymentRowLogo() {
  return (
    <div className="flex h-full w-full min-w-[4.75rem] max-w-[6rem] items-center justify-center px-1">
      <Image
        src="/images/checkout/netopia-wordmark.svg"
        alt=""
        width={120}
        height={22}
        className="h-[1.1rem] w-auto max-h-5 max-w-[5.85rem] object-contain object-left sm:h-5"
      />
    </div>
  );
}
