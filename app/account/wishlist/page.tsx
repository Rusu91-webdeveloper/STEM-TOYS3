import React from "react";
import { auth } from "@/lib/auth";
import { Wishlist } from "@/features/account/components/Wishlist";

export const metadata = {
  title: "Wishlist | My Account",
  description: "View and manage your saved products",
};

export default async function WishlistPage() {
  const session = await auth();

  if (!session?.user) {
    // This should never happen since layout handles auth check
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">My Wishlist</h2>
        <p className="text-sm text-muted-foreground">
          View and manage your saved products
        </p>
      </div>
      <Wishlist />
    </div>
  );
}
