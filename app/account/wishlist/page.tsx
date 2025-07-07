import React from "react";

import { Wishlist } from "@/features/account/components/Wishlist";
import { getWishlistItems } from "@/lib/wishlist";
import { auth } from "@/lib/auth";

export default async function WishlistPage() {
  const session = await auth();

  if (!session?.user) {
    // This should never happen since layout handles auth check
    return null;
  }

  const wishlistItems = await getWishlistItems();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">My Wishlist</h2>
        <p className="text-sm text-muted-foreground">
          View and manage your saved products
        </p>
      </div>
      <Wishlist initialItems={wishlistItems} />
    </div>
  );
}
