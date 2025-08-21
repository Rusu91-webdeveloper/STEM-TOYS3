import React from "react";

import { Wishlist } from "@/features/account/components/Wishlist";
import { auth } from "@/lib/server/auth";
import { getWishlistItems } from "@/lib/server/wishlist";

export default async function WishlistPage() {
  const session = await auth();

  if (!session?.user) {
    // This should never happen since layout handles auth check
    return null;
  }

  const wishlistItems = await getWishlistItems();

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              My Wishlist
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {wishlistItems.length}{" "}
              {wishlistItems.length === 1 ? "item" : "items"} saved
            </p>
          </div>
          {wishlistItems.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {wishlistItems.length}{" "}
              {wishlistItems.length === 1 ? "product" : "products"}
            </div>
          )}
        </div>
      </div>
      <Wishlist initialItems={wishlistItems} />
    </div>
  );
}
