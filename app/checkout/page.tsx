import React from "react";
import { Metadata } from "next";
import { CheckoutContent } from "./CheckoutContent";

export const metadata: Metadata = {
  title: "Checkout | NextCommerce",
  description: "Complete your purchase",
};

export default function CheckoutPage() {
  return <CheckoutContent />;
}
