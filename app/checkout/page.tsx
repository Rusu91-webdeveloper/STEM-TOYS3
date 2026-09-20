import React from "react";

import { auth } from "@/lib/auth";

import { CheckoutContent } from "./CheckoutContent";

export default async function CheckoutPage() {
  // Allow guest checkout - authentication is optional
  // Guest users can complete COD orders without creating an account
  const session = await auth();

  return <CheckoutContent session={session} />;
}
