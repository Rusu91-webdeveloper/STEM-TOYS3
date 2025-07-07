import { Metadata } from "next";
import React from "react";

import { GuestOrderTracking } from "@/features/checkout/components/GuestOrderTracking";

export const metadata: Metadata = {
  title: "Track Your Order | TechTots",
  description: "Track your guest order using your email and order number",
};

export default function GuestOrdersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Track Your Order
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Enter your email address and order number to view your order status
          and tracking information.
        </p>
        <GuestOrderTracking />
      </div>
    </div>
  );
}
