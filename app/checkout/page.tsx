import { redirect } from "next/navigation";
import React from "react";

import { auth } from "@/lib/auth";

import { CheckoutContent } from "./CheckoutContent";

export default async function CheckoutPage() {
  // Require authentication for checkout
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/checkout");
  }

  return <CheckoutContent />;
}
