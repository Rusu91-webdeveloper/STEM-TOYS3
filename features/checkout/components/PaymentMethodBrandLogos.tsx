"use client";

import NTPLogo from "ntp-logo-react";
import Image from "next/image";

/**
 * Compact Stripe wordmark for the checkout payment row (boxed logo style).
 */
export function StripePaymentRowLogo() {
  return (
    <div className="flex h-full w-full min-w-[5.5rem] max-w-[6.75rem] items-center justify-center px-2">
      <Image
        src="/images/checkout/stripe-wordmark.svg"
        alt=""
        width={88}
        height={28}
        className="h-5 w-auto max-h-6 object-contain"
      />
    </div>
  );
}

/**
 * Compact Netopia Payments logo for the checkout payment row (boxed logo style).
 */
export function NetopiaPaymentRowLogo() {
  return (
    <div className="flex h-full w-full max-w-[6.75rem] items-center justify-center px-1.5">
      <div className="max-h-8 w-full max-w-[6.5rem] overflow-hidden [&_img]:h-7 [&_img]:w-auto [&_img]:max-w-full [&_img]:object-contain [&_img]:object-left">
        <NTPLogo
          color="#ffffff"
          version="horizontal"
          secret="156180"
          aria-hidden
        />
      </div>
    </div>
  );
}
